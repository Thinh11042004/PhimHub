// src/shared/components/VideoPlayer.tsx
import { useCallback, useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import { getImageUrl } from "../../utils/imageProxy";

export type SubtitleTrack = { label: string; src: string; lang?: string; default?: boolean };

type Props = {
  src: string;              // m3u8 hoặc mp4
  poster?: string;
  subtitles?: SubtitleTrack[];
  startPosition?: number;   // giây
  onProgress?: (sec: number) => void;
  onPause?: (sec: number) => void;
  onEnded?: (sec: number) => void;
};

export default function VideoPlayer({ src, poster, subtitles = [], startPosition = 0, onProgress, onPause, onEnded }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isBuffering, setIsBuffering] = useState(false);
  
  // Create stable callbacks to prevent useEffect from re-running
  const stableOnProgress = useCallback(onProgress || (() => {}), [onProgress]);
  const stableOnPause = useCallback(onPause || (() => {}), [onPause]);
  const stableOnEnded = useCallback(onEnded || (() => {}), [onEnded]);
  
  console.log('🎬 VideoPlayer render:', { src, startPosition, ready });

  useEffect(() => {
    console.log('🎬 VideoPlayer useEffect triggered:', { src, startPosition });
    const video = videoRef.current!;
    let hls: Hls | undefined;
    
    // Reset states
    setReady(false);
    setError(null);

    // đảm bảo CORS cho phụ đề/HLS
    video.crossOrigin = "anonymous";
    
    // Set timeout to show error if video doesn't load (increased to 30 seconds)
    const timeout = setTimeout(() => {
      if (!ready) {
        setError('Video không thể tải được. Vui lòng thử lại.');
        console.error('Video loading timeout');
      }
    }, 30000); // 30 seconds timeout

    const attachSubs = () => {
      // clear cũ
      video.querySelectorAll("track").forEach((t) => t.remove());
      // add mới
      subtitles.forEach((t) => {
        const track = document.createElement("track");
        track.kind = "subtitles";
        track.label = t.label;
        track.srclang = t.lang || "und";
        track.src = t.src;
        if (t.default) track.default = true;
        video.appendChild(track);
      });
    };

    const canNativeHls = video.canPlayType("application/vnd.apple.mpegurl") === "probably";

    if (src.endsWith(".m3u8") && Hls.isSupported() && !canNativeHls) {
      hls = new Hls({ 
        enableWorker: true,
        lowLatencyMode: false,
        // Reduce buffer settings to prevent excessive buffering
        backBufferLength: 10, // Reduced from 30
        maxBufferLength: 30, // Reduced from 60
        maxMaxBufferLength: 60, // Reduced from 120
        maxBufferSize: 30 * 1000 * 1000, // Reduced to 30MB
        maxBufferHole: 0.1,
        highBufferWatchdogPeriod: 1, // Reduced from 2
        nudgeOffset: 0.1,
        nudgeMaxRetry: 3,
        maxFragLookUpTolerance: 0.2,
        liveSyncDurationCount: 3,
        liveMaxLatencyDurationCount: 5,
        liveDurationInfinity: true,
        liveBackBufferLength: 0,
        maxLiveSyncPlaybackRate: 1,
        liveSyncDuration: undefined,
        liveMaxLatencyDuration: undefined,
        manifestLoadingTimeOut: 10000,
        manifestLoadingMaxRetry: 1,
        manifestLoadingRetryDelay: 1000,
        levelLoadingTimeOut: 10000,
        levelLoadingMaxRetry: 4,
        levelLoadingRetryDelay: 1000,
        fragLoadingTimeOut: 20000,
        fragLoadingMaxRetry: 6,
        fragLoadingRetryDelay: 1000,
        startFragPrefetch: true,
        testBandwidth: true,
        progressive: false
      });
      hls.loadSource(src);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        console.log('🎬 VideoPlayer HLS ready');
        
        // Auto-select appropriate quality level
        const levels = hls.levels;
        console.log('🎬 HLS levels:', levels);
        if (!levels || levels.length === 0) {
          console.warn('⚠️ No HLS levels available');
          return;
        }
        if (levels && levels.length > 0) {
          // Prefer lower quality for better buffering
          const preferredLevel = levels.find(level => level.height <= 720) || levels[0];
          if (preferredLevel && typeof preferredLevel.level === 'number') {
            hls.currentLevel = preferredLevel.level;
            console.log('🎬 Auto-selected quality:', {
              level: preferredLevel.level,
              height: preferredLevel.height,
              bitrate: preferredLevel.bitrate
            });
          } else {
            console.warn('⚠️ Invalid HLS level:', preferredLevel);
          }
        }
        
        setReady(true);
        attachSubs();
      });

      // Monitor buffering and auto-downgrade quality
      let bufferingCount = 0;
      let lastBufferingTime = 0;
      
      hls.on(Hls.Events.BUFFER_STALLED, () => {
        const now = Date.now();
        if (now - lastBufferingTime > 5000) { // Only count if > 5 seconds apart
          bufferingCount++;
          lastBufferingTime = now;
          setIsBuffering(true);
          
          console.log('🔄 HLS Buffering detected:', { count: bufferingCount });
          
          // Auto-downgrade quality after 2 buffering events
          if (bufferingCount >= 2 && hls.levels && hls.levels.length > 1) {
            const currentLevel = hls.currentLevel;
            const lowerLevel = hls.levels.find(level => level.level < currentLevel);
            
            if (lowerLevel) {
              hls.currentLevel = lowerLevel.level;
              bufferingCount = 0; // Reset counter
              console.log('⬇️ Auto-downgraded quality:', {
                from: currentLevel,
                to: lowerLevel.level,
                height: lowerLevel.height
              });
            }
          }
        }
      });

      hls.on(Hls.Events.BUFFER_APPENDED, () => {
        setIsBuffering(false);
        console.log('✅ HLS Buffer appended - buffering resolved');
      });
      hls.on(Hls.Events.ERROR, (_e, data) => {
        console.error("HLS error:", data);
        
        // Handle specific error types
        if (data.type === 'otherError' && data.details === 'internal Exception') {
          console.warn('⚠️ HLS internal exception, continuing...');
          return;
        }
        
        if (data.fatal) {
          console.error("Fatal HLS error, trying fallback");
          // Try to fallback to direct video source
          if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = src;
            video.addEventListener("loadedmetadata", () => {
              console.log('🎬 VideoPlayer HLS fallback ready');
              setReady(true);
              attachSubs();
            }, { once: true });
          }
        }
      });

      // Handle buffering events
      hls.on(Hls.Events.BUFFER_STALLED, () => {
        console.warn('🎬 HLS buffer stalled - reducing quality');
        if (hls.currentLevel > 0) {
          hls.currentLevel = hls.currentLevel - 1;
        }
      });

      hls.on(Hls.Events.BUFFER_APPENDED, () => {
        console.log('🎬 HLS buffer appended');
      });

      hls.on(Hls.Events.LEVEL_SWITCHED, (_e, data) => {
        console.log('🎬 HLS level switched:', {
          from: data.prevLevel,
          to: data.level,
          height: hls.levels[data.level]?.height,
          bitrate: hls.levels[data.level]?.bitrate
        });
      });
    } else {
      // MP4 hoặc native HLS (Safari/iOS)
      (video as any).src = src;
      const onLoaded = () => {
        console.log('🎬 VideoPlayer MP4 ready');
        setReady(true);
        attachSubs();
      };
      const onError = (e: any) => {
        console.error('🎬 VideoPlayer MP4 error:', e);
        console.error('Video error details:', {
          error: video.error,
          networkState: video.networkState,
          readyState: video.readyState,
          src: video.src
        });
      };
      video.addEventListener("loadedmetadata", onLoaded, { once: true });
      video.addEventListener("error", onError, { once: true });
    }

    const tick = () => stableOnProgress(video.currentTime || 0);
    const id = window.setInterval(tick, 5000);

    // Add event listeners for pause and ended
    const handlePause = () => stableOnPause(video.currentTime || 0);
    const handleEnded = () => stableOnEnded(video.currentTime || 0);
    
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);

    // Monitor buffering events for MP4 videos
    let bufferingCount = 0;
    let lastBufferingTime = 0;
    
    const handleWaiting = () => {
      const now = Date.now();
      if (now - lastBufferingTime > 3000) { // Only count if > 3 seconds apart
        bufferingCount++;
        lastBufferingTime = now;
        setIsBuffering(true);
        
        console.log('🔄 MP4 Buffering detected:', { 
          count: bufferingCount,
          currentTime: video.currentTime,
          networkState: video.networkState,
          readyState: video.readyState
        });
      }
    };
    
    const handleCanPlay = () => {
      setIsBuffering(false);
      console.log('✅ MP4 Can play - buffering resolved');
    };
    
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('canplay', handleCanPlay);

    return () => {
      clearTimeout(timeout);
      window.clearInterval(id);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('canplay', handleCanPlay);
      if (hls) hls.destroy();
    };
  }, [src, subtitles, stableOnProgress, stableOnPause, stableOnEnded]);

  // Handle startPosition separately to avoid reloading video
  useEffect(() => {
    const video = videoRef.current;
    if (video && ready && startPosition > 0) {
      console.log('🎬 VideoPlayer - Setting start position:', startPosition);
      video.currentTime = startPosition;
    }
  }, [startPosition, ready]);

  return (
    <div className="relative w-full overflow-hidden rounded-2xl ring-1 ring-white/10">
      <video
        ref={videoRef}
        poster={getImageUrl(poster || '')}
        className="aspect-video w-full bg-black"
        controls
        playsInline
        preload="metadata"
      />
      {!ready && !error && (
        <div className="absolute inset-0 grid place-items-center bg-black/40">
          <div className="animate-pulse rounded-full bg-white/20 px-4 py-2 text-sm">Đang tải video…</div>
        </div>
      )}
      {isBuffering && (
        <div className="absolute inset-0 grid place-items-center bg-black/40">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white"></div>
            <div className="text-sm text-white/80">Đang tải video...</div>
          </div>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 grid place-items-center bg-black/40">
          <div className="rounded-lg bg-red-500/20 px-4 py-2 text-sm text-red-300">
            {error}
          </div>
          <button 
            onClick={() => {
              setError(null);
              setReady(false);
              // Reload the video
              const video = videoRef.current;
              if (video) {
                video.load();
              }
            }}
            className="mt-2 rounded bg-blue-500 px-3 py-1 text-xs text-white hover:bg-blue-600"
          >
            Thử lại
          </button>
        </div>
      )}
    </div>
  );
}
