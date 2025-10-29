// src/features/movies/pages/MovieDetail.tsx
import { useNavigate } from "react-router-dom";
import { Link, useLocation, useParams } from "react-router-dom";
import { useEffect, useState, useMemo } from "react";
import { useAuth } from '../../../store/auth';
import AdminOnly from "@shared/components/AdminOnly";
import EditButton from "@shared/components/EditButton";
import EditMovieModal from "@features/admin/components/EditMovieModal";
import React from "react";
import { MovieService } from "../../../services/movies";
import { MovieService as MovieServiceProvider } from "../../../services/movies";
import { useNotification } from "../../../shared/hooks/useNotification";
import { NotificationContainer } from "../../../shared/components/NotificationContainer";
import { useConfirm } from "../../../shared/components/ConfirmModalProvider";
import type { MovieDetail } from "../../../services/movies/model";
import { getGenreDisplayName } from "../../../utils/genreMapper";
import { AddToListDialog } from "../../../shared/components/AddToListDialog";
import LoginRequiredModal from "../../../shared/components/LoginRequiredModal";
import { useLoginRequired } from "../../../shared/hooks/useLoginRequired";
import ActorCard from "@shared/components/ActorCard";
import DirectorCard from "@shared/components/DirectorCard";
import { actorService } from "../../../services/actors";
import { directorService } from "../../../services/directors";
import { recommendationsService, RecommendationItem } from "../../../services/recommendations";
import { useRealtimeCommentsSimple as useRealtimeComments } from "../../../shared/hooks/useRealtimeCommentsSimple";
import { formatDate } from "../../../shared/utils/dateFormatter";
import Avatar from "@shared/components/Avatar";

export default function MovieDetail() {
  const { slug } = useParams();
  const { search } = useLocation();
  const [openEdit, setOpenEdit] = useState(false);
  const { notifications, removeNotification, success, error: showError } = useNotification();
  const { showConfirm } = useConfirm();
  const [movie, setMovie] = useState<MovieDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"versions" | "episodes" | "cast" | "recommendations">("versions");
  const [isFavorited, setIsFavorited] = useState(false);
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const [userRating, setUserRating] = useState(0);
  
  // Add to List Dialog state
  const [showAddToListDialog, setShowAddToListDialog] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState<{id: string, title: string, type: 'movie' | 'series'} | null>(null);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<string | undefined>(undefined);
  const navigate = useNavigate();
  const [comments, setComments] = useState<any[]>([]);
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyText, setReplyText] = useState('');
  const [editingComment, setEditingComment] = useState<number | null>(null);
  const [editText, setEditText] = useState('');
  const [actorsData, setActorsData] = useState<{[key: string]: {id: number, name: string, photo_url?: string}}>({});
  const [directorsData, setDirectorsData] = useState<{[key: string]: {id: number, name: string, photo_url?: string}}>({});
  const [recommendations, setRecommendations] = useState<RecommendationItem[]>([]);
  const [recommendationsLoading, setRecommendationsLoading] = useState(false);
  const { user } = useAuth();
  const { showLoginRequired, modalConfig, showLoginRequiredModal, hideLoginRequiredModal, handleLogin } = useLoginRequired();

  // Get provider from URL params
  const urlParams = new URLSearchParams(search);
  const provider = urlParams.get('provider') || 'local';

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setError(null);
    setActiveTab("versions"); // Reset to versions tab when navigating to new movie
    MovieService.use(provider as any)
      .getMovieById(slug)
      .then((d) => {
        setMovie(d);
        
        // Tự động redirect dựa trên isSeries
        if (d) {
          const params = new URLSearchParams(window.location.search);
          const currentPath = window.location.pathname;
          
          // Nếu là series nhưng đang ở /movies/ -> redirect sang /series/
          if (d.isSeries === true && currentPath.startsWith('/movies/')) {
            const newPath = `/series/${slug}${params.toString() ? `?${params.toString()}` : ''}`;
            window.location.replace(newPath);
            return;
          }
          
          // Nếu là phim lẻ nhưng đang ở /series/ -> redirect sang /movies/
          if (d.isSeries === false && currentPath.startsWith('/series/')) {
            const newPath = `/movies/${slug}${params.toString() ? `?${params.toString()}` : ''}`;
            window.location.replace(newPath);
            return;
          }
        }
      })
      .catch((e: any) => setError(e?.message || "Không tải được dữ liệu"))
      .finally(() => setLoading(false));
  }, [slug, provider]);

  // Load recommendations when movie is loaded
  useEffect(() => {
    const loadRecommendations = async () => {
      if (!movie?.id || !slug) return;
      
      setRecommendationsLoading(true);
      try {
        const recs = await recommendationsService.getRecommendations(slug, 15);
        setRecommendations(recs);
      } catch (error) {
        console.error('Error loading recommendations:', error);
      } finally {
        setRecommendationsLoading(false);
      }
    };

    loadRecommendations();
  }, [movie?.id, slug]);


  // chọn version mặc định khi dữ liệu sẵn sàng
  useEffect(() => {
    if (!movie?.versions || movie.versions.length === 0) return;
    if (!selectedVersion) setSelectedVersion(movie.versions[0].key);
  }, [movie?.versions, selectedVersion]);

  // Load comments
  useEffect(() => {
    (async () => {
      if (!movie) return;
      try {
        const api = (await import('../../../services/movies/interactions')).InteractionsApi;
        const contentId = Number((movie as any).contentId);
        console.log('🔄 Loading comments for movie:', { id: movie?.id, contentId, provider, slug });
        
        if (contentId) {
          console.log('📊 Loading internal comments for contentId:', contentId);
          const list = await api.listComments(contentId, 1, 20);
          console.log('📋 Internal comments loaded:', list.length);
          setComments(list);
        } else if (movie?.id) {
          const providerName = String(provider || 'local');
          console.log('📊 Loading external comments for movie:', movie.id, 'provider:', providerName);
          const list = await api.listExternalComments(providerName, String(movie.id), 1, 20);
          console.log('📋 External comments loaded:', list.length);
          setComments(list);
        } else {
          console.error('❌ No movie ID or contentId found for loading comments!');
          setComments([]);
        }
      } catch (e) {
        console.error('❌ Error loading comments:', e);
        setComments([]);
      }
    })();
  }, [movie, provider]);

  // Refresh comments when avatar changes
  useEffect(() => {
    const handleAvatarUpdate = () => {
      if (movie) {
        (async () => {
          try {
            const api = (await import('../../../services/movies/interactions')).InteractionsApi;
            const contentId = Number((movie as any).contentId);
            if (contentId) {
              const list = await api.listComments(contentId, 1, 20);
              setComments(list);
            } else if (movie?.id) {
              const providerName = String(provider || 'local');
              const list = await api.listExternalComments(providerName, String(movie.id), 1, 20);
              setComments(list);
            }
          } catch (e) {
            console.error('❌ Error refreshing comments:', e);
          }
        })();
      }
    };

    window.addEventListener('avatarUpdated', handleAvatarUpdate);
    return () => {
      window.removeEventListener('avatarUpdated', handleAvatarUpdate);
    };
  }, [movie, provider]);

  // Realtime comments
  const contentId = movie ? String(Number((movie as any).contentId) || 'external') : undefined;
  const movieId = movie && !(movie as any).contentId ? String(movie.id) : undefined;
  
  useRealtimeComments({
    contentId,
    provider: String(provider || 'local'),
    movieId,
    enabled: false, // Disabled to prevent SSE spam
    onNewComment: (newComments) => {
      // console.log('🔄 Updating comments from realtime:', newComments.length);
      setComments(newComments);
    },
    onCommentUpdate: (updatedComments) => {
      // console.log('🔄 Updating comments from realtime update:', updatedComments.length);
      setComments(updatedComments);
    },
    onCommentDeletion: (deletedComments) => {
      // console.log('🔄 Updating comments from realtime deletion:', deletedComments.length);
      setComments(deletedComments);
    }
  });

  // Check if movie is in favorites/watchlist when movie data loads
  useEffect(() => {
    if (!movie) return;
    
    const checkFavoriteStatus = async () => {
      const token = localStorage.getItem('phimhub:token');
      if (token) {
        try {
          const { favoritesApi } = await import('../../../services/favorites');
          const isFavorited = await favoritesApi.checkFavorite(movie.id, 'movie');
          setIsFavorited(isFavorited);
        } catch (error) {
          console.error('Error checking favorite status:', error);
          // Fallback to localStorage
          const favoritesData = JSON.parse(localStorage.getItem('phimhub:favorites') || '[]');
          const isInFavorites = favoritesData.some((item: any) => (item.id || item) === movie.id);
          setIsFavorited(isInFavorites);
        }
      } else {
        // Check localStorage for non-authenticated users
        const favoritesData = JSON.parse(localStorage.getItem('phimhub:favorites') || '[]');
        const isInFavorites = favoritesData.some((item: any) => (item.id || item) === movie.id);
        setIsFavorited(isInFavorites);
      }
    };

    const slug = movie.id;
    const watchlistData = JSON.parse(localStorage.getItem('phimhub:watchlist') || '[]');
    const isInWatchlist = watchlistData.some((item: any) => (item.id || item) === slug);
    
    checkFavoriteStatus();
    setIsInWatchlist(isInWatchlist);
  }, [movie]);

  // Event handlers
  const handleRating = () => {
    setShowRatingModal(true);
  };

  const handleFavorite = async () => {
    if (!movie) return;
    const token = localStorage.getItem('phimhub:token');
    const movieId = movie.id; // Use string ID directly
    if (token) {
      const curr = isFavorited;
      setIsFavorited(!curr);
      try {
        const { favoritesApi } = await import('../../../services/favorites');
        if (curr) {
          await favoritesApi.removeFromFavorites(movieId, 'movie');
          success('Thành công', 'Đã xóa khỏi danh sách yêu thích');
        } else {
          await favoritesApi.addToFavorites({ movieId, movieType: 'movie', provider: provider || 'local' });
          success('Thành công', 'Đã thêm vào danh sách yêu thích');
        }
        // Dispatch event to notify other components
        window.dispatchEvent(new CustomEvent('favoritesUpdated'));
      } catch (error) {
        console.error('Error updating favorite:', error);
        setIsFavorited(curr); // Revert on error
        showError('Lỗi', 'Có lỗi xảy ra khi cập nhật yêu thích');
      }
    } else {
      const favoritesData = JSON.parse(localStorage.getItem('phimhub:favorites') || '[]');
      const isInFavorites = favoritesData.some((item: any) => (item.id || item) === movieId);
      if (isInFavorites) {
        const newFavorites = favoritesData.filter((item: any) => (item.id || item) !== movieId);
        localStorage.setItem('phimhub:favorites', JSON.stringify(newFavorites));
        setIsFavorited(false);
        success('Thành công', 'Đã xóa khỏi danh sách yêu thích');
      } else {
        const movieData = { id: movieId, title: movie.title, img: movie.poster, provider: provider || 'local' };
        favoritesData.push(movieData);
        localStorage.setItem('phimhub:favorites', JSON.stringify(favoritesData));
        setIsFavorited(true);
        success('Thành công', 'Đã thêm vào danh sách yêu thích');
      }
      window.dispatchEvent(new CustomEvent('favoritesUpdated'));
    }
  };

  const handleAddToWatchlist = () => {
    if (!movie) return;
    
    // Set selected movie data and show dialog
    setSelectedMovie({
      id: String(movie.id),
      title: movie.title,
      type: movie.isSeries ? 'series' : 'movie'
    });
    setShowAddToListDialog(true);
  };

  const handleComment = () => {
    // Scroll to comments section
    const commentsSection = document.getElementById('comments-section');
    if (commentsSection) {
      commentsSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleVersionSelect = (version: any) => {
    if (!movie?.id || !slug) return;
    const isSeries = movie.isSeries === true;
    const path = isSeries ? `/watch/series/${slug}` : `/watch/movie/${slug}`;
    const params = new URLSearchParams();
    params.set('provider', String(provider));
    params.set('version', String(version.key));
    // Dùng hard navigation để tránh mọi vấn đề router state
    window.location.href = `${path}?${params.toString()}`;
  };

  const handleEpisodeSelect = (episode: any) => {
    console.log("Selected episode:", episode);
    // TODO: Handle episode selection
  };

  const handleCastClick = (actor: string) => {
    console.log("Clicked on actor:", actor);
    const actorData = actorsData[actor];
    if (actorData?.id) {
      navigate(`/actor/${actorData.id}`);
    }
  };

  const handleRecommendationClick = (recommendation: any) => {
    console.log("Clicked on recommendation:", recommendation);
    
    // Navigate to recommended movie/series detail page
    const isSeries = recommendation.is_series === true;
    const path = isSeries ? `/series/${recommendation.slug}` : `/movies/${recommendation.slug}`;
    const params = new URLSearchParams();
    params.set('provider', 'local');
    
    // Navigate to the recommended movie/series
    navigate(`${path}?${params.toString()}`);
  };

  const isSeries = useMemo(() => {
    if (!movie) return false;
    
    // Kiểm tra từ backend data
    if (movie.isSeries !== undefined) {
      return movie.isSeries;
    }
    
    // Fallback logic: nếu có episodes thì là series
    if (movie.episodes && movie.episodes.length > 0) {
      return true;
    }
    
    return false;
  }, [movie]);

  const displayGenres = useMemo(() => {
    if (!movie?.genres) return [] as string[];
    
    // Mapping từ slug sang tên tiếng Việt
    const genreMapping: { [key: string]: string } = {
      "chinh-kich": "Chính kịch",
      "tam-ly": "Tâm lý", 
      "hai-huoc": "Hài hước",
      "tinh-cam": "Tình cảm",
      "hinh-su": "Hình sự",
      "hanh-dong": "Hành động",
      "bi-an": "Bí ẩn",
      "kinh-di": "Kinh dị",
      "phieu-luu": "Phiêu lưu",
      "khoa-hoc": "Khoa học",
      "vien-tuong": "Viễn tưởng",
      "co-trang": "Cổ trang",
      "gia-dinh": "Gia đình",
      "chien-tranh": "Chiến tranh",
      "lich-su": "Lịch sử",
      "mien-tay": "Miền Tây",
      "hoc-duong": "Học đường",
      "tai-lieu": "Tài liệu",
      "am-nhac": "Âm nhạc"
    };
    
    return (movie.genres as any[])
      .map((g) => {
        const genreSlug = typeof g === "string" ? g : g?.name || g?.title || "";
        return genreMapping[genreSlug] || genreSlug;
      })
      .filter(Boolean);
  }, [movie?.genres]);

  // Debug log removed to prevent console spam

  const displayCountry = useMemo(() => {
    const c: any = movie?.country;
    if (!c) return "";
    if (typeof c === "string") return c;
    if (Array.isArray(c)) return c.map((x) => (typeof x === "string" ? x : x?.name || "")).filter(Boolean).join(", ");
    return c?.name || "";
  }, [movie?.country]);

  const displayDirector = useMemo(() => {
    const d: any = movie?.director;
    if (!d) return "";
    if (typeof d === "string") return d;
    if (Array.isArray(d)) return d.map((x) => (typeof x === "string" ? x : x?.name || "")).filter(Boolean).join(", ");
    return d?.name || "";
  }, [movie?.director]);

  const displayStudio = useMemo(() => {
    const s: any = movie?.studio;
    if (!s) return "";
    if (typeof s === "string") return s;
    if (Array.isArray(s)) return s.map((x) => (typeof x === "string" ? x : x?.name || "")).filter(Boolean).join(", ");
    return s?.name || "";
  }, [movie?.studio]);

  const displayCast = useMemo(() => {
    const cs: any = movie?.cast;
    if (!cs) return [] as string[];
    if (Array.isArray(cs)) return cs.map((x) => (typeof x === "string" ? x : x?.name || "")).filter(Boolean);
    return [String(cs)];
  }, [movie?.cast]);

  // Fetch actors data when movie cast changes
  useEffect(() => {
    if (!movie?.cast) return;
    
    const fetchActorsData = async () => {
      const actorsMap: {[key: string]: {id: number, name: string, photo_url?: string}} = {};
      
      for (const actorName of displayCast) {
        try {
          const actors = await actorService.searchActors(actorName, 1);
          if (actors.length > 0) {
            actorsMap[actorName] = {
              id: actors[0].id,
              name: actors[0].name,
              photo_url: actors[0].photo_url
            };
          }
        } catch (error) {
          console.log(`Actor not found: ${actorName}`);
        }
      }
      
      setActorsData(actorsMap);
    };
    
    fetchActorsData();
  }, [movie?.cast, displayCast]);

  // Fetch directors data when movie director changes
  useEffect(() => {
    if (!displayDirector) return;
    
    const fetchDirectorsData = async () => {
      const directorsMap: {[key: string]: {id: number, name: string, photo_url?: string}} = {};
      
      // Split director string by comma and process each
      const directorNames = displayDirector.split(',').map(name => name.trim()).filter(Boolean);
      
      for (const directorName of directorNames) {
        try {
          const directors = await directorService.searchDirectors(directorName, 1);
          if (directors.length > 0) {
            directorsMap[directorName] = {
              id: directors[0].id,
              name: directors[0].name,
              photo_url: directors[0].photo_url
            };
          }
        } catch (error) {
          console.log(`Director not found: ${directorName}`);
        }
      }
      
      setDirectorsData(directorsMap);
    };
    
    fetchDirectorsData();
  }, [displayDirector]);

  // dữ liệu khởi tạo cho modal edit
  const editInit = useMemo(
    () =>
      movie
        ? {
            title: movie.title,
            originalTitle: movie.originalTitle || "",
            actors: movie.cast || [],
            directors: movie.director ? [movie.director] : [],
            origin: movie.country || "",
            language: "en",
            totalSeasons: 1,
            episodesPerSeason: 1,
            releaseYear: movie.year,
            age: movie.ageRating,
            genres: movie.genres || [],
            overview: movie.overview || "",
            poster: movie.poster || "",
            banner: movie.banner || "",
          }
        : null,
    [movie]
  );

  if (loading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center text-white/70">
        Đang tải dữ liệu…
        </div>
    );
  }

  if (error && !loading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center text-rose-400">
        {error}
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="flex min-h-[300px] items-center justify-center text-white/70">
        Không tìm thấy phim
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Banner */}
      <section className="relative left-1/2 right-1/2 -mx-[50vw] w-screen overflow-hidden -mt-16">
        <div
          className="h-[66vh] w-full bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${movie.banner || movie.poster})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-[#0f2233] via-transparent to-transparent" />
        </div>
      </section>

      {/* Content */}
      <section className="relative -mt-24 z-10">
        <div className="container mx-auto px-4">
          {/* Blurred Background for Content */}
          <div 
            className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat opacity-30"
            style={{
              backgroundImage: `url(${movie.banner || movie.poster})`,
              filter: 'blur(20px)',
              transform: 'scale(1.1)'
            }}
          />
          
          <div className="relative z-10 rounded-2xl bg-white/5 p-6 ring-1 ring-white/10 backdrop-blur-sm">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left - Poster & Info */}
              <div className="lg:col-span-1">
                <div className="relative mb-6">
                  <img
                    src={movie.poster}
                    alt={movie.title}
                    className="w-full max-w-[160px] mx-auto rounded-xl ring-1 ring-white/10"
                  />
                  <AdminOnly>
                    <div className="absolute -right-2 -top-2">
                      <EditButton onClick={() => setOpenEdit(true)} />
                    </div>
                  </AdminOnly>
                </div>

                <div className="space-y-4">
                  <div>
                    <h1 className="text-2xl font-bold text-white mb-2">{movie.title}</h1>
                    {movie.originalTitle && (
                      <p className="text-white/70 text-sm">{movie.originalTitle}</p>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {movie.rating && (
                      <span className="rounded-full bg-yellow-400/20 px-3 py-1 text-xs font-medium text-yellow-300">
                        IMDb {movie.rating}
                      </span>
                    )}
                    <span className="rounded-full bg-yellow-400/20 px-3 py-1 text-xs font-medium text-yellow-300">
                      FHD
                    </span>
                    <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/80">
                      {movie.year}
                    </span>
                    {movie.duration && (
                      <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/80">
                        {movie.duration} phút
                      </span>
                    )}
                    {movie.ageRating && (
                      <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/80">
                        {movie.ageRating}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {displayGenres.map((genre) => (
                      <span
                        key={genre}
                        className="rounded-full border border-white/20 px-3 py-1 text-xs text-white/80"
                      >
                        {getGenreDisplayName(genre)}
                      </span>
                    ))}
                  </div>

                  {movie.overview && (
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-2">Giới thiệu</h3>
                      <p className="text-white/80 text-sm leading-relaxed">{movie.overview}</p>
                    </div>
                  )}

                  <div className="space-y-2 text-sm">
                    {displayCountry && (
                      <div className="flex">
                        <span className="text-white/60 w-20">Quốc gia:</span>
                        <span className="text-white/80">{displayCountry}</span>
                      </div>
                    )}
                    {displayDirector && (
                      <div className="flex flex-col gap-2">
                        <span className="text-white/60">Đạo diễn:</span>
                        <div className="flex flex-wrap gap-2">
                          {displayDirector.split(',').map((director, index) => {
                            const directorName = director.trim();
                            const directorData = directorsData[directorName];
                            return (
                              <button
                                key={index}
                                onClick={() => {
                                  if (directorData?.id) {
                                    navigate(`/director/${directorData.id}`);
                                  }
                                }}
                                className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/80 hover:bg-white/20 hover:text-white transition-colors cursor-pointer"
                              >
                                {directorName}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    {displayCast.length > 0 && (
                      <div className="flex flex-col gap-2">
                        <span className="text-white/60">Diễn viên:</span>
                        <div className="flex flex-wrap gap-2">
                          {displayCast.slice(0, 8).map((actor, index) => {
                            const actorData = actorsData[actor];
                            return (
                              <button
                                key={index}
                                onClick={() => {
                                  if (actorData?.id) {
                                    navigate(`/actor/${actorData.id}`);
                                  }
                                }}
                                className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/80 hover:bg-white/20 hover:text-white transition-colors cursor-pointer"
                              >
                                {actor}
                              </button>
                            );
                          })}
                          {displayCast.length > 8 && (
                            <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-white/60">
                              +{displayCast.length - 8} khác
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                    {displayStudio && (
                      <div className="flex">
                        <span className="text-white/60 w-20">Hãng:</span>
                        <span className="text-white/80">{displayStudio}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right - Actions & Tabs */}
              <div className="lg:col-span-2 space-y-6">
              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-4">
                <Link
                  to={`/watch/movie/${slug}?provider=${provider}`}
                  className="flex items-center gap-2 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 px-6 py-3 font-semibold text-slate-900 shadow-lg hover:from-yellow-300 hover:to-orange-400 transition-all duration-200"
                >
                  <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z"/>
                    </svg>
                  Xem Ngay
                </Link>

                <button 
                  onClick={user ? handleRating : () => showLoginRequiredModal({ title: "Yêu cầu đăng nhập", message: "Bạn cần đăng nhập để đánh giá phim" })}
                  className="flex flex-col items-center gap-1 rounded-full bg-white/10 p-3 hover:bg-white/15 transition-all duration-200"
                  title={user ? "Đánh giá phim" : "Đăng nhập để đánh giá"}
                >
                  <svg className="h-5 w-5 fill-current text-white" viewBox="0 0 24 24">
                    <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>
                    </svg>
                  <span className="text-xs text-white">Đánh giá</span>
                </button>

                <button 
                  onClick={user ? handleFavorite : () => showLoginRequiredModal({ title: "Yêu cầu đăng nhập", message: "Bạn cần đăng nhập để thêm vào yêu thích" })}
                  className={`flex flex-col items-center gap-1 rounded-full p-3 hover:bg-white/15 transition-all duration-200 ${
                    user && isFavorited ? 'bg-red-500/20 text-red-400' : 'bg-white/10 text-white'
                  }`}
                  title={user ? (isFavorited ? "Bỏ yêu thích" : "Thêm vào yêu thích") : "Đăng nhập để yêu thích"}
                >
                  <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                  </svg>
                  <span className="text-xs">Yêu thích</span>
                </button>

                <button 
                  onClick={user ? handleAddToWatchlist : () => showLoginRequiredModal({ title: "Yêu cầu đăng nhập", message: "Bạn cần đăng nhập để thêm vào danh sách" })}
                  className={`flex flex-col items-center gap-1 rounded-full p-3 hover:bg-white/15 transition-all duration-200 ${
                    isInWatchlist ? 'bg-blue-500/20 text-blue-400' : 'bg-white/10 text-white'
                  }`}
                  title={user ? (isInWatchlist ? "Xóa khỏi danh sách" : "Thêm vào danh sách") : "Đăng nhập để thêm vào danh sách"}
                >
                  <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
                    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                  </svg>
                  <span className="text-xs">Thêm vào</span>
                </button>

                <button 
                  onClick={user ? handleComment : () => showLoginRequiredModal({ title: "Yêu cầu đăng nhập", message: "Bạn cần đăng nhập để bình luận" })}
                  className="flex flex-col items-center gap-1 rounded-full bg-white/10 p-3 hover:bg-white/15 transition-all duration-200 text-white"
                  title={user ? "Bình luận" : "Đăng nhập để bình luận"}
                >
                  <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
                    <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h4l4 4 4-4h4c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
                  </svg>
                  <span className="text-xs">Bình luận</span>
                </button>
              </div>

              {/* Tabs */}
              <div className="relative">
                <div className="flex gap-8 border-b border-white/20">
                  <button
                    onClick={() => setActiveTab("versions")}
                    className={`relative pb-3 font-medium transition-colors ${
                      activeTab === "versions" 
                        ? "text-yellow-400" 
                        : "text-white/70 hover:text-white"
                    }`}
                  >
                    Các bản chiếu
                    {activeTab === "versions" && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-yellow-400" />
                    )}
                  </button>
                  {isSeries && (
                    <button
                      onClick={() => setActiveTab("episodes")}
                      className={`relative pb-3 font-medium transition-colors ${
                        activeTab === "episodes" 
                          ? "text-yellow-400" 
                          : "text-white/70 hover:text-white"
                      }`}
                    >
                      Tập phim
                      {activeTab === "episodes" && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-yellow-400" />
                      )}
                    </button>
                  )}
                  <button
                    onClick={() => setActiveTab("cast")}
                    className={`relative pb-3 font-medium transition-colors ${
                      activeTab === "cast" 
                        ? "text-yellow-400" 
                        : "text-white/70 hover:text-white"
                    }`}
                  >
                    Diễn viên
                    {activeTab === "cast" && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-yellow-400" />
                    )}
                  </button>
                  <button
                    onClick={() => setActiveTab("recommendations")}
                    className={`relative pb-3 font-medium transition-colors ${
                      activeTab === "recommendations" 
                        ? "text-yellow-400" 
                        : "text-white/70 hover:text-white"
                    }`}
                  >
                    Đề xuất
                    {activeTab === "recommendations" && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-yellow-400" />
                    )}
                </button>
              </div>
            </div>

            {/* Tab Content */}
              {activeTab === "versions" && (
                <div className="rounded-2xl bg-gradient-to-br from-white/5 to-white/10 p-6 text-white/70 ring-1 ring-white/10 backdrop-blur-sm">
                  <div className="space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-yellow-500/20">
                        <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-bold text-white">Các bản chiếu</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[
                        { 
                          id: 1, 
                          type: "Phụ đề Việt",
                          quality: "FHD",
                          language: "Tiếng Nhật",
                          duration: movie?.duration ? `${movie.duration} phút` : "115 phút",
                          thumbnail: movie?.poster || "/api/placeholder/300/200",
                          isActive: true
                        },
                        { 
                          id: 2, 
                          type: "Lồng tiếng Việt",
                          quality: "HD",
                          language: "Tiếng Việt",
                          duration: movie?.duration ? `${movie.duration} phút` : "115 phút",
                          thumbnail: movie?.poster || "/api/placeholder/300/200",
                          isActive: false
                        }
                      ].map((version) => (
                        <div
                          key={version.id}
                          className={`group relative overflow-hidden rounded-2xl ring-2 transition-all duration-300 hover:scale-[1.02] ${
                            version.isActive 
                              ? 'ring-yellow-400/50 bg-gradient-to-br from-yellow-500/10 to-orange-500/10' 
                              : 'ring-white/10 bg-gradient-to-br from-slate-800/50 to-slate-900/50 hover:ring-white/20'
                          }`}
                        >
                          {/* Background with movie poster */}
                          <div 
                            className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-10"
                            style={{
                              backgroundImage: `url(${version.thumbnail})`,
                              filter: 'blur(12px) brightness(0.4)',
                              transform: 'scale(1.1)'
                            }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-br from-slate-900/80 via-slate-800/60 to-slate-900/80" />
                          
                          <div className="relative p-5 z-10">
                            {/* Header with type and quality */}
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-2">
                                <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                                  version.isActive 
                                    ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30' 
                                    : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                }`}>
                                  {version.type}
                                </span>
                                <span className="px-2 py-1 rounded-md bg-white/10 text-xs font-medium text-white/80">
                                  {version.quality}
                                </span>
                              </div>
                              {false && (
                                <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-green-500/20 text-green-300 text-xs font-medium">
                                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                                  Đang xem
                                </div>
                              )}
                            </div>
                            
                            {/* Movie info */}
                            <div className="space-y-3">
                              <h4 className="text-lg font-bold text-white line-clamp-2">
                                {movie?.title || "Phim"}
                              </h4>
                              
                              <div className="flex items-center gap-4 text-sm text-white/70">
                                <div className="flex items-center gap-1">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                                  </svg>
                                  <span>{version.language}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  <span>{version.duration}</span>
                                </div>
                              </div>
                            </div>
                            
                            {/* Action button */}
                            <div className="mt-4">
                              <button
                                onClick={() => handleVersionSelect(version)}
                                className={
                                  'w-full rounded-xl px-4 py-3 font-semibold transition-all duration-200 bg-gradient-to-r from-yellow-400 to-orange-500 text-slate-900 hover:from-yellow-300 hover:to-orange-400 shadow-lg shadow-yellow-500/25'
                                }
                              >
                                {'Xem bản này'}
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {isSeries && activeTab === "episodes" && (
                <div className="rounded-xl bg-white/5 p-4 text-white/70 ring-1 ring-white/10">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white">Danh sách tập phim</h3>
                    
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                        {Array.from({ length: 10 }, (_, i) => ({
                          id: i + 1,
                          title: `Tập ${i + 1}`,
                          duration: "45 phút",
                          description: `Nội dung tập ${i + 1}...`
                        })).map((episode, index) => {
                          const isActive = index === 0; // First episode as active for demo
                          return (
                            <button
                              key={episode.id}
                              onClick={() => handleEpisodeSelect(episode)}
                              className={`flex items-center gap-3 rounded-xl p-3 transition-all duration-200 ${
                                isActive 
                                  ? 'bg-yellow-500 text-gray-900 shadow-lg' 
                                  : 'bg-gray-700 hover:bg-gray-600 text-white'
                              }`}
                            >
                              {/* Play Icon */}
                              <div className={`flex h-8 w-8 items-center justify-center rounded-full ${
                                isActive ? 'bg-gray-900' : 'bg-white/10'
                              }`}>
                                <svg 
                                  className={`h-4 w-4 ${isActive ? 'text-yellow-500' : 'text-white'}`} 
                                  fill="currentColor" 
                                  viewBox="0 0 20 20"
                                >
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                                </svg>
                              </div>
                              
                              {/* Episode Text */}
                              <span className={`text-sm font-medium ${isActive ? 'text-gray-900' : 'text-white'}`}>
                                {episode.title}
                              </span>
                            </button>
                          );
                        })}
                    </div>
                    </div>
                </div>
              )}

              {activeTab === "cast" && (
                <div className="rounded-xl bg-white/5 p-4 text-white/70 ring-1 ring-white/10">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white">Diễn viên</h3>
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                      {displayCast.map((actor, index) => {
                        const actorData = actorsData[actor];
                        return (
                          <ActorCard
                            key={index}
                            actor={{
                              id: actorData?.id,
                              name: actor,
                              photo_url: actorData?.photo_url
                            }}
                            size="medium"
                            showRole={false}
                          />
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "recommendations" && (
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">Đề xuất</h3>
                  {recommendationsLoading ? (
                    <div className="text-white/60">Đang tải đề xuất...</div>
                  ) : recommendations.length > 0 ? (
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                      {recommendations.map((r) => (
                        <button
                          key={r.id}
                          onClick={() => handleRecommendationClick({
                            id: r.id,
                            title: r.title,
                            slug: r.slug,
                            is_series: r.is_series,
                            img: r.poster || r.banner || ''
                          })}
                          className="overflow-hidden rounded-xl bg-white/5 ring-1 ring-white/10 hover:ring-white/20 hover:scale-105 transition-all duration-200"
                        >
                          {r.poster || r.banner ? (
                            <img src={r.poster || r.banner} alt={r.title} className="aspect-[2/3] w-full object-cover" />
                          ) : (
                            <div className="aspect-[2/3] w-full bg-white/10" />
                          )}
                          <div className="p-2 text-sm text-left">{r.title}</div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-white/60">Chưa có dữ liệu đề xuất.</div>
                  )}
                </div>
              )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Comments Section */}
      <section id="comments-section" className="py-8">
        <div className="container mx-auto px-4">
          <div className="rounded-2xl bg-white/5 p-6 ring-1 ring-white/10 backdrop-blur-sm">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white mb-2">Bình luận ({comments.length})</h2>
              
              {/* Comment Tabs */}
              <div className="flex gap-8 border-b border-white/20 mb-6">
                <button className="relative pb-3 font-medium text-yellow-400">
                  Bình luận
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-yellow-400" />
                </button>
                <button className="relative pb-3 font-medium text-white/70 hover:text-white transition-colors">
                  Đánh giá
                </button>
              </div>

              {/* Comment Input */}
              <div className="mb-8">
                {!user ? (
                  <div className="text-center py-8">
                    <p className="text-white/70 mb-4">Vui lòng đăng nhập để tham gia bình luận.</p>
                    <button
                      onClick={() => showLoginRequiredModal({ title: "Yêu cầu đăng nhập", message: "Bạn cần đăng nhập để tham gia bình luận" })}
                      className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-xl font-medium hover:from-blue-600 hover:to-purple-700 transition-all duration-200"
                    >
                      Đăng nhập
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <textarea
                      id="comment-input"
                      placeholder="Viết bình luận"
                      className="w-full h-32 bg-white/10 border border-white/20 rounded-lg p-4 text-white placeholder-white/50 resize-none focus:outline-none focus:ring-2 focus:ring-yellow-400/50"
                      maxLength={1000}
                    />
                    <div className="absolute top-2 right-2 text-xs text-white/50">0/1000</div>
                    
                    <div className="flex items-center justify-between mt-4">
                      
                      <button
                      onClick={async () => {
                        const token = localStorage.getItem('phimhub:token');
                        const el = document.getElementById('comment-input') as HTMLTextAreaElement | null;
                        const text = (el?.value || '').trim();
                        if (!text) return;
                        try {
                          if (!token) {
                            showError('Lỗi', 'Bạn cần đăng nhập để bình luận.');
                            return;
                          }
                          // If movie has mapped DB contentId, use it; else fallback to provider+slug
                          const api = (await import('../../../services/movies/interactions')).InteractionsApi;
                          const contentId = Number((movie as any)?.contentId);
                          console.log('🎬 Movie data:', { id: movie?.id, contentId, provider, slug });
                          
                          let created: any = null;
                          if (contentId) {
                            console.log('📊 Using internal comment API for contentId:', contentId);
                            created = await api.createComment(contentId, text);
                            const list = await api.listComments(contentId, 1, 20);
                            setComments(list);
                          } else if (movie?.id) {
                            const providerName = String(provider || 'local');
                            console.log('📊 Using external comment API for movie:', movie.id, 'provider:', providerName);
                            created = await api.createExternalComment(providerName, String(movie.id), text);
                            const list = await api.listExternalComments(providerName, String(movie.id), 1, 20);
                            setComments(list);
                          } else {
                            console.error('❌ No movie ID or contentId found!');
                            showError('Lỗi', 'Không tìm thấy thông tin phim');
                            return;
                          }
                          success('Thành công', 'Bình luận đã được gửi');
                          el!.value = '';
                        } catch (e) {
                          console.error('❌ Lỗi gửi bình luận:', e);
                          showError('Lỗi', `Gửi bình luận thất bại: ${e instanceof Error ? e.message : 'Unknown error'}`);
                        }
                      }}
                      className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-yellow-400 to-orange-500 px-6 py-2 font-semibold text-slate-900 hover:from-yellow-300 hover:to-orange-400 transition-all"
                    >
                      <span>Gửi</span>
                      <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                        <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                      </svg>
                    </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Comments List (from API) */}
              <div className="space-y-6">
                {comments.map((c) => {
                  // Separate main comments and replies
                  const isMainComment = !c.parent_id;
                  const replies = comments.filter(reply => reply.parent_id === c.id);
                  
                  if (!isMainComment) return null; // Skip replies, they'll be rendered under main comments
                  
                  return (
                    <div key={c.id} className="space-y-4">
                      {/* Main Comment */}
                      <div className="flex gap-4">
                        <Avatar 
                          avatar={c.avatar}
                          username={c.username}
                          fullname={c.fullname}
                          size="medium"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-semibold text-white">{c.fullname || c.username || 'Ẩn danh'}</span>
                            <span className="text-sm text-white/50">{formatDate(c.created_at)}</span>
                          </div>
                          {editingComment === c.id ? (
                            <div className="mb-3">
                              <textarea
                                value={editText}
                                onChange={(e) => setEditText(e.target.value)}
                                className="w-full h-20 resize-none rounded-lg bg-white/10 p-3 text-sm text-white placeholder-white/50 ring-1 ring-white/20 focus:outline-none focus:ring-2 focus:ring-yellow-400/40"
                                maxLength={500}
                              />
                              <div className="mt-2 flex items-center justify-between">
                                <span className="text-xs text-white/50">{editText.length}/500</span>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => {
                                      setEditingComment(null);
                                      setEditText('');
                                    }}
                                    className="px-3 py-1 text-xs text-white/60 hover:text-white transition-colors"
                                  >
                                    Hủy
                                  </button>
                                  <button
                                    onClick={async () => {
                                      if (!editText.trim()) return;
                                      try {
                                        console.log(`🔄 Starting comment update for comment ${c.id}`);
                                        console.log(`📝 New content: "${editText}"`);
                                        console.log(`🎬 Movie data:`, { id: movie?.id, contentId: (movie as any)?.contentId, provider });
                                        
                                        const api = (await import('../../../services/movies/interactions')).InteractionsApi;
                                        const contentId = Number((movie as any)?.contentId);
                                        
                                        if (contentId) {
                                          console.log(`📊 Using internal comment API for contentId: ${contentId}`);
                                          await api.updateComment(c.id, editText);
                                          const list = await api.listComments(contentId, 1, 20);
                                          setComments(list);
                                        } else if (movie?.id) {
                                          const providerName = String(provider || 'local');
                                          console.log(`📊 Using external comment API for movie: ${movie.id}, provider: ${providerName}`);
                                          await api.updateExternalComment(c.id, editText);
                                          const list = await api.listExternalComments(providerName, String(movie.id), 1, 20);
                                          setComments(list);
                                        }
                                        
                                        console.log(`✅ Comment update successful`);
                                        success('Thành công', 'Bình luận đã được cập nhật');
                                        setEditingComment(null);
                                        setEditText('');
                                      } catch (e) {
                                        console.error(`❌ Comment update failed:`, e);
                                        showError('Lỗi', `Cập nhật bình luận thất bại: ${e instanceof Error ? e.message : 'Unknown error'}`);
                                      }
                                    }}
                                    className="px-4 py-1 text-xs bg-yellow-500 text-slate-900 rounded-lg hover:bg-yellow-400 transition-colors"
                                  >
                                    Lưu
                                  </button>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <p className="text-white/80 mb-3">{c.content}</p>
                          )}
                          <div className="flex items-center gap-4">
                            <button 
                              onClick={() => setReplyingTo(c.id)}
                              className="text-sm text-white/60 hover:text-white transition-colors"
                            >
                              Trả lời
                            </button>
                            {user && c.user_id === Number(user.id) && (
                              <>
                                <button 
                                  onClick={() => {
                                    setEditingComment(c.id);
                                    setEditText(c.content);
                                  }}
                                  className="text-sm text-white/60 hover:text-white transition-colors"
                                >
                                  Sửa
                                </button>
                                <button 
                                  onClick={async () => {
                                    showConfirm(
                                      'Xóa bình luận',
                                      'Bạn có chắc muốn xóa bình luận này? Hành động này không thể hoàn tác.',
                                      async () => {
                                        try {
                                          const api = (await import('../../../services/movies/interactions')).InteractionsApi;
                                        const contentId = Number((movie as any)?.contentId);
                                        if (contentId) {
                                          await api.deleteComment(c.id);
                                          const list = await api.listComments(contentId, 1, 20);
                                          setComments(list);
                                        } else if (movie?.id) {
                                          const providerName = String(provider || 'local');
                                          await api.deleteExternalComment(c.id);
                                          const list = await api.listExternalComments(providerName, String(movie.id), 1, 20);
                                          setComments(list);
                                        }
                                        success('Thành công', 'Bình luận đã được xóa');
                                      } catch (e) {
                                        showError('Lỗi', 'Xóa bình luận thất bại');
                                      }
                                    },
                                    {
                                      confirmText: 'Xóa',
                                      cancelText: 'Hủy',
                                      type: 'danger'
                                    }
                                  );
                                  }}
                                  className="text-sm text-red-400 hover:text-red-300 transition-colors"
                                >
                                  Xóa
                                </button>
                              </>
                            )}
                          </div>
                          
                          {/* Reply Form */}
                          {replyingTo === c.id && (
                            <div className="mt-3 p-3 bg-white/5 rounded-lg">
                              <textarea
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                placeholder="Viết trả lời..."
                                className="w-full h-20 resize-none rounded-lg bg-white/10 p-3 text-sm text-white placeholder-white/50 ring-1 ring-white/20 focus:outline-none focus:ring-2 focus:ring-yellow-400/40"
                                maxLength={500}
                              />
                              <div className="mt-2 flex items-center justify-between">
                                <span className="text-xs text-white/50">{replyText.length}/500</span>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => {
                                      setReplyingTo(null);
                                      setReplyText('');
                                    }}
                                    className="px-3 py-1 text-xs text-white/60 hover:text-white transition-colors"
                                  >
                                    Hủy
                                  </button>
                                  <button
                                    onClick={async () => {
                                      if (!replyText.trim()) return;
                                      try {
                                        const token = localStorage.getItem('phimhub:token');
                                        if (!token) {
                                          showError('Lỗi', 'Bạn cần đăng nhập để trả lời.');
                                          return;
                                        }
                                        const api = (await import('../../../services/movies/interactions')).InteractionsApi;
                                        const contentId = Number((movie as any)?.contentId);
                                        if (contentId) {
                                          await api.createComment(contentId, replyText, c.id);
                                          const list = await api.listComments(contentId, 1, 20);
                                          setComments(list);
                                        } else if (movie?.id) {
                                          const providerName = String(provider || 'local');
                                          await api.createExternalComment(providerName, String(movie.id), replyText, c.id);
                                          const list = await api.listExternalComments(providerName, String(movie.id), 1, 20);
                                          setComments(list);
                                        }
                                        setReplyingTo(null);
                                        setReplyText('');
                                      } catch (e) {
                                        showError('Lỗi', 'Gửi trả lời thất bại');
                                      }
                                    }}
                                    className="px-4 py-1 text-xs bg-yellow-500 text-slate-900 rounded-lg hover:bg-yellow-400 transition-colors"
                                  >
                                    Gửi
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Replies (Nested) */}
                      {replies.length > 0 && (
                        <div className="ml-14 space-y-3">
                          {replies.map((reply) => (
                            <div key={reply.id} className="flex gap-4">
                              <Avatar 
                                avatar={reply.avatar}
                                username={reply.username}
                                fullname={reply.fullname}
                                size="small"
                              />
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-semibold text-white text-sm">{reply.fullname || reply.username || 'Ẩn danh'}</span>
                                  <span className="text-xs text-white/50">{formatDate(reply.created_at)}</span>
                                </div>
                                {editingComment === reply.id ? (
                                  <div className="mb-2">
                                    <textarea
                                      value={editText}
                                      onChange={(e) => setEditText(e.target.value)}
                                      className="w-full h-16 resize-none rounded-lg bg-white/10 p-2 text-xs text-white placeholder-white/50 ring-1 ring-white/20 focus:outline-none focus:ring-2 focus:ring-yellow-400/40"
                                      maxLength={500}
                                    />
                                    <div className="mt-1 flex items-center justify-between">
                                      <span className="text-xs text-white/50">{editText.length}/500</span>
                                      <div className="flex gap-1">
                                        <button
                                          onClick={() => {
                                            setEditingComment(null);
                                            setEditText('');
                                          }}
                                          className="px-2 py-1 text-xs text-white/60 hover:text-white transition-colors"
                                        >
                                          Hủy
                                        </button>
                                        <button
                                          onClick={async () => {
                                            if (!editText.trim()) return;
                                            try {
                                              const api = (await import('../../../services/movies/interactions')).InteractionsApi;
                                              const contentId = Number((movie as any)?.contentId);
                                              if (contentId) {
                                                await api.updateComment(reply.id, editText);
                                                const list = await api.listComments(contentId, 1, 20);
                                                setComments(list);
                                              } else if (movie?.id) {
                                                const providerName = String(provider || 'local');
                                                await api.updateExternalComment(reply.id, editText);
                                                const list = await api.listExternalComments(providerName, String(movie.id), 1, 20);
                                                setComments(list);
                                              }
                                              setEditingComment(null);
                                              setEditText('');
                                              success('Thành công', 'Phản hồi đã được cập nhật');
                                            } catch (e) {
                                              showError('Lỗi', 'Cập nhật bình luận thất bại');
                                            }
                                          }}
                                          className="px-3 py-1 text-xs bg-yellow-500 text-slate-900 rounded-lg hover:bg-yellow-400 transition-colors"
                                        >
                                          Lưu
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <p className="text-white/80 text-sm mb-2">{reply.content}</p>
                                )}
                                <div className="flex items-center gap-4">
                                  <button 
                                    onClick={() => setReplyingTo(reply.id)}
                                    className="text-xs text-white/60 hover:text-white transition-colors"
                                  >
                                    Trả lời
                                  </button>
                                  {user && reply.user_id === Number(user.id) && (
                                    <>
                                      <button 
                                        onClick={() => {
                                          setEditingComment(reply.id);
                                          setEditText(reply.content);
                                        }}
                                        className="text-xs text-white/60 hover:text-white transition-colors"
                                      >
                                        Sửa
                                      </button>
                                      <button 
                                        onClick={async () => {
                                          showConfirm(
                                            'Xóa bình luận',
                                            'Bạn có chắc muốn xóa bình luận này? Hành động này không thể hoàn tác.',
                                            async () => {
                                              try {
                                                const api = (await import('../../../services/movies/interactions')).InteractionsApi;
                                              const contentId = Number((movie as any)?.contentId);
                                              if (contentId) {
                                                await api.deleteComment(reply.id);
                                                const list = await api.listComments(contentId, 1, 20);
                                                setComments(list);
                                              } else if (movie?.id) {
                                                const providerName = String(provider || 'local');
                                                await api.deleteExternalComment(reply.id);
                                                const list = await api.listExternalComments(providerName, String(movie.id), 1, 20);
                                                setComments(list);
                                              }
                                              success('Thành công', 'Phản hồi đã được xóa');
                                            } catch (e) {
                                              showError('Lỗi', 'Xóa bình luận thất bại');
                                            }
                                          },
                                          {
                                            confirmText: 'Xóa',
                                            cancelText: 'Hủy',
                                            type: 'danger'
                                          }
                                        );
                                        }}
                                        className="text-xs text-red-400 hover:text-red-300 transition-colors"
                                      >
                                        Xóa
                                      </button>
                                    </>
                                  )}
                                </div>
                                
                                {/* Reply to Reply Form */}
                                {replyingTo === reply.id && (
                                  <div className="mt-2 p-2 bg-white/5 rounded-lg">
                                    <textarea
                                      value={replyText}
                                      onChange={(e) => setReplyText(e.target.value)}
                                      placeholder="Viết trả lời..."
                                      className="w-full h-16 resize-none rounded-lg bg-white/10 p-2 text-xs text-white placeholder-white/50 ring-1 ring-white/20 focus:outline-none focus:ring-2 focus:ring-yellow-400/40"
                                      maxLength={500}
                                    />
                                    <div className="mt-1 flex items-center justify-between">
                                      <span className="text-xs text-white/50">{replyText.length}/500</span>
                                      <div className="flex gap-1">
                                        <button
                                          onClick={() => {
                                            setReplyingTo(null);
                                            setReplyText('');
                                          }}
                                          className="px-2 py-1 text-xs text-white/60 hover:text-white transition-colors"
                                        >
                                          Hủy
                                        </button>
                                        <button
                                          onClick={async () => {
                                            if (!replyText.trim()) return;
                                            try {
                                              const token = localStorage.getItem('phimhub:token');
                                              if (!token) {
                                                showError('Lỗi', 'Bạn cần đăng nhập để trả lời.');
                                                return;
                                              }
                                              const api = (await import('../../../services/movies/interactions')).InteractionsApi;
                                              const contentId = Number((movie as any)?.contentId);
                                              if (contentId) {
                                                await api.createComment(contentId, replyText, reply.id);
                                                const list = await api.listComments(contentId, 1, 20);
                                                setComments(list);
                                              } else if (movie?.id) {
                                                const providerName = String(provider || 'local');
                                                await api.createExternalComment(providerName, String(movie.id), replyText, reply.id);
                                                const list = await api.listExternalComments(providerName, String(movie.id), 1, 20);
                                                setComments(list);
                                              }
                                              setReplyingTo(null);
                                              setReplyText('');
                                            } catch (e) {
                                              showError('Lỗi', 'Gửi trả lời thất bại');
                                            }
                                          }}
                                          className="px-3 py-1 text-xs bg-yellow-500 text-slate-900 rounded-lg hover:bg-yellow-400 transition-colors"
                                        >
                                          Gửi
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
                {!comments.length && (
                  <div className="text-white/60">Chưa có bình luận</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Rating Modal */}
      {showRatingModal && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-slate-800 p-6 ring-1 ring-white/10">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-white">Đánh giá phim</h3>
              <button
                onClick={() => setShowRatingModal(false)}
                className="rounded-full p-1 text-white/60 hover:bg-white/10 hover:text-white"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="mb-6">
              <p className="mb-4 text-white/80">Chọn số sao đánh giá:</p>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setUserRating(star)}
                    className="text-3xl transition-colors hover:scale-110"
                  >
                    <svg
                      className={`h-8 w-8 ${
                        star <= userRating ? 'text-yellow-400' : 'text-white/30'
                      }`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  if (userRating === 0) {
                    showError('Lỗi', 'Vui lòng chọn số sao đánh giá');
                    return;
                  }
                  console.log(`Rated ${movie?.title} with ${userRating} stars`);
                  success('Thành công', `Đã đánh giá ${movie?.title} với ${userRating} sao`);
                  setShowRatingModal(false);
                  setUserRating(0);
                }}
                className="flex-1 rounded-lg bg-gradient-to-r from-yellow-400 to-orange-500 px-4 py-2 font-semibold text-slate-900 hover:from-yellow-300 hover:to-orange-400 transition-all"
              >
                Gửi đánh giá
              </button>
              <button
                onClick={() => setShowRatingModal(false)}
                className="rounded-lg bg-white/10 px-4 py-2 text-white hover:bg-white/20 transition-colors"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FAB admin chung */}
      <AdminOnly>
        <EditButton variant="fab" onClick={() => setOpenEdit(true)} />
      </AdminOnly>

        {editInit && (
          <EditMovieModal
            open={openEdit}
            onClose={() => setOpenEdit(false)}
            initial={editInit}
            onSubmit={async (payload) => {
              try {
                // Map payload to backend format
                const updateData = {
                  title: payload.title,
                  original_title: payload.originalTitle,
                  description: payload.overview,
                  release_year: payload.releaseYear,
                  duration: payload.duration,
                  age_rating: payload.age,
                  poster_url: payload.poster,
                  banner_url: payload.banner,
                  country: payload.origin,
                  language: payload.language,
                  // Note: actors, directors, genres will need separate API calls
                  // or the backend needs to handle them in the update endpoint
                };

                await MovieServiceProvider.updateMovie(movie.id, updateData, 'local');
                
                // Show success notification
                success('Thành công', 'Phim đã được cập nhật thành công');
                
                // Close modal
                setOpenEdit(false);
                
                // Optionally refresh the page or update local state
                window.location.reload();
              } catch (error: any) {
                console.error('Error updating movie:', error);
                throw error; // This will be caught by EditMovieModal
              }
            }}
          />
        )}

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

      {/* Notification Container */}
      <NotificationContainer 
        notifications={notifications} 
        onRemove={removeNotification} 
      />
    </div>
  );
}