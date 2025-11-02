// src/app/layouts/AccountLayout.tsx
import { NavLink, Outlet, Navigate } from "react-router-dom";
import { useAuth } from "../../store/auth";
import { getAvatarUrl } from "../../utils/avatarUtils";

export default function AccountLayout() {
  const { user, logout } = useAuth();
  if (user?.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }
  return (
    <div className="grid grid-cols-1 gap-4 px-3 py-6 md:grid-cols-[1fr,280px] md:px-4 w-full">
      {/* Content */}
      <div className="min-h-[60vh] order-2 md:order-1">
        <Outlet />
      </div>

      {/* Sidebar - Right side */}
      <aside className="space-y-4 order-1 md:order-2 bg-white/5 backdrop-blur-sm rounded-3xl p-4 ring-1 ring-white/10">
        {/* User Info Card */}
        <div className="rounded-3xl bg-white/5 p-6 ring-1 ring-white/10 backdrop-blur-sm">
          <div className="text-center">
            <div
              className="mx-auto h-24 w-24 rounded-full ring-2 ring-white/20 mb-4 overflow-hidden"
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
                {(user?.fullname || user?.username || 'U').charAt(0).toUpperCase()}
              </div>
            </div>
            
            <h3 className="text-white text-lg font-semibold mb-1">
              {user?.fullname || user?.username || 'Người dùng'}
            </h3>
            <p className="text-gray-300 text-sm">@{user?.username}</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="space-y-2">
          <NavItem to="/account" icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          }>Tài khoản</NavItem>
          <NavItem to="/account/my-lists" icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          }>Danh sách của tôi</NavItem>
          <NavItem to="/account/favorites" icon={
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
          }>Yêu thích</NavItem>
          <NavItem to="/account/lists" icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
          }>Danh sách tùy chỉnh</NavItem>
          <NavItem to="/account/history" icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }>Đã xem</NavItem>
        </nav>

        {/* Logout Button */}
        <button
          onClick={logout}
          className="w-full rounded-2xl bg-red-500/20 hover:bg-red-500/30 text-red-300 hover:text-red-200 px-4 py-3 transition-all duration-200 flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span>Đăng xuất</span>
        </button>
      </aside>
    </div>
  );
}

function NavItem({ to, children, icon }: { to: string; children: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `block rounded-2xl px-4 py-3 ring-1 ring-white/10 transition-all duration-200 flex items-center gap-3 ${
          isActive 
            ? "bg-white/20 text-white ring-white/30" 
            : "bg-white/5 hover:bg-white/10 text-white/80 hover:text-white"
        }`
      }
      end
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      <span className="font-medium">{children}</span>
    </NavLink>
  );
}
