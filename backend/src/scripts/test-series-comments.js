const sql = require('mssql');

async function testSeriesComments() {
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
    
    // Test tạo external comment cho series "Bọ Ngựa"
    console.log('\n🧪 Test tạo external comment cho series "Bọ Ngựa"...');
    
    const testData = {
      userId: 1, // AnhHai03
      extKey: 'local:bo-ngua',
      content: 'Series này hay quá! Tôi rất thích!',
      parentId: null
    };
    
    try {
      const insertQuery = `
        INSERT INTO dbo.external_comments (user_id, ext_key, content, parent_id, created_at, updated_at)
        VALUES (@param0, @param1, @param2, @param3, @param4, @param5)
      `;
      
      const now = new Date().toISOString();
      await sql.query(insertQuery, [
        testData.userId,
        testData.extKey,
        testData.content,
        testData.parentId,
        now,
        now
      ]);
      
      console.log('✅ Tạo external comment thành công!');
      
      // Tạo thêm một comment khác
      const testData2 = {
        userId: 1,
        extKey: 'local:bo-ngua',
        content: 'Diễn viên diễn xuất rất tốt!',
        parentId: null
      };
      
      await sql.query(insertQuery, [
        testData2.userId,
        testData2.extKey,
        testData2.content,
        testData2.parentId,
        now,
        now
      ]);
      
      console.log('✅ Tạo comment thứ 2 thành công!');
      
      // Kiểm tra comments vừa tạo
      const checkQuery = `
        SELECT 
          c.id,
          c.content,
          c.ext_key,
          c.created_at,
          u.username,
          u.fullname
        FROM dbo.external_comments c
        INNER JOIN dbo.users u ON c.user_id = u.id
        WHERE c.ext_key = @param0 
        ORDER BY c.created_at DESC
      `;
      
      const checkResult = await sql.query(checkQuery, [testData.extKey]);
      
      console.log(`\n📋 Comments cho series "Bọ Ngựa": ${checkResult.recordset.length}`);
      checkResult.recordset.forEach((comment, index) => {
        console.log(`   ${index + 1}. "${comment.content}" - ${comment.fullname || comment.username} (${new Date(comment.created_at).toLocaleString()})`);
      });
      
    } catch (insertError) {
      console.error('❌ Lỗi khi tạo external comment:', insertError.message);
    }
    
    // Test API endpoints
    console.log('\n🌐 Test API endpoints...');
    
    try {
      // Test GET comments
      const getResponse = await fetch('http://localhost:3001/api/interactions/ext-comments/local/bo-ngua?page=1&limit=20');
      const getData = await getResponse.json();
      
      console.log(`📡 GET Comments API Status: ${getResponse.status}`);
      if (getResponse.ok) {
        console.log(`📡 Số lượng comments: ${getData.data?.length || 0}`);
        console.log('✅ GET Comments API hoạt động!');
      } else {
        console.log(`❌ GET Comments API lỗi: ${getData.message}`);
      }
      
      // Test POST comment (sẽ fail vì cần authentication)
      const postResponse = await fetch('http://localhost:3001/api/interactions/ext-comments/local/bo-ngua', {
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
      
      const postData = await postResponse.json();
      console.log(`📡 POST Comment API Status: ${postResponse.status}`);
      console.log(`📡 POST Response: ${postData.message}`);
      
      if (postResponse.status === 403) {
        console.log('✅ API authentication hoạt động đúng (yêu cầu đăng nhập)');
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

testSeriesComments();
