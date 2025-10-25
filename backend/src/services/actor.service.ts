import { ActorRepository, Actor, ActorWithMovies } from '../models/ActorRepository';

export class ActorService {
  private actorRepository: ActorRepository;

  constructor() {
    this.actorRepository = new ActorRepository();
  }

  async getAllActors(page: number = 1, limit: number = 20): Promise<{ actors: Actor[]; total: number; page: number; totalPages: number }> {
    const offset = (page - 1) * limit;
    const actors = await this.actorRepository.findAll(limit, offset);
    const total = await this.actorRepository.count();
    const totalPages = Math.ceil(total / limit);

    return {
      actors,
      total,
      page,
      totalPages
    };
  }

  async getActorById(id: number): Promise<ActorWithMovies | null> {
    return await this.actorRepository.findByIdWithMovies(id);
  }

  async getActorByName(name: string): Promise<Actor | null> {
    return await this.actorRepository.findByName(name);
  }

  async searchActors(query: string, limit: number = 20): Promise<Actor[]> {
    if (!query || query.trim().length < 2) {
      return [];
    }
    
    return await this.actorRepository.search(query.trim(), limit);
  }

  async createActor(actorData: Omit<Actor, 'id' | 'created_at' | 'updated_at'>): Promise<Actor> {
    // Check if actor with same name already exists
    const existingActor = await this.actorRepository.findByName(actorData.name);
    if (existingActor) {
      throw new Error('Actor with this name already exists');
    }

    return await this.actorRepository.create(actorData);
  }

  async updateActor(id: number, actorData: Partial<Omit<Actor, 'id' | 'created_at' | 'updated_at'>>): Promise<Actor | null> {
    // Check if actor exists
    const existingActor = await this.actorRepository.findById(id);
    if (!existingActor) {
      throw new Error('Actor not found');
    }

    // If updating name, check for duplicates
    if (actorData.name && actorData.name !== existingActor.name) {
      const duplicateActor = await this.actorRepository.findByName(actorData.name);
      if (duplicateActor && duplicateActor.id !== id) {
        throw new Error('Actor with this name already exists');
      }
    }

    return await this.actorRepository.update(id, actorData);
  }

  async deleteActor(id: number): Promise<boolean> {
    const existingActor = await this.actorRepository.findById(id);
    if (!existingActor) {
      throw new Error('Actor not found');
    }

    return await this.actorRepository.delete(id);
  }

  async getActorStats(id: number): Promise<{ movieCount: number; totalViews: number }> {
    const actorWithMovies = await this.actorRepository.findByIdWithMovies(id);
    if (!actorWithMovies) {
      throw new Error('Actor not found');
    }

    const movieCount = actorWithMovies.movies.length;
    // Note: totalViews would need to be calculated from movie view counts
    // For now, we'll return 0 as we don't have view tracking per movie
    const totalViews = 0;

    return {
      movieCount,
      totalViews
    };
  }
}
