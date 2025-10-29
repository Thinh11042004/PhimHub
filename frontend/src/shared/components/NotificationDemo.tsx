import { useState } from 'react';
import { useNotification } from '../hooks/useNotification';
import { useCommentNotification } from '../hooks/useCommentNotification';
import { NotificationContainer } from './NotificationContainer';
import { CommentNotification } from './CommentNotification';

export function NotificationDemo() {
  const { notifications, removeNotification, success, error, warning, info } = useNotification();
  const { notification: commentNotification, showSuccess: showCommentSuccess, hide: hideComment } = useCommentNotification();

  return (
    <div className="p-8 space-y-4">
      <h2 className="text-2xl font-bold text-white mb-6">Notification Demo</h2>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button
          onClick={() => success('Thành công', 'Bình luận đã được gửi')}
          className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
        >
          Success Toast
        </button>
        
        <button
          onClick={() => error('Lỗi', 'Không thể gửi bình luận')}
          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
        >
          Error Toast
        </button>
        
        <button
          onClick={() => warning('Cảnh báo', 'Vui lòng kiểm tra lại thông tin')}
          className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
        >
          Warning Toast
        </button>
        
        <button
          onClick={() => info('Thông tin', 'Đây là thông báo thông tin')}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          Info Toast
        </button>
      </div>

      <div className="mt-8">
        <button
          onClick={() => showCommentSuccess('Thành công', 'Bình luận đã được gửi')}
          className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl hover:from-emerald-600 hover:to-green-700 transition-all duration-200 shadow-lg"
        >
          Show Comment Notification
        </button>
      </div>

      {/* Toast Notifications */}
      <NotificationContainer 
        notifications={notifications} 
        onRemove={removeNotification} 
      />

      {/* Comment Notification */}
      {commentNotification.isVisible && (
        <CommentNotification
          title={commentNotification.title}
          message={commentNotification.message}
          onClose={hideComment}
          duration={3000}
        />
      )}
    </div>
  );
}
