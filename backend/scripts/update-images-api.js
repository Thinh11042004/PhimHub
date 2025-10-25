#!/usr/bin/env node

/**
 * API-based Image Path Update Script
 * 
 * This script updates image paths using the API endpoints
 */

const API_BASE_URL = 'http://localhost:3001/api';

// Helper function to make API calls
async function makeRequest(endpoint, options = {}) {
  try {
    const token = process.env.AUTH_TOKEN; // Get auth token from environment
    
    const defaultOptions = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      }
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...defaultOptions,
      ...options,
      headers: { ...defaultOptions.headers, ...options.headers }
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(`API Error: ${data.message || response.statusText}`);
    }
    
    return data;
  } catch (error) {
    console.error(`Request failed for ${endpoint}:`, error.message);
    throw error;
  }
}

// Image mappings from the download script
const imageMappings = [
  { id: 46, slug: 'the-gioi-moi', title: 'Thế Giới Mới' },
  { id: 47, slug: 'co-nang-ngo-ngao', title: 'Cô Nàng Ngổ Ngáo' },
  { id: 48, slug: 'thien-ac-quai', title: 'Thiện, Ác, Quái' },
  { id: 49, slug: '7-ngay-dia-nguc', title: '7 Ngày Địa Ngục' },
  { id: 50, slug: 'dieced-reloaded', title: 'Die\'ced: Reloaded' },
  { id: 51, slug: 'las-nubes', title: 'Las Nubes' },
  { id: 52, slug: 'bad-man', title: 'Bad Man' },
  { id: 43, slug: 'y-nu-bong-dem', title: 'Y Nữ Bóng Đêm' },
  { id: 44, slug: 'diep-vien-bat-dac-di', title: 'Điệp Viên Bất Đắc Dĩ' },
  { id: 45, slug: 'song', title: 'Sống' }
];

async function updateMovieImages() {
  console.log('🔄 Updating movie images via API...');
  
  for (const movie of imageMappings) {
    try {
      const thumbnailPath = `images/${movie.slug}.thumb.jpg`;
      const bannerPath = `images/${movie.slug}.banner.jpg`;
      const thumbnailUrl = `/uploads/${thumbnailPath}`;
      const bannerUrl = `/uploads/${bannerPath}`;
      
      const updateData = {
        local_thumbnail_path: thumbnailPath,
        thumbnail_url: thumbnailUrl,
        local_banner_path: bannerPath,
        banner_url: bannerUrl
      };
      
      const result = await makeRequest(`/movies/${movie.id}`, {
        method: 'PUT',
        body: JSON.stringify(updateData)
      });
      
      console.log(`✅ Updated ${movie.title} (ID: ${movie.id})`);
      
    } catch (error) {
      console.error(`❌ Failed to update ${movie.title}:`, error.message);
    }
  }
}

async function verifyUpdates() {
  console.log('\n📊 Verifying updates...');
  
  try {
    const result = await makeRequest('/movies?limit=1000');
    const movies = result.data.movies;
    
    const updatedMovies = movies.filter(movie => 
      imageMappings.some(mapping => mapping.id === movie.id)
    );
    
    console.log('\n📋 Updated movies:');
    updatedMovies.forEach(movie => {
      console.log(`   ${movie.id}. ${movie.title}`);
      console.log(`      Thumbnail: ${movie.thumbnail_url}`);
      console.log(`      Banner: ${movie.banner_url}`);
      console.log(`      Local Thumbnail: ${movie.local_thumbnail_path || 'N/A'}`);
      console.log(`      Local Banner: ${movie.local_banner_path || 'N/A'}`);
    });
    
  } catch (error) {
    console.error('❌ Failed to verify updates:', error.message);
  }
}

// Main execution
async function main() {
  console.log('🚀 API-based Image Path Update Script\n');
  
  if (!process.env.AUTH_TOKEN) {
    console.log('⚠️  No AUTH_TOKEN environment variable set.');
    console.log('   Set your token with: $env:AUTH_TOKEN="your_token_here"');
    return;
  }
  
  try {
    await updateMovieImages();
    await verifyUpdates();
    
    console.log('\n✅ Database update completed successfully!');
    
    console.log('\n💡 Next steps:');
    console.log('   1. Restart backend server to serve local images');
    console.log('   2. Clear frontend cache');
    console.log('   3. Test image loading in browser');
    
  } catch (error) {
    console.error('❌ Script execution failed:', error.message);
    process.exit(1);
  }
  
  console.log('\n🏁 Script completed!');
}

// Run if this script is executed directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { updateMovieImages, verifyUpdates };
