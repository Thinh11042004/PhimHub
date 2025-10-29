import { Request, Response } from 'express';
import { WatchHistoryService } from '../models/WatchHistoryService';
import { asyncHandler } from '../middlewares/error.middleware';
import { ApiResponse } from '../types';

export class WatchHistoryController {
  /**
   * Get watch history for a user
   */
  static getHistory = asyncHandler(async (req: Request, res: Response<ApiResponse>) => {
    const { userId } = req.params;
    
    if (!userId || isNaN(parseInt(userId))) {
      return res.status(400).json({
        success: false,
        message: 'Valid user ID is required'
      });
    }

    try {
      const history = await WatchHistoryService.findByUserId(parseInt(userId));

      return res.json({
        success: true,
        message: 'Watch history retrieved successfully',
        data: { history }
      });
    } catch (error: any) {
      console.error('Get watch history error:', error);
      // Return empty history instead of error for better UX
      return res.json({
        success: true,
        message: 'Watch history retrieved successfully',
        data: { history: [] }
      });
    }
  });

  /**
   * Add or update watch history
   */
  static addToHistory = asyncHandler(async (req: Request, res: Response<ApiResponse>) => {
    const { userId, contentId, progress, device, episode_number } = req.body;
    
    if (!userId || !contentId) {
      return res.status(400).json({
        success: false,
        message: 'User ID and content ID are required'
      });
    }

    try {
      const watchHistory = await WatchHistoryService.createOrUpdate({
        user_id: parseInt(userId),
        content_id: parseInt(contentId),
        progress: progress || 0,
        device: device || 'web',
        episode_number: episode_number || null
      });

      return res.json({
        success: true,
        message: 'Watch history updated successfully',
        data: watchHistory
      });
    } catch (error: any) {
      console.error('Add to watch history error:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to update watch history'
      });
    }
  });

  /**
   * Remove from watch history
   */
  static removeFromHistory = asyncHandler(async (req: Request, res: Response<ApiResponse>) => {
    const { userId, movieId } = req.params;
    
    if (!userId || !movieId) {
      return res.status(400).json({
        success: false,
        message: 'User ID and content ID are required'
      });
    }

    try {
      const deleted = await WatchHistoryService.deleteByUserAndContent(
        parseInt(userId), 
        parseInt(movieId)
      );

      if (deleted) {
        return res.json({
          success: true,
          message: 'Removed from watch history successfully'
        });
      } else {
        return res.status(404).json({
          success: false,
          message: 'Watch history record not found'
        });
      }
    } catch (error: any) {
      console.error('Remove from watch history error:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to remove from watch history'
      });
    }
  });

  /**
   * Clear all watch history for a user
   */
  static clearHistory = asyncHandler(async (req: Request, res: Response<ApiResponse>) => {
    const { userId } = req.params;
    
    if (!userId || isNaN(parseInt(userId))) {
      return res.status(400).json({
        success: false,
        message: 'Valid user ID is required'
      });
    }

    try {
      const deleted = await WatchHistoryService.deleteByUserId(parseInt(userId));

      return res.json({
        success: true,
        message: 'Watch history cleared successfully',
        data: { deleted }
      });
    } catch (error: any) {
      console.error('Clear watch history error:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to clear watch history'
      });
    }
  });
}
