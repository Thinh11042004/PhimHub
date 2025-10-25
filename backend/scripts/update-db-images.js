#!/usr/bin/env node

/**
 * Database Update Script for Image Paths
 * 
 * This script updates the database to use local image paths
 */

const sql = require('mssql');
const path = require('path');
require('dotenv').config();

// Database configuration from environment variables
const dbConfig = {
  server: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '1433'),
  database: process.env.DB_NAME || 'PhimHub',
  user: process.env.DB_USER || 'sa',
  password: process.env.DB_PASS || 'PhimHub123!',
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true',
    trustServerCertificate: process.env.DB_TRUST_SERVER_CERT === 'true',
    enableArithAbort: true,
    connectTimeout: 30000,
    requestTimeout: 30000,
    useUTC: true
  }
};

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

async function updateImagePaths() {
  let pool;
  
  try {
    console.log('🔌 Connecting to database...');
    pool = await sql.connect(dbConfig);
    console.log('✅ Connected to database');
    
    console.log('\n🔄 Updating image paths...');
    
    for (const movie of imageMappings) {
      const thumbnailPath = `images/${movie.slug}.thumb.jpg`;
      const bannerPath = `images/${movie.slug}.banner.jpg`;
      const thumbnailUrl = `/uploads/${thumbnailPath}`;
      const bannerUrl = `/uploads/${bannerPath}`;
      
      const result = await pool.request()
        .input('id', sql.Int, movie.id)
        .input('thumbnailPath', sql.NVarChar, thumbnailPath)
        .input('thumbnailUrl', sql.NVarChar, thumbnailUrl)
        .input('bannerPath', sql.NVarChar, bannerPath)
        .input('bannerUrl', sql.NVarChar, bannerUrl)
        .query(`
          UPDATE dbo.movies 
          SET 
            local_thumbnail_path = @thumbnailPath,
            thumbnail_url = @thumbnailUrl,
            local_banner_path = @bannerPath,
            banner_url = @bannerUrl,
            updated_at = SYSUTCDATETIME()
          WHERE id = @id
        `);
      
      console.log(`✅ Updated ${movie.title} (ID: ${movie.id})`);
    }
    
    console.log('\n📊 Verifying updates...');
    const result = await pool.request().query(`
      SELECT id, title, thumbnail_url, banner_url, local_thumbnail_path, local_banner_path 
      FROM dbo.movies 
      WHERE id IN (${imageMappings.map(m => m.id).join(',')})
      ORDER BY id
    `);
    
    console.log('\n📋 Updated movies:');
    result.recordset.forEach(movie => {
      console.log(`   ${movie.id}. ${movie.title}`);
      console.log(`      Thumbnail: ${movie.thumbnail_url}`);
      console.log(`      Banner: ${movie.banner_url}`);
    });
    
    console.log('\n✅ Database update completed successfully!');
    
  } catch (error) {
    console.error('❌ Database update failed:', error.message);
    throw error;
  } finally {
    if (pool) {
      await pool.close();
      console.log('🔌 Database connection closed');
    }
  }
}

// Main execution
async function main() {
  console.log('🚀 Database Image Path Update Script\n');
  
  try {
    await updateImagePaths();
    
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

module.exports = { updateImagePaths };
