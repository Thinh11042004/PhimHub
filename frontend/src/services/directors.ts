import { http } from '../shared/lib/http';

export interface Director {
  id: number;
  name: string;
  dob?: string;
  nationality?: string;
  photo_url?: string;
  created_at?: string;
  updated_at?: string;
}

export interface DirectorMovie {
  id: number;
  title: string;
  slug: string;
  poster_url?: string;
  release_year?: number;
  is_series: boolean;
}

class DirectorService {
  async getDirectorById(id: number): Promise<Director | null> {
    return http.get(`/directors/${id}`);
  }

  async searchDirectors(query: string, limit: number = 10): Promise<Director[]> {
    return http.get(`/directors/search`, { params: { q: query, limit } });
  }

  async getMoviesByDirector(directorId: number): Promise<DirectorMovie[]> {
    return http.get(`/directors/${directorId}/movies`);
  }

  async getAllDirectors(page: number = 1, limit: number = 20): Promise<{ directors: Director[], total: number, page: number, limit: number }> {
    return http.get(`/directors`, { params: { page, limit } });
  }
}

export const directorService = new DirectorService();
