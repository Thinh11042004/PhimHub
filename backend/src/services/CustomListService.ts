import { CustomListRepository, CustomList, CustomListItem } from '../models/CustomListRepository';
import { FavoritesRepository } from '../models/FavoritesRepository';

export interface CreateListRequest {
  name: string;
  description?: string;
  isPublic?: boolean;
}

export interface UpdateListRequest {
  name?: string;
  description?: string;
  isPublic?: boolean;
}

export interface ListItem {
  id: number;
  movieId: number;
  slug: string;
  title: string;
  year: number;
  poster: string;
  genres: string[];
  duration: number;
  rating: number;
  age: string;
  overview: string;
  isSeries: boolean;
  addedAt: string;
}

export interface ListSummary {
  id: number;
  name: string;
  description?: string;
  isPublic: boolean;
  itemCount: number;
  createdAt: string;
  updatedAt: string;
}

export class CustomListService {
  private customListRepository: CustomListRepository;
  private favoritesRepository: FavoritesRepository;

  constructor() {
    this.customListRepository = new CustomListRepository();
    this.favoritesRepository = new FavoritesRepository();
  }

  // Get all lists for a user
  async getUserLists(userId: number): Promise<ListSummary[]> {
    try {
      const lists = await this.customListRepository.findByUserId(userId);
      return lists.map(list => ({
        id: list.id,
        name: list.name,
        description: list.description,
        isPublic: list.is_public,
        itemCount: list.item_count || 0,
        createdAt: list.created_at.toISOString(),
        updatedAt: list.updated_at?.toISOString() || list.created_at.toISOString()
      }));
    } catch (error: any) {
      console.error('Error getting user lists:', error);
      throw new Error(`Failed to get user lists: ${error.message || error}`);
    }
  }

  // Get a specific list with items
  async getList(userId: number, listId: number): Promise<{ list: ListSummary; items: ListItem[] } | null> {
    try {
      const list = await this.customListRepository.findById(listId, userId);
      if (!list) return null;

      const items = await this.customListRepository.getListItems(listId, userId);
      
      const listSummary: ListSummary = {
        id: list.id,
        name: list.name,
        description: list.description,
        isPublic: list.is_public,
        itemCount: list.item_count || 0,
        createdAt: list.created_at.toISOString(),
        updatedAt: list.updated_at?.toISOString() || list.created_at.toISOString()
      };

      const listItems: ListItem[] = items.map(item => ({
        id: item.id,
        movieId: item.movie_id!,
        slug: item.slug!,
        title: item.title!,
        year: item.release_year!,
        poster: item.poster_url || item.thumbnail_url || '',
        genres: this.parseGenres(item.categories),
        duration: item.duration || 0,
        rating: item.rating || 0,
        age: item.age_rating || '',
        overview: item.overview || '',
        isSeries: item.is_series || false,
        addedAt: item.added_at.toISOString()
      }));

      return { list: listSummary, items: listItems };
    } catch (error: any) {
      console.error('Error getting list:', error);
      throw new Error(`Failed to get list: ${error.message || error}`);
    }
  }

  // Create a new list
  async createList(userId: number, request: CreateListRequest): Promise<ListSummary> {
    try {
      const listId = await this.customListRepository.create(
        userId,
        request.name,
        request.description,
        request.isPublic || false
      );

      const list = await this.customListRepository.findById(listId, userId);
      if (!list) {
        throw new Error('Failed to retrieve created list');
      }

      return {
        id: list.id,
        name: list.name,
        description: list.description,
        isPublic: list.is_public,
        itemCount: 0,
        createdAt: list.created_at.toISOString(),
        updatedAt: list.updated_at?.toISOString() || list.created_at.toISOString()
      };
    } catch (error: any) {
      console.error('Error creating list:', error);
      throw new Error(`Failed to create list: ${error.message || error}`);
    }
  }

  // Update a list
  async updateList(userId: number, listId: number, request: UpdateListRequest): Promise<boolean> {
    try {
      return await this.customListRepository.update(
        listId,
        userId,
        request.name,
        request.description,
        request.isPublic
      );
    } catch (error: any) {
      console.error('Error updating list:', error);
      throw new Error(`Failed to update list: ${error.message || error}`);
    }
  }

  // Delete a list
  async deleteList(userId: number, listId: number): Promise<boolean> {
    try {
      return await this.customListRepository.delete(listId, userId);
    } catch (error: any) {
      console.error('Error deleting list:', error);
      throw new Error(`Failed to delete list: ${error.message || error}`);
    }
  }

  // Add movie to list
  async addMovieToList(userId: number, listId: number, movieId: string, movieType: 'movie' | 'series'): Promise<boolean> {
    try {
      // Verify list belongs to user
      const list = await this.customListRepository.findById(listId, userId);
      if (!list) {
        throw new Error('List not found or access denied');
      }

      // Get or create content record
      let movieIdNum: number;
      const parsedId = parseInt(movieId);
      if (!isNaN(parsedId)) {
        movieIdNum = parsedId;
      } else {
        const foundId = await this.favoritesRepository.findMovieIdBySlug(movieId);
        if (!foundId) {
          throw new Error(`Movie with slug '${movieId}' not found`);
        }
        movieIdNum = foundId;
      }

      const contentId = await this.favoritesRepository.getOrCreateContent(
        movieIdNum,
        movieType === 'series' ? 'episode' : 'movie'
      );

      // Check if item already exists in list
      const exists = await this.customListRepository.hasItem(listId, contentId);
      if (exists) {
        throw new Error('Movie already exists in this list');
      }

      // Add item to list
      return await this.customListRepository.addItem(listId, contentId);
    } catch (error: any) {
      console.error('Error adding movie to list:', error);
      throw new Error(`Failed to add movie to list: ${error.message || error}`);
    }
  }

  // Remove movie from list
  async removeMovieFromList(userId: number, listId: number, movieId: string, movieType: 'movie' | 'series'): Promise<boolean> {
    try {
      // Verify list belongs to user
      const list = await this.customListRepository.findById(listId, userId);
      if (!list) {
        throw new Error('List not found or access denied');
      }

      // Find content ID
      let movieIdNum: number;
      const parsedId = parseInt(movieId);
      if (!isNaN(parsedId)) {
        movieIdNum = parsedId;
      } else {
        const foundId = await this.favoritesRepository.findMovieIdBySlug(movieId);
        if (!foundId) {
          throw new Error(`Movie with slug '${movieId}' not found`);
        }
        movieIdNum = foundId;
      }

      const contentId = await this.favoritesRepository.findContentByMovieId(
        movieIdNum,
        movieType === 'series' ? 'episode' : 'movie'
      );

      if (!contentId) {
        throw new Error('Content not found');
      }

      // Remove item from list
      return await this.customListRepository.removeItem(listId, contentId);
    } catch (error: any) {
      console.error('Error removing movie from list:', error);
      throw new Error(`Failed to remove movie from list: ${error.message || error}`);
    }
  }

  // Check if movie is in any list
  async isMovieInAnyList(userId: number, movieId: string, movieType: 'movie' | 'series'): Promise<number[]> {
    try {
      // Find content ID
      let movieIdNum: number;
      const parsedId = parseInt(movieId);
      if (!isNaN(parsedId)) {
        movieIdNum = parsedId;
      } else {
        const foundId = await this.favoritesRepository.findMovieIdBySlug(movieId);
        if (!foundId) {
          return [];
        }
        movieIdNum = foundId;
      }

      const contentId = await this.favoritesRepository.findContentByMovieId(
        movieIdNum,
        movieType === 'series' ? 'episode' : 'movie'
      );

      if (!contentId) {
        return [];
      }

      // Get all user lists
      const lists = await this.customListRepository.findByUserId(userId);
      const listIds: number[] = [];

      for (const list of lists) {
        const hasItem = await this.customListRepository.hasItem(list.id, contentId);
        if (hasItem) {
          listIds.push(list.id);
        }
      }

      return listIds;
    } catch (error: any) {
      console.error('Error checking if movie is in any list:', error);
      return [];
    }
  }

  // Helper method to parse genres
  private parseGenres(categories: string | undefined): string[] {
    if (!categories) return [];
    try {
      const parsed = JSON.parse(categories);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
}
