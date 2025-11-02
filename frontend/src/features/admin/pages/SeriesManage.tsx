// src/features/admin/pages/SeriesManage.tsx
import { useEffect, useMemo, useState } from "react";
import { call } from "../../../shared/lib/api";
import Modal from "../../../shared/components/Modal";
import { getImageUrl } from "../../../utils/imageProxy";

type Series = {
  id: number;
  title: string;
  slug: string;
  total_episodes?: number;
  status?: string;
  poster_url?: string;
  release_year?: number;
  country?: string;
  view_count?: number;
};

export default function SeriesManage() {
  const [loading, setLoading] = useState(true);
  const [series, setSeries] = useState<Series[]>([]);
  const [q, setQ] = useState("");
  const [year, setYear] = useState<string>("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [editingSeries, setEditingSeries] = useState<Series | null>(null);
  const [deletingSeries, setDeletingSeries] = useState<Series | null>(null);
  const [editForm, setEditForm] = useState({
    title: '',
    release_year: '',
    country: '',
    status: 'published'
  });

  useEffect(() => {
    const fetchSeries = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        params.set('status', 'published');
        params.set('is_series', 'true');
        params.set('limit', pageSize.toString());
        params.set('offset', ((page - 1) * pageSize).toString());
        if (q.trim()) params.set('search', q.trim());
        if (year.trim()) params.set('year', year.trim());
        
        const payload = await call<{ success: boolean; data: { movies: any[] } }>(`/movies?${params.toString()}`);
        const list = (payload?.data?.movies || []).map((m: any) => ({
          id: m.id,
          title: m.title,
          slug: m.slug,
          total_episodes: m.total_episodes ?? (m.episodes?.length || 0),
          status: m.status,
          poster_url: m.poster_url,
          release_year: m.release_year,
          country: m.country,
          view_count: m.view_count,
        }));
        setSeries(list);
      } catch (error) {
        console.error('Error fetching series:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchSeries();
  }, [page, pageSize, q, year]);

  const totalPages = Math.ceil(series.length / pageSize);

  const handleEditSeries = (s: Series) => {
    setEditingSeries(s);
    setEditForm({
      title: s.title,
      release_year: s.release_year?.toString() || '',
      country: s.country || '',
      status: s.status || 'published'
    });
  };

  const handleSaveEdit = async () => {
    if (!editingSeries) return;
    
    try {
      const updatePayload: any = {};
      
      // Title là bắt buộc - luôn gửi
      if (editForm.title && editForm.title.trim()) {
        updatePayload.title = editForm.title.trim();
      } else {
        // Nếu title rỗng, giữ nguyên title hiện tại (không gửi field này)
        console.warn('Title is empty, keeping original title');
      }
      
      if (editForm.release_year && editForm.release_year.trim()) {
        const year = parseInt(editForm.release_year);
        if (!isNaN(year) && year > 1900 && year <= new Date().getFullYear() + 1) {
          updatePayload.release_year = year;
        }
      }
      
      if (editForm.country && editForm.country.trim()) {
        updatePayload.country = editForm.country.trim();
      }
      
      if (editForm.status) {
        updatePayload.status = editForm.status;
      }

      // Đảm bảo có ít nhất một field để update
      if (Object.keys(updatePayload).length === 0) {
        alert('Không có thay đổi nào để lưu');
        return;
      }

      console.log('Updating series:', editingSeries.id, 'with payload:', updatePayload);

      const response = await call(`/movies/${editingSeries.id}`, {
        method: 'PUT',
        body: JSON.stringify(updatePayload)
      });
      
      console.log('Update response:', response);
      
      // Kiểm tra response
      if (!response || (response as any).success === false) {
        const errorMessage = (response as any)?.message || 'Không thể cập nhật phim bộ';
        throw new Error(errorMessage);
      }
      
      // Refresh series list
      const params = new URLSearchParams();
      params.set('status', 'published');
      params.set('is_series', 'true');
      params.set('limit', pageSize.toString());
      params.set('offset', ((page - 1) * pageSize).toString());
      if (q.trim()) params.set('search', q.trim());
      if (year.trim()) params.set('year', year.trim());
      
      const payload = await call<{ success: boolean; data: { movies: any[] } }>(`/movies?${params.toString()}`);
      const list = (payload?.data?.movies || []).map((m: any) => ({
        id: m.id,
        title: m.title,
        slug: m.slug,
        total_episodes: m.total_episodes ?? (m.episodes?.length || 0),
        status: m.status,
        poster_url: m.poster_url,
        release_year: m.release_year,
        country: m.country,
        view_count: m.view_count,
      }));
      setSeries(list);
      
      setEditingSeries(null);
    } catch (error: any) {
      console.error('Error updating series:', error);
      
      // Hiển thị thông báo lỗi chi tiết hơn
      let errorMessage = 'Có lỗi xảy ra khi cập nhật phim bộ';
      
      if (error.message) {
        try {
          // Thử parse JSON nếu error.message là JSON string
          const parsed = JSON.parse(error.message);
          if (parsed.message) {
            errorMessage = parsed.message;
          }
        } catch {
          // Nếu không phải JSON, dùng message trực tiếp
          errorMessage = error.message;
        }
      } else if (error.response?.message) {
        errorMessage = error.response.message;
      }
      
      alert(errorMessage);
    }
  };

  const handleDeleteSeries = async () => {
    if (!deletingSeries) return;
    
    try {
      await call(`/movies/${deletingSeries.id}`, {
        method: 'DELETE'
      });
      
      // Remove from local state
      setSeries(series.filter(s => s.id !== deletingSeries.id));
      setDeletingSeries(null);
    } catch (error) {
      console.error('Error deleting series:', error);
      alert('Có lỗi xảy ra khi xóa phim bộ');
    }
  };

  return (
    <div className="w-full px-3 py-4 md:px-4">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-white">Quản lý phim bộ</h1>
          <p className="text-sm text-white/70">Tổng cộng {series.length} phim bộ</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Tìm phim bộ theo tiêu đề"
            className="w-64 rounded-2xl border border-white/15 bg-white/10 px-4 py-2 text-sm text-white placeholder:text-white/60 outline-none focus:ring-2 focus:ring-cyan-400"
          />
          <input
            value={year}
            onChange={(e) => setYear(e.target.value)}
            placeholder="Năm"
            className="w-24 rounded-2xl border border-white/15 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/60 outline-none focus:ring-2 focus:ring-cyan-400"
          />
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/5">
        <div className="overflow-x-auto max-h-[calc(100vh-300px)] overflow-y-auto">
          <table className="w-full">
            <thead className="sticky top-0 z-10 bg-white/5 backdrop-blur-sm">
              <tr className="border-b border-white/10">
                <th className="px-4 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">Phim bộ</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">Năm</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">Tổng tập</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">Quốc gia</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">Trạng thái</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-white/60 uppercase tracking-wider">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-white/70">
                    <div className="flex items-center justify-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-cyan-400"></div>
                      Đang tải...
                    </div>
                  </td>
                </tr>
              ) : series.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-white/70">
                    Không có dữ liệu
                  </td>
                </tr>
              ) : (
                series.map((s) => (
                  <tr key={s.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-8 flex-shrink-0 rounded bg-white/10 flex items-center justify-center">
                          {s.poster_url ? (
                            <img src={getImageUrl(s.poster_url)} alt={s.title} className="h-full w-full rounded object-cover" onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = '/src/assets/default-poster.jpg';
                            }} />
                          ) : (
                            <div className="text-white/40 text-xs">📺</div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate font-medium text-white">{s.title}</div>
                          <div className="truncate text-sm text-white/60">{s.slug}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-white/80">{s.release_year ?? '-'}</td>
                    <td className="px-4 py-3 text-sm text-white/80">{s.total_episodes ?? 0} tập</td>
                    <td className="px-4 py-3 text-sm text-white/80">{s.country ?? '-'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                        s.status === 'published' 
                          ? 'bg-green-500/20 text-green-300 ring-1 ring-green-400/30' 
                          : 'bg-yellow-500/20 text-yellow-300 ring-1 ring-yellow-400/30'
                      }`}>
                        {s.status === 'published' ? 'Đã xuất bản' : 'Bản nháp'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleEditSeries(s)}
                          className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium text-white ring-1 ring-white/20 hover:bg-white/15 transition-colors"
                        >
                          Sửa
                        </button>
                        <button 
                          onClick={() => setDeletingSeries(s)}
                          className="rounded-lg bg-red-500/20 px-3 py-1.5 text-xs font-medium text-red-300 ring-1 ring-red-400/30 hover:bg-red-500/30 transition-colors"
                        >
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

      {!loading && series.length > 0 && (
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

      {/* Edit Modal */}
      {editingSeries && (
        <Modal title="Chỉnh sửa phim bộ" open={!!editingSeries} onClose={() => setEditingSeries(null)} maxWidthClass="max-w-2xl">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white mb-2">Tên phim bộ</label>
              <input
                type="text"
                value={editForm.title}
                onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                className="w-full rounded-lg bg-white/10 px-3 py-2 text-white border border-white/20 focus:ring-2 focus:ring-cyan-400 outline-none"
                placeholder="Nhập tên phim bộ"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">Năm phát hành</label>
                <input
                  type="number"
                  value={editForm.release_year}
                  onChange={(e) => setEditForm({...editForm, release_year: e.target.value})}
                  className="w-full rounded-lg bg-white/10 px-3 py-2 text-white border border-white/20 focus:ring-2 focus:ring-cyan-400 outline-none"
                  placeholder="2024"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-white mb-2">Tổng tập</label>
                <input
                  type="text"
                  value={editingSeries.total_episodes ?? 0}
                  disabled
                  className="w-full rounded-lg bg-white/5 px-3 py-2 text-white/50 border border-white/10 cursor-not-allowed"
                  placeholder="Tự động tính từ số tập"
                />
                <p className="text-xs text-white/50 mt-1">Tổng số tập được tính tự động</p>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-white mb-2">Quốc gia</label>
              <input
                type="text"
                value={editForm.country}
                onChange={(e) => setEditForm({...editForm, country: e.target.value})}
                className="w-full rounded-lg bg-white/10 px-3 py-2 text-white border border-white/20 focus:ring-2 focus:ring-cyan-400 outline-none"
                placeholder="Việt Nam"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-white mb-2">Trạng thái</label>
              <select
                value={editForm.status}
                onChange={(e) => setEditForm({...editForm, status: e.target.value})}
                className="w-full rounded-lg bg-white/10 px-3 py-2 text-white border border-white/20 focus:ring-2 focus:ring-cyan-400 outline-none"
              >
                <option value="published">Đã xuất bản</option>
                <option value="draft">Bản nháp</option>
              </select>
            </div>
            
            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={() => setEditingSeries(null)}
                className="px-4 py-2 rounded-lg bg-white/10 text-white ring-1 ring-white/20 hover:bg-white/15 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-4 py-2 rounded-lg bg-cyan-500 text-white hover:bg-cyan-600 transition-colors"
              >
                Lưu thay đổi
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Modal */}
      {deletingSeries && (
        <Modal title="Xóa phim bộ" open={!!deletingSeries} onClose={() => setDeletingSeries(null)}>
          <div className="space-y-4">
            <p className="text-white/80">
              Bạn có chắc chắn muốn xóa phim bộ <strong className="text-white">{deletingSeries.title}</strong>?
            </p>
            <p className="text-sm text-red-300">
              Hành động này không thể hoàn tác!
            </p>
            
            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={() => setDeletingSeries(null)}
                className="px-4 py-2 rounded-lg bg-white/10 text-white ring-1 ring-white/20 hover:bg-white/15 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleDeleteSeries}
                className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
              >
                Xóa phim bộ
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
