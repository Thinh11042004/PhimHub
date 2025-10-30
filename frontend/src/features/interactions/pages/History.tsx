import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { watchHistoryService, WatchHistoryItem } from "../../../services/watchHistory";
import { useAuth } from "../../../store/auth";

/** ===== Types ===== */
type ContentType = "movie" | "series";
type HistoryItem = {
  id: number;             // content id (movie/series)
  type: ContentType;
  title: string;
  poster: string;
  duration: number;       // tổng thời lượng (phút) hoặc tập ~ phút giả lập
  progressSec: number;    // giây đã xem
  lastWatchedAt: string;  // ISO
  device?: string;
  slug?: string;          // for navigation
  // Episode information
  episode_number?: number;
  episode_title?: string;
  episode_movie_id?: number;
};

/** ===== Helper function to convert API data to HistoryItem ===== */
const convertToHistoryItem = (item: WatchHistoryItem): HistoryItem => {
  // Debug logging for API data
  console.log('🎬 convertToHistoryItem debug:', {
    title: item.title,
    is_series: item.is_series,
    episode_number: item.episode_number,
    episode_number_type: typeof item.episode_number,
    episode_title: item.episode_title,
    episode_movie_id: item.episode_movie_id,
    slug: item.slug,
    content_id: item.content_id,
    progress: item.progress
  });
  
  // Calculate progress in seconds based on percentage and estimated duration
  // Assuming average episode duration of 45 minutes (2700 seconds)
  const estimatedDuration = 45 * 60; // 45 minutes in seconds
  const progressSec = Math.round(((item.progress || 0) / 100) * estimatedDuration);
  
  return {
    id: item.content_id,
    type: item.is_series ? "series" : "movie",
    title: item.title || "Không có tiêu đề",
    poster: item.poster_url || "/assets/placeholder-movie.svg",
    duration: 45, // 45 minutes default duration
    progressSec: progressSec,
    lastWatchedAt: item.last_watched_at,
    device: item.device || "Web",
    slug: item.slug,
    // Episode information
    episode_number: item.episode_number,
    episode_title: item.episode_title,
    episode_movie_id: item.episode_movie_id
  };
};

/** ===== Helpers ===== */
const fmtHM = (min: number) => {
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  return h ? `${h}h ${m}m` : `${m}m`;
};
const fmtProgress = (sec: number, totalMin: number) => {
  const t = totalMin * 60;
  const p = Math.max(0, Math.min(1, sec / t));
  return Math.round(p * 100);
};
const timeAgo = (iso: string) => {
  const diff = Math.max(0, Date.now() - new Date(iso).getTime());
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m} phút trước`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} giờ trước`;
  const d = Math.floor(h / 24);
  return `${d} ngày trước`;
};

function HistoryCard({
  it,
  onRemove,
  onClearProgress,
}: {
  it: HistoryItem;
  onRemove: () => void;
  onClearProgress: () => void;
}) {
  const progressPct = fmtProgress(it.progressSec, it.duration);
  
  // Logic cho nút "Tiếp tục xem" - chuyển tới đúng tập và thời gian đã xem
  const continueWatchingHref =
    it.type === "movie"
      ? `/watch/movie/${it.slug || it.id}?t=${it.progressSec}&provider=local`
      : it.episode_number 
        ? `/watch/series/${it.slug || it.id}?s=1&e=${it.episode_number}&ep=tap-${it.episode_number}&t=${it.progressSec}&provider=local`
        : `/watch/series/${it.slug || it.id}?s=1&e=1&ep=tap-1&t=${it.progressSec}&provider=local`;
  
  // Debug logging for episode number and continue watching URL
  console.log('🎬 HistoryCard debug:', {
    title: it.title,
    type: it.type,
    episode_number: it.episode_number,
    episode_number_type: typeof it.episode_number,
    episode_number_truthy: !!it.episode_number,
    slug: it.slug,
    id: it.id,
    progressSec: it.progressSec,
    continueWatchingHref: continueWatchingHref
  });

  const detailHref = it.type === "movie" ? `/movies/${it.slug || it.id}` : `/series/${it.slug || it.id}`;

  return (
    <div className="group relative overflow-hidden rounded-xl bg-white/5 ring-1 ring-white/10 hover:ring-white/20 w-[140px] md:w-[160px]">
      {/* remove */}
      <button
        onClick={onRemove}
        title="Xóa khỏi lịch sử"
        className="absolute right-2 top-2 z-10 rounded-full bg-black/50 p-1.5 text-white/90 opacity-0 ring-1 ring-white/20 backdrop-blur transition group-hover:opacity-100"
      >
        ✕
      </button>

      <Link to={detailHref} className="block">
        <img
          src={it.poster}
          alt={it.title}
          className="aspect-[2/3] w-full object-cover"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = "/assets/placeholder-movie.svg";
          }}
        />
      </Link>

      {/* progress bar */}
      <div className="absolute inset-x-0 bottom-0 h-1 bg-white/10">
        <div className="h-full bg-cyan-400" style={{ width: `${progressPct}%` }} />
      </div>

      <div className="space-y-1 p-2">
        <Link to={detailHref} className="line-clamp-2 text-sm font-medium">
          {it.title}
        </Link>
        <div className="flex items-center gap-2 text-xs text-white/70">
          <span>{fmtHM(it.duration)}</span>
          <span>·</span>
          <span>{progressPct}%</span>
          <span>·</span>
          <span>{timeAgo(it.lastWatchedAt)}</span>
        </div>
      </div>

      {/* actions hover */}
      <div className="absolute inset-x-2 bottom-8 flex items-center gap-2 rounded-lg bg-black/30 p-1.5 opacity-0 backdrop-blur transition group-hover:opacity-100">
        <Link
          to={continueWatchingHref}
          className="flex-1 rounded-md bg-blue-500 px-3 py-1.5 text-center text-sm font-medium text-white hover:bg-blue-400"
        >
          ▶ Tiếp tục xem
        </Link>
        <button
          onClick={onClearProgress}
          className="rounded-md bg-white/10 px-3 py-1.5 text-sm hover:bg-white/15"
          title="Đặt lại tiến độ"
        >
          Đặt lại
        </button>
        <button
          onClick={onRemove}
          className="rounded-md bg-red-500/80 px-3 py-1.5 text-sm hover:bg-red-500 text-white"
          title="Xóa khỏi lịch sử"
        >
          🗑️
        </button>
      </div>
    </div>
  );
}

/** ===== Page ===== */
export default function History() {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [q, setQ] = useState("");
  const [type, setType] = useState<"all" | "movie" | "series">("all");
  const [sort, setSort] = useState<"recent" | "title" | "progress">("recent");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchHistory = async () => {
      console.log('🎬 History - useEffect triggered:', { user, hasUser: !!user, userId: user?.id });
      
      if (!user) {
        console.log('🎬 History - No user, setting empty items');
        setLoading(false);
        setItems([]);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        const userId = parseInt(user.id);
        console.log('🎬 History - Fetching watch history for userId:', userId);
        
        const historyData = await watchHistoryService.getHistory(userId);
        console.log('🎬 History - Raw history data:', historyData);
        
        const convertedItems = historyData.map(convertToHistoryItem);
        console.log('🎬 History - Converted items:', convertedItems);
        
        // Chỉ hiển thị những phim đã xem thực sự (progress > 0)
        const watchedItems = convertedItems.filter(item => item.progressSec > 0);
        console.log('🎬 History - Filtered watched items (progress > 0):', watchedItems);
        
        setItems(watchedItems);
      } catch (err) {
        console.error('History - Failed to fetch watch history:', err);
        setError('Không thể tải lịch sử xem phim');
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [user]);

  const view = useMemo(() => {
    let arr = items.slice();
    if (type !== "all") arr = arr.filter((x) => x.type === type);
    if (q.trim()) {
      const k = q.toLowerCase();
      arr = arr.filter((x) => x.title.toLowerCase().includes(k));
    }
    switch (sort) {
      case "title":
        arr.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case "progress":
        arr.sort(
          (a, b) =>
            fmtProgress(b.progressSec, b.duration) -
            fmtProgress(a.progressSec, a.duration),
        );
        break;
      default:
        arr.sort(
          (a, b) =>
            new Date(b.lastWatchedAt).getTime() -
            new Date(a.lastWatchedAt).getTime(),
        );
    }
    return arr;
  }, [items, q, type, sort]);

  const removeOne = async (id: number) => {
    if (!user) return;
    
    try {
      const userId = parseInt(user.id);
      await watchHistoryService.removeFromHistory(userId, id);
      setItems((prev) => prev.filter((x) => x.id !== id));
    } catch (error) {
      console.error('Failed to remove from history:', error);
      // Still update UI optimistically
      setItems((prev) => prev.filter((x) => x.id !== id));
    }
  };

  const clearProgress = async (id: number) => {
    if (!user) return;
    
    try {
      const userId = parseInt(user.id);
      await watchHistoryService.addToHistory({
        userId,
        contentId: id,
        progress: 0
      });
      setItems((prev) =>
        prev.map((x) => (x.id === id ? { ...x, progressSec: 0 } : x)),
      );
    } catch (error) {
      console.error('Failed to clear progress:', error);
      // Still update UI optimistically
      setItems((prev) =>
        prev.map((x) => (x.id === id ? { ...x, progressSec: 0 } : x)),
      );
    }
  };

  const clearShown = async () => {
    if (!user) return;
    if (!confirm("Xóa tất cả mục đang hiển thị khỏi lịch sử?")) return;
    
    try {
      const userId = parseInt(user.id);
      const ids = new Set(view.map((v) => v.id));
      
      // Remove each item from history
      await Promise.all(
        Array.from(ids).map(id => 
          watchHistoryService.removeFromHistory(userId, id)
        )
      );
      
      setItems((prev) => prev.filter((x) => !ids.has(x.id)));
    } catch (error) {
      console.error('Failed to clear shown items:', error);
      // Still update UI optimistically
      const ids = new Set(view.map((v) => v.id));
      setItems((prev) => prev.filter((x) => !ids.has(x.id)));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 rounded-3xl">
      <div className="relative z-10 space-y-8 p-6">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-full mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-white mb-3 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            Lịch Sử Xem
          </h1>
          <p className="text-white/70 text-lg max-w-md mx-auto">
            Danh sách phim bạn đã xem và tiến độ xem
          </p>
          {/* Debug info */}
          <div className="mt-4 text-sm text-white/60 bg-white/5 rounded-2xl p-3 max-w-md mx-auto">
            <div>User: {user ? `${user.username} (${user.id})` : 'Not logged in'}</div>
            <div>Token: {localStorage.getItem('phimhub:token') ? 'Present' : 'Missing'}</div>
            <div>Items: {items.length}</div>
          </div>
        </div>

        {/* Controls */}
        <div className="rounded-3xl bg-white/5 p-6 ring-1 ring-white/10 backdrop-blur-sm">
          <div className="flex flex-wrap items-center gap-4">
            <h2 className="text-xl font-semibold text-white">Bộ lọc & Tìm kiếm</h2>

            {/* Tabs */}
            <div className="flex rounded-xl bg-white/10 p-1 ring-1 ring-white/20">
              {[
                { k: "all", label: "Tất cả", icon: "📚" },
                { k: "movie", label: "Phim lẻ", icon: "🎬" },
                { k: "series", label: "Phim bộ", icon: "📺" },
              ].map((t) => (
                <button
                  key={t.k}
                  onClick={() => setType(t.k as any)}
                  className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 ${
                    type === t.k 
                      ? "bg-blue-500 text-white shadow-lg" 
                      : "text-white/70 hover:text-white hover:bg-white/10"
                  }`}
                >
                  <span>{t.icon}</span>
                  <span>{t.label}</span>
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 ring-1 ring-white/20 focus-within:ring-2 focus-within:ring-blue-500/60 sm:w-80">
              <svg className="w-5 h-5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Tìm theo tên phim..."
                className="w-full bg-transparent text-white outline-none placeholder:text-white/60"
              />
            </div>

            {/* Sort */}
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as any)}
              className="rounded-xl bg-white/10 px-4 py-2 text-white outline-none ring-1 ring-white/20 focus:ring-2 focus:ring-blue-500/60"
            >
              <option value="recent" className="bg-slate-800">Gần đây</option>
              <option value="title" className="bg-slate-800">Theo tên (A→Z)</option>
              <option value="progress" className="bg-slate-800">Tiến độ (cao→thấp)</option>
            </select>

            {/* Clear All */}
            {view.length > 0 && (
              <button
                onClick={clearShown}
                className="rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 hover:text-red-200 px-4 py-2 transition-all duration-200 flex items-center gap-2"
                title="Xóa tất cả mục đang hiển thị"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <span>Xóa tất cả</span>
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
              <p className="text-white/70">Đang tải lịch sử xem...</p>
            </div>
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-6">⚠️</div>
            <h2 className="text-2xl font-bold text-white mb-4">Lỗi tải dữ liệu</h2>
            <p className="text-white/60 mb-8 max-w-md mx-auto">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="rounded-xl bg-blue-500 hover:bg-blue-600 px-6 py-3 font-medium text-white transition-all duration-200 flex items-center gap-2 mx-auto"
            >
              <span>🔄</span>
              <span>Thử lại</span>
            </button>
          </div>
        ) : view.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-6">⏰</div>
            <h2 className="text-2xl font-bold text-white mb-4">Chưa có lịch sử xem</h2>
            <p className="text-white/60 mb-8 max-w-md mx-auto">
              Hãy bắt đầu xem phim để tạo lịch sử xem và theo dõi tiến độ của bạn.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/movies"
                className="rounded-xl bg-blue-500 hover:bg-blue-600 px-6 py-3 font-medium text-white transition-all duration-200 flex items-center gap-2"
              >
                <span>🎬</span>
                <span>Khám phá phim lẻ</span>
              </Link>
              <Link
                to="/series"
                className="rounded-xl bg-white/10 hover:bg-white/20 px-6 py-3 font-medium text-white transition-all duration-200 flex items-center gap-2"
              >
                <span>📺</span>
                <span>Khám phá phim bộ</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
            {view.map((it) => (
              <HistoryCard
                key={it.id}
                it={it}
                onRemove={() => removeOne(it.id)}
                onClearProgress={() => clearProgress(it.id)}
              />
            ))}
          </div>
        )}

        {/* Stats */}
        {!loading && view.length > 0 && (
          <div className="text-center text-white/60">
            Hiển thị {view.length} phim trong lịch sử xem
          </div>
        )}
      </div>
    </div>
  );
}
