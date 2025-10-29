import { Link, useParams, useSearchParams, useNavigate } from "react-router-dom";
import { useCallback, useEffect, useMemo, useState } from "react";
import VideoPlayer from "@shared/components/VideoPlayer";
import { MovieService } from "../../../services/movies";
import type { MovieDetail, EpisodeServer } from "../../../services/movies/model";
import { watchHistoryService } from "../../../services/watchHistory";
import { useAuth } from "../../../store/auth";
import { getGenreDisplayName } from "../../../utils/genreMapper";
import { useNotification } from "@shared/hooks/useNotification";
import { NotificationContainer } from "@shared/components/NotificationContainer";
import { useConfirm } from "@shared/components/ConfirmModalProvider";
import { InteractionsApi } from "../../../services/movies/interactions";
import AddToListDialog from "@shared/components/AddToListDialog";
import LoginRequiredModal from "@shared/components/LoginRequiredModal";
import { useLoginRequired } from "@shared/hooks/useLoginRequired";
import { useRealtimeCommentsSimple as useRealtimeComments } from "@shared/hooks/useRealtimeCommentsSimple";
import { formatDate } from "@shared/utils/dateFormatter";
import ActorCard from "@shared/components/ActorCard";

type Ep = { ep: number; title: string; duration: number };
type Season = { season: number; episodes: Ep[] };

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export default function WatchSeries() {
  const { slug } = useParams();
  const [sp, setSp] = useSearchParams();
  const navigate = useNavigate();
  const provider = (sp.get("provider") || "local") as any;
  const { user } = useAuth();
  const { showLoginRequired, modalConfig, showLoginRequiredModal, hideLoginRequiredModal, handleLogin } = useLoginRequired();
  const { notifications, removeNotification, success, error: showError } = useNotification();
  const { showConfirm } = useConfirm();

  // Toolbar states/actions (sync with WatchMovie)
  const [isFavorited, setIsFavorited] = useState(false);
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const [theater, setTheater] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<string | undefined>(undefined);
  const [currentTime, setCurrentTime] = useState(0);
  const [resumeAt, setResumeAt] = useState(0);
  
  // Add to list dialog states
  const [showAddToListDialog, setShowAddToListDialog] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState<{
    id: string;
    title: string;
    type: 'movie' | 'series';
  } | null>(null);

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

  // Check for time parameter in URL first, then fetch watch history
  useEffect(() => {
    // Get current episode from URL
    const currentEpisodeFromUrl = sp.get("e") || sp.get("ep");
    const episodeNumber = currentEpisodeFromUrl ? parseInt(currentEpisodeFromUrl.replace('tap-', '')) : 1;
    
    // Check if time parameter is provided in URL
    const timeParam = sp.get("t");
    if (timeParam) {
      const resumeSeconds = parseInt(timeParam);
      if (!isNaN(resumeSeconds) && resumeSeconds > 0) {
        console.log('Resume from URL time parameter:', {
          timeParam,
          resumeSeconds,
          episodeNumber,
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
        
        // Find the current series in watch history with matching episode number
        const currentSeriesHistory = historyData.find(item => 
          (item.slug === slug || item.title?.toLowerCase().includes(slug.toLowerCase())) &&
          item.episode_number === episodeNumber
        );
        
        if (currentSeriesHistory && currentSeriesHistory.progress) {
          // Convert progress percentage to seconds
          // For "Ngài Bean" episodes - duration is about 25m 54s = 1554 seconds
          const duration = 1554; // 25m 54s in seconds
          const resumeSeconds = Math.round((currentSeriesHistory.progress / 100) * duration);
          console.log('Series resume position from history for episode', episodeNumber, ':', { 
            progress: currentSeriesHistory.progress, 
            duration, 
            resumeSeconds,
            resumeTime: `${Math.floor(resumeSeconds / 60)}:${(resumeSeconds % 60).toString().padStart(2, '0')}`
          });
          setResumeAt(resumeSeconds);
        } else {
          console.log(`No watch history found for series episode ${episodeNumber}, starting from beginning`);
          setResumeAt(0);
        }
      } catch (error) {
        console.error('Failed to fetch series watch history:', error);
      }
    };
    
    fetchWatchHistory();
  }, [user, slug, sp]);


  // ===== Nguồn video demo để TEST =====
  const HLS_DEMO =
    "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8";
  const MP4_DEMO =
    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";
  
  // Simple test URL that should work
  const SIMPLE_MP4 = "https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8";

  // ===== MOCK (thay bằng API getSeriesWatch(id)) =====
  const data = useMemo(() => {
    const mkSeason = (s: number, n = 20): Season => ({
      season: s,
      episodes: Array.from({ length: n }, (_, i) => ({
        ep: i + 1,
        title: `Tập ${i + 1}`,
        duration: 24 + ((i * 3) % 10),
      })),
    });

    return {
      id: slug as any,
      title: "Thế giới ảo diệu của Gumball",
      original: "The Wonderfully Weird World of Gumball",
      poster:
        "https://m.media-amazon.com/images/I/71v8nQn1G6L._AC_UF894,1000_QL80_.jpg",
      banner:
        "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1800&auto=format&fit=crop",
      year: 2023,
      age: "P",
      rating: 8.7,
      genres: ["Hoạt hình", "Hài", "Gia đình"],
      overview:
        "Một thế giới đầy màu sắc và những câu chuyện hài hước xoay quanh Gumball cùng bạn bè của cậu.",
      seasons: [mkSeason(1, 20), mkSeason(2, 16), mkSeason(3, 12)],
      // stream demo
      streamHls: (s: number, e: number) => `${HLS_DEMO}#s=${s}&e=${e}`,
      streamMp4: (s: number, e: number) => SIMPLE_MP4,
      subtitles: [
        {
          label: "Vietnamese",
          lang: "vi",
          src: "https://bitdash-a.akamaihd.net/content/sintel/subtitles/subtitles_vietnamese.vtt",
        },
        {
          label: "English",
          lang: "en",
          src: "https://bitdash-a.akamaihd.net/content/sintel/subtitles/subtitles_en.vtt",
          default: true,
        },
      ],
      recommendations: Array.from({ length: 8 }, (_, i) => ({
        id: 800 + i,
        title:
          [
            "Gumball",
            "Family Guy",
            "One Piece",
            "Rick and Morty",
            "Tom & Jerry",
            "Ben 10",
            "Doraemon",
            "Adventure Time",
          ][i % 8],
        img: `https://picsum.photos/seed/watch-series-reco-${i}/480/720`,
      })),
    };
  }, [slug]);

  // ===== Real data from provider (if available) =====
  const [detail, setDetail] = useState<MovieDetail | null>(null);

  // Load comments
  const loadComments = async () => {
    if (!detail?.id) return;
    
    setCommentsLoading(true);
    try {
      const contentId = Number((detail as any)?.contentId);
      console.log('🎬 Loading comments for series:', { id: detail?.id, contentId, provider, slug });
      
      let response: any[] = [];
      if (contentId) {
        console.log('📊 Using internal comment API for contentId:', contentId);
        response = await InteractionsApi.listComments(contentId, 1, 20);
      } else if (detail?.id) {
        const providerName = String(provider || 'local');
        console.log('📊 Using external comment API for series:', detail.id, 'provider:', providerName);
        response = await InteractionsApi.listExternalComments(providerName, String(detail.id), 1, 20);
      }
      
      setComments(response || []);
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setCommentsLoading(false);
    }
  };

  // Send comment
  const handleSendComment = async () => {
    if (!user || !detail?.id || !newComment.trim() || sendingComment) return;
    
    setSendingComment(true);
    try {
      const token = localStorage.getItem('phimhub:token');
      if (!token) {
        showError('Lỗi', 'Bạn cần đăng nhập để bình luận.');
        return;
      }

      const contentId = Number((detail as any)?.contentId);
      console.log('🎬 Sending comment for series:', { id: detail?.id, contentId, provider, slug });
      
      let created: any = null;
      if (contentId) {
        console.log('📊 Using internal comment API for contentId:', contentId);
        created = await InteractionsApi.createComment(contentId, newComment.trim());
        const list = await InteractionsApi.listComments(contentId, 1, 20);
        setComments(list);
      } else if (detail?.id) {
        const providerName = String(provider || 'local');
        console.log('📊 Using external comment API for series:', detail.id, 'provider:', providerName);
        created = await InteractionsApi.createExternalComment(providerName, String(detail.id), newComment.trim());
        const list = await InteractionsApi.listExternalComments(providerName, String(detail.id), 1, 20);
        setComments(list);
      } else {
        console.error('❌ No series ID or contentId found!');
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
  useEffect(() => {
    if (!slug) return;
    MovieService.use(provider)
      .getMovieById(slug)
      .then((detail) => {
        setDetail(detail);
        
        // Tự động redirect nếu là movie và đang ở /watch/series/:slug
        if (detail && detail.isSeries === false && window.location.pathname.startsWith('/watch/series/')) {
          const params = new URLSearchParams(window.location.search);
          const newPath = `/watch/movie/${slug}${params.toString() ? `?${params.toString()}` : ''}`;
          window.location.replace(newPath);
          return;
        }
        
        // Add to watch history when series loads
        console.log('🎬 WatchSeries - detail:', detail);
        console.log('🎬 WatchSeries - user:', user);
        console.log('🎬 WatchSeries - detail.id:', detail?.id);
        console.log('🎬 WatchSeries - detail.id type:', typeof detail?.id);
        
        if (detail && detail.id && user) {
          const userId = parseInt(user.id);
          // detail.id is the actual movie ID from backend
          const movieId = typeof detail.id === 'string' ? parseInt(detail.id) || 0 : detail.id;
          
          if (movieId > 0) {
            // For series, we need to find the content_id for the specific episode
            // For now, we'll use the movie content_id and let backend handle episode logic
            console.log('WatchSeries - Adding to watch history:', {
              userId,
              movieId,
              currentEpisode: episode,
              episodeType: typeof episode,
              progress: 0,
              device: 'web'
            });
            
            // Không lưu vào lịch sử ngay khi vào trang
            // Chỉ lưu khi có progress thực sự (trong handleProgress)
            console.log('WatchSeries - Skipping initial history save (progress = 0)');
          } else {
            console.log('WatchSeries - Invalid content ID, not adding to watch history');
          }
        } else {
          console.log('WatchSeries - Not adding to watch history:', {
            hasDetail: !!detail,
            hasDetailId: !!detail?.id,
            hasUser: !!user
          });
        }
      })
      .catch(() => setDetail(null));
  }, [slug, provider, user]);

  // Load comments when detail changes
  useEffect(() => {
    if (detail?.id) {
      loadComments();
    }
  }, [detail?.id]);

  // Realtime comments
  const contentId = detail ? String(Number((detail as any)?.contentId) || 'external') : undefined;
  const movieId = detail && !(detail as any)?.contentId ? String(detail.id) : undefined;
  
  useRealtimeComments({
    contentId,
    provider: String(provider || 'local'),
    movieId,
    enabled: !!detail,
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

  // Save progress when user leaves the page
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (detail && user && currentTime > 0) {
        const userId = parseInt(user.id);
        const movieId = typeof detail.id === 'string' ? parseInt(detail.id) || 0 : detail.id;
        
        if (movieId > 0) {
          const duration = 1554; // 25m 54s for series episodes
          const progress = Math.round((currentTime / duration) * 100);
          console.log('Series page unload, saving progress:', { 
            currentTime, 
            progress,
            currentTimeFormatted: `${Math.floor(currentTime / 60)}:${(currentTime % 60).toString().padStart(2, '0')}`
          });
          // Use sendBeacon for reliable data sending on page unload
          const data = JSON.stringify({
            userId,
            movieId,
            progress,
            device: 'web'
          });
          navigator.sendBeacon('http://localhost:3001/api/watch-history', data);
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [detail, user, currentTime]);

  // Create stable callbacks to prevent VideoPlayer from re-rendering
  const handleProgress = useCallback((sec: number) => {
    // Update current time for tracking
    setCurrentTime(sec);
    
    console.log('📺 WatchSeries - handleProgress called:', { 
      sec, 
      hasDetail: !!detail, 
      hasUser: !!user, 
      detailId: detail?.id,
      userId: user?.id 
    });
    
    // Track progress in watch history
    if (detail && user && sec > 0) {
      const userId = parseInt(user.id);
      const movieId = typeof detail.id === 'string' ? parseInt(detail.id) || 0 : detail.id;
      
      console.log('📺 WatchSeries - Processing progress:', { 
        userId, 
        movieId, 
        seriesTitle: detail.title,
        seriesSlug: detail.id
      });
      
      if (movieId > 0) {
        // Calculate progress percentage using actual episode duration
        const duration = 1554; // 25m 54s in seconds for "Ngài Bean" episodes
        const progress = Math.round((sec / duration) * 100);
        
        // Update progress more frequently (every 3 seconds or 3% progress)
        if (sec > 0 && (sec % 3 === 0 || progress % 3 === 0)) {
          console.log('📺 WatchSeries - Updating progress:', { 
            sec, 
            progress, 
            duration,
            currentTime: `${Math.floor(sec / 60)}:${(sec % 60).toString().padStart(2, '0')}`
          });
          watchHistoryService.trackProgress(userId, movieId, progress, episode);
        }
      } else {
        console.log('📺 WatchSeries - Invalid movieId:', movieId);
      }
    } else {
      console.log('📺 WatchSeries - Missing detail or user:', { 
        hasDetail: !!detail, 
        hasUser: !!user, 
        sec 
      });
    }
  }, [detail, user]);

  const handlePause = useCallback((sec: number) => {
    // Save progress when user pauses
    if (detail && user && sec > 0) {
      const userId = parseInt(user.id);
      const movieId = typeof detail.id === 'string' ? parseInt(detail.id) || 0 : detail.id;
      
      if (movieId > 0) {
        const duration = 1554;
        const progress = Math.round((sec / duration) * 100);
        console.log('Series video paused, saving progress:', { 
          sec, 
          progress, 
          currentTime: `${Math.floor(sec / 60)}:${(sec % 60).toString().padStart(2, '0')}`
        });
        watchHistoryService.trackProgress(userId, movieId, progress, episode);
      }
    }
  }, [detail, user]);

  const handleEnded = useCallback((sec: number) => {
    // Mark as completed when video ends
    if (detail && user) {
      const userId = parseInt(user.id);
      const movieId = typeof detail.id === 'string' ? parseInt(detail.id) || 0 : detail.id;
      
      if (movieId > 0) {
        console.log('Series video ended, marking as completed');
        watchHistoryService.trackProgress(userId, movieId, 100, episode);
      }
    }
  }, [detail, user]);

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

  // chọn version mặc định khi dữ liệu sẵn sàng & đọc tham số version từ URL
  useEffect(() => {
    if (!detail?.versions || detail.versions.length === 0) return;
    const urlVersion = sp.get('version') || undefined;
    if (urlVersion && detail.versions.some(v => v.key === urlVersion)) {
      setSelectedVersion(urlVersion);
    } else {
      setSelectedVersion((prev) => prev ?? detail.versions[0].key);
    }
  }, [detail?.versions, sp]);

  // Khi selectedVersion thay đổi, tải stream tương ứng cho tập hiện tại (mặc định tập đầu hoặc theo tham số ep)
  useEffect(() => {
    (async () => {
      if (!detail?.id || !selectedVersion) return;
      try {
        const svc: any = MovieService.use(provider);
        // Nếu provider có API chất lượng, ưu tiên dùng; không thì fallback switchVersion nếu có
        let stream: any = undefined;
        if (svc.getAvailableQualities && svc.getStreamUrl) {
          const qualities = await svc.getAvailableQualities(slug, selectedVersion);
          const desired = Array.isArray(qualities) && qualities.length ? qualities[0] : undefined;
          stream = await svc.getStreamUrl(slug, selectedVersion, desired);
        } else if (svc.switchVersion) {
          stream = await svc.switchVersion(slug, selectedVersion);
        }
        if (stream?.hls || stream?.mp4) {
          setDetail((d) => (d ? { ...d, stream: { hls: stream.hls || d.stream.hls, mp4: stream.mp4 || d.stream.mp4 } } : d));
        }
      } catch {
        // ignore
      }
    })();
  }, [detail?.id, selectedVersion, provider]);

  // Favorite/Watchlist state hydrate based on current content id
  useEffect(() => {
    const checkFavoriteStatus = async () => {
      const id = (detail?.id || (data.id as any)) as any;
      if (!id) return;
      
      if (user) {
        // Check API for authenticated users
        try {
          const { InteractionsApi } = await import('../../../services/movies/interactions');
          const isFav = await InteractionsApi.checkFavorite(String(id), 'series');
          setIsFavorited(isFav);
        } catch (error) {
          console.error('Error checking favorite status:', error);
          // Fallback to localStorage
          const fav = JSON.parse(localStorage.getItem('phimhub:favorites') || '[]');
          setIsFavorited(fav.some((x: any) => (x.id || x) === id));
        }
      } else {
        // Check localStorage for non-authenticated users
        const fav = JSON.parse(localStorage.getItem('phimhub:favorites') || '[]');
        setIsFavorited(fav.some((x: any) => (x.id || x) === id));
      }
      
      // Watchlist still uses localStorage
      const wl = JSON.parse(localStorage.getItem('phimhub:watchlist') || '[]');
      setIsInWatchlist(wl.some((x: any) => (x.id || x) === id));
    };
    
    checkFavoriteStatus();
  }, [detail?.id, data.id, user]);

  const toggleFavorite = async () => {
    const id = (detail?.id || (data.id as any)) as any;
    if (!id) return;
    
    if (user) {
      // Use API for authenticated users
      try {
        const { InteractionsApi } = await import('../../../services/movies/interactions');
        if (isFavorited) {
          await InteractionsApi.removeFavorite(String(id), 'series');
        } else {
          await InteractionsApi.addFavorite(String(id), 'series');
        }
        setIsFavorited(!isFavorited);
        window.dispatchEvent(new CustomEvent('favoritesUpdated'));
      } catch (error) {
        console.error('Error updating favorites:', error);
      }
    } else {
      // Fallback to localStorage for non-authenticated users
      const fav = JSON.parse(localStorage.getItem('phimhub:favorites') || '[]');
      const exists = fav.some((x: any) => (x.id || x) === id);
      let next;
      if (exists) {
        next = fav.filter((x: any) => (x.id || x) !== id);
        setIsFavorited(false);
      } else {
        const item = { id, title: detail?.title || data.title, img: detail?.poster || detail?.banner || data.poster || data.banner, provider };
        next = [...fav, item];
        setIsFavorited(true);
      }
      localStorage.setItem('phimhub:favorites', JSON.stringify(next));
      window.dispatchEvent(new CustomEvent('favoritesUpdated'));
    }
  };

  const handleAddToList = () => {
    const id = (detail?.id || (data.id as any)) as any;
    if (!id) return;
    
    // Set selected movie data and show dialog
    setSelectedMovie({
      id: String(id),
      title: detail?.title || data.title,
      type: 'series'
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

  const scrollToComments = () => {
    const el = document.getElementById("comments-section");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  // ===== state từ query s, e =====
  const seasonNums = data.seasons.map((s) => s.season).sort((a, b) => a - b);
  const firstSeason = seasonNums[0];
  const lastSeason = seasonNums[seasonNums.length - 1] ?? firstSeason;

  const sQ = clamp(Number(sp.get("s") ?? firstSeason), firstSeason, lastSeason);

  const epsOfS =
    data.seasons.find((x) => x.season === sQ)?.episodes ??
    data.seasons[0].episodes;

  // Priority: ep parameter over e parameter
  const episodeKey = sp.get("ep") || sp.get("episode");
  let eQ = 1; // Default to 1
  
  if (episodeKey) {
    // Find episode number from slug (e.g., "tap-4" -> 4)
    const episodeMatch = episodeKey.match(/tap-(\d+)/);
    if (episodeMatch) {
      eQ = parseInt(episodeMatch[1]);
    }
  } else {
    eQ = clamp(Number(sp.get("e") ?? 1), 1, epsOfS.length);
  }

  // để hiển thị ngay lập tức khi đổi tập
  const [season, setSeason] = useState<number>(sQ);
  const [episode, setEpisode] = useState<number>(eQ);

  // Sync state when URL changes
  useEffect(() => {
    const newSQ = clamp(Number(sp.get("s") ?? 1), 1, data.seasons.length);
    
    // Priority: ep parameter over e parameter
    const episodeKey = sp.get("ep") || sp.get("episode");
    let newEQ = 1;
    
    if (episodeKey) {
      // Find episode number from slug (e.g., "tap-4" -> 4)
      const episodeMatch = episodeKey.match(/tap-(\d+)/);
      if (episodeMatch) {
        newEQ = parseInt(episodeMatch[1]);
      }
    } else {
      newEQ = clamp(Number(sp.get("e") ?? 1), 1, 
        data.seasons.find((x) => x.season === newSQ)?.episodes.length ?? 1
      );
    }
    
    // Always update state to match URL
    setSeason(newSQ);
    setEpisode(newEQ);
    
    console.log('🔄 URL sync:', {
      urlParams: { s: sp.get("s"), e: sp.get("e"), ep: sp.get("ep") },
      newState: { season: newSQ, episode: newEQ },
      oldState: { season, episode }
    });
  }, [sp, data.seasons]);

  // Clear old episode parameters and sync URL on initial load
  useEffect(() => {
    const hasOldEpisodeParam = sp.get("episode") && !sp.get("ep");
    const needsSync = !sp.get("ep") && episode > 0;
    const hasConflict = sp.get("e") && sp.get("ep") && 
      sp.get("e") !== sp.get("ep")?.replace("tap-", "");
    
    if (hasOldEpisodeParam || needsSync || hasConflict) {
      const newParams = new URLSearchParams(sp);
      newParams.delete("episode");
      
      // Sync e and ep parameters
      newParams.set("e", String(episode));
      newParams.set("ep", `tap-${episode}`);
      
      setSp(newParams, { replace: true });
      
      console.log('🔄 URL sync fix:', {
        oldParams: { e: sp.get("e"), ep: sp.get("ep") },
        newParams: { e: String(episode), ep: `tap-${episode}` },
        reason: hasConflict ? 'conflict' : needsSync ? 'missing' : 'old_param'
      });
    }
  }, [sp, setSp, episode]);

  // Force sync URL parameters on mount to fix conflicts
  useEffect(() => {
    const currentE = sp.get("e");
    const currentEp = sp.get("ep");
    
    if (currentE && currentEp) {
      const epNumber = currentEp.replace("tap-", "");
      if (currentE !== epNumber) {
        console.log('🚨 URL conflict detected on mount:', {
          e: currentE,
          ep: currentEp,
          epNumber
        });
        
        // Use ep parameter as source of truth
        const newParams = new URLSearchParams(sp);
        newParams.set("e", epNumber);
        setSp(newParams, { replace: true });
        
        console.log('✅ URL conflict resolved:', {
          newE: epNumber,
          ep: currentEp
        });
      }
    }
  }, []); // Run only on mount


  // đồng bộ state -> query
  const updateQuery = (s: number, e: number) => {
    const next = new URLSearchParams(sp);
    next.set("s", String(s));
    next.set("e", String(e));
    
    // Also set ep parameter for consistency
    next.set("ep", `tap-${e}`);
    
    // Remove old episode parameter to avoid conflicts
    next.delete("episode");
    
    setSp(next, { replace: true });
    
    console.log('🔄 State -> URL sync:', {
      newParams: { s, e, ep: `tap-${e}` },
      url: next.toString()
    });
    
    // Auto scroll to video player when episode changes
    setTimeout(() => {
      const videoPlayer = document.querySelector('[data-video-player]') || document.querySelector('video');
      if (videoPlayer) {
        videoPlayer.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  // đổi season
  const onChangeSeason = (s: number) => {
    // Reset video to beginning when switching seasons
    setResumeAt(0);
    
    const list =
      data.seasons.find((x) => x.season === s)?.episodes ??
      data.seasons[0].episodes;
    const nextE = clamp(episode, 1, list.length);
    setSeason(s);
    setEpisode(nextE);
    updateQuery(s, nextE);
    
    console.log('🎬 Season changed:', {
      newSeason: s,
      newEpisode: nextE,
      resumeAt: 0
    });
  };

  // đổi episode
  const onPickEpisode = (e: number) => {
    // Reset video to beginning when switching episodes
    setResumeAt(0);
    
    setEpisode(e);
    updateQuery(season, e);
    
    console.log('🎬 Episode changed via onPickEpisode:', {
      newEpisode: e,
      resumeAt: 0
    });
  };

  const currentEpisodes =
    data.seasons.find((x) => x.season === season)?.episodes ??
    data.seasons[0].episodes;

  // If provider returns episodes, prefer provider stream
  const serverKey = sp.get("server") || undefined;
  const pickServer = (episodes?: EpisodeServer[]) => {
    if (!episodes || episodes.length === 0) return undefined;
    if (serverKey) return episodes.find((s) => (s.server_slug || s.server_name) === serverKey) || episodes[0];
    return episodes[0];
  };
  const pickEpisode = (server?: EpisodeServer) => {
    if (!server || !server.server_data || server.server_data.length === 0) return undefined;
    // Deduplicate by slug/name to avoid duplicates
    const seen = new Set<string>();
    const list = server.server_data.filter((e) => {
      const key = e.slug || e.name;
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    
    // Check episode parameter (prioritized: ep > episode)
    const currentEpisodeKey = sp.get("ep") || sp.get("episode");
    if (currentEpisodeKey) {
      const found = list.find((e) => e.slug === currentEpisodeKey);
      if (found) return found;
    }
    
    // Fallback: Check episode number (e=13)
    const episodeNum = sp.get("e");
    if (episodeNum) {
      const num = parseInt(episodeNum);
      if (num > 0 && num <= list.length) {
        return list[num - 1];
      }
    }
    
    // No default selection - return undefined to avoid highlighting
    return undefined;
  };
  // Debug episodes data
  console.log('🎬 WatchSeries episodes debug:', {
    hasDetail: !!detail,
    hasEpisodes: !!detail?.episodes,
    episodesCount: detail?.episodes?.length || 0,
    episodes: detail?.episodes,
    firstEpisode: detail?.episodes?.[0]
  });

  const activeServer = pickServer(detail?.episodes);
  const activeEpisode = pickEpisode(activeServer);
  const providerStream = activeEpisode?.link_m3u8 || activeEpisode?.file;

  // Debug active server and episode
  console.log('🎬 WatchSeries active debug:', {
    activeServer: activeServer ? {
      server_name: activeServer.server_name,
      server_data_count: activeServer.server_data?.length || 0,
      server_data: activeServer.server_data
    } : null,
    activeEpisode: activeEpisode ? {
      name: activeEpisode.name,
      slug: activeEpisode.slug,
      link_m3u8: activeEpisode.link_m3u8,
      file: activeEpisode.file
    } : null,
    providerStream
  });

  // Use MP4 demo for testing instead of HLS
  // Always ensure we have a stream URL, fallback to demo if needed
  const streamUrl = providerStream || data.streamMp4(season, episode) || data.streamHls(season, episode) || SIMPLE_MP4;
  
  // Debug log
  const isDemoStream = streamUrl === SIMPLE_MP4 || streamUrl.includes('w3schools.com') || streamUrl.includes('gtv-videos-bucket');
  console.log('🎬 WatchSeries streamUrl debug:', {
    providerStream,
    season,
    episode,
    streamHls: data.streamHls(season, episode),
    streamMp4: data.streamMp4(season, episode),
    finalStreamUrl: streamUrl,
    hasDetail: !!detail,
    hasEpisodes: !!detail?.episodes,
    episodesCount: detail?.episodes?.length || 0,
    activeServer: !!activeServer,
    activeEpisode: !!activeEpisode,
    hasRealStream: !!(providerStream || (activeEpisode && (activeEpisode.link_m3u8 || activeEpisode.file))),
    isDemoStream,
    willShowMessage: !!(providerStream || (activeEpisode && (activeEpisode.link_m3u8 || activeEpisode.file))) || isDemoStream
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* PLAYER */}
      <section className={theater ? 'fixed inset-0 z-[1000] bg-[#000011]' : 'relative left-1/2 right-1/2 -mx-[50vw] w-screen bg-[#000011]'}>
        <div className={theater ? 'mx-auto h-full max-w-[96vw] px-3 py-4 md:px-4 flex flex-col' : 'mx-auto max-w-6xl px-3 py-4 md:px-4'}>
          {/* Header: back + title */}
          {!theater && (
          <div className="mb-3 flex items-center gap-3">
            <Link
              to={slug ? `/series/${slug}?provider=${provider}` : "/"}
              className="grid h-8 w-8 place-items-center rounded-full ring-1 ring-white/20 hover:bg-white/10"
            >
              <svg className="h-4 w-4 text-white/80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
            </Link>
            <div className="text-lg font-semibold">Xem phim {detail?.title || data.title}</div>
          </div>
          )}
          <div className={`${theater ? 'flex-1' : ''}`}>
            {(() => {
              // Check if we have real stream data (not demo data)
              const hasRealStream = providerStream || (activeEpisode && (activeEpisode.link_m3u8 || activeEpisode.file));
              const isDemoStream = streamUrl === SIMPLE_MP4 || streamUrl.includes('w3schools.com') || streamUrl.includes('gtv-videos-bucket');
              
              console.log('🎬 Stream check:', {
                providerStream,
                activeEpisode: !!activeEpisode,
                episodeLinkM3u8: activeEpisode?.link_m3u8,
                episodeFile: activeEpisode?.file,
                hasRealStream,
                isDemoStream,
                streamUrl,
                willShowMessage: !hasRealStream || isDemoStream
              });
              
              // Always show video player, even with demo stream
              // This ensures users can always watch something
              const finalStreamUrl = streamUrl || SIMPLE_MP4;
              
              if (!hasRealStream || isDemoStream) {
                console.log('🎬 Using demo stream for testing:', finalStreamUrl);
              }
              
              return (
                <VideoPlayer
                  src={finalStreamUrl}
                  poster={detail?.banner || data.banner}
                  subtitles={detail?.subtitles || data.subtitles}
                  startPosition={resumeAt}
                  onProgress={handleProgress}
                  onPause={handlePause}
                  onEnded={handleEnded}
                  data-video-player="true"
                />
              );
            })()}
          </div>

          {/* Action toolbar under player (match WatchMovie) */}
          {!theater && (
          <div className={`mt-3 flex items-center justify-between rounded-lg bg-white/5 px-3 py-2 ring-1 ring-white/10`}>
            <div className="flex flex-wrap items-center gap-5 text-sm text-white/80">
              <button className={`inline-flex items-center gap-2 hover:text-white ${isFavorited ? 'text-rose-400' : ''}`} onClick={toggleFavorite}>
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 6 4 4 6.5 4c1.54 0 3.04.99 3.57 2.36h.86C11.46 4.99 12.96 4 14.5 4 17 4 19 6 19 8.5c0 3.78-3.4 6.86-8.55 11.54z"/></svg>
                <span>Yêu thích</span>
              </button>
              <button className="inline-flex items-center gap-2 hover:text-white text-cyan-400" onClick={handleAddToList}>
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

      {/* INFO + EPISODES */}
      <section className="mx-auto w-full max-w-6xl px-3 md:px-4 py-6">
        <div className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10 backdrop-blur-sm md:p-6">
          {/* Header row: poster + info side-by-side */}
          <div className="grid grid-cols-[100px,1fr] items-start gap-4 sm:grid-cols-[120px,1fr] md:grid-cols-[140px,1fr]">
            <img
              src={detail?.poster || data.poster}
              alt={detail?.title || data.title}
              className="h-auto w-full rounded-xl ring-1 ring-white/10"
            />
            <div className="space-y-2">
              <div>
                <h1 className="text-xl font-semibold leading-tight md:text-2xl">{detail?.title || data.title}</h1>
                <p className="text-sm text-white/70">{detail?.originalTitle || data.original}</p>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs">
                {(detail?.rating || data.rating) && (
                  <span className="rounded bg-yellow-500/20 px-2 py-1 text-yellow-300">
                    IMDb {detail?.rating || data.rating}
                  </span>
                )}
                <span className="rounded bg-yellow-500/20 px-2 py-1 text-yellow-300">
                  FHD
                </span>
                <span className="rounded bg-white/10 px-2 py-1">Phần {season} · Tập {episode}</span>
                {(detail?.year || data.year) && <span className="rounded bg-white/10 px-2 py-1">{detail?.year || data.year}</span>}
                {(detail?.ageRating || data.age) && <span className="rounded bg-white/10 px-2 py-1">{detail?.ageRating || data.age}</span>}
              </div>

              <div className="flex flex-wrap gap-2 text-xs">
                {(detail?.genres || data.genres).map((g: any) => {
                  const label = getGenreDisplayName(typeof g === "string" ? g : g?.name || g?.title || "");
                  return label ? (
                    <span key={label} className="rounded-full border border-white/20 px-2 py-0.5">{label}</span>
                  ) : null;
                })}
              </div>

              <div className="text-sm leading-relaxed text-white/85">
                {(detail?.overview || data.overview) && (
                  <p className="line-clamp-4 md:line-clamp-5">{detail?.overview || data.overview}</p>
                )}
                <div className="mt-2">
                  <Link to={slug ? `/series/${slug}?provider=${provider}` : "/"} className="text-yellow-300 hover:text-yellow-200">Thông tin phim ▸</Link>
                </div>
              </div>
            </div>
          </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-[1fr,260px]">
            {/* LEFT column: versions + comments */}
            <div className="space-y-4">
              {/* Versions + Season/Episodes combined in one card */}
              <div className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10 backdrop-blur-sm">
          <h3 className="mb-3 text-lg font-semibold">Các bản chiếu</h3>
          {detail?.versions && detail.versions.length > 0 && (
            <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              {detail.versions.map((v) => {
                const isActive = v.key === selectedVersion;
                return (
                  <div key={v.key} className="relative overflow-hidden rounded-xl bg-slate-800/60 p-4 ring-1 ring-white/10 hover:ring-white/20">
                    <div className="flex items-center gap-3">
                      <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/20 px-2 py-1 text-xs text-purple-300">
                        <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7z" clipRule="evenodd"/></svg>
                        {v.label}
                      </span>
                      <div className="flex-1">
                        <div className="text-base font-semibold">{detail.title || data.title}</div>
                        {v.note && <div className="text-xs text-white/70">{v.note}</div>}
                      </div>
                      {(detail.poster || data.poster) && (
                        <img src={(detail.poster || data.poster) as string} alt={detail.title || data.title} className="hidden h-16 w-12 rounded object-cover ring-1 ring-white/10 sm:block" />
                      )}
                      <button
                        className={`rounded-lg px-3 py-1.5 text-sm font-medium ${isActive ? "bg-white/20 text-white cursor-default" : "bg-white text-slate-900 hover:bg-white/90"}`}
                        disabled={isActive}
                        onClick={() => {
                          if (!slug || isActive) return;
                          MovieService.use(provider)
                            .switchVersion?.(slug, v.key)
                            .then((res) => {
                              setSelectedVersion(v.key);
                              if (res) {
                                setDetail((d) => (d ? { ...d, subtitles: res.subtitles || d.subtitles } : d));
                              }
                            });
                        }}
                      >
                        {"Xem bản này"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Divider */}
          <div className="my-2 h-px w-full bg-white/10" />

          {/* Chọn mùa */}
          <div className="mb-3 flex items-center gap-3">
            <label className="text-sm text-white/70">Mùa:</label>
            <select
              value={season}
              onChange={(e) => onChangeSeason(Number(e.target.value))}
              className="rounded-lg bg-white/90 px-3 py-1.5 text-sm text-slate-800 outline-none"
            >
              {seasonNums.map((s) => (
                <option key={s} value={s}>
                  Phần {s}
                </option>
              ))}
            </select>
          </div>

          {/* Tập */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {(() => {
              const seen = new Set<string>();
              const list = (activeServer?.server_data || []).filter((ep) => {
                const key = ep.slug || ep.name;
                if (!key || seen.has(key)) return false;
                seen.add(key);
                return true;
              });
              return list;
            })().map((ep, index) => {
              // Check if this episode is active - prioritize URL parameter as source of truth
              const currentEpParam = sp.get("ep") || sp.get("episode");
              const currentEParam = sp.get("e");
              let isActive = false;
              
              if (currentEpParam) {
                // If URL has ep parameter, use that as the only source of truth
                isActive = currentEpParam === ep.slug;
              } else if (currentEParam) {
                // If URL has e parameter, compare with episode number
                const episodeNum = parseInt(currentEParam);
                isActive = (index + 1) === episodeNum;
              } else {
                // Fallback to episode number from state only if no URL parameter
                isActive = (index + 1) === episode;
              }
              
              // Debug logging for episode selection
              console.log('🎬 Episode selection debug:', {
                episodeIndex: index + 1,
                epSlug: ep.slug,
                currentEpParam,
                currentEParam,
                episode,
                isActive
              });
              
              const next = new URLSearchParams(sp);
              next.set("server", activeServer?.server_slug || activeServer?.server_name || "");
              next.set("ep", ep.slug);
              // Remove old episode parameter to avoid conflicts
              next.delete("episode");
              
              const handleEpisodeClick = () => {
                // Reset video to beginning when switching episodes
                setResumeAt(0);
                
                // Update both state and URL simultaneously
                setEpisode(index + 1);
                setSp(next, { replace: true });
                
                console.log('🎬 Episode changed:', {
                  newEpisode: index + 1,
                  newSlug: ep.slug,
                  resumeAt: 0
                });
                
                // Auto scroll to video player
                setTimeout(() => {
                  const videoPlayer = document.querySelector('[data-video-player]') || document.querySelector('video');
                  if (videoPlayer) {
                    videoPlayer.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                }, 100);
              };
              
              return (
                <button
                  key={ep.slug}
                  onClick={handleEpisodeClick}
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

        {/* Bình luận */}
        <div className="mt-4 rounded-2xl bg-white/5 p-6 ring-1 ring-white/10 backdrop-blur-sm" id="comments-section">
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
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                        {String(c.fullname || c.username || 'U').slice(0,1).toUpperCase()}
                      </div>
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
                                      const contentId = Number((detail as any)?.contentId);
                                      if (contentId) {
                                        await InteractionsApi.updateComment(c.id, editText);
                                        const list = await InteractionsApi.listComments(contentId, 1, 20);
                                        setComments(list);
                                      } else if (detail?.id) {
                                        const providerName = String(provider || 'local');
                                        await InteractionsApi.updateExternalComment(c.id, editText);
                                        const list = await InteractionsApi.listExternalComments(providerName, String(detail.id), 1, 20);
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
                                        const contentId = Number((detail as any)?.contentId);
                                        if (contentId) {
                                          await InteractionsApi.deleteComment(c.id);
                                          const list = await InteractionsApi.listComments(contentId, 1, 20);
                                          setComments(list);
                                        } else if (detail?.id) {
                                          const providerName = String(provider || 'local');
                                          await InteractionsApi.deleteExternalComment(c.id);
                                          const list = await InteractionsApi.listExternalComments(providerName, String(detail.id), 1, 20);
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
                                      const contentId = Number((detail as any)?.contentId);
                                      if (contentId) {
                                        await InteractionsApi.createComment(contentId, replyText, c.id);
                                        const list = await InteractionsApi.listComments(contentId, 1, 20);
                                        setComments(list);
                                      } else if (detail?.id) {
                                        const providerName = String(provider || 'local');
                                        await InteractionsApi.createExternalComment(providerName, String(detail.id), replyText, c.id);
                                        const list = await InteractionsApi.listExternalComments(providerName, String(detail.id), 1, 20);
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
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center text-white font-bold text-xs">
                              {String(reply.fullname || reply.username || 'U').slice(0,1).toUpperCase()}
                            </div>
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
                                            const contentId = Number((detail as any)?.contentId);
                                            if (contentId) {
                                              await InteractionsApi.updateComment(reply.id, editText);
                                              const list = await InteractionsApi.listComments(contentId, 1, 20);
                                              setComments(list);
                                            } else if (detail?.id) {
                                              const providerName = String(provider || 'local');
                                              await InteractionsApi.updateExternalComment(reply.id, editText);
                                              const list = await InteractionsApi.listExternalComments(providerName, String(detail.id), 1, 20);
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
                                            const contentId = Number((detail as any)?.contentId);
                                            if (contentId) {
                                              await InteractionsApi.deleteComment(reply.id);
                                              const list = await InteractionsApi.listComments(contentId, 1, 20);
                                              setComments(list);
                                            } else if (detail?.id) {
                                              const providerName = String(provider || 'local');
                                              await InteractionsApi.deleteExternalComment(reply.id);
                                              const list = await InteractionsApi.listExternalComments(providerName, String(detail.id), 1, 20);
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
                  {(displayCast.length > 0 ? displayCast : [{ name: 'Louison Boulanger' }, { name: 'Antoine Sauvion' }, { name: 'Véronique Caquineau' }]).slice(0, 6).map((actor, index) => (
                    <ActorCard
                      key={index}
                      actor={{
                        name: actor.name,
                        role_name: actor.role
                      }}
                      size="small"
                      showRole={true}
                    />
                  ))}
                </div>
              </div>
            </aside>
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
