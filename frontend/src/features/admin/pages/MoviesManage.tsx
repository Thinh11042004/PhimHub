// src/features/admin/pages/MoviesManage.tsx
import { useEffect, useMemo, useState } from "react";
import { call } from "../../../shared/lib/api";

type Movie = {
  id: number;
  title: string;
  slug: string;
  release_year?: number;
  view_count?: number;
  status?: string;
  poster_url?: string;
  duration?: number;
  country?: string;
};

export default function MoviesManage() {
  const [loading, setLoading] = useState(true);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [q, setQ] = useState("");
  const [year, setYear] = useState<string>("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        params.set('status', 'published');
        params.set('is_series', 'false');
        params.set('limit', pageSize.toString());
        params.set('offset', ((page - 1) * pageSize).toString());
        if (q.trim()) params.set('search', q.trim());
        if (year.trim()) params.set('year', year.trim());
        
        const payload = await call<{ success: boolean; data: { movies: any[] } }>(`/movies?${params.toString()}`);
        const list = (payload?.data?.movies || []).map((m: any) => ({
          id: m.id,
          title: m.title,
          slug: m.slug,
          release_year: m.release_year,
          view_count: m.view_count,
          status: m.status,
          poster_url: m.poster_url,
          duration: m.duration,
          country: m.country,
        }));
        setMovies(list);
      } catch (error) {
        console.error('Error fetching movies:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchMovies();
  }, [page, pageSize, q, year]);

  const totalPages = Math.ceil(movies.length / pageSize);

  return (
    <div className="mx-auto w-full max-w-6xl px-3 py-4 md:px-4">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-white">Quản lý phim lẻ</h1>
          <p className="text-sm text-white/70">Tổng cộng {movies.length} phim</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Tìm phim theo tiêu đề"
            className="w-64 rounded-xl border border-white/15 bg-white/10 px-4 py-2 text-sm text-white placeholder:text-white/60 outline-none focus:ring-2 focus:ring-cyan-400"
          />
          <input
            value={year}
            onChange={(e) => setYear(e.target.value)}
            placeholder="Năm"
            className="w-24 rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/60 outline-none focus:ring-2 focus:ring-cyan-400"
          />
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="px-4 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">Phim</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">Năm</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">Thời lượng</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">Quốc gia</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">Lượt xem</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">Trạng thái</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-white/60 uppercase tracking-wider">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-sm text-white/70">
                    <div className="flex items-center justify-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-cyan-400"></div>
                      Đang tải...
                    </div>
                  </td>
                </tr>
              ) : movies.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-sm text-white/70">
                    Không có dữ liệu
                  </td>
                </tr>
              ) : (
                movies.map((movie) => (
                  <tr key={movie.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-8 flex-shrink-0 rounded bg-white/10 flex items-center justify-center">
                          {movie.poster_url ? (
                            <img src={movie.poster_url} alt={movie.title} className="h-full w-full rounded object-cover" />
                          ) : (
                            <div className="text-white/40 text-xs">📽️</div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate font-medium text-white">{movie.title}</div>
                          <div className="truncate text-sm text-white/60">{movie.slug}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-white/80">{movie.release_year ?? '-'}</td>
                    <td className="px-4 py-3 text-sm text-white/80">{movie.duration ? `${movie.duration} phút` : '-'}</td>
                    <td className="px-4 py-3 text-sm text-white/80">{movie.country ?? '-'}</td>
                    <td className="px-4 py-3 text-sm text-white/80">{movie.view_count?.toLocaleString() ?? 0}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                        movie.status === 'published' 
                          ? 'bg-green-500/20 text-green-300 ring-1 ring-green-400/30' 
                          : 'bg-yellow-500/20 text-yellow-300 ring-1 ring-yellow-400/30'
                      }`}>
                        {movie.status === 'published' ? 'Đã xuất bản' : 'Bản nháp'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium text-white ring-1 ring-white/20 hover:bg-white/15">
                          Sửa
                        </button>
                        <button className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium text-white ring-1 ring-white/20 hover:bg-white/15">
                          Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {!loading && movies.length > 0 && (
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="rounded-lg bg-white/90 px-3 py-2 text-sm text-slate-900 outline-none ring-1 ring-white/15"
            >
              {[6, 12, 24, 48].map((n) => (
                <option key={n} value={n}>{n} mục/trang</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="rounded-lg bg-white/10 px-3 py-2 text-sm ring-1 ring-white/15 hover:bg-white/15 disabled:opacity-50 text-white"
            >
              Trước
            </button>
            <span className="text-sm text-white/70">Trang {page} / {totalPages}</span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="rounded-lg bg-white/10 px-3 py-2 text-sm ring-1 ring-white/15 hover:bg-white/15 disabled:opacity-50 text-white"
            >
              Sau
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
