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
      className="fixed inset-0 z-[200] bg-black/60"
      onClick={handleClose}
      aria-modal
      role="dialog"
    >
      <div
        className="absolute right-6 top-6 w-[min(520px,92vw)] overflow-hidden rounded-2xl bg-[#f1cfc3] text-slate-800 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-black/10 px-6 py-4">
          <span className="h-5 w-5 rounded-full bg-[#155e75]" />
          <h2 className="text-2xl font-extrabold tracking-wide text-[#155e75]">
            QUÊN MẬT KHẨU
          </h2>
          <button
            onClick={handleClose}
            className="ml-auto rounded-full p-1.5 text-slate-600 hover:bg-black/5"
            aria-label="Đóng"
          >
            ✕
          </button>
        </div>

        <div className="px-6 py-5">
          {success ? (
            <div className="text-center">
              <div className="mb-4 text-6xl">📧</div>
              <h3 className="mb-2 text-lg font-semibold text-green-700">
                Email đã được gửi!
              </h3>
              <p className="mb-4 text-sm text-slate-600">
                Chúng tôi đã gửi liên kết đặt lại mật khẩu đến email của bạn.
                Vui lòng kiểm tra hộp thư và làm theo hướng dẫn.
              </p>
              <p className="mb-6 text-xs text-slate-500">
                Liên kết sẽ hết hạn sau 15 phút.
              </p>
              <button
                onClick={onBackToLogin}
                className="w-full rounded-xl bg-[#155e75] px-4 py-2.5 font-semibold text-white hover:bg-[#1b6f89]"
              >
                Quay lại đăng nhập
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <p className="mb-4 text-sm text-slate-600">
                  Nhập địa chỉ email của bạn và chúng tôi sẽ gửi liên kết đặt lại mật khẩu.
                </p>
                <input
                  type="email"
                  placeholder="Địa chỉ email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full rounded-xl bg-white px-3 py-2 outline-none ring-1 ring-black/10 focus:ring-2 focus:ring-[#155e75]"
                />
              </div>

              {error && (
                <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !email}
                className="w-full rounded-xl bg-[#155e75] px-4 py-2.5 font-semibold text-white hover:bg-[#1b6f89] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? "Đang gửi..." : "Gửi liên kết đặt lại"}
              </button>

              <button
                type="button"
                onClick={onBackToLogin}
                className="w-full text-sm text-[#155e75] hover:underline"
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
