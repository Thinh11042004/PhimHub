import { Router } from 'express';
import { TMDbController } from '../controllers/tmdb.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

// Public proxy routes
router.get('/search/movie', TMDbController.searchMovie);
router.get('/search/tv', TMDbController.searchTV);
router.get('/movie/:id/credits', TMDbController.movieCredits);
router.get('/tv/:id/credits', TMDbController.tvCredits);

// Protected sync routes to persist data to DB by local slug
router.post('/sync/:slug/credits', authenticateToken, TMDbController.syncCreditsBySlug);
router.post('/sync/:slug/details', authenticateToken, TMDbController.syncMovieDetails);

export default router;


