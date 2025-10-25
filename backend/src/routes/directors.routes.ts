import { Router } from 'express';
import { DirectorController } from '../controllers/director.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

// Public routes
// GET /api/directors - Get all directors with pagination
router.get('/', (req, res) => {
  const controller = new DirectorController();
  return controller.getAll(req, res, () => {});
});

// GET /api/directors/search?q=... - Search directors by name
router.get('/search', (req, res) => {
  const controller = new DirectorController();
  return controller.search(req, res, () => {});
});

// GET /api/directors/:id - Get director by ID
router.get('/:id', (req, res) => {
  const controller = new DirectorController();
  return controller.getById(req, res, () => {});
});

// GET /api/directors/:id/stats - Get director statistics
router.get('/:id/stats', (req, res) => {
  const controller = new DirectorController();
  return controller.getStats(req, res, () => {});
});

// GET /api/directors/:id/movies - Get movies by director ID
router.get('/:id/movies', (req, res) => {
  const controller = new DirectorController();
  return controller.getMoviesByDirector(req, res, () => {});
});

// Protected routes (require authentication)
// POST /api/directors - Create new director
router.post('/', authenticateToken, (req, res) => {
  const controller = new DirectorController();
  return controller.create(req, res, () => {});
});

// PUT /api/directors/:id - Update director
router.put('/:id', authenticateToken, (req, res) => {
  const controller = new DirectorController();
  return controller.update(req, res, () => {});
});

// DELETE /api/directors/:id - Delete director
router.delete('/:id', authenticateToken, (req, res) => {
  const controller = new DirectorController();
  return controller.delete(req, res, () => {});
});

export default router;
