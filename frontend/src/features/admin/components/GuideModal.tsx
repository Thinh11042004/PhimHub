// src/features/admin/components/GuideModal.tsx
import Modal from '../../../shared/components/Modal';

interface GuideModalProps {
  open: boolean;
  onClose: () => void;
}

export default function GuideModal({ open, onClose }: GuideModalProps) {
  return (
    <Modal open={open} onClose={onClose} title="Hướng dẫn sử dụng Admin Panel" maxWidthClass="max-w-4xl">
      <div className="space-y-6 text-white/90">
        {/* Giới thiệu */}
        <section>
          <h3 className="mb-3 text-lg font-semibold text-white">Tổng quan</h3>
          <p className="text-white/80 leading-relaxed">
            Admin Panel là công cụ quản trị để quản lý nội dung, người dùng và các hoạt động trên hệ thống PhimHub.
            Bạn có thể thực hiện các thao tác CRUD (Create, Read, Update, Delete) trên các tài nguyên chính.
          </p>
        </section>

        {/* Các chức năng chính */}
        <section>
          <h3 className="mb-3 text-lg font-semibold text-white">Các chức năng chính</h3>
          <div className="space-y-4">
            <div className="rounded-lg border border-white/10 bg-white/5 p-4">
              <div className="mb-2 flex items-center gap-2">
                <svg className="h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h4 className="font-semibold">Tổng quan (Dashboard)</h4>
              </div>
              <p className="ml-7 text-sm text-white/70">
                Xem tổng quan nhanh về số lượng người dùng, phim lẻ, phim bộ, thể loại phổ biến và hoạt động gần đây.
                Click vào các card để điều hướng đến trang quản lý tương ứng.
              </p>
            </div>

            <div className="rounded-lg border border-white/10 bg-white/5 p-4">
              <div className="mb-2 flex items-center gap-2">
                <svg className="h-5 w-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                <h4 className="font-semibold">Quản lý Thể loại</h4>
              </div>
              <p className="ml-7 text-sm text-white/70">
                Thêm, sửa, xóa các thể loại phim. Thể loại giúp phân loại và tìm kiếm phim dễ dàng hơn.
              </p>
            </div>

            <div className="rounded-lg border border-white/10 bg-white/5 p-4">
              <div className="mb-2 flex items-center gap-2">
                <svg className="h-5 w-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <h4 className="font-semibold">Quản lý Phim lẻ</h4>
              </div>
              <p className="ml-7 text-sm text-white/70">
                Tải lên, chỉnh sửa, xóa phim lẻ. Quản lý thông tin phim, poster, video, thể loại và metadata.
              </p>
            </div>

            <div className="rounded-lg border border-white/10 bg-white/5 p-4">
              <div className="mb-2 flex items-center gap-2">
                <svg className="h-5 w-5 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <h4 className="font-semibold">Quản lý Phim bộ</h4>
              </div>
              <p className="ml-7 text-sm text-white/70">
                Quản lý phim bộ và các tập phim. Thêm tập mới, chỉnh sửa thông tin tập, sắp xếp thứ tự tập.
              </p>
            </div>

            <div className="rounded-lg border border-white/10 bg-white/5 p-4">
              <div className="mb-2 flex items-center gap-2">
                <svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <h4 className="font-semibold">Quản lý Người dùng</h4>
              </div>
              <p className="ml-7 text-sm text-white/70">
                Xem danh sách người dùng, thông tin tài khoản, vai trò (role) và quản lý quyền truy cập.
              </p>
            </div>
          </div>
        </section>

        {/* Lưu ý */}
        <section>
          <h3 className="mb-3 text-lg font-semibold text-white">Lưu ý quan trọng</h3>
          <ul className="space-y-2 text-white/80">
            <li className="flex items-start gap-2">
              <span className="mt-1 text-yellow-400">⚠️</span>
              <span>Luôn kiểm tra kỹ thông tin trước khi xóa dữ liệu. Hành động xóa không thể hoàn tác.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 text-blue-400">ℹ️</span>
              <span>Đảm bảo upload đúng định dạng file (video, hình ảnh) theo yêu cầu của hệ thống.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 text-green-400">✓</span>
              <span>Thường xuyên kiểm tra báo cáo để nắm bắt tình hình hoạt động của hệ thống.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 text-purple-400">🔒</span>
              <span>Chỉ người dùng có quyền admin mới có thể truy cập Admin Panel này.</span>
            </li>
          </ul>
        </section>

        {/* Phím tắt */}
        <section>
          <h3 className="mb-3 text-lg font-semibold text-white">Phím tắt hữu ích</h3>
          <div className="grid gap-2 md:grid-cols-2">
            <div className="rounded-lg border border-white/10 bg-white/5 p-3">
              <kbd className="rounded bg-white/10 px-2 py-1 text-xs font-mono">Esc</kbd>
              <span className="ml-2 text-sm text-white/70">Đóng modal/dialog</span>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-3">
              <kbd className="rounded bg-white/10 px-2 py-1 text-xs font-mono">Ctrl + P</kbd>
              <span className="ml-2 text-sm text-white/70">In/Xuất báo cáo</span>
            </div>
          </div>
        </section>

        {/* Liên hệ hỗ trợ */}
        <section className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-4">
          <h3 className="mb-2 text-lg font-semibold text-blue-300">Cần hỗ trợ thêm?</h3>
          <p className="text-sm text-blue-200/80">
            Nếu bạn gặp vấn đề hoặc cần giải thích thêm về bất kỳ chức năng nào, vui lòng liên hệ với đội ngũ phát triển.
          </p>
        </section>
      </div>
    </Modal>
  );
}

