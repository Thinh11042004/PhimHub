import sql from 'mssql';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

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

async function insertGenres() {
  let pool: sql.ConnectionPool | null = null;
  
  try {
    console.log('🔌 Connecting to database...');
    pool = new sql.ConnectionPool(config);
    await pool.connect();
    console.log('✅ Connected to database successfully');

    // Check if genres table exists and has data
    const checkResult = await pool.request().query('SELECT COUNT(*) as count FROM genres');
    const currentCount = checkResult.recordset[0].count;
    console.log(`📊 Current genres count: ${currentCount}`);

    if (currentCount > 0) {
      console.log('ℹ️  Genres already exist in database');
      return;
    }

    // Sample genres data
    const genres = [
      'Hành động',
      'Hài hước', 
      'Chính kịch',
      'Kinh dị',
      'Lãng mạn',
      'Khoa học viễn tưởng',
      'Phiêu lưu',
      'Bí ẩn',
      'Thriller',
      'Tài liệu',
      'Gia đình',
      'Hoạt hình',
      'Âm nhạc',
      'Chiến tranh',
      'Cổ trang',
      'Hình sự',
      'Thể thao',
      'Western',
      'Fantasy',
      'Noir'
    ];

    console.log('📝 Inserting sample genres...');
    
    for (const genreName of genres) {
      try {
        await pool.request()
          .input('name', sql.NVarChar, genreName)
          .query('INSERT INTO genres (name) VALUES (@name)');
        console.log(`✅ Inserted genre: ${genreName}`);
      } catch (error: any) {
        if (error.code === 'EREQUEST' && error.message.includes('UNIQUE constraint')) {
          console.log(`⚠️  Genre already exists: ${genreName}`);
        } else {
          console.error(`❌ Error inserting genre ${genreName}:`, error.message);
        }
      }
    }

    // Verify insertion
    const finalResult = await pool.request().query('SELECT COUNT(*) as count FROM genres');
    const finalCount = finalResult.recordset[0].count;
    console.log(`📊 Final genres count: ${finalCount}`);

    // Show all genres
    const allGenres = await pool.request().query('SELECT * FROM genres ORDER BY name');
    console.log('📋 All genres in database:');
    allGenres.recordset.forEach((genre: any, index: number) => {
      console.log(`  ${index + 1}. ${genre.name} (ID: ${genre.id})`);
    });

    console.log('🎉 Genres insertion completed successfully!');

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
  insertGenres()
    .then(() => {
      console.log('✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

export { insertGenres };
