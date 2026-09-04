import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useUser } from '../../context/UserContext';
import { usePlayer } from '../../context/PlayerContext';
import { Heart, HeartOff, ListMusic, ArrowDown } from 'lucide-react';

export const Toast: React.FC = () => {
  const { toastMessage, toastData, hideToast, toggleLikeTrack } = useUser();
  const { track, isFullscreenOpen } = usePlayer();

  if (!toastMessage && !toastData) return null;

  const rawMessage = toastData?.message || toastMessage || '';
  const messageLower = rawMessage.toLowerCase();

  // Format message text for clean presentation
  let displayMessage = rawMessage;
  
  if (messageLower.includes('added to your liked songs')) {
    displayMessage = 'Added to Liked Songs';
  } else if (messageLower.includes('removed from your liked songs')) {
    displayMessage = 'Removed from Liked Songs';
  }

  // Determine icon type
  let iconType = toastData?.iconType;
  if (!iconType) {
    if (messageLower.includes('liked song') || messageLower.includes('added to liked')) {
      iconType = 'liked';
    } else if (messageLower.includes('removed from liked') || messageLower.includes('unliked')) {
      iconType = 'unliked';
    } else if (messageLower.includes('download')) {
      iconType = 'download';
    } else if (messageLower.includes('playlist')) {
      iconType = 'playlist';
    } else if (
      messageLower.includes('logged in') ||
      messageLower.includes('account') ||
      messageLower.includes('profile')
    ) {
      iconType = 'auth';
    } else if (messageLower.includes('following') || messageLower.includes('unfollowed')) {
      iconType = 'artist';
    } else {
      iconType = 'info';
    }
  }

  // Determine action button label ("Change" or "Undo")
  let actionLabel = toastData?.actionLabel;
  if (actionLabel === undefined) {
    if (iconType === 'liked' || iconType === 'playlist') {
      actionLabel = 'Change';
    } else if (iconType === 'unliked' || messageLower.includes('removed') || messageLower.includes('cleared')) {
      actionLabel = 'Undo';
    }
  }

  // Determine action callback
  let onAction = toastData?.onAction;
  if (!onAction) {
    if ((iconType === 'liked' || iconType === 'unliked') && track) {
      onAction = () => {
        toggleLikeTrack(track);
        hideToast();
      };
    } else {
      onAction = () => {
        hideToast();
      };
    }
  }

  // Render left thumbnail / icon square
  const renderIcon = () => {
    if (toastData?.customIcon) {
      return (
        <div className="w-9 h-9 rounded-md flex items-center justify-center flex-shrink-0">
          {toastData.customIcon}
        </div>
      );
    }

    if (toastData?.thumbnail) {
      return (
        <img
          src={toastData.thumbnail}
          alt=""
          className="w-9 h-9 rounded-md object-cover flex-shrink-0 shadow-sm"
        />
      );
    }

    switch (iconType) {
      case 'liked':
        return (
          <div className="w-9 h-9 rounded-md bg-gradient-to-br from-[#450af5] via-[#8e2de2] to-[#c471ed] flex items-center justify-center flex-shrink-0 shadow-sm">
            <Heart className="w-5 h-5 text-white fill-white" />
          </div>
        );
      case 'unliked':
        return (
          <div className="w-9 h-9 rounded-md bg-neutral-800 flex items-center justify-center flex-shrink-0 shadow-sm">
            <HeartOff className="w-4 h-4 text-neutral-300" />
          </div>
        );
      case 'download':
        return (
          <div className="w-9 h-9 rounded-md bg-[#1db954] flex items-center justify-center flex-shrink-0 shadow-sm">
            <ArrowDown className="w-5 h-5 text-black stroke-[2.5]" />
          </div>
        );
      case 'playlist':
        return (
          <div className="w-9 h-9 rounded-md bg-gradient-to-br from-neutral-800 to-neutral-900 flex items-center justify-center flex-shrink-0 border border-white/10 shadow-sm">
            <ListMusic className="w-5 h-5 text-[#1db954]" />
          </div>
        );
      case 'auth':
      case 'artist':
      default:
        // Return null for informational toasts to prevent taking up horizontal space and causing text cutoff.
        // Users perceive generic icons as "unnecessary emojis" that truncate the actual message.
        return null;
    }
  };

  // Calculate bottom positioning so popup sits directly above Mini Player or Bottom Nav
  const getBottomClass = () => {
    if (isFullscreenOpen) {
      return 'bottom-5 sm:bottom-8';
    }
    if (track) {
      return 'bottom-[138px] md:bottom-[88px]';
    }
    return 'bottom-[76px] md:bottom-6';
  };

  return (
    <AnimatePresence>
      <motion.div
        key={displayMessage}
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 350 }}
        className={`fixed left-1/2 -translate-x-1/2 z-[100] ${getBottomClass()} w-[calc(100%-24px)] max-w-md mx-auto pointer-events-auto`}
      >
        <div className="bg-white text-neutral-900 rounded-xl px-3.5 py-2.5 shadow-[0_12px_36px_rgba(0,0,0,0.35)] border border-neutral-200/80 flex items-center justify-between gap-3 min-h-[52px]">
          {/* Left Icon / Thumbnail */}
          {renderIcon()}

          {/* Center Confirmation Text */}
          <div className="flex-1 min-w-0">
            <p className="text-[14px] font-semibold text-neutral-900 leading-tight line-clamp-2 break-words">
              {displayMessage}
            </p>
          </div>

          {/* Right Action Button ("Change", "Undo", etc.) */}
          {actionLabel && (
            <button
              onClick={onAction}
              className="text-[#1db954] font-bold text-[14px] px-1 py-0.5 hover:underline active:scale-95 transition-transform flex-shrink-0 cursor-pointer select-none"
            >
              {actionLabel}
            </button>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
