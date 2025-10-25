import { Request, Response } from 'express';
import { MovieService } from '../models/MovieService';
import { ExternalAPIService } from '../services/external-api.service';
import { MovieImportService } from '../services/movie-import.service';
import { asyncHandler } from '../middlewares/error.middleware';
import { ApiResponse } from '../types';

export class MovieController {
  /**
   * Import movie from PhimAPI
   */
  static importFromPhimAPI = asyncHandler(async (req: Request, res: Response<ApiResponse>) => {
    const { phimapi_slug, options = {} } = req.body;
    
    if (!phimapi_slug) {
      return res.status(400).json({
        success: false,
        message: 'PhimAPI slug is required'
      });
    }

    try {
      // 1. Fetch data from PhimAPI
      const externalAPI = new ExternalAPIService();
      const phimData = await externalAPI.getMovieBySlug(phimapi_slug);
      
      if (!phimData.status) {
        return res.status(404).json({
          success: false,
          message: 'Movie not found in PhimAPI'
        });
      }

      // 2. Transform data
      const transformedData = externalAPI.transformPhimAPIToMovie(phimData);
      
      // 3. Import to database
      const movieImportService = new MovieImportService();
      const result = await movieImportService.importMovie(transformedData, {
        auto_create_actors: options.auto_create_actors ?? true,
        auto_create_genres: options.auto_create_genres ?? true,
        auto_create_directors: options.auto_create_directors ?? true,
        import_episodes: options.import_episodes ?? true
      });

      return res.status(201).json({
        success: true,
        message: 'Movie imported successfully from PhimAPI',
        data: result
      });
    } catch (error: any) {
      console.error('Import error:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to import movie from PhimAPI'
      });
    }
  });

  /**
   * Sync existing movie with PhimAPI data
   */
  static syncFromPhimAPI = asyncHandler(async (req: Request, res: Response<ApiResponse>) => {
    const { id } = req.params;
    const { phimapi_slug, sync_options = {} } = req.body;
    
    if (!phimapi_slug) {
      return res.status(400).json({
        success: false,
        message: 'PhimAPI slug is required'
      });
    }

    try {
      // Check if movie exists
      const existingMovie = await MovieService.findById(parseInt(id));
      if (!existingMovie) {
        return res.status(404).json({
          success: false,
          message: 'Movie not found'
        });
      }

      // Fetch updated data from PhimAPI
      const externalAPI = new ExternalAPIService();
      const phimData = await externalAPI.getMovieBySlug(phimapi_slug);
      
      if (!phimData.status) {
        return res.status(404).json({
          success: false,
          message: 'Movie not found in PhimAPI'
        });
      }

      // Transform and sync data
      const transformedData = externalAPI.transformPhimAPIToMovie(phimData);
      const movieImportService = new MovieImportService();
      
      const result = await movieImportService.syncMovie(parseInt(id), transformedData, {
        update_episodes: sync_options.update_episodes ?? true,
        update_metadata: sync_options.update_metadata ?? true,
        preserve_local_changes: sync_options.preserve_local_changes ?? true
      });

      return res.json({
        success: true,
        message: 'Movie synced successfully with PhimAPI',
        data: result
      });
    } catch (error: any) {
      console.error('Sync error:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to sync movie with PhimAPI'
      });
    }
  });

  /**
   * Check if movie exists in PhimAPI
   */
  static checkPhimAPI = asyncHandler(async (req: Request, res: Response<ApiResponse>) => {
    const { slug } = req.params;
    
    try {
      const externalAPI = new ExternalAPIService();
      const exists = await externalAPI.checkMovieExists(slug);
      
      if (exists) {
        const phimData = await externalAPI.getMovieBySlug(slug);
        return res.json({
          success: true,
          message: 'Movie exists in PhimAPI',
          data: {
            exists: true,
            movie: phimData.movie
          }
        });
      } else {
        return res.json({
          success: true,
          message: 'Movie not found in PhimAPI',
          data: {
            exists: false
          }
        });
      }
    } catch (error: any) {
      console.error('Check error:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to check movie in PhimAPI'
      });
    }
  });

  /**
   * Get movie by slug (existing functionality)
   */
  static getBySlug = asyncHandler(async (req: Request, res: Response<ApiResponse>) => {
    const { slug } = req.params;
    
    try {
      const movie = await MovieService.findBySlug(slug);
      if (!movie) {
        return res.status(404).json({
          success: false,
          message: 'Movie not found'
        });
      }

      return res.json({
        success: true,
        message: 'Movie retrieved successfully',
        data: movie
      });
    } catch (error: any) {
      console.error('Get movie error:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to retrieve movie'
      });
    }
  });

  /**
   * Search movies by title
   */
  static search = asyncHandler(async (req: Request, res: Response<ApiResponse>) => {
    const { q: query, limit = 8 } = req.query;
    
    if (!query || typeof query !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    try {
      const movies = await MovieService.findAll({
        search: query,
        limit: parseInt(limit as string),
        status: 'published'
      });

      return res.json({
        success: true,
        message: 'Search completed successfully',
        data: movies
      });
    } catch (error: any) {
      console.error('Search error:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to search movies'
      });
    }
  });

  /**
   * Get all movies with pagination and filters
   */
  static getAll = asyncHandler(async (req: Request, res: Response<ApiResponse>) => {
    const query = req.query;
    
    try {
      const movies = await MovieService.findAll({
        page: query.page ? parseInt(query.page as string) : undefined,
        limit: query.limit ? parseInt(query.limit as string) : undefined,
        search: query.search as string,
        genre_ids: query.genre_ids ? (query.genre_ids as string).split(',').map(Number) : undefined,
        year: query.year ? parseInt(query.year as string) : undefined,
        status: query.status as string,
        is_series: query.is_series ? query.is_series === 'true' : undefined,
        sort_by: query.sort_by as any,
        sort_order: query.sort_order as any
      });

      const total = await MovieService.count({
        search: query.search as string,
        genre_ids: query.genre_ids ? (query.genre_ids as string).split(',').map(Number) : undefined,
        year: query.year ? parseInt(query.year as string) : undefined,
        status: query.status as string,
        is_series: query.is_series ? query.is_series === 'true' : undefined
      });

      return res.json({
        success: true,
        message: 'Movies retrieved successfully',
        data: {
          movies,
          pagination: {
            total,
            page: query.page ? parseInt(query.page as string) : 1,
            limit: query.limit ? parseInt(query.limit as string) : 20,
            total_pages: Math.ceil(total / (query.limit ? parseInt(query.limit as string) : 20))
          }
        }
      });
    } catch (error: any) {
      console.error('Get movies error:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to retrieve movies'
      });
    }
  });

  /**
   * Get movies by genre slug (using categories column)
   */
  static getByGenreSlug = asyncHandler(async (req: Request, res: Response<ApiResponse>) => {
    const { slug } = req.params;
    const { page = 1, limit = 20, sort_by = 'release_year', sort_order = 'DESC' } = req.query;
    
    try {
      const movies = await MovieService.findByGenreSlug(slug, {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        sort_by: sort_by as any,
        sort_order: sort_order as any
      });

      const total = await MovieService.countByGenreSlug(slug);

      return res.json({
        success: true,
        message: 'Movies retrieved successfully',
        data: {
          movies,
          pagination: {
            total,
            page: parseInt(page as string),
            limit: parseInt(limit as string),
            total_pages: Math.ceil(total / parseInt(limit as string))
          }
        }
      });
    } catch (error: any) {
      console.error('Get movies by genre error:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to retrieve movies by genre'
      });
    }
  });
}
