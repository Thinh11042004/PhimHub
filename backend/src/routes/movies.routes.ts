import { Router } from 'express';
import { MovieController } from '../controllers/movie.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

// Public routes
// GET /api/movies - Get all movies with pagination and filters
router.get('/', MovieController.getAll);

// GET /api/movies/search - Search movies by title
router.get('/search', MovieController.search);

// GET /api/movies/search-kkphim - Search movies directly from KKPhim API (external)
router.get('/search-kkphim', MovieController.searchKKPhimAPI);

// GET /api/movies/debug-kkphim - Debug external API connectivity (search + detail probes)
router.get('/debug-kkphim', MovieController.debugKKPhim);

// GET /api/movies/genre/:slug - Get movies by genre slug
router.get('/genre/:slug', MovieController.getByGenreSlug);

// GET /api/movies/:slug/recommendations - Get movie recommendations
router.get('/:slug/recommendations', MovieController.getRecommendations);

// GET /api/movies/check-phimapi/:slug - Check if movie exists in PhimAPI
router.get('/check-phimapi/:slug', MovieController.checkPhimAPI);

// GET /api/movies/:slug - Get movie by slug
router.get('/:slug', MovieController.getBySlug);

// Protected routes (require authentication)
// POST /api/movies/import-from-phimapi - Import movie from PhimAPI
router.post('/import-from-phimapi', authenticateToken, MovieController.importFromPhimAPI);

// POST /api/movies/import-from-kkphim - Import movie from KKPhim API
router.post('/import-from-kkphim', authenticateToken, MovieController.importFromKKPhimAPI);

// POST /api/movies/bulk-import-from-kkphim - Bulk import movies from KKPhim API
router.post('/bulk-import-from-kkphim', authenticateToken, MovieController.bulkImportFromKKPhim);

// PUT /api/movies/:id/sync-from-phimapi - Sync existing movie with PhimAPI
router.put('/:id/sync-from-phimapi', authenticateToken, MovieController.syncFromPhimAPI);

// PUT /api/movies/:id/sync-from-kkphim - Sync existing movie with KKPhim (refresh episodes)
router.put('/:id/sync-from-kkphim', authenticateToken, MovieController.syncFromKKPhim);

// PUT /api/movies/:id - Update movie by ID
router.put('/:id', authenticateToken, MovieController.updateMovie);

export default router;


