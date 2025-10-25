#!/bin/bash

# PhimHub Auto Import Script
# Tự động import dữ liệu mới từ KKPhim API khi khởi động container

set -e

echo "🚀 PhimHub Auto Import Script Starting..."
echo "📅 $(date)"

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
until node -e "
const sql = require('mssql');
const config = {
  server: process.env.DB_HOST || 'sqlserver',
  port: parseInt(process.env.DB_PORT) || 1433,
  user: process.env.DB_USER || 'sa',
  password: process.env.DB_PASS || 'PhimHub123!',
  database: process.env.DB_NAME || 'PhimHub',
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true',
    trustServerCertificate: process.env.DB_TRUST_SERVER_CERT === 'true'
  }
};

sql.connect(config).then(() => {
  console.log('✅ Database connection successful');
  process.exit(0);
}).catch(err => {
  console.log('❌ Database connection failed:', err.message);
  process.exit(1);
});
" 2>/dev/null; do
  echo "⏳ Database not ready yet, waiting 5 seconds..."
  sleep 5
done

echo "✅ Database is ready!"

# Wait for backend API to be ready
echo "⏳ Waiting for backend API to be ready..."
until curl -f http://localhost:3001/api/health >/dev/null 2>&1; do
  echo "⏳ Backend API not ready yet, waiting 5 seconds..."
  sleep 5
done

echo "✅ Backend API is ready!"

# Check if we need to run migrations
echo "🔍 Checking if migrations are needed..."
node -e "
const sql = require('mssql');
const config = {
  server: process.env.DB_HOST || 'sqlserver',
  port: parseInt(process.env.DB_PORT) || 1433,
  user: process.env.DB_USER || 'sa',
  password: process.env.DB_PASS || 'PhimHub123!',
  database: process.env.DB_NAME || 'PhimHub',
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true',
    trustServerCertificate: process.env.DB_TRUST_SERVER_CERT === 'true'
  }
};

sql.connect(config).then(async () => {
  try {
    const result = await sql.query\`SELECT COUNT(*) as count FROM movies\`;
    const movieCount = result.recordset[0].count;
    console.log(\`📊 Current movies in database: \${movieCount}\`);
    
    if (movieCount === 0) {
      console.log('🆕 Database is empty, will run full import');
      process.exit(1); // Exit with error to trigger full import
    } else {
      console.log('✅ Database has data, will run incremental import');
      process.exit(0); // Exit with success to trigger incremental import
    }
  } catch (error) {
    console.log('❌ Error checking database:', error.message);
    process.exit(1); // Exit with error to trigger full import
  }
}).catch(err => {
  console.log('❌ Database connection failed:', err.message);
  process.exit(1);
});
"

if [ $? -eq 0 ]; then
  echo "📥 Running incremental import (checking for new movies only)..."
  node scripts/auto-import-incremental.js
else
  echo "📥 Running full import (empty database)..."
  node scripts/auto-import-full.js
fi

echo "🎉 Auto import completed!"
echo "📅 $(date)"

