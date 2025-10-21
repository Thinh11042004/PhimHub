import { BaseRepository } from './BaseRepository';

export interface Actor {
  id: number;
  name: string;
  dob?: string;
  nationality?: string;
  photo_url?: string;
  created_at: string;
  updated_at: string;
}

export interface ActorWithMovies extends Actor {
  movies: Array<{
    id: number;
    slug: string;
    title: string;
    poster_url?: string;
    release_year?: number;
    role_name?: string;
  }>;
}

export class ActorRepository extends BaseRepository<Actor> {
  constructor() {
    super();
  }

  async findAll(limit: number = 50, offset: number = 0): Promise<Actor[]> {
    const query = `
      SELECT id, name, dob, nationality, photo_url, created_at, updated_at
      FROM actors
      ORDER BY name ASC
      OFFSET @offset ROWS
      FETCH NEXT @limit ROWS ONLY
    `;
    
    const result = await this.executeQueryWithNamedParams(query, {
      limit,
      offset
    });
    
    return result.recordset.map((record: any) => this.mapRecordToEntity(record));
  }

  async findById(id: number): Promise<Actor | null> {
    const query = `
      SELECT id, name, dob, nationality, photo_url, created_at, updated_at
      FROM actors
      WHERE id = @id
    `;
    
    const result = await this.executeQueryWithNamedParams(query, { id });
    
    if (result.recordset.length === 0) {
      return null;
    }
    
    return this.mapRecordToEntity(result.recordset[0]);
  }

  async findByName(name: string): Promise<Actor | null> {
    const query = `
      SELECT id, name, dob, nationality, photo_url, created_at, updated_at
      FROM actors
      WHERE name = @name
    `;
    
    const result = await this.executeQueryWithNamedParams(query, { name });
    
    if (result.recordset.length === 0) {
      return null;
    }
    
    return this.mapRecordToEntity(result.recordset[0]);
  }

  async findByIdWithMovies(id: number): Promise<ActorWithMovies | null> {
    const query = `
      SELECT 
        a.id, a.name, a.dob, a.nationality, a.photo_url, a.created_at, a.updated_at,
        m.id as movie_id, m.slug, m.title, m.poster_url, m.release_year, ma.role_name
      FROM actors a
      LEFT JOIN movie_actors ma ON a.id = ma.actor_id
      LEFT JOIN movies m ON ma.movie_id = m.id
      WHERE a.id = @id
      ORDER BY m.release_year DESC, m.title ASC
    `;
    
    const result = await this.executeQueryWithNamedParams(query, { id });
    
    if (result.recordset.length === 0) {
      return null;
    }
    
    const actor = this.mapRecordToEntity(result.recordset[0]);
    const movies = result.recordset
      .filter(record => record.movie_id)
      .map(record => ({
        id: record.movie_id,
        slug: record.slug,
        title: record.title,
        poster_url: record.poster_url,
        release_year: record.release_year,
        role_name: record.role_name
      }));
    
    return {
      ...actor,
      movies
    };
  }

  async search(query: string, limit: number = 20): Promise<Actor[]> {
    const searchQuery = `
      SELECT id, name, dob, nationality, photo_url, created_at, updated_at
      FROM actors
      WHERE name LIKE @searchQuery
      ORDER BY name ASC
      OFFSET 0 ROWS
      FETCH NEXT @limit ROWS ONLY
    `;
    
    const result = await this.executeQueryWithNamedParams(searchQuery, {
      searchQuery: `%${query}%`,
      limit
    });
    
    return result.recordset.map((record: any) => this.mapRecordToEntity(record));
  }

  async create(actorData: Omit<Actor, 'id' | 'created_at' | 'updated_at'>): Promise<Actor> {
    const query = `
      INSERT INTO actors (name, dob, nationality, photo_url)
      OUTPUT INSERTED.id, INSERTED.name, INSERTED.dob, INSERTED.nationality, INSERTED.photo_url, INSERTED.created_at, INSERTED.updated_at
      VALUES (@name, @dob, @nationality, @photo_url)
    `;
    
    const result = await this.executeQueryWithNamedParams(query, actorData);
    
    return this.mapRecordToEntity(result.recordset[0]);
  }

  async update(id: number, actorData: Partial<Omit<Actor, 'id' | 'created_at' | 'updated_at'>>): Promise<Actor | null> {
    const fields = [];
    const params: any = { id };
    
    if (actorData.name !== undefined) {
      fields.push('name = @name');
      params.name = actorData.name;
    }
    if (actorData.dob !== undefined) {
      fields.push('dob = @dob');
      params.dob = actorData.dob;
    }
    if (actorData.nationality !== undefined) {
      fields.push('nationality = @nationality');
      params.nationality = actorData.nationality;
    }
    if (actorData.photo_url !== undefined) {
      fields.push('photo_url = @photo_url');
      params.photo_url = actorData.photo_url;
    }
    
    if (fields.length === 0) {
      return this.findById(id);
    }
    
    const query = `
      UPDATE actors 
      SET ${fields.join(', ')}
      OUTPUT INSERTED.id, INSERTED.name, INSERTED.dob, INSERTED.nationality, INSERTED.photo_url, INSERTED.created_at, INSERTED.updated_at
      WHERE id = @id
    `;
    
    const result = await this.executeQueryWithNamedParams(query, params);
    
    if (result.recordset.length === 0) {
      return null;
    }
    
    return this.mapRecordToEntity(result.recordset[0]);
  }

  async delete(id: number): Promise<boolean> {
    const query = 'DELETE FROM actors WHERE id = @id';
    const result = await this.executeQueryWithNamedParams(query, { id });
    
    return result.rowsAffected[0] > 0;
  }

  async count(): Promise<number> {
    const query = 'SELECT COUNT(*) as count FROM actors';
    const result = await this.executeQuery(query);
    
    return result.recordset[0].count;
  }

  protected mapRecordToEntity(record: any): Actor {
    return {
      id: record.id,
      name: record.name,
      dob: record.dob,
      nationality: record.nationality,
      photo_url: record.photo_url,
      created_at: record.created_at,
      updated_at: record.updated_at
    };
  }

  async findForSelection(excludeIds: number[] = [], search: string = '', limit: number = 50): Promise<Actor[]> {
    let query = `
      SELECT id, name, dob, nationality, photo_url, created_at, updated_at
      FROM actors
      WHERE 1=1
    `;
    
    const params: any[] = [];
    
    // Exclude already selected actors
    if (excludeIds.length > 0) {
      const placeholders = excludeIds.map(() => '?').join(',');
      query += ` AND id NOT IN (${placeholders})`;
      params.push(...excludeIds);
    }
    
    // Search by name
    if (search.trim()) {
      query += ` AND name LIKE ?`;
      params.push(`%${search.trim()}%`);
    }
    
    query += ` ORDER BY name ASC LIMIT ?`;
    params.push(limit);
    
    const result = await this.pool?.request();
    if (!result) {
      throw new Error('Database connection failed');
    }
    params.forEach((param, index) => {
      result.input(`param${index}`, param);
    });
    
    const records = await result.query(query);
    return records.recordset?.map(record => this.mapRecordToEntity(record)) || [];
  }
}