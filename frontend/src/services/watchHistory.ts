const API_BASE_URL = import.meta.env.VITE_API_BASE || 'http://localhost:3001/api';

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
  private getAuthHeaders() {
    const token = localStorage.getItem('phimhub:token');
    console.log('🎬 WatchHistoryService - Auth token:', token ? 'Present' : 'Missing');
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  }

  async getHistory(userId: number): Promise<WatchHistoryItem[]> {
    try {
      console.log('🎬 WatchHistoryService - getHistory called:', { userId, headers: this.getAuthHeaders() });
      
      const response = await fetch(`${API_BASE_URL}/watch-history/${userId}`, {
        headers: this.getAuthHeaders()
      });

      console.log('🎬 WatchHistoryService - API response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('🎬 WatchHistoryService - API error:', errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('🎬 WatchHistoryService - API response data:', data);
      
      if (data.success) {
        const history = data.data.history || [];
        console.log('🎬 WatchHistoryService - History items with episode_number:', 
          history.map((item: any) => ({
            title: item.title,
            episode_number: item.episode_number,
            content_type: item.content_type || (item.is_series ? 'series' : 'movie')
          }))
        );
        return history;
      } else {
        throw new Error(data.message || 'Failed to fetch watch history');
      }
    } catch (error: any) {
      // Silently handle network errors (backend not running, connection refused, etc.)
      const isNetworkError = error?.message?.includes('Failed to fetch') || 
                            error?.message?.includes('NetworkError') ||
                            error?.code === 'ERR_NETWORK' ||
                            error?.name === 'TypeError';
      if (!isNetworkError) {
        console.error('🎬 WatchHistoryService - Error fetching watch history:', error);
      }
      // Return empty array instead of throwing when backend is not available
      return [];
    }
  }

  async addToHistory(request: AddToHistoryRequest): Promise<WatchHistoryItem> {
    try {
      console.log('🎬 WatchHistoryService - addToHistory called:', request);
      
      const response = await fetch(`${API_BASE_URL}/watch-history`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(request)
      });

      console.log('🎬 WatchHistoryService - API response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('🎬 WatchHistoryService - API error:', errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('🎬 WatchHistoryService - API response data:', data);
      
      if (data.success) {
        return data.data;
      } else {
        throw new Error(data.message || 'Failed to add to watch history');
      }
    } catch (error) {
      console.error('🎬 WatchHistoryService - Error adding to watch history:', error);
      throw error;
    }
  }

  async removeFromHistory(userId: number, movieId: number): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/watch-history/${userId}/${movieId}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to remove from watch history');
      }
    } catch (error) {
      console.error('Error removing from watch history:', error);
      throw error;
    }
  }

  async clearHistory(userId: number): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/watch-history/${userId}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to clear watch history');
      }
    } catch (error) {
      console.error('Error clearing watch history:', error);
      throw error;
    }
  }

  // Helper method to track video progress
  async trackProgress(userId: number, movieId: number, progress: number, episode_number?: number): Promise<void> {
    try {
      await this.addToHistory({
        userId,
        contentId: movieId, // contentId is actually movieId in our system
        progress,
        device: 'web',
        episode_number
      });
    } catch (error) {
      console.error('Error tracking progress:', error);
      // Don't throw error for progress tracking to avoid disrupting video playback
    }
  }
}

export const watchHistoryService = new WatchHistoryService();
