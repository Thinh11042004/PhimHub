import { http } from '../shared/lib/http';

export interface WatchHistoryItem {
  id: number;
  user_id: number;
  content_id: number;
  last_watched_at: string;
  progress?: number;
  device?: string;
  title?: string;
  slug?: string;
  poster_url?: string;
  is_series?: boolean;
  // Episode information
  episode_number?: number;
  episode_title?: string;
  episode_movie_id?: number;
}

export interface AddToHistoryRequest {
  userId: number;
  contentId: number; // This will be the movie ID, backend will find the content_id
  progress?: number;
  device?: string;
  episode_number?: number;
}

class WatchHistoryService {
  async getHistory(userId: number): Promise<WatchHistoryItem[]> {
    const res = await http.get(`/watch-history/${userId}`);
    return res.data.history || [];
  }

  async addToHistory(request: AddToHistoryRequest): Promise<WatchHistoryItem> {
    const res = await http.post('/watch-history', request);
    return res.data;
  }

  async removeFromHistory(userId: number, movieId: number): Promise<void> {
    await http.delete(`/watch-history/${userId}/${movieId}`);
  }

  async clearHistory(userId: number): Promise<void> {
    await http.delete(`/watch-history/${userId}`);
  }

  // Helper method to track video progress
  async trackProgress(userId: number, movieId: number, progress: number, episode_number?: number): Promise<void> {
    try {
      await this.addToHistory({
        userId,
        contentId: movieId,
        progress,
        device: 'web',
        episode_number,
      });
    } catch (error) {
      console.error('Error tracking progress:', error);
    }
  }
}

export const watchHistoryService = new WatchHistoryService();
