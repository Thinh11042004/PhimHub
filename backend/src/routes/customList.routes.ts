import { Router } from 'express';
import { CustomListController } from '../controllers/customList.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Get all lists for the authenticated user
router.get('/', (req, res) => {
  const controller = new CustomListController();
  return controller.getUserLists(req, res);
});

// Get a specific list with items
router.get('/:id', (req, res) => {
  const controller = new CustomListController();
  return controller.getList(req, res);
});

// Create a new list
router.post('/', (req, res) => {
  const controller = new CustomListController();
  return controller.createList(req, res);
});

// Update a list
router.put('/:id', (req, res) => {
  const controller = new CustomListController();
  return controller.updateList(req, res);
});

// Delete a list
router.delete('/:id', (req, res) => {
  const controller = new CustomListController();
  return controller.deleteList(req, res);
});

// Add movie to list
router.post('/:id/items', (req, res) => {
  const controller = new CustomListController();
  return controller.addMovieToList(req, res);
});

// Remove movie from list
router.delete('/:id/items', (req, res) => {
  const controller = new CustomListController();
  return controller.removeMovieFromList(req, res);
});

// Check if movie is in any list
router.get('/check/movie', (req, res) => {
  const controller = new CustomListController();
  return controller.checkMovieInLists(req, res);
});

export default router;
