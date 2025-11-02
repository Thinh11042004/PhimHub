export type RatingSummary = { avg: number; count: number; user?: number | null };

function getAuthHeader() {
  const token = localStorage.getItem('phimhub:token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001/api';

export const InteractionsApi = {
  // Favorites - Updated to use new API endpoints
  async listFavorites() {
    try {
      const res = await fetch(`${API_BASE}/favorites`, {
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        credentials: 'include'
      });
      
      // Handle 403/401 gracefully (user not logged in or token expired)
      if (!res.ok && (res.status === 403 || res.status === 401)) {
        return [];
      }
      
      if (!res.ok) {
        throw new Error(`API error: ${res.status}`);
      }
      
      const json = await res.json();
      return json.data.favorites || [];
    } catch (error) {
      // Suppress console error for auth failures, log others
      if (!error?.toString().includes('403') && !error?.toString().includes('401')) {
        console.error('Error loading favorites:', error);
      }
      return [];
    }
  },

  async addFavorite(movieId: string, movieType: 'movie' | 'series' = 'movie') {
    const res = await fetch(`${API_BASE}/favorites`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ movieId, movieType, provider: 'local' }),
      credentials: 'include'
    });
    return res.json();
  },

  async removeFavorite(movieId: string, movieType: 'movie' | 'series' = 'movie') {
    const res = await fetch(`${API_BASE}/favorites/${movieId}/${movieType}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      credentials: 'include'
    });
    return res.json();
  },

  async checkFavorite(movieId: string, movieType: 'movie' | 'series' = 'movie') {
    try {
      const res = await fetch(`${API_BASE}/favorites/check/${movieId}/${movieType}`, {
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        credentials: 'include'
      });
      if (!res.ok) {
        return { isFavorited: false } as any;
      }
      const json = await res.json();
      return json.data;
    } catch (error: any) {
      // Silently handle network errors (backend not running, connection refused, etc.)
      // Don't log these errors as they're expected when backend is down
      if (error?.message?.includes('Failed to fetch') || 
          error?.message?.includes('NetworkError') ||
          error?.code === 'ERR_NETWORK' ||
          error?.name === 'TypeError') {
        return { isFavorited: false } as any;
      }
      // For other errors, still return false but don't throw
      return { isFavorited: false } as any;
    }
  },

  // Ratings
  async getRating(contentId: number) {
    const res = await fetch(`${API_BASE}/interactions/ratings/${contentId}`, {
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      credentials: 'include'
    });
    const json = await res.json();
    return json.data as RatingSummary;
  },

  async setRating(contentId: number, rating: number) {
    await fetch(`${API_BASE}/interactions/ratings/${contentId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ rating }),
      credentials: 'include'
    });
  },

  // Comments
  async listComments(contentId: number, page = 1, limit = 20) {
    const res = await fetch(`${API_BASE}/interactions/comments/${contentId}?page=${page}&limit=${limit}`, {
      headers: { 'Content-Type': 'application/json' },
    });
    const json = await res.json();
    return json.data as any[];
  },

  async listExternalComments(provider: string, slug: string, page = 1, limit = 20) {
    const res = await fetch(`${API_BASE}/interactions/ext-comments/${provider}/${slug}?page=${page}&limit=${limit}`);
    const json = await res.json();
    return json.data as any[];
  },

  async listReplies(contentId: number, parentId: number) {
    const res = await fetch(`${API_BASE}/interactions/comments/${contentId}/${parentId}/replies`, {
      headers: { 'Content-Type': 'application/json' },
    });
    const json = await res.json();
    return json.data as any[];
  },

  async createComment(contentId: number, content: string, parentId?: number) {
    const res = await fetch(`${API_BASE}/interactions/comments/${contentId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ content, parentId }),
      credentials: 'include'
    });
    const json = await res.json();
    return json.data;
  },

  async createExternalComment(provider: string, slug: string, content: string, parentId?: number) {
    const res = await fetch(`${API_BASE}/interactions/ext-comments/${provider}/${slug}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ content, parentId }),
      credentials: 'include'
    });
    const json = await res.json();
    return json.data;
  },

  async updateComment(commentId: number, content: string) {
    const res = await fetch(`${API_BASE}/interactions/comments/${commentId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ content }),
      credentials: 'include'
    });
    const json = await res.json();
    return json.data;
  },

  async deleteComment(commentId: number) {
    await fetch(`${API_BASE}/interactions/comments/${commentId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      credentials: 'include'
    });
  },

  async updateExternalComment(commentId: number, content: string) {
    console.log(`🔄 Updating external comment ${commentId} with content: "${content}"`);
    console.log(`🔗 API URL: ${API_BASE}/interactions/ext-comments/${commentId}`);
    
    const res = await fetch(`${API_BASE}/interactions/ext-comments/${commentId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ content }),
      credentials: 'include'
    });
    
    console.log(`📊 Response status: ${res.status}`);
    console.log(`📊 Response headers:`, Object.fromEntries(res.headers.entries()));
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error(`❌ API Error ${res.status}:`, errorText);
      throw new Error(`API Error ${res.status}: ${errorText}`);
    }
    
    const json = await res.json();
    console.log(`✅ Update successful:`, json);
    return json.data;
  },

  async deleteExternalComment(commentId: number) {
    await fetch(`${API_BASE}/interactions/ext-comments/${commentId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      credentials: 'include'
    });
  }
};


