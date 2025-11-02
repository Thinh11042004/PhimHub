import axios from 'axios';
import { API_BASE_URL } from '../config';
import { getAuthToken } from '../utils/auth';

// Configure axios to suppress 403/401 errors for favorites endpoint
// These are handled gracefully and don't need to show in console
const favoritesAxios = axios.create({
  baseURL: API_BASE_URL,
  validateStatus: (status) => {
    // Don't throw error for 403/401 on favorites - we handle them gracefully
    return status < 500; // Only throw for server errors (500+)
  }
});

// Add response interceptor to suppress console errors for 403/401
favoritesAxios.interceptors.response.use(
  (response) => response,
  (error) => {
    // Don't log 403/401 errors to console - they're handled gracefully
    if (error.response?.status === 403 || error.response?.status === 401) {
      // Suppress console error but still reject promise so catch block can handle it
      error.suppressLog = true;
    }
    return Promise.reject(error);
  }
);

export interface FavoriteItem {
  id: string;
  type: 'movie' | 'series';
  title: string;
  year?: number;
  poster: string;
  genres?: any[];
  duration?: number;
  rating?: number;
  age?: string;
  episodes?: number;
  provider?: string;
  overview?: string;
  added_at?: string;
}

export interface AddFavoriteRequest {
  movieId: string;
  movieType: 'movie' | 'series';
  provider?: string;
}

class FavoritesApi {
  private getAuthHeaders() {
    const token = getAuthToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  async getFavorites(): Promise<FavoriteItem[]> {
    try {
      const response = await favoritesAxios.get('/favorites', {
        headers: this.getAuthHeaders(),
      });
      
      // Check if response is successful
      if (response.status >= 200 && response.status < 300) {
        // Check response structure
        if (response.data && response.data.success && response.data.data && Array.isArray(response.data.data.favorites)) {
          return response.data.data.favorites;
        }
        // Fallback: try different response structures
        if (response.data && Array.isArray(response.data.favorites)) {
          return response.data.favorites;
        }
        if (response.data && Array.isArray(response.data.data)) {
          return response.data.data;
        }
        // If no favorites found, return empty array
        console.warn('Favorites API returned unexpected structure:', response.data);
        return [];
      }
      
      // Non-2xx status
      return [];
    } catch (error: any) {
      // Handle 403/401 errors - token might be expired
      if (error.response?.status === 403 || error.response?.status === 401) {
        // Clear invalid token if exists (silently, don't log to console)
        const token = getAuthToken();
        if (token) {
          localStorage.removeItem('phimhub:token');
          localStorage.removeItem('phimhub:user');
          // Dispatch event to notify app about auth failure
          window.dispatchEvent(new CustomEvent('auth:invalid-token'));
        }
        // Return empty array instead of throwing (suppress console error)
        return [];
      }
      // Only log non-auth errors for debugging
      if (!error.suppressLog) {
        console.error('Error loading favorites:', error);
      }
      // Return empty array to prevent app crash
      return [];
    }
  }

  async addToFavorites(data: AddFavoriteRequest): Promise<any> {
    try {
      const response = await favoritesAxios.post('/favorites', data, {
        headers: this.getAuthHeaders(),
      });
      return response.data;
    } catch (error: any) {
      // Handle 403/401 gracefully
      if (error.response?.status === 403 || error.response?.status === 401) {
        // Clear invalid token
        const token = getAuthToken();
        if (token) {
          localStorage.removeItem('phimhub:token');
          window.dispatchEvent(new CustomEvent('auth:invalid-token'));
        }
        throw new Error('Vui lòng đăng nhập để thêm vào yêu thích');
      }
      throw error;
    }
  }

  async removeFromFavorites(movieId: string, movieType: 'movie' | 'series'): Promise<any> {
    try {
      const response = await favoritesAxios.delete(`/favorites/${movieId}/${movieType}`, {
        headers: this.getAuthHeaders(),
      });
      return response.data;
    } catch (error: any) {
      // Handle 403/401 gracefully
      if (error.response?.status === 403 || error.response?.status === 401) {
        // Clear invalid token
        const token = getAuthToken();
        if (token) {
          localStorage.removeItem('phimhub:token');
          window.dispatchEvent(new CustomEvent('auth:invalid-token'));
        }
        throw new Error('Vui lòng đăng nhập');
      }
      throw error;
    }
  }

  async checkFavorite(movieId: string, movieType: 'movie' | 'series'): Promise<boolean> {
    try {
      const response = await favoritesAxios.get(`/favorites/check/${movieId}/${movieType}`, {
        headers: this.getAuthHeaders(),
      });
      return response.data.data.isFavorited;
    } catch (error: any) {
      // Silently return false for auth errors (user not logged in)
      if (error.response?.status === 403 || error.response?.status === 401) {
        return false;
      }
      // Silently handle network errors (backend not running, connection refused, etc.)
      if (error?.message?.includes('Failed to fetch') || 
          error?.message?.includes('Network Error') ||
          error?.code === 'ERR_NETWORK' ||
          error?.name === 'NetworkError') {
        return false;
      }
      // Only log unexpected errors (not network errors)
      console.error('Error checking favorite status:', error);
      return false;
    }
  }

  async getFavoritesCount(): Promise<number> {
    try {
      const response = await favoritesAxios.get('/favorites/count', {
        headers: this.getAuthHeaders(),
      });
      return response.data.data.count;
    } catch (error: any) {
      // Return 0 for auth errors
      if (error.response?.status === 403 || error.response?.status === 401) {
        return 0;
      }
      throw error;
    }
  }

  async clearAllFavorites(): Promise<any> {
    try {
      const response = await favoritesAxios.delete('/favorites/clear', {
        headers: this.getAuthHeaders(),
      });
      return response.data;
    } catch (error: any) {
      // Handle 403/401 gracefully
      if (error.response?.status === 403 || error.response?.status === 401) {
        const token = getAuthToken();
        if (token) {
          localStorage.removeItem('phimhub:token');
          window.dispatchEvent(new CustomEvent('auth:invalid-token'));
        }
        throw new Error('Vui lòng đăng nhập');
      }
      throw error;
    }
  }
}

export const favoritesApi = new FavoritesApi();
