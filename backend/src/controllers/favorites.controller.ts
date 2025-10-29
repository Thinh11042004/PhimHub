import { Request, Response } from 'express';
import { FavoritesService } from '../services/FavoritesService';
import { asyncHandler } from '../utils/asyncHandler';

interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    username: string;
    email: string;
  };
}

interface ApiResponse {
  success: boolean;
  message: string;
  data?: any;
}

export class FavoritesController {
  private favoritesService: FavoritesService;

  constructor() {
    this.favoritesService = new FavoritesService();
  }

  // GET /api/favorites - Get user's favorites
  static getFavorites = asyncHandler(async (req: AuthenticatedRequest, res: Response<ApiResponse>) => {
    const userId = req.user!.id; // Guaranteed to exist due to middleware

    try {
      const favorites = await new FavoritesService().getUserFavorites(userId);
      
      return res.json({
        success: true,
        message: 'Favorites retrieved successfully',
        data: { favorites }
      });
    } catch (error: any) {
      console.error('Get favorites error:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to get favorites'
      });
    }
  });

  // POST /api/favorites - Add movie to favorites
  static addToFavorites = asyncHandler(async (req: AuthenticatedRequest, res: Response<ApiResponse>) => {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    const { movieId, movieType, provider } = req.body;

    if (!movieId || !movieType) {
      return res.status(400).json({
        success: false,
        message: 'movieId and movieType are required'
      });
    }

    if (!['movie', 'series'].includes(movieType)) {
      return res.status(400).json({
        success: false,
        message: 'movieType must be either "movie" or "series"'
      });
    }

    try {
      const favorite = await new FavoritesService().addToFavorites(
        userId, 
        movieId, 
        movieType as 'movie' | 'series', 
        provider || 'local'
      );
      
      return res.status(201).json({
        success: true,
        message: 'Movie added to favorites successfully',
        data: { favorite }
      });
    } catch (error: any) {
      console.error('Add to favorites error:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to add to favorites'
      });
    }
  });

  // DELETE /api/favorites/:movieId/:movieType - Remove movie from favorites
  static removeFromFavorites = asyncHandler(async (req: AuthenticatedRequest, res: Response<ApiResponse>) => {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    const { movieId, movieType } = req.params;

    if (!movieId || !movieType) {
      return res.status(400).json({
        success: false,
        message: 'movieId and movieType are required'
      });
    }

    if (!['movie', 'series'].includes(movieType)) {
      return res.status(400).json({
        success: false,
        message: 'movieType must be either "movie" or "series"'
      });
    }

    try {
      const removed = await new FavoritesService().removeFromFavorites(
        userId, 
        movieId, 
        movieType as 'movie' | 'series'
      );
      
      return res.json({
        success: true,
        message: 'Movie removed from favorites successfully',
        data: { removed }
      });
    } catch (error: any) {
      console.error('Remove from favorites error:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to remove from favorites'
      });
    }
  });

  // GET /api/favorites/check/:movieId/:movieType - Check if movie is favorited
  static checkFavorite = asyncHandler(async (req: AuthenticatedRequest, res: Response<ApiResponse>) => {
    const userId = req.user!.id; // Guaranteed to exist due to middleware

    const { movieId, movieType } = req.params;

    if (!movieId || !movieType) {
      return res.status(400).json({
        success: false,
        message: 'movieId and movieType are required'
      });
    }

    if (!['movie', 'series'].includes(movieType)) {
      return res.status(400).json({
        success: false,
        message: 'movieType must be either "movie" or "series"'
      });
    }

    try {
      const isFavorited = await new FavoritesService().isFavorited(
        userId, 
        movieId, 
        movieType as 'movie' | 'series'
      );
      
      return res.json({
        success: true,
        message: 'Favorite status retrieved successfully',
        data: { isFavorited }
      });
    } catch (error: any) {
      console.error('Check favorite error:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to check favorite status'
      });
    }
  });

  // GET /api/favorites/count - Get favorites count
  static getFavoritesCount = asyncHandler(async (req: AuthenticatedRequest, res: Response<ApiResponse>) => {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    try {
      const count = await new FavoritesService().getFavoritesCount(userId);
      
      return res.json({
        success: true,
        message: 'Favorites count retrieved successfully',
        data: { count }
      });
    } catch (error: any) {
      console.error('Get favorites count error:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to get favorites count'
      });
    }
  });

  // DELETE /api/favorites/clear - Clear all favorites
  static clearAllFavorites = asyncHandler(async (req: AuthenticatedRequest, res: Response<ApiResponse>) => {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    try {
      const removedCount = await new FavoritesService().clearAllFavorites(userId);
      
      return res.json({
        success: true,
        message: 'All favorites cleared successfully',
        data: { removedCount }
      });
    } catch (error: any) {
      console.error('Clear all favorites error:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to clear all favorites'
      });
    }
  });
}
