import { InteractionRepository } from '../models/InteractionRepository';

async function checkAndAddComments() {
  const repo = new InteractionRepository();
  
  console.log('🔍 Kiểm tra dữ liệu trong database...\n');
  
  try {
    // 1. Kiểm tra users
    console.log('👥 Kiểm tra bảng users:');
    const usersResult = await (repo as any).executeQuery('SELECT TOP 5 id, username, fullname FROM dbo.users ORDER BY id');
    console.log(`   - Số lượng users: ${usersResult.recordset.length}`);
    if (usersResult.recordset.length > 0) {
      console.log('   - Users có sẵn:', usersResult.recordset.map((u: any) => `${u.username} (${u.fullname || 'No name'})`));
    }
    console.log('');
    
    // 2. Kiểm tra contents
    console.log('🎬 Kiểm tra bảng contents:');
    const contentsResult = await (repo as any).executeQuery('SELECT TOP 5 id, content_type, movie_id, episode_id FROM dbo.contents ORDER BY id');
    console.log(`   - Số lượng contents: ${contentsResult.recordset.length}`);
    if (contentsResult.recordset.length > 0) {
      console.log('   - Contents có sẵn:', contentsResult.recordset.map((c: any) => `ID:${c.id} (${c.content_type})`));
    }
    console.log('');
    
    // 3. Kiểm tra comments hiện tại
    console.log('💬 Kiểm tra bảng comments:');
    const commentsResult = await (repo as any).executeQuery('SELECT COUNT(*) as count FROM dbo.comments');
    const commentCount = commentsResult.recordset[0].count;
    console.log(`   - Số lượng comments: ${commentCount}`);
    console.log('');
    
    // 4. Nếu không có dữ liệu, tạo dữ liệu test
    if (usersResult.recordset.length === 0) {
      console.log('❌ Không có users trong database!');
      console.log('   Cần tạo users trước khi có thể tạo comments.');
      return;
    }
    
    if (contentsResult.recordset.length === 0) {
      console.log('❌ Không có contents trong database!');
      console.log('   Cần tạo movies/episodes trước khi có thể tạo comments.');
      return;
    }
    
    if (commentCount === 0) {
      console.log('📝 Tạo dữ liệu test cho comments...');
      
      const userId = usersResult.recordset[0].id;
      const contentId = contentsResult.recordset[0].id;
      
      // Tạo một số comments test
      const testComments = [
        'Phim này hay quá! Tôi rất thích!',
        'Diễn viên diễn xuất rất tốt, cốt truyện hấp dẫn.',
        'Hiệu ứng đặc biệt tuyệt vời, đáng xem!',
        'Phim này có ý nghĩa sâu sắc, rất cảm động.',
        'Tôi đã xem nhiều lần rồi, vẫn thấy hay!'
      ];
      
      for (let i = 0; i < testComments.length; i++) {
        const query = `
          INSERT INTO dbo.comments (user_id, content_id, content, created_at)
          VALUES (@param0, @param1, @param2, @param3)
        `;
        
        const now = new Date().toISOString();
        await (repo as any).executeQuery(query, [userId, contentId, testComments[i], now]);
        console.log(`   ✅ Đã tạo comment ${i + 1}: "${testComments[i].substring(0, 30)}..."`);
      }
      
      console.log(`\n🎉 Đã tạo ${testComments.length} comments test thành công!`);
      
      // Kiểm tra lại
      const newCommentsResult = await (repo as any).executeQuery('SELECT COUNT(*) as count FROM dbo.comments');
      console.log(`📊 Số lượng comments sau khi tạo: ${newCommentsResult.recordset[0].count}`);
      
    } else {
      console.log('✅ Bảng comments đã có dữ liệu!');
      
      // Hiển thị một số comments mẫu
      const sampleComments = await (repo as any).executeQuery(`
        SELECT TOP 3 c.id, c.content, u.username, u.fullname, c.created_at
        FROM dbo.comments c
        INNER JOIN dbo.users u ON c.user_id = u.id
        ORDER BY c.created_at DESC
      `);
      
      console.log('\n📋 Một số comments mẫu:');
      sampleComments.recordset.forEach((comment: any, index: number) => {
        console.log(`   ${index + 1}. "${comment.content.substring(0, 50)}..." - ${comment.fullname || comment.username} (${new Date(comment.created_at).toLocaleDateString()})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Lỗi khi kiểm tra database:', error);
  }
}

// Chạy script
checkAndAddComments().then(() => {
  console.log('\n✅ Hoàn thành kiểm tra!');
  process.exit(0);
}).catch(error => {
  console.error('❌ Lỗi:', error);
  process.exit(1);
});
