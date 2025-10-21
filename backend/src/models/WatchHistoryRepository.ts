import { BaseRepository } from './BaseRepository';

export interface WatchHistory {
  id: number;
  user_id: number;
  content_id: number;
  last_watched_at: Date;
  progress?: number;
  device?: string;
  episode_number?: number; // Direct episode number from watch_history table
  // Additional fields from JOIN
  title?: string;
  slug?: string;
  poster_url?: string;
  is_series?: boolean;
  // Episode information from JOIN
  episode_title?: string;
  episode_movie_id?: number;
}

export interface CreateWatchHistoryRequest {
  user_id: number;
  content_id: number;
  progress?: number;
  device?: string;
  episode_number?: number;
}

export interface UpdateWatchHistoryRequest {
  progress?: number;
  device?: string;
  episode_number?: number;
}

export class WatchHistoryRepository extends BaseRepository<WatchHistory> {
  private readonly tableName = 'watch_history';

  async findByUserId(userId: number): Promise<WatchHistory[]> {
    const sqlQuery = `
      SELECT wh.*, 
             m.title, m.slug, m.poster_url, m.is_series,
             e.title as episode_title, e.movie_id as episode_movie_id, e.episode_number as episode_number_from_episodes
      FROM ${this.tableName} wh
      INNER JOIN contents c ON wh.content_id = c.id
      LEFT JOIN movies m ON c.movie_id = m.id
      LEFT JOIN episodes e ON c.episode_id = e.id
      WHERE wh.user_id = @userId
      ORDER BY wh.last_watched_at DESC
    `;

    const result = await this.executeQueryWithNamedParams(sqlQuery, { userId });
    return result.recordset.map(record => this.mapRecordToEntity(record));
  }

  async findByUserAndContent(userId: number, contentId: number): Promise<WatchHistory | null> {
    const sqlQuery = `
      SELECT * FROM ${this.tableName}
      WHERE user_id = @userId AND content_id = @contentId
    `;

    const result = await this.executeQueryWithNamedParams(sqlQuery, { userId, contentId });
    return result.recordset.length > 0 ? this.mapRecordToEntity(result.recordset[0]) : null;
  }

  async createOrUpdate(data: CreateWatchHistoryRequest): Promise<WatchHistory> {
    try {
      console.log('WatchHistoryRepository.createOrUpdate - Input data:', data);
      console.log('WatchHistoryRepository.createOrUpdate - Episode number:', data.episode_number);
      
      // First, find the content_id for the given movie_id
      const contentQuery = `
        SELECT id FROM contents 
        WHERE movie_id = @movieId AND content_type = 'movie'
      `;
      
      console.log('WatchHistoryRepository.createOrUpdate - Searching for content with movieId:', data.content_id);
      const contentResult = await this.executeQueryWithNamedParams(contentQuery, { movieId: data.content_id });
      console.log('WatchHistoryRepository.createOrUpdate - Content result:', contentResult.recordset);
      
      if (contentResult.recordset.length === 0) {
        console.log('WatchHistoryRepository.createOrUpdate - No content found, creating new one');
        // Create content entry if it doesn't exist
        const createContentQuery = `
          INSERT INTO contents (content_type, movie_id, episode_id, created_at)
          VALUES ('movie', @movieId, NULL, GETDATE())
        `;
        await this.executeQueryWithNamedParams(createContentQuery, { movieId: data.content_id });
        
        // Get the newly created content_id
        const newContentResult = await this.executeQueryWithNamedParams(contentQuery, { movieId: data.content_id });
        data.content_id = newContentResult.recordset[0].id;
        console.log('WatchHistoryRepository.createOrUpdate - Created content with ID:', data.content_id);
      } else {
        data.content_id = contentResult.recordset[0].id;
        console.log('WatchHistoryRepository.createOrUpdate - Found existing content with ID:', data.content_id);
      }
      
      // Check if record exists
      console.log('WatchHistoryRepository.createOrUpdate - Checking for existing watch history');
      const existing = await this.findByUserAndContent(data.user_id, data.content_id);
      console.log('WatchHistoryRepository.createOrUpdate - Existing record:', existing);
      
      if (existing) {
        console.log('WatchHistoryRepository.createOrUpdate - Updating existing record');
        // Update existing record
        const updateData: UpdateWatchHistoryRequest = {
          progress: data.progress,
          device: data.device,
          episode_number: data.episode_number
        };
        
        const sqlQuery = `
          UPDATE ${this.tableName}
          SET progress = @progress, device = @device, episode_number = @episode_number, last_watched_at = GETDATE()
          WHERE user_id = @userId AND content_id = @contentId
        `;

        const updateParams = {
          ...updateData,
          userId: data.user_id,
          contentId: data.content_id
        };
        
        console.log('WatchHistoryRepository.createOrUpdate - UPDATE params:', updateParams);
        
        await this.executeQueryWithNamedParams(sqlQuery, updateParams);

        const updated = await this.findByUserAndContent(data.user_id, data.content_id) as WatchHistory;
        console.log('WatchHistoryRepository.createOrUpdate - Updated record:', updated);
        return updated;
      } else {
        console.log('WatchHistoryRepository.createOrUpdate - Creating new record');
        // Create new record
        const sqlQuery = `
          INSERT INTO ${this.tableName} (user_id, content_id, progress, device, episode_number)
          VALUES (@userId, @contentId, @progress, @device, @episode_number)
        `;

        const insertParams = {
          userId: data.user_id,
          contentId: data.content_id,
          progress: data.progress || 0,
          device: data.device || 'web',
          episode_number: data.episode_number || null
        };
        
        console.log('WatchHistoryRepository.createOrUpdate - INSERT params:', insertParams);
        
        await this.executeQueryWithNamedParams(sqlQuery, insertParams);

        const created = await this.findByUserAndContent(data.user_id, data.content_id) as WatchHistory;
        console.log('WatchHistoryRepository.createOrUpdate - Created record:', created);
        return created;
      }
    } catch (error) {
      console.error('WatchHistoryRepository.createOrUpdate - Error:', error);
      throw error;
    }
  }

  async deleteByUserAndContent(userId: number, contentId: number): Promise<boolean> {
    const sqlQuery = `
      DELETE FROM ${this.tableName}
      WHERE user_id = @userId AND content_id = @contentId
    `;

    const result = await this.executeQueryWithNamedParams(sqlQuery, { userId, contentId });
    return result.rowsAffected[0] > 0;
  }

  async deleteByUserId(userId: number): Promise<boolean> {
    const sqlQuery = `
      DELETE FROM ${this.tableName}
      WHERE user_id = @userId
    `;

    const result = await this.executeQueryWithNamedParams(sqlQuery, { userId });
    return result.rowsAffected[0] > 0;
  }

  protected mapRecordToEntity(record: any): WatchHistory {
    return {
      id: record.id,
      user_id: record.user_id,
      content_id: record.content_id,
      last_watched_at: record.last_watched_at instanceof Date ? record.last_watched_at : new Date(record.last_watched_at),
      progress: record.progress,
      device: record.device,
      // Use episode_number from watch_history if available, otherwise use from episodes table
      episode_number: record.episode_number || record.episode_number_from_episodes,
      // Additional fields from JOIN
      title: record.title,
      slug: record.slug,
      poster_url: record.poster_url,
      is_series: record.is_series,
      episode_title: record.episode_title,
      episode_movie_id: record.episode_movie_id
    };
  }
}
