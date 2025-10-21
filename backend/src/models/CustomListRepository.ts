import { BaseRepository } from './BaseRepository';

export interface CustomList {
  id: number;
  user_id: number;
  name: string;
  description?: string;
  is_public: boolean;
  created_at: Date;
  updated_at: Date;
  item_count?: number;
}

export interface CustomListItem {
  id: number;
  list_id: number;
  content_id: number;
  added_at: Date;
  // Movie details
  movie_id?: number;
  slug?: string;
  title?: string;
  release_year?: number;
  duration?: number;
  age_rating?: string;
  thumbnail_url?: string;
  poster_url?: string;
  is_series?: boolean;
  rating?: number;
  overview?: string;
  categories?: string;
}

export class CustomListRepository extends BaseRepository<any> {
  // Get all lists for a user
  async findByUserId(userId: number): Promise<CustomList[]> {
    try {
      const query = `
        SELECT 
          cl.id,
          cl.user_id,
          cl.name,
          cl.description,
          cl.is_public,
          cl.created_at,
          cl.updated_at,
          COUNT(cli.id) as item_count
        FROM custom_lists cl
        LEFT JOIN custom_list_items cli ON cl.id = cli.list_id
        WHERE cl.user_id = @userId
        GROUP BY cl.id, cl.user_id, cl.name, cl.description, cl.is_public, cl.created_at, cl.updated_at
        ORDER BY cl.created_at DESC
      `;
      
      const result = await this.executeQueryWithNamedParams(query, { userId });
      return result.recordset.map((row: any) => ({
        id: row.id,
        user_id: row.user_id,
        name: row.name,
        description: row.description,
        is_public: row.is_public,
        created_at: row.created_at,
        updated_at: row.updated_at,
        item_count: row.item_count || 0
      }));
    } catch (error: any) {
      console.error('Error finding custom lists by user ID:', error);
      throw new Error(`Failed to find custom lists: ${error.message || error}`);
    }
  }

  // Get a specific list by ID
  async findById(listId: number, userId: number): Promise<CustomList | null> {
    try {
      const query = `
        SELECT 
          cl.id,
          cl.user_id,
          cl.name,
          cl.description,
          cl.is_public,
          cl.created_at,
          cl.updated_at,
          COUNT(cli.id) as item_count
        FROM custom_lists cl
        LEFT JOIN custom_list_items cli ON cl.id = cli.list_id
        WHERE cl.id = @listId AND cl.user_id = @userId
        GROUP BY cl.id, cl.user_id, cl.name, cl.description, cl.is_public, cl.created_at, cl.updated_at
      `;
      
      const result = await this.executeQueryWithNamedParams(query, { listId, userId });
      if (result.recordset.length === 0) return null;
      
      const row = result.recordset[0] as any;
      return {
        id: row.id,
        user_id: row.user_id,
        name: row.name,
        description: row.description,
        is_public: row.is_public,
        created_at: row.created_at,
        updated_at: row.updated_at,
        item_count: row.item_count || 0
      };
    } catch (error: any) {
      console.error('Error finding custom list by ID:', error);
      throw new Error(`Failed to find custom list: ${error.message || error}`);
    }
  }

  // Create a new list
  async create(userId: number, name: string, description?: string, isPublic: boolean = false): Promise<number> {
    try {
      const query = `
        INSERT INTO custom_lists (user_id, name, description, is_public)
        OUTPUT INSERTED.id
        VALUES (@userId, @name, @description, @isPublic)
      `;
      
      const result = await this.executeQueryWithNamedParams(query, {
        userId,
        name,
        description: description || null,
        isPublic
      });
      
      if (result.recordset.length === 0) {
        throw new Error('Failed to create custom list');
      }
      
      return result.recordset[0].id;
    } catch (error: any) {
      console.error('Error creating custom list:', error);
      throw new Error(`Failed to create custom list: ${error.message || error}`);
    }
  }

  // Update a list
  async update(listId: number, userId: number, name?: string, description?: string, isPublic?: boolean): Promise<boolean> {
    try {
      const updates: string[] = [];
      const params: any = { listId, userId };
      
      if (name !== undefined) {
        updates.push('name = @name');
        params.name = name;
      }
      if (description !== undefined) {
        updates.push('description = @description');
        params.description = description;
      }
      if (isPublic !== undefined) {
        updates.push('is_public = @isPublic');
        params.isPublic = isPublic;
      }
      
      if (updates.length === 0) return true;
      
      updates.push('updated_at = GETDATE()');
      
      const query = `
        UPDATE custom_lists 
        SET ${updates.join(', ')}
        WHERE id = @listId AND user_id = @userId
      `;
      
      const result = await this.executeQueryWithNamedParams(query, params);
      return result.rowsAffected[0] > 0;
    } catch (error: any) {
      console.error('Error updating custom list:', error);
      throw new Error(`Failed to update custom list: ${error.message || error}`);
    }
  }

  // Delete a list
  async delete(listId: number, userId: number): Promise<boolean> {
    try {
      const query = `
        DELETE FROM custom_lists 
        WHERE id = @listId AND user_id = @userId
      `;
      
      const result = await this.executeQueryWithNamedParams(query, { listId, userId });
      return result.rowsAffected[0] > 0;
    } catch (error: any) {
      console.error('Error deleting custom list:', error);
      throw new Error(`Failed to delete custom list: ${error.message || error}`);
    }
  }

  // Get items in a list
  async getListItems(listId: number, userId: number): Promise<CustomListItem[]> {
    try {
      const query = `
        SELECT 
          cli.id,
          cli.list_id,
          cli.content_id,
          cli.added_at,
          c.movie_id,
          m.slug,
          m.title,
          m.release_year,
          m.duration,
          m.age_rating,
          m.thumbnail_url,
          m.poster_url,
          m.is_series,
          m.external_rating as rating,
          m.description as overview,
          m.categories
        FROM custom_list_items cli
        INNER JOIN custom_lists cl ON cli.list_id = cl.id
        INNER JOIN contents c ON cli.content_id = c.id
        INNER JOIN movies m ON c.movie_id = m.id
        WHERE cli.list_id = @listId AND cl.user_id = @userId
        ORDER BY cli.added_at DESC
      `;
      
      const result = await this.executeQueryWithNamedParams(query, { listId, userId });
      return result.recordset.map((row: any) => ({
        id: row.id,
        list_id: row.list_id,
        content_id: row.content_id,
        added_at: row.added_at,
        movie_id: row.movie_id,
        slug: row.slug,
        title: row.title,
        release_year: row.release_year,
        duration: row.duration,
        age_rating: row.age_rating,
        thumbnail_url: row.thumbnail_url,
        poster_url: row.poster_url,
        is_series: row.is_series,
        rating: row.rating,
        overview: row.overview,
        categories: row.categories
      }));
    } catch (error: any) {
      console.error('Error getting list items:', error);
      throw new Error(`Failed to get list items: ${error.message || error}`);
    }
  }

  // Add item to list
  async addItem(listId: number, contentId: number): Promise<boolean> {
    try {
      const query = `
        INSERT INTO custom_list_items (list_id, content_id)
        VALUES (@listId, @contentId)
      `;
      
      const result = await this.executeQueryWithNamedParams(query, { listId, contentId });
      return result.rowsAffected[0] > 0;
    } catch (error: any) {
      console.error('Error adding item to list:', error);
      throw new Error(`Failed to add item to list: ${error.message || error}`);
    }
  }

  // Remove item from list
  async removeItem(listId: number, contentId: number): Promise<boolean> {
    try {
      const query = `
        DELETE FROM custom_list_items 
        WHERE list_id = @listId AND content_id = @contentId
      `;
      
      const result = await this.executeQueryWithNamedParams(query, { listId, contentId });
      return result.rowsAffected[0] > 0;
    } catch (error: any) {
      console.error('Error removing item from list:', error);
      throw new Error(`Failed to remove item from list: ${error.message || error}`);
    }
  }

  // Check if item exists in list
  async hasItem(listId: number, contentId: number): Promise<boolean> {
    try {
      const query = `
        SELECT COUNT(*) as count
        FROM custom_list_items 
        WHERE list_id = @listId AND content_id = @contentId
      `;
      
      const result = await this.executeQueryWithNamedParams(query, { listId, contentId });
      return result.recordset[0].count > 0;
    } catch (error: any) {
      console.error('Error checking if item exists in list:', error);
      return false;
    }
  }
}
