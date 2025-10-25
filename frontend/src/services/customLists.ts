export interface CustomList {
  id: number;
  name: string;
  description?: string;
  isPublic: boolean;
  itemCount: number;
  createdAt: string;
  updatedAt: string;
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

export interface AddMovieRequest {
  movieId: string;
  movieType: 'movie' | 'series';
}

export interface MovieInListsResponse {
  listIds: number[];
}

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('phimhub:token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001/api';

class CustomListsService {
  private baseUrl = `${API_BASE}/custom-lists`;

  // Get all lists for the authenticated user
  async getUserLists(): Promise<CustomList[]> {
    try {
      const response = await fetch(`${this.baseUrl}/`, {
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        credentials: 'include'
      });
      const json = await response.json();
      return json.data;
    } catch (error: any) {
      console.error('Error getting user lists:', error);
      throw new Error('Failed to get user lists');
    }
  }

  // Get a specific list with items
  async getList(listId: number): Promise<{ list: CustomList; items: ListItem[] }> {
    try {
      const response = await fetch(`${this.baseUrl}/${listId}`, {
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        credentials: 'include'
      });
      const json = await response.json();
      return json.data;
    } catch (error: any) {
      console.error('Error getting list:', error);
      throw new Error('Failed to get list');
    }
  }

  // Create a new list
  async createList(request: CreateListRequest): Promise<CustomList> {
    try {
      const response = await fetch(`${this.baseUrl}/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify(request),
        credentials: 'include'
      });
      const json = await response.json();
      return json.data;
    } catch (error: any) {
      console.error('Error creating list:', error);
      throw new Error('Failed to create list');
    }
  }

  // Update a list
  async updateList(listId: number, request: UpdateListRequest): Promise<void> {
    try {
      await fetch(`${this.baseUrl}/${listId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify(request),
        credentials: 'include'
      });
    } catch (error: any) {
      console.error('Error updating list:', error);
      throw new Error('Failed to update list');
    }
  }

  // Delete a list
  async deleteList(listId: number): Promise<void> {
    try {
      await fetch(`${this.baseUrl}/${listId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        credentials: 'include'
      });
    } catch (error: any) {
      console.error('Error deleting list:', error);
      throw new Error('Failed to delete list');
    }
  }

  // Add movie to list
  async addMovieToList(listId: number, request: AddMovieRequest): Promise<void> {
    try {
      await fetch(`${this.baseUrl}/${listId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify(request),
        credentials: 'include'
      });
    } catch (error: any) {
      console.error('Error adding movie to list:', error);
      throw new Error('Failed to add movie to list');
    }
  }

  // Remove movie from list
  async removeMovieFromList(listId: number, request: AddMovieRequest): Promise<void> {
    try {
      await fetch(`${this.baseUrl}/${listId}/items`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify(request),
        credentials: 'include'
      });
    } catch (error: any) {
      console.error('Error removing movie from list:', error);
      throw new Error('Failed to remove movie from list');
    }
  }

  // Check if movie is in any list
  async checkMovieInLists(movieId: string, movieType: 'movie' | 'series'): Promise<number[]> {
    try {
      const response = await fetch(`${this.baseUrl}/check/movie?movieId=${movieId}&movieType=${movieType}`, {
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        credentials: 'include'
      });
      const json = await response.json();
      return json.data.listIds;
    } catch (error: any) {
      console.error('Error checking movie in lists:', error);
      return [];
    }
  }
}

export const customListsService = new CustomListsService();
