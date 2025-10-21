import Database from '../config/database';
import { MovieRepository } from '../models/MovieRepository';
import { ExternalAPIService } from '../services/external-api.service';
import { TMDbService } from '../services/tmdb.service';

async function fixCountryData() {
  try {
    console.log('🔍 Starting country data fix...');
    
    // Connect to database
    const db = Database.getInstance();
    await db.connect();
    console.log('✅ Connected to database');
    
    const movieRepo = new MovieRepository();
    const externalAPI = new ExternalAPIService();
    const tmdb = new TMDbService();
    
    // Get all movies
    const movies = await movieRepo.findAll({ limit: 1000 });
    console.log(`📊 Found ${movies.length} movies to check`);
    
    let fixedCount = 0;
    let skippedCount = 0;
    
    for (const movie of movies) {
      console.log(`\n🎬 Checking: ${movie.title} (${movie.slug})`);
      console.log(`   Current country: ${movie.country || 'NULL'}`);
      
      // Skip if country is already correct
      if (movie.country && movie.country !== 'Việt Nam') {
        console.log(`   ✅ Country already correct: ${movie.country}`);
        skippedCount++;
        continue;
      }
      
      let newCountry: string | null = null;
      
      // Try to get country from PhimAPI if external_id exists
      if (movie.external_id) {
        try {
          console.log(`   🔍 Checking PhimAPI for external_id: ${movie.external_id}`);
          const phimData = await externalAPI.getMovieBySlug(movie.slug);
          if (phimData.status && phimData.movie.country && phimData.movie.country.length > 0) {
            newCountry = phimData.movie.country[0].name;
            console.log(`   📡 Found country from PhimAPI: ${newCountry}`);
          }
        } catch (error) {
          console.log(`   ⚠️  PhimAPI lookup failed: ${error}`);
        }
      }
      
      // Try TMDb if we have tmdb_id
      if (!newCountry && movie.tmdb_id) {
        try {
          console.log(`   🔍 Checking TMDb for tmdb_id: ${movie.tmdb_id}`);
          const details = movie.is_series 
            ? await tmdb.getTVDetails(parseInt(movie.tmdb_id), 'vi-VN')
            : await tmdb.getMovieDetails(parseInt(movie.tmdb_id), 'vi-VN');
          
          if (details && details.production_countries && details.production_countries.length > 0) {
            newCountry = details.production_countries[0].name;
            console.log(`   📡 Found country from TMDb: ${newCountry}`);
          }
        } catch (error) {
          console.log(`   ⚠️  TMDb lookup failed: ${error}`);
        }
      }
      
      // Try to search TMDb by title if no tmdb_id
      if (!newCountry && !movie.tmdb_id) {
        try {
          console.log(`   🔍 Searching TMDb by title: ${movie.title}`);
          const searchResults = movie.is_series
            ? await tmdb.searchTV(movie.title, movie.release_year || undefined, 'vi-VN')
            : await tmdb.searchMovie(movie.title, movie.release_year || undefined, 'vi-VN');
          
          if (searchResults) {
            const details = movie.is_series
              ? await tmdb.getTVDetails(searchResults.id, 'vi-VN')
              : await tmdb.getMovieDetails(searchResults.id, 'vi-VN');
            
            if (details && details.production_countries && details.production_countries.length > 0) {
              newCountry = details.production_countries[0].name;
              console.log(`   📡 Found country from TMDb search: ${newCountry}`);
              
              // Also update tmdb_id
              await movieRepo.update(movie.id, { tmdb_id: searchResults.id.toString() });
              console.log(`   🔗 Updated tmdb_id: ${searchResults.id}`);
            }
          }
        } catch (error) {
          console.log(`   ⚠️  TMDb search failed: ${error}`);
        }
      }
      
      // Update country if found
      if (newCountry) {
        await movieRepo.update(movie.id, { country: newCountry });
        console.log(`   ✅ Updated country to: ${newCountry}`);
        fixedCount++;
      } else {
        console.log(`   ❌ Could not determine country for: ${movie.title}`);
      }
      
      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log(`\n🎉 Country data fix completed!`);
    console.log(`   ✅ Fixed: ${fixedCount} movies`);
    console.log(`   ⏭️  Skipped: ${skippedCount} movies`);
    console.log(`   ❌ Failed: ${movies.length - fixedCount - skippedCount} movies`);
    
  } catch (error) {
    console.error('❌ Error fixing country data:', error);
  } finally {
    const db = Database.getInstance();
    await db.disconnect();
    console.log('🔌 Disconnected from database');
  }
}

// Run the script
fixCountryData().catch(console.error);
