import { Request, Response, NextFunction } from 'express';
import { UserService } from '../services/user.service';

export async function ensureAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }
    const current = await UserService.findById(userId);
    const role = (current as any)?.role_code || 'user';
    if (role !== 'admin') {
      res.status(403).json({ success: false, message: 'Admin only' });
      return;
    }
    next();
  } catch (err) {
    res.status(500).json({ success: false, message: 'Permission check failed' });
  }
}
