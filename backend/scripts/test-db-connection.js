#!/usr/bin/env node

/**
 * Simple Database Connection Test
 */

const sql = require('mssql');

// Test different connection configurations
const configs = [
  {
    name: 'Config 1: Basic',
    config: {
      server: 'localhost',
      port: 1433,
      database: 'PhimHub',
      user: 'sa',
      password: 'PhimHub123!',
      options: {
        encrypt: false,
        trustServerCertificate: true,
        enableArithAbort: true
      }
    }
  },
  {
    name: 'Config 2: With Encrypt',
    config: {
      server: 'localhost',
      port: 1433,
      database: 'PhimHub',
      user: 'sa',
      password: 'PhimHub123!',
      options: {
        encrypt: true,
        trustServerCertificate: true,
        enableArithAbort: true
      }
    }
  },
  {
    name: 'Config 3: Docker Internal',
    config: {
      server: 'sqlserver',
      port: 1433,
      database: 'PhimHub',
      user: 'sa',
      password: 'PhimHub123!',
      options: {
        encrypt: false,
        trustServerCertificate: true,
        enableArithAbort: true
      }
    }
  }
];

async function testConnection(config) {
  console.log(`\n🔌 Testing ${config.name}...`);
  console.log(`   Server: ${config.config.server}:${config.config.port}`);
  console.log(`   Database: ${config.config.database}`);
  console.log(`   User: ${config.config.user}`);
  
  try {
    const pool = new sql.ConnectionPool(config.config);
    await pool.connect();
    
    const result = await pool.request().query('SELECT @@VERSION as version');
    console.log(`✅ Connection successful!`);
    console.log(`   SQL Server Version: ${result.recordset[0].version.substring(0, 50)}...`);
    
    await pool.close();
    return true;
  } catch (error) {
    console.log(`❌ Connection failed: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('🚀 Database Connection Test\n');
  
  let success = false;
  for (const config of configs) {
    const result = await testConnection(config);
    if (result) {
      success = true;
      console.log(`\n🎉 Working configuration found: ${config.name}`);
      break;
    }
  }
  
  if (!success) {
    console.log('\n❌ All connection attempts failed');
    console.log('\n💡 Troubleshooting steps:');
    console.log('   1. Check if SQL Server container is running: docker ps');
    console.log('   2. Check SQL Server logs: docker logs phimhub-sqlserver');
    console.log('   3. Verify password in docker-compose.yml');
    console.log('   4. Try connecting from within the container');
  }
  
  console.log('\n🏁 Test completed!');
}

if (require.main === module) {
  main().catch(console.error);
}
