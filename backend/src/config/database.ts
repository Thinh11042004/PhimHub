import sql from 'mssql';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();
// Also try loading project root .env (when running from backend folder)
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

const baseConfig: sql.config = {
  server: process.env.DB_HOST || process.env.DB_SERVER || 'localhost',
  // Do not hard-require database here; we will ensure and connect later
  // database: process.env.DB_NAME || 'PhimHubE',
  user: process.env.DB_USER || undefined,
  password: process.env.DB_PASS || process.env.DB_PASSWORD || undefined,
  port: parseInt(process.env.DB_PORT || '1433'),
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true',
    trustServerCertificate: process.env.DB_TRUST_SERVER_CERT === 'true' || process.env.DB_TRUST_CERT === 'true',
    enableArithAbort: true,
    connectTimeout: 30000,
    requestTimeout: 30000,
    instanceName: process.env.DB_INSTANCE || undefined,
    useUTC: true
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
    acquireTimeoutMillis: 60000,
    createTimeoutMillis: 30000,
    destroyTimeoutMillis: 5000,
    reapIntervalMillis: 1000,
    createRetryIntervalMillis: 200
  }
};

class Database {
  private static instance: Database;
  private pool: sql.ConnectionPool | null = null;

  private constructor() {}

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  private async ensureDatabaseExists(dbName: string): Promise<void> {
    // Connect without specifying a database (defaults to master)
    const tempPool = new sql.ConnectionPool({ ...baseConfig });
    await tempPool.connect();
    try {
      const dbNameEscapedForLike = dbName.replace(/'/g, "''");
      const dbNameEscapedForBracket = dbName.replace(/]/g, ']]');
      await tempPool.request().query(
        `IF DB_ID(N'${dbNameEscapedForLike}') IS NULL BEGIN EXEC('CREATE DATABASE [${dbNameEscapedForBracket}]'); END`
      );
    } finally {
      await tempPool.close();
    }
  }

  public async connect(): Promise<void> {
    try {
      if (!this.pool) {
        const targetDb = process.env.DB_NAME || 'PhimHub';
        // Ensure the target database exists to prevent ELOGIN
        await this.ensureDatabaseExists(targetDb);

        const dbConfig: sql.config = { ...baseConfig, database: targetDb };
        this.pool = new sql.ConnectionPool(dbConfig);
        await this.pool.connect();
        console.log(`✅ Connected to SQL Server database: ${targetDb}`);
      }
    } catch (error) {
      console.error('❌ Database connection failed:', error);
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    try {
      if (this.pool) {
        await this.pool.close();
        this.pool = null;
        console.log('🔌 Disconnected from database');
      }
    } catch (error) {
      console.error('❌ Database disconnection failed:', error);
      throw error;
    }
  }

  public getPool(): sql.ConnectionPool {
    if (!this.pool) {
      throw new Error('Database not connected. Call connect() first.');
    }
    return this.pool;
  }

  public async testConnection(): Promise<boolean> {
    try {
      const pool = this.getPool();
      const result = await pool.request().query('SELECT 1 as test');
      return result.recordset.length > 0;
    } catch (error) {
      console.error('Database test connection failed:', error);
      return false;
    }
  }

  public async beginTransaction(): Promise<sql.Transaction> {
    const pool = this.getPool();
    const transaction = new sql.Transaction(pool);
    await transaction.begin();
    return transaction;
  }
}

export default Database;
