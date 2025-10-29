import { Router } from 'express';
import { WatchHistoryController } from '../controllers/watchHistory.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

// GET /api/watch-history/:userId - Get watch history for a user (public for now)
router.get('/:userId', WatchHistoryController.getHistory);

// POST /api/watch-history - Add or update watch history (public for now)
router.post('/', WatchHistoryController.addToHistory);

// Protected routes require authentication
router.use(authenticateToken);

// DELETE /api/watch-history/:userId/:movieId - Remove specific item from history
router.delete('/:userId/:movieId', WatchHistoryController.removeFromHistory);

// DELETE /api/watch-history/:userId - Clear all watch history for a user
router.delete('/:userId', WatchHistoryController.clearHistory);

export default router;
