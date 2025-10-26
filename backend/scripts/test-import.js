const axios = require('axios');

async function testImport() {
  try {
    console.log('Testing import with fresh token...');
    
    // Get fresh token
    const loginResponse = await axios.post('http://host.docker.internal:3001/api/auth/login', {
      identifier: 'admin',
      password: 'admin123'
    });
    
    const token = loginResponse.data.data.token;
    console.log('Got fresh token:', token.substring(0, 50) + '...');
    
    // Test import
    const importResponse = await axios.post('http://host.docker.internal:3001/api/movies/import-from-kkphim', {
      slug: 'thien-dia-kiem-tam',
      options: {
        auto_create_actors: true,
        auto_create_genres: true,
        auto_create_directors: true,
        import_episodes: true
      }
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Import successful:', importResponse.data.data.title);
  } catch (error) {
    console.error('❌ Import failed:', error.response?.status, error.response?.data?.message || error.message);
  }
}

testImport();
