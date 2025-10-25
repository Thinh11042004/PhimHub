import { Link, useLocation, useParams, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from '../../../store/auth';
import AdminOnly from "@shared/components/AdminOnly";
import EditButton from "@shared/components/EditButton";
import EditSeriesModal from "@features/admin/components/EditSeriesModal";
import { MovieService } from "../../../services/movies";
import type { MovieDetail } from "../../../services/movies/model";
import { getGenreDisplayName } from "../../../utils/genreMapper";
import { AddToListDialog } from "../../../shared/components/AddToListDialog";
import ActorCard from "@shared/components/ActorCard";
import DirectorCard from "@shared/components/DirectorCard";
import { actorService } from "../../../services/actors";
import { directorService } from "../../../services/directors";
import { useNotification } from "../../../shared/hooks/useNotification";
import { NotificationContainer } from "../../../shared/components/NotificationContainer";

type Episode = { ep: number; title: string; duration: number };
type Season = { season: number; episodes: Episode[] };

export default function SeriesDetail() {
  const { slug } = useParams();
  const { search } = useLocation();
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(search);
  const provider = (urlParams.get("provider") || "local") as any;

  const [detail, setDetail] = useState<MovieDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { notifications, removeNotification, success, error: showError } = useNotification();
  const [activeTab, setActiveTab] = useState<"versions" | "episodes" | "cast" | "recommendations">("versions");
  const [isFavorited, setIsFavorited] = useState(false);
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [currentVersion, setCurrentVersion] = useState<string | undefined>(undefined);
  const [comments, setComments] = useState<any[]>([]);
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyText, setReplyText] = useState('');
  const [editingComment, setEditingComment] = useState<number | null>(null);
  const [editText, setEditText] = useState('');
  const [actorsData, setActorsData] = useState<{[key: string]: {id: number, name: string, photo_url?: string}}>({});
  const [directorsData, setDirectorsData] = useState<{[key: string]: {id: number, name: string, photo_url?: string}}>({});
  const { user } = useAuth();
  
  // Add to List Dialog state
  const [showAddToListDialog, setShowAddToListDialog] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState<{id: string, title: string, type: 'movie' | 'series'} | null>(null);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setError(null);
    MovieService.use(provider)
      .getMovieById(slug)
      .then((d) => {
        setDetail(d);
        
        // Tự động redirect nếu là movie và đang ở /series/:slug
        if (d && d.isSeries === false && window.location.pathname.startsWith('/series/')) {
          const params = new URLSearchParams(window.location.search);
          const newPath = `/movies/${slug}${params.toString() ? `?${params.toString()}` : ''}`;
          window.location.replace(newPath);
          return;
        }
      })
      .catch((e: any) => setError(e?.message || "Không tải được dữ liệu"))
      .finally(() => setLoading(false));
  }, [slug, provider]);

  // Init currentVersion khi có danh sách versions
  useEffect(() => {
    if (!detail?.versions || detail.versions.length === 0) return;
    setCurrentVersion((prev) => prev ?? detail.versions[0].key);
  }, [detail?.versions]);


  // Load comments when detail changes
  useEffect(() => {
    (async () => {
      if (!detail) return;
      try {
        const api = (await import('../../../services/movies/interactions')).InteractionsApi;
        const contentId = Number((detail as any).contentId);
        if (contentId) {
          const list = await api.listComments(contentId, 1, 20);
          setComments(list);
        } else if (detail?.id) {
          const list = await api.listExternalComments(String(provider || 'local'), String(detail.id), 1, 20);
          setComments(list);
        }
      } catch {
        setComments([]);
      }
    })();
  }, [detail, provider]);

  // Check if series is in favorites/watchlist when data loads
  useEffect(() => {
    const checkFavoriteStatus = async () => {
      if (!detail) return;
      
      const slug = detail.id;
      const token = localStorage.getItem('phimhub:token');
      
      if (token) {
        // Check API for authenticated users
        try {
          const { InteractionsApi } = await import('../../../services/movies/interactions');
          const response = await InteractionsApi.checkFavorite(slug, 'series');
          setIsFavorited(response.isFavorited);
        } catch (error) {
          console.error('Error checking favorite status:', error);
          // Fallback to localStorage
          const favoritesData = JSON.parse(localStorage.getItem('phimhub:favorites') || '[]');
          const isInFavorites = favoritesData.some((item: any) => (item.id || item) === slug);
          setIsFavorited(isInFavorites);
        }
      } else {
        // Check localStorage for non-authenticated users
        const favoritesData = JSON.parse(localStorage.getItem('phimhub:favorites') || '[]');
        const isInFavorites = favoritesData.some((item: any) => (item.id || item) === slug);
        setIsFavorited(isInFavorites);
      }
      
      // Watchlist still uses localStorage
      const watchlistData = JSON.parse(localStorage.getItem('phimhub:watchlist') || '[]');
      const isInWatchlist = watchlistData.some((item: any) => (item.id || item) === slug);
      setIsInWatchlist(isInWatchlist);
    };
    
    checkFavoriteStatus();
  }, [detail]);

  // Event handlers
  const handleRating = () => {
    setShowRatingModal(true);
  };

  const handleFavorite = async () => {
    if (!detail) return;
    
    const slug = detail.id;
    const token = localStorage.getItem('phimhub:token');
    
    if (token) {
      // Use API for authenticated users
      try {
        const { InteractionsApi } = await import('../../../services/movies/interactions');
        if (isFavorited) {
          await InteractionsApi.removeFavorite(slug, 'series');
          setIsFavorited(false);
          console.log('Removed from favorites:', detail.title);
        } else {
          await InteractionsApi.addFavorite(slug, 'series');
          setIsFavorited(true);
          console.log('Added to favorites:', detail.title);
        }
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
        setIsFavorited(false);
        console.log('Removed from favorites:', detail.title);
      } else {
        // Add to favorites
        const seriesData = {
          id: slug,
          title: detail.title,
          img: (detail as any).img,
          provider: provider || "local"
        };
        favoritesData.push(seriesData);
        localStorage.setItem('phimhub:favorites', JSON.stringify(favoritesData));
        setIsFavorited(true);
        console.log('Added to favorites:', detail.title);
      }
      
      // Trigger event to update other components
      window.dispatchEvent(new CustomEvent('favoritesUpdated'));
    }
  };

  const handleAddToWatchlist = () => {
    if (!detail) return;
    
    // Set selected movie data and show dialog
    setSelectedMovie({
      id: String(detail.id),
      title: detail.title,
      type: 'series'
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
    if (!detail?.id) return;
    // Lấy key an toàn từ đối tượng version; nếu thiếu, dò theo label
    let key: string | undefined = version?.key as any;
    if (!key && version?.label && Array.isArray(detail.versions)) {
      key = detail.versions.find((v: any) => v.label === version.label)?.key as any;
    }
    if (!key && Array.isArray(detail.versions) && detail.versions.length > 0) {
      // fallback: bản đầu tiên
      key = detail.versions[0].key as any;
    }
    setCurrentVersion(key);
    const params = new URLSearchParams();
    params.set('provider', String(provider));
    if (key) params.set('version', String(key));
    window.location.href = `/watch/series/${slug}?${params.toString()}`;
  };

  const handleEpisodeSelect = (episode: any) => {
    // Điều hướng sang trang xem series kèm provider + version (server) + episode slug nếu có
    const params = new URLSearchParams();
    params.set('provider', String(provider));
    // Nếu có selectedVersion hiện tại, đính kèm để WatchSeries chọn đúng server
    const v = currentVersion || detail?.versions?.[0]?.key;
    if (v) params.set('version', String(v));
    if (episode?.slug) params.set('ep', String(episode.slug));
    window.location.href = `/watch/series/${slug}?${params.toString()}`;
  };

  const handleCastClick = (actor: string) => {
    console.log("Clicked on actor:", actor);
    // TODO: Navigate to actor profile
  };

  const handleRecommendationClick = (recommendation: any) => {
    console.log("Clicked on recommendation:", recommendation);
    // TODO: Navigate to recommended series
  };

  const totalEpisodes = useMemo(() => {
    if (!detail?.episodes || detail.episodes.length === 0) return 0;
    return detail.episodes.reduce((sum, s) => sum + (s.server_data?.length || 0), 0);
  }, [detail?.episodes]);

  const displayGenres = useMemo(() => {
    if (!detail?.genres) return [] as string[];
    return (detail.genres as any[])
      .map((g) => (typeof g === "string" ? g : g?.name || g?.title || ""))
      .filter(Boolean);
  }, [detail?.genres]);

  const displayCountry = useMemo(() => {
    const c: any = detail?.country;
    if (!c) return "";
    if (typeof c === "string") return c;
    if (Array.isArray(c)) return c.map((x) => (typeof x === "string" ? x : x?.name || "")).filter(Boolean).join(", ");
    return c?.name || "";
  }, [detail?.country]);

  const displayDirector = useMemo(() => {
    const d: any = detail?.director;
    if (!d) return "";
    if (typeof d === "string") return d;
    if (Array.isArray(d)) return d.map((x) => (typeof x === "string" ? x : x?.name || "")).filter(Boolean).join(", ");
    return d?.name || "";
  }, [detail?.director]);

  const displayCast = useMemo(() => {
    // Try multiple provider shapes: cast (string[]), casts (string[]), actors (string[]|obj[]), or nested movie.casts
    const raw: any = (detail as any)?.cast || (detail as any)?.casts || (detail as any)?.actors || (detail as any)?.movie?.casts;
    if (!raw) return [] as Array<{ name: string; role?: string; avatar?: string }>;
    const list = Array.isArray(raw) ? raw : [raw];
    return list
      .map((x: any) => {
        if (typeof x === 'string') return { name: x };
        if (x && typeof x === 'object') return { name: x.name || x.fullname || x.title || '', role: x.role, avatar: x.photo || x.avatar };
        return { name: String(x) };
      })
      .filter((a) => a.name && a.name.trim().length > 0);
  }, [detail]);

  // Fetch actors data when series cast changes
  useEffect(() => {
    if (!detail?.cast) return;
    
    const fetchActorsData = async () => {
      const actorsMap: {[key: string]: {id: number, name: string, photo_url?: string}} = {};
      
      for (const actor of displayCast) {
        try {
          const actors = await actorService.searchActors(actor.name, 1);
          if (actors.length > 0) {
            actorsMap[actor.name] = {
              id: actors[0].id,
              name: actors[0].name,
              photo_url: actors[0].photo_url
            };
          }
        } catch (error) {
          console.log(`Actor not found: ${actor.name}`);
        }
      }
      
      setActorsData(actorsMap);
    };
    
    fetchActorsData();
  }, [detail?.cast, displayCast]);

  // Fetch directors data when series director changes
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
      detail
        ? {
            title: detail.title,
            originalTitle: detail.originalTitle || "",
            actors: detail.cast || [],
            directors: detail.director ? [detail.director] : [],
            origin: detail.country || "",
            language: "en",
            totalSeasons: 1,
            episodesPerSeason: totalEpisodes,
            releaseYear: detail.year || 0,
            age: detail.ageRating || '',
            genres: detail.genres || [],
            overview: detail.overview || "",
            poster: detail.poster || "",
            banner: detail.banner || "",
          }
        : null,
    [detail, totalEpisodes]
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

  if (!detail) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Banner */}
      <section className="relative left-1/2 right-1/2 -mx-[50vw] w-screen overflow-hidden -mt-16">
        <div
          className="h-[66vh] w-full bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${detail.banner || (detail as any).img})` }}
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
              backgroundImage: `url(${detail.banner || (detail as any).img})`,
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
                    src={detail.poster || (detail as any).img}
              alt={detail.title}
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
                    <h1 className="text-2xl font-bold text-white mb-2">{detail.title}</h1>
                    {detail.originalTitle && (
                      <p className="text-white/70 text-sm">{detail.originalTitle}</p>
                    )}
          </div>

                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full bg-yellow-400/20 px-3 py-1 text-xs font-medium text-yellow-300">
                      FHD
              </span>
                    <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/80">
                {detail.year}
              </span>
                    <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/80">
                      {totalEpisodes} tập
              </span>
              {detail.ageRating && (
                      <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/80">
                        {detail.ageRating}
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

            {detail.overview && (
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-2">Giới thiệu</h3>
                      <p className="text-white/80 text-sm leading-relaxed">{detail.overview}</p>
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
                            const actorData = actorsData[actor.name];
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
                                {actor.name}
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
                  </div>
                </div>
          </div>

              {/* Right - Actions & Tabs */}
              <div className="lg:col-span-2 space-y-6">
                {/* Action Buttons */}
                <div className="flex flex-wrap items-center gap-4">
             <button
               onClick={() => {
                 const params = new URLSearchParams();
                 params.set('provider', String(provider));
                 
                 // Nếu có selectedVersion hiện tại, đính kèm để WatchSeries chọn đúng server
                 const v = currentVersion || detail?.versions?.[0]?.key;
                 if (v) params.set('version', String(v));
                 
                 // Mặc định tập 1 nếu không có tập nào được chọn
                 if (detail?.episodes && detail.episodes.length > 0 && detail.episodes[0].server_data && detail.episodes[0].server_data.length > 0) {
                   params.set('ep', String(detail.episodes[0].server_data[0].slug));
                 }
                 
                 window.location.href = `/watch/series/${slug}?${params.toString()}`;
               }}
                     className="flex items-center gap-2 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 px-6 py-3 font-semibold text-slate-900 shadow-lg hover:from-yellow-300 hover:to-orange-400 transition-all duration-200"
             >
                     <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
                       <path d="M8 5v14l11-7z"/>
                     </svg>
                     Xem Ngay
             </button>

                  <button 
                    onClick={handleRating}
                    className="flex flex-col items-center gap-1 rounded-full bg-white/10 p-3 hover:bg-white/15 transition-all duration-200"
                  >
                    <svg className="h-5 w-5 fill-current text-white" viewBox="0 0 24 24">
                      <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>
                    </svg>
                    <span className="text-xs text-white">Đánh giá</span>
                  </button>

                  <button 
                    onClick={handleFavorite}
                    className={`flex flex-col items-center gap-1 rounded-full p-3 hover:bg-white/15 transition-all duration-200 ${
                      isFavorited ? 'bg-red-500/20 text-red-400' : 'bg-white/10 text-white'
                    }`}
                  >
                    <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                    </svg>
                    <span className="text-xs">Yêu thích</span>
            </button>

                  <button 
                    onClick={handleAddToWatchlist}
                    className={`flex flex-col items-center gap-1 rounded-full p-3 hover:bg-white/15 transition-all duration-200 ${
                      isInWatchlist ? 'bg-blue-500/20 text-blue-400' : 'bg-white/10 text-white'
                    }`}
                  >
                    <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
                      <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                    </svg>
                    <span className="text-xs">Thêm vào</span>
            </button>

                  <button 
                    onClick={handleComment}
                    className="flex flex-col items-center gap-1 rounded-full bg-white/10 p-3 hover:bg-white/15 transition-all duration-200 text-white"
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
                            episodes: "24 tập",
                            thumbnail: (detail as any)?.img || "/api/placeholder/300/200",
                            isActive: true
                          },
                          { 
                            id: 2, 
                            type: "Lồng tiếng Việt",
                            quality: "HD",
                            language: "Tiếng Việt",
                            episodes: "24 tập",
                            thumbnail: (detail as any)?.img || "/api/placeholder/300/200",
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
                            {/* Background with series poster */}
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
                                {version.isActive && (
                                  <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-green-500/20 text-green-300 text-xs font-medium">
                                    <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                                    Đang xem
                                  </div>
                                )}
                              </div>
                              
                              {/* Series info */}
                              <div className="space-y-3">
                                <h4 className="text-lg font-bold text-white line-clamp-2">
                                  {detail?.title || "Phim bộ"}
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
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                    </svg>
                                    <span>{version.episodes}</span>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Action button */}
                              <div className="mt-4">
                                <button
                                  onClick={() => handleVersionSelect(version)}
                                  className={`w-full rounded-xl px-4 py-3 font-semibold transition-all duration-200 ${
                                    version.isActive
                                      ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-slate-900 hover:from-yellow-300 hover:to-orange-400 shadow-lg shadow-yellow-500/25'
                                      : 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
                                  }`}
                                >
                                  {version.isActive ? 'Tiếp tục xem' : 'Xem bản này'}
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "episodes" && (
                  <div className="rounded-xl bg-white/5 p-4 text-white/70 ring-1 ring-white/10">
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-white">Danh sách tập phim</h3>
                      
              {detail.episodes && detail.episodes.length > 0 ? (
                detail.episodes.map((server, idx) => (
                  <div key={idx} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-lg font-semibold text-white">{server.server_name}</h4>
                      <span className="text-sm text-white/60">{server.server_data.length} tập</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                      {server.server_data.map((ep, index) => {
                        const isActive = index === 0; // First episode as active for demo
                        return (
                          <button
                            key={ep.slug}
                            onClick={() => handleEpisodeSelect(ep)}
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
                              {ep.name}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))
              ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                          <div className="mb-4 rounded-full bg-white/10 p-4">
                            <svg className="h-12 w-12 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <h4 className="text-lg font-semibold text-white mb-2">Không có tập phim</h4>
                          <p className="text-white/60 max-w-sm">
                            Hiện tại chưa có tập phim nào cho series này. Vui lòng quay lại sau.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === "cast" && (
                  <div className="rounded-xl bg-white/5 p-4 text-white/70 ring-1 ring-white/10">
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-white">Diễn viên</h3>
                      {displayCast.length === 0 ? (
                        <div className="text-white/60">Chưa có dữ liệu diễn viên.</div>
                      ) : (
                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                          {displayCast.map((actor, index) => {
                            const actorData = actorsData[actor.name];
                            return (
                              <ActorCard
                                key={index}
                                actor={{
                                  id: actorData?.id,
                                  name: actor.name,
                                  photo_url: actorData?.photo_url || actor.avatar,
                                  role_name: actor.role
                                }}
                                size="medium"
                                showRole={true}
                              />
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === "recommendations" && (
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">Đề xuất</h3>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                      {((detail as any)?.recommendations || (detail as any)?.similar || []).map((r: any, i: number) => {
                        const id = r?.slug || r?.id || String(i);
                        const title = r?.title || r?.name || r?.original_title || 'Phim đề xuất';
                        const img = r?.img || r?.thumb_url || r?.poster || r?.poster_url || '';
                        return (
                          <button
                            key={id}
                            onClick={() => handleRecommendationClick({ id, title })}
                            className="overflow-hidden rounded-xl bg-white/5 ring-1 ring-white/10 hover:ring-white/20 hover:scale-105 transition-all duration-200"
                          >
                            {img ? (
                              <img src={img} alt={title} className="aspect-[2/3] w-full object-cover" />
                            ) : (
                              <div className="aspect-[2/3] w-full bg-white/10" />
                            )}
                            <div className="p-2 text-sm text-left">{title}</div>
                          </button>
                        );
                      })}
                    </div>
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
                      onClick={() => navigate('/login')}
                      className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-xl font-medium hover:from-blue-600 hover:to-purple-700 transition-all duration-200"
                    >
                      Đăng nhập
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <textarea
                      placeholder="Viết bình luận"
                      className="w-full h-32 bg-white/10 border border-white/20 rounded-lg p-4 text-white placeholder-white/50 resize-none focus:outline-none focus:ring-2 focus:ring-yellow-400/50"
                      maxLength={1000}
                      id="comment-input"
                    />
                    <div className="absolute top-2 right-2 text-xs text-white/50">0/1000</div>
                    
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center gap-2">
                        <label className="flex items-center gap-2 text-white/70 cursor-pointer">
                          <input type="checkbox" className="rounded" />
                          <span className="text-sm">Tiết lộ?</span>
                        </label>
                      </div>
                      
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
                          const api = (await import('../../../services/movies/interactions')).InteractionsApi;
                          const contentId = Number((detail as any)?.contentId);
                          if (contentId) {
                            await api.createComment(contentId, text);
                            const list = await api.listComments(contentId, 1, 20);
                            setComments(list);
                          } else if (detail?.id) {
                            const providerName = String(provider || 'local');
                            await api.createExternalComment(providerName, String(detail.id), text);
                            const list = await api.listExternalComments(providerName, String(detail.id), 1, 20);
                            setComments(list);
                          }
                          success('Thành công', 'Bình luận đã được gửi');
                          el!.value = '';
                        } catch {
                          showError('Lỗi', 'Gửi bình luận thất bại');
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

              {/* Comments List (API) */}
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
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                          {String(c.fullname || c.username || 'U').slice(0,1).toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-semibold text-white">{c.fullname || c.username || 'Ẩn danh'}</span>
                            <span className="text-sm text-white/50">{new Date(c.created_at).toLocaleString()}</span>
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
                                        console.log(`🎬 Series data:`, { id: detail?.id, contentId: (detail as any)?.contentId, provider });
                                        
                                        const api = (await import('../../../services/movies/interactions')).InteractionsApi;
                                        const contentId = Number((detail as any)?.contentId);
                                        
                                        if (contentId) {
                                          console.log(`📊 Using internal comment API for contentId: ${contentId}`);
                                          await api.updateComment(c.id, editText);
                                          const list = await api.listComments(contentId, 1, 20);
                                          setComments(list);
                                        } else if (detail?.id) {
                                          const providerName = String(provider || 'local');
                                          console.log(`📊 Using external comment API for series: ${detail.id}, provider: ${providerName}`);
                                          await api.updateExternalComment(c.id, editText);
                                          const list = await api.listExternalComments(providerName, String(detail.id), 1, 20);
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
                                    if (confirm('Bạn có chắc muốn xóa bình luận này?')) {
                                      try {
                                        const api = (await import('../../../services/movies/interactions')).InteractionsApi;
                                        const contentId = Number((detail as any)?.contentId);
                                        if (contentId) {
                                          await api.deleteComment(c.id);
                                          const list = await api.listComments(contentId, 1, 20);
                                          setComments(list);
                                        } else if (detail?.id) {
                                          const providerName = String(provider || 'local');
                                          await api.deleteExternalComment(c.id);
                                          const list = await api.listExternalComments(providerName, String(detail.id), 1, 20);
                                          setComments(list);
                                        }
                                        success('Thành công', 'Bình luận đã được xóa');
                                      } catch (e) {
                                        showError('Lỗi', 'Xóa bình luận thất bại');
                                      }
                                    }
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
                                        const contentId = Number((detail as any)?.contentId);
                                        if (contentId) {
                                          await api.createComment(contentId, replyText, c.id);
                                          const list = await api.listComments(contentId, 1, 20);
                                          setComments(list);
                                        } else if (detail?.id) {
                                          const providerName = String(provider || 'local');
                                          await api.createExternalComment(providerName, String(detail.id), replyText, c.id);
                                          const list = await api.listExternalComments(providerName, String(detail.id), 1, 20);
                                          setComments(list);
                                        }
                                        success('Thành công', 'Phản hồi đã được gửi');
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
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center text-white font-bold text-xs">
                                {String(reply.fullname || reply.username || 'U').slice(0,1).toUpperCase()}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-semibold text-white text-sm">{reply.fullname || reply.username || 'Ẩn danh'}</span>
                                  <span className="text-xs text-white/50">{new Date(reply.created_at).toLocaleString()}</span>
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
                                              const contentId = Number((detail as any)?.contentId);
                                              if (contentId) {
                                                await api.updateComment(reply.id, editText);
                                                const list = await api.listComments(contentId, 1, 20);
                                                setComments(list);
                                              } else if (detail?.id) {
                                                const providerName = String(provider || 'local');
                                                await api.updateExternalComment(reply.id, editText);
                                                const list = await api.listExternalComments(providerName, String(detail.id), 1, 20);
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
                                          if (confirm('Bạn có chắc muốn xóa bình luận này?')) {
                                            try {
                                              const api = (await import('../../../services/movies/interactions')).InteractionsApi;
                                              const contentId = Number((detail as any)?.contentId);
                                              if (contentId) {
                                                await api.deleteComment(reply.id);
                                                const list = await api.listComments(contentId, 1, 20);
                                                setComments(list);
                                              } else if (detail?.id) {
                                                const providerName = String(provider || 'local');
                                                await api.deleteExternalComment(reply.id);
                                                const list = await api.listExternalComments(providerName, String(detail.id), 1, 20);
                                                setComments(list);
                                              }
                                              success('Thành công', 'Phản hồi đã được xóa');
                                            } catch (e) {
                                              showError('Lỗi', 'Xóa bình luận thất bại');
                                            }
                                          }
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
                                              const contentId = Number((detail as any)?.contentId);
                                              if (contentId) {
                                                await api.createComment(contentId, replyText, reply.id);
                                                const list = await api.listComments(contentId, 1, 20);
                                                setComments(list);
                                              } else if (detail?.id) {
                                                const providerName = String(provider || 'local');
                                                await api.createExternalComment(providerName, String(detail.id), replyText, reply.id);
                                                const list = await api.listExternalComments(providerName, String(detail.id), 1, 20);
                                                setComments(list);
                                              }
                                              success('Thành công', 'Phản hồi đã được gửi');
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
              <h3 className="text-xl font-semibold text-white">Đánh giá phim bộ</h3>
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
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  console.log(`Rated ${detail?.title} with ${userRating} stars`);
                  setShowRatingModal(false);
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
        <EditSeriesModal
          open={openEdit}
          onClose={() => setOpenEdit(false)}
          initial={editInit}
          onSubmit={(payload) => {
            // TODO: call API update
            console.log("SAVE SERIES", payload);
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

      {/* Notification Container */}
      <NotificationContainer 
        notifications={notifications} 
        onRemove={removeNotification} 
      />
    </div>
  );
}