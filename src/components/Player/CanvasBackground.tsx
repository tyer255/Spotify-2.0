import React, { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Track } from '../../types';
import { CanvasService, CanvasData } from '../../services/CanvasService';
import { usePlayer } from '../../context/PlayerContext';

interface CanvasBackgroundProps {
  isArtworkVisible?: boolean;
  track: Track;
  dominantColor: string;
  onVideoReady: (isReady: boolean) => void;
}

interface TrackCanvasState {
  trackId: string;
  requestedTrackId: string;
  canvasAssetId?: string;
  canvasEntityUri?: string;
  isrc?: string;
  canvasUrl: string | null;
  trackMatched: boolean;
  canvasAssetMatched: boolean;
  status: 'idle' | 'loading' | 'verified' | 'rejected';
  verificationReason?: string;
}

export const CanvasBackground: React.FC<CanvasBackgroundProps> = ({ track, dominantColor, onVideoReady, isArtworkVisible }) => {
  // Track-scoped Canvas State
  const [canvasState, setCanvasState] = useState<TrackCanvasState>({
    trackId: track?.id || '',
    requestedTrackId: track?.id || '',
    isrc: track?.isrc,
    canvasUrl: null,
    trackMatched: false,
    canvasAssetMatched: false,
    status: 'idle',
  });

  const [isVideoReady, setIsVideoReady] = useState(false);
  const [videoPlaybackError, setVideoPlaybackError] = useState(false);
  const { isPlaying, canvasEnabled, dataSaver } = usePlayer();
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const currentTrackIdRef = useRef<string>(track?.id || '');
  const videoTrackIdRef = useRef<string>('');
  const playPromiseRef = useRef<Promise<void> | null>(null);

  const artworkUrl = track.images?.large || track.images?.medium || track.images?.small || undefined;
  // Restart video when artwork is hidden
  useEffect(() => {
    if (!isArtworkVisible && videoRef.current && isVideoReady) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {});
    }
  }, [isArtworkVisible, isVideoReady]);

  const shouldShowCanvas = canvasEnabled && !dataSaver;

  /**
   * Standardized Comprehensive Verification Logger
   */
  const logCanvasVerificationStatus = useCallback((
    stage: string,
    canvasData?: CanvasData | null,
    reason?: string
  ) => {
    const video = videoRef.current;
    console.log(
      `\n%c[Canvas Verification - ${stage}]%c\n` +
      `--------------------------------------------------\n` +
      `CURRENT TRACK:\n` +
      `  • trackId:            ${track.id}\n` +
      `  • spotifyUri:         ${track.spotifyUri || 'N/A'}\n` +
      `  • isrc:               ${track.isrc || 'N/A'}\n` +
      `  • title:              ${track.title}\n` +
      `  • artist:             ${track.artist}\n` +
      `  • album:              ${track.album || 'N/A'}\n` +
      `CANVAS ASSET IDENTITY:\n` +
      `  • requestedTrackId:   ${track.id}\n` +
      `  • canvasAssetId:      ${canvasData?.canvasAssetId || 'N/A'}\n` +
      `  • canvasEntityUri:    ${canvasData?.canvasEntityUri || 'N/A'}\n` +
      `  • canvasTrackId:      ${canvasData?.canvasTrackId || 'N/A'}\n` +
      `  • canvasISRC:         ${canvasData?.isrc || 'N/A'}\n` +
      `  • canvasUrl:          ${canvasData?.canvasUrl || 'None (Fallback to Artwork)'}\n` +
      `  • trackMatched:       ${canvasData?.trackMatched ? '✅ YES' : '❌ NO'}\n` +
      `  • canvasAssetMatched: ${canvasData?.canvasAssetMatched ? '✅ YES' : '❌ NO'}\n` +
      `  • verificationResult: ${canvasData?.verified ? '✅ VERIFIED 1:1 ASSET' : '❌ REJECTED / NOT FOUND'}\n` +
      `  • verificationReason: ${reason || canvasData?.verificationReason || 'No canvas available'}\n` +
      `VIDEO ELEMENT STATUS:\n` +
      `  • videoTrackId:       ${videoTrackIdRef.current || 'Unbound'}\n` +
      `  • readyState:         ${video?.readyState ?? 'N/A'}\n` +
      `  • currentTime:        ${video?.currentTime ? `${video.currentTime.toFixed(2)}s` : '0.00s'}\n` +
      `  • video.paused:       ${video?.paused ?? 'N/A'}\n` +
      `  • video.loop:         ${video?.loop ?? 'N/A'}\n` +
      `--------------------------------------------------`,
      'color: #1db954; font-weight: bold;',
      'color: inherit;'
    );
  }, [track]);

  // Video Element Playback - COMPLETELY DECOUPLED FROM AUDIO PLAY/PAUSE
  const attemptPlayVideo = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    // Strict identity check before playing video
    if (videoTrackIdRef.current !== track.id && currentTrackIdRef.current !== track.id) {
      console.warn(`[Canvas Safety] Blocked play attempt: Video track ID "${videoTrackIdRef.current}" does not match active track "${track.id}".`);
      return;
    }

    if (canvasState.status !== 'verified' || !canvasState.canvasUrl || videoPlaybackError) {
      return;
    }

    // Crucial for browser autoplay policy in iframes & mobile
    video.muted = true;
    video.defaultMuted = true;
    video.loop = true;
    video.playsInline = true;
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', '');
    video.setAttribute('muted', '');

    try {
      const promise = video.play();
      if (promise !== undefined) {
        playPromiseRef.current = promise;
        promise
          .then(() => {
            if (video.videoWidth > 0 || video.readyState >= 2) {
              setIsVideoReady(true);
              onVideoReady(true);
            }
            logCanvasVerificationStatus('VIDEO PLAYING (INDEPENDENT OF AUDIO)');
          })
          .catch((err: any) => {
            console.warn('[Canvas] Autoplay play() caught (waiting for interaction):', err?.message || err);
            const unlockCanvas = () => {
              if (video && (videoTrackIdRef.current === track.id || currentTrackIdRef.current === track.id)) {
                video.muted = true;
                video.play().then(() => {
                  if (video.videoWidth > 0 || video.readyState >= 2) {
                    setIsVideoReady(true);
                    onVideoReady(true);
                  }
                }).catch(() => {});
              }
              window.removeEventListener('pointerdown', unlockCanvas);
              window.removeEventListener('keydown', unlockCanvas);
              window.removeEventListener('touchstart', unlockCanvas);
              window.removeEventListener('click', unlockCanvas);
            };
            window.addEventListener('pointerdown', unlockCanvas, { once: true, passive: true });
            window.addEventListener('keydown', unlockCanvas, { once: true, passive: true });
            window.addEventListener('touchstart', unlockCanvas, { once: true, passive: true });
            window.addEventListener('click', unlockCanvas, { once: true, passive: true });
          });
      }
    } catch (e: any) {
      console.warn('[Canvas] Video play() failed synchronously:', e?.message || e);
    }
  }, [track.id, canvasState.status, canvasState.canvasUrl, videoPlaybackError, onVideoReady, logCanvasVerificationStatus]);

  /**
   * Immediate Previous Canvas Cleanup on Track Change & Race-Condition Safe Resolver
   * (NO 40-60s delay; resolves immediately when track changes)
   */
  useEffect(() => {
    if (!track?.id) return;

    const requestedTrackId = track.id;
    currentTrackIdRef.current = requestedTrackId;
    let isCurrentRequestActive = true;

    // 1. IMMEDIATELY stop and detach previous video element
    const video = videoRef.current;
    if (video) {
      video.pause();
      video.removeAttribute('src');
      video.load();
    }
    videoTrackIdRef.current = '';

    // 2. IMMEDIATELY reset state so previous Canvas vanishes instantly
    setIsVideoReady(false);
    setVideoPlaybackError(false);
    onVideoReady(false);
    setCanvasState({
      trackId: requestedTrackId,
      requestedTrackId: requestedTrackId,
      isrc: track.isrc,
      canvasUrl: null,
      trackMatched: false,
      canvasAssetMatched: false,
      status: 'loading',
      verificationReason: 'Resolving exact 1:1 Canvas asset...',
    });

    if (!shouldShowCanvas) {
      setCanvasState({
        trackId: requestedTrackId,
        requestedTrackId: requestedTrackId,
        canvasUrl: null,
        trackMatched: false,
        canvasAssetMatched: false,
        status: 'rejected',
        verificationReason: 'Canvas disabled by user or Data Saver mode',
      });
      return;
    }

    const resolveCanvasForTrack = async () => {
      try {
        const data = await CanvasService.getCanvasForTrack(track);

        // Ensure track did not change while request was in-flight
        if (!isCurrentRequestActive || currentTrackIdRef.current !== requestedTrackId) {
          console.log(`[Canvas Safety] Late response discarded for old track ${requestedTrackId} (Active: ${currentTrackIdRef.current})`);
          return;
        }

        // Strict Exact 1:1 Track & Asset Match
        // Requirement: currentTrackId === requestedTrackId AND canonicalSpotifyTrackId === canvasTrackId
        const isCanonicalBound = !data?.canonicalSpotifyTrackId || !data?.canvasTrackId || (data.canonicalSpotifyTrackId === data.canvasTrackId);
        
        if (data && data.verified && data.canvasAssetMatched && data.canvasUrl && data.requestedTrackId === requestedTrackId && isCanonicalBound) {
          // Double verify ISRC if present
          if (track.isrc && data.isrc && track.isrc.trim().toUpperCase() !== data.isrc.trim().toUpperCase()) {
            logCanvasVerificationStatus('REJECTED_ISRC_MISMATCH', data, `ISRC mismatch: Track (${track.isrc}) vs Canvas (${data.isrc})`);
            setCanvasState({
              trackId: requestedTrackId,
              requestedTrackId,
              isrc: track.isrc,
              canvasUrl: null,
              trackMatched: false,
              canvasAssetMatched: false,
              status: 'rejected',
              verificationReason: `ISRC mismatch: Track (${track.isrc}) vs Canvas (${data.isrc})`,
            });
            onVideoReady(false);
            return;
          }

          // Verified & Safe to Bind
          videoTrackIdRef.current = requestedTrackId;
          setCanvasState({
            trackId: requestedTrackId,
            requestedTrackId,
            canvasAssetId: data.canvasAssetId,
            canvasEntityUri: data.canvasEntityUri,
            isrc: data.isrc || track.isrc,
            canvasUrl: data.canvasUrl,
            trackMatched: true,
            canvasAssetMatched: true,
            status: 'verified',
            verificationReason: data.verificationReason,
          });

          // Log Canvas Content Fingerprint
          console.log(
            `%c[Canvas Content Fingerprint]%c\n` +
            `  • trackId (active):           ${requestedTrackId}\n` +
            `  • canonicalSpotifyTrackId:  ${data.canonicalSpotifyTrackId || 'N/A'}\n` +
            `  • canvasTrackId:            ${data.canvasTrackId || 'N/A'}\n` +
            `  • canvasAssetId:            ${data.canvasAssetId || 'N/A'}\n` +
            `  • canvasUrl:                ${data.canvasUrl}\n` +
            `  • 1:1 Identity Check:       PASSED (canonicalSpotifyTrackId === canvasTrackId)`,
            'color: #1db954; font-weight: bold;',
            'color: inherit;'
          );

          logCanvasVerificationStatus('VERIFIED_MATCH', data, data.verificationReason);
        } else {
          // Unverified or mismatched identity -> Strict fallback to Artwork
          const reason = !isCanonicalBound 
            ? `Canonical Spotify Track ID mismatch (${data?.canonicalSpotifyTrackId} !== ${data?.canvasTrackId})` 
            : 'No authoritative 1:1 Canvas asset found';
          logCanvasVerificationStatus('REJECTED_UNVERIFIED', null, reason);
          setCanvasState({
            trackId: requestedTrackId,
            requestedTrackId,
            isrc: track.isrc,
            canvasUrl: null,
            trackMatched: false,
            canvasAssetMatched: false,
            status: 'rejected',
            verificationReason: `${reason}; using album artwork fallback`,
          });
          onVideoReady(false);
        }
      } catch (err: any) {
        if (isCurrentRequestActive && currentTrackIdRef.current === requestedTrackId) {
          console.warn(`[Canvas] Resolution error for "${track.title}":`, err?.message || err);
          setCanvasState({
            trackId: requestedTrackId,
            requestedTrackId,
            isrc: track.isrc,
            canvasUrl: null,
            trackMatched: false,
            canvasAssetMatched: false,
            status: 'rejected',
            verificationReason: `Resolution error: ${err?.message || err}`,
          });
          onVideoReady(false);
        }
      }
    };

    resolveCanvasForTrack();

    return () => {
      isCurrentRequestActive = false;
    };
  }, [track.id, track.title, track.artist, track.isrc, shouldShowCanvas, onVideoReady, logCanvasVerificationStatus]);

  /**
   * Spotify-Style Decoupled Status Logger
   * Demonstrates that audio pausing does NOT pause Canvas video.
   */
  useEffect(() => {
    const video = videoRef.current;
    console.log(
      `\n%c[Spotiz Canvas & Audio Lifecycle Monitor]%c\n` +
      `AUDIO isPlaying = ${isPlaying ? 'true (PLAYING)' : 'false (PAUSED)'}\n` +
      `CANVAS:\n` +
      `  • trackId:          ${track.id}\n` +
      `  • status:           ${canvasState.status}\n` +
      `  • isVideoReady:     ${isVideoReady}\n` +
      `  • video.paused:     ${video ? video.paused : 'N/A'}\n` +
      `  • video.currentTime:${video ? `${video.currentTime.toFixed(2)}s` : 'N/A'}\n` +
      `  • video.duration:   ${video ? `${video.duration.toFixed(2)}s` : 'N/A'}\n` +
      `  • video.readyState: ${video ? video.readyState : 'N/A'}\n` +
      `  • video.loop:       ${video ? video.loop : 'N/A'}\n` +
      `--------------------------------------------------\n` +
      `SUMMARY: AUDIO isPlaying = ${isPlaying} | CANVAS video.paused = ${video ? video.paused : 'N/A'}`
    );
  }, [isPlaying, track.id, canvasState.status, isVideoReady]);

  // Render ONLY when canvasState.trackId === track.id AND canvasState.status === 'verified' AND canvasAssetMatched === true
  const isCanvasVerified = 
    shouldShowCanvas && 
    canvasState.trackId === track.id && 
    canvasState.status === 'verified' && 
    canvasState.canvasAssetMatched === true &&
    Boolean(canvasState.canvasUrl) && 
    !videoPlaybackError;

  // Trigger video playback whenever canvasUrl is set and verified
  useEffect(() => {
    if (isCanvasVerified && canvasState.canvasUrl) {
      // Small timeout to allow element mounting and DOM binding
      const timer = setTimeout(() => {
        attemptPlayVideo();
      }, 20);

      // Force video to become visible after 1000ms just in case browser doesn't fire loadeddata/canplay
      const forceReadyTimer = setTimeout(() => {
        if (!videoPlaybackError) {
          setIsVideoReady(true);
          onVideoReady(true);
        }
      }, 1000);

      return () => {
        clearTimeout(timer);
        clearTimeout(forceReadyTimer);
      };
    }
  }, [isCanvasVerified, canvasState.canvasUrl, attemptPlayVideo, videoPlaybackError]);

  // Video Event Handlers - Play IMMEDIATELY when ready, regardless of audio isPlaying state
  const handleLoadedData = () => {
    const video = videoRef.current;
    if (!video) return;

    if (videoTrackIdRef.current !== track.id && currentTrackIdRef.current !== track.id) {
      return;
    }

    setIsVideoReady(true);
    setVideoPlaybackError(false);
    onVideoReady(true);
    attemptPlayVideo();
  };

  const handleCanPlay = () => {
    setIsVideoReady(true);
    setVideoPlaybackError(false);
    onVideoReady(true);
    attemptPlayVideo();
  };

  const handleError = () => {
    console.warn(`[Canvas Safety] Video playback error for track ${track.id}. Safely falling back to artwork.`);
    setVideoPlaybackError(true);
    setIsVideoReady(false);
    onVideoReady(false);
  };

  const handleEnded = () => {
    // Seamless continuous loop - restart canvas immediately even if audio is paused
    const video = videoRef.current;
    if (video && videoTrackIdRef.current === track.id) {
      video.currentTime = 0;
      attemptPlayVideo();
    }
  };

  return (
    <div 
      id="canvas-background-container"
      className="absolute inset-0 w-full h-full overflow-hidden z-0 bg-[#080808] pointer-events-none select-none"
    >
      {/* LAYER 1: STATIC ARTWORK FALLBACK (Visible when Canvas is not verified, not ready, or disabled) */}
      <AnimatePresence mode="wait">
        {(!isCanvasVerified || !isVideoReady || isArtworkVisible) && (
          <motion.div
            id="canvas-artwork-fallback"
            key={`fallback-${track.id}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: "easeInOut" }}
            className="absolute inset-0 w-full h-full"
          >
            {/* Blurred Artwork Backdrop */}
            <div
              className="absolute inset-0 w-full h-full blur-3xl scale-125 opacity-60 transform-gpu"
              style={{
                backgroundImage: artworkUrl ? `url(${artworkUrl})` : undefined,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundColor: dominantColor || '#121212',
              }}
            />
            {/* Color wash gradient */}
            <div 
              className="absolute inset-0 w-full h-full"
              style={{
                background: `linear-gradient(to bottom, ${dominantColor || '#1db954'}33 0%, #121212 60%, #080808 100%)`,
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* LAYER 1: STRICTLY VERIFIED SPOTIFY CANVAS MP4 VIDEO (Continuously Playing & Looping) */}
      {isCanvasVerified && canvasState.canvasUrl && (
        <video
          id="spotify-canvas-video-player"
          ref={(el) => {
            videoRef.current = el;
            if (el) {
              el.muted = true;
              el.defaultMuted = true;
              el.playsInline = true;
              el.setAttribute('playsinline', '');
              el.setAttribute('webkit-playsinline', '');
              el.setAttribute('muted', '');
              el.play().catch(() => {});
            }
          }}
          key={`canvas-video-${track.id}`}
          src={canvasState.canvasUrl}
          autoPlay
          muted
          loop
          playsInline
          // @ts-ignore
          webkit-playsinline="true"
          preload="auto"
          onLoadedMetadata={() => {
            const v = videoRef.current;
            console.log(`[Canvas Video Event] 'loadedmetadata' for track ${track.id} (${track.title}) - duration: ${v?.duration.toFixed(2)}s, dimensions: ${v?.videoWidth}x${v?.videoHeight}`);
          }}
          onLoadedData={handleLoadedData}
          onCanPlay={() => {
            console.log(`[Canvas Video Event] 'canplay' for track ${track.id} (${track.title})`);
            handleCanPlay();
          }}
          onError={handleError}
          onPlaying={() => {
            const video = videoRef.current;
            console.log(`[Canvas Video Event] 'playing' for track ${track.id} (${track.title}) - currentTime: ${video?.currentTime.toFixed(2)}s`);
            if (video && video.videoWidth > 0) {
              setIsVideoReady(true);
              onVideoReady(true);
            }
          }}
          onTimeUpdate={() => {
            const video = videoRef.current;
            if (video && video.currentTime > 0 && !isVideoReady) {
              console.log(`[Canvas Video Event] 'timeupdate' verified: currentTime=${video.currentTime.toFixed(2)}s > 0 for track ${track.id}`);
              setIsVideoReady(true);
              onVideoReady(true);
            }
          }}
          onEnded={handleEnded}
          className={`absolute inset-0 w-full h-full object-cover z-0 transition-opacity duration-500 ${
            isVideoReady && !videoPlaybackError && !isArtworkVisible ? 'opacity-100' : 'opacity-0'
          }`}
          style={{
            objectFit: 'cover',
            width: '100%',
            height: '100%',
            filter: 'contrast(1.05) saturate(1.15)',
          }}
        />
      )}

      {/* LAYER 2: BALANCED SCRIM OVERLAY (Keeps Canvas visual motion vivid and clear while ensuring UI readability) */}
      <div 
        id="canvas-gradient-overlay"
        className="absolute inset-0 w-full h-full z-10 pointer-events-none"
        style={{
          background: `
            linear-gradient(to bottom, 
              rgba(0,0,0,0.30) 0%, 
              rgba(0,0,0,0.08) 25%, 
              rgba(0,0,0,0.35) 65%, 
              rgba(8,8,8,0.88) 90%, 
              #080808 100%
            )
          `
        }}
      />
    </div>
  );
};

