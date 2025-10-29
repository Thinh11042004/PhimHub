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

async function fixBoNguaEpisodes() {
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
        SELECT id, title, slug, tmdb_id, is_series, number_of_episodes
        FROM movies 
        WHERE title LIKE @title OR slug LIKE '%bo-ngua%'
      `);

    if (movieResult.recordset.length === 0) {
      console.log('❌ Movie "Bọ Ngựa" not found in database');
      return;
    }

    const movie = movieResult.recordset[0];
    console.log('📋 Found movie:', {
      id: movie.id,
      title: movie.title,
      slug: movie.slug,
      tmdb_id: movie.tmdb_id,
      is_series: movie.is_series,
      expected_episodes: movie.number_of_episodes
    });

    // Check current episodes
    console.log('📺 Checking current episodes...');
    const episodesResult = await pool.request()
      .input('movie_id', sql.Int, movie.id)
      .query(`
        SELECT id, episode_number, title, duration, episode_url
        FROM episodes 
        WHERE movie_id = @movie_id 
        ORDER BY episode_number
      `);

    const currentEpisodes = episodesResult.recordset;
    console.log(`📊 Current episodes in DB: ${currentEpisodes.length}`);
    currentEpisodes.forEach(ep => {
      console.log(`  - Episode ${ep.episode_number}: ${ep.title || 'No title'} (${ep.duration || 'No duration'} min)`);
    });

    // Expected episodes from TMDB
    const expectedEpisodes = 8;
    console.log(`🎯 Expected episodes from TMDB: ${expectedEpisodes}`);

    if (currentEpisodes.length < expectedEpisodes) {
      console.log('🔄 Adding missing episodes...');
      
      // Create season if not exists
      let seasonId: number;
      const seasonResult = await pool.request()
        .input('movie_id', sql.Int, movie.id)
        .input('season_number', sql.Int, 1)
        .query(`
          SELECT id FROM seasons 
          WHERE movie_id = @movie_id AND season_number = @season_number
        `);

      if (seasonResult.recordset.length === 0) {
        console.log('📺 Creating Season 1...');
        const seasonInsertResult = await pool.request()
          .input('movie_id', sql.Int, movie.id)
          .input('season_number', sql.Int, 1)
          .input('title', sql.NVarChar, 'Season 1')
          .query(`
            INSERT INTO seasons (movie_id, season_number, title)
            OUTPUT INSERTED.id
            VALUES (@movie_id, @season_number, @title)
          `);
        seasonId = seasonInsertResult.recordset[0].id;
        console.log(`✅ Created Season 1 with ID: ${seasonId}`);
      } else {
        seasonId = seasonResult.recordset[0].id;
        console.log(`✅ Found existing Season 1 with ID: ${seasonId}`);
      }

      // Add missing episodes
      for (let i = 1; i <= expectedEpisodes; i++) {
        const existingEpisode = currentEpisodes.find(ep => ep.episode_number === i);
        
        if (!existingEpisode) {
          console.log(`➕ Adding Episode ${i}...`);
          await pool.request()
            .input('movie_id', sql.Int, movie.id)
            .input('season_id', sql.Int, seasonId)
            .input('episode_number', sql.Int, i)
            .input('title', sql.NVarChar, `Tập ${i}`)
            .input('duration', sql.Int, 60) // 60 minutes per episode
            .query(`
              INSERT INTO episodes (movie_id, season_id, episode_number, title, duration)
              VALUES (@movie_id, @season_id, @episode_number, @title, @duration)
            `);
          console.log(`✅ Added Episode ${i}`);
        } else {
          console.log(`⏭️  Episode ${i} already exists`);
        }
      }
    } else {
      console.log('✅ All episodes already exist');
    }

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

    // Update movie episode count if needed
    if (finalEpisodes.length !== movie.number_of_episodes) {
      console.log(`🔄 Updating movie episode count from ${movie.number_of_episodes} to ${finalEpisodes.length}...`);
      await pool.request()
        .input('id', sql.Int, movie.id)
        .input('episode_count', sql.Int, finalEpisodes.length)
        .query(`
          UPDATE movies 
          SET number_of_episodes = @episode_count, updated_at = GETUTCDATE()
          WHERE id = @id
        `);
      console.log('✅ Movie episode count updated');
    }

    console.log('\n🎉 Episode fix completed successfully!');

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
  fixBoNguaEpisodes()
    .then(() => {
      console.log('🎉 Script completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Script failed:', error);
      process.exit(1);
    });
}

export default fixBoNguaEpisodes;
