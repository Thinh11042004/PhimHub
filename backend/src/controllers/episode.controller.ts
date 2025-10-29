import { Request, Response } from 'express';
import { EpisodeRepository } from '../models/EpisodeRepository';
import { asyncHandler } from '../middlewares/error.middleware';
import { ApiResponse } from '../types';

export class EpisodeController {
  /**
   * Get episodes for a movie/series
   */
  static getEpisodesByMovieId = asyncHandler(async (req: Request, res: Response<ApiResponse>) => {
    const { movieId } = req.params;
    
    if (!movieId || isNaN(parseInt(movieId))) {
      return res.status(400).json({
        success: false,
        message: 'Valid movie ID is required'
      });
    }

    try {
      const episodeRepo = new EpisodeRepository();
      const episodes = await episodeRepo.findByMovieId(parseInt(movieId));

      return res.json({
        success: true,
        message: 'Episodes retrieved successfully',
        data: { episodes }
      });
    } catch (error: any) {
      console.error('Get episodes error:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to retrieve episodes'
      });
    }
  });

  /**
   * Get specific episode by movie ID and episode number
   */
  static getEpisodeByNumber = asyncHandler(async (req: Request, res: Response<ApiResponse>) => {
    const { movieId, episodeNumber } = req.params;
    
    if (!movieId || !episodeNumber || isNaN(parseInt(movieId)) || isNaN(parseInt(episodeNumber))) {
      return res.status(400).json({
        success: false,
        message: 'Valid movie ID and episode number are required'
      });
    }

    try {
      const episodeRepo = new EpisodeRepository();
      const episode = await episodeRepo.findByMovieIdAndEpisodeNumber(
        parseInt(movieId), 
        parseInt(episodeNumber)
      );

      if (!episode) {
        return res.status(404).json({
          success: false,
          message: 'Episode not found'
        });
      }

      return res.json({
        success: true,
        message: 'Episode retrieved successfully',
        data: { episode }
      });
    } catch (error: any) {
      console.error('Get episode error:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to retrieve episode'
      });
    }
  });
}
