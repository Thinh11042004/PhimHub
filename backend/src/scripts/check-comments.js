const sql = require('mssql');

async function checkComments() {
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
    
    // Kiểm tra users
    console.log('\n👥 Kiểm tra users:');
    const usersResult = await sql.query('SELECT COUNT(*) as count FROM dbo.users');
    console.log(`   - Số lượng users: ${usersResult.recordset[0].count}`);
    
    if (usersResult.recordset[0].count > 0) {
      const users = await sql.query('SELECT TOP 3 id, username, fullname FROM dbo.users ORDER BY id');
      console.log('   - Users mẫu:', users.recordset.map(u => `${u.username} (${u.fullname || 'No name'})`));
    }
    
    // Kiểm tra contents
    console.log('\n🎬 Kiểm tra contents:');
    const contentsResult = await sql.query('SELECT COUNT(*) as count FROM dbo.contents');
    console.log(`   - Số lượng contents: ${contentsResult.recordset[0].count}`);
    
    if (contentsResult.recordset[0].count > 0) {
      const contents = await sql.query('SELECT TOP 3 id, content_type FROM dbo.contents ORDER BY id');
      console.log('   - Contents mẫu:', contents.recordset.map(c => `ID:${c.id} (${c.content_type})`));
    }
    
    // Kiểm tra comments
    console.log('\n💬 Kiểm tra comments:');
    const commentsResult = await sql.query('SELECT COUNT(*) as count FROM dbo.comments');
    console.log(`   - Số lượng comments: ${commentsResult.recordset[0].count}`);
    
    if (commentsResult.recordset[0].count > 0) {
      const comments = await sql.query(`
        SELECT TOP 5 
          c.id, 
          c.content, 
          u.username, 
          u.fullname, 
          c.created_at,
          c.updated_at
        FROM dbo.comments c
        INNER JOIN dbo.users u ON c.user_id = u.id
        ORDER BY c.created_at DESC
      `);
      
      console.log('   - Comments mẫu:');
      comments.recordset.forEach((comment, index) => {
        console.log(`     ${index + 1}. "${comment.content.substring(0, 50)}..." - ${comment.fullname || comment.username} (${new Date(comment.created_at).toLocaleDateString()})`);
      });
    } else {
      console.log('   ❌ Không có comments trong database!');
    }
    
    // Kiểm tra external_comments
    console.log('\n🌐 Kiểm tra external_comments:');
    const extCommentsResult = await sql.query('SELECT COUNT(*) as count FROM dbo.external_comments');
    console.log(`   - Số lượng external_comments: ${extCommentsResult.recordset[0].count}`);
    
    if (extCommentsResult.recordset[0].count > 0) {
      const extComments = await sql.query(`
        SELECT TOP 3 
          c.id, 
          c.ext_key, 
          c.content, 
          u.username, 
          u.fullname, 
          c.created_at
        FROM dbo.external_comments c
        INNER JOIN dbo.users u ON c.user_id = u.id
        ORDER BY c.created_at DESC
      `);
      
      console.log('   - External comments mẫu:');
      extComments.recordset.forEach((comment, index) => {
        console.log(`     ${index + 1}. "${comment.content.substring(0, 50)}..." - ${comment.fullname || comment.username} (${comment.ext_key})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Lỗi:', error);
  } finally {
    await sql.close();
    console.log('\n✅ Đã đóng kết nối database');
  }
}

checkComments();
