import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserService } from '../services/user.service';

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        email: string;
        username: string;
      };
    }
  }
}

function verifyWithPossibleSecrets(token: string): any {
  // Support multiple secrets to avoid breaking existing tokens after config changes
  const possibleSecrets = [
    process.env.JWT_SECRET,
    'phimhub-super-secret-jwt-key-2024',   
    'your-super-secret-jwt-key-here',      
  ].filter(Boolean) as string[];

  let lastError: any = null;
  for (const secret of possibleSecrets) {
    try {
      return jwt.verify(token, secret);
    } catch (e) {
      lastError = e;
    }
  }
  throw lastError || new Error('Invalid token');
}

export const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    res.status(401).json({
      success: false,
      message: 'Access token required'
    });
    return;
  }

  try {
    const decoded = verifyWithPossibleSecrets(token) as any;
    
    // Support both { id } and { userId } payloads
    const id = decoded.userId ?? decoded.id;
    
    // Get user from database to ensure they still exist
    const user = await UserService.findById(id);
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'User not found'
      });
      return;
    }

    req.user = {
      id: user.id,
      email: user.email,
      username: user.username
    };

    next();
  } catch (error) {
    res.status(403).json({
      success: false,
      message: 'Invalid or expired token'
    });
    return;
  }
};
