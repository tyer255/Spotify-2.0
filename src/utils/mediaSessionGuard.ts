// Spotiz MediaSession & Notification Artwork Guardian
// Guarantees that Android Media Notification always displays the official Spotiz track artwork

export interface MediaImageItem {
  src: string;
  sizes?: string;
  type?: string;
}

const SILENT_AUDIO_URL = '/silent.wav';

// Ultra-High Resolution Artwork URL Upgrader
export function upgradeArtworkUrl(url: string | null | undefined): string {
  if (!url || typeof url !== 'string') return '';
  let cleanUrl = url.trim();

  // Spotify CDN resolution upgrade: convert small/medium to 640x640 (b273)
  if (cleanUrl.includes('i.scdn.co/image/')) {
    cleanUrl = cleanUrl
      .replace('ab67616d00004851', 'ab67616d0000b273')
      .replace('ab67616d00001e02', 'ab67616d0000b273')
      .replace('ab6761610000e5eb', 'ab67616100005174')
      .replace('ab6761610000f68d', 'ab67616100005174');
  }

  // JioSaavn image upgrade: 150x150 -> 500x500
  if (cleanUrl.includes('c.saavncdn.com') || cleanUrl.includes('jiosaavn.com')) {
    cleanUrl = cleanUrl
      .replace('150x150', '500x500')
      .replace('50x50', '500x500');
  }

  // Apple Music / iTunes resolution upgrade: 100x100 -> 600x600
  if (cleanUrl.includes('mzstatic.com')) {
    cleanUrl = cleanUrl.replace(/\/\d+x\d+bb\./, '/600x600bb.');
  }

  return cleanUrl;
}

(window as any).getUltraHighResUrl = upgradeArtworkUrl;

// Silent Audio Loop to keep the top-level document's MediaSession active in Chromium on Android
let internalSilentAudio: HTMLAudioElement | null = null;

function getInternalSilentAudio(): HTMLAudioElement | null {
  if (typeof window === 'undefined' || typeof Audio === 'undefined') return null;
  if (!internalSilentAudio) {
    try {
      internalSilentAudio = new Audio(SILENT_AUDIO_URL);
      internalSilentAudio.loop = true;
      internalSilentAudio.preload = 'auto';
      internalSilentAudio.volume = 0.001; // virtually silent
      internalSilentAudio.style.display = "none";
      document.body.appendChild(internalSilentAudio);
    } catch (e) {
      console.warn('[MediaSessionGuard] Failed to create internal silent audio:', e);
    }
  }
  return internalSilentAudio;
}

// User interaction priming: prime audio elements so play() won't be blocked by autoplay policies
if (typeof window !== 'undefined') {
  const primeAudioOnInteraction = () => {
    try {
      const el = getInternalSilentAudio();
      if (el && el.paused) {
        // Load and immediately pause to establish user gesture activation
        el.load();
      }
    } catch (e) {}
    window.removeEventListener('pointerdown', primeAudioOnInteraction);
    window.removeEventListener('keydown', primeAudioOnInteraction);
  };
  window.addEventListener('pointerdown', primeAudioOnInteraction, { once: true, passive: true });
  window.addEventListener('keydown', primeAudioOnInteraction, { once: true, passive: true });
}

export function startSilentAudioForYouTube(audioEl?: HTMLAudioElement | null): void {
  try {
    const el = audioEl || getInternalSilentAudio();
    if (el) {
      if (!el.src.includes(SILENT_AUDIO_URL)) {
        el.src = SILENT_AUDIO_URL;
        el.loop = true;
      }
      el.play().catch(() => {});
    }
    // Also ensure internal audio element is looped as fallback
    const internal = getInternalSilentAudio();
    if (internal && internal !== el) {
      if (!internal.src.includes(SILENT_AUDIO_URL)) {
        internal.src = SILENT_AUDIO_URL;
        internal.loop = true;
      }
      internal.play().catch(() => {});
    }
  } catch (e) {}
}

export function stopSilentAudioForYouTube(audioEl?: HTMLAudioElement | null): void {
  try {
    if (audioEl) audioEl.pause();
    if (internalSilentAudio) internalSilentAudio.pause();
  } catch (e) {}
}

(window as any).__startSilentAudioForYouTube = startSilentAudioForYouTube;
(window as any).__stopSilentAudioForYouTube = stopSilentAudioForYouTube;

// Canonical Track Artwork Storage
let canonicalTitle = '';
let canonicalArtist = '';
let canonicalAlbum = '';
let canonicalArtworkUrl = '';
let canonicalArtworkList: MediaImageItem[] = [];

export function isYouTubeThumbnailUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== 'string') return false;
  return url.includes('i.ytimg.com') || 
         url.includes('img.youtube.com') || 
         url.includes('youtube.com/vi') ||
         url.includes('ytimg.googleusercontent.com');
}

export function extractCanonicalTrackArtwork(track: any): string {
  if (!track) return '';
  
  const imgLarge = track.images?.large;
  const imgMedium = track.images?.medium;
  const imgSmall = track.images?.small;
  const artUrl = track.artworkUrl || track.coverUrl || track.image || track.artwork || track.cover || '';
  
  const candidates = [imgLarge, imgMedium, imgSmall, artUrl].filter(Boolean);
  
  // Prefer official non-YouTube artwork (Spotify, Apple, JioSaavn)
  const official = candidates.find(u => typeof u === 'string' && !isYouTubeThumbnailUrl(u));
  
  return upgradeArtworkUrl(official || candidates[0] || '');
}

export function buildMediaImages(artworkUrl: string): MediaImageItem[] {
  if (!artworkUrl) return [];
  const clean = upgradeArtworkUrl(artworkUrl);
  const type = clean.split('?')[0].toLowerCase().endsWith('.png') ? 'image/png' :
               clean.split('?')[0].toLowerCase().endsWith('.webp') ? 'image/webp' : 'image/jpeg';
  
  return [
    { src: clean, sizes: '96x96', type },
    { src: clean, sizes: '128x128', type },
    { src: clean, sizes: '192x192', type },
    { src: clean, sizes: '256x256', type },
    { src: clean, sizes: '384x384', type },
    { src: clean, sizes: '512x512', type }
  ];
}

// Global hook for Spotiz bundle to set the current track's canonical metadata
export function setSpotizCurrentTrack(track: any): void {
  if (!track) return;
  (window as any).__currentSpotizTrack = track;
  
  canonicalTitle = track.title || '';
  canonicalArtist = track.artist || '';
  canonicalAlbum = track.album || track.artist || 'Spotiz';
  
  const artUrl = extractCanonicalTrackArtwork(track);
  if (artUrl) {
    canonicalArtworkUrl = artUrl;
    canonicalArtworkList = buildMediaImages(artUrl);
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('spotiz-track-changed', { 
      detail: { url: canonicalArtworkUrl, title: canonicalTitle, artist: canonicalArtist } 
    }));
  }

  // Update MediaSession immediately with canonical metadata
  if (typeof navigator !== 'undefined' && 'mediaSession' in navigator && canonicalTitle) {
    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: canonicalTitle,
        artist: canonicalArtist,
        album: canonicalAlbum,
        artwork: canonicalArtworkList as MediaImage[]
      });
    } catch (e) {}
  }
}

(window as any).__setSpotizCurrentTrack = setSpotizCurrentTrack;

// Trap navigator.mediaSession.metadata
function initMediaSessionInterceptor(): void {
  if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;

  try {
    const proto = Object.getPrototypeOf(navigator.mediaSession) || navigator.mediaSession;
    const originalDesc = Object.getOwnPropertyDescriptor(proto, 'metadata') ||
                         Object.getOwnPropertyDescriptor(navigator.mediaSession, 'metadata');
    const originalSet = originalDesc?.set;
    const originalGet = originalDesc?.get;

    let storedMetadata: MediaMetadata | null = null;

    Object.defineProperty(navigator.mediaSession, 'metadata', {
      configurable: true,
      enumerable: true,
      get() {
        return originalGet ? originalGet.call(navigator.mediaSession) : storedMetadata;
      },
      set(newMeta: MediaMetadata | null) {
        if (!newMeta) {
          storedMetadata = null;
          if (originalSet) originalSet.call(navigator.mediaSession, null);
          return;
        }

        const firstArt = (newMeta.artwork && newMeta.artwork[0]?.src) || '';
        const isYtThumbnail = isYouTubeThumbnailUrl(firstArt);
        const isYtTitle = typeof newMeta.title === 'string' && (
          newMeta.title.includes('(Official Music Video)') ||
          newMeta.title.includes('(Official Video)') ||
          newMeta.title.includes('(Lyric Video)') ||
          newMeta.title.includes('(Official Audio)') ||
          newMeta.title.startsWith('AUR - ') ||
          (newMeta.title === newMeta.title.toUpperCase() && newMeta.title.length > 5)
        );

        if (isYtThumbnail || isYtTitle) {
          // Replace YouTube video thumbnail/title with official Spotiz track artwork
          if (canonicalArtworkList.length > 0) {
            newMeta = new MediaMetadata({
              title: canonicalTitle || newMeta.title,
              artist: canonicalArtist || newMeta.artist,
              album: canonicalAlbum || newMeta.album,
              artwork: canonicalArtworkList as MediaImage[]
            });
          }
        } else if (newMeta.artwork && newMeta.artwork.length > 0) {
          // Official Spotiz track artwork passed from player!
          // Upgrade resolution and cache
          const upgraded = Array.from(newMeta.artwork).map(a => ({
            src: upgradeArtworkUrl(a.src),
            sizes: a.sizes,
            type: a.type
          }));

          canonicalArtworkList = upgraded;
          canonicalTitle = newMeta.title;
          canonicalArtist = newMeta.artist;
          canonicalAlbum = newMeta.album;

          newMeta = new MediaMetadata({
            title: canonicalTitle,
            artist: canonicalArtist,
            album: canonicalAlbum,
            artwork: canonicalArtworkList as MediaImage[]
          });
        } else if (canonicalArtworkList.length > 0) {
          // Missing artwork, attach canonical artwork
          newMeta = new MediaMetadata({
            title: newMeta.title || canonicalTitle,
            artist: newMeta.artist || canonicalArtist,
            album: newMeta.album || canonicalAlbum,
            artwork: canonicalArtworkList as MediaImage[]
          });
        }

        storedMetadata = newMeta;
        if (originalSet) {
          originalSet.call(navigator.mediaSession, newMeta);
        }
      }
    });
  } catch (e) {
    console.warn('[MediaSessionGuard] Failed to intercept metadata descriptor:', e);
  }
}

// IFrame Permissions Policy Sanitizer
// Prevents any embedded player (like YouTube) from claiming MediaSession
function initIframePermissionsPolicy(): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  try {
    const origSetAttribute = HTMLIFrameElement.prototype.setAttribute;

    function buildEnforcedAllow(existingAllow: string): string {
      let clean = (existingAllow || '').replace(/mediasession[^;]*/gi, '').trim();
      if (clean.endsWith(';')) clean = clean.slice(0, -1);
      return clean ? `${clean}; mediasession 'none'` : "autoplay *; encrypted-media *; fullscreen *; picture-in-picture *; mediasession 'none'";
    }

    // 1. Trap HTMLIFrameElement.prototype.setAttribute
    HTMLIFrameElement.prototype.setAttribute = function(name: string, val: string) {
      if (typeof name === 'string' && name.toLowerCase() === 'allow') {
        val = buildEnforcedAllow(val);
      }
      return origSetAttribute.call(this, name, val);
    };

    // 2. Trap HTMLIFrameElement.prototype.allow property setter
    try {
      const allowDesc = Object.getOwnPropertyDescriptor(HTMLIFrameElement.prototype, 'allow');
      Object.defineProperty(HTMLIFrameElement.prototype, 'allow', {
        configurable: true,
        enumerable: true,
        get() {
          return this.getAttribute('allow') || '';
        },
        set(val: string) {
          origSetAttribute.call(this, 'allow', buildEnforcedAllow(val));
        }
      });
    } catch (e) {}

    // 3. Trap document.createElement('iframe')
    const origCreateElement = document.createElement.bind(document);
    document.createElement = function(tagName: string, options?: any) {
      const el = origCreateElement(tagName, options);
      if (typeof tagName === 'string' && tagName.toLowerCase() === 'iframe') {
        try {
          origSetAttribute.call(el, 'allow', "autoplay *; encrypted-media *; fullscreen *; picture-in-picture *; mediasession 'none'");
        } catch (e) {}
      }
      return el;
    };

    // 4. Trap HTMLIFrameElement.prototype.src
    try {
      const srcDesc = Object.getOwnPropertyDescriptor(HTMLIFrameElement.prototype, 'src');
      if (srcDesc && srcDesc.set) {
        const origSetSrc = srcDesc.set;
        Object.defineProperty(HTMLIFrameElement.prototype, 'src', {
          configurable: true,
          enumerable: true,
          get() {
            return srcDesc.get ? srcDesc.get.call(this) : '';
          },
          set(val: string) {
            try {
              const current = this.getAttribute('allow') || '';
              if (!current.includes("mediasession 'none'")) {
                origSetAttribute.call(this, 'allow', buildEnforcedAllow(current));
              }
            } catch (e) {}
            return origSetSrc.call(this, val);
          }
        });
      }
    } catch (e) {}

    // 5. Watch for dynamically added iframes via MutationObserver
    const sanitizeIframe = (iframe: HTMLIFrameElement) => {
      try {
        const currentAllow = iframe.getAttribute('allow') || '';
        if (!currentAllow.includes("mediasession 'none'")) {
          origSetAttribute.call(iframe, 'allow', buildEnforcedAllow(currentAllow));
        }
      } catch {}
    };

    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        for (const node of Array.from(m.addedNodes)) {
          if (node instanceof HTMLIFrameElement) {
            sanitizeIframe(node);
          } else if (node instanceof HTMLElement) {
            const iframes = node.querySelectorAll('iframe');
            iframes.forEach(sanitizeIframe);
          }
        }
      }
    });

    observer.observe(document.documentElement, { childList: true, subtree: true });

    // Also sanitize any existing iframes immediately
    document.querySelectorAll('iframe').forEach(sanitizeIframe);
  } catch (e) {}
}

// Initialize immediately upon module load
initMediaSessionInterceptor();
initIframePermissionsPolicy();
