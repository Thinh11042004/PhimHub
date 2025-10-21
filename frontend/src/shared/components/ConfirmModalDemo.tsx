import { useConfirm } from './ConfirmModalProvider';

export function ConfirmModalDemo() {
  const { showConfirm } = useConfirm();

  const handleDeleteComment = () => {
    showConfirm(
      'Xóa bình luận',
      'Bạn có chắc muốn xóa bình luận này? Hành động này không thể hoàn tác.',
      () => {
        console.log('Comment deleted!');
        // Thực hiện xóa bình luận ở đây
      },
      {
        confirmText: 'Xóa',
        cancelText: 'Hủy',
        type: 'danger'
      }
    );
  };

  const handleDeleteAccount = () => {
    showConfirm(
      'Xóa tài khoản',
      'Bạn có chắc muốn xóa tài khoản này? Tất cả dữ liệu sẽ bị mất vĩnh viễn.',
      () => {
        console.log('Account deleted!');
        // Thực hiện xóa tài khoản ở đây
      },
      {
        confirmText: 'Xóa tài khoản',
        cancelText: 'Hủy',
        type: 'danger'
      }
    );
  };

  const handleWarning = () => {
    showConfirm(
      'Cảnh báo',
      'Bạn sắp thực hiện một hành động có thể gây hại. Bạn có chắc chắn muốn tiếp tục?',
      () => {
        console.log('Warning action confirmed!');
        // Thực hiện hành động cảnh báo ở đây
      },
      {
        confirmText: 'Tiếp tục',
        cancelText: 'Hủy',
        type: 'warning'
      }
    );
  };

  const handleInfo = () => {
    showConfirm(
      'Thông tin',
      'Bạn có muốn lưu thay đổi trước khi rời khỏi trang này?',
      () => {
        console.log('Info action confirmed!');
        // Thực hiện hành động thông tin ở đây
      },
      {
        confirmText: 'Lưu',
        cancelText: 'Không lưu',
        type: 'info'
      }
    );
  };

  return (
    <div className="p-8 space-y-4">
      <h2 className="text-2xl font-bold text-white mb-6">Confirm Modal Demo</h2>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button
          onClick={handleDeleteComment}
          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
        >
          Xóa bình luận
        </button>
        
        <button
          onClick={handleDeleteAccount}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Xóa tài khoản
        </button>
        
        <button
          onClick={handleWarning}
          className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
        >
          Cảnh báo
        </button>
        
        <button
          onClick={handleInfo}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          Thông tin
        </button>
      </div>
    </div>
  );
}
