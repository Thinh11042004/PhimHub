// Raw API calls for authentication
import { LoginRequest, RegisterRequest, AuthResponse } from "./services";

// Base API endpoints
const API_BASE_URL = 'http://localhost:3001/api';

// Simple fetch wrapper
async function apiCall<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  // Get token from localStorage
  const token = localStorage.getItem('phimhub:token');
  console.log('Token from localStorage:', token ? 'Found' : 'Not found');
  
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  console.log('Making API call to:', url, 'with config:', config);

  try {
    const response = await fetch(url, config);
    console.log('API response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API error response:', errorText);
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log('API response data:', data);
    return data;
  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
}

// Raw API functions - making actual HTTP calls to backend
export const authApi = {
  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await apiCall<{
      success: boolean;
      message: string;
      data: {
        user: any;
        token: string;
      };
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    
    return {
      user: response.data.user,
      token: response.data.token
    };
  },

  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await apiCall<{
      success: boolean;
      message: string;
      data: {
        user: any;
        token: string;
      };
    }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    
    return {
      user: response.data.user,
      token: response.data.token
    };
  },

  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    const response = await apiCall<{
      success: boolean;
      message: string;
      data: {
        user: any;
        token: string;
      };
    }>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
    
    return {
      user: response.data.user,
      token: response.data.token
    };
  },

  async logout(): Promise<void> {
    await apiCall('/auth/logout', {
      method: 'POST',
    });
  },

  async forgotPassword(email: string): Promise<{ success: boolean; message: string }> {
    return await apiCall('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  async resetPassword(token: string, password: string): Promise<{ success: boolean; message: string }> {
    return await apiCall('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
    });
  },

  async updateProfile(data: any): Promise<AuthResponse> {
    const response = await apiCall<{
      success: boolean;
      message: string;
      data: {
        user: any;
        token: string;
      };
    }>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    
    return {
      user: response.data.user,
      token: response.data.token
    };
  },

  async changePassword(data: { currentPassword: string; newPassword: string }): Promise<{ success: boolean; message: string }> {
    return await apiCall('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async uploadAvatar(file: File): Promise<AuthResponse> {
    const formData = new FormData();
    formData.append('avatar', file);

    const token = localStorage.getItem('phimhub:token');
    
    const response = await fetch(`${API_BASE_URL}/auth/upload-avatar`, {
      method: 'POST',
      headers: {
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    return {
      user: data.data.user,
      token: data.data.token
    };
  },

  async getProfile(): Promise<AuthResponse> {
    const response = await apiCall<{
      success: boolean;
      message: string;
      data: {
        user: any;
        token: string;
      };
    }>('/auth/profile', {
      method: 'GET',
    });
    
    return {
      user: response.data.user,
      token: response.data.token
    };
  },

  async getUserEmail(identifier: string): Promise<{ email: string; username: string }> {
    const response = await apiCall<{
      success: boolean;
      message: string;
      data: {
        email: string;
        username: string;
      };
    }>(`/auth/get-user-email?identifier=${encodeURIComponent(identifier)}`, {
      method: 'GET',
    });
    
    return response.data;
  }
};
