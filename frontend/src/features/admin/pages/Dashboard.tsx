// src/features/admin/pages/Dashboard.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE_URL = 'http://localhost:3001/api';

type ActivityTab = 'movies' | 'users';

export default function Dashboard() {
  const navigate = useNavigate();
  const [usersCount, setUsersCount] = useState<number | null>(null);
  const [moviesCount, setMoviesCount] = useState<number | null>(null);
  const [seriesCount, setSeriesCount] = useState<number | null>(null);
  const [recentMovies, setRecentMovies] = useState<Array<{ id: number; title: string; slug: string; created_at?: string }>>([]);
  const [recentUsers, setRecentUsers] = useState<Array<{ id: number; username: string; email: string; created_at?: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [popularGenres, setPopularGenres] = useState<Array<{ id: number; name: string; movie_count?: number }>>([]);
  const [topViewed, setTopViewed] = useState<Array<{ id: number; title: string; view_count?: number }>>([]);
  const [activityTab, setActivityTab] = useState<ActivityTab>('movies');

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        // Users count and recent users via admin API
        const token = localStorage.getItem('phimhub:token');
        const usersRes = await fetch(`${API_BASE_URL}/admin/users`, {
          headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          credentials: 'include',
        });
        const usersPayload = usersRes.ok ? await usersRes.json() : { data: [] };
        const allUsers: any[] = usersPayload?.data || [];
        setUsersCount(allUsers.length);
        const recentU = [...allUsers]
          .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
          .map(u => ({ id: u.id, username: u.username, email: u.email, created_at: u.created_at }));
        setRecentUsers(recentU as any);

        // Movies count (non-series) via pagination.total
        const mvRes = await fetch(`${API_BASE_URL}/movies?status=published&is_series=false&limit=1`);
        const mvPayload = await mvRes.json();
        setMoviesCount(mvPayload?.data?.pagination?.total ?? 0);

        // Series count via pagination.total
        const seRes = await fetch(`${API_BASE_URL}/movies?status=published&is_series=true&limit=1`);
        const sePayload = await seRes.json();
        setSeriesCount(sePayload?.data?.pagination?.total ?? 0);

        // Recent activity: latest movies by created_at desc
        const recentRes = await fetch(`${API_BASE_URL}/movies?limit=5&sort_by=created_at&sort_order=desc`);
        const recentPayload = await recentRes.json();
        const list = (recentPayload?.data?.movies || []).map((m: any) => ({ id: m.id, title: m.title, slug: m.slug, created_at: m.created_at }));
        setRecentMovies(list);

        // Popular genres by movie_count (top 6)
        const genresRes = await fetch(`${API_BASE_URL}/genres`);
        const genresPayload = await genresRes.json();
        const genres = (genresPayload?.data || [])
          .sort((a: any, b: any) => (b.movie_count || 0) - (a.movie_count || 0))
          .slice(0, 6);
        setPopularGenres(genres);

        // Top viewed content
        const topRes = await fetch(`${API_BASE_URL}/movies?limit=5&sort_by=view_count&sort_order=desc`);
        const topPayload = await topRes.json();
        const top = (topPayload?.data?.movies || []).map((m: any) => ({ id: m.id, title: m.title, view_count: m.view_count }));
        setTopViewed(top);
      } catch {
        // ignore and keep partial data
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const totalContent = useMemo(() => {
    const m = moviesCount ?? 0;
    const s = seriesCount ?? 0;
    return m + s;
  }, [moviesCount, seriesCount]);

  return (
    <div className="space-y-6">
      {/* Hero / welcome */}
      <div className="flex flex-col gap-3 rounded-3xl border border-white/10 bg-gradient-to-tr from-white/5 to-white/10 p-5 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight md:text-2xl">Bảng điều khiển</h1>
          <p className="text-sm text-white/70">Tổng quan nhanh về hệ thống và nội dung</p>
        </div>
        <div className="flex gap-2">
          <ActionButton onClick={() => window.print()}>Xuất báo cáo</ActionButton>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Người dùng" value={fmt(usersCount)} trend={loading ? '...' : ''} icon={<IconUsers />} onClick={() => navigate('/admin/users')} />
        <StatCard title="Phim lẻ" value={fmt(moviesCount)} trend={loading ? '...' : ''} icon={<IconMovie />} onClick={() => navigate('/admin/movies')} />
        <StatCard title="Phim bộ" value={fmt(seriesCount)} trend={loading ? '...' : ''} icon={<IconSeries />} onClick={() => navigate('/admin/series')} />
        <StatCard title="Tổng nội dung" value={fmt(totalContent)} trend={loading ? '...' : ''} icon={<IconView />} onClick={() => navigate('/admin/movies')} />
      </div>

      {/* Two column layout */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Recent activity - single card with tab */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold">Hoạt động gần đây</h2>
            <div className="inline-flex rounded-full bg-white/5 p-1 ring-1 ring-white/10">
              <button
                className={`rounded-full px-3 py-1 text-sm ${activityTab === 'movies' ? 'bg-white/20' : 'hover:bg-white/10'}`}
                onClick={() => setActivityTab('movies')}
                title="Phim"
              >
                Phim
              </button>
              <button
                className={`rounded-full px-3 py-1 text-sm ${activityTab === 'users' ? 'bg-white/20' : 'hover:bg-white/10'}`}
                onClick={() => setActivityTab('users')}
                title="Người dùng"
              >
                Người dùng
              </button>
            </div>
          </div>
          <ul className="divide-y divide-white/10">
            {activityTab === 'movies' && recentMovies.map((m) => (
              <ActivityItem
                key={`m-${m.id}`}
                title={m.title}
                meta={m.created_at ? new Date(m.created_at).toLocaleString() : ''}
                onClick={() => navigate(`/movies/${m.slug}`)}
              />
            ))}
            {activityTab === 'users' && recentUsers.map((u) => (
              <ActivityItem
                key={`u-${u.id}`}
                title={`${u.username} • ${u.email}`}
                meta={u.created_at ? new Date(u.created_at).toLocaleString() : ''}
                onClick={() => navigate('/admin/users')}
              />
            ))}
            {activityTab === 'movies' && !recentMovies.length && <div className="p-6 text-white/70">Không có hoạt động phim</div>}
            {activityTab === 'users' && !recentUsers.length && <div className="p-6 text-white/70">Chưa có người dùng mới</div>}
          </ul>
        </div>

        {/* System health */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <h2 className="mb-3 text-base font-semibold">Trạng thái hệ thống</h2>
            <HealthItem label="API" status="Tốt" />
            <HealthItem label="Cơ sở dữ liệu" status="Tốt" />
            <HealthItem label="Dung lượng lưu trữ" status="Ổn định" />
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <h2 className="mb-3 text-base font-semibold">Thể loại phổ biến</h2>
            <div className="grid gap-2 sm:grid-cols-2">
              {popularGenres.map((g) => (
                <div key={g.id} className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2 ring-1 ring-white/10">
                  <div className="truncate text-sm">{g.name}</div>
                  <div className="text-xs text-white/60">{fmt(g.movie_count ?? 0)} phim</div>
                </div>
              ))}
              {!popularGenres.length && <div className="text-sm text-white/70">Không có dữ liệu</div>}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <h2 className="mb-3 text-base font-semibold">Xem nhiều</h2>
            <ul className="space-y-2">
              {topViewed.map((m) => (
                <li key={m.id} className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2 ring-1 ring-white/10">
                  <span className="truncate text-sm">{m.title}</span>
                  <span className="text-xs text-white/60">{fmt(m.view_count ?? 0)} lượt</span>
                </li>
              ))}
              {!topViewed.length && <div className="text-sm text-white/70">Không có dữ liệu</div>}
            </ul>
          </div>
        </div>
      </div>

      {/* Removed separate user activity card; unified above */}
    </div>
  );
}

function StatCard({ title, value, trend, icon, onClick }: { title: string; value: string; trend?: string; icon: React.ReactNode; onClick?: () => void }) {
  return (
    <button onClick={onClick} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-left hover:bg-white/10">
      <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/15">
        {icon}
      </div>
      <div className="min-w-0">
        <div className="truncate text-sm text-white/70">{title}</div>
        <div className="flex items-baseline gap-2">
          <div className="text-2xl font-semibold">{value}</div>
          {trend ? <span className="text-xs text-white/60">{trend}</span> : null}
        </div>
      </div>
    </button>
  );
}

function ActivityItem({ title, meta, onClick }: { title: string; meta: string; onClick?: () => void }) {
  return (
    <li className="flex items-center justify-between gap-3 py-3">
      <div className="flex items-center gap-3">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-white/80 ring-1 ring-white/10">
          <IconDot />
        </span>
        <div className="truncate">
          <div className="truncate text-sm">{title}</div>
          <div className="text-xs text-white/60">{meta}</div>
        </div>
      </div>
      <button onClick={onClick} className="rounded-lg bg-white/10 px-2.5 py-1 text-xs ring-1 ring-white/15 hover:bg-white/15">Chi tiết</button>
    </li>
  );
}

function HealthItem({ label, status }: { label: string; status: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-white/5 p-3 ring-1 ring-white/10">
      <div className="text-sm">{label}</div>
      <div className="text-xs text-emerald-400">{status}</div>
    </div>
  );
}

function ActionButton({ children, primary, onClick }: { children: React.ReactNode; primary?: boolean; onClick?: () => void }) {
  return (
    <button onClick={onClick}
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

// Inline icons to match AdminLayout
function IconUsers() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
      <path d="M16 11c1.66 0 2.99-1.34 2.99-3A3 3 0 0016 5a3 3 0 000 6zM8 11a3 3 0 100-6 3 3 0 000 6zm0 2c-2.33 0-7 1.17-7 3.5V20h14v-3.5C15 14.17 10.33 13 8 13zm8 0c-.29 0-.62.02-.97.05A6.48 6.48 0 0120 17.5V20h4v-3.5c0-2.33-4.67-3.5-8-3.5z" />
    </svg>
  );
}

function IconMovie() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
      <path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V6h-2l-2-2z" />
    </svg>
  );
}

function IconSeries() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
      <path d="M3 5h18v4H3V5zm0 6h18v8H3v-8zm2 2v4h14v-4H5z" />
    </svg>
  );
}

function IconView() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
      <path d="M12 5c-7.633 0-10 7-10 7s2.367 7 10 7 10-7 10-7-2.367-7-10-7zm0 12a5 5 0 110-10 5 5 0 010 10z" />
    </svg>
  );
}

function IconDot() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
      <circle cx="12" cy="12" r="4" />
    </svg>
  );
}

function fmt(n: number | null): string {
  if (n === null || n === undefined) return '...';
  return new Intl.NumberFormat('vi-VN').format(n);
}
