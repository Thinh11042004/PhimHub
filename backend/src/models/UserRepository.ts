import sql from 'mssql';
import { BaseRepository } from './BaseRepository';
import { User, UserWithRole, CreateUserRequest, UpdateUserRequest, UserQuery } from '../types/database';
import Database from '../config/database';

export class UserRepository extends BaseRepository<User> {
  private readonly tableName = 'users';

  // Ensure database connection
  private async ensureConnection() {
    try {
      await Database.getInstance().connect();
    } catch (error) {
      console.error('Database connection error in UserRepository:', error);
      throw new Error('Database connection failed');
    }
  }

  async findAll(query: UserQuery = {}): Promise<UserWithRole[]> {
    await this.ensureConnection();
    const { page, limit, search, role_id, status, sort_by, sort_order } = query;
    
    let sqlQuery = `
      SELECT 
        u.*,
        r.code as role_code,
        r.name as role_name
      FROM ${this.tableName} u
      LEFT JOIN roles r ON u.role_id = r.id
    `;

    const conditions: { [key: string]: any } = {};
    if (search) {
      conditions['(u.username LIKE @search OR u.email LIKE @search OR u.fullname LIKE @search)'] = `%${search}%`;
    }
    if (role_id) conditions['u.role_id'] = role_id;
    if (status) conditions['u.status'] = status;

    const { clause, params } = this.buildWhereClause(conditions);
    if (clause) {
      sqlQuery += ` ${clause}`;
    }

    if (sort_by) {
      sqlQuery += ` ORDER BY u.${sort_by} ${sort_order?.toUpperCase() || 'ASC'}`;
    }

    if (page && limit) {
      const offset = (page - 1) * limit;
      sqlQuery += ` OFFSET ${offset} ROWS FETCH NEXT ${limit} ROWS ONLY`;
    }

    const result = await this.executeQuery(sqlQuery, params);
    return this.mapRecordsToEntities(result.recordset) as UserWithRole[];
  }

  async findById(id: number): Promise<UserWithRole | null> {
    const sqlQuery = `
      SELECT 
        u.*, 
        r.code as role_code,
        r.name as role_name
      FROM ${this.tableName} u
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE u.id = @id
    `;

    // Use named parameter to match @id in query
    const request = this.getPool().request();
    request.input('id', id);
    const result = await request.query(sqlQuery);
    const user = result.recordset[0];
    return user ? this.mapRecordToEntity(user) as UserWithRole : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const sqlQuery = `SELECT * FROM ${this.tableName} WHERE email = @email`;
    const request = this.getPool().request();
    request.input('email', email);
    const result = await request.query(sqlQuery);
    const user = result.recordset[0];
    return user ? this.mapRecordToEntity(user) : null;
  }

  async findByUsername(username: string): Promise<User | null> {
    const sqlQuery = `SELECT * FROM ${this.tableName} WHERE username = @username`;
    const request = this.getPool().request();
    request.input('username', username);
    const result = await request.query(sqlQuery);
    const user = result.recordset[0];
    return user ? this.mapRecordToEntity(user) : null;
  }

  async findByEmailOrUsername(identifier: string): Promise<UserWithRole | null> {
    await this.ensureConnection();
    const sqlQuery = `
      SELECT 
        u.*,
        r.code as role_code,
        r.name as role_name
      FROM ${this.tableName} u
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE u.email = @identifier OR u.username = @identifier
    `;
    const request = this.getPool().request();
    request.input('identifier', identifier);
    const result = await request.query(sqlQuery);
    const user = result.recordset[0];
    return user ? this.mapRecordToEntity(user) as UserWithRole : null;
  }

  async create(userData: CreateUserRequest): Promise<User> {
    const sqlQuery = `
      INSERT INTO ${this.tableName} 
      (username, email, password_hash, fullname, phone, role_id, created_at, status)
      VALUES (@username, @email, @password_hash, @fullname, @phone, @role_id, GETUTCDATE(), 'active')
    `;

    const request = this.getPool().request();
    request.input('username', userData.username);
    request.input('email', userData.email);
    request.input('password_hash', userData.password);
    request.input('fullname', userData.fullname || null);
    request.input('phone', userData.phone || null);
    request.input('role_id', userData.role_id || null);

    const result = await request.query(sqlQuery);
    
    // Get the inserted user by email (assuming email is unique)
    return this.findByEmail(userData.email) as Promise<User>;
  }

  async update(id: number, updateData: UpdateUserRequest): Promise<User | null> {
    const fields: string[] = [];
    const params: any[] = [];
    let paramIndex = 0;

    Object.keys(updateData).forEach(key => {
      if (updateData[key as keyof UpdateUserRequest] !== undefined) {
        fields.push(`${key} = @param${paramIndex++}`);
        params.push(updateData[key as keyof UpdateUserRequest]);
      }
    });

    if (fields.length === 0) {
      return this.findById(id);
    }

    fields.push('updated_at = GETUTCDATE()');
    params.push(id);

    // Remove OUTPUT clause to avoid trigger conflicts
    const sqlQuery = `
      UPDATE ${this.tableName} 
      SET ${fields.join(', ')}
      WHERE id = @param${paramIndex}
    `;

    const result = await this.executeQuery(sqlQuery, params);
    
    // Check if update was successful
    if (result.rowsAffected[0] > 0) {
      // Return updated user by fetching it again
      return this.findById(id);
    }
    
    return null;
  }

  async delete(id: number): Promise<boolean> {
    const sqlQuery = `DELETE FROM ${this.tableName} WHERE id = @id`;
    const request = this.getPool().request();
    request.input('id', id);
    const result = await request.query(sqlQuery);
    return result.rowsAffected[0] > 0;
  }

  async updateLastLogin(id: number): Promise<void> {
    const sqlQuery = `
      UPDATE ${this.tableName} 
      SET last_login = GETUTCDATE()
      WHERE id = @id
    `;
    const request = this.getPool().request();
    request.input('id', id);
    await request.query(sqlQuery);
  }

  async updatePassword(id: number, passwordHash: string): Promise<boolean> {
    const sqlQuery = `
      UPDATE ${this.tableName} 
      SET password_hash = @password_hash, updated_at = GETUTCDATE()
      WHERE id = @id
    `;
    const request = this.getPool().request();
    request.input('password_hash', passwordHash);
    request.input('id', id);
    const result = await request.query(sqlQuery);
    return result.rowsAffected[0] > 0;
  }

  async count(query: UserQuery = {}): Promise<number> {
    const { search, role_id, status } = query;
    
    let sqlQuery = `SELECT COUNT(*) as total FROM ${this.tableName} u`;
    const conditions: { [key: string]: any } = {};
    const params: any[] = [];

    if (search) {
      conditions['(u.username LIKE @search OR u.email LIKE @search OR u.fullname LIKE @search)'] = `%${search}%`;
    }
    if (role_id) conditions['u.role_id'] = role_id;
    if (status) conditions['u.status'] = status;

    const { clause } = this.buildWhereClause(conditions);
    if (clause) {
      sqlQuery += ` ${clause}`;
    }

    const result = await this.executeQuery(sqlQuery, params);
    return result.recordset[0].total;
  }

  protected mapRecordToEntity(record: any): User {
    const user: any = {
      id: record.id,
      username: record.username,
      email: record.email,
      password_hash: record.password_hash,
      fullname: record.fullname,
      avatar: record.avatar,
      phone: record.phone,
      role_id: record.role_id,
      last_login: record.last_login,
      created_at: record.created_at,
      updated_at: record.updated_at,
      status: record.status
    };
    
    // Add role information if present
    if (record.role_code) {
      user.role_code = record.role_code;
    }
    if (record.role_name) {
      user.role_name = record.role_name;
    }
    
    return user;
  }
}
