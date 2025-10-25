const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001/api';
const AUTH_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEwMDMiLCJlbWFpbCI6InRlc3QxMjNAZXhhbXBsZS5jb20iLCJ1c2VybmFtZSI6InRlc3QxMjMiLCJyb2xlIjoidXNlciIsImlhdCI6MTc2MTM2MTczOSwiZXhwIjoxNzYxOTY2NTM5fQ.HDQomxzYwqhHWBfsVtBhKp-xRL2bRFMNZJH290jwN1I';

// Test data - get a movie slug from KKPhim API first
async function getMovieSlug() {
  try {
    const response = await axios.get('https://phimapi.com/danh-sach/phim-moi-cap-nhat?page=1');
    const movies = response.data.items || [];
    
    // Try to find a movie that's not already in our database
    for (let i = 0; i < Math.min(10, movies.length); i++) {
      const movie = movies[i];
      console.log(`🔍 Checking movie ${i + 1}: ${movie.slug}`);
      
      // Check if movie exists in our database
      try {
        const checkResponse = await axios.get(`${API_BASE_URL}/movies/${movie.slug}`);
        console.log(`⚠️ Movie ${movie.slug} already exists in database`);
      } catch (error) {
        if (error.response?.status === 404) {
          console.log(`✅ Movie ${movie.slug} not found in database, can import`);
          return movie.slug;
        }
      }
    }
    
    throw new Error('No new movies found to import');
  } catch (error) {
    console.error('Error getting movie slug:', error.message);
    throw error;
  }
}

async function testImport() {
  try {
    console.log('🔍 Getting movie slug from KKPhim API...');
    const slug = await getMovieSlug();
    console.log(`📽️ Found movie slug: ${slug}`);

    console.log('📥 Testing import endpoint...');
    const importResponse = await axios.post(`${API_BASE_URL}/movies/import-from-kkphim`, {
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

    console.log('✅ Import successful:', importResponse.data);
  } catch (error) {
    if (error.response) {
      console.log('❌ Import failed:', error.response.status, error.response.data);
    } else {
      console.log('❌ Network error:', error.message);
    }
  }
}

testImport();
