import { Router } from 'express';
import { EpisodeController } from '../controllers/episode.controller';

const router = Router();

// GET /api/episodes/movie/:movieId - Get all episodes for a movie
router.get('/movie/:movieId', EpisodeController.getEpisodesByMovieId);

// GET /api/episodes/movie/:movieId/:episodeNumber - Get specific episode
router.get('/movie/:movieId/:episodeNumber', EpisodeController.getEpisodeByNumber);

export default router;
