import { BaseRepository } from './BaseRepository';
import { Director } from '../types/director';
import sql from 'mssql';

export class DirectorRepository extends BaseRepository<Director> {
  protected tableName = 'directors';

  constructor() {
    super();
  }

  async findAll(limit: number = 50, offset: number = 0): Promise<Director[]> {
    const query = `
      SELECT id, name, dob, nationality, photo_url, created_at, updated_at
      FROM directors
      ORDER BY name ASC
      OFFSET @offset ROWS
      FETCH NEXT @limit ROWS ONLY
    `;
    
    const result = await this.executeQueryWithNamedParams(query, {
      offset: offset,
      limit: limit
    });
    
    return result.recordset.map((record: any) => this.mapRecordToEntity(record));
  }

  async findById(id: number): Promise<Director | null> {
    const result = await this.executeQueryWithNamedParams(
      `SELECT id, name, dob, nationality, photo_url, created_at, updated_at FROM ${this.tableName} WHERE id = @id`,
      { id: id }
    );
    return result.recordset.length > 0 ? this.mapRecordToEntity(result.recordset[0]) : null;
  }

  async findByName(name: string): Promise<Director | null> {
    const result = await this.executeQueryWithNamedParams(
      `SELECT id, name, dob, nationality, photo_url, created_at, updated_at FROM ${this.tableName} WHERE name = @name`,
      { name: name }
    );
    return result.recordset.length > 0 ? this.mapRecordToEntity(result.recordset[0]) : null;
  }

  async searchDirectors(query: string, limit: number = 10): Promise<Director[]> {
    const result = await this.executeQueryWithNamedParams(
      `SELECT TOP (@limit) id, name, dob, nationality, photo_url, created_at, updated_at FROM ${this.tableName} WHERE name LIKE @query ORDER BY name`,
      {
        query: `%${query}%`,
        limit: limit
      }
    );
    return result.recordset.map((record: any) => this.mapRecordToEntity(record));
  }

  async getMoviesByDirector(directorId: number): Promise<any[]> {
    const result = await this.executeQueryWithNamedParams(
      `SELECT m.id, m.title, m.slug, m.poster_url, m.release_year, m.is_series
       FROM movies m
       JOIN movie_directors md ON m.id = md.movie_id
       WHERE md.director_id = @directorId
       ORDER BY m.release_year DESC`,
      { directorId: directorId }
    );
    return result.recordset;
  }

  async create(directorData: Partial<Director>): Promise<Director> {
    const result = await this.executeQueryWithNamedParams(
      `INSERT INTO ${this.tableName} (name, dob, nationality, photo_url, created_at)
       OUTPUT INSERTED.*
       VALUES (@name, @dob, @nationality, @photo_url, SYSUTCDATETIME())`,
      {
        name: directorData.name,
        dob: directorData.dob || null,
        nationality: directorData.nationality || null,
        photo_url: directorData.photo_url || null
      }
    );
    return this.mapRecordToEntity(result.recordset[0]);
  }

  async update(id: number, directorData: Partial<Director>): Promise<Director | null> {
    const result = await this.executeQueryWithNamedParams(
      `UPDATE ${this.tableName} 
       SET name = @name, dob = @dob, nationality = @nationality, photo_url = @photo_url, updated_at = SYSUTCDATETIME()
       OUTPUT INSERTED.*
       WHERE id = @id`,
      {
        id: id,
        name: directorData.name,
        dob: directorData.dob || null,
        nationality: directorData.nationality || null,
        photo_url: directorData.photo_url || null
      }
    );
    return result.recordset.length > 0 ? this.mapRecordToEntity(result.recordset[0]) : null;
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.executeQueryWithNamedParams(
      `DELETE FROM ${this.tableName} WHERE id = @id`,
      { id: id }
    );
    return result.rowsAffected[0] > 0;
  }

  async getAllDirectors(page: number, limit: number): Promise<{ directors: Director[], total: number }> {
    const offset = (page - 1) * limit;
    
    const directors = await this.executeQueryWithNamedParams(
      `SELECT id, name, dob, nationality, photo_url, created_at, updated_at 
       FROM ${this.tableName} 
       ORDER BY name 
       OFFSET @offset ROWS 
       FETCH NEXT @limit ROWS ONLY`,
      {
        offset: offset,
        limit: limit
      }
    );

    const totalResult = await this.executeQuery('SELECT COUNT(*) as total FROM directors');
    const total = totalResult.recordset[0].total;

    return {
      directors: directors.recordset.map((record: any) => this.mapRecordToEntity(record)),
      total: total
    };
  }

  protected mapRecordToEntity(record: any): Director {
    return {
      id: record.id,
      name: record.name,
      dob: record.dob,
      nationality: record.nationality,
      photo_url: record.photo_url,
      created_at: record.created_at,
      updated_at: record.updated_at,
    };
  }
}
