import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUI } from "../../store/ui";
import { useAuth } from "../../store/auth";
import ForgotPasswordModal from "../../features/auth/components/ForgotPasswordModal";
import { authService } from "../../features/auth/services";
import { useMoviePoster } from "../hooks/useMoviePoster";
import { getImageUrl } from "../../utils/imageProxy";

function Field({
  type = "text",
  placeholder,
  rightIcon,
  value,
  onChange,
  showPassword,
  onTogglePassword,
}: {
  type?: string;
  placeholder: string;
  rightIcon?: React.ReactNode;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  showPassword?: boolean;
  onTogglePassword?: () => void;
}) {
  return (
    <div className="relative group">
      <input
        type={type === "password" && showPassword ? "text" : type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        autoComplete="off"
        className="w-full rounded-xl border border-gray-600/50 bg-gray-800/50 backdrop-blur-sm text-white placeholder:text-gray-400 px-4 py-3 pr-10 outline-none focus:ring-2 focus:ring-blue-500/60 focus:border-blue-500/60 transition-all duration-200 hover:border-gray-500/70"
      />
      {rightIcon && (
        <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-400 transition-colors ${onTogglePassword ? 'cursor-pointer hover:text-blue-400' : 'pointer-events-none'}`} onClick={onTogglePassword}>
          {rightIcon}
        </span>
      )}
    </div>
  );
}

function LoginForm({ onForgotPasswordToggle }: { onForgotPasswordToggle: (show: boolean) => void }) {
  const { setMode, closeAuth } = useUI();
  const { login } = useAuth();
  const navigate = useNavigate();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);
  const [forgotPasswordSuccess, setForgotPasswordSuccess] = useState(false);
  const [forgotPasswordError, setForgotPasswordError] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Check if we just came from successful registration
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('registered') === 'true') {
      setSuccessMessage("Đăng ký thành công! Vui lòng đăng nhập để tiếp tục.");
      setEmail("");
      setPassword("");
    }
  }, []);

  // Reset form when switching to login mode
  React.useEffect(() => {
    setEmail("");
    setPassword("");
    setError("");
    setSuccessMessage("");
    setShowForgotPassword(false);
    setForgotPasswordError("");
    setForgotPasswordSuccess(false);
    setUserEmail("");
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Login form submitted", { email, password });
    setError("");
    setSuccessMessage(""); // Clear success message when trying to login
    
    // Validation - kiểm tra các trường bắt buộc
    if (!email || !email.trim()) {
      setError("Vui lòng nhập email hoặc tên người dùng");
      return;
    }

    if (!password || !password.trim()) {
      setError("Vui lòng nhập mật khẩu");
      return;
    }
    
    setLoading(true);
    
    try {
      const user = await login(email, password);
      console.log("Login successful", user);
      closeAuth();
      navigate(user.role === "admin" ? "/admin" : "/", { replace: true });
    } catch (e: any) {
      console.error("Login failed", e);
      setError(e.message || "Đăng nhập thất bại");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotPasswordError("");
    
    // Validation - kiểm tra email có được điền
    if (!userEmail || !userEmail.trim()) {
      setForgotPasswordError("Vui lòng nhập địa chỉ email");
      return;
    }
    
    setForgotPasswordLoading(true);

    try {
      const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001/api';
      const response = await fetch(`${API_BASE}/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: userEmail }),
      });

      const data = await response.json();

      if (data.success) {
        setForgotPasswordSuccess(true);
      } else {
        setForgotPasswordError(data.message || 'Có lỗi xảy ra');
      }
    } catch (err: any) {
      setForgotPasswordError('Không thể kết nối đến server');
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  if (showForgotPassword) {
    return (
      <div className="space-y-4">
        {forgotPasswordSuccess ? (
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
              onClick={() => {
                setShowForgotPassword(false);
                setForgotPasswordSuccess(false);
                setForgotPasswordError("");
                setUserEmail("");
                onForgotPasswordToggle(false);
              }}
              className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3 font-medium text-white hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-blue-500/25"
            >
              Quay lại đăng nhập
            </button>
          </div>
        ) : (
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-600 to-blue-700 flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white">Quên mật khẩu</h3>
            </div>
            
            <p className="text-sm text-gray-300 mb-4">
              Nhập địa chỉ email của bạn và chúng tôi sẽ gửi liên kết đặt lại mật khẩu.
            </p>
            
            <div className="relative group">
              <input
                type="email"
                placeholder="Địa chỉ email"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                required
                className="w-full rounded-xl border border-gray-600/50 bg-gray-800/50 backdrop-blur-sm text-white placeholder:text-gray-400 px-4 py-3 pr-10 outline-none focus:ring-2 focus:ring-blue-500/60 focus:border-blue-500/60 transition-all duration-200 hover:border-gray-500/70"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-400 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
            </div>

            {forgotPasswordError && (
              <div className="text-sm text-red-400 bg-red-900/30 border border-red-500/30 p-3 rounded-xl backdrop-blur-sm">
                {forgotPasswordError}
              </div>
            )}

            <button
              type="submit"
              disabled={forgotPasswordLoading || !userEmail}
              className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3 font-medium text-white hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-blue-500/25"
            >
              {forgotPasswordLoading ? (
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
              onClick={() => {
                setShowForgotPassword(false);
                setForgotPasswordError("");
                setUserEmail("");
                onForgotPasswordToggle(false);
              }}
              className="w-full text-sm text-blue-400 hover:text-blue-300 transition-colors font-medium"
            >
              ← Quay lại đăng nhập
            </button>
          </form>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field 
        placeholder="Email hoặc tên người dùng" 
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        rightIcon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        } 
      />
      <Field 
        type="password" 
        placeholder="Mật khẩu" 
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        showPassword={showPassword}
        onTogglePassword={() => setShowPassword(!showPassword)}
        rightIcon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {showPassword ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
            ) : (
              <>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </>
            )}
          </svg>
        } 
      />

      {successMessage && (
        <div className="text-sm text-green-400 bg-green-900/30 border border-green-500/30 p-3 rounded-xl backdrop-blur-sm">
          {successMessage}
        </div>
      )}
      {error && (
        <div className="text-sm text-red-400 bg-red-900/30 border border-red-500/30 p-3 rounded-xl backdrop-blur-sm">
          {error}
        </div>
      )}

      <div className="text-right text-sm text-gray-400">
        <button 
          type="button" 
          onClick={async () => {
            if (!email.trim()) {
              setError("Vui lòng nhập email hoặc tên người dùng trước khi quên mật khẩu");
              return;
            }
            
            try {
              setError("");
              const userInfo = await authService.getUserEmail(email);
              setUserEmail(userInfo.email);
              setShowForgotPassword(true);
              onForgotPasswordToggle(true);
            } catch (err: any) {
              setError(err.message || "Không thể lấy thông tin email");
            }
          }}
          className="hover:text-blue-400 transition-colors"
        >
          Quên mật khẩu?
        </button>
      </div>

      <button 
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3 font-medium text-white hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-blue-500/25"
      >
        {loading ? (
          <div className="flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            Đang đăng nhập...
          </div>
        ) : (
          "Đăng nhập"
        )}
      </button>

      <div className="pt-2 text-center text-gray-400">
        Chưa có tài khoản?{" "}
        <button type="button" onClick={() => setMode("register")} className="text-blue-400 hover:text-blue-300 transition-colors font-medium">
          Đăng ký ngay
        </button>
      </div>
    </form>
  );
}

function RegisterForm() {
  const { setMode, closeAuth, authMode } = useUI();
  const navigate = useNavigate();
  
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Always reset form to empty state
  React.useEffect(() => {
    setUsername("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setError("");
    setLoading(false);
  }, []);

  // Reset form when switching to register mode
  React.useEffect(() => {
    if (authMode === "register") {
      setUsername("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setError("");
      setLoading(false);
    }
  }, [authMode]);

  // Force reset to ensure empty state only on mount
  React.useEffect(() => {
    setUsername("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
  }, []);


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

    if (username.length < 3) {
      setError("Tên người dùng phải có ít nhất 3 ký tự");
      setLoading(false);
      return;
    }

    if (username.includes(' ')) {
      setError("Tên người dùng không được chứa khoảng trắng");
      setLoading(false);
      return;
    }

    if (!/^[a-zA-Z0-9]+$/.test(username)) {
      setError("Tên người dùng chỉ được chứa chữ cái và số");
      setLoading(false);
      return;
    }

    // Email validation - Quy tắc đơn giản
    // 1. Có ký tự trước @
    // 2. Có tên miền sau @
    // 3. Có ít nhất một dấu chấm ở phần tên miền cuối cùng (TLD ≥ 2 ký tự)
    const emailPattern = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    
    // Kiểm tra pattern cơ bản
    if (!emailPattern.test(email)) {
      setError("Email không đúng định dạng. Ví dụ: name@example.com");
      setLoading(false);
      return;
    }

    // Kiểm tra không có nhiều dấu chấm liên tiếp (như ........)
    if (/\.{2,}/.test(email)) {
      setError("Email không được chứa nhiều dấu chấm liên tiếp");
      setLoading(false);
      return;
    }

    // Kiểm tra có ký tự trước @ (local part không rỗng)
    const localPart = email.split('@')[0];
    if (!localPart || localPart.trim().length === 0) {
      setError("Email phải có ký tự trước @");
      setLoading(false);
      return;
    }

    // Kiểm tra có tên miền sau @
    const domainPart = email.split('@')[1];
    if (!domainPart || domainPart.trim().length === 0) {
      setError("Email phải có tên miền sau @");
      setLoading(false);
      return;
    }

    // Kiểm tra có ít nhất một dấu chấm trong domain và TLD ≥ 2 ký tự
    const lastDotIndex = domainPart.lastIndexOf('.');
    if (lastDotIndex === -1) {
      setError("Email phải có phần mở rộng tên miền (ví dụ: .com, .vn)");
      setLoading(false);
      return;
    }
    
    const tld = domainPart.substring(lastDotIndex + 1);
    if (tld.length < 2) {
      setError("Phần mở rộng tên miền phải có ít nhất 2 ký tự (ví dụ: .com, .vn)");
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
        rightIcon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        } 
      />
      <Field 
        type="email"
        placeholder="Email" 
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        rightIcon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        } 
      />
      <Field 
        type="password" 
        placeholder="Mật khẩu" 
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        showPassword={showPassword}
        onTogglePassword={() => setShowPassword(!showPassword)}
        rightIcon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {showPassword ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
            ) : (
              <>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </>
            )}
          </svg>
        } 
      />
      <Field 
        type="password" 
        placeholder="Nhập lại mật khẩu" 
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        showPassword={showConfirmPassword}
        onTogglePassword={() => setShowConfirmPassword(!showConfirmPassword)}
        rightIcon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {showConfirmPassword ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
            ) : (
              <>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </>
            )}
          </svg>
        } 
      />

      {error && (
        <div className="text-sm text-red-400 bg-red-900/30 border border-red-500/30 p-3 rounded-xl backdrop-blur-sm">
          {error}
        </div>
      )}

      <button 
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 px-4 py-3 font-medium text-white hover:from-emerald-700 hover:to-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-emerald-500/25"
      >
        {loading ? (
          <div className="flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            Đang xử lý...
          </div>
        ) : (
          "Đăng ký"
        )}
      </button>

      <div className="pt-2 text-center text-gray-400">
        Đã có tài khoản?{" "}
        <button type="button" onClick={() => setMode("login")} className="text-blue-400 hover:text-blue-300 transition-colors font-medium">
          Đăng nhập
        </button>
      </div>
    </form>
  );
}

export default function AuthModal() {
  const { authOpen, authMode, closeAuth, setMode } = useUI();
  const { poster, loading: posterLoading } = useMoviePoster("Quỷ dữ ẩn mình");
  const [showForgotPassword, setShowForgotPassword] = useState(false);

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
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      aria-modal="true"
      role="dialog"
      onClick={closeAuth}
    >
      {/* backdrop mờ trang chủ */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />

      {/* card */}
      <div
        className="relative z-[90] mx-3 grid w-full max-w-4xl h-[600px] grid-cols-1 overflow-hidden rounded-3xl bg-gray-900/95 backdrop-blur-xl shadow-2xl ring-1 ring-gray-700/50 md:grid-cols-[3fr_2fr]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left image */}
        <div className="hidden md:block relative">
          {posterLoading ? (
            <div className="h-full w-full bg-gray-800 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            </div>
          ) : (
            <>
              <img
                src={getImageUrl(poster?.banner_url || poster?.poster_url) || "https://images.unsplash.com/photo-1489599804151-0b6a0b0b0b0b?q=80&w=1000&auto=format&fit=crop"}
                alt={poster?.title || "PhimHub"}
                className="h-full w-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = "https://images.unsplash.com/photo-1489599804151-0b6a0b0b0b0b?q=80&w=1000&auto=format&fit=crop";
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
              <div className="absolute bottom-6 left-6 right-6">
                <h1 className="text-3xl font-bold text-white mb-2">Chào mừng đến với PhimHub</h1>
                <p className="text-gray-300 text-lg">Khám phá thế giới phim ảnh không giới hạn</p>
              </div>
            </>
          )}
        </div>

        {/* Right form */}
        <div className="relative bg-gray-900/95 backdrop-blur-xl p-6 md:p-8">
          <button
            onClick={closeAuth}
            className="absolute right-4 top-4 rounded-full bg-gray-800/50 hover:bg-gray-700/50 px-3 py-1 text-sm text-gray-400 hover:text-white transition-all duration-200"
            aria-label="Đóng"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {!showForgotPassword && (
            <div className="mb-6 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-600 to-blue-700 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white">
                {authMode === "login" ? "Đăng nhập" : "Đăng ký"}
              </h2>
            </div>
          )}

          {/* switch tab on mobile */}
          <div className="mb-6 flex gap-2 md:hidden">
            <button
              onClick={() => setMode("login")}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 ${
                authMode === "login" 
                  ? "bg-blue-600 text-white shadow-lg" 
                  : "bg-gray-800/50 text-gray-400 hover:text-white hover:bg-gray-700/50"
              }`}
            >
              Đăng nhập
            </button>
            <button
              onClick={() => setMode("register")}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 ${
                authMode === "register" 
                  ? "bg-emerald-600 text-white shadow-lg" 
                  : "bg-gray-800/50 text-gray-400 hover:text-white hover:bg-gray-700/50"
              }`}
            >
              Đăng ký
            </button>
          </div>

          {authMode === "login" ? <LoginForm onForgotPasswordToggle={setShowForgotPassword} /> : <RegisterForm />}
        </div>
      </div>
    </div>
  );
}
