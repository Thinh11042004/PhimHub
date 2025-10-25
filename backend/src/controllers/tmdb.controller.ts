import { Request, Response } from 'express';
import { TMDbService } from '../services/tmdb.service';
import { MovieRepository } from '../models/MovieRepository';
import { ActorRepository } from '../models/ActorRepository';

const tmdb = new TMDbService();

export class TMDbController {
  static async searchMovie(req: Request, res: Response) {
    try {
      const { query, year, language } = req.query as { query?: string; year?: string; language?: string };
      if (!query) return res.status(400).json({ success: false, message: 'Missing query' });
      const result = await tmdb.searchMovie(query, year ? parseInt(year) : undefined, language || 'vi-VN');
      return res.json({ success: true, data: result });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message || 'TMDb search failed' });
    }
  }

  static async searchTV(req: Request, res: Response) {
    try {
      const { query, year, language } = req.query as { query?: string; year?: string; language?: string };
      if (!query) return res.status(400).json({ success: false, message: 'Missing query' });
      const result = await tmdb.searchTV(query, year ? parseInt(year) : undefined, language || 'vi-VN');
      return res.json({ success: true, data: result });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message || 'TMDb search failed' });
    }
  }

  static async movieCredits(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { language } = req.query as { language?: string };
      const credits = await tmdb.getMovieCredits(parseInt(id, 10), language || 'vi-VN');
      return res.json({ success: true, data: credits });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message || 'Failed to fetch movie credits' });
    }
  }

  static async tvCredits(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { language } = req.query as { language?: string };
      const credits = await tmdb.getTVCredits(parseInt(id, 10), language || 'vi-VN');
      return res.json({ success: true, data: credits });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message || 'Failed to fetch tv credits' });
    }
  }

  /**
   * Sync TMDb credits to local database by movie slug.
   * Steps:
   * 1) Find movie by slug
   * 2) Resolve tmdb_id (use stored tmdb_id, or search by title+year)
   * 3) Fetch credits from TMDb
   * 4) Upsert actors/directors, create relationships
   */
  static async syncCreditsBySlug(req: Request, res: Response) {
    try {
      const { slug } = req.params as { slug: string };
      const { language } = req.query as { language?: string };

      const movieRepo = new MovieRepository();
      const actorRepo = new ActorRepository();
      
      const movie = await movieRepo.findBySlug(slug);
      if (!movie) return res.status(404).json({ success: false, message: 'Movie not found' });

      let tmdbId: number | undefined;
      if (movie.tmdb_id) {
        tmdbId = parseInt(String(movie.tmdb_id), 10);
      } else {
        const found = movie.is_series
          ? await tmdb.searchTV(movie.title, movie.release_year || undefined, language || 'vi-VN')
          : await tmdb.searchMovie(movie.title, movie.release_year || undefined, language || 'vi-VN');
        if (!found) return res.status(404).json({ success: false, message: 'TMDb title not found' });
        tmdbId = found.id;
        await movieRepo.update(movie.id, { tmdb_id: String(tmdbId) });
      }

      const credits = movie.is_series
        ? await tmdb.getTVCredits(tmdbId!, language || 'vi-VN')
        : await tmdb.getMovieCredits(tmdbId!, language || 'vi-VN');

      // Persist actors
      const actorIds: number[] = [];
      for (const cast of credits.cast.slice(0, 30)) {
        const name = cast.name?.trim();
        if (!name) continue;
        let actor = await actorRepo.findByName(name);
        if (!actor) {
          actor = await actorRepo.create({
            name,
            photo_url: cast.profile_path ? `https://image.tmdb.org/t/p/w185${cast.profile_path}` : undefined
          });
        }
        actorIds.push(actor.id);
      }

      // Persist directors (crew job: Director)
      const directorIds: number[] = [];
      for (const crew of credits.crew) {
        if ((crew.job || '').toLowerCase() !== 'director') continue;
        const name = crew.name?.trim();
        if (!name) continue;
        let director = await movieRepo.findDirectorByName(name);
        if (!director) {
          director = await movieRepo.createDirector({ name });
        }
        directorIds.push(director.id);
      }

      // Attach relationships
      if (actorIds.length) {
        await movieRepo.removeMovieActors(movie.id);
        await movieRepo.addMovieActors(movie.id, actorIds);
      }
      if (directorIds.length) {
        await movieRepo.removeMovieDirectors(movie.id);
        await movieRepo.addMovieDirectors(movie.id, directorIds);
      }

      // Reload with details
      const updated = await movieRepo.findBySlug(slug);
      return res.json({ success: true, message: 'TMDb credits synced', data: updated });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message || 'Failed to sync TMDb credits' });
    }
  }

  /**
   * Sync TMDb movie details to local database by movie slug.
   * Updates country, rating, and other metadata from TMDb.
   */
  static async syncMovieDetails(req: Request, res: Response) {
    try {
      const { slug } = req.params as { slug: string };
      const { language } = req.query as { language?: string };

      const movieRepo = new MovieRepository();
      
      const movie = await movieRepo.findBySlug(slug);
      if (!movie) return res.status(404).json({ success: false, message: 'Movie not found' });

      let tmdbId: number | undefined;
      if (movie.tmdb_id) {
        tmdbId = parseInt(String(movie.tmdb_id), 10);
      } else {
        const found = movie.is_series
          ? await tmdb.searchTV(movie.title, movie.release_year || undefined, language || 'vi-VN')
          : await tmdb.searchMovie(movie.title, movie.release_year || undefined, language || 'vi-VN');
        if (!found) return res.status(404).json({ success: false, message: 'TMDb title not found' });
        tmdbId = found.id;
      }

      // Get movie details from TMDb
      const details = movie.is_series
        ? await tmdb.getTVDetails(tmdbId!, language || 'vi-VN')
        : await tmdb.getMovieDetails(tmdbId!, language || 'vi-VN');

      if (!details) {
        return res.status(404).json({ success: false, message: 'Movie details not found in TMDb' });
      }

      // Update movie with TMDb details
      const updateData: any = {
        tmdb_id: tmdbId!.toString(),
        external_rating: details.vote_average,
        external_rating_count: details.vote_count,
        external_view_count: details.popularity,
        original_title: details.original_title || details.original_name,
        country: details.production_countries && details.production_countries.length > 0 
          ? details.production_countries[0].name 
          : null
      };

      const updatedMovie = await movieRepo.update(movie.id, updateData);

      return res.json({ 
        success: true, 
        message: 'Movie details synced successfully',
        data: updatedMovie
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message || 'Failed to sync movie details' });
    }
  }
}


