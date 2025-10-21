import { Router } from 'express';
import { MovieController } from '../controllers/movie.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

// Public routes
// GET /api/movies - Get all movies with pagination and filters
router.get('/', MovieController.getAll);

// GET /api/movies/search - Search movies by title
router.get('/search', MovieController.search);

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

// PUT /api/movies/:id/sync-from-phimapi - Sync existing movie with PhimAPI
router.put('/:id/sync-from-phimapi', authenticateToken, MovieController.syncFromPhimAPI);

// PUT /api/movies/:id - Update movie by ID
router.put('/:id', authenticateToken, MovieController.updateMovie);

export default router;


