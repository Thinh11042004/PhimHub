import { http } from '../shared/lib/http';

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
  async getFavorites(): Promise<FavoriteItem[]> {
    const res = await http.get('/favorites');
    return res.data.favorites;
  }

  async addToFavorites(data: AddFavoriteRequest): Promise<any> {
    return http.post('/favorites', data);
  }

  async removeFromFavorites(movieId: string, movieType: 'movie' | 'series'): Promise<any> {
    return http.delete(`/favorites/${movieId}/${movieType}`);
  }

  async checkFavorite(movieId: string, movieType: 'movie' | 'series'): Promise<boolean> {
    try {
      const res = await http.get(`/favorites/check/${movieId}/${movieType}`);
      return res.data.isFavorited;
    } catch (error) {
      console.error('Error checking favorite status:', error);
      return false;
    }
  }

  async getFavoritesCount(): Promise<number> {
    const res = await http.get('/favorites/count');
    return res.data.count;
  }

  async clearAllFavorites(): Promise<any> {
    return http.delete('/favorites/clear');
  }
}

export const favoritesApi = new FavoritesApi();
