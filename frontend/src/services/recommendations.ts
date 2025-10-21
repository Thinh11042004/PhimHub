import { apiRequest } from '../shared/lib/api';

export interface RecommendationItem {
  id: string;
  title: string;
  slug: string;
  poster?: string;
  banner?: string;
  year?: number;
  rating?: number;
  is_series?: boolean;
}

export const recommendationsService = {
  /**
   * Get movie recommendations based on current movie
   */
  async getRecommendations(slug: string, limit: number = 15): Promise<RecommendationItem[]> {
    try {
      const response = await apiRequest(`/movies/${slug}/recommendations?limit=${limit}`);
      
      if (response.success) {
        return response.data.map((movie: any) => ({
          id: movie.id,
          title: movie.title,
          slug: movie.slug,
          poster: movie.poster_url,
          banner: movie.banner_url,
          year: movie.release_year,
          rating: movie.rating,
          is_series: movie.is_series
        }));
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      return [];
    }
  }
};
