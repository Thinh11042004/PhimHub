import { useState, useEffect } from "react";
import { useAuth } from "../../../store/auth";
import { getAvatarUrl } from "../../../utils/avatarUtils";

export default function AccountProfile() {
  const { user, updateProfile, uploadAvatar, refreshUser } = useAuth();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [fullname, setFullname] = useState("");
  const [phone, setPhone] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  // Initialize form with current user data
  useEffect(() => {
    if (user) {
      console.log('User avatar:', user.avatar);
      console.log('Avatar URL:', getAvatarUrl(user.avatar));
      setEmail(user.email || "");
      setUsername(user.username || "");
      // Mặc định hiển thị tên đăng nhập, chỉ thay đổi nếu user đã có fullname
      setFullname(user.fullname || user.username || "");
      setPhone(user.phone || "");
    }
  }, [user]);


  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🎯 Form submitted with data:', { email, username, fullname, phone });
    setIsUpdating(true);
    setMessage("");
    
    try {
      // Check if user is logged in
      if (!user) {
        setMessage("Vui lòng đăng nhập để cập nhật thông tin");
        return;
      }

      // Check if token exists
      const token = localStorage.getItem('phimhub:token');
      if (!token) {
        setMessage("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại");
        return;
      }

      // Validate required fields
      if (!email.trim()) {
        setMessage("Email không được để trống");
        return;
      }
      if (!username.trim()) {
        setMessage("Tên đăng nhập không được để trống");
        return;
      }

      console.log('Updating profile with data:', { 
        email: email.trim(), 
        username: username.trim(), 
        fullname: fullname.trim() || undefined,
        phone: phone.trim() || undefined
      });

      // Call API to update profile in database
      console.log('🚀 Calling updateProfile API...');
      const result = await updateProfile({ 
        email: email.trim(), 
        username: username.trim(), 
        fullname: fullname.trim() || undefined,
        phone: phone.trim() || undefined
      });
      console.log('✅ UpdateProfile API result:', result);
      
      setMessage("Cập nhật thông tin thành công!");
      
      // The updateProfile function in auth store already updates the state
      // No need to update again
      
    } catch (error: any) {
      console.error('Update profile error:', error);
      if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        setMessage("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại");
      } else {
        setMessage(error.message || "Có lỗi xảy ra khi cập nhật thông tin");
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    setMessage("");
    
    if (newPassword !== confirmPassword) {
      setMessage("Mật khẩu mới không khớp!");
      setIsUpdating(false);
      return;
    }
    
    try {
      // Import authService dynamically to avoid circular dependency
      const { authService } = await import("../../auth/services");
      await authService.changePassword({
        currentPassword,
        newPassword
      });
      
      setMessage("Đổi mật khẩu thành công!");
      setShowPasswordForm(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      setMessage(error.message || "Có lỗi xảy ra khi đổi mật khẩu");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setMessage('Vui lòng chọn file ảnh');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setMessage('Kích thước file không được vượt quá 5MB');
      return;
    }

    setIsUploadingAvatar(true);
    setMessage("");

    try {
      await uploadAvatar(file);
      setMessage("Cập nhật avatar thành công!");
      
      // Clear the input
      e.target.value = '';
      
      // Refresh user data after successful upload
      await refreshUser();
      
      // Dispatch event to notify other components
      window.dispatchEvent(new CustomEvent('avatarUpdated'));
      
    } catch (error: any) {
      console.error('Upload avatar error:', error);
      setMessage(error.message || "Có lỗi xảy ra khi upload avatar");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="relative z-10 space-y-8 p-6">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-white mb-3 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Tài Khoản
          </h1>
          <p className="text-white/70 text-lg max-w-md mx-auto">
            Quản lý thông tin cá nhân và cài đặt tài khoản
          </p>
        </div>

      {/* Message */}
      {message && (
        <div className={`rounded-xl px-4 py-3 text-sm ${
          message.includes('thành công') 
            ? 'bg-green-500/20 text-green-300 border border-green-500/30' 
            : 'bg-red-500/20 text-red-300 border border-red-500/30'
        }`}>
          {message}
        </div>
      )}

        {/* Main Content */}
        <div className="max-w-4xl mx-auto">
          {/* Form Section */}
          <div className="rounded-2xl bg-white/5 p-8 ring-1 ring-white/10 backdrop-blur-sm">
            <form onSubmit={handleUpdateProfile} className="space-y-6">
            <div className="space-y-4">
              {/* Avatar Upload Section */}
              <div className="text-center pb-6 border-b border-white/10">
                <div className="relative inline-block">
                  <div
                    className="mx-auto h-24 w-24 rounded-full ring-4 ring-white/20 mb-4 overflow-hidden"
                    style={{
                      background: user?.avatar
                        ? `url(${getAvatarUrl(user.avatar)}) center/cover`
                        : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    }}
                  >
                    {user?.avatar ? (
                      <img 
                        src={getAvatarUrl(user.avatar)}
                        alt="Avatar" 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                          if (fallback) fallback.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    
                    {/* Fallback avatar with user initial */}
                    <div 
                      className="w-full h-full flex items-center justify-center text-white text-xl font-bold"
                      style={{ display: user?.avatar ? 'none' : 'flex' }}
                    >
                      {user?.username?.charAt(0).toUpperCase() || 'U'}
                    </div>
                  </div>
                  
                  {/* Avatar Upload Button */}
                  <label
                    className="absolute bottom-0 right-0 bg-primary-500 hover:bg-primary-600 text-white rounded-full p-2 shadow-lg transition-all duration-200 hover:scale-110 cursor-pointer"
                    title="Thay đổi avatar"
                  >
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="hidden"
                      disabled={isUploadingAvatar}
                    />
                    {isUploadingAvatar ? (
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    )}
                  </label>
                </div>
                <p className="text-sm text-white/60">Nhấn để thay đổi avatar</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Email</label>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl bg-white/10 px-4 py-3 text-white border border-white/20 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Tên đăng nhập</label>
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full rounded-xl bg-white/10 px-4 py-3 text-white border border-white/20 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
                  required
                />
              </div>
              
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">Tên hiển thị</label>
                  <input
                    value={fullname}
                    onChange={(e) => setFullname(e.target.value)}
                    className="w-full rounded-xl bg-white/10 px-4 py-3 text-white border border-white/20 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
                    placeholder="Mặc định là tên đăng nhập"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">Số điện thoại</label>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full rounded-xl bg-white/10 px-4 py-3 text-white border border-white/20 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
                    placeholder="Nhập số điện thoại của bạn"
                  />
                </div>

            </div>

            <div className="flex flex-col gap-3 mt-6">
              <button 
                type="button"
                disabled={isUpdating}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-4 px-6 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg text-lg"
                onClick={handleUpdateProfile}
              >
                {isUpdating ? "Đang cập nhật..." : "💾 Cập nhật thông tin"}
              </button>
              
              <button
                type="button"
                onClick={() => setShowPasswordForm(!showPasswordForm)}
                className="text-white/70 hover:text-white text-sm underline transition-colors duration-200"
              >
                Đặt mật khẩu, nhấn vào <span className="text-primary-400">đây</span>
              </button>
              
              {/* Message Display */}
              {message && (
                <div className={`mt-4 p-3 rounded-lg text-sm ${
                  message.includes('thành công') 
                    ? 'bg-green-500/20 text-green-300 border border-green-500/30' 
                    : 'bg-red-500/20 text-red-300 border border-red-500/30'
                }`}>
                  {message}
                </div>
              )}
            </div>
            </form>
          </div>

          {/* Password Form */}
          {showPasswordForm && (
            <div className="mt-8 rounded-2xl bg-white/5 p-8 ring-1 ring-white/10 backdrop-blur-sm">
                <form onSubmit={handleChangePassword} className="space-y-6">
              <h3 className="text-xl font-semibold text-white mb-4">Đổi mật khẩu</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">Mật khẩu hiện tại</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full rounded-xl bg-white/10 px-4 py-3 text-white border border-white/20 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">Mật khẩu mới</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full rounded-xl bg-white/10 px-4 py-3 text-white border border-white/20 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
                    required
                    minLength={6}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">Xác nhận mật khẩu mới</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full rounded-xl bg-white/10 px-4 py-3 text-white border border-white/20 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
                    required
                    minLength={6}
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button 
                  type="submit"
                  disabled={isUpdating}
                  className="bg-primary-500 hover:bg-primary-600 text-white font-medium py-3 px-6 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUpdating ? "Đang xử lý..." : "Đổi mật khẩu"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordForm(false);
                    setCurrentPassword("");
                    setNewPassword("");
                    setConfirmPassword("");
                    setMessage("");
                  }}
                  className="border border-white/30 text-white/80 hover:text-white hover:bg-white/10 font-medium py-3 px-6 rounded-xl transition-all duration-200"
                >
                  Hủy
                </button>
                </div>
                </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
