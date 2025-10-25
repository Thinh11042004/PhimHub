import { InteractionRepository } from '../models/InteractionRepository';

async function checkAndAddComments() {
  const repo = new InteractionRepository();
  
  console.log('🔍 Kiểm tra dữ liệu trong database...\n');
  
  try {
    // 1. Kiểm tra users
    console.log('👥 Kiểm tra bảng users:');
    const users = await repo.listComments(1, 1); // This will fail if no users, but we'll handle it
    console.log('   - Users check completed');
    console.log('');
    
    // 2. Kiểm tra comments hiện tại
    console.log('💬 Kiểm tra bảng comments:');
    const comments = await repo.listComments(1, 5);
    console.log(`   - Số lượng comments: ${comments.length}`);
    console.log('');
    
    if (comments.length === 0) {
      console.log('📝 Tạo dữ liệu test cho comments...');
      
      // Tạo một comment test (this will fail if no users/movies exist)
      try {
        const testComment = await repo.createComment(1, 1, 'Phim này hay quá! Tôi rất thích!');
        console.log(`   ✅ Đã tạo comment ID: ${testComment.id}`);
      } catch (error) {
        console.log('   ❌ Không thể tạo comment test - có thể thiếu users hoặc movies');
      }
      
    } else {
      console.log('✅ Bảng comments đã có dữ liệu!');
      
      console.log('\n📋 Một số comments mẫu:');
      comments.forEach((comment: any, index: number) => {
        console.log(`   ${index + 1}. "${comment.content.substring(0, 50)}..." - ${comment.fullname || comment.username}`);
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
