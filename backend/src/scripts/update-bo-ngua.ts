import sql from 'mssql';
import dotenv from 'dotenv';
import { TMDbService } from '../services/tmdb.service';

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

async function updateBoNgua() {
  let pool: sql.ConnectionPool | null = null;
  
  try {
    console.log('🔌 Connecting to database...');
    pool = new sql.ConnectionPool(config);
    await pool.connect();
    console.log('✅ Connected to database successfully');

    // Initialize TMDB service
    const tmdb = new TMDbService();
    
    // TMDB ID for "Bọ Ngựa" (Mantis)
    const tmdbId = 243248;
    
    console.log('🎬 Fetching TMDB data for Bọ Ngựa (ID: 243248)...');
    
    // Get TV series details from TMDB
    const tvDetails = await tmdb.getTVDetails(tmdbId, 'vi-VN');
    console.log('📺 TV Details:', {
      name: tvDetails?.name,
      original_name: tvDetails?.original_name,
      first_air_date: tvDetails?.first_air_date,
      last_air_date: tvDetails?.last_air_date,
      number_of_episodes: tvDetails?.number_of_episodes,
      number_of_seasons: tvDetails?.number_of_seasons,
      episode_run_time: tvDetails?.episode_run_time,
      status: tvDetails?.status,
      vote_average: tvDetails?.vote_average,
      vote_count: tvDetails?.vote_count,
      popularity: tvDetails?.popularity
    });

    // Get TV series credits
    const credits = await tmdb.getTVCredits(tmdbId);
    console.log('👥 Cast & Crew:', {
      cast_count: credits?.cast?.length || 0,
      crew_count: credits?.crew?.length || 0
    });

    // Find the movie in our database
    console.log('🔍 Searching for "Bọ Ngựa" in database...');
    const movieResult = await pool.request()
      .input('title', sql.NVarChar, '%Bọ Ngựa%')
      .query(`
        SELECT id, title, slug, tmdb_id, is_series, release_year, 
               external_rating, external_rating_count, external_view_count,
               original_title, country, number_of_episodes
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
      current_episodes: movie.number_of_episodes
    });

    // Update movie with correct TMDB data
    const updateData = {
      tmdb_id: tmdbId.toString(),
      external_rating: tvDetails?.vote_average || null,
      external_rating_count: tvDetails?.vote_count || null,
      external_view_count: tvDetails?.popularity || null,
      original_title: tvDetails?.original_name || null,
      country: tvDetails?.origin_country && tvDetails.origin_country.length > 0 
        ? tvDetails.origin_country[0] 
        : null,
      number_of_episodes: tvDetails?.number_of_episodes || null,
      number_of_seasons: tvDetails?.number_of_seasons || null,
      first_air_date: tvDetails?.first_air_date || null,
      last_air_date: tvDetails?.last_air_date || null,
      episode_run_time: tvDetails?.episode_run_time?.[0] || null
    };

    console.log('🔄 Updating movie with TMDB data:', updateData);

    await pool.request()
      .input('id', sql.Int, movie.id)
      .input('tmdb_id', sql.NVarChar, updateData.tmdb_id)
      .input('external_rating', sql.Float, updateData.external_rating)
      .input('external_rating_count', sql.Int, updateData.external_rating_count)
      .input('external_view_count', sql.Float, updateData.external_view_count)
      .input('original_title', sql.NVarChar, updateData.original_title)
      .input('country', sql.NVarChar, updateData.country)
      .input('number_of_episodes', sql.Int, updateData.number_of_episodes)
      .input('number_of_seasons', sql.Int, updateData.number_of_seasons)
      .input('first_air_date', sql.Date, updateData.first_air_date)
      .input('last_air_date', sql.Date, updateData.last_air_date)
      .input('episode_run_time', sql.Int, updateData.episode_run_time)
      .query(`
        UPDATE movies SET 
          tmdb_id = @tmdb_id,
          external_rating = @external_rating,
          external_rating_count = @external_rating_count,
          external_view_count = @external_view_count,
          original_title = @original_title,
          country = @country,
          number_of_episodes = @number_of_episodes,
          number_of_seasons = @number_of_seasons,
          first_air_date = @first_air_date,
          last_air_date = @last_air_date,
          episode_run_time = @episode_run_time,
          updated_at = GETUTCDATE()
        WHERE id = @id
      `);

    console.log('✅ Movie updated successfully!');

    // Update episodes if it's a series
    if (tvDetails?.number_of_episodes && tvDetails.number_of_episodes > 0) {
      console.log('📺 Updating episodes...');
      
      // Get current episodes count
      const episodesResult = await pool.request()
        .input('movie_id', sql.Int, movie.id)
        .query('SELECT COUNT(*) as count FROM episodes WHERE movie_id = @movie_id');
      
      const currentEpisodes = episodesResult.recordset[0].count;
      console.log(`📊 Current episodes in DB: ${currentEpisodes}, TMDB episodes: ${tvDetails.number_of_episodes}`);
      
      if (currentEpisodes !== tvDetails.number_of_episodes) {
        console.log('⚠️  Episode count mismatch! Manual review needed.');
      }
    }

    // Display final information
    console.log('\n📋 Final Movie Information:');
    console.log(`Title: ${movie.title}`);
    console.log(`TMDB ID: ${tmdbId}`);
    console.log(`Episodes: ${tvDetails?.number_of_episodes || 'N/A'}`);
    console.log(`Seasons: ${tvDetails?.number_of_seasons || 'N/A'}`);
    console.log(`TMDB Status: ${tvDetails?.status || 'N/A'}`);
    console.log(`Rating: ${tvDetails?.vote_average || 'N/A'}/10 (${tvDetails?.vote_count || 0} votes)`);
    console.log(`Popularity: ${tvDetails?.popularity || 'N/A'}`);
    console.log(`First Air Date: ${tvDetails?.first_air_date || 'N/A'}`);
    console.log(`Last Air Date: ${tvDetails?.last_air_date || 'N/A'}`);
    console.log(`Episode Runtime: ${tvDetails?.episode_run_time?.[0] || 'N/A'} minutes`);
    console.log(`Country: ${tvDetails?.origin_country?.[0] || 'N/A'}`);
    console.log(`Original Title: ${tvDetails?.original_name || 'N/A'}`);

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
  updateBoNgua()
    .then(() => {
      console.log('🎉 Script completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Script failed:', error);
      process.exit(1);
    });
}

export default updateBoNgua;
