import nodemailer from 'nodemailer';
import { v4 as uuidv4 } from 'uuid';

// In-memory storage for reset tokens (in production, use database)
const resetTokens: Map<string, { email: string; expires: Date }> = new Map();

export class EmailService {
  private static getTransporter() {
    const host = process.env.EMAIL_HOST;
    const port = parseInt(process.env.EMAIL_PORT || '587');
    const user = process.env.EMAIL_USER;
    const pass = process.env.EMAIL_PASS;

    if (!host || !user || !pass) {
      return null;
    }

    // For Gmail and most providers, use TLS on port 587, SSL on port 465
    const isSecure = port === 465;

    // Create transporter with proper configuration
    const transporter = nodemailer.createTransport({
      host: host,
      port: port,
      secure: isSecure, // true for 465, false for other ports (587 uses TLS)
      auth: {
        user: user.trim(), // Remove whitespace
        pass: pass.trim()  // Remove whitespace
      },
      tls: {
        // Do not fail on invalid certificates (useful for self-signed certs in dev)
        rejectUnauthorized: process.env.NODE_ENV === 'production',
        // Allow legacy TLS versions for compatibility
        minVersion: 'TLSv1'
      },
      // Connection timeout
      connectionTimeout: 10000, // 10 seconds
      greetingTimeout: 10000,
      socketTimeout: 10000
    });

    return transporter;
  }

  // Verify SMTP connection
  static async verifyConnection(): Promise<boolean> {
    const transporter = this.getTransporter();
    if (!transporter) {
      return false;
    }

    try {
      await transporter.verify();
      return true;
    } catch (error) {
      console.error('❌ SMTP connection verification failed:', error);
      return false;
    }
  }

  static async sendPasswordResetEmail(email: string): Promise<string> {
    // Generate reset token
    const resetToken = uuidv4();
    const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Store token
    resetTokens.set(resetToken, { email, expires });

    // Create reset URL
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    // Email content
    const fromEmail = process.env.EMAIL_FROM || '"PhimHub" <noreply@phimhub.com>';
    const mailOptions = {
      from: fromEmail,
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
      // Check if email is configured
      const transporter = this.getTransporter();
      
      if (!transporter) {
        // If no email config, log the reset URL for development
        console.log('⚠️  Email not configured. Password reset URL:', resetUrl);
        console.log('📧 Would send reset email to:', email);
        console.log('💡 To enable email, set EMAIL_HOST, EMAIL_USER, and EMAIL_PASS in .env file');
        return resetToken;
      }

      // Log email configuration (without sensitive data)
      const host = process.env.EMAIL_HOST;
      const user = process.env.EMAIL_USER;
      const port = process.env.EMAIL_PORT || '587';
      console.log('📧 Attempting to send email via:', `${user}@${host}:${port}`);

      // Verify connection before sending (optional check)
      try {
        await transporter.verify();
        console.log('✅ SMTP server connection verified');
      } catch (verifyError: any) {
        console.warn('⚠️  SMTP verification failed, but attempting to send anyway:', verifyError.message);
        console.warn('⚠️  Verification error code:', verifyError.code);
        if (verifyError.response) {
          console.warn('⚠️  SMTP response:', verifyError.response);
        }
      }

      // Send actual email
      const info = await transporter.sendMail(mailOptions);
      
      console.log('✅ Password reset email sent successfully!');
      console.log('   📧 To:', email);
      console.log('   🔗 Reset URL:', resetUrl);
      if (info.messageId) {
        console.log('   📬 Message ID:', info.messageId);
      }
      
      return resetToken;
    } catch (error: any) {
      console.error('❌ Error sending password reset email:', error);
      console.error('❌ Error code:', error.code);
      console.error('❌ Error response code:', error.responseCode);
      console.error('❌ Error command:', error.command);
      console.error('❌ Full error:', JSON.stringify(error, null, 2));
      
      // Provide helpful error messages
      let errorMessage = 'Không thể gửi email đặt lại mật khẩu';
      
      if (error.code === 'EAUTH') {
        errorMessage = 'Lỗi xác thực email. Vui lòng kiểm tra EMAIL_USER và EMAIL_PASS trong file .env. Với Gmail, bạn cần sử dụng App Password thay vì mật khẩu thường.';
      } else if (error.code === 'ECONNECTION' || error.code === 'ETIMEDOUT') {
        errorMessage = `Không thể kết nối đến máy chủ email tại ${process.env.EMAIL_HOST}:${process.env.EMAIL_PORT || '587'}. Vui lòng kiểm tra EMAIL_HOST và EMAIL_PORT`;
      } else if (error.responseCode === 535 || error.responseCode === 534) {
        errorMessage = 'Xác thực thất bại. Với Gmail, bạn cần sử dụng App Password (không phải mật khẩu tài khoản). Kiểm tra EMAIL_USER và EMAIL_PASS trong file .env';
      } else if (error.command === 'AUTH PLAIN' || error.command === 'AUTH LOGIN') {
        errorMessage = 'Lỗi xác thực email. Kiểm tra EMAIL_USER và EMAIL_PASS trong file .env. Với Gmail, dùng App Password.';
      } else {
        errorMessage = `Không thể gửi email: ${error.message || error.code || 'Unknown error'}`;
      }
      
      // Log reset URL as fallback even if email fails (for development)
      if (process.env.NODE_ENV === 'development') {
        console.log('🔗 Fallback - Password Reset URL (in case email failed):', resetUrl);
        console.log('📝 Error details for debugging:', {
          code: error.code,
          responseCode: error.responseCode,
          command: error.command,
          message: error.message,
          host: process.env.EMAIL_HOST,
          port: process.env.EMAIL_PORT || '587',
          user: process.env.EMAIL_USER ? `${process.env.EMAIL_USER.substring(0, 3)}***` : 'not set'
        });
      }
      
      throw new Error(errorMessage);
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