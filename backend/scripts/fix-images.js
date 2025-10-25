#!/usr/bin/env node

/**
 * Image Download and Fix Script
 * 
 * This script downloads images from external URLs and fixes the database paths
 * to resolve 404 errors in the frontend.
 */

const API_BASE_URL = 'http://localhost:3001/api';
const fs = require('fs');
const path = require('path');
const axios = require('axios');

// Helper function to make API calls
async function makeRequest(endpoint, options = {}) {
  try {
    const defaultOptions = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
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
 * Download image from URL and save to local storage
 */
async function downloadImage(url, localPath) {
  try {
    console.log(`📥 Downloading: ${url}`);
    
    // Ensure directory exists
    const dir = path.dirname(localPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // Download image
    const response = await axios.get(url, { 
      responseType: 'arraybuffer',
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    // Save to file
    fs.writeFileSync(localPath, response.data);
    console.log(`✅ Saved: ${localPath}`);
    
    return true;
  } catch (error) {
    console.error(`❌ Failed to download ${url}:`, error.message);
    return false;
  }
}

/**
 * Get all movies with external image URLs
 */
async function getMoviesWithExternalImages() {
  try {
    const data = await makeRequest('/movies?limit=1000');
    const movies = data.data.movies;
    
    const moviesWithExternalImages = movies.filter(movie => 
      movie.thumbnail_url && movie.thumbnail_url.startsWith('http') ||
      movie.banner_url && movie.banner_url.startsWith('http')
    );
    
    console.log(`📊 Found ${moviesWithExternalImages.length} movies with external images`);
    return moviesWithExternalImages;
  } catch (error) {
    console.error('❌ Failed to get movies:', error.message);
    return [];
  }
}

/**
 * Process a single movie's images
 */
async function processMovieImages(movie) {
  const uploadsDir = path.join(__dirname, '../uploads');
  const imagesDir = path.join(uploadsDir, 'images');
  
  // Ensure directories exist
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
  }
  
  const results = {
    movieId: movie.id,
    title: movie.title,
    slug: movie.slug,
    thumbnail: null,
    banner: null
  };
  
  // Process thumbnail
  if (movie.thumbnail_url && movie.thumbnail_url.startsWith('http')) {
    const ext = path.extname(movie.thumbnail_url) || '.jpg';
    const filename = `${movie.slug}.thumb${ext}`;
    const localPath = path.join(imagesDir, filename);
    const relativePath = `images/${filename}`;
    
    const success = await downloadImage(movie.thumbnail_url, localPath);
    if (success) {
      results.thumbnail = relativePath;
    }
  }
  
  // Process banner
  if (movie.banner_url && movie.banner_url.startsWith('http')) {
    const ext = path.extname(movie.banner_url) || '.jpg';
    const filename = `${movie.slug}.banner${ext}`;
    const localPath = path.join(imagesDir, filename);
    const relativePath = `images/${filename}`;
    
    const success = await downloadImage(movie.banner_url, localPath);
    if (success) {
      results.banner = relativePath;
    }
  }
  
  return results;
}

/**
 * Update movie database with local image paths
 */
async function updateMovieImages(movieId, thumbnailPath, bannerPath) {
  try {
    const updateData = {};
    if (thumbnailPath) {
      updateData.local_thumbnail_path = thumbnailPath;
      updateData.thumbnail_url = `/uploads/${thumbnailPath}`;
    }
    if (bannerPath) {
      updateData.local_banner_path = bannerPath;
      updateData.banner_url = `/uploads/${bannerPath}`;
    }
    
    if (Object.keys(updateData).length > 0) {
      console.log(`🔄 Updating movie ${movieId} with local paths`);
      // Note: This would require authentication and admin privileges
      // For now, we'll just log what needs to be updated
      console.log(`   Update data:`, updateData);
    }
  } catch (error) {
    console.error(`❌ Failed to update movie ${movieId}:`, error.message);
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Image Download and Fix Script\n');
  
  try {
    // Get movies with external images
    console.log('='.repeat(50));
    console.log('FETCHING MOVIES WITH EXTERNAL IMAGES');
    console.log('='.repeat(50));
    
    const movies = await getMoviesWithExternalImages();
    
    if (movies.length === 0) {
      console.log('✅ No movies with external images found');
      return;
    }
    
    // Process each movie
    console.log('\n' + '='.repeat(50));
    console.log('PROCESSING IMAGES');
    console.log('='.repeat(50));
    
    const results = [];
    for (let i = 0; i < Math.min(movies.length, 10); i++) { // Limit to 10 for testing
      const movie = movies[i];
      console.log(`\n🎬 Processing: ${movie.title} (${movie.slug})`);
      
      const result = await processMovieImages(movie);
      results.push(result);
      
      // Update database
      await updateMovieImages(result.movieId, result.thumbnail, result.banner);
      
      // Add delay to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('PROCESSING SUMMARY');
    console.log('='.repeat(50));
    
    const successful = results.filter(r => r.thumbnail || r.banner);
    console.log(`✅ Successfully processed: ${successful.length}/${results.length} movies`);
    
    successful.forEach(result => {
      console.log(`   ${result.title}:`);
      if (result.thumbnail) console.log(`     📷 Thumbnail: ${result.thumbnail}`);
      if (result.banner) console.log(`     🖼️  Banner: ${result.banner}`);
    });
    
    console.log('\n💡 Next steps:');
    console.log('   1. Update database with local paths (requires admin access)');
    console.log('   2. Restart backend to serve local images');
    console.log('   3. Clear frontend cache');
    
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
  downloadImage,
  getMoviesWithExternalImages,
  processMovieImages
};
