#!/usr/bin/env node

/**
 * Test New SQL Server Connection
 */

const sql = require('mssql');

async function testNewConnection() {
  console.log('🔌 Testing new SQL Server connection...\n');
  
  const config = {
    server: 'localhost',
    port: 1434, // New port
    database: 'master', // Connect to master first
    user: 'sa',
    password: 'PhimHub123!',
    options: {
      encrypt: false,
      trustServerCertificate: true,
      enableArithAbort: true,
      connectTimeout: 10000,
      requestTimeout: 10000
    }
  };
  
  try {
    console.log('📋 Connection details:');
    console.log(`   Server: ${config.server}:${config.port}`);
    console.log(`   Database: ${config.database}`);
    console.log(`   User: ${config.user}`);
    console.log(`   Password: ${config.password}\n`);
    
    const pool = new sql.ConnectionPool(config);
    await pool.connect();
    
    console.log('✅ Connection successful!');
    
    // Test query
    const result = await pool.request().query('SELECT @@VERSION as version');
    console.log(`📊 SQL Server Version: ${result.recordset[0].version.substring(0, 50)}...`);
    
    // Check if PhimHub database exists
    const dbResult = await pool.request().query(`
      SELECT name FROM sys.databases WHERE name = 'PhimHub'
    `);
    
    if (dbResult.recordset.length > 0) {
      console.log('✅ PhimHub database exists');
      
      // Switch to PhimHub database
      await pool.request().query('USE PhimHub');
      
      // Test movie count
      const movieResult = await pool.request().query('SELECT COUNT(*) as movieCount FROM dbo.movies');
      console.log(`🎬 Movies in database: ${movieResult.recordset[0].movieCount}`);
      
      // Test image data
      const imageResult = await pool.request().query(`
        SELECT COUNT(*) as imageCount 
        FROM dbo.movies 
        WHERE local_thumbnail_path IS NOT NULL OR local_banner_path IS NOT NULL
      `);
      console.log(`🖼️  Movies with local images: ${imageResult.recordset[0].imageCount}`);
      
    } else {
      console.log('⚠️  PhimHub database does not exist');
    }
    
    await pool.close();
    console.log('\n🎉 Database connection test completed successfully!');
    
    console.log('\n💡 For Database Connect extension, use these settings:');
    console.log('   Host: localhost');
    console.log('   Port: 1434');
    console.log('   Username: sa');
    console.log('   Password: Password123!');
    console.log('   Database: master (or PhimHub if it exists)');
    console.log('   Encrypt: false (or true with Trust Server Certificate)');
    
  } catch (error) {
    console.log(`❌ Connection failed: ${error.message}`);
  }
}

if (require.main === module) {
  testNewConnection().catch(console.error);
}
