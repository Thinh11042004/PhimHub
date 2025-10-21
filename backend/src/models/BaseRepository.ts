import sql from 'mssql';
import Database from '../config/database';

export abstract class BaseRepository<T> {
  protected pool: sql.ConnectionPool | null = null;

  protected getPool(): sql.ConnectionPool {
    if (!this.pool) {
      this.pool = Database.getInstance().getPool();
    }
    return this.pool;
  }

  protected async executeQuery(query: string, params?: any[], transaction?: sql.Transaction): Promise<sql.IResult<any>> {
    const maxRetries = 3;
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const request = transaction ? transaction.request() : this.getPool().request();
        
        if (params) {
          // Check if query contains named parameters (like @search)
          const hasNamedParams = query.includes('@') && !query.includes('@param');
          
          if (hasNamedParams) {
            // Extract parameter names from query
            const paramMatches = query.match(/@(\w+)/g);
            if (paramMatches) {
              const uniqueParams = [...new Set(paramMatches)];
              uniqueParams.forEach(paramName => {
                const cleanName = paramName.replace('@', '');
                request.input(cleanName, params[0]); // Use first param for all @search occurrences
              });
            }
          } else {
            // Use indexed parameters
            params.forEach((param, index) => {
              request.input(`param${index}`, param);
            });
          }
        }

        const result = await request.query(query);
        return result;
      } catch (error) {
        lastError = error as Error;
        console.warn(`⚠️ Database query attempt ${attempt}/${maxRetries} failed:`, error);
        
        if (attempt < maxRetries) {
          // Wait before retry (exponential backoff)
          const delay = Math.pow(2, attempt) * 1000;
          console.log(`⏳ Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    console.error(`❌ Database query failed after ${maxRetries} attempts:`, lastError);
    throw lastError || new Error('Database query failed');
  }

  protected async executeQueryWithNamedParams(query: string, params: { [key: string]: any }, transaction?: sql.Transaction): Promise<sql.IResult<any>> {
    const request = transaction ? transaction.request() : this.getPool().request();
    
    Object.keys(params).forEach(key => {
      request.input(key, params[key]);
    });

    return await request.query(query);
  }

  protected async executeStoredProcedure(
    procedureName: string, 
    params: { [key: string]: any } = {}
  ): Promise<sql.IResult<any>> {
    const request = this.getPool().request();
    
    Object.keys(params).forEach(key => {
      request.input(key, params[key]);
    });

    return await request.execute(procedureName);
  }

  protected mapRecordToEntity(record: any): T {
    // Override in child classes for specific mapping
    return record as T;
  }

  protected mapRecordsToEntities(records: any[]): T[] {
    return records.map(record => this.mapRecordToEntity(record));
  }

  protected buildWhereClause(conditions: { [key: string]: any }): { clause: string; params: any[] } {
    const clauses: string[] = [];
    const params: any[] = [];
    let paramIndex = 0;

    Object.keys(conditions).forEach(key => {
      if (conditions[key] !== undefined && conditions[key] !== null) {
        if (Array.isArray(conditions[key])) {
          const placeholders = conditions[key].map(() => `@param${paramIndex++}`).join(', ');
          clauses.push(`${key} IN (${placeholders})`);
          conditions[key].forEach((value: any) => params.push(value));
        } else {
          // Check if the key already contains parameter names (like @search)
          if (key.includes('@')) {
            clauses.push(key);
            params.push(conditions[key]);
          } else {
            clauses.push(`${key} = @param${paramIndex++}`);
            params.push(conditions[key]);
          }
        }
      }
    });

    return {
      clause: clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '',
      params
    };
  }

  protected buildPaginationClause(page?: number, limit?: number): string {
    if (page && limit) {
      const offset = (page - 1) * limit;
      return `ORDER BY id OFFSET ${offset} ROWS FETCH NEXT ${limit} ROWS ONLY`;
    }
    return '';
  }

  protected buildSortClause(sortBy?: string, sortOrder?: 'asc' | 'desc'): string {
    if (sortBy) {
      const order = sortOrder?.toUpperCase() || 'ASC';
      return `ORDER BY ${sortBy} ${order}`;
    }
    return '';
  }
}
