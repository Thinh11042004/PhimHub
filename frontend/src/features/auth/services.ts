// Auth services - wrap API calls and handle data mapping
import { User } from "../../store/auth";

export interface LoginRequest {
  identifier: string; // email or username
  password: string;
}

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token?: string;
}

// Auth services using real API calls
import { authApi } from "./api";

export const authService = {
  async login(data: LoginRequest): Promise<AuthResponse> {
    try {
      return await authApi.login(data);
    } catch (error: any) {
      // Handle API errors
      if (error.status === 401) {
        throw new Error("Email/tên người dùng hoặc mật khẩu không đúng");
      }
      throw new Error(error.response?.message || "Đăng nhập thất bại");
    }
  },

  async register(data: RegisterRequest): Promise<AuthResponse> {
    try {
      console.log("Calling register API with data:", data);
      const response = await authApi.register(data);
      console.log("Register API response:", response);
      return response;
    } catch (error: any) {
      console.error("Register API error:", error);
      // Handle API errors
      if (error.status === 409) {
        throw new Error(error.response?.message || "Email hoặc tên người dùng đã được sử dụng");
      }
      if (error.status === 400) {
        throw new Error(error.response?.message || "Dữ liệu không hợp lệ");
      }
      throw new Error(error.response?.message || error.message || "Đăng ký thất bại");
    }
  },

  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    try {
      return await authApi.refreshToken(refreshToken);
    } catch (error: any) {
      throw new Error("Phiên đăng nhập đã hết hạn");
    }
  },

  async logout(): Promise<void> {
    try {
      await authApi.logout();
    } catch (error) {
      // Even if logout API fails, we should still logout locally
      console.warn("Logout API failed, but continuing with local logout");
    }
  },

  async updateProfile(data: Partial<User>): Promise<AuthResponse> {
    try {
      return await authApi.updateProfile(data);
    } catch (error: any) {
      // Handle API errors
      if (error.status === 409) {
        throw new Error(error.response?.message || "Email hoặc tên người dùng đã được sử dụng");
      }
      if (error.status === 400) {
        throw new Error(error.response?.message || "Dữ liệu không hợp lệ");
      }
      throw new Error(error.response?.message || error.message || "Cập nhật thông tin thất bại");
    }
  },

  async changePassword(data: { currentPassword: string; newPassword: string }): Promise<{ success: boolean; message: string }> {
    try {
      return await authApi.changePassword(data);
    } catch (error: any) {
      if (error.status === 400) {
        throw new Error(error.response?.message || "Mật khẩu hiện tại không đúng");
      }
      throw new Error(error.response?.message || error.message || "Đổi mật khẩu thất bại");
    }
  },

  async uploadAvatar(file: File): Promise<AuthResponse> {
    try {
      return await authApi.uploadAvatar(file);
    } catch (error: any) {
      const errorMessage = error.message || 'Có lỗi xảy ra khi upload avatar';
      throw new Error(errorMessage);
    }
  },

  async getProfile(): Promise<AuthResponse> {
    try {
      return await authApi.getProfile();
    } catch (error: any) {
      throw new Error(error.message || "Không thể lấy thông tin người dùng");
    }
  },

  async getUserEmail(identifier: string): Promise<{ email: string; username: string }> {
    try {
      return await authApi.getUserEmail(identifier);
    } catch (error: any) {
      if (error.status === 404) {
        throw new Error("Không tìm thấy người dùng với thông tin này");
      }
      throw new Error(error.message || "Không thể lấy thông tin email");
    }
  }
};
