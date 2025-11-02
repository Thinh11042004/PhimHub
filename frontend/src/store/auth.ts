// src/store/auth.ts
import { create } from "zustand";
import { authService } from "../features/auth/services";

export type Role = "admin" | "user";
export type User = {
  id: string;
  email: string;
  username: string;
  fullname?: string;
  phone?: string;
  avatar?: string;
  role: Role;
};

type AuthState = {
  user: User | null;
  login: (identifier: string, password: string) => Promise<User>; // email hoặc username
  logout: () => void;
  hydrate: () => void;
  updateProfile: (patch: Partial<User>) => Promise<void>;
  uploadAvatar: (file: File) => Promise<void>;
  setUser: (user: User) => void;
  refreshUser: () => Promise<void>;
};

// Mock users: có cả email và username riêng
const MOCK_USERS: Array<User & { password: string }> = [
  {
    id: "1",
    email: "user@example.com",
    username: "user",
    password: "123456",
    role: "user",
    avatar: "",
  },
  {
    id: "2",
    email: "admin@example.com",
    username: "admin",
    password: "123456",
    role: "admin",
    avatar: "",
  },
];

export const useAuth = create<AuthState>((set, get) => ({
  user: null,

  hydrate: () => {
    const raw = localStorage.getItem("phimhub:user");
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as User;
      set({ user: parsed });
    } catch {
      // corrupted -> clear
      localStorage.removeItem("phimhub:user");
    }
  },

  // Cho phép nhập email hoặc username (identifier)
  login: async (identifier, password) => {
    try {
      const response = await authService.login({ identifier, password });
      
      // Store token if provided
      if (response.token) {
        localStorage.setItem("phimhub:token", response.token);
      }
      
      // Store user data
      localStorage.setItem("phimhub:user", JSON.stringify(response.user));
      set({ user: response.user });
      
      return response.user;
    } catch (error: any) {
      throw error;
    }
  },

  logout: async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.warn("Logout API failed, but continuing with local logout");
    } finally {
      localStorage.removeItem("phimhub:user");
      localStorage.removeItem("phimhub:token");
      set({ user: null });
    }
  },

  updateProfile: async (patch) => {
    const cur = get().user;
    if (!cur) return;
    
    try {
      // Call API to update profile
      const response = await authService.updateProfile(patch);
      
      // Update local state with response
      const next = { ...cur, ...response.user };
      localStorage.setItem("phimhub:user", JSON.stringify(next));
      set({ user: next });
    } catch (error) {
      throw error;
    }
  },

  uploadAvatar: async (file) => {
    const cur = get().user;
    if (!cur) {
      throw new Error('Vui lòng đăng nhập để upload avatar');
    }
    
    // Check if token exists
    const token = localStorage.getItem('phimhub:token');
    if (!token) {
      // Clear user data if no token
      localStorage.removeItem('phimhub:user');
      set({ user: null });
      throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại');
    }
    
    try {
      // Call API to upload avatar
      const response = await authService.uploadAvatar(file);
      
      // Check if response has user data
      if (!response || !response.user) {
        console.error('Upload avatar: Response missing user data', response);
        throw new Error('Không nhận được dữ liệu người dùng từ server');
      }
      
      // Update local state with response
      const next = { ...cur, ...response.user };
      localStorage.setItem("phimhub:user", JSON.stringify(next));
      set({ user: next });
      
      // Update token if provided in response (optional, keep existing token if not provided)
      if (response.token && response.token.trim()) {
        localStorage.setItem("phimhub:token", response.token);
      }
      
      return response;
    } catch (error: any) {
      console.error('Upload avatar error:', error);
      
      // Only logout for clear authentication errors
      // Check for explicit auth error messages or status codes
      const isAuthError = (
        error.status === 401 || 
        error.status === 403 ||
        (error.message && (
          error.message.includes('Invalid token format') ||
          error.message.includes('Token has expired') ||
          error.message.includes('Invalid or expired token') ||
          error.message.includes('Unauthorized') ||
          error.message.includes('Access token required')
        ))
      );
      
      if (isAuthError) {
        console.warn('Authentication error during avatar upload, logging out user');
        // Clear invalid token only for real auth errors
        localStorage.removeItem('phimhub:token');
        localStorage.removeItem('phimhub:user');
        set({ user: null });
        throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại');
      }
      
      // For other errors (network, server, file errors), don't logout
      // Just show the error message
      throw new Error(error.message || 'Có lỗi xảy ra khi upload avatar');
    }
  },

  setUser: (user) => {
    localStorage.setItem("phimhub:user", JSON.stringify(user));
    set({ user });
  },

  refreshUser: async () => {
    try {
      const response = await authService.getProfile();
      const next = response.user;
      localStorage.setItem("phimhub:user", JSON.stringify(next));
      set({ user: next });
    } catch (error) {
      console.error("Failed to refresh user:", error);
      // Only logout if it's an authentication error (401/403)
      // Don't logout for network errors or temporary issues
      if (error instanceof Error && (
        error.message.includes('401') || 
        error.message.includes('403') ||
        error.message.includes('Unauthorized') ||
        error.message.includes('Invalid token')
      )) {
        localStorage.removeItem("phimhub:user");
        localStorage.removeItem("phimhub:token");
        set({ user: null });
      }
      // For other errors, just log them but don't logout
    }
  },
}));
