import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MovieService } from "../../../services/movies";
import { watchHistoryService, WatchHistoryItem } from "../../../services/watchHistory";
import { useAuth } from "../../../store/auth";
import { getGenreDisplayName, getGenreDisplayNameFromObject } from "../../../utils/genreMapper";
import PosterCard from "../../../shared/components/PosterCard";
import { AddToListDialog } from "../../../shared/components/AddToListDialog";
import LoginRequiredModal from "../../../shared/components/LoginRequiredModal";
import { useLoginRequired } from "../../../shared/hooks/useLoginRequired";

/* =======================
   Types
======================= */
type Banner = { 
  id: number | string; 
  title: string; 
  desc: string; 
  tags: string[]; 
  image: string;
  rating?: number;
  ageRating?: string;
  year?: number;
  duration?: number;
  quality?: string;
  isSeries?: boolean;
  totalEpisodes?: number;
};
type Item = { 
  id: string; 
  title: string; 
  sub?: string; 
  img: string; 
  genres?: string[];
  year?: number;
  age?: string;
  rating?: number;
  duration?: number;
  isSeries?: boolean;
};

/* =======================
   Small cards
======================= */
function HomePosterCard({ it, progress }: { it: Item; progress?: number }) {
  // Convert Item to Movie format for shared PosterCard
  const movieData = {
    id: it.id,
    title: it.title,
    year: it.year,
    poster: it.img,
    age: it.age,
    duration: it.duration,
    genres: it.genres || [],
    provider: "local",
    rating: it.rating,
    overview: undefined // Item doesn't have overview
  };

  return (
    <PosterCard
      movie={movieData}
      size="medium"
      showOverlay={true}
      showGenres={true}
      showRating={true}
      showAge={true}
      showDuration={true}
      progress={progress}
    />
  );
}


function WideCard({ it, cta = "▶ Xem" }: { it: Item; cta?: string }) {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);
  const [movieDetail, setMovieDetail] = useState<any>(null);
  const [isFavorited, setIsFavorited] = useState(false);

  // Xác định provider dựa trên nguồn dữ liệu
  const provider = "local";

  // Check if item is in favorites
  useEffect(() => {
    const checkFavoriteStatus = async () => {
      const token = localStorage.getItem('phimhub:token');
      if (token) {
        // Check API for authenticated users
        try {
          const { InteractionsApi } = await import('../../../services/movies/interactions');
          const response = await InteractionsApi.checkFavorite(it.id, it.isSeries ? 'series' : 'movie');
          setIsFavorited(response.isFavorited);
        } catch (error) {
          console.error('Error checking favorite status:', error);
          // Fallback to localStorage
          const favoritesData = JSON.parse(localStorage.getItem('phimhub:favorites') || '[]');
          const isInFavorites = favoritesData.some((item: any) => (item.id || item) === it.id);
          setIsFavorited(isInFavorites);
        }
      } else {
        // Check localStorage for non-authenticated users
        const favoritesData = JSON.parse(localStorage.getItem('phimhub:favorites') || '[]');
        const isInFavorites = favoritesData.some((item: any) => (item.id || item) === it.id);
        setIsFavorited(isInFavorites);
      }
    };
    
    checkFavoriteStatus();
  }, [it.id, it.isSeries]);

  // Listen for favorites updates
  useEffect(() => {
    const handleFavoritesUpdate = async () => {
      const token = localStorage.getItem('phimhub:token');
      if (token) {
        // Check API for authenticated users
        try {
          const { InteractionsApi } = await import('../../../services/movies/interactions');
          const response = await InteractionsApi.checkFavorite(it.id, it.isSeries ? 'series' : 'movie');
          setIsFavorited(response.isFavorited);
        } catch (error) {
          console.error('Error checking favorite status:', error);
          // Fallback to localStorage
          const favoritesData = JSON.parse(localStorage.getItem('phimhub:favorites') || '[]');
          const isInFavorites = favoritesData.some((item: any) => (item.id || item) === it.id);
          setIsFavorited(isInFavorites);
        }
      } else {
        // Check localStorage for non-authenticated users
        const favoritesData = JSON.parse(localStorage.getItem('phimhub:favorites') || '[]');
        const isInFavorites = favoritesData.some((item: any) => (item.id || item) === it.id);
        setIsFavorited(isInFavorites);
      }
    };

    window.addEventListener('favoritesUpdated', handleFavoritesUpdate);
    return () => window.removeEventListener('favoritesUpdated', handleFavoritesUpdate);
  }, [it.id, it.isSeries]);

      // Delay overlay by 1s on hover
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    if (isHovered) {
          timer = setTimeout(() => setShowOverlay(true), 1000);
    } else {
      setShowOverlay(false);
      if (timer) clearTimeout(timer);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isHovered]);

  // Load movie detail when overlay is shown
  useEffect(() => {
    if (showOverlay && provider && !movieDetail) {
      MovieService.use(provider).getMovieById(it.id)
        .then(detail => setMovieDetail(detail))
        .catch(() => {});
    }
  }, [showOverlay, provider, it.id, movieDetail]);

  const handleCardClick = async () => {
    // Điều hướng đúng trang chi tiết dựa theo loại (movie/series)
    if (provider) {
      try {
        const detail = await MovieService.use(provider).getMovieById(it.id);
        const isSeries = detail?.isSeries === true;
        navigate(`${isSeries ? "/series" : "/movies"}/${it.id}?provider=${provider}`);
        return;
      } catch {
        // fallback
      }
    }
    navigate(`/movies/${it.id}?provider=local`);
  };

  const handleWatchClick = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    // Điều hướng đúng trang xem dựa theo loại (movie/series)
    if (provider) {
      try {
        const detail = await MovieService.use(provider).getMovieById(it.id);
        const isSeries = detail?.isSeries === true;
        navigate(`${isSeries ? "/watch/series" : "/watch/movie"}/${it.id}?provider=${provider}`);
        return;
      } catch {
        // fallback
      }
    }
    navigate(`/watch/movie/${it.id}?provider=local`);
  };

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    const slug = it.id;
    const token = localStorage.getItem('phimhub:token');
    
    if (token) {
      // Use API for authenticated users
      try {
        const { InteractionsApi } = await import('../../../services/movies/interactions');
        if (isFavorited) {
          await InteractionsApi.removeFavorite(slug, it.isSeries ? 'series' : 'movie');
        } else {
          await InteractionsApi.addFavorite(slug, it.isSeries ? 'series' : 'movie');
        }
        setIsFavorited(!isFavorited);
        window.dispatchEvent(new CustomEvent('favoritesUpdated'));
      } catch (error) {
        console.error('Error updating favorites:', error);
      }
    } else {
      // Fallback to localStorage for non-authenticated users
      const favoritesData = JSON.parse(localStorage.getItem('phimhub:favorites') || '[]');
      
      // Check if already in favorites
      const isInFavorites = favoritesData.some((item: any) => (item.id || item) === slug);
      
      if (isInFavorites) {
        // Remove from favorites
        const newFavorites = favoritesData.filter((item: any) => (item.id || item) !== slug);
        localStorage.setItem('phimhub:favorites', JSON.stringify(newFavorites));
      } else {
        // Add to favorites
        const movieData = {
          id: slug,
          provider: provider || "local"
        };
        favoritesData.push(movieData);
        localStorage.setItem('phimhub:favorites', JSON.stringify(favoritesData));
      }
      
      // Force re-render by updating a dummy state or trigger parent update
      window.dispatchEvent(new CustomEvent('favoritesUpdated'));
    }
  };

  return (
    <div 
      className="group relative w-full cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ zIndex: isHovered ? 10000 : 'auto', overflow: 'visible' }}
    >
      {/* Enhanced Wide Card */}
      <div 
        className="overflow-hidden rounded-2xl bg-gradient-to-br from-dark-800/80 to-dark-900/80 p-4 ring-1 ring-white/10 hover:ring-primary-400/50 hover:scale-[1.02] hover:shadow-2xl hover:shadow-primary-500/25 transition-all duration-500 backdrop-blur-sm"
      >
        <div className="relative overflow-hidden rounded-xl">
          <img
            src={it.img}
            alt={it.title}
            loading="lazy"
            className="aspect-video w-full object-cover transition-transform duration-500 group-hover:scale-105 cursor-pointer"
            onClick={handleCardClick}
          />
          {/* Enhanced gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          {/* Enhanced play button */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500">
            <div className="rounded-full bg-gradient-to-r from-primary-500 to-primary-600 p-4 backdrop-blur-md shadow-2xl transform scale-75 group-hover:scale-100 transition-transform duration-300">
              <span className="text-white text-xl">▶</span>
            </div>
          </div>
          
          {/* Enhanced trending badge */}
          <div className="absolute top-3 left-3 rounded-full bg-gradient-to-r from-red-500 to-orange-500 px-3 py-1.5 text-xs font-bold text-white shadow-lg backdrop-blur-sm">
            🔥 Trending
          </div>
          
          {/* Quality badge */}
          <div className="absolute top-3 right-3 rounded-full bg-black/70 px-2 py-1 text-xs font-semibold text-white backdrop-blur-sm">
            HD
          </div>
        </div>
        
        {/* Enhanced content */}
        <div className="mt-4 space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h3 className="line-clamp-1 text-lg font-bold text-white group-hover:text-primary-300 transition-colors duration-300">
                {it.title}
              </h3>
              <p className="text-sm text-gray-400 mt-1">{it.sub}</p>
            </div>
          </div>
          
          {/* Enhanced action button */}
          <button
            onClick={handleWatchClick}
            className="w-full rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 px-6 py-3 text-sm font-semibold text-white hover:from-primary-400 hover:to-primary-500 hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-primary-500/25"
            aria-label={cta}
          >
            {cta}
          </button>
        </div>
      </div>

      {/* Enhanced Hover Overlay for Wide Card (appears after 1s) */}
      {showOverlay && (
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 z-[9999] w-[420px] bg-gradient-to-br from-gray-900/98 to-gray-800/98 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl overflow-hidden pointer-events-auto">
          <div className="relative">
            {/* Enhanced Background Image */}
            <div className="h-64 bg-cover bg-center relative" style={{ backgroundImage: `url(${it.img})` }}>
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/60 to-transparent" />
              
              {/* Quality badge */}
              <div className="absolute top-4 right-4 rounded-full bg-yellow-500/90 px-3 py-1 text-xs font-bold text-white backdrop-blur-sm">
                FHD
              </div>
            </div>
            
            {/* Enhanced Content */}
            <div className="p-6 relative z-10">
              <h3 className="text-2xl font-bold text-white mb-4 line-clamp-2 leading-tight">{it.title}</h3>
              
              {/* Enhanced Action Buttons */}
              <div className="flex gap-3 mb-6 relative z-20">
                <button
                  onClick={handleWatchClick}
                  className="flex-1 bg-gradient-to-r from-primary-500 to-primary-600 text-white px-6 py-4 rounded-xl font-bold hover:from-primary-400 hover:to-primary-500 transition-all duration-300 cursor-pointer relative z-30 shadow-lg hover:shadow-primary-500/25"
                >
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M8 5v10l8-5-8-5z"/>
                    </svg>
                    Xem ngay
                  </span>
                </button>
                <button
                  onClick={handleFavoriteClick}
                  className={`px-5 py-4 rounded-xl transition-all duration-300 cursor-pointer relative z-30 ${
                    isFavorited 
                      ? 'bg-red-500/20 text-red-300 hover:bg-red-500/30 border border-red-500/30' 
                      : 'bg-white/20 text-white hover:bg-white/30 border border-white/20'
                  }`}
                >
                  <svg className="w-5 h-5" fill={isFavorited ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </button>
                <button
                  onClick={handleCardClick}
                  className="bg-white/20 text-white px-5 py-4 rounded-xl hover:bg-white/30 transition-all duration-300 cursor-pointer relative z-30 border border-white/20"
                  title="Xem chi tiết"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
              </div>

              {/* Enhanced Movie Info */}
              {movieDetail && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-sm">
                    {movieDetail.rating && (
                      <span className="bg-yellow-500/20 text-yellow-300 px-3 py-1.5 rounded-lg font-semibold">
                        IMDb {movieDetail.rating}
                      </span>
                    )}
                    {movieDetail.year && (
                      <span className="bg-gray-700/50 text-gray-300 px-3 py-1.5 rounded-lg">{movieDetail.year}</span>
                    )}
                    {movieDetail.duration && (
                      <span className="bg-gray-700/50 text-gray-300 px-3 py-1.5 rounded-lg">{movieDetail.duration} phút</span>
                    )}
                    {movieDetail.age && (
                      <span className="bg-gray-700/50 text-gray-300 px-3 py-1.5 rounded-lg">{movieDetail.age}</span>
                    )}
                  </div>
                  
                  {movieDetail.genres && (
                    <div className="flex flex-wrap gap-2">
                      {Array.isArray(movieDetail.genres) 
                        ? movieDetail.genres.slice(0, 3).map((g: any, index: number) => (
                            <span key={index} className="bg-gray-700/50 text-gray-300 px-3 py-1.5 rounded-lg text-sm">
                              {getGenreDisplayNameFromObject(g)}
                            </span>
                          ))
                        : <span className="bg-gray-700/50 text-gray-300 px-3 py-1.5 rounded-lg text-sm">
                            {getGenreDisplayNameFromObject(movieDetail.genres)}
                          </span>
                      }
                    </div>
                  )}
                  
                  {movieDetail.overview && (
                    <p className="text-sm text-gray-300 leading-relaxed line-clamp-3">
                      {movieDetail.overview}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* =======================
   Responsive perPage
======================= */
function usePerPage(kind: "poster" | "wide", customCount?: number) {
  // Nếu có customCount thì dùng, không thì mặc định 8 phim hiển thị cho poster grid
  if (kind === "poster") {
    return customCount || 8;
  }
  return customCount || 6;
}

/* =======================
   Enhanced Section with Navigation
======================= */
function EnhancedSection({ 
  title, 
  items, 
  page, 
  setPage, 
  perPage, 
  kind = "poster",
  withProgress = false 
}: {
  title: string;
  items: Item[];
  page: number;
  setPage: (page: number) => void;
  perPage: number;
  kind?: "poster" | "wide";
  withProgress?: boolean;
}) {
  const maxPage = Math.ceil(items.length / perPage) - 1;
  const startIndex = page * perPage;
  const endIndex = startIndex + perPage;
  const currentItems = items.slice(startIndex, endIndex);
  
  return (
    <div className="mb-8">
      {/* Enhanced Section Title */}
      <div className="flex items-center gap-3 mb-6">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
          {title}
        </h2>
        <div className="flex-1 h-px bg-gradient-to-r from-primary-500/50 to-transparent"></div>
        
        {/* Pagination Indicator */}
        {items.length > perPage && (
          <div className="flex items-center gap-2 ml-4">
            <span className="text-sm text-gray-400">
              {page + 1}/{Math.ceil(items.length / perPage)}
            </span>
          </div>
        )}
      </div>
      
      {/* Enhanced Grid with Navigation */}
      <div className="relative">
        {/* Left Navigation Button */}
        {items.length > perPage && (
          <button
            onClick={() => setPage(Math.max(0, page - 1))}
            disabled={page === 0}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 border border-white/20"
            aria-label="Trang trước"
          >
            <span className="text-xl text-white">‹</span>
          </button>
        )}

        {/* Content Container */}
        <div className={`flex-1 flex justify-center ${items.length > perPage ? 'mx-16' : ''}`}>
          {kind === "wide" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
              {currentItems.map((item) => (
                <WideCard key={item.id} it={item} cta="▶ Xem" />
              ))}
            </div>
          ) : (
            <div className="w-full flex justify-center">
              <div className={`grid gap-4 ${
                currentItems.length <= 4 
                  ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4' 
                  : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-8'
              }`}>
                {currentItems.map((item) => (
                  <HomePosterCard 
                    key={item.id} 
                    it={item} 
                    progress={withProgress ? Math.random() * 100 : undefined} 
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Navigation Button */}
        {items.length > perPage && (
          <button
            onClick={() => setPage(Math.min(maxPage, page + 1))}
            disabled={page >= maxPage}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 border border-white/20"
            aria-label="Trang sau"
          >
            <span className="text-xl text-white">›</span>
          </button>
        )}
      </div>
    </div>
  );
}

/* =======================
   Section with buttons (no scrollbar)
======================= */
function SectionRow({
  title,
  items,
  kind,
  withProgress = false,
  customCount,
}: {
  title: string;
  items: Item[];
  kind: "poster" | "wide";
  withProgress?: boolean;
  customCount?: number;
}) {
  const perPage = usePerPage(kind, customCount);
  const [page, setPage] = useState(0);
  const maxPage = Math.max(0, Math.ceil(items.length / perPage) - 1);

  useEffect(() => {
    if (page > maxPage) setPage(maxPage);
  }, [perPage, items.length, page, maxPage]);

  const start = page * perPage;
  const slice = items.slice(start, start + perPage);
  
  // For poster grid, show all items if there are fewer than perPage
  const displayItems = kind === "poster" && items.length <= perPage ? items : slice;

  return (
    <section className="relative my-5 overflow-visible">
      {/* Section Title */}
      <div className="mb-4 flex items-center gap-3">
        <h2 className="text-xl font-extrabold text-white font-display">{title}</h2>
        {title.includes("THỊNH HÀNH") && (
          <div className="flex items-center gap-1 text-xs text-primary-300 bg-primary-500/20 px-2 py-1 rounded-full">
            <span>🔥</span>
            <span>Hot</span>
          </div>
        )}
        <div className="text-sm text-dark-300 bg-dark-700/50 px-3 py-1 rounded-full">
          {kind === "poster" && items.length <= perPage 
            ? `${items.length} phim` 
            : `${start + 1}-${Math.min(start + perPage, items.length)} / ${items.length}`
          }
        </div>
      </div>

      {/* Navigation Container */}
      <div className="relative flex items-center">
        {/* Left Navigation Button - always show for wide cards, show for poster when pagination is needed */}
        {kind === "wide" || (kind === "poster" && items.length > perPage) ? (
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="absolute left-0 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 border border-white/20"
            aria-label="Trang trước"
          >
            <span className="text-xl text-white">‹</span>
          </button>
        ) : null}

        {/* Content Container */}
        <div className={`flex-1 flex justify-center ${kind === "wide" || (kind === "poster" && items.length > perPage) ? 'mx-16' : ''}`}>
          {kind === "poster" ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 justify-items-center">
              {displayItems.map((it, i) => (
                <HomePosterCard
                  key={it.id}
                  it={it}
                  progress={withProgress ? ((start + i) * 17) % 100 : undefined}
                />
              ))}
            </div>
          ) : (
            <div className="flex justify-center gap-12">
              {slice.map((it, i) => (
                <WideCard key={it.id} it={it} />
              ))}
            </div>
          )}
        </div>

        {/* Right Navigation Button - always show for wide cards, show for poster when pagination is needed */}
        {kind === "wide" || (kind === "poster" && items.length > perPage) ? (
          <button
            onClick={() => setPage((p) => Math.min(maxPage, p + 1))}
            disabled={page >= maxPage}
            className="absolute right-0 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 border border-white/20"
            aria-label="Trang sau"
          >
            <span className="text-xl text-white">›</span>
          </button>
        ) : null}
      </div>
    </section>
  );
}

/* =======================
   Trang Home
======================= */
export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showLoginRequired, modalConfig, showLoginRequiredModal, hideLoginRequiredModal, handleLogin } = useLoginRequired();
  
  // ---- Banner state ----
  const [idx, setIdx] = useState(0);
  const [uploadedBanners, setUploadedBanners] = useState<Banner[]>([]);
  const [bannerLoading, setBannerLoading] = useState(true);
  const [pause, setPause] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [watchlist, setWatchlist] = useState<Set<string>>(new Set());
  
  // ---- Real data from database ----
  const [trendingMovies, setTrendingMovies] = useState<Item[]>([]);
  const [watchedMovies, setWatchedMovies] = useState<Item[]>([]);
  const [newMovies, setNewMovies] = useState<Item[]>([]);
  const [newTV, setNewTV] = useState<Item[]>([]);
  const [userWatchHistory, setUserWatchHistory] = useState<WatchHistoryItem[]>([]);
  const [watchHistoryLoading, setWatchHistoryLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(true);
  const [sectionsLoaded, setSectionsLoaded] = useState({
    trending: false,
    watched: false,
    newMovies: false,
    newTV: false
  });
  
  // Pagination state for all sections
  const [trendingPage, setTrendingPage] = useState(0);
  const [newMoviesPage, setNewMoviesPage] = useState(0);
  const [newTVPage, setNewTVPage] = useState(0);
  const [watchedPage, setWatchedPage] = useState(0);
  
  // Add to List Dialog state
  const [showAddToListDialog, setShowAddToListDialog] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState<{id: string, title: string, type: 'movie' | 'series'} | null>(null);
  
  const trendingPerPage = 4;
  const posterPerPage = 8;

  // Load favorites and watchlist from localStorage
  useEffect(() => {
    const loadFavorites = async () => {
      const token = localStorage.getItem('phimhub:token');
      if (token) {
        // Load from API for authenticated users
        try {
          const { InteractionsApi } = await import('../../../services/movies/interactions');
          const apiFavorites = await InteractionsApi.listFavorites();
          setFavorites(new Set(apiFavorites.map((item: any) => item.id)));
        } catch (error) {
          console.error('Error loading favorites from API:', error);
          // Fallback to localStorage
          const savedFavorites = JSON.parse(localStorage.getItem('phimhub:favorites') || '[]');
          setFavorites(new Set(savedFavorites.map((item: any) => item.id || item)));
        }
      } else {
        // Load from localStorage for non-authenticated users
        const savedFavorites = JSON.parse(localStorage.getItem('phimhub:favorites') || '[]');
        setFavorites(new Set(savedFavorites.map((item: any) => item.id || item)));
      }
      
      // Watchlist still uses localStorage
      const savedWatchlist = JSON.parse(localStorage.getItem('phimhub:watchlist') || '[]');
      setWatchlist(new Set(savedWatchlist.map((item: any) => item.id || item)));
    };
    
    loadFavorites();
  }, []);

  // Load user watch history
  useEffect(() => {
    const loadWatchHistory = async () => {
      console.log('Home - Loading watch history for user:', user);
      
      if (!user) {
        console.log('Home - No user, setting empty watch history');
        setWatchHistoryLoading(false);
        setUserWatchHistory([]);
        return;
      }

      try {
        setWatchHistoryLoading(true);
        const userId = parseInt(user.id);
        console.log('Home - Fetching watch history for userId:', userId);
        
        const history = await watchHistoryService.getHistory(userId);
        console.log('Home - Watch history loaded:', history);
        
        setUserWatchHistory(history);
      } catch (error) {
        console.error('Home - Failed to load watch history:', error);
        setUserWatchHistory([]);
      } finally {
        setWatchHistoryLoading(false);
      }
    };

    loadWatchHistory();
  }, [user]);

  // Listen for login required events from PosterCard
  useEffect(() => {
    const handleShowLoginRequired = (event: CustomEvent) => {
      showLoginRequiredModal(event.detail);
    };

    window.addEventListener('showLoginRequired', handleShowLoginRequired as EventListener);
    return () => {
      window.removeEventListener('showLoginRequired', handleShowLoginRequired as EventListener);
    };
  }, [showLoginRequiredModal]);

  // Helper function to check if current banner is in favorites/watchlist
  const isCurrentInFavorites = () => {
    const slug = getCurrentSlug();
    return favorites.has(slug);
  };

  const isCurrentInWatchlist = () => {
    const slug = getCurrentSlug();
    return watchlist.has(slug);
  };

  // Load banners from uploaded movies (provider/local backend)
  useEffect(() => {
    (async () => {
      try {
        setBannerLoading(true);
        
        // Check cache for banners
        const cacheKey = 'phimhub:home-banners';
        const cachedData = localStorage.getItem(cacheKey);
        const cacheTime = localStorage.getItem(cacheKey + ':time');
        const now = Date.now();
        const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes for banners
        
        let moviesWithBanner = [];
        
        if (cachedData && cacheTime && (now - parseInt(cacheTime)) < CACHE_DURATION) {
          // Use cached data
          console.log('Home - Using cached banners data');
          moviesWithBanner = JSON.parse(cachedData);
        } else {
          // Fetch fresh data
          console.log('Home - Fetching fresh banners data');
          const response = await fetch(`${import.meta.env.VITE_API_BASE || 'http://localhost:3001/api'}/movies?limit=20`);
          const data = await response.json();
          
          if (data.success && data.data.movies) {
            moviesWithBanner = data.data.movies
              .filter((movie: any) => movie.banner_url && movie.status === 'published')
              .slice(0, 8); // Lấy tối đa 8 phim cho banner
            
            // Cache the data
            localStorage.setItem(cacheKey, JSON.stringify(moviesWithBanner));
            localStorage.setItem(cacheKey + ':time', now.toString());
          }
        }
        
        const list: Banner[] = moviesWithBanner.map((movie: any) => ({
            id: movie.slug || movie.id,
            title: movie.title,
            desc: movie.description || "Không có mô tả",
            tags: movie.categories ? 
              (typeof movie.categories === 'string' && movie.categories.startsWith('[') ? 
                JSON.parse(movie.categories).map((g: string) => getGenreDisplayName(g)).slice(0, 3) : 
                movie.categories.split(',').map((g: string) => getGenreDisplayName(g.trim())).slice(0, 3)) : 
              (movie.genres ? movie.genres.map((g: any) => getGenreDisplayName(g.slug || g.name || g)).slice(0, 3) : []),
            image: movie.banner_url,
            // Thêm thông tin phim
            rating: movie.external_rating,
            ageRating: movie.age_rating,
            year: movie.release_year,
            duration: movie.duration,
            quality: movie.quality || "HD",
            isSeries: movie.is_series,
            totalEpisodes: movie.total_episodes,
          }));
          
          setUploadedBanners(list);
      } catch (error) {
        console.error("Failed to load banners:", error);
        setUploadedBanners([]);
      } finally {
        setBannerLoading(false);
      }
    })();
  }, []);

  // Load real data from database for sections
  useEffect(() => {
    (async () => {
      try {
        setDataLoading(true);
        
        // Check cache first
        const cacheKey = 'phimhub:home-movies';
        const cachedData = localStorage.getItem(cacheKey);
        const cacheTime = localStorage.getItem(cacheKey + ':time');
        const now = Date.now();
        const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
        
        let movies = [];
        
        if (cachedData && cacheTime && (now - parseInt(cacheTime)) < CACHE_DURATION) {
          // Use cached data
          console.log('Home - Using cached movies data');
          movies = JSON.parse(cachedData);
        } else {
          // Fetch fresh data
          console.log('Home - Fetching fresh movies data');
          const response = await fetch(`${import.meta.env.VITE_API_BASE || 'http://localhost:3001/api'}/movies?limit=50`); // Reduced from 100 to 50
          const data = await response.json();
          
          if (data.success && data.data.movies) {
            movies = data.data.movies.filter((movie: any) => movie.status === 'published');
            
            // Cache the data
            localStorage.setItem(cacheKey, JSON.stringify(movies));
            localStorage.setItem(cacheKey + ':time', now.toString());
          }
        }
        
        // Convert to Item format
        const convertToItems = (movieList: any[]): Item[] => 
          movieList.map((movie: any) => ({
            id: movie.slug,
            title: movie.title,
            sub: movie.is_series 
              ? `${movie.release_year || 'N/A'} · ${movie.total_episodes || 0} tập`
              : `${movie.release_year || 'N/A'} · ${movie.duration || 0} phút`,
            img: movie.poster_url || movie.thumbnail_url || "",
            year: movie.release_year,
            age: movie.age_rating || movie.age,
            rating: movie.external_rating,
            duration: movie.duration,
            genres: movie.categories ? 
              (typeof movie.categories === 'string' && movie.categories.startsWith('[') ? 
                JSON.parse(movie.categories).map((g: string) => getGenreDisplayName(g)) : 
                movie.categories.split(',').map((g: string) => getGenreDisplayName(g.trim()))) : 
              (movie.genres ? movie.genres.map((g: any) => getGenreDisplayName(g.slug || g.name || g)) : []),
          }));
        
        // Load sections with priority: Trending first, then others
        const loadSections = async () => {
          // 1. Trending (highest priority)
          const trending = movies
            .filter((m: any) => m.external_rating && m.external_rating > 7.0)
            .sort((a: any, b: any) => {
              const ratingDiff = (b.external_rating || 0) - (a.external_rating || 0);
              if (ratingDiff !== 0) return ratingDiff;
              return (b.release_year || 0) - (a.release_year || 0);
            })
            .slice(0, 12);
          setTrendingMovies(convertToItems(trending));
          setSectionsLoaded(prev => ({ ...prev, trending: true }));
          
          // 2. Other sections (load after a short delay)
          setTimeout(() => {
            // Watched: Most viewed movies (view_count > 0)
            const watched = movies
              .filter((m: any) => m.view_count > 0)
              .sort((a: any, b: any) => {
                const viewDiff = (b.view_count || 0) - (a.view_count || 0);
                if (viewDiff !== 0) return viewDiff;
                return (b.release_year || 0) - (a.release_year || 0);
              })
              .slice(0, 24);
            setWatchedMovies(convertToItems(watched));
            setSectionsLoaded(prev => ({ ...prev, watched: true }));
            
            const newMoviesList = movies
              .filter((m: any) => !m.is_series)
              .sort((a: any, b: any) => (b.release_year || 0) - (a.release_year || 0))
              .slice(0, 24);
            setNewMovies(convertToItems(newMoviesList));
            setSectionsLoaded(prev => ({ ...prev, newMovies: true }));
            
            // New TV: Latest series (is_series = true)
            const newTVList = movies
              .filter((m: any) => m.is_series)
              .sort((a: any, b: any) => (b.release_year || 0) - (a.release_year || 0))
              .slice(0, 24);
            setNewTV(convertToItems(newTVList));
            setSectionsLoaded(prev => ({ ...prev, newTV: true }));
          }, 100); // Small delay to prioritize trending section
        };
        
        loadSections();
      } catch (error) {
        console.error("Failed to load real data:", error);
      } finally {
        setDataLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (pause) return;
    const list = uploadedBanners; // Only use data from database
    const t = setInterval(() => setIdx((i) => (i + 1) % list.length), 5000);
    return () => clearInterval(t);
  }, [pause, uploadedBanners.length]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") setIdx((i) => (i + 1) % uploadedBanners.length);
      if (e.key === "ArrowLeft") setIdx((i) => (i - 1 + uploadedBanners.length) % uploadedBanners.length);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Luôn giới hạn đúng 5 banner
  const bannerList = uploadedBanners.slice(0, 5);
  const current = bannerList.length > 0 ? bannerList[idx % bannerList.length] : null;

  // Helper function to get current banner's slug
  const getCurrentSlug = () => {
    if (!current) return null;
    
    // Use the actual slug from the database if available
    if ((current as any).slug) {
      return (current as any).slug;
    }
    
    // Fallback to hardcoded slugs for fallback banners
    const uploadedSlugs = ["thon-phe-tinh-khong", "than-den-oi-uoc-di"];
    
    if (current.title.toLowerCase().includes("thôn phệ tinh không") || current.title.toLowerCase().includes("perfect world")) {
      return "thon-phe-tinh-khong";
    } else if (current.title.toLowerCase().includes("thần đèn ơi ước đi") || current.title.toLowerCase().includes("genie")) {
      return "than-den-oi-uoc-di";
    } else {
      // Fallback: tìm theo pattern
      return uploadedSlugs.find(s => {
        const slugWords = s.replace(/-/g, ' ').split(' ');
        const titleWords = current.title.toLowerCase().split(' ');
        return slugWords.some(word => titleWords.some((tWord: string) => tWord.includes(word) || word.includes(tWord)));
      }) || current.id.toString();
    }
  };

  // ---- Handlers ----

  const handleAddToList = () => {
    const slug = getCurrentSlug();
    if (!slug) return;
    
    // Get current banner data
    const currentBanner = uploadedBanners[idx];
    if (!currentBanner) return;
    
    // Set selected movie data and show dialog
    setSelectedMovie({
      id: slug,
      title: currentBanner.title,
      type: currentBanner.isSeries ? 'series' : 'movie'
    });
    setShowAddToListDialog(true);
  };

  const handleAddToFavorites = async () => {
    const slug = getCurrentSlug();
    if (!slug) return;
    
    const token = localStorage.getItem('phimhub:token');
    
    if (token) {
      // Use API for authenticated users
      try {
        const { InteractionsApi } = await import('../../../services/movies/interactions');
        if (favorites.has(slug)) {
          await InteractionsApi.removeFavorite(slug, 'movie');
          setFavorites(prev => {
            const newSet = new Set(prev);
            newSet.delete(slug);
            return newSet;
          });
        } else {
          await InteractionsApi.addFavorite(slug, 'movie');
          setFavorites(prev => new Set([...prev, slug]));
        }
        window.dispatchEvent(new CustomEvent('favoritesUpdated'));
      } catch (error) {
        console.error('Error updating favorites:', error);
      }
    } else {
      // Fallback to localStorage for non-authenticated users
      const favoritesData = JSON.parse(localStorage.getItem('phimhub:favorites') || '[]');
      
      if (favorites.has(slug)) {
        // Xóa khỏi yêu thích
        const newFavorites = favoritesData.filter((item: any) => (item.id || item) !== slug);
        localStorage.setItem('phimhub:favorites', JSON.stringify(newFavorites));
        setFavorites(prev => {
          const newSet = new Set(prev);
          newSet.delete(slug);
          return newSet;
        });
      } else {
        // Thêm vào yêu thích
        const movieData = {
          id: slug,
          provider: "local"
        };
        favoritesData.push(movieData);
        localStorage.setItem('phimhub:favorites', JSON.stringify(favoritesData));
        setFavorites(prev => new Set([...prev, slug]));
      }
    }
  };


  // Use real data from database only
  const trending = useMemo(() => {
    return trendingMovies;
  }, [trendingMovies]);

  // Helper function to convert WatchHistoryItem to Item format
  const convertWatchHistoryToItems = (history: WatchHistoryItem[]): Item[] => {
    return history.map(item => ({
      id: item.slug || item.content_id.toString(),
      title: item.title || "Không có tiêu đề",
      sub: item.is_series ? "Phim bộ" : "Phim lẻ",
      img: item.poster_url || "/assets/placeholder-movie.svg",
      genres: [] // WatchHistoryItem doesn't have genres, will be empty for now
    }));
  };

  const watched = useMemo(() => {
    // If user has watch history, use that (limit to 24 items)
    if (userWatchHistory.length > 0) {
      return convertWatchHistoryToItems(userWatchHistory).slice(0, 24);
    }
    
    // If no user watch history, don't show the section (return empty array)
    // This will cause the section to be hidden
    return [];
  }, [userWatchHistory]);

  const newMoviesList = useMemo(() => {
    return newMovies;
  }, [newMovies]);

  const newTVList = useMemo(() => {
    return newTV;
  }, [newTV]);

  // Auto-scroll trending section - DISABLED
  // useEffect(() => {
  //   const interval = setInterval(() => {
  //     // Auto-scroll trending section every 8 seconds
  //     const trendingSection = document.querySelector('[data-section="trending"]');
  //     if (trendingSection) {
  //       const nextButton = trendingSection.querySelector('[aria-label="Trang sau"]') as HTMLButtonElement;
  //       if (nextButton && !nextButton.disabled) {
  //         nextButton.click();
  //       }
  //     }
  //   }, 8000);

  //   return () => clearInterval(interval);
  // }, []);

  // Loading state removed - data loads in background

  return (
    <div className="space-y-6">
      {/* BANNER FULL-WIDTH (sát navbar) */}
      {current && (
        <section
          className="relative z-0 left-1/2 right-1/2 -mx-[50vw] w-screen overflow-hidden -mt-16"
          onMouseEnter={() => setPause(true)}
          onMouseLeave={() => setPause(false)}
        >
        <div
          className="relative h-[75vh] min-h-[420px] w-full bg-cover bg-center"
          style={{ backgroundImage: `url(${current.image})` }}
        >
          {/* gradient overlays KHÔNG nhận pointer để không chặn click header */}
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-t from-dark-900 via-transparent to-transparent" />
            <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-b from-transparent to-dark-900" />
            <div className="absolute inset-0 bg-gradient-to-r from-dark-900/60 via-transparent to-transparent" />
          </div>

          {/* content */}
          <div className="relative z-10 flex h-full items-end justify-start gap-6 pl-10 md:pl-12 lg:pl-16 xl:pl-20 2xl:pl-24 pr-6 md:pr-8 lg:pr-12 xl:pr-16 2xl:pr-20 pb-12">
            <div className="max-w-2xl">
              <h1 className="mb-4 text-4xl font-bold drop-shadow-lg md:text-6xl font-display text-white">
                {current.title}
              </h1>
              
              {/* Movie Info Tags - giống như trong hình mẫu */}
              <div className="mb-4 flex flex-wrap gap-3">
                {/* IMDb Rating */}
                {current.rating && (
                  <div className="flex items-center gap-2 rounded border border-yellow-400/50 bg-yellow-400/10 px-3 py-1.5 backdrop-blur">
                    <span className="text-yellow-400 font-bold text-sm">IMDb</span>
                    <span className="text-white font-semibold text-sm">{current.rating}</span>
                  </div>
                )}
                
                {/* Quality */}
                {current.quality && (
                  <div className="rounded bg-yellow-500 px-3 py-1.5">
                    <span className="text-white font-semibold text-sm">{current.quality}</span>
                  </div>
                )}
                
                {/* Age Rating */}
                {current.ageRating && (
                  <div className="rounded border border-white/50 bg-transparent px-3 py-1.5">
                    <span className="text-white font-semibold text-sm">{current.ageRating}</span>
                  </div>
                )}
                
                {/* Year */}
                {current.year && (
                  <div className="rounded border border-white/50 bg-transparent px-3 py-1.5">
                    <span className="text-white font-semibold text-sm">{current.year}</span>
                  </div>
                )}
                
                {/* Duration */}
                {current.duration && (
                  <div className="rounded border border-white/50 bg-transparent px-3 py-1.5">
                    <span className="text-white font-semibold text-sm">
                      {current.isSeries 
                        ? `${current.totalEpisodes || 0} tập`
                        : `${Math.floor(current.duration / 60)}h ${current.duration % 60}m`
                      }
                    </span>
                  </div>
                )}
              </div>
              
              {/* Genre Tags */}
              <div className="mb-4 flex flex-wrap gap-2">
                {current.tags.map((t: string) => (
                  <span
                    key={t}
                    className="rounded bg-white/10 px-3 py-1.5 text-sm font-medium text-white backdrop-blur"
                  >
                    {t}
                  </span>
                ))}
              </div>
              
              <p className="max-w-2xl text-sm text-white/90 md:text-base leading-relaxed mb-6">{current.desc}</p>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => {
                    // Ưu tiên slug từ database (id dạng string), nếu không có thì dùng fallback
                    let slug: string | null = null;
                    let isSeries = false;

                    if (typeof current.id === 'string') {
                      // Phim từ database - dùng slug thực
                      slug = current.id;
                      isSeries = current.isSeries === true;
                    } else {
                      // Phim fallback - dùng logic cũ
                      slug = getCurrentSlug();
                      // Fallback banners đều là phim lẻ
                      isSeries = false;
                    }

                    if (!slug) return;
                    navigate(`/watch/${isSeries ? 'series' : 'movie'}/${slug}?provider=local`);
                  }}
                  className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-yellow-400 via-yellow-500 to-orange-500 shadow-2xl hover:shadow-yellow-500/25 hover:scale-105 transition-all duration-300 border-2 border-yellow-300/20"
                >
                  <span className="text-2xl text-black font-bold ml-1 drop-shadow-sm">▶</span>
                </button>
                
                {/* Action Buttons - Rophim Style */}
                <div className="flex rounded-full bg-gray-800/60 backdrop-blur-md border border-white/20 overflow-hidden">
                  <button
                    onClick={user ? handleAddToFavorites : () => showLoginRequiredModal({ title: "Yêu cầu đăng nhập", message: "Bạn cần đăng nhập để thêm vào yêu thích" })}
                    className="flex h-14 w-14 items-center justify-center transition-all duration-300 bg-transparent text-white hover:bg-gray-700/50 border-r border-white/20"
                    title={user ? (isCurrentInFavorites() ? "Bỏ yêu thích" : "Yêu thích") : "Đăng nhập để yêu thích"}
                    aria-label={user ? (isCurrentInFavorites() ? "Bỏ yêu thích" : "Yêu thích") : "Đăng nhập để yêu thích"}
                  >
                    <span className="text-xl">{user && isCurrentInFavorites() ? '❤️' : '🤍'}</span>
                  </button>
                  
                  <button
                    onClick={() => {
                      // Điều hướng tới trang chi tiết phim/series
                      let slug: string | null = null;
                      let isSeries = false;

                      if (typeof current.id === 'string') {
                        slug = current.id;
                        isSeries = current.isSeries === true;
                      } else {
                        slug = getCurrentSlug();
                        isSeries = false; // fallback banners are movies
                      }

                      if (!slug) return;
                      navigate(`/${isSeries ? 'series' : 'movies'}/${slug}?provider=local`);
                    }}
                    className="flex h-14 w-14 items-center justify-center transition-all duration-300 bg-transparent text-white hover:bg-gray-700/50"
                    title="Xem chi tiết"
                    aria-label="Xem chi tiết"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* THUMBNAILS at bottom-right */}
          <div className="pointer-events-auto absolute bottom-4 right-6 md:right-8 lg:right-12 xl:right-16 2xl:right-20 z-10 flex gap-2 rounded-2xl bg-dark-800/80 p-3 backdrop-blur border border-dark-600/50">
            {bannerList.map((b: Banner, i: number) => (
              <button
                key={b.id}
                onClick={() => setIdx(i)}
                className={`overflow-hidden rounded-lg ring-2 transition-all duration-200 ${
                  i === idx 
                    ? "ring-primary-400 scale-105 shadow-lg" 
                    : "ring-dark-600/50 opacity-70 hover:opacity-100 hover:scale-105"
                }`}
                title={b.title}
                aria-label={`Chọn ${b.title}`}
              >
                <img
                  src={b.image}
                  loading="lazy"
                  className="h-12 w-20 object-cover sm:h-[56px] sm:w-24"
                  alt={b.title}
                />
              </button>
            ))}
          </div>
        </div>
        </section>
      )}

      {/* ==== SECTIONS (centered with comfortable gutters) ==== */}
      <section className="w-full px-1 md:px-2 lg:px-3 xl:px-4 2xl:px-6">
        <div data-section="trending">
          {sectionsLoaded.trending ? (
            <div className="mb-8">
              {/* Enhanced Section Title */}
              <div className="flex items-center gap-3 mb-6">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                  TOP THỊNH HÀNH
                </h2>
                <div className="flex-1 h-px bg-gradient-to-r from-primary-500/50 to-transparent"></div>
                
                {/* Pagination Indicator */}
                {trending.length > trendingPerPage && (
                  <div className="flex items-center gap-2 ml-4">
                    <span className="text-sm text-gray-400">
                      {trendingPage + 1}/{Math.ceil(trending.length / trendingPerPage)}
                    </span>
                  </div>
                )}
              </div>
              
              {/* Enhanced Wide Cards Grid with Navigation */}
              <div className="relative">
                {/* Calculate pagination */}
                {(() => {
                  const maxPage = Math.ceil(trending.length / trendingPerPage) - 1;
                  const startIndex = trendingPage * trendingPerPage;
                  const endIndex = startIndex + trendingPerPage;
                  const currentTrending = trending.slice(startIndex, endIndex);
                  
                  return (
                    <>
                      {/* Left Navigation Button */}
                      {trending.length > trendingPerPage && (
                        <button
                          onClick={() => setTrendingPage(prev => Math.max(0, prev - 1))}
                          disabled={trendingPage === 0}
                          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 border border-white/20"
                          aria-label="Trang trước"
                        >
                          <span className="text-xl text-white">‹</span>
                        </button>
                      )}

                      {/* Content Container */}
                      <div className={`flex-1 flex justify-center ${trending.length > trendingPerPage ? 'mx-16' : ''}`}>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
                          {currentTrending.map((item) => (
                            <WideCard key={item.id} it={item} cta="▶ Xem" />
                          ))}
                        </div>
                      </div>

                      {/* Right Navigation Button */}
                      {trending.length > trendingPerPage && (
                        <button
                          onClick={() => setTrendingPage(prev => Math.min(maxPage, prev + 1))}
                          disabled={trendingPage >= maxPage}
                          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 border border-white/20"
                          aria-label="Trang sau"
                        >
                          <span className="text-xl text-white">›</span>
                        </button>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>
          ) : (
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-red-500 to-orange-500 flex items-center justify-center">
                    <span className="text-white text-sm">🔥</span>
                  </div>
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                    TOP THỊNH HÀNH
                  </h2>
                </div>
                <div className="flex-1 h-px bg-gradient-to-r from-primary-500/50 to-transparent"></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="aspect-video bg-gray-700 rounded-2xl mb-4"></div>
                    <div className="h-5 bg-gray-700 rounded mb-2"></div>
                    <div className="h-4 bg-gray-700 rounded w-2/3 mb-3"></div>
                    <div className="h-10 bg-gray-700 rounded-xl"></div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {sectionsLoaded.newMovies ? (
          <EnhancedSection 
            title="Điện ảnh mới" 
            items={newMoviesList} 
            page={newMoviesPage}
            setPage={setNewMoviesPage}
            perPage={posterPerPage}
            kind="poster"
          />
        ) : (
          <div className="mb-8">
            <h2 className="mb-4 text-xl font-bold text-white">Điện ảnh mới</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-8 gap-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-[2/3] bg-gray-700 rounded-lg mb-2"></div>
                  <div className="h-3 bg-gray-700 rounded"></div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {sectionsLoaded.newTV ? (
          <EnhancedSection 
            title="TV Show mới" 
            items={newTVList} 
            page={newTVPage}
            setPage={setNewTVPage}
            perPage={posterPerPage}
            kind="poster"
          />
        ) : (
          <div className="mb-8">
            <h2 className="mb-4 text-xl font-bold text-white">TV Show mới</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-8 gap-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-[2/3] bg-gray-700 rounded-lg mb-2"></div>
                  <div className="h-3 bg-gray-700 rounded"></div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Only show "Phim đã xem" section if user has watch history and not loading */}
        {!watchHistoryLoading && userWatchHistory.length > 0 && (
          sectionsLoaded.watched ? (
            <EnhancedSection 
              title="Phim đã xem" 
              items={watched} 
              page={watchedPage}
              setPage={setWatchedPage}
              perPage={posterPerPage}
              kind="poster"
              withProgress={true}
            />
          ) : (
            <div className="mb-8">
              <h2 className="mb-4 text-xl font-bold text-white">Phim đã xem</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-8 gap-4">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="aspect-[2/3] bg-gray-700 rounded-lg mb-2"></div>
                    <div className="h-3 bg-gray-700 rounded"></div>
                  </div>
                ))}
              </div>
            </div>
          )
        )}
      </section>

      {/* Add to List Dialog */}
      {selectedMovie && (
        <AddToListDialog
          isOpen={showAddToListDialog}
          onClose={() => {
            setShowAddToListDialog(false);
            setSelectedMovie(null);
          }}
          movieId={selectedMovie.id}
          movieType={selectedMovie.type}
          movieTitle={selectedMovie.title}
        />
      )}

      {/* Login Required Modal */}
      <LoginRequiredModal
        isOpen={showLoginRequired}
        onClose={hideLoginRequiredModal}
        onLogin={handleLogin}
        title={modalConfig.title}
        message={modalConfig.message}
      />
    </div>
  );
}
