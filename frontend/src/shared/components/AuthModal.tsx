import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUI } from "../../store/ui";
import { useAuth } from "../../store/auth";
import ForgotPasswordModal from "../../features/auth/components/ForgotPasswordModal";
import { authService } from "../../features/auth/services";

function Field({
  type = "text",
  placeholder,
  rightIcon,
  value,
  onChange,
}: {
  type?: string;
  placeholder: string;
  rightIcon?: React.ReactNode;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div className="relative">
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="w-full rounded-xl border border-white/20 bg-white text-slate-800 placeholder:text-slate-400 px-4 py-3 pr-10 outline-none focus:ring-2 focus:ring-cyan-400/60"
      />
      {rightIcon && <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">{rightIcon}</span>}
    </div>
  );
}

function LoginForm() {
  const { setMode, closeAuth } = useUI();
  const { login } = useAuth();
  const navigate = useNavigate();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  // Check if we just came from successful registration
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('registered') === 'true') {
      setSuccessMessage("Đăng ký thành công! Vui lòng đăng nhập để tiếp tục.");
      setEmail("");
      setPassword("");
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Login form submitted", { email, password });
    setError("");
    setSuccessMessage(""); // Clear success message when trying to login
    setLoading(true);
    
    try {
      const user = await login(email, password);
      console.log("Login successful", user);
      closeAuth();
      navigate(user.role === "admin" ? "/admin" : "/account", { replace: true });
    } catch (e: any) {
      console.error("Login failed", e);
      setError(e.message || "Đăng nhập thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field 
        placeholder="Email hoặc tên người dùng" 
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        rightIcon={<span>👤</span>} 
      />
      <Field 
        type="password" 
        placeholder="Mật khẩu" 
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        rightIcon={<span>👁️</span>} 
      />

      {successMessage && <div className="text-sm text-green-600 bg-green-50 p-2 rounded">{successMessage}</div>}
      {error && <div className="text-sm text-red-600">{error}</div>}

      <div className="text-right text-sm text-slate-600">
        <button 
          type="button" 
          onClick={() => setShowForgotPassword(true)}
          className="hover:underline"
        >
          Quên mật khẩu
        </button>
      </div>

      <button 
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-[#155E75] px-4 py-3 font-medium text-white hover:bg-[#0E7490] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Đang đăng nhập..." : "Đăng nhập"}
      </button>

      <div className="pt-2 text-center text-slate-700">
        Đăng ký nếu chưa có tài khoản ·{" "}
        <button type="button" onClick={() => setMode("register")} className="text-[#155E75] hover:underline">
          Tạo mới
        </button>
      </div>
      
      <ForgotPasswordModal
        open={showForgotPassword}
        onClose={() => setShowForgotPassword(false)}
        onBackToLogin={() => setShowForgotPassword(false)}
      />
    </form>
  );
}

function RegisterForm() {
  const { setMode, closeAuth } = useUI();
  const navigate = useNavigate();
  
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Register form submitted", { username, email, password });
    setError("");
    setLoading(true);

    // Validation
    if (!email || !username || !password || !confirmPassword) {
      setError("Vui lòng điền đầy đủ thông tin");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự");
      setLoading(false);
      return;
    }

    try {
      // Call real API
      const response = await authService.register({ email, username, password });
      console.log("Register successful", response);
      
      // Show success message and switch to login
      setError("");
      
      // Switch to login mode and clear register form
      setMode("login");
      setUsername("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      
      // Trigger success message in LoginForm
      window.history.replaceState({}, '', '?registered=true');
      
    } catch (e: any) {
      console.error("Register failed", e);
      setError(e.message || "Đăng ký thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field 
        placeholder="Tên người dùng" 
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        rightIcon={<span>👤</span>} 
      />
      <Field 
        type="email"
        placeholder="Email" 
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        rightIcon={<span>📧</span>} 
      />
      <Field 
        type="password" 
        placeholder="Mật khẩu" 
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        rightIcon={<span>👁️</span>} 
      />
      <Field 
        type="password" 
        placeholder="Nhập lại mật khẩu" 
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        rightIcon={<span>👁️</span>} 
      />

      {error && <div className="text-sm text-red-600">{error}</div>}

      <button 
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-[#F97316] px-4 py-3 font-medium text-white hover:bg-[#EA580C] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Đang xử lý..." : "Đăng ký"}
      </button>

      <div className="pt-2 text-center text-slate-700">
        Đã có tài khoản?{" "}
        <button type="button" onClick={() => setMode("login")} className="text-[#155E75] hover:underline">
          Đăng nhập
        </button>
      </div>
    </form>
  );
}

export default function AuthModal() {
  const { authOpen, authMode, closeAuth, setMode } = useUI();

  // khóa scroll khi mở modal
  useEffect(() => {
    document.body.style.overflow = authOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [authOpen]);

  if (!authOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      aria-modal="true"
      role="dialog"
      onClick={closeAuth}
    >
      {/* backdrop mờ trang chủ */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* card */}
      <div
        className="relative z-[90] mx-3 grid w-full max-w-5xl grid-cols-1 overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-black/10 md:grid-cols-2"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left image */}
        <div className="hidden md:block">
          <img
            src="https://m.media-amazon.com/images/I/71xuQwDMPyL._AC_UF894,1000_QL80_.jpg"
            alt="Poster"
            className="h-full w-full object-cover"
          />
        </div>

        {/* Right form */}
        <div className="relative bg-[#F5D1C6] p-6 md:p-8">
          <button
            onClick={closeAuth}
            className="absolute right-4 top-4 rounded-full bg-black/10 px-3 py-1 text-sm hover:bg-black/20"
            aria-label="Đóng"
          >
            ✕
          </button>

          <div className="mb-5 flex items-center gap-3">
            <span className="h-8 w-8 rounded-full bg-[#155E75]" />
            <h2 className="text-2xl font-extrabold text-[#155E75] tracking-wide">
              {authMode === "login" ? "ĐĂNG NHẬP" : "ĐĂNG KÝ"}
            </h2>
          </div>

          {/* switch tab on mobile */}
          <div className="mb-5 flex gap-2 md:hidden">
            <button
              onClick={() => setMode("login")}
              className={`rounded-full px-3 py-1 text-sm ${
                authMode === "login" ? "bg-[#155E75] text-white" : "bg-white/60 text-slate-700"
              }`}
            >
              Đăng nhập
            </button>
            <button
              onClick={() => setMode("register")}
              className={`rounded-full px-3 py-1 text-sm ${
                authMode === "register" ? "bg-[#155E75] text-white" : "bg-white/60 text-slate-700"
              }`}
            >
              Đăng ký
            </button>
          </div>

          {authMode === "login" ? <LoginForm /> : <RegisterForm />}
        </div>
      </div>
    </div>
  );
}
