import { Router } from 'express';
import { GenreController } from '../controllers/genre.controller';

const router = Router();

// GET /api/genres - Get all genres
router.get('/', GenreController.getAll);

// GET /api/genres/:id - Get genre by id
router.get('/:id', GenreController.getById);

export default router;
