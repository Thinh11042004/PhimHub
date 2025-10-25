// Custom hooks for authentication
import { useState } from "react";
import { useAuth } from "../../store/auth";
import { authService, LoginRequest, RegisterRequest } from "./services";

export function useLogin() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login: authLogin } = useAuth();

  const login = async (identifier: string, password: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Use the existing auth store login method
      const user = await authLogin(identifier, password);
      return user;
    } catch (err: any) {
      const errorMessage = err.message || "Đăng nhập thất bại";
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    login,
    isLoading,
    error,
    clearError: () => setError(null)
  };
}

export function useRegister() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const register = async (data: RegisterRequest) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await authService.register(data);
      return response;
    } catch (err: any) {
      const errorMessage = err.message || "Đăng ký thất bại";
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    register,
    isLoading,
    error,
    clearError: () => setError(null)
  };
}

export function useLogout() {
  const [isLoading, setIsLoading] = useState(false);
  const { logout: authLogout } = useAuth();

  const logout = async () => {
    setIsLoading(true);
    try {
      await authService.logout();
      authLogout();
    } catch (err) {
      // Even if API call fails, we should still logout locally
      authLogout();
    } finally {
      setIsLoading(false);
    }
  };

  return {
    logout,
    isLoading
  };
}
