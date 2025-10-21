export type RatingSummary = { avg: number; count: number; user?: number | null };

function getAuthHeader() {
  const token = localStorage.getItem('phimhub:token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001/api';

export const InteractionsApi = {
  // Favorites - Updated to use new API endpoints
  async listFavorites() {
    const res = await fetch(`${API_BASE}/favorites`, {
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      credentials: 'include'
    });
    const json = await res.json();
    return json.data.favorites || [];
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
    const res = await fetch(`${API_BASE}/favorites/check/${movieId}/${movieType}`, {
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      credentials: 'include'
    });
    const json = await res.json();
    return json.data;
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


