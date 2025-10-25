import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../store/auth";

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function LoginModal({ open, onClose }: Props) {
  const nav = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  if (!open) return null;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();            // QUAN TRỌNG: không reload trang
    setErr("");
    setLoading(true);
    try {
      const u = await login(email, password); // gọi store mock
      onClose();                               // đóng modal
      nav(u.role === "admin" ? "/admin" : "/account", { replace: true });
    } catch (er: any) {
      setErr(er?.message || "Đăng nhập thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[200] bg-black/60"
      onClick={onClose}
      aria-modal
      role="dialog"
    >
      <div
        className="absolute right-6 top-6 w-[min(520px,92vw)] overflow-hidden rounded-2xl bg-[#f1cfc3] text-slate-800 shadow-xl"
        onClick={(e) => e.stopPropagation()}    // ĐỪNG để overlay ăn click
      >
        <div className="flex items-center gap-3 border-b border-black/10 px-6 py-4">
          <span className="h-5 w-5 rounded-full bg-[#155e75]" />
          <h2 className="text-2xl font-extrabold tracking-wide text-[#155e75]">ĐĂNG NHẬP</h2>
          <button
            onClick={onClose}
            className="ml-auto rounded-full p-1.5 text-slate-600 hover:bg-black/5"
            aria-label="Đóng"
          >
            ✕
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-3 px-6 py-5">
          <input
            placeholder="Tài khoản (email)"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl bg-white px-3 py-2 outline-none ring-1 ring-black/10 focus:ring-2 focus:ring-[#155e75]"
          />
          <div className="relative">
            <input
              placeholder="Mật khẩu"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              className="w-full rounded-xl bg-white px-3 py-2 outline-none ring-1 ring-black/10 focus:ring-2 focus:ring-[#155e75]"
            />
          </div>

          {err && <div className="text-sm text-red-600">{err}</div>}

          <button
            type="submit"                     // QUAN TRỌNG: phải là submit
            disabled={loading}
            className="mt-1 w-full rounded-xl bg-[#155e75] px-4 py-2.5 font-semibold text-white hover:bg-[#1b6f89] disabled:opacity-60"
          >
            {loading ? "Đang đăng nhập..." : "Đăng nhập"}
          </button>

        </form>
      </div>
    </div>
  );
}
