import { http } from '../../shared/lib/http';

export type RatingSummary = { avg: number; count: number; user?: number | null };

export const InteractionsApi = {
  async listFavorites() {
    const res = await http.get('/favorites');
    return res.data.favorites || [];
  },

  async addFavorite(movieId: string, movieType: 'movie' | 'series' = 'movie') {
    return http.post('/favorites', { movieId, movieType, provider: 'local' });
  },

  async removeFavorite(movieId: string, movieType: 'movie' | 'series' = 'movie') {
    return http.delete(`/favorites/${movieId}/${movieType}`);
  },

  async checkFavorite(movieId: string, movieType: 'movie' | 'series' = 'movie') {
    const res = await http.get(`/favorites/check/${movieId}/${movieType}`);
    return res.data;
  },

  async getRating(contentId: number) {
    const res = await http.get(`/interactions/ratings/${contentId}`);
    return res.data as RatingSummary;
  },

  async setRating(contentId: number, rating: number) {
    await http.post(`/interactions/ratings/${contentId}`, { rating });
  },

  async listComments(contentId: number, page = 1, limit = 20) {
    const res = await http.get(`/interactions/comments/${contentId}`, { params: { page, limit } });
    return res.data as any[];
  },

  async listExternalComments(provider: string, slug: string, page = 1, limit = 20) {
    const res = await http.get(`/interactions/ext-comments/${provider}/${slug}`, { params: { page, limit } });
    return res.data as any[];
  },

  async listReplies(contentId: number, parentId: number) {
    const res = await http.get(`/interactions/comments/${contentId}/${parentId}/replies`);
    return res.data as any[];
  },

  async createComment(contentId: number, content: string, parentId?: number) {
    const res = await http.post(`/interactions/comments/${contentId}`, { content, parentId });
    return res.data;
  },

  async createExternalComment(provider: string, slug: string, content: string, parentId?: number) {
    const res = await http.post(`/interactions/ext-comments/${provider}/${slug}`, { content, parentId });
    return res.data;
  },

  async updateComment(commentId: number, content: string) {
    const res = await http.put(`/interactions/comments/${commentId}`, { content });
    return res.data;
  },

  async deleteComment(commentId: number) {
    await http.delete(`/interactions/comments/${commentId}`);
  },

  async updateExternalComment(commentId: number, content: string) {
    const res = await http.put(`/interactions/ext-comments/${commentId}`, { content });
    return res.data;
  },

  async deleteExternalComment(commentId: number) {
    await http.delete(`/interactions/ext-comments/${commentId}`);
  }
};
