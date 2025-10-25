const axios = require('axios');
const fs = require('fs');
const path = require('path');

const API_BASE_URL = 'http://localhost:3001/api';
const AUTH_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEwMDMiLCJlbWFpbCI6InRlc3QxMjNAZXhhbXBsZS5jb20iLCJ1c2VybmFtZSI6InRlc3QxMjMiLCJyb2xlIjoidXNlciIsImlhdCI6MTc2MTM2MTczOSwiZXhwIjoxNzYxOTY2NTM5fQ.HDQomxzYwqhHWBfsVtBhKp-xRL2bRFMNZJH290jwN1I';

const UPLOADS_DIR = path.join(__dirname, '../uploads');
const IMAGES_DIR = path.join(UPLOADS_DIR, 'images');

// Ensure directories exist
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}
if (!fs.existsSync(IMAGES_DIR)) {
  fs.mkdirSync(IMAGES_DIR, { recursive: true });
}

async function downloadImage(url, destPath) {
  try {
    console.log(`📥 Downloading: ${url}`);
    const response = await axios({
      method: 'GET',
      url: url,
      responseType: 'stream',
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Referer': 'https://phimapi.com/',
        'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8'
      }
    });

    const writer = fs.createWriteStream(destPath);
    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on('finish', () => {
        console.log(`✅ Downloaded: ${path.basename(destPath)}`);
        resolve();
      });
      writer.on('error', reject);
    });
  } catch (error) {
    console.error(`❌ Failed to download ${url}:`, error.message);
    throw error;
  }
}

async function updateMovieImagePaths(movieId, updateData) {
  try {
    const response = await axios.put(`${API_BASE_URL}/movies/${movieId}`, updateData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AUTH_TOKEN}`
      }
    });
    return response.data;
  } catch (error) {
    console.error(`❌ Failed to update movie ${movieId}:`, error.message);
    throw error;
  }
}

async function processMoviesWithRemoteImages() {
  try {
    console.log('🔍 Fetching movies with remote images...');
    
    // Get all movies
    const response = await axios.get(`${API_BASE_URL}/movies?limit=1000`);
    const movies = response.data.data.movies || [];
    
    console.log(`📽️ Found ${movies.length} movies total`);
    
    // Filter movies that have remote URLs but not local paths
    const moviesToProcess = movies.filter(movie => {
      const hasRemoteThumbnail = movie.remote_thumbnail_url && movie.remote_thumbnail_url.startsWith('http');
      const hasLocalThumbnail = movie.local_thumbnail_path && movie.local_thumbnail_path.startsWith('images/');
      return hasRemoteThumbnail && !hasLocalThumbnail;
    });
    
    console.log(`🎯 Found ${moviesToProcess.length} movies with remote images to process`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < moviesToProcess.length; i++) {
      const movie = moviesToProcess[i];
      console.log(`\n[${i + 1}/${moviesToProcess.length}] Processing: ${movie.title}`);
      
      try {
        const updateData = {};
        
        // Process thumbnail
        if (movie.remote_thumbnail_url && movie.remote_thumbnail_url.startsWith('http')) {
          const thumbnailExt = path.extname(movie.remote_thumbnail_url) || '.jpg';
          const thumbnailFilename = `${movie.slug}.thumb${thumbnailExt}`;
          const thumbnailDestPath = path.join(IMAGES_DIR, thumbnailFilename);
          
          try {
            await downloadImage(movie.remote_thumbnail_url, thumbnailDestPath);
            updateData.local_thumbnail_path = `images/${thumbnailFilename}`;
            updateData.thumbnail_url = `/uploads/images/${thumbnailFilename}`;
          } catch (error) {
            console.log(`⚠️ Skipping thumbnail for ${movie.title}: ${error.message}`);
          }
        }
        
        // Process banner
        if (movie.remote_banner_url && movie.remote_banner_url.startsWith('http')) {
          const bannerExt = path.extname(movie.remote_banner_url) || '.jpg';
          const bannerFilename = `${movie.slug}.banner${bannerExt}`;
          const bannerDestPath = path.join(IMAGES_DIR, bannerFilename);
          
          try {
            await downloadImage(movie.remote_banner_url, bannerDestPath);
            updateData.local_banner_path = `images/${bannerFilename}`;
            updateData.banner_url = `/uploads/images/${bannerFilename}`;
          } catch (error) {
            console.log(`⚠️ Skipping banner for ${movie.title}: ${error.message}`);
          }
        }
        
        // Update movie if we have any updates
        if (Object.keys(updateData).length > 0) {
          await updateMovieImagePaths(movie.id, updateData);
          console.log(`✅ Updated: ${movie.title}`);
          successCount++;
        } else {
          console.log(`⏭️ No updates needed: ${movie.title}`);
        }
        
      } catch (error) {
        console.error(`❌ Error processing ${movie.title}:`, error.message);
        errorCount++;
      }
      
      // Small delay to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log(`\n🎉 Image processing completed!`);
    console.log(`📊 Final stats:`);
    console.log(`   ✅ Successfully processed: ${successCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log(`   📈 Total processed: ${successCount + errorCount}`);
    
  } catch (error) {
    console.error('💥 Image processing failed:', error.message);
    process.exit(1);
  }
}

console.log('🖼️ PhimHub Image Download Tool');
console.log('📁 Images will be saved to:', IMAGES_DIR);

processMoviesWithRemoteImages();
