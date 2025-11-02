import { Router } from 'express';
import { FavoritesController } from '../controllers/favorites.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

// Public route: check favorite should work without auth and default to false
router.get('/check/:movieId/:movieType', FavoritesController.checkFavorite);

// Protected routes require authentication
router.use(authenticateToken);

// GET /api/favorites - Get user's favorites
router.get('/', FavoritesController.getFavorites);

// POST /api/favorites - Add movie to favorites
router.post('/', FavoritesController.addToFavorites);

// DELETE /api/favorites/:movieId/:movieType - Remove movie from favorites
router.delete('/:movieId/:movieType', FavoritesController.removeFromFavorites);

// GET /api/favorites/count - Get favorites count
router.get('/count', FavoritesController.getFavoritesCount);

// DELETE /api/favorites/clear - Clear all favorites
router.delete('/clear', FavoritesController.clearAllFavorites);

export default router;
