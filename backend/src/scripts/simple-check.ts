import { InteractionRepository } from '../models/InteractionRepository';

async function simpleCheck() {
  const repo = new InteractionRepository();
  
  console.log('🔍 Kiểm tra dữ liệu trong database...\n');
  
  try {
    // Kiểm tra comments
    console.log('💬 Kiểm tra comments:');
    const comments = await repo.listComments(1, 5);
    console.log(`   - Số lượng comments: ${comments.length}`);
    
    if (comments.length > 0) {
      console.log('   📋 Comments mẫu:');
      comments.forEach((comment: any, index: number) => {
        console.log(`      ${index + 1}. "${comment.content.substring(0, 50)}..." - User: ${comment.username || comment.user_id}`);
      });
    } else {
      console.log('   ❌ Không có comments trong database');
      
      // Thử tạo một comment test
      try {
        console.log('📝 Tạo comment test...');
        const testComment = await repo.createComment(1, 1, 'Phim này hay quá! Tôi rất thích!');
        console.log(`   ✅ Đã tạo comment ID: ${testComment.id}`);
      } catch (error) {
        console.log('   ❌ Không thể tạo comment test - có thể thiếu users hoặc movies');
      }
    }
    
  } catch (error) {
    console.error('❌ Lỗi:', error);
  }
}

simpleCheck().then(() => {
  console.log('\n✅ Hoàn thành kiểm tra!');
  process.exit(0);
}).catch(error => {
  console.error('❌ Lỗi:', error);
  process.exit(1);
});
