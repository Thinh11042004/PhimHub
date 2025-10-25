import axios from 'axios';
import { API_BASE_URL } from '../config';
import { getAuthToken } from '../utils/auth';

export interface FavoriteItem {
  id: string;
  type: 'movie' | 'series';
  title: string;
  originalTitle?: string;
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
    const response = await axios.get(`${API_BASE_URL}/favorites`, {
      headers: this.getAuthHeaders(),
    });
    return response.data.data.favorites;
  }

  async addToFavorites(data: AddFavoriteRequest): Promise<any> {
    const response = await axios.post(`${API_BASE_URL}/favorites`, data, {
      headers: this.getAuthHeaders(),
    });
    return response.data;
  }

  async removeFromFavorites(movieId: string, movieType: 'movie' | 'series'): Promise<any> {
    const response = await axios.delete(`${API_BASE_URL}/favorites/${movieId}/${movieType}`, {
      headers: this.getAuthHeaders(),
    });
    return response.data;
  }

  async checkFavorite(movieId: string, movieType: 'movie' | 'series'): Promise<boolean> {
    try {
      const response = await axios.get(`${API_BASE_URL}/favorites/check/${movieId}/${movieType}`, {
        headers: this.getAuthHeaders(),
      });
      return response.data.data.isFavorited;
    } catch (error) {
      console.error('Error checking favorite status:', error);
      return false;
    }
  }

  async getFavoritesCount(): Promise<number> {
    const response = await axios.get(`${API_BASE_URL}/favorites/count`, {
      headers: this.getAuthHeaders(),
    });
    return response.data.data.count;
  }

  async clearAllFavorites(): Promise<any> {
    const response = await axios.delete(`${API_BASE_URL}/favorites/clear`, {
      headers: this.getAuthHeaders(),
    });
    return response.data;
  }
}

export const favoritesApi = new FavoritesApi();
