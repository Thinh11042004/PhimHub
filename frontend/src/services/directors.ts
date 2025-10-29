const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001/api';

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
    const res = await fetch(`${API_BASE}/directors/${id}`);
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    const json = await res.json();
    return json.data;
  }

  async searchDirectors(query: string, limit: number = 10): Promise<Director[]> {
    const res = await fetch(`${API_BASE}/directors/search?q=${encodeURIComponent(query)}&limit=${limit}`);
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    const json = await res.json();
    return json.data;
  }

  async getMoviesByDirector(directorId: number): Promise<DirectorMovie[]> {
    const res = await fetch(`${API_BASE}/directors/${directorId}/movies`);
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    const json = await res.json();
    return json.data;
  }

  async getAllDirectors(page: number = 1, limit: number = 20): Promise<{ directors: Director[], total: number, page: number, limit: number }> {
    const res = await fetch(`${API_BASE}/directors?page=${page}&limit=${limit}`);
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    const json = await res.json();
    return json.data;
  }
}

export const directorService = new DirectorService();
