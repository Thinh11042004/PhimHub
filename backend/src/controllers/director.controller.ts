import { Request, Response, NextFunction } from 'express';
import { DirectorService } from '../services/director.service';
import { asyncHandler } from '../middlewares/error.middleware';

export class DirectorController {
  private directorService: DirectorService;

  constructor() {
    this.directorService = new DirectorService();
  }

  // GET /api/directors - Get all directors with pagination
  getAll = asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    
    const result = await this.directorService.getAllDirectors(page, limit);
    
    return res.json({
      success: true,
      message: 'Directors retrieved successfully',
      data: result
    });
  });

  // GET /api/directors/search - Search directors by name
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
    
    const directors = await this.directorService.searchDirectors(query, limit);
    
    return res.json({
      success: true,
      message: 'Directors search completed',
      data: directors
    });
  });

  // GET /api/directors/:id - Get director by ID with movies
  getById = asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid director ID'
      });
    }
    
    const director = await this.directorService.getDirectorById(id);
    
    if (!director) {
      return res.status(404).json({
        success: false,
        message: 'Director not found'
      });
    }
    
    return res.json({
      success: true,
      message: 'Director retrieved successfully',
      data: director
    });
  });

  // GET /api/directors/:id/stats - Get director statistics
  getStats = asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid director ID'
      });
    }
    
    const stats = await this.directorService.getDirectorStats(id);
    
    return res.json({
      success: true,
      message: 'Director statistics retrieved successfully',
      data: stats
    });
  });

  // GET /api/directors/:id/movies - Get movies by director ID
  getMoviesByDirector = asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid director ID'
      });
    }
    
    const movies = await this.directorService.getMoviesByDirector(id);
    
    return res.json({
      success: true,
      message: 'Director movies retrieved successfully',
      data: movies
    });
  });

  // POST /api/directors - Create new director (Admin only)
  create = asyncHandler(async (req: Request, res: Response) => {
    const { name, dob, nationality, photo_url } = req.body;
    
    if (!name || name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Director name is required'
      });
    }
    
    const directorData = {
      name: name.trim(),
      dob: dob || null,
      nationality: nationality || null,
      photo_url: photo_url || null
    };
    
    const director = await this.directorService.createDirector(directorData);
    
    return res.status(201).json({
      success: true,
      message: 'Director created successfully',
      data: director
    });
  });

  // PUT /api/directors/:id - Update director (Admin only)
  update = asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    const { name, dob, nationality, photo_url } = req.body;
    
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid director ID'
      });
    }
    
    if (!name || name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Director name is required'
      });
    }
    
    const directorData = {
      name: name.trim(),
      dob: dob || null,
      nationality: nationality || null,
      photo_url: photo_url || null
    };
    
    const director = await this.directorService.updateDirector(id, directorData);
    
    if (!director) {
      return res.status(404).json({
        success: false,
        message: 'Director not found'
      });
    }
    
    return res.json({
      success: true,
      message: 'Director updated successfully',
      data: director
    });
  });

  // DELETE /api/directors/:id - Delete director (Admin only)
  delete = asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid director ID'
      });
    }
    
    const deleted = await this.directorService.deleteDirector(id);
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Director not found'
      });
    }
    
    return res.json({
      success: true,
      message: 'Director deleted successfully'
    });
  });

  // GET /api/directors/selection - Get directors for selection (exclude already selected)
  getForSelection = asyncHandler(async (req: Request, res: Response) => {
    const excludeIds = req.query.exclude ? (req.query.exclude as string).split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id)) : [];
    const search = req.query.search as string || '';
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    
    const directors = await this.directorService.getDirectorsForSelection(excludeIds, search, limit);
    
    return res.json({
      success: true,
      message: 'Directors for selection retrieved successfully',
      data: directors
    });
  });
}

// export const directorController = new DirectorController(); // Removed to avoid initialization issues
