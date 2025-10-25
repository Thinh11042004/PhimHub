import { Request, Response } from 'express';
import { MovieService } from '../models/MovieService';
import { ExternalAPIService } from '../services/external-api.service';
import { MovieImportService } from '../services/movie-import.service';
import { KKPhimAPIService } from '../services/kkphim-api.service';
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
   * Import movie from KKPhim API
   */
  static importFromKKPhimAPI = asyncHandler(async (req: Request, res: Response<ApiResponse>) => {
    const { slug, options = {} } = req.body;
    
    if (!slug) {
      return res.status(400).json({
        success: false,
        message: 'Movie slug is required'
      });
    }

    try {
      // 1. Fetch data from KKPhim API
      const kkphimAPI = new KKPhimAPIService();
      const movieData = await kkphimAPI.getMovieBySlug(slug);
      
      if (!movieData.status) {
        return res.status(404).json({
          success: false,
          message: 'Movie not found in KKPhim API'
        });
      }

      // 2. Transform data (include episodes)
      const episodeServers = Array.isArray(movieData.episodes) ? movieData.episodes : [];
      console.log(`[importFromKKPhimAPI] ${slug} -> episode servers: ${episodeServers.length}`);
      const transformedData = kkphimAPI.transformKKPhimToMovie(movieData.movie, episodeServers);
      
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
        message: 'Movie imported successfully from KKPhim API',
        data: result
      });
    } catch (error: any) {
      console.error('Import from KKPhim API error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to import movie from KKPhim API',
        error: error.message
      });
    }
  });

  /**
   * Bulk import latest movies from KKPhim API
   */
  static bulkImportFromKKPhim = asyncHandler(async (req: Request, res: Response<ApiResponse>) => {
    const { 
      pages = 1, 
      version = 'v1',
      options = {},
      start_page = 1 
    } = req.body;

    try {
      const kkphimAPI = new KKPhimAPIService();
      const movieImportService = new MovieImportService();
      
      const results = {
        imported: 0,
        skipped: 0,
        errors: 0,
        details: [] as any[]
      };

      // Import movies from multiple pages
      for (let page = start_page; page < start_page + pages; page++) {
        try {
          console.log(`Fetching page ${page} from KKPhim API (${version})...`);
          
          // 1. Fetch latest movies list
          const listData = await kkphimAPI.getLatestMovies(page, version);
          
          if (!listData.status || !listData.data.items) {
            console.log(`No movies found on page ${page}`);
            continue;
          }

          console.log(`Found ${listData.data.items.length} movies on page ${page}`);

          // 2. Process each movie
          for (const movie of listData.data.items) {
            try {
              // Check if movie already exists
              const existingMovie = await MovieService.findBySlug(movie.slug);
              
              if (existingMovie) {
                results.skipped++;
                results.details.push({
                  slug: movie.slug,
                  title: movie.name,
                  status: 'skipped',
                  reason: 'Already exists'
                });
                continue;
              }

              // Transform and import movie
              const transformedData = kkphimAPI.transformKKPhimToMovie(movie);
              const importResult = await movieImportService.importMovie(transformedData, {
                auto_create_actors: options.auto_create_actors ?? true,
                auto_create_genres: options.auto_create_genres ?? true,
                auto_create_directors: options.auto_create_directors ?? true,
                import_episodes: options.import_episodes ?? false // Skip episodes for bulk import
              });

              results.imported++;
              results.details.push({
                slug: movie.slug,
                title: movie.name,
                status: 'imported',
                id: importResult?.id || 'unknown'
              });

              console.log(`✓ Imported: ${movie.name} (${movie.slug})`);
              
            } catch (movieError: any) {
              results.errors++;
              results.details.push({
                slug: movie.slug,
                title: movie.name,
                status: 'error',
                error: movieError.message
              });
              console.error(`✗ Error importing ${movie.name}:`, movieError.message);
            }
          }

          // Add delay between pages to avoid rate limiting
          if (page < start_page + pages - 1) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }

        } catch (pageError: any) {
          console.error(`Error processing page ${page}:`, pageError.message);
          results.errors++;
        }
      }

      return res.status(200).json({
        success: true,
        message: `Bulk import completed. Imported: ${results.imported}, Skipped: ${results.skipped}, Errors: ${results.errors}`,
        data: results
      });

    } catch (error: any) {
      console.error('Bulk import from KKPhim API error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to bulk import from KKPhim API',
        error: error.message
      });
    }
  });

  /**
   * Search movies from KKPhim API
   */
  static searchKKPhimAPI = asyncHandler(async (req: Request, res: Response<ApiResponse>) => {
    const { query, page = 1 } = req.query;
    
    if (!query || typeof query !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    try {
      const kkphimAPI = new KKPhimAPIService();
      const searchResults = await kkphimAPI.searchMovies(query, parseInt(page as string));
      
      if (!searchResults.status) {
        return res.status(404).json({
          success: false,
          message: 'No movies found'
        });
      }

      // Transform results for easier frontend consumption
      const transformedResults = {
        items: searchResults.data.items.map(movie => ({
          slug: movie.slug,
          title: movie.name,
          original_title: movie.origin_name,
          year: movie.year,
          type: movie.type,
          status: movie.status,
          poster_url: movie.poster_url,
          quality: movie.quality,
          episode_current: movie.episode_current,
          episode_total: movie.episode_total
        })),
        pagination: searchResults.data.params.pagination
      };

      return res.status(200).json({
        success: true,
        message: 'Search completed successfully',
        data: transformedResults
      });

    } catch (error: any) {
      console.error('Search KKPhim API error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to search KKPhim API',
        error: error.message
      });
    }
  });

  /**
   * Get movie by slug (with KKPhim fallback + auto import)
   */
  static getBySlug = asyncHandler(async (req: Request, res: Response<ApiResponse>) => {
    const { slug } = req.params;
    
    try {
      // Try local DB first
      const movie = await MovieService.findBySlug(slug);
      if (movie) {
        return res.json({
          success: true,
          message: 'Movie retrieved successfully',
          data: movie
        });
      }

      // Fallback to KKPhim: fetch and import
      const kkphimAPI = new KKPhimAPIService();
      console.log(`[search:getBySlug] Local miss -> calling KKPhim detail for slug="${slug}"`);
      const movieData = await kkphimAPI.getMovieBySlug(slug);

      if (movieData?.status && movieData.movie) {
        // Include episodes from external detail
        const episodeServers = Array.isArray(movieData.episodes) ? movieData.episodes : [];
        console.log(`[search:getBySlug] ${slug} -> episode servers: ${episodeServers.length}`);
        const transformedData = kkphimAPI.transformKKPhimToMovie(movieData.movie, episodeServers);
        const movieImportService = new MovieImportService();
        const imported = await movieImportService.importMovie(transformedData, {
          auto_create_actors: true,
          auto_create_genres: true,
          auto_create_directors: true,
          import_episodes: true
        });

        // Tell FE an external call happened
        res.setHeader('X-External-API', 'phimapi.com/phim/:slug');

        return res.status(201).json({
          success: true,
          message: 'Movie imported from KKPhim and retrieved successfully',
          data: imported
        });
      }

      return res.status(404).json({
        success: false,
        message: 'Movie not found'
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
   * Search movies by title (local first, KKPhim fallback)
   */
  static search = asyncHandler(async (req: Request, res: Response<ApiResponse>) => {
    const { q: query, limit = 8, forceExternal } = req.query as { q?: string; limit?: any; forceExternal?: string };
    
    if (!query || typeof query !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    try {
      const limitNum = parseInt(limit as string);

      const kkphimAPI = new KKPhimAPIService();

      // Force external path (for debugging/verification)
      if (String(forceExternal).toLowerCase() === 'true') {
        console.log(`[search] forceExternal=true -> KKPhim search for query="${query}"`);
        try {
          const forced = await kkphimAPI.searchMovies(query, 1);
          if (forced?.status && forced.data?.items?.length) {
            const items = forced.data.items.slice(0, limitNum).map((movie: any) => ({
              slug: movie.slug,
              title: movie.name,
              original_title: movie.origin_name,
              year: movie.year,
              type: movie.type,
              status: movie.status,
              poster_url: movie.poster_url,
              quality: movie.quality,
              episode_current: movie.episode_current,
              episode_total: movie.episode_total,
              source: 'kkphim'
            }));
            res.setHeader('X-Search-Source', 'kkphim-forced');
            res.setHeader('X-External-API', 'phimapi.com/tim-kiem');
            return res.status(200).json({ success: true, message: 'Search completed via KKPhim (forced)', data: items });
          }
          // If forced but empty, fall through to secondary slug check
          res.setHeader('X-Search-Source', 'kkphim-forced-empty');
        } catch (e: any) {
          res.setHeader('X-Search-Source', 'kkphim-forced-error');
          console.error('[search] KKPhim forced search error:', e?.message || e);
        }
      }

      // Local search
      const movies = String(forceExternal).toLowerCase() === 'true' ? [] : await MovieService.findAll({
        search: query,
        limit: limitNum,
        status: 'published'
      });

      if (movies?.length) {
        res.setHeader('X-Search-Source', 'local');
        return res.json({
          success: true,
          message: 'Search completed successfully',
          data: movies
        });
      }

      // Fallback to KKPhim when not forced already
      if (String(forceExternal).toLowerCase() !== 'true') {
        console.log(`[search] Local empty -> KKPhim search for query="${query}"`);
      }
      let searchResults: any;
      try {
        searchResults = await kkphimAPI.searchMovies(query, 1);
        console.log(`[search] KKPhim returned items: ${searchResults?.data?.items?.length ?? searchResults?.items?.length ?? 0}`);
      } catch (e: any) {
        res.setHeader('X-Search-Source', 'kkphim-error');
        console.error('[search] KKPhim search error:', e?.message || e);
      }

      const apiItems = (searchResults?.data?.items ?? searchResults?.items ?? []) as any[];
      if (apiItems.length) {
        const items = apiItems
          .slice(0, limitNum)
          .map((movie: any) => ({
            slug: movie.slug,
            title: movie.name,
            original_title: movie.origin_name,
            year: movie.year,
            type: movie.type,
            status: movie.status,
            poster_url: movie.poster_url,
            quality: movie.quality,
            episode_current: movie.episode_current,
            episode_total: movie.episode_total,
            source: 'kkphim'
          }));

        // Indicate to FE that results came from remote source
        res.setHeader('X-Search-Source', String(forceExternal).toLowerCase() === 'true' ? 'kkphim-forced' : 'kkphim');
        res.setHeader('X-External-API', 'phimapi.com/tim-kiem');

        return res.status(200).json({
          success: true,
          message: 'Search completed via KKPhim fallback',
          data: items
        });
      }

      // Secondary fallback: try direct slug detail if search API returns empty
      const slugCandidate = String(query)
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();

      if (slugCandidate) {
        console.log(`[search] KKPhim search empty -> try direct detail with slug="${slugCandidate}"`);
        try {
          const detail = await kkphimAPI.getMovieBySlug(slugCandidate);
          if (detail?.status && detail.movie) {
            res.setHeader('X-Search-Source', 'kkphim');
            res.setHeader('X-External-API', 'phimapi.com/phim/:slug');
            return res.status(200).json({
              success: true,
              message: 'Search completed via KKPhim direct slug',
              data: [
                {
                  slug: detail.movie.slug,
                  title: detail.movie.name,
                  original_title: detail.movie.origin_name,
                  year: detail.movie.year,
                  type: detail.movie.type,
                  status: detail.movie.status,
                  poster_url: detail.movie.poster_url,
                  quality: detail.movie.quality,
                  episode_current: detail.movie.episode_current,
                  episode_total: detail.movie.episode_total,
                  source: 'kkphim'
                }
              ]
            });
          }
        } catch (e: any) {
          res.setHeader('X-Search-Source', 'kkphim-empty');
          console.error('[search] KKPhim direct detail error:', e?.message || e);
        }
      }

      // Nothing found anywhere
      res.setHeader('X-Search-Source', 'none');
      return res.json({
        success: true,
        message: 'No results found',
        data: []
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
   * Debug: Call KKPhim search/detail directly to verify external connectivity
   */
  static debugKKPhim = asyncHandler(async (req: Request, res: Response<ApiResponse>) => {
    const { q = 'xac song phan 11', slug = 'xac-song-phan-11', page = '1' } = req.query as any;
    try {
      const api = new KKPhimAPIService();
      const out: any = { ok: true, q, slug };
      try {
        const s = await api.searchMovies(String(q), parseInt(String(page)) || 1);
        out.search = {
          status: s?.status ?? null,
          items: Array.isArray(s?.data?.items) ? s.data.items.length : (Array.isArray((s as any)?.items) ? (s as any).items.length : 0),
          sample: s?.data?.items?.slice?.(0, 3) ?? (s as any)?.items?.slice?.(0, 3) ?? null
        };
      } catch (e: any) {
        out.searchError = e?.message || String(e);
      }
      try {
        const d = await api.getMovieBySlug(String(slug));
        out.detail = { status: d?.status ?? null, movie_slug: d?.movie?.slug ?? null, title: d?.movie?.name ?? null };
      } catch (e: any) {
        out.detailError = e?.message || String(e);
      }
      return res.json({ success: true, message: 'KKPhim debug', data: out });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message || 'debug error' });
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

  /**
   * Get movie recommendations based on type (movie/series) and latest year
   */
  static getRecommendations = asyncHandler(async (req: Request, res: Response<ApiResponse>) => {
    const { slug } = req.params;
    const { limit = 15 } = req.query;
    
    try {
      // Get current movie details by slug first
      const currentMovie = await MovieService.findBySlug(slug);
      if (!currentMovie) {
        return res.status(404).json({
          success: false,
          message: 'Movie not found'
        });
      }

      // Get recommendations based on same type and latest year
      const recommendations = await MovieService.getRecommendations({
        currentMovieId: currentMovie.id.toString(),
        isSeries: currentMovie.is_series,
        limit: parseInt(limit as string)
      });

      return res.json({
        success: true,
        message: 'Recommendations retrieved successfully',
        data: recommendations
      });
    } catch (error: any) {
      console.error('Get recommendations error:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to retrieve recommendations'
      });
    }
  });

  /**
   * Update movie by ID
   */
  static updateMovie = asyncHandler(async (req: Request, res: Response<ApiResponse>) => {
    const { id } = req.params;
    const updateData = req.body;

    try {
      const movieId = parseInt(id);
      if (isNaN(movieId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid movie ID'
        });
      }

      // Check if movie exists
      const existingMovie = await MovieService.findById(movieId);
      if (!existingMovie) {
        return res.status(404).json({
          success: false,
          message: 'Movie not found'
        });
      }

      // Update movie
      const updatedMovie = await MovieService.update(movieId, updateData);
      
      if (!updatedMovie) {
        return res.status(500).json({
          success: false,
          message: 'Failed to update movie'
        });
      }

      return res.json({
        success: true,
        message: 'Movie updated successfully',
        data: updatedMovie
      });
    } catch (error: any) {
      console.error('Update movie error:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to update movie'
      });
    }
  });

  /**
   * Sync existing movie with KKPhim data (refresh episodes + metadata)
   */
  static syncFromKKPhim = asyncHandler(async (req: Request, res: Response<ApiResponse>) => {
    const { id } = req.params;
    const { kkphim_slug, slug } = req.body as { kkphim_slug?: string; slug?: string };
    const externalSlug = kkphim_slug || slug;

    if (!externalSlug) {
      return res.status(400).json({ success: false, message: 'KKPhim slug is required' });
    }

    try {
      // Check movie exists locally
      const existingMovie = await MovieService.findById(parseInt(id));
      if (!existingMovie) {
        return res.status(404).json({ success: false, message: 'Movie not found' });
      }

      // Fetch updated data from KKPhim
      const kkphimAPI = new KKPhimAPIService();
      const movieData = await kkphimAPI.getMovieBySlug(externalSlug);
      if (!movieData?.status || !movieData.movie) {
        return res.status(404).json({ success: false, message: 'Movie not found in KKPhim API' });
      }

      const episodeServers = Array.isArray(movieData.episodes) ? movieData.episodes : [];
      const transformed = kkphimAPI.transformKKPhimToMovie(movieData.movie, episodeServers);
      const movieImportService = new MovieImportService();

      const result = await movieImportService.syncMovie(parseInt(id), transformed, {
        update_episodes: true,
        update_metadata: true,
        preserve_local_changes: true
      });

      res.setHeader('X-External-API', 'phimapi.com/phim/:slug');
      return res.json({ success: true, message: 'Movie synced successfully from KKPhim', data: result });
    } catch (error: any) {
      console.error('Sync from KKPhim error:', error);
      return res.status(500).json({ success: false, message: error.message || 'Failed to sync movie from KKPhim' });
    }
  });
}
