// src/features/admin/components/ReportModal.tsx
import { useEffect, useState } from 'react';
import Modal from '../../../shared/components/Modal';

interface ReportModalProps {
  open: boolean;
  onClose: () => void;
}

interface ReportData {
  usersCount: number;
  moviesCount: number;
  seriesCount: number;
  totalContent: number;
  popularGenres: Array<{ id: number; name: string; movie_count?: number }>;
  topViewed: Array<{ id: number; title: string; view_count?: number }>;
  recentMovies: Array<{ id: number; title: string; created_at?: string }>;
  recentUsers: Array<{ id: number; username: string; email: string; created_at?: string }>;
}

const API_BASE_URL = 'http://localhost:3001/api';

function fmt(n: number | null | undefined): string {
  if (n === null || n === undefined) return '0';
  return new Intl.NumberFormat('vi-VN').format(n);
}

export default function ReportModal({ open, onClose }: ReportModalProps) {
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState<ReportData>({
    usersCount: 0,
    moviesCount: 0,
    seriesCount: 0,
    totalContent: 0,
    popularGenres: [],
    topViewed: [],
    recentMovies: [],
    recentUsers: [],
  });

  useEffect(() => {
    if (!open) return;

    const fetchReportData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('phimhub:token');

        // Fetch users
        const usersRes = await fetch(`${API_BASE_URL}/admin/users`, {
          headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          credentials: 'include',
        });
        const usersPayload = usersRes.ok ? await usersRes.json() : { data: [] };
        const allUsers: any[] = usersPayload?.data || [];
        const recentU = [...allUsers]
          .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
          .slice(0, 5)
          .map(u => ({ id: u.id, username: u.username, email: u.email, created_at: u.created_at }));

        // Fetch movies count
        const mvRes = await fetch(`${API_BASE_URL}/movies?status=published&is_series=false&limit=1`);
        const mvPayload = await mvRes.json();
        const moviesCount = mvPayload?.data?.pagination?.total ?? 0;

        // Fetch series count
        const seRes = await fetch(`${API_BASE_URL}/movies?status=published&is_series=true&limit=1`);
        const sePayload = await seRes.json();
        const seriesCount = sePayload?.data?.pagination?.total ?? 0;

        // Fetch recent movies
        const recentRes = await fetch(`${API_BASE_URL}/movies?limit=5&sort_by=created_at&sort_order=desc`);
        const recentPayload = await recentRes.json();
        const recentMovies = (recentPayload?.data?.movies || [])
          .slice(0, 5)
          .map((m: any) => ({ id: m.id, title: m.title, created_at: m.created_at }));

        // Fetch popular genres
        const genresRes = await fetch(`${API_BASE_URL}/genres`);
        const genresPayload = await genresRes.json();
        const popularGenres = (genresPayload?.data || [])
          .sort((a: any, b: any) => (b.movie_count || 0) - (a.movie_count || 0))
          .slice(0, 6);

        // Fetch top viewed
        const topRes = await fetch(`${API_BASE_URL}/movies?limit=10&sort_by=view_count&sort_order=desc`);
        const topPayload = await topRes.json();
        const topViewed = (topPayload?.data?.movies || [])
          .map((m: any) => ({ id: m.id, title: m.title, view_count: m.view_count }));

        setReportData({
          usersCount: allUsers.length,
          moviesCount,
          seriesCount,
          totalContent: moviesCount + seriesCount,
          popularGenres,
          topViewed,
          recentMovies,
          recentUsers: recentU,
        });
      } catch (error) {
        console.error('Error fetching report data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchReportData();
  }, [open]);

  const handleExport = () => {
    window.print();
  };

  const currentDate = new Date().toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <Modal open={open} onClose={onClose} title="Báo cáo thống kê hệ thống" maxWidthClass="max-w-5xl">
      <div className="space-y-6 text-white/90 print:text-black">
        {/* Header với thông tin báo cáo */}
        <div className="rounded-lg border border-white/10 bg-white/5 p-4 print:bg-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white print:text-black">Báo cáo tổng quan</h3>
              <p className="text-sm text-white/70 print:text-gray-600">Được tạo lúc: {currentDate}</p>
            </div>
            <button
              onClick={handleExport}
              className="rounded-lg bg-blue-500/20 px-4 py-2 text-sm font-medium text-blue-300 ring-1 ring-blue-500/30 hover:bg-blue-500/30 print:hidden"
            >
              <svg className="mr-2 inline h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Xuất báo cáo
            </button>
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-white/70">Đang tải dữ liệu...</div>
        ) : (
          <>
            {/* KPI Cards */}
            <section>
              <h3 className="mb-3 text-base font-semibold text-white print:text-black">Tổng quan số liệu</h3>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard title="Tổng người dùng" value={fmt(reportData.usersCount)} icon="👥" />
                <StatCard title="Phim lẻ" value={fmt(reportData.moviesCount)} icon="🎬" />
                <StatCard title="Phim bộ" value={fmt(reportData.seriesCount)} icon="📺" />
                <StatCard title="Tổng nội dung" value={fmt(reportData.totalContent)} icon="📚" />
              </div>
            </section>

            {/* Popular Genres */}
            <section>
              <h3 className="mb-3 text-base font-semibold text-white print:text-black">Thể loại phổ biến</h3>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {reportData.popularGenres.map((genre, index) => (
                  <div
                    key={genre.id}
                    className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-3 print:border-gray-300 print:bg-gray-50"
                  >
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-xs font-semibold print:bg-gray-200 print:text-gray-700">
                        {index + 1}
                      </span>
                      <span className="font-medium">{genre.name}</span>
                    </div>
                    <span className="text-sm text-white/70 print:text-gray-600">
                      {fmt(genre.movie_count)} phim
                    </span>
                  </div>
                ))}
                {reportData.popularGenres.length === 0 && (
                  <div className="col-span-full py-4 text-center text-white/70 print:text-gray-600">
                    Không có dữ liệu thể loại
                  </div>
                )}
              </div>
            </section>

            {/* Top Viewed Content */}
            <section>
              <h3 className="mb-3 text-base font-semibold text-white print:text-black">Top 10 nội dung được xem nhiều nhất</h3>
              <div className="rounded-lg border border-white/10 bg-white/5 p-4 print:border-gray-300 print:bg-gray-50">
                <div className="space-y-2">
                  {reportData.topViewed.slice(0, 10).map((item, index) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded-lg bg-white/5 p-3 print:bg-white"
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-sm font-semibold print:bg-gray-200 print:text-gray-700">
                          {index + 1}
                        </span>
                        <span className="font-medium">{item.title}</span>
                      </div>
                      <span className="text-sm font-semibold text-white/90 print:text-gray-700">
                        {fmt(item.view_count)} lượt xem
                      </span>
                    </div>
                  ))}
                  {reportData.topViewed.length === 0 && (
                    <div className="py-4 text-center text-white/70 print:text-gray-600">
                      Không có dữ liệu lượt xem
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* Recent Activity */}
            <div className="grid gap-4 lg:grid-cols-2">
              <section>
                <h3 className="mb-3 text-base font-semibold text-white print:text-black">Phim mới thêm gần đây</h3>
                <div className="rounded-lg border border-white/10 bg-white/5 p-4 print:border-gray-300 print:bg-gray-50">
                  <div className="space-y-2">
                    {reportData.recentMovies.map((movie) => (
                      <div
                        key={movie.id}
                        className="flex items-center justify-between rounded-lg bg-white/5 p-2 print:bg-white"
                      >
                        <span className="truncate text-sm">{movie.title}</span>
                        <span className="text-xs text-white/60 print:text-gray-600">
                          {movie.created_at ? new Date(movie.created_at).toLocaleDateString('vi-VN') : '-'}
                        </span>
                      </div>
                    ))}
                    {reportData.recentMovies.length === 0 && (
                      <div className="py-4 text-center text-sm text-white/70 print:text-gray-600">
                        Không có phim mới
                      </div>
                    )}
                  </div>
                </div>
              </section>

              <section>
                <h3 className="mb-3 text-base font-semibold text-white print:text-black">Người dùng mới đăng ký</h3>
                <div className="rounded-lg border border-white/10 bg-white/5 p-4 print:border-gray-300 print:bg-gray-50">
                  <div className="space-y-2">
                    {reportData.recentUsers.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center justify-between rounded-lg bg-white/5 p-2 print:bg-white"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-medium">{user.username}</div>
                          <div className="truncate text-xs text-white/60 print:text-gray-600">{user.email}</div>
                        </div>
                        <span className="ml-2 text-xs text-white/60 print:text-gray-600">
                          {user.created_at ? new Date(user.created_at).toLocaleDateString('vi-VN') : '-'}
                        </span>
                      </div>
                    ))}
                    {reportData.recentUsers.length === 0 && (
                      <div className="py-4 text-center text-sm text-white/70 print:text-gray-600">
                        Không có người dùng mới
                      </div>
                    )}
                  </div>
                </div>
              </section>
            </div>

            {/* Summary */}
            <section className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-4 print:border-blue-300 print:bg-blue-50">
              <h3 className="mb-2 text-base font-semibold text-blue-300 print:text-blue-700">Tóm tắt</h3>
              <ul className="space-y-1 text-sm text-blue-200/90 print:text-blue-800">
                <li>• Hệ thống hiện có {fmt(reportData.usersCount)} người dùng đang hoạt động</li>
                <li>• Tổng cộng {fmt(reportData.totalContent)} nội dung (phim lẻ và phim bộ)</li>
                <li>• Có {reportData.popularGenres.length} thể loại đang được sử dụng</li>
                <li>• Báo cáo được tạo vào {currentDate}</li>
              </ul>
            </section>
          </>
        )}
      </div>
    </Modal>
  );
}

function StatCard({ title, value, icon }: { title: string; value: string; icon: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-4 print:border-gray-300 print:bg-gray-50">
      <div className="mb-2 text-2xl">{icon}</div>
      <div className="text-xs text-white/70 print:text-gray-600">{title}</div>
      <div className="text-2xl font-bold text-white print:text-black">{value}</div>
    </div>
  );
}

