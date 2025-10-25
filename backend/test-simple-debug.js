const sql = require('mssql');

const config = {
  server: 'localhost',
  database: 'PhimHub',
  user: 'sa',
  password: 'YourStrong!Passw0rd',
  options: {
    encrypt: true,
    trustServerCertificate: true
  }
};

async function testSimpleDebug() {
  try {
    console.log('🔍 Testing simple debug...');
    
    await sql.connect(config);
    console.log('✅ Database connected');
    
    // Test the exact query from FavoritesRepository
    const slug = '24-gio-truoc-ngay-d';
    console.log(`\n📋 Testing findMovieIdBySlug for slug: ${slug}`);
    
    const query = `SELECT id FROM movies WHERE slug = '${slug}'`;
    const result = await sql.query(query);
    
    if (result.recordset.length > 0) {
      const movieId = result.recordset[0].id;
      console.log('✅ Movie found with ID:', movieId);
      
      // Test if this movie ID exists in contents table
      console.log('\n📋 Checking if content record exists for this movie:');
      const contentQuery = `SELECT id, content_type, movie_id FROM contents WHERE movie_id = ${movieId}`;
      const contentResult = await sql.query(contentQuery);
      
      if (contentResult.recordset.length > 0) {
        const content = contentResult.recordset[0];
        console.log('✅ Content record exists:', {
          id: content.id,
          content_type: content.content_type,
          movie_id: content.movie_id
        });
      } else {
        console.log('❌ No content record found for this movie');
        
        // Test MERGE statement
        console.log('\n📋 Testing MERGE statement:');
        const mergeQuery = `
          MERGE contents AS target
          USING (SELECT 'movie' AS content_type, ${movieId} AS movie_id) AS source
          ON target.movie_id = source.movie_id
          WHEN MATCHED THEN
            UPDATE SET content_type = target.content_type
          WHEN NOT MATCHED THEN
            INSERT (content_type, movie_id)
            VALUES (source.content_type, source.movie_id)
          OUTPUT COALESCE(INSERTED.id, DELETED.id) AS id;
        `;
        
        const mergeResult = await sql.query(mergeQuery);
        
        if (mergeResult.recordset.length > 0) {
          const contentId = mergeResult.recordset[0].id;
          console.log('✅ MERGE successful, content ID:', contentId);
        } else {
          console.log('❌ MERGE failed');
        }
      }
    } else {
      console.log('❌ Movie not found with slug:', slug);
    }
    
    await sql.close();
    console.log('✅ Database connection closed');
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

testSimpleDebug();
