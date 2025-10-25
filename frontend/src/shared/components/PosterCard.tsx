import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MovieService } from "../../services/movies";
import { getGenreDisplayNameFromObject } from "../../utils/genreMapper";
import { AddToListDialog } from "./AddToListDialog";
import { WatchHistoryItem } from "../../services/watchHistory";
import { getImageUrl } from "../../utils/imageProxy";
import { favoritesDebug } from "../../utils/favoritesDebug";
import FallbackImage from "./FallbackImage";

type Movie = {
  id: string;
  title: string;
  originalTitle?: string;
  year?: number;
  poster: string;
  age?: string;
  duration?: number;
  genres?: any[];
  provider?: string;
  rating?: number;
  overview?: string;
};

type Series = {
  id: string;
  title: string;
  originalTitle?: string;
  year?: number;
  poster: string;
  age?: string;
  duration?: number;
  genres?: any[];
  provider?: string;
  rating?: number;
  overview?: string;
  totalEpisodes?: number;
  status?: string;
};

type PosterCardProps = {
  movie?: Movie;
  series?: Series;
  size?: "small" | "medium" | "large";
  showOverlay?: boolean;
  showGenres?: boolean;
  showRating?: boolean;
  showAge?: boolean;
  showDuration?: boolean;
  progress?: number;
  showActions?: boolean;
};

export default function PosterCard({
  movie,
  series,
  size = "medium",
  showOverlay = true,
  showGenres = true,
  showRating = true,
  showAge = true,
  showDuration = true,
  progress,
  showActions = true,
  watchHistory = []
}: PosterCardProps & { watchHistory?: WatchHistoryItem[] }) {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);
  const [showOverlayState, setShowOverlayState] = useState(false);
  const [detail, setDetail] = useState<any>(null);
  const [isFavorited, setIsFavorited] = useState(false);

  // Helper function to get episode from watch history
  const getEpisodeFromHistory = (slug: string): number | null => {
    const historyItem = watchHistory.find(item => item.slug === slug && item.is_series);
    return historyItem?.episode_number || null;
  };
  const [showAddToListDialog, setShowAddToListDialog] = useState(false);

  const item = movie || series;
  const isSeries = !!series;

  // Size configurations
  const sizeConfig = {
    small: { width: "w-[140px] md:w-[160px]", imageHeight: "h-[200px] md:h-[240px]" },
    medium: { width: "w-[160px] md:w-[180px]", imageHeight: "h-[240px] md:h-[270px]" },
    large: { width: "w-[180px] md:w-[200px]", imageHeight: "h-[270px] md:h-[300px]" }
  };

  const config = sizeConfig[size];

  // Check if item is in favorites
  useEffect(() => {
    const checkFavoriteStatus = async () => {
      const token = localStorage.getItem('phimhub:token');
      if (token) {
        // Check API for authenticated users
        try {
          const { InteractionsApi } = await import('../../services/movies/interactions');
          const response = await InteractionsApi.checkFavorite(item.id, isSeries ? 'series' : 'movie');
          setIsFavorited(response.isFavorited);
        } catch (error) {
          console.error('Error checking favorite status:', error);
          // Fallback to localStorage
          const favoritesData = JSON.parse(localStorage.getItem('phimhub:favorites') || '[]');
          const isInFavorites = favoritesData.some((fav: any) => (fav.id || fav) === item.id);
          setIsFavorited(isInFavorites);
        }
      } else {
        // Check localStorage for non-authenticated users
        const favoritesData = JSON.parse(localStorage.getItem('phimhub:favorites') || '[]');
        const isInFavorites = favoritesData.some((fav: any) => (fav.id || fav) === item.id);
        setIsFavorited(isInFavorites);
      }
    };
    
    checkFavoriteStatus();
  }, [item.id, isSeries]);

  // Listen for favorites updates
  useEffect(() => {
    const handleFavoritesUpdate = async () => {
      const token = localStorage.getItem('phimhub:token');
      if (token) {
        // Check API for authenticated users
        try {
          const { InteractionsApi } = await import('../../services/movies/interactions');
          const response = await InteractionsApi.checkFavorite(item.id, isSeries ? 'series' : 'movie');
          setIsFavorited(response.isFavorited);
        } catch (error) {
          console.error('Error checking favorite status:', error);
          // Fallback to localStorage
          const favoritesData = JSON.parse(localStorage.getItem('phimhub:favorites') || '[]');
          const isInFavorites = favoritesData.some((fav: any) => (fav.id || fav) === item.id);
          setIsFavorited(isInFavorites);
        }
      } else {
        // Check localStorage for non-authenticated users
        const favoritesData = JSON.parse(localStorage.getItem('phimhub:favorites') || '[]');
        const isInFavorites = favoritesData.some((fav: any) => (fav.id || fav) === item.id);
        setIsFavorited(isInFavorites);
      }
    };

    window.addEventListener('favoritesUpdated', handleFavoritesUpdate);
    return () => window.removeEventListener('favoritesUpdated', handleFavoritesUpdate);
  }, [item.id, isSeries]);

  // Delay overlay by 1s on hover
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    if (isHovered && showOverlay) {
      timer = setTimeout(() => setShowOverlayState(true), 1000);
    } else {
      setShowOverlayState(false);
      if (timer) clearTimeout(timer);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isHovered, showOverlay]);

  // Load detail when overlay is shown
  useEffect(() => {
    if (showOverlayState && item.provider && !detail) {
      MovieService.use(item.provider as any).getMovieById(item.id)
        .then(detailData => setDetail(detailData))
        .catch(() => {});
    }
  }, [showOverlayState, item.provider, item.id, detail]);

  const handleCardClick = async () => {
    if (item.provider) {
      try {
        const detailData = await MovieService.use(item.provider as any).getMovieById(item.id);
        const isSeriesData = detailData?.isSeries === true;
        // Use slug if available, otherwise use id
        const identifier = detailData?.slug || item.id;
        navigate(`${isSeriesData ? "/series" : "/movies"}/${identifier}?provider=${item.provider}`);
        return;
      } catch {
        // fallback
      }
    }
    navigate(`/${isSeries ? "series" : "movies"}/${item.id}?provider=local`);
  };

  const handleWatchClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (item.provider) {
      try {
        const detailData = await MovieService.use(item.provider as any).getMovieById(item.id);
        const isSeriesData = detailData?.isSeries === true;
        // Use slug if available, otherwise use id
        const identifier = detailData?.slug || item.id;
        
        if (isSeriesData) {
          // Check for episode in watch history
          const episodeNumber = getEpisodeFromHistory(identifier);
          const watchUrl = episodeNumber 
            ? `/watch/series/${identifier}?s=1&e=${episodeNumber}&ep=tap-${episodeNumber}&provider=${item.provider}`
            : `/watch/series/${identifier}?s=1&e=1&ep=tap-1&provider=${item.provider}`;
          navigate(watchUrl);
        } else {
          navigate(`/watch/movie/${identifier}?provider=${item.provider}`);
        }
        return;
      } catch {
        // fallback
      }
    }
    
    // Fallback logic
    if (isSeries) {
      const episodeNumber = getEpisodeFromHistory(item.id);
      const watchUrl = episodeNumber 
        ? `/watch/series/${item.id}?s=1&e=${episodeNumber}&ep=tap-${episodeNumber}&provider=local`
        : `/watch/series/${item.id}?s=1&e=1&ep=tap-1&provider=local`;
      navigate(watchUrl);
    } else {
      navigate(`/watch/movie/${item.id}?provider=local`);
    }
  };

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    favoritesDebug.log('Favorite click started', { itemId: item.id, isFavorited: isFavorited });
    favoritesDebug.checkEventHandling(e);
    
    const token = localStorage.getItem('phimhub:token');
    if (token) {
      // Use API for authenticated users
      try {
        const { InteractionsApi } = await import('../../services/movies/interactions');
        const action = isFavorited ? 'remove' : 'add';
        
        favoritesDebug.log(`Attempting to ${action} favorite`, { itemId: item.id });
        
        if (isFavorited) {
          await InteractionsApi.removeFavorite(item.id, isSeries ? 'series' : 'movie');
        } else {
          await InteractionsApi.addFavorite(item.id, isSeries ? 'series' : 'movie');
        }
        
        favoritesDebug.log(`Successfully ${action}ed favorite`, { itemId: item.id });
        setIsFavorited(!isFavorited);
        window.dispatchEvent(new CustomEvent('favoritesUpdated'));
      } catch (error) {
        console.error('Error updating favorites:', error);
        favoritesDebug.log('Error updating favorites', error);
        alert('Không thể cập nhật yêu thích. Vui lòng thử lại.');
      }
    } else {
      // Fallback to localStorage for non-authenticated users
      const favoritesData = JSON.parse(localStorage.getItem('phimhub:favorites') || '[]');
      const isInFavorites = favoritesData.some((fav: any) => (fav.id || fav) === item.id);
      
      if (isInFavorites) {
        const newFavorites = favoritesData.filter((fav: any) => (fav.id || fav) !== item.id);
        localStorage.setItem('phimhub:favorites', JSON.stringify(newFavorites));
        favoritesDebug.log('Removed from localStorage favorites', { itemId: item.id });
      } else {
        const itemData = {
          id: item.id,
          title: item.title,
          poster: item.poster,
          year: item.year,
          provider: item.provider || "local"
        };
        favoritesData.push(itemData);
        localStorage.setItem('phimhub:favorites', JSON.stringify(favoritesData));
        favoritesDebug.log('Added to localStorage favorites', { itemId: item.id });
      }
      
      window.dispatchEvent(new CustomEvent('favoritesUpdated'));
    }
  };

  const handleAddToListClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowAddToListDialog(true);
  };

  return (
    <div 
      className={`group relative ${config.width} cursor-pointer`}
      data-poster-id={item.id}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ zIndex: isHovered ? 10000 : 'auto', overflow: 'visible' }}
    >
      {/* Original Poster */}
      <div 
        onClick={handleCardClick}
        className="relative overflow-hidden rounded-xl bg-dark-800/50 ring-1 ring-dark-600/50 hover:ring-primary-400/50 hover:scale-105 transition-all duration-200"
      >
        <FallbackImage
          src={getImageUrl(item.poster)}
          alt={item.title}
          className="aspect-[2/3] w-full object-cover"
          onError={() => {
            console.warn('Failed to load poster image:', item.poster);
          }}
          onLoad={() => {
            console.log('Poster image loaded successfully:', item.poster);
          }}
        />
        
        {/* Rating badge - Top right */}
        {showRating && item.rating && (
          <div className="absolute top-2 right-2 bg-yellow-500/95 text-black px-2 py-1 rounded-md text-xs font-bold flex items-center gap-1 shadow-lg">
            <span className="text-yellow-600">⭐</span>
            <span className="font-bold">{item.rating.toFixed(1)}</span>
          </div>
        )}
        
        {/* Age rating - Top left */}
        {showAge && item.age && (
          <div className="absolute top-2 left-2 bg-red-600/95 text-white px-2 py-1 rounded text-xs font-bold shadow-lg">
            {item.age}
          </div>
        )}


        {/* Progress bar */}
        {typeof progress === "number" && progress > 0 && (
          <div className="absolute bottom-0 left-0 h-1 w-full bg-white/10">
            <div className="h-full bg-cyan-400" style={{ width: `${progress}%` }} />
          </div>
        )}

      </div>

      {/* Movie/Series Title - Outside Poster */}
      <div className="mt-3 space-y-1">
        {/* Main title - Vietnamese */}
        <h3 className="text-white font-bold text-sm line-clamp-2 group-hover:text-primary-300 transition-colors duration-200 leading-tight">
          {item.title}
        </h3>
        
        {/* English title if available */}
        {item.originalTitle && item.originalTitle !== item.title && (
          <p className="text-white/80 text-xs font-medium line-clamp-1">
            {item.originalTitle}
          </p>
        )}
        
        {/* Year display */}
        {item.year && (
          <p className="text-white/60 text-xs">
            {item.year}
          </p>
        )}
      </div>

      {/* Hover Overlay - Align with poster edges (appears after 1s) */}
      {showOverlayState && (
        <div 
          className="absolute top-0 z-[9999] w-[400px] bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-sm rounded-2xl border border-white/20 shadow-2xl overflow-hidden pointer-events-auto"
          style={{
            left: '50%',
            transform: 'translateX(-50%)',
            // Smart positioning to prevent cutoff
            ...(isHovered && (() => {
              const rect = (document.querySelector(`[data-poster-id="${item.id}"]`) as HTMLElement)?.getBoundingClientRect();
              if (!rect) return {};
              
              const viewportWidth = window.innerWidth;
              const overlayWidth = 400;
              const posterWidth = rect.width;
              const margin = 20; // 20px margin from viewport edge
              
              // Calculate overlay position when centered
              const overlayLeft = rect.left + (posterWidth / 2) - (overlayWidth / 2);
              const overlayRight = overlayLeft + overlayWidth;
              
              // Check if overlay would be cut off
              const leftCutoff = overlayLeft < margin;
              const rightCutoff = overlayRight > viewportWidth - margin;
              
              if (leftCutoff && !rightCutoff) {
                // Shift overlay to the right to prevent left cutoff
                const shiftRight = margin - overlayLeft;
                return { left: `calc(50% + ${shiftRight}px)`, transform: 'translateX(-50%)' };
              } else if (rightCutoff && !leftCutoff) {
                // Shift overlay to the left to prevent right cutoff
                const shiftLeft = overlayRight - (viewportWidth - margin);
                return { left: `calc(50% - ${shiftLeft}px)`, transform: 'translateX(-50%)' };
              } else if (leftCutoff && rightCutoff) {
                // If both sides would be cut off, center it as much as possible
                return { left: '50%', transform: 'translateX(-50%)' };
              }
              return {};
            })())
          }}
        >
          <div className="relative">
            {/* Background Image with Gradient Overlay */}
            <div className="h-56 bg-cover bg-center relative" style={{ backgroundImage: `url(${item.poster})` }}>
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/60 to-transparent" />
              
              {/* Quality Badge */}
              <div className="absolute top-3 right-3 bg-yellow-500/90 text-black px-2 py-1 rounded-md text-xs font-bold">
                FHD
              </div>
            </div>
            
            {/* Content */}
            <div className="p-5 relative z-10">
              {/* Title */}
              <h3 className="text-xl font-bold text-white mb-4 line-clamp-2 leading-tight">{item.title}</h3>
              
              {/* Action Buttons */}
              <div className="flex gap-2 mb-4">
                <button
                  onClick={handleWatchClick}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white px-3 py-2.5 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-blue-500/25 text-sm"
                >
                  <span className="flex items-center justify-center gap-1.5">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M8 5v10l8-5-8-5z"/>
                    </svg>
                    Xem ngay
                  </span>
                </button>
                <button
                  onClick={handleFavoriteClick}
                  className={`px-3 py-2.5 rounded-xl transition-all duration-200 ${
                    isFavorited 
                      ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30' 
                      : 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
                  }`}
                  title={isFavorited ? "Xóa khỏi yêu thích" : "Thêm vào yêu thích"}
                >
                  <svg className="w-4 h-4" fill={isFavorited ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </button>
                <button
                  onClick={handleAddToListClick}
                  className="px-3 py-2.5 rounded-xl bg-white/10 text-white hover:bg-white/20 border border-white/20 transition-all duration-200"
                  title="Thêm vào danh sách"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </button>
                <button
                  onClick={handleCardClick}
                  className="px-3 py-2.5 rounded-xl bg-white/10 text-white hover:bg-white/20 border border-white/20 transition-all duration-200"
                  title="Xem chi tiết"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
              </div>

              {/* Metadata Tags */}
              <div className="flex flex-wrap gap-2 mb-3">
                {item.rating && (
                  <span className="bg-yellow-500/20 text-yellow-300 px-3 py-1 rounded-lg text-sm font-medium">
                    IMDb {item.rating}
                  </span>
                )}
                {item.year && (
                  <span className="bg-gray-700/50 text-gray-300 px-3 py-1 rounded-lg text-sm">
                    {item.year}
                  </span>
                )}
                {item.duration && (
                  <span className="bg-gray-700/50 text-gray-300 px-3 py-1 rounded-lg text-sm">
                    {item.duration} phút
                  </span>
                )}
                {isSeries && series?.totalEpisodes && (
                  <span className="bg-gray-700/50 text-gray-300 px-3 py-1 rounded-lg text-sm">
                    {series.totalEpisodes} tập
                  </span>
                )}
                {item.age && (
                  <span className="bg-gray-700/50 text-gray-300 px-3 py-1 rounded-lg text-sm">
                    {item.age}
                  </span>
                )}
              </div>
              
              {/* Genres */}
              {item.genres && item.genres.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {item.genres.slice(0, 4).map((genre: any, index: number) => (
                    <span
                      key={index}
                      className="bg-gray-700/50 text-gray-300 px-3 py-1 rounded-lg text-sm"
                    >
                      {typeof genre === 'string' ? genre : (genre.name || genre.slug || genre)}
                    </span>
                  ))}
                </div>
              )}
              
              {/* Synopsis */}
              {detail?.overview && (
                <p className="text-sm text-gray-300 leading-relaxed line-clamp-3">
                  {detail.overview}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add to List Dialog */}
      <AddToListDialog
        isOpen={showAddToListDialog}
        onClose={() => setShowAddToListDialog(false)}
        movieId={item.id}
        movieType={isSeries ? 'series' : 'movie'}
        movieTitle={item.title}
      />
    </div>
  );
}
