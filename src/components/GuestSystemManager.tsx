import React, { useEffect, useState } from 'react';
import { RefreshCw, AlertTriangle, X } from 'lucide-react';

export function getOrCreateGuestId(): string {
  if (typeof window === 'undefined') return 'GUEST-8842-9104';
  let id = localStorage.getItem('spotiz_guest_id');
  if (!id || !id.startsWith('GUEST-')) {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let p1 = '';
    let p2 = '';
    for (let i = 0; i < 4; i++) {
      p1 += chars.charAt(Math.floor(Math.random() * chars.length));
      p2 += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    id = `GUEST-${p1}-${p2}`;
    localStorage.setItem('spotiz_guest_id', id);
  }
  return id;
}

export function purgeLegacyLoginData(): void {
  if (typeof window === 'undefined') return;
  try {
    // 1. Delete Firebase Auth IndexedDB database
    if (window.indexedDB && indexedDB.deleteDatabase) {
      indexedDB.deleteDatabase('firebaseLocalStorageDb');
    }

    // 2. Clear Google & Firebase Auth keys in localStorage
    const keysToRemove: string[] = [
      'spotify_saved_accounts',
      'guest_prompt_shown',
      'spotify_login_popup_shown',
      'spotiz_auth_token',
      'spotiz_auth_user',
      'firebase:authUser',
      'firebase:host',
      'spotiz_guest_created_at',
    ];

    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (
        key &&
        (key.startsWith('firebase:') ||
          key.startsWith('spotiz_auth_') ||
          keysToRemove.includes(key))
      ) {
        localStorage.removeItem(key);
      }
    }

    // If avatar was an old google image or empty, remove so blue G circle shows
    const oldAvatar = localStorage.getItem('spotify_profile_avatar');
    if (oldAvatar && (oldAvatar.includes('googleusercontent') || oldAvatar.trim() === '')) {
      localStorage.removeItem('spotify_profile_avatar');
    }

    // Set default profile name
    const currentName = localStorage.getItem('spotify_profile_name');
    if (!currentName || currentName === 'G' || currentName === 'Your Name') {
      localStorage.setItem('spotify_profile_name', 'Guest User');
    }

    // 3. Clear session storage flags
    sessionStorage.removeItem('guest_prompt_shown');
    sessionStorage.removeItem('spotify_login_popup_shown');
  } catch (err) {
    console.warn('Could not purge legacy auth data:', err);
  }
}

export const GuestSystemManager: React.FC = () => {
  const [guestId, setGuestId] = useState<string>(getOrCreateGuestId());
  const [showResetModal, setShowResetModal] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Initialize guest ID, purge old login data, and expose global handlers
  useEffect(() => {
    const currentId = getOrCreateGuestId();
    setGuestId(currentId);

    // One-time purge of legacy Google / Firebase login caches
    if (!localStorage.getItem('spotiz_guest_system_v3_clean')) {
      purgeLegacyLoginData();
      localStorage.setItem('spotiz_guest_system_v3_clean', 'true');
    }

    (window as any).getSpotizGuestId = () => getOrCreateGuestId();
    (window as any).resetSpotizGuestAccount = () => {
      setShowResetModal(true);
    };

    return () => {
      delete (window as any).getSpotizGuestId;
      delete (window as any).resetSpotizGuestAccount;
    };
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 2500);
  };

  const executeReset = () => {
    try {
      const keysToClear = [
        'spotify_liked_tracks',
        'spotiz-liked-songs',
        'spotify_user_playlists',
        'spotify_recent_history',
        'spotify_recent_items_guest',
        'spotify_interaction_stats',
        'spotify_saved_albums',
        'spotify_saved_albums_data',
        'spotify_saved_podcasts',
        'spotify_saved_podcasts_data',
        'spotify_offline_tracks',
        'spotify_profile_name',
        'spotify_profile_avatar',
        'spotiz_guest_created_at',
      ];

      keysToClear.forEach((k) => localStorage.removeItem(k));
      purgeLegacyLoginData();

      // Generate fresh guest ID
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      let p1 = '';
      let p2 = '';
      for (let i = 0; i < 4; i++) {
        p1 += chars.charAt(Math.floor(Math.random() * chars.length));
        p2 += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      const newId = `GUEST-${p1}-${p2}`;
      localStorage.setItem('spotiz_guest_id', newId);

      setShowResetModal(false);
      showToast('Data cleared & New Guest ID generated. Reloading...');
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (err) {
      console.error('Reset error:', err);
      window.location.reload();
    }
  };

  // Profile DOM Inspection & Cleanup
  useEffect(() => {
    const updateProfileUI = () => {
      // 1. Immediately eliminate any residual spotiz-guest-identity-card or unwanted debug text
      const unwantedCards = document.querySelectorAll(
        '#spotiz-guest-identity-card, .spotiz-guest-card'
      );
      unwantedCards.forEach((c) => c.remove());

      const container = document.getElementById('profile-view-container');
      if (!container) return;

      const currentId = getOrCreateGuestId();

      // 2. Ensure Profile header displays clean light blue avatar circle & guest ID
      const headerCard = document.getElementById('profile-header-card');
      if (headerCard) {
        // A. Avatar: Vibrant blue circle with thick bold black capital G in center
        const avatarBtn = headerCard.querySelector('#profile-avatar-btn');
        if (avatarBtn) {
          // Remove any duplicate or legacy injected .avatar-g-initial elements
          const oldInjected = avatarBtn.querySelectorAll('.avatar-g-initial');
          oldInjected.forEach((el) => el.remove());

          const img = avatarBtn.querySelector('img');
          // If no custom user photo was uploaded or image is broken
          if (!img || img.naturalWidth === 0) {
            const circleDiv = avatarBtn.querySelector('div.rounded-full') as HTMLElement | null;
            if (circleDiv) {
              circleDiv.style.backgroundColor = '#4285F4';
              const svg = circleDiv.querySelector('svg');
              if (svg) {
                const text = svg.querySelector('text');
                if (text) {
                  text.setAttribute('fill', '#000000');
                  text.setAttribute('font-weight', '900');
                  text.setAttribute('font-size', '76');
                  text.textContent = 'G';
                }
              }
              const span = circleDiv.querySelector('span');
              if (span) {
                span.style.color = '#000000';
                span.style.fontWeight = '900';
                span.style.fontSize = 'clamp(4.5rem, 58%, 6.5rem)';
                span.style.lineHeight = '1';
                span.style.userSelect = 'none';
                span.textContent = 'G';
              }
            }
          }
        }

        // D. Clean, minimal Guest ID badge (purely Guest ID, no extra debug boxes)
        let badgeEl = document.getElementById('profile-guest-badge');
        if (!badgeEl) {
          const nameContainer = headerCard.querySelector(
            '.space-y-2\\.5, .space-y-3'
          );
          if (nameContainer) {
            badgeEl = document.createElement('div');
            badgeEl.id = 'profile-guest-badge';
            badgeEl.className =
              'inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-neutral-300 text-xs font-mono font-medium mt-1 select-none shadow-sm';
            badgeEl.innerHTML = `
              <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span class="text-neutral-400">Guest ID:</span>
              <span id="profile-guest-id-text" class="text-white font-bold tracking-wider">${currentId}</span>
            `;

            const followingDiv = nameContainer.querySelector(
              '.flex.items-center.justify-center.sm\\:justify-start.gap-4'
            );
            if (followingDiv) {
              nameContainer.insertBefore(badgeEl, followingDiv);
            } else {
              nameContainer.appendChild(badgeEl);
            }
          }
        } else {
          const textEl = badgeEl.querySelector('#profile-guest-id-text');
          if (textEl && textEl.textContent !== currentId) {
            textEl.textContent = currentId;
          }
        }

        // E. Replace any "Log out" button with "Reset Guest ID"
        const buttons = Array.from(headerCard.querySelectorAll('button'));
        const logoutBtn = buttons.find(
          (b) => b.textContent?.trim() === 'Log out'
        );
        if (logoutBtn) {
          logoutBtn.textContent = 'Reset Guest ID';
          logoutBtn.className =
            'bg-zinc-800 text-neutral-300 hover:text-white border border-white/10 p-2.5 rounded-full hover:bg-zinc-700 hover:scale-105 transition-all text-xs font-semibold px-4 cursor-pointer';
          logoutBtn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            setShowResetModal(true);
          };
        }
      }
    };

    const interval = setInterval(updateProfileUI, 250);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[999999] px-5 py-2.5 bg-neutral-900/95 text-white border border-emerald-500/40 rounded-full shadow-2xl flex items-center gap-2.5 text-xs font-semibold backdrop-blur-md animate-in fade-in slide-in-from-bottom-2 duration-200">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Confirmation Modal to Reset Guest Session */}
      {showResetModal && (
        <div
          id="spotiz-reset-guest-modal"
          className="fixed inset-0 z-[9999999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowResetModal(false)}
        >
          <div
            className="w-full max-w-md bg-neutral-900 border border-white/15 rounded-3xl p-6 shadow-2xl space-y-5 text-white relative animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-neutral-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-bold text-white tracking-tight">
                Reset Guest ID & Clear Data?
              </h3>
              <p className="text-sm text-neutral-400 leading-relaxed">
                This will delete your local playlists, liked songs, and listening history from this device, and issue a brand-new unique{' '}
                <span className="font-mono font-bold text-emerald-400">Guest ID</span>.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-black/50 border border-white/5 text-xs text-neutral-300 flex items-center justify-between font-mono">
              <span className="text-neutral-400">Current ID:</span>
              <span className="text-emerald-400 font-bold">{guestId}</span>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                className="px-4 py-2 rounded-full border border-white/10 hover:bg-white/5 text-neutral-300 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeReset}
                className="px-5 py-2 rounded-full bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reset & Clear</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
