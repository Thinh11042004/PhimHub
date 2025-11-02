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

export const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    console.log('❌ Auth: No token provided for:', req.path);
    res.status(401).json({
      success: false,
      message: 'Access token required'
    });
    return;
  }

  try {
    const secret = process.env.JWT_SECRET || 'phimhub-super-secret-jwt-key-2024';

    const decoded = jwt.verify(token, secret) as any;
    
    // Support both { id } and { userId } payloads
    const id = decoded.userId ?? decoded.id;
    
    if (!id) {
      console.error('❌ Auth: Token decoded but no user ID found');
      res.status(403).json({
        success: false,
        message: 'Invalid token: user ID not found'
      });
      return;
    }
    
    // Get user from database to ensure they still exist
    const user = await UserService.findById(id);
    if (!user) {
      console.error('❌ Auth: User not found for ID:', id);
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

    console.log('✅ Auth: User authenticated:', user.username, 'for:', req.path);
    next();
  } catch (error: any) {
    console.error('❌ Auth: Token verification failed:', error.message);
    console.error('❌ Auth: Token (first 20 chars):', token.substring(0, 20));
    
    let errorMessage = 'Invalid or expired token';
    if (error.name === 'TokenExpiredError') {
      errorMessage = 'Token has expired';
    } else if (error.name === 'JsonWebTokenError') {
      errorMessage = 'Invalid token format';
    }
    
    res.status(403).json({
      success: false,
      message: errorMessage
    });
    return;
  }
};
