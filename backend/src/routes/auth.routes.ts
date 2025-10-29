import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticateToken } from '../middlewares/auth.middleware';
import { uploadAvatar, handleUploadError } from '../middlewares/upload.middleware';

const router = Router();

// POST /api/auth/login
router.post('/login', AuthController.login);

// POST /api/auth/register
router.post('/register', AuthController.register);

// POST /api/auth/logout
router.post('/logout', AuthController.logout);

// GET /api/auth/get-user-email
router.get('/get-user-email', AuthController.getUserEmail);

// POST /api/auth/forgot-password
router.post('/forgot-password', AuthController.forgotPassword);

// POST /api/auth/reset-password
router.post('/reset-password', AuthController.resetPassword);

// POST /api/auth/refresh
router.post('/refresh', AuthController.refreshToken);

// GET /api/auth/profile (require auth middleware)
router.get('/profile', authenticateToken, AuthController.getProfile);

// PUT /api/auth/profile (update profile)
router.put('/profile', authenticateToken, AuthController.updateProfile);

// POST /api/auth/change-password
router.post('/change-password', authenticateToken, AuthController.changePassword);

// POST /api/auth/upload-avatar
router.post('/upload-avatar', authenticateToken, uploadAvatar.single('avatar'), handleUploadError, AuthController.uploadAvatar);

export default router;
