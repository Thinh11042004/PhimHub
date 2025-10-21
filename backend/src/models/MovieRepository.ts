import sql from 'mssql';
import { BaseRepository } from './BaseRepository';
import { 
  Movie, 
  MovieWithDetails, 
  CreateMovieRequest, 
  UpdateMovieRequest, 
  MovieQuery,
  Actor,
  Director,
  Genre,
  Season,
  Episode
} from '../types/database';

export class MovieRepository extends BaseRepository<Movie> {
  private readonly tableName = 'movies';

  async findAll(query: MovieQuery = {}): Promise<MovieWithDetails[]> {
    const { page, limit, search, genre_ids, year, status, is_series, sort_by, sort_order } = query;
    
    // Build query with proper parameter handling
    let sqlQuery = `SELECT m.* FROM ${this.tableName} m`;
    const whereConditions: string[] = [];
    const namedParams: { [key: string]: any } = {};

    if (search) {
      whereConditions.push('(m.title LIKE @search OR m.description LIKE @search OR m.name LIKE @search)');
      namedParams['search'] = `%${search}%`;
    }
    if (year) {
      whereConditions.push('m.release_year = @year');
      namedParams['year'] = year;
    }
    if (status) {
      whereConditions.push('m.status = @status');
      namedParams['status'] = status;
    }
    if (is_series !== undefined) {
      whereConditions.push('m.is_series = @is_series');
      namedParams['is_series'] = is_series;
    }

    if (genre_ids && genre_ids.length > 0) {
      sqlQuery += ` INNER JOIN movie_genres mg ON m.id = mg.movie_id`;
      const genrePlaceholders = genre_ids.map((_, index) => `@genre${index}`).join(',');
      whereConditions.push(`mg.genre_id IN (${genrePlaceholders})`);
      genre_ids.forEach((genreId, index) => {
        namedParams[`genre${index}`] = genreId;
      });
    }

    if (whereConditions.length > 0) {
      sqlQuery += ` WHERE ${whereConditions.join(' AND ')}`;
    }

    if (sort_by) {
      sqlQuery += ` ORDER BY m.${sort_by} ${sort_order?.toUpperCase() || 'ASC'}`;
    } else {
      sqlQuery += ` ORDER BY m.created_at DESC`;
    }

    if (page && limit) {
      const offset = (page - 1) * limit;
      sqlQuery += ` OFFSET ${offset} ROWS FETCH NEXT ${limit} ROWS ONLY`;
    }

    const result = await this.executeQueryWithNamedParams(sqlQuery, namedParams);
    const movies = this.mapRecordsToEntities(result.recordset) as MovieWithDetails[];

    // Load related data for each movie
    for (const movie of movies) {
      movie.actors = await this.getMovieActors(movie.id);
      movie.directors = await this.getMovieDirectors(movie.id);
      movie.genres = await this.getMovieGenres(movie.id);
      movie.seasons = await this.getMovieSeasons(movie.id);
      movie.episodes = await this.getMovieEpisodes(movie.id);
      movie.total_episodes = movie.episodes?.length || 0;
    }

    return movies;
  }

  async findById(id: number): Promise<MovieWithDetails | null> {
    const sqlQuery = `SELECT * FROM ${this.tableName} WHERE id = @id`;
    const result = await this.executeQuery(sqlQuery, [id]);
    const movie = result.recordset[0];
    
    if (!movie) return null;

    const movieWithDetails = this.mapRecordToEntity(movie) as MovieWithDetails;
    movieWithDetails.actors = await this.getMovieActors(id);
    movieWithDetails.directors = await this.getMovieDirectors(id);
    movieWithDetails.genres = await this.getMovieGenres(id);
    movieWithDetails.seasons = await this.getMovieSeasons(id);
    movieWithDetails.episodes = await this.getMovieEpisodes(id);
    movieWithDetails.total_episodes = movieWithDetails.episodes?.length || 0;

    return movieWithDetails;
  }

  async findBySlug(slug: string): Promise<MovieWithDetails | null> {
    const sqlQuery = `SELECT * FROM ${this.tableName} WHERE slug = @slug`;
    const result = await this.executeQueryWithNamedParams(sqlQuery, { slug });
    const movie = result.recordset[0];
    
    if (!movie) return null;

    const id = movie.id as number;
    const movieWithDetails = this.mapRecordToEntity(movie) as MovieWithDetails;
    movieWithDetails.actors = await this.getMovieActors(id);
    movieWithDetails.directors = await this.getMovieDirectors(id);
    movieWithDetails.genres = await this.getMovieGenres(id);
    movieWithDetails.seasons = await this.getMovieSeasons(id);
    movieWithDetails.episodes = await this.getMovieEpisodes(id);
    movieWithDetails.total_episodes = movieWithDetails.episodes?.length || 0;

    return movieWithDetails;
  }

  async create(movieData: CreateMovieRequest): Promise<Movie> {
    const sqlQuery = `
      INSERT INTO ${this.tableName} 
      (slug, title, description, release_year, duration, age_rating, thumbnail_url, trailer_url, is_series, status, 
       country, external_id, tmdb_id, imdb_id, original_title, banner_url, external_rating, external_rating_count, 
       external_view_count, quality, language, created_at)
      OUTPUT INSERTED.*
      VALUES (@slug, @title, @description, @release_year, @duration, @age_rating, @thumbnail_url, @trailer_url, @is_series, @status,
              @country, @external_id, @tmdb_id, @imdb_id, @original_title, @banner_url, @external_rating, @external_rating_count,
              @external_view_count, @quality, @language, GETUTCDATE())
    `;

    const result = await this.executeQuery(sqlQuery, [
      movieData.slug || null,
      movieData.title,
      movieData.description || null,
      movieData.release_year || null,
      movieData.duration || null,
      movieData.age_rating || null,
      movieData.thumbnail_url || null,
      movieData.trailer_url || null,
      movieData.is_series || false,
      movieData.status || 'published',
      movieData.country || null,
      movieData.external_id || null,
      movieData.tmdb_id || null,
      movieData.imdb_id || null,
      movieData.original_title || null,
      movieData.banner_url || null,
      movieData.external_rating || null,
      movieData.external_rating_count || null,
      movieData.external_view_count || null,
      movieData.quality || null,
      movieData.language || null
    ]);

    const movie = this.mapRecordToEntity(result.recordset[0]);

    // Add relationships if provided
    if (movieData.actor_ids && movieData.actor_ids.length > 0) {
      await this.addMovieActors(movie.id, movieData.actor_ids);
    }
    if (movieData.director_ids && movieData.director_ids.length > 0) {
      await this.addMovieDirectors(movie.id, movieData.director_ids);
    }
    if (movieData.genre_ids && movieData.genre_ids.length > 0) {
      await this.addMovieGenres(movie.id, movieData.genre_ids);
    }

    return movie;
  }

  async update(id: number, updateData: UpdateMovieRequest): Promise<Movie | null> {
    const fields: string[] = [];
    const params: any[] = [];
    let paramIndex = 0;

    Object.keys(updateData).forEach(key => {
      if (key !== 'actor_ids' && key !== 'director_ids' && key !== 'genre_ids' && 
          updateData[key as keyof UpdateMovieRequest] !== undefined) {
        fields.push(`${key} = @param${paramIndex++}`);
        params.push(updateData[key as keyof UpdateMovieRequest]);
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
      WHERE id = @param${paramIndex}
    `;

    await this.executeQuery(sqlQuery, params);
    
    // Return updated movie by fetching it again
    const movie = await this.findById(id);
    if (!movie) return null;

    // Update relationships if provided
    if (updateData.actor_ids !== undefined) {
      await this.removeMovieActors(id);
      if (updateData.actor_ids.length > 0) {
        await this.addMovieActors(id, updateData.actor_ids);
      }
    }
    if (updateData.director_ids !== undefined) {
      await this.removeMovieDirectors(id);
      if (updateData.director_ids.length > 0) {
        await this.addMovieDirectors(id, updateData.director_ids);
      }
    }
    if (updateData.genre_ids !== undefined) {
      await this.removeMovieGenres(id);
      if (updateData.genre_ids.length > 0) {
        await this.addMovieGenres(id, updateData.genre_ids);
      }
    }

    return this.mapRecordToEntity(movie);
  }

  async delete(id: number): Promise<boolean> {
    const sqlQuery = `DELETE FROM ${this.tableName} WHERE id = @id`;
    const result = await this.executeQuery(sqlQuery, [id]);
    return result.rowsAffected[0] > 0;
  }

  async incrementViewCount(id: number): Promise<void> {
    const sqlQuery = `
      UPDATE ${this.tableName} 
      SET view_count = view_count + 1
      WHERE id = @id
    `;
    await this.executeQuery(sqlQuery, [id]);
  }

  async count(query: MovieQuery = {}): Promise<number> {
    const { search, genre_ids, year, status, is_series } = query;
    
    let sqlQuery = `SELECT COUNT(*) as total FROM ${this.tableName} m`;
    const whereConditions: string[] = [];
    const namedParams: { [key: string]: any } = {};

    if (search) {
      whereConditions.push('(m.title LIKE @search OR m.description LIKE @search OR m.name LIKE @search)');
      namedParams['search'] = `%${search}%`;
    }
    if (year) {
      whereConditions.push('m.release_year = @year');
      namedParams['year'] = year;
    }
    if (status) {
      whereConditions.push('m.status = @status');
      namedParams['status'] = status;
    }
    if (is_series !== undefined) {
      whereConditions.push('m.is_series = @is_series');
      namedParams['is_series'] = is_series;
    }

    if (genre_ids && genre_ids.length > 0) {
      sqlQuery += ` INNER JOIN movie_genres mg ON m.id = mg.movie_id`;
      const genrePlaceholders = genre_ids.map((_, index) => `@genre${index}`).join(',');
      whereConditions.push(`mg.genre_id IN (${genrePlaceholders})`);
      genre_ids.forEach((genreId, index) => {
        namedParams[`genre${index}`] = genreId;
      });
    }

    if (whereConditions.length > 0) {
      sqlQuery += ` WHERE ${whereConditions.join(' AND ')}`;
    }

    const result = await this.executeQueryWithNamedParams(sqlQuery, namedParams);
    return result.recordset[0].total;
  }

  private async getMovieActors(movieId: number): Promise<Actor[]> {
    const sqlQuery = `
      SELECT a.*, ma.role_name
      FROM actors a
      INNER JOIN movie_actors ma ON a.id = ma.actor_id
      WHERE ma.movie_id = @movieId
    `;
    const result = await this.executeQueryWithNamedParams(sqlQuery, { movieId });
    return result.recordset;
  }

  private async getMovieDirectors(movieId: number): Promise<Director[]> {
    const sqlQuery = `
      SELECT d.*
      FROM directors d
      INNER JOIN movie_directors md ON d.id = md.director_id
      WHERE md.movie_id = @movieId
    `;
    const result = await this.executeQueryWithNamedParams(sqlQuery, { movieId });
    return result.recordset;
  }

  private async getMovieGenres(movieId: number): Promise<Genre[]> {
    const sqlQuery = `
      SELECT g.*
      FROM genres g
      INNER JOIN movie_genres mg ON g.id = mg.genre_id
      WHERE mg.movie_id = @movieId
    `;
    const result = await this.executeQueryWithNamedParams(sqlQuery, { movieId });
    return result.recordset;
  }

  private async getMovieSeasons(movieId: number): Promise<Season[]> {
    const sqlQuery = `
      SELECT * FROM seasons 
      WHERE movie_id = @movieId 
      ORDER BY season_number
    `;
    const result = await this.executeQueryWithNamedParams(sqlQuery, { movieId });
    return result.recordset;
  }

  private async getMovieEpisodes(movieId: number): Promise<Episode[]> {
    const sqlQuery = `
      SELECT * FROM episodes 
      WHERE movie_id = @movieId 
      ORDER BY season_id, episode_number
    `;
    const result = await this.executeQueryWithNamedParams(sqlQuery, { movieId });
    return result.recordset;
  }



  /**
   * Create movie from external API data
   */
  async createFromExternal(movieData: any, transaction?: any): Promise<Movie> {
    const sqlQuery = `
      INSERT INTO ${this.tableName} 
      (slug, title, description, release_year, duration, age_rating, thumbnail_url, trailer_url, is_series, status, 
       external_id, tmdb_id, imdb_id, original_title, banner_url, external_rating, external_rating_count, 
       external_view_count, quality, language, created_at)
      OUTPUT INSERTED.*
      VALUES (@slug, @title, @description, @release_year, @duration, @age_rating, @thumbnail_url, @trailer_url, @is_series, @status,
              @external_id, @tmdb_id, @imdb_id, @original_title, @banner_url, @external_rating, @external_rating_count,
              @external_view_count, @quality, @language, GETUTCDATE())
    `;

    const result = await this.executeQueryWithNamedParams(sqlQuery, {
      slug: movieData.slug || null,
      title: movieData.title,
      description: movieData.description || null,
      release_year: movieData.release_year || null,
      duration: movieData.duration || null,
      age_rating: movieData.age_rating || null,
      thumbnail_url: movieData.thumbnail_url || null,
      trailer_url: movieData.trailer_url || null,
      is_series: movieData.is_series || false,
      status: movieData.status || 'published',
      external_id: movieData.external_id || null,
      tmdb_id: movieData.tmdb_id || null,
      imdb_id: movieData.imdb_id || null,
      original_title: movieData.original_title || null,
      banner_url: movieData.banner_url || null,
      external_rating: movieData.external_rating || null,
      external_rating_count: movieData.external_rating_count || null,
      external_view_count: movieData.external_view_count || null,
      quality: movieData.quality || null,
      language: movieData.language || null
    }, transaction);

    return this.mapRecordToEntity(result.recordset[0]);
  }

  /**
   * Update movie from external API data
   */
  async updateFromExternal(id: number, movieData: any, transaction?: any): Promise<Movie | null> {
    const fields: string[] = [];
    const params: any[] = [];
    let paramIndex = 0;

    // Map external data to database fields
    const fieldMappings = {
      title: movieData.title,
      description: movieData.description,
      release_year: movieData.release_year,
      duration: movieData.duration,
      age_rating: movieData.age_rating,
      thumbnail_url: movieData.thumbnail_url,
      trailer_url: movieData.trailer_url,
      is_series: movieData.is_series,
      status: movieData.status,
      external_id: movieData.external_id,
      tmdb_id: movieData.tmdb_id,
      imdb_id: movieData.imdb_id,
      original_title: movieData.original_title,
      banner_url: movieData.banner_url,
      external_rating: movieData.external_rating,
      external_rating_count: movieData.external_rating_count,
      external_view_count: movieData.external_view_count,
      quality: movieData.quality,
      language: movieData.language
    };

    Object.keys(fieldMappings).forEach(key => {
      if (fieldMappings[key as keyof typeof fieldMappings] !== undefined) {
        fields.push(`${key} = @param${paramIndex++}`);
        params.push(fieldMappings[key as keyof typeof fieldMappings]);
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
    const movie = result.recordset[0];
    
    if (!movie) return null;
    return this.mapRecordToEntity(movie);
  }

  /**
   * Add movie-actor relationship
   */
  async addMovieActor(movieId: number, actorId: number, character?: string, order?: number, transaction?: any): Promise<void> {
    const sqlQuery = `
      INSERT INTO movie_actors (movie_id, actor_id, character, [order]) 
      VALUES (@movieId, @actorId, @character, @order)
    `;
    await this.executeQueryWithNamedParams(sqlQuery, { 
      movieId, 
      actorId, 
      character: character || null,
      order: order || 0
    }, transaction);
  }

  /**
   * Add multiple movie-actor relationships
   */
  async addMovieActors(movieId: number, actorIds: number[], transaction?: any): Promise<void> {
    for (const actorId of actorIds) {
      await this.addMovieActor(movieId, actorId, transaction);
    }
  }

  /**
   * Add movie-genre relationship
   */
  async addMovieGenre(movieId: number, genreId: number, transaction?: any): Promise<void> {
    const sqlQuery = `
      INSERT INTO movie_genres (movie_id, genre_id) 
      VALUES (@movieId, @genreId)
    `;
    await this.executeQueryWithNamedParams(sqlQuery, { movieId, genreId }, transaction);
  }

  /**
   * Add multiple movie-genre relationships
   */
  async addMovieGenres(movieId: number, genreIds: number[], transaction?: any): Promise<void> {
    for (const genreId of genreIds) {
      await this.addMovieGenre(movieId, genreId, transaction);
    }
  }

  /**
   * Remove all movie-actor relationships
   */
  async removeMovieActors(movieId: number, transaction?: any): Promise<void> {
    const sqlQuery = `DELETE FROM movie_actors WHERE movie_id = @movieId`;
    await this.executeQueryWithNamedParams(sqlQuery, { movieId }, transaction);
  }

  /**
   * Remove all movie-genre relationships
   */
  async removeMovieGenres(movieId: number, transaction?: any): Promise<void> {
    const sqlQuery = `DELETE FROM movie_genres WHERE movie_id = @movieId`;
    await this.executeQueryWithNamedParams(sqlQuery, { movieId }, transaction);
  }

  /**
   * Add movie-director relationship
   */
  async addMovieDirector(movieId: number, directorId: number, transaction?: any): Promise<void> {
    const sqlQuery = `
      INSERT INTO movie_directors (movie_id, director_id) 
      VALUES (@movieId, @directorId)
    `;
    await this.executeQueryWithNamedParams(sqlQuery, { movieId, directorId }, transaction);
  }

  /**
   * Add multiple movie-director relationships
   */
  async addMovieDirectors(movieId: number, directorIds: number[], transaction?: any): Promise<void> {
    for (const directorId of directorIds) {
      await this.addMovieDirector(movieId, directorId, transaction);
    }
  }

  /**
   * Remove all movie-director relationships
   */
  async removeMovieDirectors(movieId: number, transaction?: any): Promise<void> {
    const sqlQuery = `DELETE FROM movie_directors WHERE movie_id = @movieId`;
    await this.executeQueryWithNamedParams(sqlQuery, { movieId }, transaction);
  }

  /**
   * Find director by name
   */
  async findDirectorByName(name: string): Promise<any | null> {
    const sqlQuery = `SELECT * FROM directors WHERE name = @name`;
    const result = await this.executeQueryWithNamedParams(sqlQuery, { name });
    return result.recordset[0] || null;
  }

  /**
   * Create director
   */
  async createDirector(directorData: { name: string }, transaction?: any): Promise<any> {
    const sqlQuery = `
      INSERT INTO directors (name, created_at)
      OUTPUT INSERTED.*
      VALUES (@name, GETUTCDATE())
    `;
    const result = await this.executeQueryWithNamedParams(sqlQuery, { name: directorData.name }, transaction);
    return result.recordset[0];
  }

  protected mapRecordToEntity(record: any): Movie {
    return {
      id: record.id,
      slug: record.slug,
      title: record.title,
      description: record.description,
      release_year: record.release_year,
      duration: record.duration,
      age_rating: record.age_rating,
      thumbnail_url: record.thumbnail_url,
      poster_url: record.poster_url, // Add missing poster_url mapping
      trailer_url: record.trailer_url,
      is_series: record.is_series,
      view_count: record.view_count,
      created_at: record.created_at,
      updated_at: record.updated_at,
      status: record.status,
      categories: record.categories, // Add categories field
      country: record.country, // Add country field
      // External API fields
      external_id: record.external_id,
      tmdb_id: record.tmdb_id,
      imdb_id: record.imdb_id,
      original_title: record.original_title,
      banner_url: record.banner_url,
      external_rating: record.external_rating,
      external_rating_count: record.external_rating_count,
      external_view_count: record.external_view_count,
      quality: record.quality,
      language: record.language
    };
  }

  async findByGenreSlug(slug: string, options: { page: number; limit: number; sort_by?: string; sort_order?: string }): Promise<MovieWithDetails[]> {
    const { page, limit, sort_by = 'release_year', sort_order = 'DESC' } = options;
    
    // Build query to filter by genre slug in categories column
    const sqlQuery = `
      SELECT m.* 
      FROM ${this.tableName} m
      WHERE EXISTS (
        SELECT 1 
        FROM OPENJSON(m.categories) 
        WITH (value NVARCHAR(50) '$') 
        WHERE LOWER(value) = LOWER(@slug)
      )
      ORDER BY m.${sort_by} ${sort_order.toUpperCase()}
      OFFSET ${(page - 1) * limit} ROWS FETCH NEXT ${limit} ROWS ONLY
    `;

    const result = await this.executeQueryWithNamedParams(sqlQuery, { slug });
    const movies = this.mapRecordsToEntities(result.recordset) as MovieWithDetails[];

    // Load related data for each movie
    for (const movie of movies) {
      movie.actors = await this.getMovieActors(movie.id);
      movie.directors = await this.getMovieDirectors(movie.id);
      movie.genres = await this.getMovieGenres(movie.id);
      movie.seasons = await this.getMovieSeasons(movie.id);
      movie.episodes = await this.getMovieEpisodes(movie.id);
      movie.total_episodes = movie.episodes?.length || 0;
    }

    return movies;
  }

  async countByGenreSlug(slug: string): Promise<number> {
    const sqlQuery = `
      SELECT COUNT(*) as total
      FROM ${this.tableName} m
      WHERE EXISTS (
        SELECT 1 
        FROM OPENJSON(m.categories) 
        WITH (value NVARCHAR(50) '$') 
        WHERE LOWER(value) = LOWER(@slug)
      )
    `;

    const result = await this.executeQueryWithNamedParams(sqlQuery, { slug });
    return result.recordset[0]?.total || 0;
  }

  async getRecommendations(options: { 
    currentMovieId: string; 
    isSeries: boolean; 
    limit: number 
  }): Promise<MovieWithDetails[]> {
    const { currentMovieId, isSeries, limit } = options;
    
    // Get recommendations based on same type and latest year
    const sqlQuery = `
      SELECT TOP (@limit) m.* 
      FROM ${this.tableName} m
      WHERE m.id != @currentMovieId 
        AND m.is_series = @isSeries
        AND m.status = 'published'
      ORDER BY m.release_year DESC, m.created_at DESC
    `;

    const result = await this.executeQueryWithNamedParams(sqlQuery, { 
      currentMovieId, 
      isSeries,
      limit
    });
    
    const movies = this.mapRecordsToEntities(result.recordset) as MovieWithDetails[];

    // Load related data for each movie
    for (const movie of movies) {
      movie.actors = await this.getMovieActors(movie.id);
      movie.directors = await this.getMovieDirectors(movie.id);
      movie.genres = await this.getMovieGenres(movie.id);
      movie.seasons = await this.getMovieSeasons(movie.id);
      movie.episodes = await this.getMovieEpisodes(movie.id);
      movie.total_episodes = movie.episodes?.length || 0;
    }

    return movies;
  }
}
