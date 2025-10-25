const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001/api';

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
  private async fetchWithErrorHandling<T>(url: string, options?: RequestInit): Promise<T> {
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
        ...options,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error('ActorService error:', error);
      throw error;
    }
  }

  // Get all actors with pagination
  async getAllActors(page: number = 1, limit: number = 20): Promise<ActorsResponse> {
    const url = `${API_BASE}/actors?page=${page}&limit=${limit}`;
    return this.fetchWithErrorHandling<ActorsResponse>(url);
  }

  // Get actor by ID with movies
  async getActorById(id: number): Promise<ActorWithMovies> {
    const url = `${API_BASE}/actors/${id}`;
    return this.fetchWithErrorHandling<ActorWithMovies>(url);
  }

  // Search actors by name
  async searchActors(query: string, limit: number = 20): Promise<Actor[]> {
    if (!query || query.trim().length < 2) {
      return [];
    }
    
    const url = `${API_BASE}/actors/search?q=${encodeURIComponent(query)}&limit=${limit}`;
    return this.fetchWithErrorHandling<Actor[]>(url);
  }

  // Get actor statistics
  async getActorStats(id: number): Promise<ActorStats> {
    const url = `${API_BASE}/actors/${id}/stats`;
    return this.fetchWithErrorHandling<ActorStats>(url);
  }

  // Create actor (Admin only)
  async createActor(actorData: Omit<Actor, 'id' | 'created_at' | 'updated_at'>): Promise<Actor> {
    const token = localStorage.getItem('phimhub:token');
    if (!token) {
      throw new Error('Authentication required');
    }

    const url = `${API_BASE}/actors`;
    return this.fetchWithErrorHandling<Actor>(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(actorData),
    });
  }

  // Update actor (Admin only)
  async updateActor(id: number, actorData: Partial<Omit<Actor, 'id' | 'created_at' | 'updated_at'>>): Promise<Actor> {
    const token = localStorage.getItem('phimhub:token');
    if (!token) {
      throw new Error('Authentication required');
    }

    const url = `${API_BASE}/actors/${id}`;
    return this.fetchWithErrorHandling<Actor>(url, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(actorData),
    });
  }

  // Delete actor (Admin only)
  async deleteActor(id: number): Promise<void> {
    const token = localStorage.getItem('phimhub:token');
    if (!token) {
      throw new Error('Authentication required');
    }

    const url = `${API_BASE}/actors/${id}`;
    await this.fetchWithErrorHandling<void>(url, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  }

  // Helper method to get actor age from date of birth
  getActorAge(dob?: string): number | null {
    if (!dob) return null;
    
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }

  // Helper method to format date of birth
  formatDateOfBirth(dob?: string): string | null {
    if (!dob) return null;
    
    try {
      const date = new Date(dob);
      return date.toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return null;
    }
  }

  // Helper method to get actor's most recent movies
  getRecentMovies(actor: ActorWithMovies, limit: number = 5) {
    return actor.movies
      .sort((a, b) => (b.release_year || 0) - (a.release_year || 0))
      .slice(0, limit);
  }

  // Helper method to get actor's most popular movies (by release year for now)
  getPopularMovies(actor: ActorWithMovies, limit: number = 5) {
    return actor.movies
      .sort((a, b) => (b.release_year || 0) - (a.release_year || 0))
      .slice(0, limit);
  }
}

export const actorService = new ActorService();
