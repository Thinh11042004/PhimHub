import { BaseRepository } from './BaseRepository';
import { Episode, CreateEpisodeRequest } from '../types/database';

export class EpisodeRepository extends BaseRepository<Episode> {
  private readonly tableName = 'episodes';

  async findByMovieId(movieId: number): Promise<Episode[]> {
    const sqlQuery = `
      SELECT * FROM ${this.tableName} 
      WHERE movie_id = @movieId 
      ORDER BY episode_number
    `;
    const result = await this.executeQuery(sqlQuery, [movieId]);
    return this.mapRecordsToEntities(result.recordset);
  }

  async findByMovieIdAndEpisodeNumber(movieId: number, episodeNumber: number): Promise<Episode | null> {
    const sqlQuery = `
      SELECT * FROM ${this.tableName} 
      WHERE movie_id = @movieId AND episode_number = @episodeNumber
    `;
    const result = await this.executeQuery(sqlQuery, [movieId, episodeNumber]);
    const episode = result.recordset[0];
    
    if (!episode) return null;
    return this.mapRecordToEntity(episode);
  }

  async findById(id: number): Promise<Episode | null> {
    const sqlQuery = `SELECT * FROM ${this.tableName} WHERE id = @id`;
    const result = await this.executeQuery(sqlQuery, [id]);
    const episode = result.recordset[0];
    
    if (!episode) return null;
    return this.mapRecordToEntity(episode);
  }

  async create(episodeData: CreateEpisodeRequest, transaction?: any): Promise<Episode> {
    const sqlQuery = `
      INSERT INTO ${this.tableName} 
      (movie_id, season_id, episode_number, title, duration, episode_url, source_url, created_at)
      OUTPUT INSERTED.*
      VALUES (@movie_id, @season_id, @episode_number, @title, @duration, @episode_url, @source_url, GETUTCDATE())
    `;

    const result = await this.executeQueryWithNamedParams(sqlQuery, {
      movie_id: episodeData.movie_id,
      season_id: episodeData.season_id || null,
      episode_number: episodeData.episode_number,
      title: episodeData.title || null,
      duration: episodeData.duration || null,
      episode_url: episodeData.episode_url || null,
      source_url: (episodeData as any).source_url || episodeData.episode_url || null
    }, transaction);

    return this.mapRecordToEntity(result.recordset[0]);
  }

  async update(id: number, updateData: Partial<CreateEpisodeRequest>, transaction?: any): Promise<Episode | null> {
    const fields: string[] = [];
    const params: any[] = [];
    let paramIndex = 0;

    Object.keys(updateData).forEach(key => {
      if (key !== 'movie_id' && updateData[key as keyof CreateEpisodeRequest] !== undefined) {
        fields.push(`${key} = @param${paramIndex++}`);
        params.push(updateData[key as keyof CreateEpisodeRequest]);
      }
    });

    if (fields.length === 0) {
      return this.findById(id);
    }

    fields.push('updated_at = GETUTCDATE()');
    params.push(id);

    const sqlQuery = `
      UPDATE ${this.tableName} 
      SET ${fields.join(', ')}
      OUTPUT INSERTED.*
      WHERE id = @param${paramIndex}
    `;

    const result = await this.executeQuery(sqlQuery, params, transaction);
    const episode = result.recordset[0];
    
    if (!episode) return null;
    return this.mapRecordToEntity(episode);
  }

  async delete(id: number, transaction?: any): Promise<boolean> {
    const sqlQuery = `DELETE FROM ${this.tableName} WHERE id = @id`;
    const result = await this.executeQuery(sqlQuery, [id], transaction);
    return result.rowsAffected[0] > 0;
  }

  async deleteByMovieId(movieId: number, transaction?: any): Promise<boolean> {
    const sqlQuery = `DELETE FROM ${this.tableName} WHERE movie_id = @movieId`;
    const result = await this.executeQuery(sqlQuery, [movieId], transaction);
    return result.rowsAffected[0] > 0;
  }

  async removeEpisodesByMovieId(movieId: number, transaction?: any): Promise<void> {
    const sqlQuery = `DELETE FROM ${this.tableName} WHERE movie_id = @movieId`;
    await this.executeQueryWithNamedParams(sqlQuery, { movieId }, transaction);
  }

  async countByMovieId(movieId: number): Promise<number> {
    const sqlQuery = `SELECT COUNT(*) as total FROM ${this.tableName} WHERE movie_id = @movieId`;
    const result = await this.executeQuery(sqlQuery, [movieId]);
    return result.recordset[0].total;
  }

  protected mapRecordToEntity(record: any): Episode {
    return {
      id: record.id,
      movie_id: record.movie_id,
      season_id: record.season_id,
      episode_number: record.episode_number,
      title: record.title,
      duration: record.duration,
      episode_url: record.episode_url,
      // New optional fields (may be null if migration not applied yet)
      source_url: record.source_url,
      local_hls_path: record.local_hls_path,
      download_status: record.download_status,
      last_download_error: record.last_download_error,
      last_download_at: record.last_download_at,
      created_at: record.created_at
    };
  }
}
