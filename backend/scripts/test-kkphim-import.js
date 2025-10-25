const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001/api';

// Test data - get a movie slug from KKPhim API first
async function getMovieSlug() {
  try {
    const response = await axios.get('https://phimapi.com/danh-sach/phim-moi-cap-nhat?page=1');
    const movies = response.data.items || [];
    if (movies.length > 0) {
      return movies[0].slug;
    }
    throw new Error('No movies found');
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
        // Note: This will fail without auth token, but we can see the error
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
