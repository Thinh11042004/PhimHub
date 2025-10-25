import { MovieRepository } from './MovieRepository';
import { 
  Movie, 
  MovieWithDetails, 
  CreateMovieRequest, 
  UpdateMovieRequest, 
  MovieQuery 
} from '../types/database';

export class MovieService {
  static async findAll(query: MovieQuery = {}): Promise<MovieWithDetails[]> {
    const repo = new MovieRepository();
    return await repo.findAll(query);
  }

  static async findById(id: number): Promise<MovieWithDetails | null> {
    const repo = new MovieRepository();
    return await repo.findById(id);
  }

  static async findBySlug(slug: string): Promise<MovieWithDetails | null> {
    const repo = new MovieRepository();
    return await repo.findBySlug(slug);
  }

  static async create(movieData: CreateMovieRequest): Promise<Movie> {
    const repo = new MovieRepository();
    return await repo.create(movieData);
  }

  static async update(id: number, updateData: UpdateMovieRequest): Promise<Movie | null> {
    const repo = new MovieRepository();
    return await repo.update(id, updateData);
  }

  static async delete(id: number): Promise<boolean> {
    const repo = new MovieRepository();
    return await repo.delete(id);
  }

  static async incrementViewCount(id: number): Promise<void> {
    const repo = new MovieRepository();
    await repo.incrementViewCount(id);
  }

  static async count(query: MovieQuery = {}): Promise<number> {
    const repo = new MovieRepository();
    return await repo.count(query);
  }

  static async findByGenreSlug(slug: string, options: { page: number; limit: number; sort_by?: string; sort_order?: string }): Promise<MovieWithDetails[]> {
    const repo = new MovieRepository();
    return await repo.findByGenreSlug(slug, options);
  }

  static async countByGenreSlug(slug: string): Promise<number> {
    const repo = new MovieRepository();
    return await repo.countByGenreSlug(slug);
  }
}
