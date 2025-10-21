const sql = require('mssql');

async function testCommentAPI() {
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
    
    // Test tạo external comment
    console.log('\n🧪 Test tạo external comment...');
    
    const testData = {
      userId: 1, // AnhHai03
      extKey: 'local:bo-ngua',
      content: 'Test comment từ script',
      parentId: null
    };
    
    try {
      const insertQuery = `
        INSERT INTO dbo.external_comments (user_id, ext_key, content, parent_id, created_at, updated_at)
        VALUES (@param0, @param1, @param2, @param3, @param4, @param5)
      `;
      
      const now = new Date().toISOString();
      const result = await sql.query(insertQuery, [
        testData.userId,
        testData.extKey,
        testData.content,
        testData.parentId,
        now,
        now
      ]);
      
      console.log('✅ Tạo external comment thành công!');
      
      // Kiểm tra comment vừa tạo
      const checkQuery = `
        SELECT TOP 1 * FROM dbo.external_comments 
        WHERE ext_key = @param0 
        ORDER BY created_at DESC
      `;
      
      const checkResult = await sql.query(checkQuery, [testData.extKey]);
      
      if (checkResult.recordset.length > 0) {
        const comment = checkResult.recordset[0];
        console.log('📋 Comment vừa tạo:');
        console.log(`   - ID: ${comment.id}`);
        console.log(`   - Ext Key: ${comment.ext_key}`);
        console.log(`   - Content: ${comment.content}`);
        console.log(`   - Created: ${new Date(comment.created_at).toLocaleString()}`);
      }
      
    } catch (insertError) {
      console.error('❌ Lỗi khi tạo external comment:', insertError.message);
    }
    
    // Test API endpoint
    console.log('\n🌐 Test API endpoint...');
    
    try {
      const response = await fetch('http://localhost:3001/api/interactions/ext-comments/local/bo-ngua', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token' // Mock token
        },
        body: JSON.stringify({
          content: 'Test comment từ API',
          parent_id: null
        })
      });
      
      const responseText = await response.text();
      console.log(`📡 API Response Status: ${response.status}`);
      console.log(`📡 API Response: ${responseText}`);
      
      if (response.ok) {
        console.log('✅ API endpoint hoạt động!');
      } else {
        console.log('❌ API endpoint có lỗi!');
      }
      
    } catch (apiError) {
      console.error('❌ Lỗi khi test API:', apiError.message);
    }
    
  } catch (error) {
    console.error('❌ Lỗi:', error);
  } finally {
    await sql.close();
    console.log('\n✅ Đã đóng kết nối database');
  }
}

testCommentAPI();
