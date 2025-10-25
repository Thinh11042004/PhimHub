import { Request, Response } from 'express';
import { CustomListService, CreateListRequest, UpdateListRequest } from '../services/CustomListService';

export class CustomListController {
  private customListService: CustomListService;

  constructor() {
    this.customListService = new CustomListService();
  }

  // Get all lists for the authenticated user
  public getUserLists = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const lists = await this.customListService.getUserLists(userId);
      res.json({ success: true, data: lists });
    } catch (error: any) {
      console.error('Error getting user lists:', error);
      res.status(500).json({ 
        success: false, 
        message: error.message || 'Failed to get user lists' 
      });
    }
  };

  // Get a specific list with items
  public getList = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const listId = parseInt(req.params.id);
      if (isNaN(listId)) {
        res.status(400).json({ success: false, message: 'Invalid list ID' });
        return;
      }

      const result = await this.customListService.getList(userId, listId);
      if (!result) {
        res.status(404).json({ success: false, message: 'List not found' });
        return;
      }

      res.json({ success: true, data: result });
    } catch (error: any) {
      console.error('Error getting list:', error);
      res.status(500).json({ 
        success: false, 
        message: error.message || 'Failed to get list' 
      });
    }
  };

  // Create a new list
  public createList = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { name, description, isPublic }: CreateListRequest = req.body;
      
      if (!name || name.trim().length === 0) {
        res.status(400).json({ success: false, message: 'List name is required' });
        return;
      }

      if (name.length > 255) {
        res.status(400).json({ success: false, message: 'List name is too long' });
        return;
      }

      if (description && description.length > 500) {
        res.status(400).json({ success: false, message: 'Description is too long' });
        return;
      }

      const list = await this.customListService.createList(userId, {
        name: name.trim(),
        description: description?.trim(),
        isPublic: isPublic || false
      });

      res.status(201).json({ success: true, data: list });
    } catch (error: any) {
      console.error('Error creating list:', error);
      res.status(500).json({ 
        success: false, 
        message: error.message || 'Failed to create list' 
      });
    }
  };

  // Update a list
  public updateList = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const listId = parseInt(req.params.id);
      if (isNaN(listId)) {
        res.status(400).json({ success: false, message: 'Invalid list ID' });
        return;
      }

      const { name, description, isPublic }: UpdateListRequest = req.body;
      
      if (name !== undefined && (name.trim().length === 0 || name.length > 255)) {
        res.status(400).json({ success: false, message: 'Invalid list name' });
        return;
      }

      if (description !== undefined && description.length > 500) {
        res.status(400).json({ success: false, message: 'Description is too long' });
        return;
      }

      const success = await this.customListService.updateList(userId, listId, {
        name: name?.trim(),
        description: description?.trim(),
        isPublic
      });

      if (!success) {
        res.status(404).json({ success: false, message: 'List not found' });
        return;
      }

      res.json({ success: true, message: 'List updated successfully' });
    } catch (error: any) {
      console.error('Error updating list:', error);
      res.status(500).json({ 
        success: false, 
        message: error.message || 'Failed to update list' 
      });
    }
  };

  // Delete a list
  public deleteList = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const listId = parseInt(req.params.id);
      if (isNaN(listId)) {
        res.status(400).json({ success: false, message: 'Invalid list ID' });
        return;
      }

      const success = await this.customListService.deleteList(userId, listId);
      if (!success) {
        res.status(404).json({ success: false, message: 'List not found' });
        return;
      }

      res.json({ success: true, message: 'List deleted successfully' });
    } catch (error: any) {
      console.error('Error deleting list:', error);
      res.status(500).json({ 
        success: false, 
        message: error.message || 'Failed to delete list' 
      });
    }
  };

  // Add movie to list
  public addMovieToList = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const listId = parseInt(req.params.id);
      if (isNaN(listId)) {
        res.status(400).json({ success: false, message: 'Invalid list ID' });
        return;
      }

      const { movieId, movieType } = req.body;
      
      if (!movieId) {
        res.status(400).json({ success: false, message: 'Movie ID is required' });
        return;
      }

      if (!movieType || !['movie', 'series'].includes(movieType)) {
        res.status(400).json({ success: false, message: 'Invalid movie type' });
        return;
      }

      const success = await this.customListService.addMovieToList(
        userId,
        listId,
        movieId,
        movieType
      );

      if (!success) {
        res.status(400).json({ success: false, message: 'Failed to add movie to list' });
        return;
      }

      res.json({ success: true, message: 'Movie added to list successfully' });
    } catch (error: any) {
      console.error('Error adding movie to list:', error);
      res.status(500).json({ 
        success: false, 
        message: error.message || 'Failed to add movie to list' 
      });
    }
  };

  // Remove movie from list
  public removeMovieFromList = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const listId = parseInt(req.params.id);
      if (isNaN(listId)) {
        res.status(400).json({ success: false, message: 'Invalid list ID' });
        return;
      }

      const { movieId, movieType } = req.body;
      
      if (!movieId) {
        res.status(400).json({ success: false, message: 'Movie ID is required' });
        return;
      }

      if (!movieType || !['movie', 'series'].includes(movieType)) {
        res.status(400).json({ success: false, message: 'Invalid movie type' });
        return;
      }

      const success = await this.customListService.removeMovieFromList(
        userId,
        listId,
        movieId,
        movieType
      );

      if (!success) {
        res.status(400).json({ success: false, message: 'Failed to remove movie from list' });
        return;
      }

      res.json({ success: true, message: 'Movie removed from list successfully' });
    } catch (error: any) {
      console.error('Error removing movie from list:', error);
      res.status(500).json({ 
        success: false, 
        message: error.message || 'Failed to remove movie from list' 
      });
    }
  };

  // Check if movie is in any list
  public checkMovieInLists = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { movieId, movieType } = req.query;
      
      if (!movieId) {
        res.status(400).json({ success: false, message: 'Movie ID is required' });
        return;
      }

      if (!movieType || !['movie', 'series'].includes(movieType as string)) {
        res.status(400).json({ success: false, message: 'Invalid movie type' });
        return;
      }

      const listIds = await this.customListService.isMovieInAnyList(
        userId,
        movieId as string,
        movieType as 'movie' | 'series'
      );

      res.json({ success: true, data: { listIds } });
    } catch (error: any) {
      console.error('Error checking movie in lists:', error);
      res.status(500).json({ 
        success: false, 
        message: error.message || 'Failed to check movie in lists' 
      });
    }
  };
}
