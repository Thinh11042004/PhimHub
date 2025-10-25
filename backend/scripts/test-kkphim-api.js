#!/usr/bin/env node

/**
 * KKPhim API Integration Test Script
 * 
 * This script demonstrates how to use the KKPhim API to import movies into your database.
 * Make sure your backend server is running before executing this script.
 */

const API_BASE_URL = 'http://localhost:3001/api';

// Helper function to make API calls
async function makeRequest(endpoint, options = {}) {
  try {
    const token = process.env.AUTH_TOKEN; // Set your auth token as environment variable
    
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

// Test functions

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
 * Import a single movie from KKPhim API
 */
async function importMovie(slug, options = {}) {
  console.log(`📥 Importing movie from KKPhim API: ${slug}`);
  
  try {
    const data = await makeRequest('/movies/import-from-kkphim', {
      method: 'POST',
      body: JSON.stringify({
        slug: slug,
        options: {
          auto_create_actors: true,
          auto_create_genres: true,
          auto_create_directors: true,
          import_episodes: true,
          ...options
        }
      })
    });
    
    console.log('✅ Movie imported successfully!');
    console.log(`   Movie ID: ${data.data?.id}`);
    console.log(`   Title: ${data.data?.title}`);
    
    return data.data;
  } catch (error) {
    console.error('❌ Import failed:', error.message);
    return null;
  }
}

/**
 * Bulk import latest movies from KKPhim API
 */
async function bulkImportLatestMovies(pages = 2, version = 'v1', options = {}) {
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
      importedMovies.slice(0, 5).forEach((movie, index) => {
        console.log(`   ${index + 1}. ${movie.title} (${movie.slug})`);
      });
      
      if (importedMovies.length > 5) {
        console.log(`   ... and ${importedMovies.length - 5} more movies`);
      }
    }
    
    return data.data;
  } catch (error) {
    console.error('❌ Bulk import failed:', error.message);
    return null;
  }
}

// Main execution
async function main() {
  console.log('🚀 KKPhim API Integration Test\n');
  
  // Check if we have authentication token
  if (!process.env.AUTH_TOKEN) {
    console.log('⚠️  No AUTH_TOKEN environment variable set. Some operations may fail.');
    console.log('   Set your token with: $env:AUTH_TOKEN="your_token_here" (PowerShell)');
    console.log('   Or use: set AUTH_TOKEN=your_token_here (CMD)\n');
  }
  
  try {
    // Test 1: Search for movies
    console.log('='.repeat(50));
    console.log('TEST 1: Search Movies');
    console.log('='.repeat(50));
    
    await searchMovies('avenger', 1);
    console.log();
    
    // Test 2: Import a specific movie (you can change this slug)
    console.log('='.repeat(50));
    console.log('TEST 2: Import Single Movie');
    console.log('='.repeat(50));
    
    // Example movie slug - replace with actual slug from search results
    const movieSlug = 'batman-2022'; // Change this to a real slug from the API
    console.log(`💡 To import a movie, use a real slug from the search results above.`);
    console.log(`💡 Example: await importMovie('${movieSlug}');`);
    console.log();
    
    // Test 3: Bulk import (commented out by default to avoid importing too many movies)
    console.log('='.repeat(50));
    console.log('TEST 3: Bulk Import (Preview)');
    console.log('='.repeat(50));
    
    console.log('💡 To bulk import movies, uncomment the following line:');
    console.log('💡 await bulkImportLatestMovies(2, "v1");');
    
    // Uncomment this line to actually perform bulk import:
    // await bulkImportLatestMovies(2, 'v1');
    
  } catch (error) {
    console.error('❌ Test execution failed:', error.message);
  }
  
  console.log('\n🏁 Test completed!');
}

// Export functions for use as module
module.exports = {
  searchMovies,
  importMovie,
  bulkImportLatestMovies,
  makeRequest
};

// Run tests if this script is executed directly
if (require.main === module) {
  main().catch(console.error);
}
