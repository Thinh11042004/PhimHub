import sql from 'mssql';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();
// Fallback to project root .env when running inside backend folder
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

const config: sql.config = {
  server: process.env.DB_HOST || process.env.DB_SERVER || 'localhost',
  database: process.env.DB_NAME || 'PhimHubE',
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
    useUTC: false
  }
};

async function checkGenresEncoding() {
  let pool: sql.ConnectionPool | null = null;
  
  try {
    console.log('🔌 Connecting to database...');
    pool = new sql.ConnectionPool(config);
    await pool.connect();
    console.log('✅ Connected to database successfully');

    // Get all genres
    const result = await pool.request().query('SELECT * FROM genres ORDER BY name');
    
    console.log('📋 All genres in database:');
    console.log('ID | Name');
    console.log('---|-----');
    
    result.recordset.forEach((genre: any) => {
      console.log(`${genre.id.toString().padStart(2)} | ${genre.name}`);
    });

    console.log(`\n📊 Total genres: ${result.recordset.length}`);

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    if (pool) {
      await pool.close();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run the script
if (require.main === module) {
  checkGenresEncoding()
    .then(() => {
      console.log('✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

export { checkGenresEncoding };
