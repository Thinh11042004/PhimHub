import nodemailer from 'nodemailer';
import { v4 as uuidv4 } from 'uuid';

// In-memory storage for reset tokens (in production, use database)
const resetTokens: Map<string, { email: string; expires: Date }> = new Map();

export class EmailService {
  private static transporter = nodemailer.createTransport({
    // For development, use ethereal email (fake SMTP)
    host: 'smtp.ethereal.email',
    port: 587,
    auth: {
      user: 'ethereal.user@ethereal.email',
      pass: 'ethereal.pass'
    }
  });

  static async sendPasswordResetEmail(email: string): Promise<string> {
    // Generate reset token
    const resetToken = uuidv4();
    const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Store token
    resetTokens.set(resetToken, { email, expires });

    // Create reset URL
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    // Email content
    const mailOptions = {
      from: '"PhimHub" <noreply@phimhub.com>',
      to: email,
      subject: 'Đặt lại mật khẩu - PhimHub',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #155E75;">Đặt lại mật khẩu PhimHub</h2>
          <p>Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản PhimHub của mình.</p>
          <p>Nhấp vào liên kết bên dưới để đặt lại mật khẩu:</p>
          <a href="${resetUrl}" style="background-color: #155E75; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; margin: 16px 0;">
            Đặt lại mật khẩu
          </a>
          <p style="color: #666; font-size: 14px;">
            Liên kết này sẽ hết hạn sau 15 phút.<br>
            Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.
          </p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">
          <p style="color: #999; font-size: 12px;">
            Email này được gửi từ PhimHub. Vui lòng không trả lời email này.
          </p>
        </div>
      `
    };

    try {
      // In development, just log the reset URL
      if (process.env.NODE_ENV === 'development') {
        console.log('🔗 Password Reset URL:', resetUrl);
        console.log('📧 Reset email would be sent to:', email);
        return resetToken;
      }

      // In production, send actual email
      await this.transporter.sendMail(mailOptions);
      console.log('Password reset email sent to:', email);
      return resetToken;
    } catch (error) {
      console.error('Error sending password reset email:', error);
      throw new Error('Không thể gửi email đặt lại mật khẩu');
    }
  }

  static validateResetToken(token: string): string | null {
    const tokenData = resetTokens.get(token);
    
    if (!tokenData) {
      return null; // Token not found
    }

    if (new Date() > tokenData.expires) {
      resetTokens.delete(token); // Clean up expired token
      return null; // Token expired
    }

    return tokenData.email;
  }

  static consumeResetToken(token: string): string | null {
    const email = this.validateResetToken(token);
    if (email) {
      resetTokens.delete(token); // Remove token after use
    }
    return email;
  }

  // Clean up expired tokens periodically
  static cleanupExpiredTokens() {
    const now = new Date();
    for (const [token, data] of resetTokens.entries()) {
      if (now > data.expires) {
        resetTokens.delete(token);
      }
    }
  }
}

// Clean up expired tokens every hour
setInterval(() => {
  EmailService.cleanupExpiredTokens();
}, 60 * 60 * 1000);