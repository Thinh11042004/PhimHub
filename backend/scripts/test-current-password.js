#!/usr/bin/env node

/**
 * Test Database Connection with Current Password
 */

const sql = require('mssql');

async function testConnection() {
  console.log('🔌 Testing database connection with current password...\n');
  
  const config = {
    server: 'localhost',
    port: 1433,
    database: 'PhimHub',
    user: 'sa',
    password: 'password123',
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
    console.log(`   Password: ${config.password}`);
    console.log(`   Encrypt: ${config.options.encrypt}`);
    console.log(`   Trust Server Certificate: ${config.options.trustServerCertificate}\n`);
    
    const pool = new sql.ConnectionPool(config);
    await pool.connect();
    
    console.log('✅ Connection successful!');
    
    // Test query
    const result = await pool.request().query('SELECT @@VERSION as version');
    console.log(`📊 SQL Server Version: ${result.recordset[0].version.substring(0, 50)}...`);
    
    // Test database access
    const dbResult = await pool.request().query('SELECT COUNT(*) as movieCount FROM dbo.movies');
    console.log(`🎬 Movies in database: ${dbResult.recordset[0].movieCount}`);
    
    // Test image data
    const imageResult = await pool.request().query(`
      SELECT COUNT(*) as imageCount 
      FROM dbo.movies 
      WHERE local_thumbnail_path IS NOT NULL OR local_banner_path IS NOT NULL
    `);
    console.log(`🖼️  Movies with local images: ${imageResult.recordset[0].imageCount}`);
    
    await pool.close();
    console.log('\n🎉 Database connection test completed successfully!');
    
    console.log('\n💡 For Database Connect extension, use these settings:');
    console.log('   Host: localhost');
    console.log('   Port: 1433');
    console.log('   Username: sa');
    console.log('   Password: password123');
    console.log('   Database: PhimHub');
    console.log('   Encrypt: false (or true with Trust Server Certificate)');
    
  } catch (error) {
    console.log(`❌ Connection failed: ${error.message}`);
    
    if (error.message.includes('Login failed')) {
      console.log('\n💡 Troubleshooting:');
      console.log('   1. Make sure SQL Server container is running');
      console.log('   2. Check if password is correct');
      console.log('   3. Try restarting SQL Server container');
    }
  }
}

if (require.main === module) {
  testConnection().catch(console.error);
}
