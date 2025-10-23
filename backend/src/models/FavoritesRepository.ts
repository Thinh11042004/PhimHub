import { BaseRepository } from './BaseRepository';

export interface Favorite {
  user_id: number;
  content_id: number;
  added_at: Date;
}

export interface Content {
  id: number;
  content_type: 'movie' | 'episode';
  movie_id: number | null;
  episode_id: number | null;
  created_at: Date;
}

export interface CreateFavoriteData {
  user_id: number;
  content_id: number;
}

export class FavoritesRepository extends BaseRepository<Favorite> {
  constructor() {
    super();
  }

  // Get all favorites for a user with content details
  async findByUserId(userId: number): Promise<any[]> {
    const query = `
      SELECT 
        f.user_id,
        f.content_id,
        f.added_at,
        c.content_type,
        c.movie_id,
        c.episode_id,
        m.title,
        m.release_year,
        m.duration,
        m.age_rating,
        m.thumbnail_url,
        COALESCE(m.thumbnail_url, m.banner_url) AS poster_url,
        m.is_series,
        m.slug
      FROM favorites f
      INNER JOIN contents c ON f.content_id = c.id
      LEFT JOIN movies m ON c.movie_id = m.id
      WHERE f.user_id = @userId
      ORDER BY f.added_at DESC
    `;
    
    const result = await this.executeQueryWithNamedParams(query, { userId });
    return result.recordset;
  }

  // Check if a content is favorited by user
  async isFavorited(userId: number, contentId: number): Promise<boolean> {
    const query = `
      SELECT COUNT(*) as count
      FROM favorites 
      WHERE user_id = @userId AND content_id = @contentId
    `;
    
    const result = await this.executeQueryWithNamedParams(query, { 
      userId, 
      contentId 
    });
    
    return result.recordset[0].count > 0;
  }

  // Add a favorite
  async create(data: CreateFavoriteData): Promise<Favorite> {
    const query = `
      INSERT INTO favorites (user_id, content_id)
      OUTPUT INSERTED.user_id, INSERTED.content_id, INSERTED.added_at
      VALUES (@userId, @contentId)
    `;
    
    const result = await this.executeQueryWithNamedParams(query, {
      userId: data.user_id,
      contentId: data.content_id
    });
    
    return result.recordset[0];
  }

  // Remove a favorite
  async remove(userId: number, contentId: number): Promise<boolean> {
    const query = `
      DELETE FROM favorites 
      WHERE user_id = @userId AND content_id = @contentId
    `;
    
    const result = await this.executeQueryWithNamedParams(query, {
      userId,
      contentId
    });
    
    return result.rowsAffected[0] > 0;
  }

  // Remove all favorites for a user
  async removeAllByUserId(userId: number): Promise<number> {
    const query = `
      DELETE FROM favorites 
      WHERE user_id = @userId
    `;
    
    const result = await this.executeQueryWithNamedParams(query, { userId });
    return result.rowsAffected[0];
  }

  // Remove favorite by slug (for orphaned favorites)
  async removeFavoriteBySlug(userId: number, slug: string, contentType: 'movie' | 'episode'): Promise<boolean> {
    // Try to find the favorite by slug
    const findQuery = `
      SELECT f.content_id FROM favorites f
      INNER JOIN contents c ON f.content_id = c.id
      INNER JOIN movies m ON c.movie_id = m.id
      WHERE f.user_id = @userId AND m.slug = @slug AND c.content_type = @contentType
    `;
    
    const findResult = await this.executeQueryWithNamedParams(findQuery, {
      userId,
      slug,
      contentType
    });
    
    if (findResult.recordset.length === 0) {
      // If not found by slug, try to find by content_id directly
      // This handles cases where the movie was deleted but favorite still exists
      const directQuery = `
        SELECT f.content_id FROM favorites f
        INNER JOIN contents c ON f.content_id = c.id
        WHERE f.user_id = @userId AND c.content_type = @contentType
      `;
      
      const directResult = await this.executeQueryWithNamedParams(directQuery, {
        userId,
        contentType
      });
      
      if (directResult.recordset.length === 0) {
        return false; // No favorite found
      }
      
      // Remove the first favorite found (this is a fallback for orphaned favorites)
      const deleteQuery = `
        DELETE FROM favorites 
        WHERE user_id = @userId AND content_id = @contentId
      `;
      
      const deleteResult = await this.executeQueryWithNamedParams(deleteQuery, {
        userId,
        contentId: directResult.recordset[0].content_id
      });
      
      return deleteResult.rowsAffected[0] > 0;
    }
    
    // Remove the favorite found by slug
    const deleteQuery = `
      DELETE FROM favorites 
      WHERE user_id = @userId AND content_id = @contentId
    `;
    
    const deleteResult = await this.executeQueryWithNamedParams(deleteQuery, {
      userId,
      contentId: findResult.recordset[0].content_id
    });
    
    return deleteResult.rowsAffected[0] > 0;
  }

  // Remove favorite by content_id directly (for orphaned favorites)
  async removeFavoriteByContentId(userId: number, slug: string): Promise<boolean> {
    // Try to find the favorite by slug in the favorites table directly
    const findQuery = `
      SELECT f.content_id FROM favorites f
      INNER JOIN contents c ON f.content_id = c.id
      WHERE f.user_id = @userId
    `;
    
    const findResult = await this.executeQueryWithNamedParams(findQuery, {
      userId
    });
    
    if (findResult.recordset.length === 0) {
      return false; // No favorite found
    }
    
    // Remove the first favorite found (this is a fallback for orphaned favorites)
    const deleteQuery = `
      DELETE FROM favorites 
      WHERE user_id = @userId AND content_id = @contentId
    `;
    
    const deleteResult = await this.executeQueryWithNamedParams(deleteQuery, {
      userId,
      contentId: findResult.recordset[0].content_id
    });
    
    return deleteResult.rowsAffected[0] > 0;
  }

  // Remove favorite by slug directly without JOIN (for orphaned favorites)
  async removeFavoriteBySlugDirect(userId: number, slug: string): Promise<boolean> {
    // Try to find the favorite by slug in the favorites table directly
    const findQuery = `
      SELECT f.content_id FROM favorites f
      INNER JOIN contents c ON f.content_id = c.id
      INNER JOIN movies m ON c.movie_id = m.id
      WHERE f.user_id = @userId AND m.slug = @slug
    `;
    
    const findResult = await this.executeQueryWithNamedParams(findQuery, {
      userId,
      slug
    });
    
    if (findResult.recordset.length === 0) {
      return false; // No favorite found
    }
    
    // Remove the favorite found by slug
    const deleteQuery = `
      DELETE FROM favorites 
      WHERE user_id = @userId AND content_id = @contentId
    `;
    
    const deleteResult = await this.executeQueryWithNamedParams(deleteQuery, {
      userId,
      contentId: findResult.recordset[0].content_id
    });
    
    return deleteResult.rowsAffected[0] > 0;
  }

  // Get favorites count for a user
  async getCountByUserId(userId: number): Promise<number> {
    const query = `
      SELECT COUNT(*) as count
      FROM favorites 
      WHERE user_id = @userId
    `;
    
    const result = await this.executeQueryWithNamedParams(query, { userId });
    return result.recordset[0].count;
  }

  // Find movie ID by slug
  async findMovieIdBySlug(slug: string): Promise<number | null> {
    try {
      const query = `SELECT id FROM movies WHERE slug = @slug`;
      const result = await this.executeQueryWithNamedParams(query, { slug });
      
      if (result.recordset.length === 0) {
        return null;
      }
      
      return result.recordset[0].id;
    } catch (error: any) {
      console.error('Error finding movie by slug:', error);
      return null;
    }
  }

  // Find content record by movie ID (ignoring content type due to UQ_contents_movie constraint)
  async findContentByMovieId(movieId: number, contentType: 'movie' | 'episode'): Promise<number | null> {
    try {
      const query = `
        SELECT id FROM contents 
        WHERE movie_id = @movieId
      `;
      
      const result = await this.executeQueryWithNamedParams(query, {
        movieId
      });
      
      return result.recordset.length > 0 ? result.recordset[0].id : null;
    } catch (error: any) {
      console.error('Error finding content by movie ID:', error);
      return null;
    }
  }

  // Get or create content record
  async getOrCreateContent(movieId: number, contentType: 'movie' | 'episode'): Promise<number> {
    try {
      // Use MERGE statement for upsert operation based on movie_id only (due to UQ_contents_movie constraint)
      const mergeQuery = `
        MERGE contents AS target
        USING (SELECT @contentType AS content_type, @movieId AS movie_id) AS source
        ON target.movie_id = source.movie_id
        WHEN MATCHED THEN
          UPDATE SET content_type = target.content_type
        WHEN NOT MATCHED THEN
          INSERT (content_type, movie_id)
          VALUES (source.content_type, source.movie_id)
        OUTPUT COALESCE(INSERTED.id, DELETED.id) AS id;
      `;
      
      const result = await this.executeQueryWithNamedParams(mergeQuery, {
        contentType,
        movieId
      });
      
      if (result.recordset.length === 0) {
        throw new Error('Failed to get or create content record');
      }
      
      // Return the content ID from the result
      const record = result.recordset[0];
      const contentId = record.id;
      
      if (!contentId || contentId <= 0) {
        throw new Error('Invalid content ID returned from MERGE');
      }
      
      return contentId;
    } catch (error: any) {
      console.error('Error in getOrCreateContent:', error);
      throw new Error(`Failed to get or create content record for movie ${movieId}: ${error.message || error}`);
    }
  }
}
