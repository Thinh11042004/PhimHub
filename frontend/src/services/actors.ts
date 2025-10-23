import { http } from '../shared/lib/http';

export interface Actor {
  id: number;
  name: string;
  dob?: string;
  nationality?: string;
  photo_url?: string;
  created_at: string;
  updated_at: string;
}

export interface ActorWithMovies extends Actor {
  movies: Array<{
    id: number;
    slug: string;
    title: string;
    poster_url?: string;
    release_year?: number;
    role_name?: string;
  }>;
}

export interface ActorStats {
  movieCount: number;
  totalViews: number;
}

export interface ActorsResponse {
  actors: Actor[];
  total: number;
  page: number;
  totalPages: number;
}

class ActorService {
  async getAllActors(page: number = 1, limit: number = 20): Promise<ActorsResponse> {
    const res = await http.get(`/actors`, { params: { page, limit } });
    return res.data;
  }

  async getActorById(id: number): Promise<ActorWithMovies> {
    const res = await http.get(`/actors/${id}`);
    return res.data;
  }

  async searchActors(query: string, limit: number = 20): Promise<Actor[]> {
    if (!query || query.trim().length < 2) return [];
    const res = await http.get(`/actors/search`, { params: { q: query, limit } });
    return res.data;
  }

  async getActorStats(id: number): Promise<ActorStats> {
    const res = await http.get(`/actors/${id}/stats`);
    return res.data;
  }

  async createActor(actorData: Omit<Actor, 'id' | 'created_at' | 'updated_at'>): Promise<Actor> {
    const res = await http.post(`/actors`, actorData);
    return res.data;
  }

  async updateActor(id: number, actorData: Partial<Omit<Actor, 'id' | 'created_at' | 'updated_at'>>): Promise<Actor> {
    const res = await http.put(`/actors/${id}`, actorData);
    return res.data;
  }

  async deleteActor(id: number): Promise<void> {
    await http.delete(`/actors/${id}`);
  }

  getActorAge(dob?: string): number | null {
    if (!dob) return null;
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) age--;
    return age;
  }

  formatDateOfBirth(dob?: string): string | null {
    if (!dob) return null;
    try {
      const date = new Date(dob);
      return date.toLocaleDateString('vi-VN', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch {
      return null;
    }
  }

  getRecentMovies(actor: ActorWithMovies, limit: number = 5) {
    return actor.movies.sort((a, b) => (b.release_year || 0) - (a.release_year || 0)).slice(0, limit);
  }

  getPopularMovies(actor: ActorWithMovies, limit: number = 5) {
    return actor.movies.sort((a, b) => (b.release_year || 0) - (a.release_year || 0)).slice(0, limit);
  }
}

export const actorService = new ActorService();
