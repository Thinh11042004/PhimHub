import { Request, Response } from 'express';
import { UserService } from '../services/user.service';
import { EmailService } from '../services/email.service';
import { generateToken } from '../utils/jwt.util';
import { 
  validateRequest, 
  loginSchema, 
  registerSchema, 
  forgotPasswordSchema, 
  resetPasswordSchema 
} from '../utils/validation.util';
import { 
  User,
  LoginRequest, 
  RegisterRequest, 
  AuthResponse, 
  ApiResponse, 
  ForgotPasswordRequest, 
  ResetPasswordRequest 
} from '../types';
import { UpdateUserRequest } from '../types/database';
import { asyncHandler } from '../middlewares/error.middleware';
import path from 'path';
import fs from 'fs';

export class AuthController {
  static login = asyncHandler(async (req: Request<{}, AuthResponse, LoginRequest>, res: Response<AuthResponse>) => {
    // Validate request data
    const validatedData = validateRequest(loginSchema, req.body);
    const { identifier, password } = validatedData;

    // Find user by email or username
    const user = await UserService.findByEmailOrUsername(identifier);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Email/tên người dùng hoặc mật khẩu không đúng',
        data: {
          user: {} as any,
          token: ''
        }
      });
    }

    // Validate password
    const isValidPassword = await UserService.validatePassword(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Email/tên người dùng hoặc mật khẩu không đúng',
        data: {
          user: {} as any,
          token: ''
        }
      });
    }

    // Generate JWT token
    const userResponse = UserService.toUserResponse(user);
    const token = generateToken(userResponse);

    return res.json({
      success: true,
      message: 'Đăng nhập thành công',
      data: {
        user: userResponse,
        token
      }
    });
  });

  static register = asyncHandler(async (req: Request<{}, AuthResponse, RegisterRequest>, res: Response<AuthResponse>) => {
    // Validate request data
    const validatedData = validateRequest(registerSchema, req.body);
    const { email, username, password } = validatedData;

    try {
      // Create new user
      const newUser = await UserService.create({ email, username, password });
      
      // Generate JWT token
      const userResponse = UserService.toUserResponse(newUser);
      const token = generateToken(userResponse);

      return res.status(201).json({
        success: true,
        message: 'Đăng ký thành công',
        data: {
          user: userResponse,
          token
        }
      });
    } catch (error: any) {
      if (error.message.includes('đã được sử dụng')) {
        return res.status(409).json({
          success: false,
          message: error.message,
          data: {
            user: {} as any,
            token: ''
          }
        });
      }
      throw error;
    }
  });

  static getProfile = asyncHandler(async (req: Request, res: Response<ApiResponse>) => {
    // This would be used with auth middleware to get current user profile
    return res.json({
      success: true,
      message: 'Profile retrieved successfully',
      data: {} // This would be set by auth middleware
    });
  });

  static refreshToken = asyncHandler(async (req: Request, res: Response<AuthResponse>) => {
    // This would handle token refresh logic
    return res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        user: {} as any,
        token: 'new-token'
      }
    });
  });

  static logout = asyncHandler(async (req: Request, res: Response<ApiResponse>) => {
    // In a real app, you might want to blacklist the token
    return res.json({
      success: true,
      message: 'Đăng xuất thành công'
    });
  });

  static updateProfile = asyncHandler(async (req: Request<{}, AuthResponse, UpdateUserRequest>, res: Response<AuthResponse>) => {
    const { email, username, fullname, phone } = req.body;
    
    console.log('🎯 UpdateProfile API called with data:', { email, username, fullname, phone });
    console.log('🎯 User from token:', req.user);
    
    // Get user ID from token (you'll need to implement auth middleware)
    const userId = req.user?.id; // This would come from auth middleware
    if (!userId) {
      console.log('❌ No user ID found in token');
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
        data: { user: {} as any, token: '' }
      });
    }

    try {
      console.log('🚀 Calling UserService.update with:', { userId, email, username, fullname, phone });
      const updatedUser = await UserService.update(userId, { email, username, fullname, phone });
      console.log('✅ UserService.update result:', updatedUser);
      
      if (!updatedUser) {
        console.log('❌ User not found after update');
        return res.status(404).json({
          success: false,
          message: 'User not found',
          data: { user: {} as any, token: '' }
        });
      }

      const userResponse = UserService.toUserResponse(updatedUser);
      console.log('✅ Final user response:', userResponse);
      
      return res.json({
        success: true,
        message: 'Cập nhật thông tin thành công',
        data: { user: userResponse, token: '' }
      });
    } catch (error: any) {
      console.error('❌ UpdateProfile error:', error);
      if (error.message.includes('đã được sử dụng')) {
        return res.status(409).json({
          success: false,
          message: error.message,
          data: { user: {} as any, token: '' }
        });
      }
      throw error;
    }
  });

  static changePassword = asyncHandler(async (req: Request<{}, ApiResponse, { currentPassword: string; newPassword: string }>, res: Response<ApiResponse>) => {
    const { currentPassword, newPassword } = req.body;
    
    // Get user ID from token
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    try {
      // Get current user
      const user = await UserService.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Verify current password
      const isValidPassword = await UserService.validatePassword(currentPassword, user.password_hash);
      if (!isValidPassword) {
        return res.status(400).json({
          success: false,
          message: 'Mật khẩu hiện tại không đúng'
        });
      }

      // Update password
      await UserService.updatePasswordById(userId, newPassword);

      return res.json({
        success: true,
        message: 'Đổi mật khẩu thành công'
      });
    } catch (error: any) {
      throw error;
    }
  });

  static forgotPassword = asyncHandler(async (req: Request<{}, ApiResponse, ForgotPasswordRequest>, res: Response<ApiResponse>) => {
    const validatedData = validateRequest(forgotPasswordSchema, req.body);
    const { email } = validatedData;

    // Check if user exists
    const user = await UserService.findByEmail(email);
    if (!user) {
      // Don't reveal if email exists or not for security
      return res.json({
        success: true,
        message: 'Nếu email tồn tại, chúng tôi đã gửi liên kết đặt lại mật khẩu'
      });
    }

    try {
      await EmailService.sendPasswordResetEmail(email);
      return res.json({
        success: true,
        message: 'Liên kết đặt lại mật khẩu đã được gửi đến email của bạn'
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: 'Không thể gửi email đặt lại mật khẩu',
        error: error.message
      });
    }
  });

  static resetPassword = asyncHandler(async (req: Request<{}, ApiResponse, ResetPasswordRequest>, res: Response<ApiResponse>) => {
    const validatedData = validateRequest(resetPasswordSchema, req.body);
    const { token, password } = validatedData;

    // Validate and consume reset token
    const email = EmailService.consumeResetToken(token);
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Token không hợp lệ hoặc đã hết hạn'
      });
    }

    // Update password
    const success = await UserService.resetPassword(email, password);
    if (!success) {
      return res.status(400).json({
        success: false,
        message: 'Không thể cập nhật mật khẩu'
      });
    }

    return res.json({
      success: true,
      message: 'Mật khẩu đã được đặt lại thành công'
    });
  });

  static uploadAvatar = asyncHandler(async (req: Request, res: Response<AuthResponse>) => {
    // Get user ID from token
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
        data: { user: {} as any, token: '' }
      });
    }

    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded',
        data: { user: {} as any, token: '' }
      });
    }

    try {
      // Get current user to delete old avatar
      const currentUser = await UserService.findById(userId);
      if (!currentUser) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
          data: { user: {} as any, token: '' }
        });
      }

      // Delete old avatar file if exists
      if (currentUser.avatar) {
        const oldAvatarPath = path.join(process.cwd(), 'uploads', 'avatars', path.basename(currentUser.avatar));
        if (fs.existsSync(oldAvatarPath)) {
          fs.unlinkSync(oldAvatarPath);
        }
      }

      // Create avatar URL
      const avatarUrl = `/uploads/avatars/${req.file.filename}`;

      // Update user avatar in database
      const updatedUser = await UserService.update(userId, { avatar: avatarUrl });
      if (!updatedUser) {
        return res.status(500).json({
          success: false,
          message: 'Failed to update avatar',
          data: { user: {} as any, token: '' }
        });
      }

      const userResponse = UserService.toUserResponse(updatedUser);
      return res.json({
        success: true,
        message: 'Avatar uploaded successfully',
        data: { user: userResponse, token: '' }
      });
    } catch (error: any) {
      // Delete uploaded file if database update fails
      if (req.file) {
        const filePath = path.join(process.cwd(), 'uploads', 'avatars', req.file.filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
      throw error;
    }
  });

}
