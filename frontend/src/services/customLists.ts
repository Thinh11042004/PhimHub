import { http } from '../shared/lib/http';

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

class CustomListsService {
  private baseUrl = `/custom-lists`;

  async getUserLists(): Promise<CustomList[]> {
    const res = await http.get(`${this.baseUrl}/`);
    return res.data;
  }

  async getList(listId: number): Promise<{ list: CustomList; items: ListItem[] }> {
    const res = await http.get(`${this.baseUrl}/${listId}`);
    return res.data;
  }

  async createList(request: CreateListRequest): Promise<CustomList> {
    const res = await http.post(`${this.baseUrl}/`, request);
    return res.data;
  }

  async updateList(listId: number, request: UpdateListRequest): Promise<void> {
    await http.put(`${this.baseUrl}/${listId}`, request);
  }

  async deleteList(listId: number): Promise<void> {
    await http.delete(`${this.baseUrl}/${listId}`);
  }

  async addMovieToList(listId: number, request: AddMovieRequest): Promise<void> {
    await http.post(`${this.baseUrl}/${listId}/items`, request);
  }

  async removeMovieFromList(listId: number, request: AddMovieRequest): Promise<void> {
    await http.request({
      url: `${this.baseUrl}/${listId}/items`,
      method: 'DELETE',
      data: request,
    });
  }

  async checkMovieInLists(movieId: string, movieType: 'movie' | 'series'): Promise<number[]> {
    const res = await http.get(`${this.baseUrl}/check/movie`, { params: { movieId, movieType } });
    return res.data.listIds;
  }
}

export const customListsService = new CustomListsService();
