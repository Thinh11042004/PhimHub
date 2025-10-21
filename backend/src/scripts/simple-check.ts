import { InteractionRepository } from '../models/InteractionRepository';

async function simpleCheck() {
  const repo = new InteractionRepository();
  
  console.log('🔍 Kiểm tra dữ liệu trong database...\n');
  
  try {
    // Kiểm tra users
    console.log('👥 Kiểm tra users:');
    const users = await (repo as any).listUsers(1, 5);
    console.log(`   - Số lượng users: ${users.length}`);
    if (users.length > 0) {
      console.log('   - Users có sẵn:', users.map((u: any) => `${u.username} (${u.fullname || 'No name'})`));
    }
    console.log('');
    
    // Kiểm tra movies
    console.log('🎬 Kiểm tra movies:');
    const movies = await (repo as any).listMovies(1, 5);
    console.log(`   - Số lượng movies: ${movies.length}`);
    if (movies.length > 0) {
      console.log('   - Movies có sẵn:', movies.map((m: any) => `${m.title} (ID: ${m.id})`));
    }
    console.log('');
    
    // Kiểm tra comments
    console.log('💬 Kiểm tra comments:');
    if (users.length > 0 && movies.length > 0) {
      const userId = users[0].id;
      const movieId = movies[0].id;
      
      // Tạo một comment test
      console.log('📝 Tạo comment test...');
      const testComment = await repo.createComment(userId, movieId, 'Phim này hay quá! Tôi rất thích!');
      console.log(`   ✅ Đã tạo comment ID: ${testComment.id}`);
      
      // Kiểm tra lại
      const comments = await repo.listComments(movieId, 1, 10);
      console.log(`   📊 Số lượng comments: ${comments.length}`);
      
      if (comments.length > 0) {
        console.log('   📋 Comments mẫu:');
        comments.forEach((comment, index) => {
          console.log(`      ${index + 1}. "${comment.content.substring(0, 50)}..." - User ID: ${comment.user_id}`);
        });
      }
    } else {
      console.log('   ❌ Không thể tạo comments vì thiếu users hoặc movies');
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
