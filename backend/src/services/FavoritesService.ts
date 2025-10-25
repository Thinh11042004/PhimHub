import { FavoritesRepository, Favorite, CreateFavoriteData } from '../models/FavoritesRepository';
import Database from '../config/database';

export class FavoritesService {
  private favoritesRepository: FavoritesRepository;

  constructor() {
    this.favoritesRepository = new FavoritesRepository();
  }

  // Ensure database connection
  private async ensureConnection() {
    try {
      await Database.getInstance().connect();
    } catch (error) {
      console.error('Database connection error:', error);
      throw new Error('Database connection failed');
    }
  }

  // Get all favorites for a user with movie details
  async getUserFavorites(userId: number): Promise<any[]> {
    try {
      await this.ensureConnection();
      const favorites = await this.favoritesRepository.findByUserId(userId);
      
      return favorites.map(favorite => ({
        id: favorite.slug || favorite.movie_id?.toString() || favorite.content_id.toString(),
        type: favorite.is_series ? 'series' : 'movie',
        title: favorite.title || 'Unknown Title',
        year: favorite.release_year,
        poster: favorite.poster_url || favorite.thumbnail_url || '',
        genres: [], // Will be populated from movie details if needed
        duration: favorite.duration,
        rating: 0, // Default rating
        age: favorite.age_rating,
        episodes: 0, // Will be populated from episodes table if needed
        overview: '', // Will be populated from movie details if needed
        provider: 'local',
        favorited_at: favorite.added_at
      }));
    } catch (error) {
      console.error('Error getting user favorites:', error);
      throw new Error('Failed to get user favorites');
    }
  }

  // Add a movie to favorites
  async addToFavorites(userId: number, movieId: string, movieType: 'movie' | 'series', provider: string = 'local'): Promise<Favorite> {
    try {
      await this.ensureConnection();
      // First, try to find the movie by slug to get the database ID
      let movieIdNum: number;
      
      // Check if movieId is a pure number (not a slug with numbers)
      const parsedId = parseInt(movieId);
      if (!isNaN(parsedId) && movieId === parsedId.toString()) {
        // It's a pure number, use it directly
        movieIdNum = parsedId;
      } else {
        // It's a slug, we need to find the movie by slug
        const foundId = await this.favoritesRepository.findMovieIdBySlug(movieId);
        if (!foundId) {
          throw new Error(`Movie with slug '${movieId}' not found`);
        }
        movieIdNum = foundId;
      }

      // Get or create content record
      const contentId = await this.favoritesRepository.getOrCreateContent(movieIdNum, movieType === 'series' ? 'episode' : 'movie');
      
      if (!contentId || contentId <= 0) {
        throw new Error('Invalid content ID returned');
      }
      
      // Check if already favorited
      const isAlreadyFavorited = await this.favoritesRepository.isFavorited(userId, contentId);
      if (isAlreadyFavorited) {
        throw new Error('Movie is already in favorites');
      }

      // Add to favorites
      const favorite = await this.favoritesRepository.create({
        user_id: userId,
        content_id: contentId
      });

      return favorite;
    } catch (error) {
      console.error('Error adding to favorites:', error);
      throw error;
    }
  }

  // Remove a movie from favorites
  async removeFromFavorites(userId: number, movieId: string, movieType: 'movie' | 'series'): Promise<boolean> {
    try {
      await this.ensureConnection();
      // First, try to find the movie by slug to get the database ID
      let movieIdNum: number;
      
      // Check if movieId is a pure number (not a slug with numbers)
      const parsedId = parseInt(movieId);
      if (!isNaN(parsedId) && movieId === parsedId.toString()) {
        // It's a pure number, use it directly
        movieIdNum = parsedId;
      } else {
        // It's a slug, we need to find the movie by slug
        const foundId = await this.favoritesRepository.findMovieIdBySlug(movieId);
        if (!foundId) {
          // Movie not found in database, but might still be in favorites
          // Try to remove directly from favorites using the slug
          const removed = await this.favoritesRepository.removeFavoriteBySlug(userId, movieId, movieType === 'series' ? 'episode' : 'movie');
          if (!removed) {
            // If still not found, try to remove any orphaned favorite
            // This is a fallback for cases where the movie was deleted but favorite still exists
            const allFavorites = await this.favoritesRepository.findByUserId(userId);
            const orphanedFavorite = allFavorites.find(fav => fav.slug === movieId);
            if (orphanedFavorite) {
              const removed = await this.favoritesRepository.remove(userId, orphanedFavorite.content_id);
              if (removed) {
                return true;
              }
            }
            // If still not found, try to remove by content_id directly
            // This handles cases where the movie was deleted but favorite still exists
            const directRemoved = await this.favoritesRepository.removeFavoriteByContentId(userId, movieId);
            if (directRemoved) {
              return true;
            }
            // If still not found, try to remove by slug directly without JOIN
            // This handles cases where the movie was deleted but favorite still exists
            const slugRemoved = await this.favoritesRepository.removeFavoriteBySlugDirect(userId, movieId);
            if (slugRemoved) {
              return true;
            }
            throw new Error(`Favorite with slug '${movieId}' not found`);
          }
          return true;
        }
        movieIdNum = foundId;
      }

      // Find content ID (don't create new one when removing)
      const contentId = await this.favoritesRepository.findContentByMovieId(movieIdNum, movieType === 'series' ? 'episode' : 'movie');
      
      if (!contentId) {
        throw new Error('Content not found');
      }
      
      const removed = await this.favoritesRepository.remove(userId, contentId);
      if (!removed) {
        throw new Error('Favorite not found');
      }
      return true;
    } catch (error) {
      console.error('Error removing from favorites:', error);
      throw error;
    }
  }

  // Check if a movie is favorited
  async isFavorited(userId: number, movieId: string, movieType: 'movie' | 'series'): Promise<boolean> {
    try {
      await this.ensureConnection();
      // First, try to find the movie by slug to get the database ID
      let movieIdNum: number;
      
      // Check if movieId is a pure number (not a slug with numbers)
      const parsedId = parseInt(movieId);
      if (!isNaN(parsedId) && movieId === parsedId.toString()) {
        // It's a pure number, use it directly
        movieIdNum = parsedId;
      } else {
        // It's a slug, we need to find the movie by slug
        const foundId = await this.favoritesRepository.findMovieIdBySlug(movieId);
        if (!foundId) {
          return false; // Movie not found, so not favorited
        }
        movieIdNum = foundId;
      }

      // Find content ID (don't create new one when checking)
      const contentId = await this.favoritesRepository.findContentByMovieId(movieIdNum, movieType === 'series' ? 'episode' : 'movie');
      
      if (!contentId) {
        return false; // Content not found, so not favorited
      }
      
      return await this.favoritesRepository.isFavorited(userId, contentId);
    } catch (error) {
      console.error('Error checking favorite status:', error);
      return false;
    }
  }

  // Get favorites count for a user
  async getFavoritesCount(userId: number): Promise<number> {
    try {
      await this.ensureConnection();
      return await this.favoritesRepository.getCountByUserId(userId);
    } catch (error) {
      console.error('Error getting favorites count:', error);
      return 0;
    }
  }

  // Clear all favorites for a user
  async clearAllFavorites(userId: number): Promise<number> {
    try {
      await this.ensureConnection();
      return await this.favoritesRepository.removeAllByUserId(userId);
    } catch (error) {
      console.error('Error clearing favorites:', error);
      throw error;
    }
  }

  // Get favorites by type
  async getFavoritesByType(userId: number, movieType: 'movie' | 'series'): Promise<any[]> {
    try {
      await this.ensureConnection();
      const allFavorites = await this.favoritesRepository.findByUserId(userId);
      
      return allFavorites
        .filter(favorite => {
          if (movieType === 'series') {
            return favorite.is_series === true;
          } else {
            return favorite.is_series === false;
          }
        })
        .map(favorite => ({
          id: favorite.movie_id?.toString() || favorite.content_id.toString(),
          type: favorite.is_series ? 'series' : 'movie',
          title: favorite.title || 'Unknown Title',
          year: favorite.release_year,
          poster: favorite.thumbnail_url || '',
          genres: [],
          duration: favorite.duration,
          rating: 0,
          age: favorite.age_rating,
          episodes: 0,
          provider: 'local',
          favorited_at: favorite.added_at
        }));
    } catch (error) {
      console.error('Error getting favorites by type:', error);
      throw new Error('Failed to get favorites by type');
    }
  }
}
