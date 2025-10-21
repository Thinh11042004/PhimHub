import { Request, Response } from 'express';
import { ActorService } from '../services/actor.service';
import { asyncHandler } from '../middlewares/error.middleware';

export class ActorController {
  private actorService: ActorService;

  constructor() {
    this.actorService = new ActorService();
  }

  // GET /api/actors - Get all actors with pagination
  getAll = asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    
    const result = await this.actorService.getAllActors(page, limit);
    
    return res.json({
      success: true,
      message: 'Actors retrieved successfully',
      data: result
    });
  });

  // GET /api/actors/search - Search actors by name
  search = asyncHandler(async (req: Request, res: Response) => {
    const query = req.query.q as string;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
    
    if (!query || query.trim().length < 2) {
      return res.json({
        success: true,
        message: 'Search query too short',
        data: []
      });
    }
    
    const actors = await this.actorService.searchActors(query, limit);
    
    return res.json({
      success: true,
      message: 'Actors search completed',
      data: actors
    });
  });

  // GET /api/actors/:id - Get actor by ID with movies
  getById = asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid actor ID'
      });
    }
    
    const actor = await this.actorService.getActorById(id);
    
    if (!actor) {
      return res.status(404).json({
        success: false,
        message: 'Actor not found'
      });
    }
    
    return res.json({
      success: true,
      message: 'Actor retrieved successfully',
      data: actor
    });
  });

  // GET /api/actors/:id/stats - Get actor statistics
  getStats = asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid actor ID'
      });
    }
    
    const stats = await this.actorService.getActorStats(id);
    
    return res.json({
      success: true,
      message: 'Actor statistics retrieved successfully',
      data: stats
    });
  });

  // POST /api/actors - Create new actor (Admin only)
  create = asyncHandler(async (req: Request, res: Response) => {
    const { name, dob, nationality, photo_url } = req.body;
    
    if (!name || name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Actor name is required'
      });
    }
    
    const actorData = {
      name: name.trim(),
      dob: dob || null,
      nationality: nationality || null,
      photo_url: photo_url || null
    };
    
    const actor = await this.actorService.createActor(actorData);
    
    return res.status(201).json({
      success: true,
      message: 'Actor created successfully',
      data: actor
    });
  });

  // PUT /api/actors/:id - Update actor (Admin only)
  update = asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid actor ID'
      });
    }
    
    const { name, dob, nationality, photo_url } = req.body;
    
    const updateData: any = {};
    if (name !== undefined) updateData.name = name.trim();
    if (dob !== undefined) updateData.dob = dob;
    if (nationality !== undefined) updateData.nationality = nationality;
    if (photo_url !== undefined) updateData.photo_url = photo_url;
    
    const actor = await this.actorService.updateActor(id, updateData);
    
    if (!actor) {
      return res.status(404).json({
        success: false,
        message: 'Actor not found'
      });
    }
    
    return res.json({
      success: true,
      message: 'Actor updated successfully',
      data: actor
    });
  });

  // DELETE /api/actors/:id - Delete actor (Admin only)
  delete = asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid actor ID'
      });
    }
    
    const deleted = await this.actorService.deleteActor(id);
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Actor not found'
      });
    }
    
    return res.json({
      success: true,
      message: 'Actor deleted successfully'
    });
  });

  // GET /api/actors/selection - Get actors for selection (exclude already selected)
  getForSelection = asyncHandler(async (req: Request, res: Response) => {
    const excludeIds = req.query.exclude ? (req.query.exclude as string).split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id)) : [];
    const search = req.query.search as string || '';
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    
    const actors = await this.actorService.getActorsForSelection(excludeIds, search, limit);
    
    return res.json({
      success: true,
      message: 'Actors for selection retrieved successfully',
      data: actors
    });
  });
}
