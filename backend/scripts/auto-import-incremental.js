const axios = require('axios');
const fs = require('fs');
const path = require('path');

const API_BASE_URL = 'http://localhost:3001/api';
const KKPHIM_API_BASE_URL = 'https://phimapi.com/v1/api';

// Create a test user for authentication
const TEST_USER = {
  email: 'autobot@phimhub.com',
  username: 'autobot',
  password: 'AutoBot123!'
};

let AUTH_TOKEN = null;

async function createTestUser() {
  try {
    console.log('🔐 Creating test user for auto-import...');
    
    // Try to register the user
    try {
      await axios.post(`${API_BASE_URL}/auth/register`, TEST_USER);
      console.log('✅ Test user created successfully');
    } catch (error) {
      if (error.response?.status === 400 && error.response?.data?.message?.includes('already exists')) {
        console.log('ℹ️ Test user already exists');
      } else {
        throw error;
      }
    }
    
    // Login to get token
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: TEST_USER.email,
      password: TEST_USER.password
    });
    
    AUTH_TOKEN = loginResponse.data.token;
    console.log('✅ Authentication successful');
    
  } catch (error) {
    console.error('❌ Authentication failed:', error.message);
    throw error;
  }
}

async function getMovieSlugsFromKKPhim(page = 1, limit = 20) {
  try {
    const response = await axios.get(`${KKPHIM_API_BASE_URL}/danh-sach/phim-moi-cap-nhat?page=${page}&limit=${limit}`);
    return response.data.data.items || [];
  } catch (error) {
    console.error('Error fetching movie slugs from KKPhim API:', error.message);
    return [];
  }
}

async function checkMovieExists(slug) {
  try {
    const response = await axios.get(`${API_BASE_URL}/movies/${slug}`);
    return response.data.success;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      return false;
    }
    console.error(`Error checking movie ${slug} existence:`, error.message);
    return false;
  }
}

async function importMovie(slug) {
  try {
    console.log(`📥 Importing movie: ${slug}...`);
    const response = await axios.post(`${API_BASE_URL}/movies/import-from-kkphim`, { slug }, {
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`
      }
    });
    console.log(`✅ Successfully imported: ${slug}`);
    return response.data;
  } catch (error) {
    console.error(`❌ Failed to import ${slug}:`, error.response?.status, error.response?.data || error.message);
    return null;
  }
}

async function downloadMissingImages() {
  try {
    console.log('🖼️ Checking for missing images...');
    
    const response = await axios.get(`${API_BASE_URL}/movies?limit=1000`);
    const movies = response.data.data.movies || [];
    
    const moviesToProcess = movies.filter(movie => {
      const hasRemoteThumbnail = movie.remote_thumbnail_url && movie.remote_thumbnail_url.startsWith('http');
      const hasLocalThumbnail = movie.local_thumbnail_path && movie.local_thumbnail_path.startsWith('images/');
      return hasRemoteThumbnail && !hasLocalThumbnail;
    });
    
    if (moviesToProcess.length === 0) {
      console.log('✅ All images are already downloaded');
      return;
    }
    
    console.log(`📥 Found ${moviesToProcess.length} movies with missing images, downloading...`);
    
    const UPLOADS_DIR = path.join(__dirname, '../uploads');
    const IMAGES_DIR = path.join(UPLOADS_DIR, 'images');
    
    if (!fs.existsSync(UPLOADS_DIR)) {
      fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    }
    if (!fs.existsSync(IMAGES_DIR)) {
      fs.mkdirSync(IMAGES_DIR, { recursive: true });
    }
    
    let successCount = 0;
    
    for (const movie of moviesToProcess.slice(0, 50)) { // Limit to 50 to avoid timeout
      try {
        const updateData = {};
        
        if (movie.remote_thumbnail_url && movie.remote_thumbnail_url.startsWith('http')) {
          const thumbnailExt = path.extname(movie.remote_thumbnail_url) || '.jpg';
          const thumbnailFilename = `${movie.slug}.thumb${thumbnailExt}`;
          const thumbnailDestPath = path.join(IMAGES_DIR, thumbnailFilename);
          
          try {
            const imageResponse = await axios({
              method: 'GET',
              url: movie.remote_thumbnail_url,
              responseType: 'stream',
              timeout: 30000,
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Referer': 'https://phimapi.com/',
                'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8'
              }
            });
            
            const writer = fs.createWriteStream(thumbnailDestPath);
            imageResponse.data.pipe(writer);
            
            await new Promise((resolve, reject) => {
              writer.on('finish', resolve);
              writer.on('error', reject);
            });
            
            updateData.local_thumbnail_path = `images/${thumbnailFilename}`;
            updateData.thumbnail_url = `/uploads/images/${thumbnailFilename}`;
          } catch (error) {
            console.log(`⚠️ Skipping thumbnail for ${movie.title}: ${error.message}`);
          }
        }
        
        if (Object.keys(updateData).length > 0) {
          await axios.put(`${API_BASE_URL}/movies/${movie.id}`, updateData, {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${AUTH_TOKEN}`
            }
          });
          successCount++;
        }
        
      } catch (error) {
        console.error(`❌ Error processing ${movie.title}:`, error.message);
      }
      
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    console.log(`✅ Downloaded images for ${successCount} movies`);
    
  } catch (error) {
    console.error('❌ Error downloading images:', error.message);
  }
}

async function incrementalImport() {
  try {
    console.log('🔄 Starting incremental import...');
    
    await createTestUser();
    
    let page = 1;
    let importedCount = 0;
    let checkedCount = 0;
    const maxPages = 10; // Check first 10 pages for new movies
    
    while (page <= maxPages) {
      const movies = await getMovieSlugsFromKKPhim(page);
      if (movies.length === 0) {
        break;
      }
      
      console.log(`📄 Checking page ${page} (${movies.length} movies)...`);
      
      for (const movie of movies) {
        checkedCount++;
        const exists = await checkMovieExists(movie.slug);
        if (!exists) {
          const result = await importMovie(movie.slug);
          if (result) {
            importedCount++;
          }
          
          // Stop if we've imported enough new movies
          if (importedCount >= 20) {
            console.log('🛑 Reached import limit (20 movies), stopping...');
            break;
          }
        }
        
        // Small delay to avoid overwhelming the API
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      if (importedCount >= 20) {
        break;
      }
      
      page++;
    }
    
    console.log(`📊 Incremental import completed:`);
    console.log(`   🔍 Checked: ${checkedCount} movies`);
    console.log(`   📥 Imported: ${importedCount} new movies`);
    
    if (importedCount > 0) {
      console.log('🖼️ Downloading images for new movies...');
      await downloadMissingImages();
    }
    
  } catch (error) {
    console.error('💥 Incremental import failed:', error.message);
    process.exit(1);
  }
}

console.log('🔄 PhimHub Incremental Auto Import');
console.log('📅 ' + new Date().toISOString());

incrementalImport();

