const sql = require('mssql');

async function checkUpdatedAt() {
  try {
    // Kết nối database
    const config = {
      user: process.env.DB_USER || 'sa',
      password: process.env.DB_PASS || 'YourStrong!Passw0rd',
      server: process.env.DB_HOST || 'localhost',
      database: process.env.DB_NAME || 'PhimHub',
      options: {
        encrypt: process.env.DB_ENCRYPT === 'true',
        trustServerCertificate: process.env.DB_TRUST_SERVER_CERT === 'true'
      }
    };
    
    await sql.connect(config);
    console.log('✅ Đã kết nối database');
    
    // Kiểm tra comments với updated_at
    console.log('\n💬 Kiểm tra comments với updated_at:');
    const commentsResult = await sql.query(`
      SELECT 
        c.id,
        c.content,
        c.created_at,
        c.updated_at,
        u.username,
        u.fullname
      FROM dbo.comments c
      INNER JOIN dbo.users u ON c.user_id = u.id
      ORDER BY c.created_at DESC
    `);
    
    console.log(`   - Số lượng comments: ${commentsResult.recordset.length}`);
    
    if (commentsResult.recordset.length > 0) {
      console.log('\n   📋 Chi tiết comments:');
      commentsResult.recordset.forEach((comment, index) => {
        const createdDate = new Date(comment.created_at).toLocaleString();
        const updatedDate = comment.updated_at ? new Date(comment.updated_at).toLocaleString() : 'NULL';
        const isUpdated = comment.updated_at && comment.updated_at !== comment.created_at;
        
        console.log(`     ${index + 1}. ID: ${comment.id}`);
        console.log(`        Content: "${comment.content.substring(0, 50)}..."`);
        console.log(`        Created: ${createdDate}`);
        console.log(`        Updated: ${updatedDate} ${isUpdated ? '(Đã sửa)' : '(Chưa sửa)'}`);
        console.log(`        User: ${comment.fullname || comment.username}`);
        console.log('');
      });
      
      // Kiểm tra NULL values
      const nullCount = commentsResult.recordset.filter(c => c.updated_at === null).length;
      console.log(`   📊 Comments có updated_at = NULL: ${nullCount}`);
      
      if (nullCount === 0) {
        console.log('   ✅ Tất cả comments đều có updated_at!');
      } else {
        console.log('   ⚠️  Vẫn còn comments có updated_at = NULL');
      }
    }
    
  } catch (error) {
    console.error('❌ Lỗi:', error);
  } finally {
    await sql.close();
    console.log('\n✅ Đã đóng kết nối database');
  }
}

checkUpdatedAt();
