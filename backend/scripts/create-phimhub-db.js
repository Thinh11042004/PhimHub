#!/usr/bin/env node

/**
 * Create PhimHub Database and Restore Data
 */

const sql = require('mssql');

async function createDatabase() {
  console.log('🔧 Creating PhimHub database...\n');
  
  const config = {
    server: 'localhost',
    port: 1433,
    database: 'master',
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
    const pool = new sql.ConnectionPool(config);
    await pool.connect();
    
    console.log('✅ Connected to SQL Server');
    
    // Create PhimHub database
    console.log('📊 Creating PhimHub database...');
    await pool.request().query(`
      IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'PhimHub')
      BEGIN
        CREATE DATABASE PhimHub;
        PRINT 'Database PhimHub created successfully';
      END
      ELSE
      BEGIN
        PRINT 'Database PhimHub already exists';
      END
    `);
    
    console.log('✅ PhimHub database created/verified');
    
    // Switch to PhimHub database
    await pool.request().query('USE PhimHub');
    console.log('✅ Switched to PhimHub database');
    
    // Check if tables exist
    const tablesResult = await pool.request().query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_TYPE = 'BASE TABLE'
    `);
    
    console.log(`📋 Found ${tablesResult.recordset.length} tables:`);
    tablesResult.recordset.forEach(table => {
      console.log(`   - ${table.TABLE_NAME}`);
    });
    
    if (tablesResult.recordset.length === 0) {
      console.log('\n⚠️  No tables found. You may need to run migrations.');
      console.log('💡 To restore data from the original container:');
      console.log('   1. Copy data from phimhub-sqlserver container');
      console.log('   2. Run migrations to create tables');
      console.log('   3. Import data from backup');
    }
    
    await pool.close();
    console.log('\n🎉 Database setup completed!');
    
    console.log('\n💡 For Database Connect extension, use these settings:');
    console.log('   Host: localhost');
    console.log('   Port: 1433');
    console.log('   Username: sa');
    console.log('   Password: PhimHub123!');
    console.log('   Database: PhimHub');
    console.log('   Encrypt: false (or true with Trust Server Certificate)');
    
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
}

if (require.main === module) {
  createDatabase().catch(console.error);
}
