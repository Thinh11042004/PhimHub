import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { customListsService, CustomList, ListItem } from "../../../services/customLists";
import { watchHistoryService, WatchHistoryItem } from "../../../services/watchHistory";
import { useAuth } from "../../../store/auth";
import { CreateListDialog } from "../../../shared/components/CreateListDialog";

/** =============== Types =============== */
type ItemType = "movie" | "series";
type UserList = { id: string; name: string; items: ListItem[] };

/** =============== Mock =============== */
// Removed mock data - now using real API

/** =============== Small UI =============== */
function Pill({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <span className={`rounded-full border border-white/20 bg-white/5 px-2 py-0.5 text-xs ${className}`}>{children}</span>;
}

function ViewToggle({ 
  viewMode, 
  onToggle 
}: { 
  viewMode: "grid" | "list"; 
  onToggle: (mode: "grid" | "list") => void; 
}) {
  return (
    <div className="flex items-center bg-white/10 rounded-xl p-1">
      <button
        onClick={() => onToggle("grid")}
        className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200 ${
          viewMode === "grid" 
            ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg" 
            : "text-white/70 hover:text-white hover:bg-white/10"
        }`}
        title="Chế độ lưới"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M3 3h7v7H3V3zm0 11h7v7H3v-7zm11-11h7v7h-7V3zm0 11h7v7h-7v-7z"/>
        </svg>
      </button>
      <button
        onClick={() => onToggle("list")}
        className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200 ${
          viewMode === "list" 
            ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg" 
            : "text-white/70 hover:text-white hover:bg-white/10"
        }`}
        title="Chế độ danh sách"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M3 6h18v2H3V6zm0 5h18v2H3v-2zm0 5h18v2H3v-2z"/>
        </svg>
      </button>
    </div>
  );
}

function Card({
  it,
  onRemove,
  onMove,
  lists,
  getEpisodeFromHistory,
}: {
  it: ListItem;
  onRemove: () => void;
  onMove: (targetListId: string) => void;
  lists: CustomList[];
  getEpisodeFromHistory: (slug: string) => number | null;
}) {
  const to = it.isSeries ? `/series/${it.slug}` : `/movies/${it.slug}`;
  
  // Get episode from watch history for series
  const episodeNumber = it.isSeries ? getEpisodeFromHistory(it.slug) : null;
  const watchUrl = it.isSeries 
    ? (episodeNumber 
        ? `/watch/series/${it.slug}?s=1&e=${episodeNumber}&ep=tap-${episodeNumber}`
        : `/watch/series/${it.slug}?s=1&e=1&ep=tap-1`)
    : `/watch/movie/${it.slug}`;
  
  return (
    <div className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 ring-1 ring-white/10 hover:ring-white/20 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-blue-500/20 w-full">
      {/* Remove button */}
      <button
        onClick={onRemove}
        className="absolute right-3 top-3 z-10 rounded-full bg-red-500/90 hover:bg-red-500 p-2 text-white opacity-0 ring-1 ring-white/20 backdrop-blur transition-all duration-200 group-hover:opacity-100 hover:scale-110"
        title="Xóa khỏi danh sách"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <Link to={to} className="block">
        <div className="relative overflow-hidden">
          <img
            src={it.poster || "https://picsum.photos/seed/fallback-list/480/720"}
            alt={it.title}
            className="aspect-[2/3] w-full object-cover transition-all duration-300 group-hover:scale-105"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = "https://picsum.photos/seed/fallback-list/480/720";
            }}
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          
          {/* Play button overlay */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
            <div className="rounded-full bg-white/20 backdrop-blur-sm p-1.5 hover:bg-white/30 transition-all duration-200 hover:scale-110">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
            </div>
          </div>
        </div>
      </Link>

      {/* Content */}
      <div className="p-2.5 space-y-1.5">
        <Link to={to} className="block">
          <h3 className="line-clamp-2 text-xs font-semibold text-white group-hover:text-blue-400 transition-colors duration-200 leading-tight">
            {it.title}
          </h3>
        </Link>
        
        <div className="flex items-center gap-1 text-xs text-white/80">
          {it.year && (
            <span className="px-1 py-0.5 bg-white/10 rounded-full text-xs font-medium text-white/90">
              {it.year}
            </span>
          )}
          {it.rating && (
            <span className="flex items-center gap-0.5 px-1 py-0.5 bg-yellow-500/20 rounded-full text-xs font-medium text-yellow-300 border border-yellow-500/30">
              <svg className="w-2 h-2 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              {it.rating.toFixed(1)}
            </span>
          )}
        </div>
        
        <div className="flex items-center justify-between">
          <span className="px-1.5 py-0.5 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full text-xs font-medium text-blue-300 border border-blue-500/30">
            {it.isSeries ? "Phim bộ" : "Phim lẻ"}
          </span>
          
          {/* Quick actions */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
            <Link
              to={to}
              className="p-1 rounded-full bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-all duration-200 hover:scale-110"
              title="Xem chi tiết"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </Link>
            
            <Link
              to={watchUrl}
              className="p-1 rounded-full bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-all duration-200 hover:scale-110"
              title="Xem ngay"
            >
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
            </Link>
          </div>
        </div>
      </div>

      {/* Move to another list */}
      <div className="absolute inset-x-4 bottom-4 flex items-center gap-2 rounded-xl bg-black/90 p-3 opacity-0 backdrop-blur transition-all duration-200 group-hover:opacity-100 border border-white/10">
        <span className="text-xs text-white/90 whitespace-nowrap font-medium">Chuyển:</span>
        <select
          className="h-7 flex-1 rounded-lg bg-white/95 px-3 text-xs text-slate-800 outline-none border border-white/20 focus:ring-2 focus:ring-blue-500/50"
          onChange={(e) => e.currentTarget.value && onMove(e.currentTarget.value)}
          defaultValue=""
        >
          <option value="" disabled>
            Chọn danh sách…
          </option>
          {lists?.map((l) => (
            <option key={l.id} value={l.id.toString()}>
              {l.name}
            </option>
          )) || []}
        </select>
      </div>
    </div>
  );
}

function ListCard({
  it,
  onRemove,
  onMove,
  lists,
}: {
  it: ListItem;
  onRemove: () => void;
  onMove: (targetListId: string) => void;
  lists: CustomList[];
}) {
  const to = it.isSeries ? `/series/${it.slug}` : `/movies/${it.slug}`;
  
  return (
    <div className="group relative flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 ring-1 ring-white/10 hover:ring-white/20 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10">
      {/* Remove button */}
      <button
        onClick={onRemove}
        className="absolute right-3 top-3 z-10 rounded-full bg-red-500/90 hover:bg-red-500 p-1.5 text-white opacity-0 ring-1 ring-white/20 backdrop-blur transition-all duration-200 group-hover:opacity-100 hover:scale-110"
        title="Xóa khỏi danh sách"
      >
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Poster */}
      <Link to={to} className="flex-shrink-0">
        <div className="relative overflow-hidden rounded-lg">
          <img
            src={it.poster || "https://picsum.photos/seed/fallback-list/480/720"}
            alt={it.title}
            className="w-16 h-24 object-cover transition-all duration-300 group-hover:scale-105"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = "https://picsum.photos/seed/fallback-list/480/720";
            }}
          />
        </div>
      </Link>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <Link to={to} className="block">
          <h3 className="text-sm font-semibold text-white group-hover:text-blue-400 transition-colors duration-200 leading-tight truncate">
            {it.title}
          </h3>
        </Link>
        
        <div className="flex items-center gap-2 mt-1 text-xs text-white/80">
          {it.year && (
            <span className="px-1.5 py-0.5 bg-white/10 rounded-full text-xs font-medium text-white/90">
              {it.year}
            </span>
          )}
          {it.rating && (
            <span className="flex items-center gap-0.5 px-1.5 py-0.5 bg-yellow-500/20 rounded-full text-xs font-medium text-yellow-300 border border-yellow-500/30">
              <svg className="w-2 h-2 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              {it.rating.toFixed(1)}
            </span>
          )}
          <span className="px-1.5 py-0.5 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full text-xs font-medium text-blue-300 border border-blue-500/30">
            {it.isSeries ? "Phim bộ" : "Phim lẻ"}
          </span>
        </div>
      </div>

      {/* Quick actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
        <Link
          to={to}
          className="p-1.5 rounded-full bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-all duration-200 hover:scale-110"
          title="Xem chi tiết"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        </Link>
        
        <Link
          to={it.isSeries ? `/watch/series/${it.slug}` : `/watch/movie/${it.slug}`}
          className="p-1.5 rounded-full bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-all duration-200 hover:scale-110"
          title="Xem ngay"
        >
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z"/>
          </svg>
        </Link>
      </div>
    </div>
  );
}

/** =============== Page =============== */
export default function Lists() {
  const { user } = useAuth();
  const [lists, setLists] = useState<CustomList[]>([]);
  const [active, setActive] = useState<number | null>(null);
  const [activeListItems, setActiveListItems] = useState<ListItem[]>([]);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "movie" | "series">("all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [watchHistory, setWatchHistory] = useState<WatchHistoryItem[]>([]);

  // Load lists and watch history
  useEffect(() => {
    loadLists();
    if (user) {
      loadWatchHistory();
    }
  }, [user]);

  const loadWatchHistory = async () => {
    if (!user) return;
    try {
      const history = await watchHistoryService.getHistory(parseInt(user.id));
      setWatchHistory(history || []);
    } catch (error) {
      console.error('Error loading watch history:', error);
      setWatchHistory([]);
    }
  };

  // Helper function to get episode from watch history
  const getEpisodeFromHistory = (slug: string): number | null => {
    const historyItem = watchHistory.find(item => item.slug === slug && item.is_series);
    return historyItem?.episode_number || null;
  };

  const loadLists = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const userLists = await customListsService.getUserLists();
      setLists(userLists || []);
      if (userLists && Array.isArray(userLists) && userLists.length > 0 && !active) {
        setActive(userLists[0].id);
      }
    } catch (error: any) {
      console.error('Error loading lists:', error);
      setError(error.message || 'Không thể tải danh sách');
      setLists([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Load active list items
  useEffect(() => {
    if (active) {
      loadActiveListItems();
    }
  }, [active]);

  const loadActiveListItems = async () => {
    if (!active) return;
    try {
      const result = await customListsService.getList(active);
      setActiveListItems(result.items);
    } catch (error: any) {
      console.error('Error loading list items:', error);
      setActiveListItems([]);
    }
  };

  const activeList = useMemo(() => lists?.find((l) => l.id === active), [lists, active]);

  const viewItems = useMemo(() => {
    if (!activeListItems || !Array.isArray(activeListItems) || !activeListItems.length) return [];
    let arr = activeListItems.slice();
    if (filter !== "all") arr = arr.filter((x) => x.isSeries === (filter === "series"));
    if (q.trim()) {
      const k = q.toLowerCase();
      arr = arr.filter((x) => x.title && x.title.toLowerCase().includes(k));
    }
    return arr;
  }, [activeListItems, q, filter]);

  // actions
  const createList = () => {
    setShowCreateDialog(true);
  };

  const handleCreateListSuccess = () => {
    setShowCreateDialog(false);
    loadLists();
  };

  const renameList = async (id: number) => {
    const cur = lists?.find((l) => l.id === id);
    if (!cur) return;
    const name = prompt("Đổi tên danh sách:", cur.name);
    if (!name || name.trim() === cur.name) return;
    
    try {
      await customListsService.updateList(id, { name: name.trim() });
      await loadLists();
    } catch (error: any) {
      alert(error.message || 'Không thể đổi tên danh sách');
    }
  };

  const deleteList = async (id: number) => {
    const cur = lists?.find((l) => l.id === id);
    if (!cur) return;
    if (!confirm(`Xóa "${cur.name}"? (Không xóa nội dung trong thư viện)`)) return;
    
    try {
      await customListsService.deleteList(id);
      const next = lists.filter((l) => l.id !== id);
      setLists(next);
      if (active === id) setActive(next[0]?.id || null);
    } catch (error: any) {
      alert(error.message || 'Không thể xóa danh sách');
    }
  };

  const removeItem = async (item: ListItem) => {
    if (!active) return;
    
    try {
      await customListsService.removeMovieFromList(active, {
        movieId: item.slug,
        movieType: item.isSeries ? 'series' : 'movie'
      });
      await loadActiveListItems();
    } catch (error: any) {
      alert(error.message || 'Không thể xóa phim khỏi danh sách');
    }
  };

  const moveItem = async (item: ListItem, targetListId: string) => {
    if (Number(targetListId) === active || !active) return;
    
    try {
      // Add to target list
      await customListsService.addMovieToList(Number(targetListId), {
        movieId: item.slug,
        movieType: item.isSeries ? 'series' : 'movie'
      });
      
      // Remove from current list
      await customListsService.removeMovieFromList(active, {
        movieId: item.slug,
        movieType: item.isSeries ? 'series' : 'movie'
      });
      
      await loadActiveListItems();
    } catch (error: any) {
      alert(error.message || 'Không thể di chuyển phim');
    }
  };

  const clearShown = async () => {
    if (!active || !viewItems || !viewItems.length) return;
    if (!confirm("Xóa tất cả mục đang hiển thị khỏi danh sách này?")) return;
    
    try {
      // Remove all visible items
      for (const item of viewItems) {
        await customListsService.removeMovieFromList(active, {
          movieId: item.slug,
          movieType: item.isSeries ? 'series' : 'movie'
        });
      }
      await loadActiveListItems();
    } catch (error: any) {
      alert(error.message || 'Không thể xóa các mục đã chọn');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 rounded-3xl">
      <div className="w-full px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Danh sách tùy chỉnh</h1>
          <p className="text-white/70">Tạo và quản lý các danh sách phim theo sở thích của bạn</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[300px,1fr] gap-8">
          {/* Sidebar: lists */}
          <aside className="space-y-4">
            <div className="bg-white/5 backdrop-blur-sm rounded-3xl p-6 ring-1 ring-white/10">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">Danh sách của tôi</h2>
                <button 
                  onClick={createList} 
                  className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-2xl text-sm font-medium hover:from-blue-600 hover:to-purple-700 transition-all duration-200"
                >
                  + Tạo mới
                </button>
              </div>

              <div className="space-y-2">
                {lists?.map((l) => (
                  <div
                    key={l.id}
                    className={`flex items-center justify-between rounded-xl px-4 py-3 transition-all duration-200 ${
                      active === l.id 
                        ? "bg-white/20 ring-1 ring-white/30 shadow-lg" 
                        : "hover:bg-white/10 hover:ring-1 hover:ring-white/20"
                    }`}
                  >
                    <button onClick={() => setActive(l.id)} className="text-left flex-1">
                      <div className="font-medium text-white">{l.name}</div>
                      <div className="text-xs text-white/70">{l.itemCount} phim</div>
                    </button>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => renameList(l.id)}
                        className="rounded-xl bg-white/10 px-3 py-1.5 text-xs text-white/80 hover:bg-white/20 hover:text-white transition-colors"
                        title="Đổi tên"
                      >
                        Sửa
                      </button>
                      <button
                        onClick={() => deleteList(l.id)}
                        className="rounded-xl bg-red-500/20 px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/30 hover:text-red-300 transition-colors"
                        title="Xóa danh sách"
                      >
                        Xóa
                      </button>
                    </div>
                  </div>
                ))}
                {(!lists || lists.length === 0) && (
                  <div className="py-8 text-center">
                    <div className="text-white/60 mb-2">Chưa có danh sách nào</div>
                    <div className="text-white/40 text-sm">Tạo danh sách đầu tiên của bạn</div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-sm rounded-3xl p-4 ring-1 ring-white/10">
              <div className="mb-3 text-sm font-semibold text-white">Bộ lọc</div>
              <div className="flex gap-2">
                {(["all", "movie", "series"] as const).map((k) => (
                  <button
                    key={k}
                    onClick={() => setFilter(k)}
                    className={`rounded-2xl px-4 py-2 text-sm font-medium transition-all duration-200 ${
                      filter === k 
                        ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg" 
                        : "bg-white/10 text-white/70 hover:bg-white/20 hover:text-white"
                    }`}
                  >
                    {k === "all" ? "Tất cả" : k === "movie" ? "Phim lẻ" : "Phim bộ"}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* Main */}
          <section>
            {/* Toolbar */}
            <div className="bg-white/5 backdrop-blur-sm rounded-3xl p-6 ring-1 ring-white/10 mb-6">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-white mb-1">
                    {activeList?.name || "Chọn danh sách"}
                  </h2>
                  {activeList && (
                    <div className="flex items-center gap-4 text-white/70">
                      <span>{activeList.itemCount || 0} phim</span>
                      <span>•</span>
                      <span>{viewItems?.length || 0} đang hiển thị</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-4">
                  <div className="relative">
                    <input
                      value={q}
                      onChange={(e) => setQ(e.target.value)}
                      placeholder="Tìm kiếm phim..."
                      className="bg-white/10 border border-white/20 rounded-2xl px-4 py-2.5 pl-10 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent w-64"
                    />
                    <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>

                  <ViewToggle viewMode={viewMode} onToggle={setViewMode} />

                  <button
                    onClick={clearShown}
                    className="bg-red-500/20 text-red-400 px-4 py-2.5 rounded-2xl hover:bg-red-500/30 hover:text-red-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!activeList || !viewItems || viewItems.length === 0}
          >
            Xóa hiển thị
          </button>
                </div>
              </div>
            </div>

            {/* Grid */}
            {!activeList ? (
              <div className="text-center py-16">
                <div className="mb-6">
                  <svg className="w-16 h-16 text-white/40 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <h3 className="text-2xl font-semibold text-white mb-3">Chọn danh sách</h3>
                <p className="text-white/70 mb-8 max-w-md mx-auto">Chọn một danh sách từ sidebar hoặc tạo danh sách mới để bắt đầu.</p>
                <button
                  onClick={createList}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-3 rounded-2xl font-medium hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  Tạo danh sách đầu tiên
                </button>
              </div>
            ) : (!viewItems || viewItems.length === 0) ? (
              <div className="text-center py-16">
                <div className="mb-6">
                  <svg className="w-16 h-16 text-white/40 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <h3 className="text-2xl font-semibold text-white mb-3">Danh sách trống</h3>
                <p className="text-white/70 mb-8 max-w-md mx-auto">Danh sách "{activeList.name}" chưa có phim nào. Hãy thêm phim từ trang chi tiết phim.</p>
                <button
                  onClick={() => window.location.href = '/'}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-3 rounded-2xl font-medium hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  Khám phá phim
                </button>
              </div>
            ) : viewMode === "grid" ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {viewItems?.map((it) => (
                  <Card
                    key={it.id}
                    it={it}
                    lists={lists.filter((l) => l.id !== active)}
                    onRemove={() => removeItem(it)}
                    onMove={(to) => moveItem(it, to)}
                    getEpisodeFromHistory={getEpisodeFromHistory}
                  />
                ))}
              </div>
            ) : (
                <div className="space-y-3">
                {viewItems?.map((it) => (
                  <ListCard
                    key={it.id}
                    it={it}
                    lists={lists.filter((l) => l.id !== active)}
                    onRemove={() => removeItem(it)}
                    onMove={(to) => moveItem(it, to)}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Create List Dialog */}
      <CreateListDialog
        isOpen={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onSuccess={handleCreateListSuccess}
      />
    </div>
  );
}
