#!/usr/bin/env node

/**
 * SQL Server Password Test Script
 */

const sql = require('mssql');

// Test different passwords
const passwords = [
  'PhimHub123!',
  'PhimHub123',
  'phimhub123',
  'Password123!',
  'password123',
  'sa123',
  '123456',
  'admin123'
];

async function testPassword(password) {
  console.log(`\n🔐 Testing password: ${password}`);
  
  const config = {
    server: 'localhost',
    port: 1433,
    database: 'PhimHub',
    user: 'sa',
    password: password,
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
    
    const result = await pool.request().query('SELECT @@VERSION as version');
    console.log(`✅ SUCCESS! Password works: ${password}`);
    console.log(`   SQL Server Version: ${result.recordset[0].version.substring(0, 50)}...`);
    
    await pool.close();
    return password;
  } catch (error) {
    console.log(`❌ Failed: ${error.message}`);
    return null;
  }
}

async function main() {
  console.log('🚀 SQL Server Password Test\n');
  console.log('Testing different passwords for SA user...\n');
  
  let workingPassword = null;
  
  for (const password of passwords) {
    const result = await testPassword(password);
    if (result) {
      workingPassword = result;
      break;
    }
  }
  
  if (workingPassword) {
    console.log(`\n🎉 Found working password: ${workingPassword}`);
    console.log('\n💡 Next steps:');
    console.log('   1. Update docker-compose.yml with the working password');
    console.log('   2. Restart SQL Server container');
    console.log('   3. Test database connection again');
  } else {
    console.log('\n❌ No working password found');
    console.log('\n💡 Troubleshooting steps:');
    console.log('   1. Check if SQL Server is configured for mixed authentication');
    console.log('   2. Verify SA account is enabled');
    console.log('   3. Check SQL Server error logs for more details');
    console.log('   4. Try connecting from within the container');
  }
  
  console.log('\n🏁 Test completed!');
}

if (require.main === module) {
  main().catch(console.error);
}
