import { DirectorRepository } from '../models/DirectorRepository';
import { Director } from '../types/director';

export class DirectorService {
  private directorRepository: DirectorRepository;

  constructor() {
    this.directorRepository = new DirectorRepository();
  }

  async getDirectorById(id: number): Promise<Director | null> {
    return this.directorRepository.findById(id);
  }

  async searchDirectors(query: string, limit?: number): Promise<Director[]> {
    return this.directorRepository.searchDirectors(query, limit || 10);
  }

  async getMoviesByDirector(directorId: number): Promise<any[]> {
    return this.directorRepository.getMoviesByDirector(directorId);
  }

  async getAllDirectors(page: number, limit: number): Promise<{ directors: Director[], total: number }> {
    return this.directorRepository.getAllDirectors(page, limit);
  }

  async createDirector(directorData: Partial<Director>): Promise<Director> {
    return this.directorRepository.create(directorData);
  }

  async updateDirector(id: number, directorData: Partial<Director>): Promise<Director | null> {
    return this.directorRepository.update(id, directorData);
  }

  async deleteDirector(id: number): Promise<boolean> {
    return this.directorRepository.delete(id);
  }

  async getDirectorStats(directorId: number): Promise<any> {
    const movies = await this.directorRepository.getMoviesByDirector(directorId);
    
    const stats = {
      total_movies: movies.length,
      total_series: movies.filter(m => m.is_series).length,
      total_movies_only: movies.filter(m => !m.is_series).length,
      latest_movie: movies.length > 0 ? movies[0] : null,
      genres: {} as { [key: string]: number }
    };

    // Count genres (this would need a more complex query in a real implementation)
    return stats;
  }
}
