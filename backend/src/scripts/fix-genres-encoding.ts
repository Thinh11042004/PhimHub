import sql from 'mssql';
import dotenv from 'dotenv';

dotenv.config();

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

async function fixGenresEncoding() {
  let pool: sql.ConnectionPool | null = null;
  
  try {
    console.log('🔌 Connecting to database...');
    pool = new sql.ConnectionPool(config);
    await pool.connect();
    console.log('✅ Connected to database successfully');

    // Correct Vietnamese genre names
    const correctGenres = [
      { id: 1, name: 'Âm nhạc' },
      { id: 2, name: 'Bí ẩn' },
      { id: 3, name: 'Chính kịch' },
      { id: 4, name: 'Chiến tranh' },
      { id: 5, name: 'Cổ trang' },
      { id: 6, name: 'Gia đình' },
      { id: 7, name: 'Hài hước' },
      { id: 8, name: 'Hành động' },
      { id: 9, name: 'Hình sự' },
      { id: 10, name: 'Học đường' },
      { id: 12, name: 'Khoa học' },
      { id: 13, name: 'Kinh dị' },
      { id: 14, name: 'Lịch sử' },
      { id: 15, name: 'Miền Tây' },
      { id: 16, name: 'Phiêu lưu' },
      { id: 17, name: 'Tâm lý' },
      { id: 18, name: 'Tài liệu' },
      { id: 19, name: 'Tình cảm' },
      { id: 21, name: 'Viễn tưởng' },
      { id: 27, name: 'Lãng mạn' },
      { id: 28, name: 'Khoa học viễn tưởng' },
      { id: 29, name: 'Thriller' },
      { id: 30, name: 'Hoạt hình' },
      { id: 31, name: 'Thể thao' },
      { id: 32, name: 'Western' },
      { id: 33, name: 'Fantasy' },
      { id: 34, name: 'Noir' }
    ];

    console.log('📝 Updating genre names with correct Vietnamese encoding...');
    
    for (const genre of correctGenres) {
      try {
        await pool.request()
          .input('id', sql.Int, genre.id)
          .input('name', sql.NVarChar, genre.name)
          .query('UPDATE genres SET name = @name WHERE id = @id');
        console.log(`✅ Updated genre ID ${genre.id}: ${genre.name}`);
      } catch (error: any) {
        console.error(`❌ Error updating genre ${genre.id}:`, error.message);
      }
    }

    // Verify updates
    const result = await pool.request().query('SELECT * FROM genres ORDER BY name');
    console.log('\n📋 Updated genres:');
    result.recordset.forEach((genre: any) => {
      console.log(`${genre.id.toString().padStart(2)} | ${genre.name}`);
    });

    console.log('\n🎉 Genre encoding fix completed!');

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
  fixGenresEncoding()
    .then(() => {
      console.log('✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

export { fixGenresEncoding };
