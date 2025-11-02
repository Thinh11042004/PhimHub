// src/shared/components/VideoPlayer.tsx
import { useCallback, useEffect, useRef, useState, useMemo } from "react";
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
  theaterMode?: boolean;    // Nếu true, bỏ border radius và ring
  objectFitCover?: boolean; // Khi theaterMode: true, dùng cover (crop) thay vì contain
};

export default function VideoPlayer({ src, poster, subtitles = [], startPosition = 0, onProgress, onPause, onEnded, theaterMode = false, objectFitCover = false }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isBuffering, setIsBuffering] = useState(false);

  const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001/api';

  // Use original remote src without proxy for all episode_url
  const remoteSrc = src;

  // Still proxy subtitles to avoid CORS for .vtt files
  const proxiedSubtitles = useMemo(() => subtitles.map(s => ({
    ...s,
    src: s.src && /^https?:\/\//i.test(s.src) ? `${API_BASE}/proxy?url=${encodeURIComponent(s.src)}` : s.src
  })), [subtitles, API_BASE]);
  
  const stableOnProgress = useCallback(onProgress || (() => {}), [onProgress]);
  const stableOnPause = useCallback(onPause || (() => {}), [onPause]);
  const stableOnEnded = useCallback(onEnded || (() => {}), [onEnded]);
  
  useEffect(() => {
    const video = videoRef.current!;
    let hls: Hls | undefined;
    
    setReady(false);
    setError(null);

    video.crossOrigin = "anonymous";
    
    const timeout = setTimeout(() => {
      if (!ready) {
        setError('Video không thể tải được. Vui lòng thử lại.');
      }
    }, 30000);

    const attachSubs = () => {
      video.querySelectorAll("track").forEach((t) => t.remove());
      proxiedSubtitles.forEach((t) => {
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

    if (remoteSrc.endsWith(".m3u8") && Hls.isSupported() && !canNativeHls) {
      hls = new Hls({ 
        enableWorker: true,
        lowLatencyMode: false,
        backBufferLength: 10,
        maxBufferLength: 30,
        maxMaxBufferLength: 60,
        maxBufferSize: 30 * 1000 * 1000,
        maxBufferHole: 0.1,
        highBufferWatchdogPeriod: 1,
        nudgeOffset: 0.1,
        nudgeMaxRetry: 3,
        maxFragLookUpTolerance: 0.2,
        liveSyncDurationCount: 3,
        liveMaxLatencyDurationCount: 5,
        liveDurationInfinity: true,
        liveBackBufferLength: 0,
        maxLiveSyncPlaybackRate: 1,
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
      // Load original remote URL directly (no proxy)
      hls.loadSource(remoteSrc);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        const levels = hls!.levels;
        if (levels && levels.length > 0) {
          const preferredLevel = levels.find((level: any) => level.height <= 720) || levels[0];
          if (preferredLevel && typeof (preferredLevel as any).level === 'number') {
            (hls as any).currentLevel = (preferredLevel as any).level;
          }
        }
        setReady(true);
        attachSubs();
      });

      let bufferingCount = 0;
      let lastBufferingTime = 0;
      
      (hls as any).on((Hls as any).Events.BUFFER_STALLED, () => {
        const now = Date.now();
        if (now - lastBufferingTime > 5000) {
          bufferingCount++;
          lastBufferingTime = now;
          setIsBuffering(true);
          if (bufferingCount >= 2 && (hls as any).levels && (hls as any).levels.length > 1) {
            const currentLevel = (hls as any).currentLevel;
            const lowerLevel = (hls as any).levels.find((level: any) => level.level < currentLevel);
            if (lowerLevel) {
              (hls as any).currentLevel = lowerLevel.level;
              bufferingCount = 0;
            }
          }
        }
      });

      (hls as any).on((Hls as any).Events.BUFFER_APPENDED, () => setIsBuffering(false));
      (hls as any).on((Hls as any).Events.ERROR, (_e: any, data: any) => {
        if (data.fatal && video.canPlayType('application/vnd.apple.mpegurl')) {
          (video as any).src = remoteSrc;
          video.addEventListener("loadedmetadata", () => {
            setReady(true);
            attachSubs();
          }, { once: true });
        }
      });
    } else {
      (video as any).src = remoteSrc;
      const onLoaded = () => { setReady(true); attachSubs(); };
      const onError = () => {};
      video.addEventListener("loadedmetadata", onLoaded, { once: true });
      video.addEventListener("error", onError, { once: true });
    }

    const tick = () => stableOnProgress(video.currentTime || 0);
    const id = window.setInterval(tick, 5000);
    const handlePause = () => stableOnPause(video.currentTime || 0);
    const handleEnded = () => stableOnEnded(video.currentTime || 0);
    
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);

    return () => {
      clearTimeout(timeout);
      window.clearInterval(id);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
      if (hls) hls.destroy();
    };
  }, [remoteSrc, proxiedSubtitles, stableOnProgress, stableOnPause, stableOnEnded]);

  useEffect(() => {
    const video = videoRef.current;
    if (video && ready && startPosition > 0) {
      video.currentTime = startPosition;
    }
  }, [startPosition, ready]);

  return (
    <div className={`relative w-full overflow-hidden ${theaterMode ? 'h-full' : 'rounded-2xl ring-1 ring-white/10'}`}>
      <video
        ref={videoRef}
        poster={getImageUrl(poster || '')}
        className={`${theaterMode ? `h-full w-full ${objectFitCover ? 'object-cover' : 'object-contain'}` : 'aspect-video w-full'} bg-black`}
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
