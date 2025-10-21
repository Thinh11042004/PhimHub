import { useState } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  onBackToLogin: () => void;
};

export default function ForgotPasswordModal({ open, onClose, onBackToLogin }: Props) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch('http://localhost:3001/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
      } else {
        setError(data.message || 'Có lỗi xảy ra');
      }
    } catch (err: any) {
      setError('Không thể kết nối đến server');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setEmail("");
    setError("");
    setSuccess(false);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-md"
      onClick={handleClose}
      aria-modal
      role="dialog"
    >
      <div
        className="absolute right-6 top-6 w-[min(520px,92vw)] overflow-hidden rounded-2xl bg-gray-900/95 backdrop-blur-xl text-white shadow-2xl ring-1 ring-gray-700/50"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-gray-700/50 px-6 py-4">
          <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-600 to-blue-700 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white">
            Quên mật khẩu
          </h2>
          <button
            onClick={handleClose}
            className="ml-auto rounded-full p-1.5 text-gray-400 hover:bg-gray-700/50 hover:text-white transition-all duration-200"
            aria-label="Đóng"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-5">
          {success ? (
            <div className="text-center">
              <div className="mb-4 w-16 h-16 mx-auto rounded-full bg-green-900/30 border border-green-500/30 flex items-center justify-center">
                <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="mb-2 text-lg font-semibold text-green-400">
                Email đã được gửi!
              </h3>
              <p className="mb-4 text-sm text-gray-300">
                Chúng tôi đã gửi liên kết đặt lại mật khẩu đến email của bạn.
                Vui lòng kiểm tra hộp thư và làm theo hướng dẫn.
              </p>
              <p className="mb-6 text-xs text-gray-400">
                Liên kết sẽ hết hạn sau 15 phút.
              </p>
              <button
                onClick={onBackToLogin}
                className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-2.5 font-medium text-white hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-blue-500/25"
              >
                Quay lại đăng nhập
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <p className="mb-4 text-sm text-gray-300">
                  Nhập địa chỉ email của bạn và chúng tôi sẽ gửi liên kết đặt lại mật khẩu.
                </p>
                <div className="relative group">
                  <input
                    type="email"
                    placeholder="Địa chỉ email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full rounded-xl border border-gray-600/50 bg-gray-800/50 backdrop-blur-sm text-white placeholder:text-gray-400 px-4 py-3 pr-10 outline-none focus:ring-2 focus:ring-blue-500/60 focus:border-blue-500/60 transition-all duration-200 hover:border-gray-500/70"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-400 transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
              </div>

              {error && (
                <div className="text-sm text-red-400 bg-red-900/30 border border-red-500/30 p-3 rounded-xl backdrop-blur-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !email}
                className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3 font-medium text-white hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-blue-500/25"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Đang gửi...
                  </div>
                ) : (
                  "Gửi liên kết đặt lại"
                )}
              </button>

              <button
                type="button"
                onClick={onBackToLogin}
                className="w-full text-sm text-blue-400 hover:text-blue-300 transition-colors font-medium"
              >
                ← Quay lại đăng nhập
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
