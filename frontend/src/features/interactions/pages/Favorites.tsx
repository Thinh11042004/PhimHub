import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import ErrorBoundary from "../../../shared/components/ErrorBoundary";
import { favoritesApi, FavoriteItem } from "../../../services/favorites";
import PosterCard from "../../../shared/components/PosterCard";

/** =============== Types =============== */
type FavType = "movie" | "series";
type FavItem = FavoriteItem; // Use the API type
import { MovieService } from "../../../services/movies";

/** =============== Small UI pieces =============== */
function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-white/20 bg-white/5 px-2 py-0.5 text-xs">
      {children}
    </span>
  );
}

function FavCard({
  item,
  onRemove,
}: {
  item: FavItem;
  onRemove: (id: string, type: FavType) => void;
}) {
  // Guard against undefined item
  if (!item || !item.id) {
    return null;
  }

  // Convert FavItem to Movie/Series format for PosterCard
  const movieData = {
    id: item.id,
    title: item.title,
    originalTitle: item.originalTitle || item.title, // Use original title if available
    year: item.year,
    poster: item.poster || '/assets/placeholder-poster.jpg',
    genres: item.genres || [],
    duration: item.duration,
    rating: item.rating || 0,
    age: item.age || 'P', // Default age rating
    episodes: item.episodes || 0,
    is_series: item.type === "series",
    slug: item.id, // Use slug from backend
    overview: item.overview,
    provider: item.provider || 'local'
  };

  return (
    <ErrorBoundary fallback={
      <div className="w-[160px] h-[240px] bg-gray-800 rounded-lg flex items-center justify-center">
        <div className="text-center text-white/60">
          <div className="text-xs">Lỗi tải phim</div>
        </div>
      </div>
    }>
      <div className="group relative">
        {/* nút xóa góc phải */}
        <button
          onClick={() => onRemove(item.id, item.type)}
          title="Bỏ yêu thích"
          className="absolute right-2 top-2 z-10 rounded-full bg-red-500/80 hover:bg-red-500 p-1.5 text-white opacity-0 ring-1 ring-white/20 backdrop-blur transition group-hover:opacity-100"
        >
          ✕
        </button>

        <PosterCard 
          movie={item.type === "movie" ? movieData : undefined}
          series={item.type === "series" ? movieData : undefined}
          size="medium"
          showRating={true}
          showAge={true}
          showOverlay={true}
        />
      </div>
    </ErrorBoundary>
  );
}

/** =============== Page =============== */
export default function Favorites() {
  // sau này thay bằng fetch('/api/favorites')
  const [items, setItems] = useState<FavItem[]>([]);
  const [tab, setTab] = useState<"all" | "movie" | "series">("all");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"new" | "title" | "year">("new");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadFavorites = async () => {
      setLoading(true);
      try {
        const favorites = await favoritesApi.getFavorites();
        setItems(favorites);
      } catch (error) {
        console.error('Failed to load favorites:', error);
        setItems([]);
      } finally {
        setLoading(false);
      }
    };
    loadFavorites();
  }, []);

  // lọc + sắp xếp
  const view = useMemo(() => {
    let list = items.slice();
    if (tab !== "all") list = list.filter((x) => x.type === tab);
    if (q.trim()) {
      const k = q.toLowerCase();
      list = list.filter((x) => x.title.toLowerCase().includes(k));
    }
    switch (sort) {
      case "title":
        list.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case "year":
        list.sort((a, b) => (b.year ?? 0) - (a.year ?? 0));
        break;
      default:
        // "new": giữ nguyên thứ tự thêm gần đây (mock)
        break;
    }
    return list;
  }, [items, tab, q, sort]);

  // Hành động xóa 1 item
  const removeOne = async (id: string, type: FavType) => {
    try {
      await favoritesApi.removeFromFavorites(id, type);
      setItems((prev) => prev.filter((x) => !(x.id === id && x.type === type)));
    } catch (error) {
      console.error('Failed to remove favorite:', error);
      alert('Không thể xóa khỏi yêu thích. Vui lòng thử lại.');
    }
  };

  // Xóa hết theo filter hiện tại
  const clearAll = async () => {
    if (!confirm("Xóa tất cả mục đang hiển thị khỏi Yêu thích?")) return;
    
    try {
      // Remove each item individually
      const promises = view.map(item => 
        favoritesApi.removeFromFavorites(item.id, item.type)
      );
      await Promise.all(promises);
      
      setItems((prev) => prev.filter((x) => 
        !view.some(v => v.id === x.id && v.type === x.type)
      ));
    } catch (error) {
      console.error('Failed to clear favorites:', error);
      alert('Không thể xóa tất cả yêu thích. Vui lòng thử lại.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="relative z-10 space-y-8 p-6">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full mb-4">
            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-white mb-3 bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
            Phim Yêu Thích
          </h1>
          <p className="text-white/70 text-lg max-w-md mx-auto">
            Danh sách phim bạn đã thêm vào yêu thích
          </p>
        </div>

        {/* Controls */}
        <div className="rounded-2xl bg-white/5 p-6 ring-1 ring-white/10 backdrop-blur-sm">
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
                  onClick={() => setTab(t.k as any)}
                  className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 ${
                    tab === t.k 
                      ? "bg-primary-500 text-white shadow-lg" 
                      : "text-white/70 hover:text-white hover:bg-white/10"
                  }`}
                >
                  <span>{t.icon}</span>
                  <span>{t.label}</span>
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 ring-1 ring-white/20 focus-within:ring-2 focus-within:ring-primary-500/60 sm:w-80">
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
              className="rounded-xl bg-white/10 px-4 py-2 text-white outline-none ring-1 ring-white/20 focus:ring-2 focus:ring-primary-500/60"
            >
              <option value="new" className="bg-slate-800">Mới thêm</option>
              <option value="title" className="bg-slate-800">Theo tên (A→Z)</option>
              <option value="year" className="bg-slate-800">Năm (mới→cũ)</option>
            </select>

            {/* Clear All */}
            {view.length > 0 && (
              <button
                onClick={clearAll}
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
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mb-4"></div>
              <p className="text-white/70">Đang tải danh sách yêu thích...</p>
            </div>
          </div>
        ) : view.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-6">❤️</div>
            <h2 className="text-2xl font-bold text-white mb-4">Chưa có phim yêu thích</h2>
            <p className="text-white/60 mb-8 max-w-md mx-auto">
              Hãy thêm phim vào danh sách yêu thích để theo dõi và xem lại dễ dàng hơn.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/movies"
                className="rounded-xl bg-primary-500 hover:bg-primary-600 px-6 py-3 font-medium text-white transition-all duration-200 flex items-center gap-2"
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
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3 gap-8 md:gap-10">
            {view.map((item) => (
              <FavCard key={`${item.type}-${item.id}`} item={item} onRemove={removeOne} />
            ))}
          </div>
        )}

        {/* Debug info for development */}
        {import.meta.env.DEV && items.length > 0 && (
          <div className="text-xs text-white/40 mt-4 p-2 bg-white/5 rounded">
            Debug: {items.length} items loaded, {view.length} items displayed
          </div>
        )}

        {/* Stats */}
        {!loading && view.length > 0 && (
          <div className="text-center text-white/60">
            Hiển thị {view.length} phim yêu thích
          </div>
        )}
      </div>
    </div>
  );
}
