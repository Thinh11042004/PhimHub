import { Request, Response } from 'express';
import { GenreRepository } from '../models/GenreRepository';

export class GenreController {
    private static genreRepository: GenreRepository;

    private static getRepository(): GenreRepository {
        if (!GenreController.genreRepository) {
            GenreController.genreRepository = new GenreRepository();
        }
        return GenreController.genreRepository;
    }

    static async getAll(req: Request, res: Response): Promise<void> {
        try {
            const repository = GenreController.getRepository();
            const genres = await repository.getAll();
            res.json({
                success: true,
                data: genres
            });
        } catch (error) {
            console.error('Error fetching genres:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    static async getById(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const repository = GenreController.getRepository();
            const genre = await repository.findById(parseInt(id));
            
            if (!genre) {
                res.status(404).json({
                    success: false,
                    message: 'Genre not found'
                });
                return;
            }

            res.json({
                success: true,
                data: genre
            });
        } catch (error) {
            console.error('Error fetching genre:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
}
