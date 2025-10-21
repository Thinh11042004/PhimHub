export interface User {
  id: string;
  email: string;
  username: string;
  password: string;
  role: 'admin' | 'user';
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserResponse {
  id: string;
  email: string;
  username: string;
  fullname?: string;
  phone?: string;
  role: 'admin' | 'user';
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface LoginRequest {
  identifier: string; // email or username
  password: string;
}

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
  fullname?: string;
  phone?: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: UserResponse;
    token: string;
  };
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
}
