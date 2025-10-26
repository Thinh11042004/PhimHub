const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001/api';

// Test user credentials for bulk import
const TEST_USER = {
  email: 'bulkimport@phimhub.com',
  username: 'bulkimport',
  password: 'BulkImport123!'
};

let AUTH_TOKEN = null;

async function authenticateUser() {
  try {
    console.log('🔐 Authenticating user for bulk import...');
    
    // Try to register the user first
    try {
      await axios.post(`${API_BASE_URL}/auth/register`, TEST_USER);
      console.log('✅ Test user created successfully');
    } catch (error) {
      if (error.response?.status === 400 && error.response?.data?.message?.includes('already exists')) {
        console.log('ℹ️ Test user already exists');
      } else if (error.response?.status === 409) {
        console.log('ℹ️ Test user already exists (409)');
      } else {
        console.log('⚠️ User registration failed, but continuing with login attempt...');
      }
    }
    
    // Login to get token
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      identifier: TEST_USER.email,
      password: TEST_USER.password
    });
    
    AUTH_TOKEN = loginResponse.data.data.token;
    console.log('✅ Authentication successful');
    console.log('🔑 Token received:', AUTH_TOKEN ? 'Yes' : 'No');
    
  } catch (error) {
    console.error('❌ Authentication failed:', error.message);
    throw error;
  }
}

async function getKKPhimMovies(page = 1) {
  try {
    const response = await axios.get(`https://phimapi.com/danh-sach/phim-moi-cap-nhat?page=${page}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching page ${page}:`, error.message);
    throw error;
  }
}

async function importMovie(slug) {
  try {
    const response = await axios.post(`${API_BASE_URL}/movies/import-from-kkphim`, {
      slug: slug,
      options: {
        auto_create_actors: true,
        auto_create_genres: true,
        auto_create_directors: true,
        import_episodes: true
      }
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AUTH_TOKEN}`
      }
    });
    return { success: true, data: response.data };
  } catch (error) {
    if (error.response?.status === 500 && error.response?.data?.error?.includes('duplicate key')) {
      return { success: false, reason: 'already_exists' };
    }
    return { success: false, reason: 'error', error: error.message };
  }
}

async function bulkImportMovies(startPage = 1, maxPages = 10) {
  console.log(`🚀 Starting bulk import from page ${startPage} to ${startPage + maxPages - 1}`);
  
  // Authenticate first
  await authenticateUser();
  
  let totalImported = 0;
  let totalSkipped = 0;
  let totalErrors = 0;
  
  for (let page = startPage; page < startPage + maxPages; page++) {
    console.log(`\n📄 Processing page ${page}...`);
    
    try {
      const kkphimData = await getKKPhimMovies(page);
      const movies = kkphimData.items || [];
      
      console.log(`📽️ Found ${movies.length} movies on page ${page}`);
      
      for (let i = 0; i < movies.length; i++) {
        const movie = movies[i];
        console.log(`  [${i + 1}/${movies.length}] Importing: ${movie.name} (${movie.slug})`);
        
        const result = await importMovie(movie.slug);
        
        if (result.success) {
          console.log(`    ✅ Imported successfully`);
          totalImported++;
        } else if (result.reason === 'already_exists') {
          console.log(`    ⏭️ Already exists, skipping`);
          totalSkipped++;
        } else {
          console.log(`    ❌ Error: ${result.error}`);
          totalErrors++;
        }
        
        // Small delay to avoid overwhelming the API
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      console.log(`📊 Page ${page} completed: ${totalImported} imported, ${totalSkipped} skipped, ${totalErrors} errors`);
      
    } catch (error) {
      console.error(`❌ Error processing page ${page}:`, error.message);
      totalErrors++;
    }
    
    // Delay between pages
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log(`\n🎉 Bulk import completed!`);
  console.log(`📊 Final stats:`);
  console.log(`   ✅ Imported: ${totalImported}`);
  console.log(`   ⏭️ Skipped: ${totalSkipped}`);
  console.log(`   ❌ Errors: ${totalErrors}`);
  console.log(`   📈 Total processed: ${totalImported + totalSkipped + totalErrors}`);
}

// Get command line arguments
const args = process.argv.slice(2);
const startPage = parseInt(args[0]) || 1;
const maxPages = parseInt(args[1]) || 5;

console.log(`🎬 PhimHub Bulk Import Tool`);
console.log(`📄 Starting from page: ${startPage}`);
console.log(`📄 Max pages to process: ${maxPages}`);
console.log(`📄 Total movies to process: ~${maxPages * 10}`);

bulkImportMovies(startPage, maxPages).catch(error => {
  console.error('💥 Bulk import failed:', error.message);
  process.exit(1);
});