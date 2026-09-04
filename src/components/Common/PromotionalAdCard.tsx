import React, { useRef, useState, useEffect } from 'react';
import { Volume2, VolumeX, Sparkles, ArrowRight } from 'lucide-react';
import { ViewState } from '../../types';

interface PromotionalAdCardProps {
  onNavigate?: (view: ViewState) => void;
  className?: string;
  videoSrc?: string;
}

export const PromotionalAdCard: React.FC<PromotionalAdCardProps> = ({
  onNavigate,
  className = '',
  videoSrc,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [isVideoLoaded, setIsVideoLoaded] = useState<boolean>(false);
  const [videoError, setVideoError] = useState<boolean>(false);

  // Primary local video file generated specifically for Spotiz promo ad
  const primaryVideoUrl = videoSrc || '/promo_ad.mp4';

  // Ensure autoplay and smooth infinite looping replay
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = isMuted;

    const playVideo = () => {
      video.play().then(() => {
        setIsVideoLoaded(true);
        setVideoError(false);
      }).catch((err) => {
        console.log('Autoplay deferred or prevented by browser:', err);
      });
    };

    playVideo();

    const handleEnded = () => {
      video.currentTime = 0;
      video.play().catch(() => {});
    };

    video.addEventListener('ended', handleEnded);

    const container = containerRef.current;
    let observer: IntersectionObserver | null = null;

    if (container) {
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              video.play().catch(() => {});
            } else {
              video.pause();
            }
          });
        },
        { threshold: 0.2 }
      );
      observer.observe(container);
    }

    return () => {
      video.removeEventListener('ended', handleEnded);
      if (observer && container) {
        observer.unobserve(container);
      }
    };
  }, [isMuted, videoSrc]);

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      const nextState = !isMuted;
      videoRef.current.muted = nextState;
      setIsMuted(nextState);
    }
  };

  const handleCtaClick = () => {
    if (onNavigate) {
      onNavigate({ type: 'home' });
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full rounded-2xl overflow-hidden bg-neutral-900 border border-white/10 shadow-2xl transition-all duration-300 ${className}`}
    >
      {/* Video Frame Container - Standard 16:9 Aspect Ratio on Mobile, Tablet & Desktop */}
      <div className="relative w-full aspect-[16/9] bg-black overflow-hidden flex items-center justify-center">
        <video
          ref={videoRef}
          autoPlay
          muted={isMuted}
          loop
          playsInline
          preload="auto"
          onLoadedData={() => {
            setIsVideoLoaded(true);
            setVideoError(false);
          }}
          onError={() => {
            console.warn('Local promo ad video error, switching to animated fallback display');
            setVideoError(true);
          }}
          className="w-full h-full object-cover select-none pointer-events-none"
        >
          <source src={primaryVideoUrl} type="video/mp4" />
        </video>

        {/* Loading / Error visual banner fallback */}
        {(!isVideoLoaded || videoError) && (
          <div className="absolute inset-0 bg-gradient-to-tr from-emerald-950 via-neutral-900 to-indigo-950 flex flex-col items-center justify-center p-6 text-center select-none">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mb-3 animate-pulse">
              <Sparkles className="w-6 h-6" />
            </div>
            <h4 className="text-lg font-black text-white tracking-tight">Spotiz — Your Music. Your World.</h4>
            <p className="text-xs text-neutral-300 mt-1 max-w-xs">
              Everything you love in one place. Stream ad-free.
            </p>
          </div>
        )}

        {/* Subtle Gradient Overlays for readability and dark Spotify atmosphere */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-black/30 pointer-events-none" />

        {/* Top-Left: Subtle Premium "Advertisement" Badge Label */}
        <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 shadow-md">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[10px] font-extrabold tracking-wider uppercase text-neutral-300">
            Advertisement
          </span>
        </div>

        {/* Top-Right: Mute / Unmute Button Overlay (Single Control) */}
        <button
          onClick={toggleMute}
          className="absolute top-3 right-3 z-20 p-2 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md text-white border border-white/15 shadow-lg transition-transform active:scale-90 cursor-pointer flex items-center justify-center"
          title={isMuted ? 'Unmute ad video' : 'Mute ad video'}
          aria-label={isMuted ? 'Unmute video' : 'Mute video'}
        >
          {isMuted ? (
            <VolumeX className="w-4 h-4 text-neutral-300" />
          ) : (
            <Volume2 className="w-4 h-4 text-emerald-400" />
          )}
        </button>

        {/* Bottom Ad Card Banner & CTA */}
        <div className="absolute bottom-2 sm:bottom-2.5 left-2 sm:left-2.5 right-2 sm:right-2.5 z-10 flex items-center justify-between gap-2 sm:gap-3 py-1.5 px-2.5 sm:py-2 sm:px-3.5 rounded-lg sm:rounded-xl bg-black/60 backdrop-blur-md border border-white/10">
          <div className="space-y-0.5 min-w-0 pr-1.5 sm:pr-2">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="font-bold sm:font-extrabold text-xs sm:text-sm md:text-base text-white tracking-tight truncate">
                Spotiz — Your Music. Your World.
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-neutral-300 truncate hidden sm:block">
              Everything you love in one place. Stream ad-free songs & podcasts.
            </p>
          </div>

          <button
            onClick={handleCtaClick}
            className="flex-shrink-0 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-[#1ed760] hover:bg-[#1fdf64] text-black font-extrabold text-[11px] sm:text-xs shadow-lg transition-all active:scale-95 flex items-center gap-1 sm:gap-1.5 cursor-pointer"
          >
            <span>Listen Now</span>
            <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
