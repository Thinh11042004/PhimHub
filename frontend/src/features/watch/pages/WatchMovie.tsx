import { Link, useParams, useSearchParams, useNavigate } from "react-router-dom";
import { useCallback, useEffect, useMemo, useState } from "react";
import { InteractionsApi } from "../../../services/movies/interactions";
import VideoPlayer from "@shared/components/VideoPlayer";
import { MovieService } from "../../../services/movies";
import type { MovieDetail } from "../../../services/movies/model";
import { watchHistoryService } from "../../../services/watchHistory";
import { useAuth } from "../../../store/auth";
import { getGenreDisplayName } from "../../../utils/genreMapper";
import { useNotification } from "@shared/hooks/useNotification";
import { NotificationContainer } from "@shared/components/NotificationContainer";
import { useConfirm } from "@shared/components/ConfirmModalProvider";
import AddToListDialog from "@shared/components/AddToListDialog";
import LoginRequiredModal from "@shared/components/LoginRequiredModal";
import { useLoginRequired } from "@shared/hooks/useLoginRequired";
import { useRealtimeCommentsSimple as useRealtimeComments } from "@shared/hooks/useRealtimeCommentsSimple";
import { formatDate } from "@shared/utils/dateFormatter";
import ActorCard from "@shared/components/ActorCard";
import Avatar from "@shared/components/Avatar";

export default function WatchMovie() {
  const { slug } = useParams();
  const [search] = useSearchParams();
  const navigate = useNavigate();
  const provider = (search.get("provider") || "local") as any;
  const [movie, setMovie] = useState<MovieDetail | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<string | undefined>(undefined);
  const [currentTime, setCurrentTime] = useState(0);
  const [resumeAt, setResumeAt] = useState(0);
  const { user } = useAuth();
  const { showLoginRequired, modalConfig, showLoginRequiredModal, hideLoginRequiredModal, handleLogin } = useLoginRequired();
  const { notifications, removeNotification, success, error: showError } = useNotification();
  const { showConfirm } = useConfirm();

  // Load comments
  const loadComments = async () => {
    if (!movie?.id) return;
    
    setCommentsLoading(true);
    try {
      const contentId = Number((movie as any)?.contentId);
      
      let response: any[] = [];
      if (contentId) {
        response = await InteractionsApi.listComments(contentId, 1, 20);
      } else if (movie?.id) {
        const providerName = String(provider || 'local');
        response = await InteractionsApi.listExternalComments(providerName, String(movie.id), 1, 20);
      }
      
      setComments(response || []);
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setCommentsLoading(false);
    }
  };

  // Refresh comments when avatar changes
  useEffect(() => {
    const handleAvatarUpdate = () => {
      if (movie?.id) {
        loadComments();
      }
    };

    window.addEventListener('avatarUpdated', handleAvatarUpdate);
    return () => {
      window.removeEventListener('avatarUpdated', handleAvatarUpdate);
    };
  }, [movie?.id]);

  // Send comment
  const handleSendComment = async () => {
    if (!user || !movie?.id || !newComment.trim() || sendingComment) return;
    
    setSendingComment(true);
    try {
      const token = localStorage.getItem('phimhub:token');
      if (!token) {
        showError('Lỗi', 'Bạn cần đăng nhập để bình luận.');
        return;
      }

      const contentId = Number((movie as any)?.contentId);
      
      let created: any = null;
      if (contentId) {
        created = await InteractionsApi.createComment(contentId, newComment.trim());
        const list = await InteractionsApi.listComments(contentId, 1, 20);
        setComments(list);
      } else if (movie?.id) {
        const providerName = String(provider || 'local');
        created = await InteractionsApi.createExternalComment(providerName, String(movie.id), newComment.trim());
        const list = await InteractionsApi.listExternalComments(providerName, String(movie.id), 1, 20);
        setComments(list);
      } else {
        console.error('❌ No movie ID or contentId found!');
        showError('Lỗi', 'Không tìm thấy thông tin phim');
        return;
      }
      
      setNewComment('');
      success('Thành công', 'Bình luận đã được gửi!');
    } catch (error) {
      console.error('Error sending comment:', error);
      showError('Lỗi', `Gửi bình luận thất bại: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setSendingComment(false);
    }
  };
  
  // Add to list dialog states
  const [showAddToListDialog, setShowAddToListDialog] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState<{
    id: string;
    title: string;
    type: 'movie' | 'series';
  } | null>(null);

  // Check for time parameter in URL first, then fetch watch history
  useEffect(() => {
    // Check if time parameter is provided in URL
    const timeParam = search.get("t");
    if (timeParam) {
      const resumeSeconds = parseInt(timeParam);
      if (!isNaN(resumeSeconds) && resumeSeconds > 0) {
        console.log('🎬 WatchMovie - Resume from URL time parameter:', {
          movie: slug,
          timeParam,
          resumeSeconds,
          resumeTime: `${Math.floor(resumeSeconds / 60)}:${(resumeSeconds % 60).toString().padStart(2, '0')}`
        });
        setResumeAt(resumeSeconds);
        return; // Don't fetch from watch history if URL has time parameter
      }
    }

    // Fallback to watch history if no time parameter
    const fetchWatchHistory = async () => {
      if (!user || !slug) return;
      
      try {
        const userId = parseInt(user.id);
        const historyData = await watchHistoryService.getHistory(userId);
        
        // Find the current movie in watch history
        const currentMovieHistory = historyData.find(item => 
          item.slug === slug || item.title?.toLowerCase().includes(slug.toLowerCase())
        );
        
        if (currentMovieHistory && currentMovieHistory.progress) {
          // Convert progress percentage to seconds
          // Get duration from movie data or use default
          const duration = movie?.duration ? movie.duration * 60 : 7200; // Default 120 minutes = 7200 seconds
          const resumeSeconds = Math.round((currentMovieHistory.progress / 100) * duration);
          console.log('🎬 WatchMovie - Resume position from history:', { 
            movie: slug,
            progress: currentMovieHistory.progress, 
            duration, 
            resumeSeconds,
            resumeTime: `${Math.floor(resumeSeconds / 60)}:${(resumeSeconds % 60).toString().padStart(2, '0')}`
          });
          setResumeAt(resumeSeconds);
        } else {
          console.log('🎬 WatchMovie - No resume position found for:', slug);
        }
      } catch (error) {
        console.error('Failed to fetch watch history:', error);
      }
    };
    
    fetchWatchHistory();
  }, [user, slug, movie, search]);

  // Save progress when user leaves the page
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (movie && user && currentTime > 0) {
        const userId = parseInt(user.id);
        const movieId = typeof movie.id === 'string' ? parseInt(movie.id) || 0 : movie.id;
        
        if (movieId > 0) {
          const duration = movie.duration ? movie.duration * 60 : 7200; // Use actual duration or default 120 minutes
          const progress = Math.round((currentTime / duration) * 100);
          console.log('🎬 WatchMovie - Page unload, saving progress:', { 
            currentTime, 
            progress,
            movieId,
            currentTimeFormatted: `${Math.floor(currentTime / 60)}:${(currentTime % 60).toString().padStart(2, '0')}`
          });
          // Use sendBeacon for reliable data sending on page unload
          const data = JSON.stringify({
            userId,
            contentId: movieId, // Backend expects contentId but we pass movieId
            progress,
            device: 'web'
          });
          navigator.sendBeacon('http://localhost:3001/api/watch-history', data);
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [movie, user, currentTime]);

  useEffect(() => {
    if (!slug) return;
    MovieService.use(provider)
      .getMovieById(slug)
      .then((detail) => {
        // Chỉ chuyển sang series nếu provider đánh dấu isSeries rõ ràng
        if (detail && detail.isSeries === true) {
          const params = new URLSearchParams(window.location.search);
          window.location.replace(`/watch/series/${slug}${params.toString() ? `?${params.toString()}` : ""}`);
          return;
        }
        setMovie(detail);
        
        // Add to watch history when movie loads
        
        if (detail && detail.id && user) {
          const userId = parseInt(user.id);
          // Use the movie ID from the detail object
          const contentId = typeof detail.id === 'string' ? parseInt(detail.id) || 0 : detail.id;
          
          if (contentId > 0) {
            console.log('WatchMovie - Adding to watch history:', {
              userId,
              contentId,
              progress: 0,
              device: 'web'
            });
            
            // Không lưu vào lịch sử ngay khi vào trang
            // Chỉ lưu khi có progress thực sự (trong handleProgress)
            console.log('WatchMovie - Skipping initial history save (progress = 0)');
          } else {
            console.log('WatchMovie - Invalid content ID, not adding to watch history');
          }
        } else {
          console.log('WatchMovie - Not adding to watch history:', {
            hasDetail: !!detail,
            hasDetailId: !!detail?.id,
            hasUser: !!user
          });
        }
      })
      .catch(() => setMovie(null));
  }, [slug, provider, user]);

  // chọn version mặc định khi dữ liệu sẵn sàng
  useEffect(() => {
    if (!movie?.versions || movie.versions.length === 0) return;
    const urlVersion = search.get('version') || undefined;
    if (urlVersion && movie.versions.some(v => v.key === urlVersion)) {
      setSelectedVersion(urlVersion);
    } else {
      setSelectedVersion((prev) => prev ?? movie.versions[0].key);
    }
  }, [movie?.versions, search]);

  const selectedVersionLabel = useMemo(() => {
    if (!movie?.versions) return undefined;
    const v = movie.versions.find((x) => x.key === selectedVersion);
    return v?.label;
  }, [movie?.versions, selectedVersion]);

  // Khi selectedVersion thay đổi, tải stream tương ứng
  useEffect(() => {
    (async () => {
      if (!movie?.id || !selectedVersion) return;
      try {
        const svc: any = MovieService.use(provider);
        const qualities = await svc.getAvailableQualities?.(movie.id, selectedVersion);
        const desired = Array.isArray(qualities) && qualities.length ? qualities[0] : undefined;
        const stream = await svc.getStreamUrl?.(movie.id, selectedVersion, desired);
        if (stream?.hls || stream?.mp4) {
          setMovie((m) => (m ? { ...m, stream: { hls: stream.hls || m.stream.hls, mp4: stream.mp4 || m.stream.mp4 } } : m));
        }
      } catch {
        // ignore
      }
    })();
  }, [movie?.id, selectedVersion, provider]);

  const scrollToComments = () => {
    const el = document.getElementById("comments-section");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  // Create stable callbacks to prevent VideoPlayer from re-rendering
  const handleProgress = useCallback((sec: number) => {
    // Update current time for tracking
    setCurrentTime(sec);
    
    // Track progress in watch history
    console.log('🎬 WatchMovie - handleProgress called:', { 
      sec, 
      hasMovie: !!movie, 
      hasUser: !!user, 
      movieId: movie?.id,
      userId: user?.id 
    });
    
    if (movie && user && sec > 0) {
      const userId = parseInt(user.id);
      // movie.id should be the movie ID from database, not content_id
      const movieId = typeof movie.id === 'string' ? parseInt(movie.id) || 0 : movie.id;
      
      console.log('🎬 WatchMovie - Processing progress:', { 
        userId, 
        movieId, 
        movieTitle: movie.title,
        movieSlug: movie.id,
        movieIdType: typeof movie.id
      });
      
      if (movieId > 0) {
        // Calculate progress percentage using actual movie duration
        const duration = movie.duration ? movie.duration * 60 : 7200; // Use actual duration or default 120 minutes
        // Override duration for specific movie that has incorrect duration in database
        const actualDuration = movie.id === 'toi-la-sat-thu-nhung-chi-so-manh-hon-han-dung-si' ? 25 * 60 : duration;
        const progress = Math.round((sec / actualDuration) * 100);
        
        // Update progress more frequently (every 3 seconds or 3% progress)
        if (sec > 0 && (sec % 3 === 0 || progress % 3 === 0)) {
          console.log('🎬 WatchMovie - Updating progress:', { 
            sec, 
            progress, 
            duration: actualDuration,
            currentTime: `${Math.floor(sec / 60)}:${(sec % 60).toString().padStart(2, '0')}`
          });
          watchHistoryService.trackProgress(userId, movieId, progress, undefined);
        }
      } else {
        console.log('🎬 WatchMovie - Invalid movieId:', movieId);
      }
    } else {
      console.log('🎬 WatchMovie - Missing movie or user:', { 
        hasMovie: !!movie, 
        hasUser: !!user, 
        sec 
      });
    }
  }, [movie, user]);

  const handlePause = useCallback((sec: number) => {
    // Save progress when user pauses
    if (movie && user && sec > 0) {
      const userId = parseInt(user.id);
      const movieId = typeof movie.id === 'string' ? parseInt(movie.id) || 0 : movie.id;
      
      if (movieId > 0) {
        const duration = movie.duration ? movie.duration * 60 : 7200; // Use actual duration or default 120 minutes
        const progress = Math.round((sec / duration) * 100);
        console.log('🎬 WatchMovie - Video paused, saving progress:', { 
          sec, 
          progress, 
          movieId,
          currentTime: `${Math.floor(sec / 60)}:${(sec % 60).toString().padStart(2, '0')}`
        });
        watchHistoryService.trackProgress(userId, movieId, progress, undefined);
      }
    }
  }, [movie, user]);

  const handleEnded = useCallback((sec: number) => {
    // Mark as completed when video ends
    if (movie && user) {
      const userId = parseInt(user.id);
      const movieId = typeof movie.id === 'string' ? parseInt(movie.id) || 0 : movie.id;
      
      if (movieId > 0) {
        console.log('🎬 WatchMovie - Video ended, marking as completed:', { movieId });
        watchHistoryService.trackProgress(userId, movieId, 100, undefined);
      }
    }
  }, [movie, user]);

  // Toolbar states/actions
  const [isFavorited, setIsFavorited] = useState(false);
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const [theater, setTheater] = useState(false);
  
  // Comment states
  const [comments, setComments] = useState<any[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [sendingComment, setSendingComment] = useState(false);
  
  // Edit/Reply states
  const [editingComment, setEditingComment] = useState<number | null>(null);
  const [editText, setEditText] = useState('');
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyText, setReplyText] = useState('');

  // Load comments when movie changes
  useEffect(() => {
    if (movie?.id) {
      loadComments();
    }
  }, [movie?.id]);

  // Realtime comments
  const contentId = movie ? String(Number((movie as any)?.contentId) || 'external') : undefined;
  const movieId = movie && !(movie as any)?.contentId ? String(movie.id) : undefined;
  
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

  useEffect(() => {
    const checkStatus = async () => {
      if (!movie?.id) return;
      
      // Check favorite status from backend if user is logged in
      if (user) {
        try {
          const isFav = await InteractionsApi.checkFavorite(String(movie.id), movie.isSeries ? 'series' : 'movie');
          setIsFavorited(isFav);
        } catch (error) {
          console.error('Error checking favorite status:', error);
        }
      } else {
        // Fallback to localStorage for non-logged in users
        const fav = JSON.parse(localStorage.getItem('phimhub:favorites') || '[]');
        const id = movie.id;
        setIsFavorited(fav.some((x: any) => (x.id || x) === id));
      }
      
      // Watchlist still uses localStorage (no backend API yet)
      const wl = JSON.parse(localStorage.getItem('phimhub:watchlist') || '[]');
      const id = movie.id;
      setIsInWatchlist(wl.some((x: any) => (x.id || x) === id));
    };
    
    checkStatus();
  }, [movie?.id, user]);

  const toggleFavorite = () => {
    if (!movie) return;
    const token = localStorage.getItem('phimhub:token');
    const movieId = movie.id; // Use string ID directly
    if (token) {
      const curr = isFavorited;
      setIsFavorited(!curr);
      (curr ? InteractionsApi.removeFavorite(movieId, 'movie') : InteractionsApi.addFavorite(movieId, 'movie')).catch(() => setIsFavorited(curr));
    } else {
      const fav = JSON.parse(localStorage.getItem('phimhub:favorites') || '[]');
      const exists = fav.some((x: any) => (x.id || x) === movieId);
      let next;
      if (exists) {
        next = fav.filter((x: any) => (x.id || x) !== movieId);
        setIsFavorited(false);
      } else {
        const item = { id: movieId, title: movie.title, img: movie.poster || movie.banner, provider };
        next = [...fav, item];
        setIsFavorited(true);
      }
      localStorage.setItem('phimhub:favorites', JSON.stringify(next));
      window.dispatchEvent(new CustomEvent('favoritesUpdated'));
    }
  };

  const handleAddToList = () => {
    if (!movie) return;
    
    // Set selected movie data and show dialog
    setSelectedMovie({
      id: String(movie.id),
      title: movie.title,
      type: movie.isSeries ? 'series' : 'movie'
    });
    setShowAddToListDialog(true);
  };

  // Theater overlay side effects (lock scroll)
  useEffect(() => {
    if (theater) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [theater]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Banner video */}
      <section className={theater ? 'fixed inset-0 z-[1000] bg-[#000011]' : 'relative left-1/2 right-1/2 -mx-[50vw] w-screen bg-[#000011]'}>
        <div className={theater ? 'mx-auto h-full max-w-[96vw] px-3 py-4 md:px-4 flex flex-col' : 'mx-auto max-w-6xl px-3 md:px-4 py-4'}>
          {/* Header: back + title (hide in theater) */}
          {!theater && (
          <div className="mb-3 flex items-center gap-3">
            <Link
              to={slug ? `/movies/${slug}?provider=${provider}` : "/"}
              className="grid h-8 w-8 place-items-center rounded-full ring-1 ring-white/20 hover:bg-white/10"
            >
              <svg className="h-4 w-4 text-white/80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
            </Link>
            <div className="text-lg font-semibold">Xem phim {movie?.title}</div>
          </div>
          )}
          {movie && (
            <div className={`${theater ? 'flex-1' : ''}`}>
            {(() => {
              // Always show video player with fallback to demo stream
              const hasStream = movie.stream?.hls || movie.stream?.mp4;
              const streamUrl = movie.stream?.hls || movie.stream?.mp4 || "https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8";
              
              if (!hasStream) {
                console.log('🎬 Movie has no stream, using demo stream:', streamUrl);
              }
              
              return (
                <VideoPlayer
                  src={streamUrl}
                  poster={movie.banner}
                  subtitles={movie.subtitles}
                  startPosition={resumeAt}
                  onProgress={handleProgress}
                  onPause={handlePause}
                  onEnded={handleEnded}
                />
              );
            })()}
            </div>
          )}

          {/* Sticky controls bar removed as requested */}

          {/* Action toolbar under player (hide in theater) */}
          {!theater && (
          <div className={`mt-3 flex items-center justify-between rounded-lg bg-white/5 px-3 py-2 ring-1 ring-white/10`}>
            <div className="flex flex-wrap items-center gap-5 text-sm text-white/80">
              <button 
                className={`inline-flex items-center gap-2 hover:text-white ${user && isFavorited ? 'text-rose-400' : ''}`} 
                onClick={user ? toggleFavorite : () => showLoginRequiredModal({ title: "Yêu cầu đăng nhập", message: "Bạn cần đăng nhập để thêm vào yêu thích" })}
                title={user ? (isFavorited ? "Bỏ yêu thích" : "Thêm vào yêu thích") : "Đăng nhập để yêu thích"}
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 6 4 4 6.5 4c1.54 0 3.04.99 3.57 2.36h.86C11.46 4.99 12.96 4 14.5 4 17 4 19 6 19 8.5c0 3.78-3.4 6.86-8.55 11.54z"/></svg>
                <span>Yêu thích</span>
              </button>
              <button 
                className="inline-flex items-center gap-2 hover:text-white text-cyan-400" 
                onClick={user ? handleAddToList : () => showLoginRequiredModal({ title: "Yêu cầu đăng nhập", message: "Bạn cần đăng nhập để thêm vào danh sách" })}
                title={user ? "Thêm vào danh sách" : "Đăng nhập để thêm vào danh sách"}
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M11 11V5h2v6h6v2h-6v6h-2v-6H5v-2z"/></svg>
                <span>Thêm vào</span>
              </button>
              <div className="inline-flex items-center gap-2">
                <span>Rạp phim</span>
                <button onClick={() => setTheater((v) => !v)} className={`rounded-sm px-1.5 py-0.5 text-[10px] font-semibold ring-1 ${theater ? 'bg-yellow-400/20 text-yellow-300 ring-yellow-400/40' : 'bg-white/5 text-white/60 ring-white/20'}`}>{theater ? 'ON' : 'OFF'}</button>
              </div>
            </div>
            <button className="inline-flex items-center gap-2 text-sm text-white/80 hover:text-white" onClick={() => setTheater(false)}>
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M4 4h16v2H4zm0 6h16v2H4zm0 6h10v2H4z"/></svg>
              Báo lỗi
            </button>
          </div>
          )}
          {theater ? null : null}
        </div>
      </section>
      {theater && (
        <button
          onClick={() => setTheater(false)}
          className="fixed bottom-4 left-1/2 z-[1001] -translate-x-1/2 rounded-full bg-white/10 px-3 py-1 text-sm text-white ring-1 ring-white/20 backdrop-blur hover:bg-white/15"
        >
          Rạp phim <span className="ml-1 rounded-sm bg-yellow-400/20 px-1.5 py-0.5 text-[10px] font-semibold text-yellow-300 ring-1 ring-yellow-400/40">ON</span>
        </button>
      )}
      {/* When theater on, hide rest of page by fixing section; nothing else renders visually */}

      {/* Thông tin + hành động */}
      <section className="mx-auto w-full max-w-6xl px-3 md:px-4 py-6">
        <div className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10 backdrop-blur-sm md:p-6">
          {/* Header row: poster + info side-by-side */}
          <div className="grid grid-cols-[100px,1fr] items-start gap-4 sm:grid-cols-[120px,1fr] md:grid-cols-[140px,1fr]">
            {movie && (
              <img src={movie.poster} alt={movie.title} className="h-auto w-full rounded-xl ring-1 ring-white/10" />
            )}
            <div className="space-y-2">
              <div>
                <h1 className="text-xl font-semibold leading-tight md:text-2xl">{movie?.title}</h1>
                <p className="text-sm text-white/70">{movie?.originalTitle}</p>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs">
                {movie?.rating && (
                  <span className="rounded bg-yellow-500/20 px-2 py-1 text-yellow-300">
                    IMDb {movie.rating}
                  </span>
                )}
                <span className="rounded bg-yellow-500/20 px-2 py-1 text-yellow-300">
                  FHD
                </span>
                {typeof movie?.duration === "number" && (
                  <span className="rounded bg-white/10 px-2 py-1">{movie?.duration} phút</span>
                )}
                {movie?.year && <span className="rounded bg-white/10 px-2 py-1">{movie?.year}</span>}
                {movie?.ageRating && <span className="rounded bg-white/10 px-2 py-1">{movie?.ageRating}</span>}
              </div>

              <div className="flex flex-wrap gap-2 text-xs">
                {movie?.genres?.map((g) => (
                  <span key={g} className="rounded-full border border-white/20 px-2 py-0.5">
                    {getGenreDisplayName(g)}
                  </span>
                ))}
              </div>

              <div className="text-sm leading-relaxed text-white/85">
                {movie?.overview && <p className="line-clamp-4 md:line-clamp-5">{movie.overview}</p>}
                <div className="mt-2">
                  {slug && (
                    <Link to={`/movies/${slug}?provider=${provider}`} className="text-yellow-300 hover:text-yellow-200">
                      Thông tin phim ▸
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Actions: rate/comment + viewer score */}
          <div className="mt-4 flex items-center justify-between rounded-xl bg-white/5 px-4 py-2 ring-1 ring-white/10">
            <div className="flex items-center gap-6">
              <button className="flex items-center gap-2 text-white/80 hover:text-white" onClick={() => console.log("open rate modal") }>
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/></svg>
                <span>Đánh giá</span>
              </button>
              <button className="flex items-center gap-2 text-white/80 hover:text-white" onClick={scrollToComments}>
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M20 2H4a2 2 0 00-2 2v12a2 2 0 002 2h4l4 4 4-4h4a2 2 0 002-2V4a2 2 0 00-2-2z"/></svg>
                <span>Bình luận</span>
              </button>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 rounded-full bg-indigo-600 px-3 py-1 text-white">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                <span className="font-semibold">{(movie?.rating ?? 0).toFixed(1)}</span>
                <button className="text-white/90 underline decoration-white/40 underline-offset-2" onClick={() => console.log("open rate modal")}>Đánh giá</button>
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-[1fr,260px]">
            {/* LEFT column: versions + comments */}
            <div className="space-y-4">
              {/* Các bản chiếu (cards) */}
              <div className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10 backdrop-blur-sm">
                <h3 className="mb-3 text-lg font-semibold">Các bản chiếu</h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {movie?.versions.map((v) => (
                    <div
                      key={v.key}
                      className="relative overflow-hidden rounded-xl bg-slate-800/60 p-4 ring-1 ring-white/10 hover:ring-white/20"
                    >
                      {(() => {
                        const isActive = v.key === selectedVersion;
                        return (
                          <div className="flex items-center gap-3">
                            {/* Badge */}
                            <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/20 px-2 py-1 text-xs text-purple-300">
                              <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7z" clipRule="evenodd"/></svg>
                              {v.label}
                            </span>

                            <div className="flex-1">
                              <div className="text-base font-semibold">{movie.title}</div>
                              {v.note && <div className="text-xs text-white/70">{v.note}</div>}
                            </div>

                            {/* Thumbnail */}
                            {movie.poster && (
                              <img src={movie.poster} alt={movie.title} className="hidden h-16 w-12 rounded object-cover ring-1 ring-white/10 sm:block" />
                            )}

                            <button
                              className={`rounded-lg px-3 py-1.5 text-sm font-medium ${isActive ? "bg-white/20 text-white cursor-default" : "bg-white text-slate-900 hover:bg-white/90"}`}
                              disabled={isActive}
                              onClick={() => {
                                if (!slug || isActive) return;
                                MovieService.use(provider)
                                  .switchVersion?.(slug, v.key)
                                  .then((res) => {
                                    if (!res) return;
                                    setSelectedVersion(v.key);
                                    setMovie((m) => (m ? { ...m, stream: { hls: res.hls || m.stream.hls, mp4: res.mp4 || m.stream.mp4 }, subtitles: res.subtitles || m.subtitles } : m));
                                  });
                              }}
                            >
                        {"Xem bản này"}
                            </button>
                          </div>
                        );
                      })()}
                    </div>
                  ))}
                </div>
              </div>

              {/* Bình luận */}
              <div className="rounded-2xl bg-white/5 p-6 ring-1 ring-white/10" id="comments-section">
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-white mb-2">Bình luận ({comments.length})</h3>
                  
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
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Viết bình luận"
                          className="w-full h-32 bg-white/10 border border-white/20 rounded-lg p-4 text-white placeholder-white/50 resize-none focus:outline-none focus:ring-2 focus:ring-yellow-400/50"
                          maxLength={1000}
                        />
                        <div className="absolute top-2 right-2 text-xs text-white/50">{newComment.length}/1000</div>
                        
                        <div className="flex items-center justify-between mt-4">
                          <button
                            onClick={handleSendComment}
                            disabled={!newComment.trim() || sendingComment}
                            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-yellow-400 to-orange-500 px-6 py-2 font-semibold text-slate-900 hover:from-yellow-300 hover:to-orange-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                          >
                            <span>{sendingComment ? 'Đang gửi...' : 'Gửi'}</span>
                            <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                            </svg>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Comments List (from API) */}
                <div className="space-y-6">
                  {commentsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400"></div>
                      <span className="ml-3 text-white/70">Đang tải bình luận...</span>
                    </div>
                  ) : comments.length > 0 ? (
                    comments.map((c) => {
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
                                            const contentId = Number((movie as any)?.contentId);
                                            if (contentId) {
                                              await InteractionsApi.updateComment(c.id, editText);
                                              const list = await InteractionsApi.listComments(contentId, 1, 20);
                                              setComments(list);
                                            } else if (movie?.id) {
                                              const providerName = String(provider || 'local');
                                              await InteractionsApi.updateExternalComment(c.id, editText);
                                              const list = await InteractionsApi.listExternalComments(providerName, String(movie.id), 1, 20);
                                              setComments(list);
                                            }
                                            success('Thành công', 'Bình luận đã được cập nhật');
                                            setEditingComment(null);
                                            setEditText('');
                                          } catch (e) {
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
                                      onClick={() => {
                                        showConfirm(
                                          'Xóa bình luận',
                                          'Bạn có chắc muốn xóa bình luận này? Hành động này không thể hoàn tác.',
                                          async () => {
                                            try {
                                              const contentId = Number((movie as any)?.contentId);
                                              if (contentId) {
                                                await InteractionsApi.deleteComment(c.id);
                                                const list = await InteractionsApi.listComments(contentId, 1, 20);
                                                setComments(list);
                                              } else if (movie?.id) {
                                                const providerName = String(provider || 'local');
                                                await InteractionsApi.deleteExternalComment(c.id);
                                                const list = await InteractionsApi.listExternalComments(providerName, String(movie.id), 1, 20);
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
                                            const contentId = Number((movie as any)?.contentId);
                                            if (contentId) {
                                              await InteractionsApi.createComment(contentId, replyText, c.id);
                                              const list = await InteractionsApi.listComments(contentId, 1, 20);
                                              setComments(list);
                                            } else if (movie?.id) {
                                              const providerName = String(provider || 'local');
                                              await InteractionsApi.createExternalComment(providerName, String(movie.id), replyText, c.id);
                                              const list = await InteractionsApi.listExternalComments(providerName, String(movie.id), 1, 20);
                                              setComments(list);
                                            }
                                            setReplyingTo(null);
                                            setReplyText('');
                                            success('Thành công', 'Phản hồi đã được gửi');
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
                                                  const contentId = Number((movie as any)?.contentId);
                                                  if (contentId) {
                                                    await InteractionsApi.updateComment(reply.id, editText);
                                                    const list = await InteractionsApi.listComments(contentId, 1, 20);
                                                    setComments(list);
                                                  } else if (movie?.id) {
                                                    const providerName = String(provider || 'local');
                                                    await InteractionsApi.updateExternalComment(reply.id, editText);
                                                    const list = await InteractionsApi.listExternalComments(providerName, String(movie.id), 1, 20);
                                                    setComments(list);
                                                  }
                                                  success('Thành công', 'Phản hồi đã được cập nhật');
                                                  setEditingComment(null);
                                                  setEditText('');
                                                } catch (e) {
                                                  showError('Lỗi', 'Cập nhật phản hồi thất bại');
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
                                    {user && reply.user_id === Number(user.id) && (
                                      <div className="flex items-center gap-3">
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
                                          onClick={() => {
                                            showConfirm(
                                              'Xóa phản hồi',
                                              'Bạn có chắc muốn xóa phản hồi này?',
                                              async () => {
                                                try {
                                                  const contentId = Number((movie as any)?.contentId);
                                                  if (contentId) {
                                                    await InteractionsApi.deleteComment(reply.id);
                                                    const list = await InteractionsApi.listComments(contentId, 1, 20);
                                                    setComments(list);
                                                  } else if (movie?.id) {
                                                    const providerName = String(provider || 'local');
                                                    await InteractionsApi.deleteExternalComment(reply.id);
                                                    const list = await InteractionsApi.listExternalComments(providerName, String(movie.id), 1, 20);
                                                    setComments(list);
                                                  }
                                                  success('Thành công', 'Phản hồi đã được xóa');
                                                } catch (e) {
                                                  showError('Lỗi', 'Xóa phản hồi thất bại');
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
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-8">
                      <div className="mb-3">
                        <svg className="mx-auto h-10 w-10 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                      </div>
                      <p className="text-white/60">Chưa có bình luận nào. Hãy là người đầu tiên bình luận!</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* RIGHT sidebar */}
            <aside className="space-y-4">
              <div className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10 backdrop-blur-sm">
                <h3 className="mb-2 text-lg font-semibold">Diễn viên</h3>
                <div className="grid grid-cols-2 gap-3">
                  {(movie?.cast && movie.cast.length > 0 ? movie.cast : ['Louison Boulanger', 'Antoine Sauvion', 'Véronique Caquineau']).slice(0, 6).map((actor, index) => (
                    <ActorCard
                      key={index}
                      actor={{
                        name: typeof actor === 'string' ? actor : (actor as any)?.name || (actor as any)?.actor_name || 'Unknown'
                      }}
                      size="small"
                      showRole={false}
                    />
                  ))}
                </div>
              </div>
            </aside>
          </div>
        </div>
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

        {/* Notification Container */}
        <NotificationContainer 
          notifications={notifications} 
          onRemove={removeNotification} 
        />
    </div>
  );
}
