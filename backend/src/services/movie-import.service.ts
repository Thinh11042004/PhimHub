import { MovieService } from '../models/MovieService';
import { ActorRepository } from '../models/ActorRepository';
import { GenreRepository } from '../models/GenreRepository';
import { EpisodeRepository } from '../models/EpisodeRepository';
import { MovieRepository } from '../models/MovieRepository';
import Database from '../config/database';
import { DownloadQueueService } from './download-queue.service';
import { MediaService } from './media.service';

export interface ImportOptions {
  auto_create_actors: boolean;
  auto_create_genres: boolean;
  auto_create_directors: boolean;
  import_episodes: boolean;
}

export interface SyncOptions {
  update_episodes: boolean;
  update_metadata: boolean;
  preserve_local_changes: boolean;
}

export interface TransformedMovieData {
  slug: string;
  title: string;
  original_title?: string | null;
  description?: string | null;
  release_year?: number | null;
  duration?: number | null;
  age_rating?: string | null;
  thumbnail_url?: string | null;
  banner_url?: string | null;
  trailer_url?: string | null;
  is_series: boolean;
  status: 'published' | 'draft' | 'archived';
  external_id?: string | null;
  tmdb_id?: string | null;
  imdb_id?: string | null;
  external_rating?: number | null;
  external_rating_count?: number | null;
  external_view_count?: number | null;
  quality?: string | null;
  language?: string | null;
  actors: string[];
  directors: string[];
  genres: Array<{ name: string; slug: string }>;
  countries: Array<{ name: string; slug: string }>;
  episodes: Array<{
    episode_number: number;
    title: string;
    slug: string;
    filename: string;
    episode_url: string;
    embed_url: string;
    server_name: string;
  }>;
  total_episodes: number;
}

export class MovieImportService {
  private db = Database.getInstance();
  private movieRepo = new MovieRepository();
  private actorRepo = new ActorRepository();
  private genreRepo = new GenreRepository();
  private episodeRepo = new EpisodeRepository();
  private downloader = new DownloadQueueService();
  private media = new MediaService();

  /**
   * Import movie from external data
   */
  async importMovie(transformedData: TransformedMovieData, options: ImportOptions) {
    const transaction = await this.db.beginTransaction();
    
    try {
      // 1. Create/update actors
      const actorIds = await this.createActors(transformedData.actors, options.auto_create_actors, transaction);
      
      // 2. Create/update genres
      const genreIds = await this.createGenres(transformedData.genres, options.auto_create_genres, transaction);
      
      // 3. Create/update directors
      const directorIds = await this.createDirectors(transformedData.directors, options.auto_create_directors, transaction);
      
      // 4. Create movie
      const movie = await this.movieRepo.createFromExternal(transformedData, transaction);
      
      // Save remote image urls for future reference
      try {
        await this.movieRepo.setRemoteImageUrls(movie.id, transformedData.thumbnail_url || null, transformedData.banner_url || null, transaction);
      } catch {}
      
      // 5. Link relationships
      if (actorIds.length > 0) {
        await this.linkMovieActors(movie.id, actorIds, transaction);
      }
      if (genreIds.length > 0) {
        await this.linkMovieGenres(movie.id, genreIds, transaction);
      }
      if (directorIds.length > 0) {
        await this.linkMovieDirectors(movie.id, directorIds, transaction);
      }
      
      // 6. Create episodes
      if (options.import_episodes && transformedData.episodes.length > 0) {
        await this.createEpisodes(movie.id, transformedData.episodes, transaction);
      }
      
      await transaction.commit();
      
      // Queue media downloads after commit (non-blocking)
      await this.queueMediaForMovie(movie.id, transformedData);
      
      // Return movie with details
      return await MovieService.findById(movie.id);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Sync existing movie with external data
   */
  async syncMovie(movieId: number, transformedData: TransformedMovieData, options: SyncOptions) {
    const transaction = await this.db.beginTransaction();
    
    try {
      const existingMovie = await this.movieRepo.findById(movieId);
      if (!existingMovie) {
        throw new Error('Movie not found');
      }

      // Update movie metadata if requested
      if (options.update_metadata) {
        await this.movieRepo.updateFromExternal(movieId, transformedData, transaction);
      }

      // Update episodes if requested
      if (options.update_episodes && transformedData.episodes.length > 0) {
        // Remove existing episodes
        await this.episodeRepo.deleteByMovieId(movieId, transaction);
        // Create new episodes
        await this.createEpisodes(movieId, transformedData.episodes, transaction);
      }

      // Update relationships
      if (options.update_metadata) {
        // Update actors
        const actorIds = await this.createActors(transformedData.actors, true, transaction);
        await this.movieRepo.removeMovieActors(movieId, transaction);
        if (actorIds.length > 0) {
          await this.linkMovieActors(movieId, actorIds, transaction);
        }

        // Update genres
        const genreIds = await this.createGenres(transformedData.genres, true, transaction);
        await this.movieRepo.removeMovieGenres(movieId, transaction);
        if (genreIds.length > 0) {
          await this.linkMovieGenres(movieId, genreIds, transaction);
        }

        // Update directors
        const directorIds = await this.createDirectors(transformedData.directors, true, transaction);
        await this.movieRepo.removeMovieDirectors(movieId, transaction);
        if (directorIds.length > 0) {
          await this.linkMovieDirectors(movieId, directorIds, transaction);
        }
      }

      await transaction.commit();

      // Queue media downloads after commit (non-blocking)
      await this.queueMediaForMovie(movieId, transformedData);
      
      // Return updated movie with details
      return await MovieService.findById(movieId);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  private async queueMediaForMovie(movieId: number, data: TransformedMovieData) {
    try {
      // Determine image URLs
      const thumbUrl = data.thumbnail_url || data.banner_url || null;
      const bannerUrl = data.banner_url || null;

      // Slug required to generate deterministic paths
      const slug = data.slug;
      if (thumbUrl) {
        const ext = (thumbUrl.match(/\.(jpg|jpeg|png|webp)/i)?.[1] || 'jpg').toLowerCase();
        const rel = this.media.getLocalImagePath(slug, 'thumb', ext);
        await this.downloader.enqueueImage(movieId, thumbUrl, rel);
      }
      if (bannerUrl) {
        const ext = (bannerUrl.match(/\.(jpg|jpeg|png|webp)/i)?.[1] || 'jpg').toLowerCase();
        const rel = this.media.getLocalImagePath(slug, 'banner', ext);
        await this.downloader.enqueueImage(movieId, bannerUrl, rel);
      }

      // Enqueue HLS for each episode that has m3u8
      for (const ep of data.episodes || []) {
        const url = ep.episode_url || '';
        if (!url || !url.includes('.m3u8')) continue;
        // We need episode id to link job; fetch by movie and ep number
        const existing = await this.episodeRepo.findByMovieIdAndEpisodeNumber(movieId, ep.episode_number);
        if (existing) {
          const relDir = this.media.getLocalHlsDir(slug, ep.episode_number);
          await this.downloader.enqueueHls(existing.id, url, relDir);
        }
      }
    } catch (e) {
      console.warn('queueMediaForMovie failed:', (e as any)?.message || e);
    }
  }

  /**
   * Create actors from names array
   */
  private async createActors(actorNames: string[], autoCreate: boolean, transaction: any): Promise<number[]> {
    if (!autoCreate || !actorNames.length) return [];

    const actorIds: number[] = [];
    
    for (const actorName of actorNames) {
      if (!actorName || actorName.trim() === '') continue;
      
      try {
        // Check if actor already exists
        let actor = await this.actorRepo.findByName(actorName.trim());
        
        if (!actor) {
          // Create new actor
          actor = await this.actorRepo.create({
            name: actorName.trim()
          });
        }
        
        actorIds.push(actor.id);
      } catch (error) {
        console.warn(`Failed to create actor: ${actorName}`, error);
      }
    }
    
    return actorIds;
  }

  /**
   * Create genres from genre objects array
   */
  private async createGenres(genres: Array<{ name: string; slug: string }>, autoCreate: boolean, transaction: any): Promise<number[]> {
    if (!autoCreate || !genres.length) return [];

    const genreIds: number[] = [];
    
    for (const genreData of genres) {
      if (!genreData.name || genreData.name.trim() === '') continue;
      
      try {
        // Check if genre already exists
        let genre = await this.genreRepo.findByName(genreData.name.trim());
        
        if (!genre) {
          // Create new genre
          genre = await this.genreRepo.create({
            name: genreData.name.trim()
          }, transaction);
        }
        
        genreIds.push(genre.id);
      } catch (error) {
        console.warn(`Failed to create genre: ${genreData.name}`, error);
      }
    }
    
    return genreIds;
  }

  /**
   * Create directors from names array
   */
  private async createDirectors(directorNames: string[], autoCreate: boolean, transaction: any): Promise<number[]> {
    if (!autoCreate || !directorNames.length) return [];

    const directorIds: number[] = [];
    
    for (const directorName of directorNames) {
      if (!directorName || directorName.trim() === '') continue;
      
      try {
        // Check if director already exists
        let director = await this.movieRepo.findDirectorByName(directorName.trim());
        
        if (!director) {
          // Create new director
          director = await this.movieRepo.createDirector({
            name: directorName.trim()
          }, transaction);
        }
        
        directorIds.push(director.id);
      } catch (error) {
        console.warn(`Failed to create director: ${directorName}`, error);
      }
    }
    
    return directorIds;
  }

  /**
   * Create episodes for movie
   */
  private async createEpisodes(movieId: number, episodes: TransformedMovieData['episodes'], transaction: any) {
    for (const episodeData of episodes) {
      try {
        await this.episodeRepo.create({
          movie_id: movieId,
          episode_number: episodeData.episode_number,
          title: episodeData.title,
          episode_url: episodeData.episode_url,
          // Preserve original source url separately for downloader
          source_url: episodeData.episode_url
        }, transaction);
      } catch (error) {
        console.warn(`Failed to create episode: ${episodeData.title}`, error);
      }
    }
  }

  /**
   * Link movie with actors
   */
  private async linkMovieActors(movieId: number, actorIds: number[], transaction: any) {
    for (const actorId of actorIds) {
      try {
        await this.movieRepo.addMovieActor(movieId, actorId, transaction);
      } catch (error) {
        console.warn(`Failed to link actor ${actorId} to movie ${movieId}`, error);
      }
    }
  }

  /**
   * Link movie with genres
   */
  private async linkMovieGenres(movieId: number, genreIds: number[], transaction: any) {
    for (const genreId of genreIds) {
      try {
        await this.movieRepo.addMovieGenre(movieId, genreId, transaction);
      } catch (error) {
        console.warn(`Failed to link genre ${genreId} to movie ${movieId}`, error);
      }
    }
  }

  /**
   * Link movie with directors
   */
  private async linkMovieDirectors(movieId: number, directorIds: number[], transaction: any) {
    for (const directorId of directorIds) {
      try {
        await this.movieRepo.addMovieDirector(movieId, directorId, transaction);
      } catch (error) {
        console.warn(`Failed to link director ${directorId} to movie ${movieId}`, error);
      }
    }
  }
}
