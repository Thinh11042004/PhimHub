import sql from 'mssql';
import { BaseRepository } from './BaseRepository';
import { Genre, CreateGenreRequest } from '../types/database';

export class GenreRepository extends BaseRepository<Genre> {
  private readonly tableName = 'genres';

  async findByName(name: string): Promise<Genre | null> {
    const sqlQuery = `SELECT * FROM ${this.tableName} WHERE name = @name`;
    const result = await this.executeQueryWithNamedParams(sqlQuery, { name });
    const genre = result.recordset[0];
    
    if (!genre) return null;
    return this.mapRecordToEntity(genre);
  }

  async findById(id: number): Promise<Genre | null> {
    const sqlQuery = `SELECT * FROM ${this.tableName} WHERE id = @id`;
    const result = await this.executeQuery(sqlQuery, [id]);
    const genre = result.recordset[0];
    
    if (!genre) return null;
    return this.mapRecordToEntity(genre);
  }

  async create(genreData: CreateGenreRequest, transaction?: any): Promise<Genre> {
    const sqlQuery = `
      INSERT INTO ${this.tableName} (name, created_at)
      VALUES (@name, GETUTCDATE());
      SELECT TOP 1 * FROM ${this.tableName} WHERE id = SCOPE_IDENTITY();
    `;

    const result = await this.executeQueryWithNamedParams(sqlQuery, { name: genreData.name }, transaction);
    return this.mapRecordToEntity(result.recordset[0]);
  }

  async update(id: number, updateData: Partial<CreateGenreRequest>, transaction?: any): Promise<Genre | null> {
    const fields: string[] = [];
    const params: any[] = [];
    let paramIndex = 0;

    Object.keys(updateData).forEach(key => {
      if (updateData[key as keyof CreateGenreRequest] !== undefined) {
        fields.push(`${key} = @param${paramIndex++}`);
        params.push(updateData[key as keyof CreateGenreRequest]);
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
      WHERE id = @param${paramIndex};
      SELECT * FROM ${this.tableName} WHERE id = @param${paramIndex};
    `;

    const result = await this.executeQuery(sqlQuery, params, transaction);
    const genre = result.recordset[0];
    if (!genre) return null;
    return this.mapRecordToEntity(genre);
  }

  async delete(id: number, transaction?: any): Promise<boolean> {
    const sqlQuery = `DELETE FROM ${this.tableName} WHERE id = @id`;
    const result = await this.executeQuery(sqlQuery, [id], transaction);
    return result.rowsAffected[0] > 0;
  }

  async search(searchTerm: string, limit: number = 20): Promise<Genre[]> {
    const sqlQuery = `
      SELECT TOP ${limit} * FROM ${this.tableName} 
      WHERE name LIKE @searchTerm
      ORDER BY name
    `;
    const result = await this.executeQuery(sqlQuery, [`%${searchTerm}%`]);
    return this.mapRecordsToEntities(result.recordset);
  }

  async getAll(): Promise<Genre[]> {
    const sqlQuery = `
      SELECT 
        g.id,
        g.name,
        COUNT(mg.movie_id) as movie_count
      FROM ${this.tableName} g
      LEFT JOIN movie_genres mg ON g.id = mg.genre_id
      LEFT JOIN movies m ON mg.movie_id = m.id AND m.status = 'published'
      GROUP BY g.id, g.name
      ORDER BY g.name
    `;
    const result = await this.executeQuery(sqlQuery);
    return this.mapRecordsToEntities(result.recordset);
  }


  protected mapRecordToEntity(record: any): Genre {
    return {
      id: record.id,
      name: record.name,
      slug: this.createSlugFromName(record.name),
      movie_count: record.movie_count || 0
    };
  }

  private createSlugFromName(name: string): string {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .trim();
  }
}
