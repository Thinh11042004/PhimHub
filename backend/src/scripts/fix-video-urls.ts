import sql from 'mssql';
import dotenv from 'dotenv';

dotenv.config();

const config: sql.config = {
  server: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'PhimHub',
  user: process.env.DB_USER || undefined,
  password: process.env.DB_PASS || undefined,
  port: parseInt(process.env.DB_PORT || '1433'),
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true',
    trustServerCertificate: process.env.DB_TRUST_SERVER_CERT === 'true',
    enableArithAbort: true,
    connectTimeout: 30000,
    requestTimeout: 30000,
    useUTC: true
  }
};

async function fixVideoUrls() {
  let pool: sql.ConnectionPool | null = null;
  
  try {
    console.log('🔌 Connecting to database...');
    pool = new sql.ConnectionPool(config);
    await pool.connect();
    console.log('✅ Connected to database successfully');

    // Update episodes with proper video URLs
    console.log('🔄 Updating video URLs for Bọ Ngựa episodes...');
    
    // Use a working sample video for all episodes
    const sampleVideoUrl = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
    
    for (let i = 1; i <= 8; i++) {
      await pool.request()
        .input('movie_id', sql.Int, 307)
        .input('episode_number', sql.Int, i)
        .input('episode_url', sql.NVarChar, sampleVideoUrl)
        .query(`
          UPDATE episodes 
          SET episode_url = @episode_url
          WHERE movie_id = @movie_id AND episode_number = @episode_number
        `);
      console.log(`✅ Updated Episode ${i} with working video URL`);
    }

    // Verify the updates
    console.log('\n📺 Verifying episodes:');
    const result = await pool.request()
      .input('movie_id', sql.Int, 307)
      .query(`
        SELECT episode_number, title, episode_url
        FROM episodes 
        WHERE movie_id = @movie_id 
        ORDER BY episode_number
      `);
    
    result.recordset.forEach(ep => {
      console.log(`  - Episode ${ep.episode_number}: ${ep.title}`);
      console.log(`    URL: ${ep.episode_url}`);
    });

    console.log('\n🎉 Video URLs updated successfully!');

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
  fixVideoUrls()
    .then(() => {
      console.log('🎉 Script completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Script failed:', error);
      process.exit(1);
    });
}

export default fixVideoUrls;
