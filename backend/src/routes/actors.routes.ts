import { Router } from 'express';
import { ActorController } from '../controllers/actor.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

// Public routes
// GET /api/actors - Get all actors with pagination
router.get('/', (req, res) => {
  const controller = new ActorController();
  return controller.getAll(req, res, () => {});
});

// GET /api/actors/search - Search actors by name
router.get('/search', (req, res) => {
  const controller = new ActorController();
  return controller.search(req, res, () => {});
});

// GET /api/actors/selection - Get actors for selection
router.get('/selection', (req, res) => {
  const controller = new ActorController();
  return controller.getForSelection(req, res, () => {});
});

// GET /api/actors/:id - Get actor by ID with movies
router.get('/:id', (req, res) => {
  const controller = new ActorController();
  return controller.getById(req, res, () => {});
});

// GET /api/actors/:id/stats - Get actor statistics
router.get('/:id/stats', (req, res) => {
  const controller = new ActorController();
  return controller.getStats(req, res, () => {});
});

// Protected routes (require authentication)
// POST /api/actors - Create new actor
router.post('/', authenticateToken, (req, res) => {
  const controller = new ActorController();
  return controller.create(req, res, () => {});
});

// PUT /api/actors/:id - Update actor
router.put('/:id', authenticateToken, (req, res) => {
  const controller = new ActorController();
  return controller.update(req, res, () => {});
});

// DELETE /api/actors/:id - Delete actor
router.delete('/:id', authenticateToken, (req, res) => {
  const controller = new ActorController();
  return controller.delete(req, res, () => {});
});

export default router;
