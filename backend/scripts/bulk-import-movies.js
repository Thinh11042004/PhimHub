#!/usr/bin/env node

/**
 * Bulk Import Movies Script
 * 
 * This script imports movies from KKPhim API directly without authentication
 * for quick database population.
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

/**
 * Bulk import latest movies from KKPhim API
 */
async function bulkImportLatestMovies(pages = 5, version = 'v1', options = {}) {
  console.log(`📦 Bulk importing latest movies (${pages} pages, version: ${version})`);
  
  try {
    const data = await makeRequest('/movies/bulk-import-from-kkphim', {
      method: 'POST',
      body: JSON.stringify({
        pages: pages,
        version: version,
        start_page: 1,
        options: {
          auto_create_actors: true,
          auto_create_genres: true,
          auto_create_directors: true,
          import_episodes: false, // Skip episodes for bulk import to save time
          ...options
        }
      })
    });
    
    console.log('✅ Bulk import completed!');
    console.log(`   📊 Results: ${data.data.imported} imported, ${data.data.skipped} skipped, ${data.data.errors} errors`);
    
    // Show some details
    const importedMovies = data.data.details.filter(item => item.status === 'imported');
    if (importedMovies.length > 0) {
      console.log('\n🎬 Recently imported movies:');
      importedMovies.slice(0, 10).forEach((movie, index) => {
        console.log(`   ${index + 1}. ${movie.title} (${movie.slug})`);
      });
      
      if (importedMovies.length > 10) {
        console.log(`   ... and ${importedMovies.length - 10} more movies`);
      }
    }
    
    return data.data;
  } catch (error) {
    console.error('❌ Bulk import failed:', error.message);
    return null;
  }
}

/**
 * Search for movies in KKPhim API
 */
async function searchMovies(query, page = 1) {
  console.log(`🔍 Searching KKPhim API for: "${query}"`);
  
  try {
    const data = await makeRequest(`/movies/search-kkphim?query=${encodeURIComponent(query)}&page=${page}`);
    
    console.log(`✅ Found ${data.data.items.length} movies`);
    console.log('📋 Search Results:');
    
    data.data.items.forEach((movie, index) => {
      console.log(`   ${index + 1}. ${movie.title} (${movie.year}) - ${movie.slug}`);
      console.log(`      Type: ${movie.type} | Quality: ${movie.quality} | Episodes: ${movie.episode_current}/${movie.episode_total}`);
    });
    
    return data.data;
  } catch (error) {
    console.error('❌ Search failed:', error.message);
    return null;
  }
}

/**
 * Get current movie count
 */
async function getCurrentMovieCount() {
  try {
    const data = await makeRequest('/movies?limit=1');
    const total = data.data.pagination.total;
    console.log(`📊 Current database has ${total} movies`);
    return total;
  } catch (error) {
    console.error('❌ Failed to get movie count:', error.message);
    return 0;
  }
}

// Main execution
async function main() {
  console.log('🚀 Bulk Import Movies Script\n');
  
  try {
    // Check current count
    console.log('='.repeat(50));
    console.log('CHECKING CURRENT DATABASE');
    console.log('='.repeat(50));
    
    const currentCount = await getCurrentMovieCount();
    console.log();
    
    // Test search first
    console.log('='.repeat(50));
    console.log('TESTING KKPHIM API CONNECTION');
    console.log('='.repeat(50));
    
    await searchMovies('phim mới', 1);
    console.log();
    
    // Bulk import
    console.log('='.repeat(50));
    console.log('STARTING BULK IMPORT');
    console.log('='.repeat(50));
    
    const result = await bulkImportLatestMovies(5, 'v1');
    
    if (result) {
      console.log('\n' + '='.repeat(50));
      console.log('IMPORT SUMMARY');
      console.log('='.repeat(50));
      console.log(`✅ Successfully imported: ${result.imported} movies`);
      console.log(`⏭️  Skipped (already exist): ${result.skipped} movies`);
      console.log(`❌ Errors: ${result.errors} movies`);
      
      // Check final count
      const finalCount = await getCurrentMovieCount();
      console.log(`📈 Database now has ${finalCount} movies (added ${finalCount - currentCount})`);
    }
    
  } catch (error) {
    console.error('❌ Script execution failed:', error.message);
  }
  
  console.log('\n🏁 Script completed!');
}

// Run if this script is executed directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  bulkImportLatestMovies,
  searchMovies,
  getCurrentMovieCount
};
