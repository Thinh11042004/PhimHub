import sql from 'mssql';
import dotenv from 'dotenv';

dotenv.config();

const config: sql.config = {
  server: process.env.DB_HOST || process.env.DB_SERVER || 'localhost',
  database: process.env.DB_NAME || 'PhimHub',
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
  }
};

async function updateExistingEpisodes() {
  let pool: sql.ConnectionPool | null = null;
  
  try {
    console.log('🔌 Connecting to database...');
    pool = new sql.ConnectionPool(config);
    await pool.connect();
    console.log('✅ Connected to database successfully');

    // Find the movie "Bọ Ngựa"
    console.log('🔍 Finding "Bọ Ngựa" movie...');
    const movieResult = await pool.request()
      .input('title', sql.NVarChar, '%Bọ Ngựa%')
      .query(`
        SELECT id, title, slug
        FROM movies 
        WHERE title LIKE @title OR slug LIKE '%bo-ngua%'
      `);

    if (movieResult.recordset.length === 0) {
      console.log('❌ Movie "Bọ Ngựa" not found in database');
      return;
    }

    const movie = movieResult.recordset[0];
    console.log('📋 Found movie:', movie);

    // Get season ID
    const seasonResult = await pool.request()
      .input('movie_id', sql.Int, movie.id)
      .input('season_number', sql.Int, 1)
      .query(`
        SELECT id FROM seasons 
        WHERE movie_id = @movie_id AND season_number = @season_number
      `);

    if (seasonResult.recordset.length === 0) {
      console.log('❌ Season 1 not found');
      return;
    }

    const seasonId = seasonResult.recordset[0].id;
    console.log(`📺 Found Season 1 with ID: ${seasonId}`);

    // Update episodes 1 and 2
    console.log('🔄 Updating existing episodes...');
    
    // Update Episode 1
    await pool.request()
      .input('movie_id', sql.Int, movie.id)
      .input('episode_number', sql.Int, 1)
      .input('season_id', sql.Int, seasonId)
      .input('title', sql.NVarChar, 'Tập 1')
      .input('duration', sql.Int, 60)
      .query(`
        UPDATE episodes 
        SET season_id = @season_id, title = @title, duration = @duration
        WHERE movie_id = @movie_id AND episode_number = @episode_number
      `);
    console.log('✅ Updated Episode 1');

    // Update Episode 2
    await pool.request()
      .input('movie_id', sql.Int, movie.id)
      .input('episode_number', sql.Int, 2)
      .input('season_id', sql.Int, seasonId)
      .input('title', sql.NVarChar, 'Tập 2')
      .input('duration', sql.Int, 60)
      .query(`
        UPDATE episodes 
        SET season_id = @season_id, title = @title, duration = @duration
        WHERE movie_id = @movie_id AND episode_number = @episode_number
      `);
    console.log('✅ Updated Episode 2');

    // Verify final episodes
    console.log('\n📺 Final episodes list:');
    const finalEpisodesResult = await pool.request()
      .input('movie_id', sql.Int, movie.id)
      .query(`
        SELECT e.id, e.episode_number, e.title, e.duration, e.episode_url,
               s.season_number
        FROM episodes e
        LEFT JOIN seasons s ON e.season_id = s.id
        WHERE e.movie_id = @movie_id 
        ORDER BY e.episode_number
      `);

    const finalEpisodes = finalEpisodesResult.recordset;
    console.log(`📊 Total episodes: ${finalEpisodes.length}`);
    finalEpisodes.forEach(ep => {
      console.log(`  - Episode ${ep.episode_number}: ${ep.title} (${ep.duration} min) - Season ${ep.season_number}`);
    });

    console.log('\n🎉 Episode update completed successfully!');

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
  updateExistingEpisodes()
    .then(() => {
      console.log('🎉 Script completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Script failed:', error);
      process.exit(1);
    });
}

export default updateExistingEpisodes;
