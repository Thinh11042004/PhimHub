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
    const token = localStorage.getItem("phimhub:token");
    if (!raw || !token) {
      // Invalidate stale user without token
      localStorage.removeItem("phimhub:user");
      if (!token) localStorage.removeItem("phimhub:token");
      return;
    }
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
    if (!cur) return;
    
    try {
      // Call API to upload avatar
      const response = await authService.uploadAvatar(file);
      
      // Update local state with response
      const next = { ...cur, ...response.user };
      localStorage.setItem("phimhub:user", JSON.stringify(next));
      set({ user: next });
    } catch (error) {
      throw error;
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
      // If refresh fails, logout user
      localStorage.removeItem("phimhub:user");
      localStorage.removeItem("phimhub:token");
      set({ user: null });
    }
  },
}));
