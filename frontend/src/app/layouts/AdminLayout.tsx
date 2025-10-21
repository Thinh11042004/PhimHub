// src/app/layouts/AdminLayout.tsx
import { useMemo } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";

export default function AdminLayout() {
  const { pathname } = useLocation();

  const pageTitle = useMemo(() => {
    if (pathname.startsWith("/admin/genres")) return "Quản lý thể loại";
    if (pathname.startsWith("/admin/movies")) return "Quản lý phim lẻ";
    if (pathname.startsWith("/admin/series")) return "Quản lý phim bộ";
    if (pathname.startsWith("/admin/comments")) return "Quản lý bình luận";
    if (pathname.startsWith("/admin/users")) return "Quản lý người dùng";
    if (pathname.startsWith("/admin/upload-movie")) return "Upload phim lẻ";
    if (pathname.startsWith("/admin/upload-series")) return "Upload phim bộ";
    return "Bảng điều khiển";
  }, [pathname]);

  return (
    <div className="grid grid-cols-1 gap-6 px-3 py-8 md:grid-cols-[260px,1fr] md:px-6 w-full">
      {/* Sidebar */}
      <aside className="rounded-2xl border border-white/10 bg-white/5 p-3 backdrop-blur-sm">
        <div className="mb-2 px-2">
          <h2 className="text-xl font-semibold tracking-tight">Admin Console</h2>
          <p className="text-sm text-white/60">Quản trị nội dung và hệ thống</p>
        </div>

        <nav className="mt-4 space-y-1">
          <NavItem to="/admin" icon={<IconDashboard />}>Tổng quan</NavItem>

          <SectionLabel>Danh mục & Nội dung</SectionLabel>
          <NavItem to="/admin/genres" icon={<IconTag />}>Thể loại</NavItem>

          <SectionLabel>Người dùng</SectionLabel>
          <NavItem to="/admin/users" icon={<IconUsers />}>Người dùng</NavItem>

          <SectionLabel>Tải lên</SectionLabel>
          <NavItem to="/admin/upload-movie" icon={<IconUpload />}>Upload phim lẻ</NavItem>
          <NavItem to="/admin/upload-series" icon={<IconUpload />}>Upload phim bộ</NavItem>
        </nav>
      </aside>

      {/* Main area */}
      <div className="min-h-[70vh]">
        {/* Header bar */}
        <div className="sticky top-0 z-10 -mx-1 mb-4 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur-md md:mx-0">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="text-lg font-semibold md:text-xl">{pageTitle}</h1>
              <p className="text-xs text-white/60">{pathname}</p>
            </div>
            <div className="flex items-center gap-2">
              <HeaderButton>Hướng dẫn</HeaderButton>
              <HeaderButton primary>Báo cáo</HeaderButton>
            </div>
          </div>
        </div>

        {/* Content card */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm md:p-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

function NavItem({ to, icon, children }: { to: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `group flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors duration-150 ${
          isActive
            ? "bg-white/20 text-white"
            : "bg-white/5 text-white/90 hover:bg-white/10 hover:text-white"
        }`
      }
      end
    >
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-white/80 ring-1 ring-white/10 group-hover:bg-white/10">
        {icon}
      </span>
      <span className="truncate">{children}</span>
    </NavLink>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-3 pt-4 text-xs font-medium uppercase tracking-wider text-white/50">{children}</div>
  );
}

function HeaderButton({ children, primary }: { children: React.ReactNode; primary?: boolean }) {
  return (
    <button
      className={
        primary
          ? "rounded-lg bg-white/20 px-3 py-1.5 text-sm font-medium text-white shadow-sm ring-1 ring-white/20 hover:bg-white/25"
          : "rounded-lg bg-white/10 px-3 py-1.5 text-sm font-medium text-white/90 ring-1 ring-white/15 hover:bg-white/15"
      }
    >
      {children}
    </button>
  );
}

// Minimal inline icons (no external deps)
function IconDashboard() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
      <path d="M3 3h8v10H3V3zm10 0h8v6h-8V3zM3 15h8v6H3v-6zm10-6h8v12h-8V9z" />
    </svg>
  );
}

function IconTag() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
      <path d="M10.59 2.59L2 11.17V22h10.83l8.59-8.59L10.59 2.59zM7 7a2 2 0 114 0 2 2 0 01-4 0z" />
    </svg>
  );
}

function IconMovie() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
      <path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V6h-2l-2-2z" />
    </svg>
  );
}

function IconSeries() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
      <path d="M3 5h18v4H3V5zm0 6h18v8H3v-8zm2 2v4h14v-4H5z" />
    </svg>
  );
}

function IconComment() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
      <path d="M20 17.17V4H4v12h12l4 4-.83-2.83z" />
    </svg>
  );
}

function IconUsers() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
      <path d="M16 11c1.66 0 2.99-1.34 2.99-3A3 3 0 0016 5a3 3 0 000 6zM8 11a3 3 0 100-6 3 3 0 000 6zm0 2c-2.33 0-7 1.17-7 3.5V20h14v-3.5C15 14.17 10.33 13 8 13zm8 0c-.29 0-.62.02-.97.05A6.48 6.48 0 0120 17.5V20h4v-3.5c0-2.33-4.67-3.5-8-3.5z" />
    </svg>
  );
}

function IconUpload() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
      <path d="M5 20h14v-2H5v2zm7-18l-5 5h3v6h4V7h3l-5-5z" />
    </svg>
  );
}
