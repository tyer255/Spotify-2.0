import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { FastAverageColor } from 'fast-average-color';
import SkeletonManager from './utils/SkeletonManager';
import { DomDumper } from './utils/DomDumper';
import { MobileHeroCarousel } from './utils/MobileHeroCarousel';
import { ReloadPrompt } from './components/ReloadPrompt';
import { DesktopEnhancer } from './components/DesktopEnhancer';
import { LegalSuiteManager } from './components/LegalSuite';
import { GuestSystemManager } from './components/GuestSystemManager';
import './utils/mediaSessionGuard';
import './bundle/index-Bfvfzxe5.js';
import './bundle/index-M2dOfOkA.css';
import './styles/liquid-glass.css';

const DynamicProfileBackground = () => {
  useEffect(() => {
    let fac: FastAverageColor | null = null;
    try {
      fac = new FastAverageColor();
    } catch (e) {
      console.warn('FastAverageColor initialization failed', e);
    }

    const interval = setInterval(() => {
      // If already applied and still present in DOM, do nothing (zero overhead)
      const existing = document.querySelector('[data-dynamic-bg="true"]');
      if (existing && document.contains(existing)) return;

      // Quick targeted check before running broader queries
      const possibleCards = document.querySelectorAll('div.bg-\\[\\#181818\\], .max-w-xl div, .rounded-3xl');
      if (possibleCards.length === 0) return;

      // Find the card container by looking for Spotiz Premium or Log out badges/buttons
      let targetCard: HTMLElement | null = null;
      for (const card of Array.from(possibleCards) as HTMLElement[]) {
        const text = card.textContent || '';
        if (text.includes('SPOTIZ PREMIUM') || text.includes('Spotiz Premium') || text.includes('Log out') || text.includes('LOG OUT')) {
          targetCard = card;
          break;
        }
      }
      
      if (targetCard && !targetCard.hasAttribute('data-dynamic-bg')) {
        const card = targetCard;
        card.setAttribute('data-dynamic-bg', 'true');

        const cardEl = card as HTMLElement;
        cardEl.style.position = 'relative';
        cardEl.style.overflow = 'hidden';
        
        const bgContainer = document.createElement('div');
        bgContainer.className = 'profile-dynamic-bg';
        bgContainer.style.position = 'absolute';
        bgContainer.style.inset = '0';
        bgContainer.style.zIndex = '0';
        bgContainer.style.pointerEvents = 'none';
        bgContainer.style.transition = 'background 1s ease, opacity 1s ease';
        bgContainer.style.opacity = '0'; // Start invisible
        
        card.insertBefore(bgContainer, card.firstChild);

        // Ensure elements sit on top of the dynamic background
        Array.from(card.children).forEach(child => {
           if (child !== bgContainer) {
             const c = child as HTMLElement;
             if (getComputedStyle(c).position === 'static') {
                c.style.position = 'relative';
             }
             c.style.zIndex = '10';
           }
        });

        // Find avatar image inside this card or its immediate parent
        let img = card.querySelector('img');
        
        if (!img) {
          const possibleAvatars = Array.from(document.querySelectorAll('img')).filter(i => 
            i.src.includes('googleusercontent') || i.src.includes('avatar')
          );
          if (possibleAvatars.length > 0) {
             img = possibleAvatars[0];
          }
        }

        const applyColor = (r: number, g: number, b: number) => {
           // Create a beautiful Spotify-like profile gradient
           bgContainer.style.background = `
             radial-gradient(circle at 50% 0%, rgba(${r}, ${g}, ${b}, 0.5) 0%, rgba(24, 24, 24, 0) 80%),
             linear-gradient(180deg, rgba(${r}, ${g}, ${b}, 0.3) 0%, rgba(24, 24, 24, 1) 100%)
           `;
           bgContainer.style.opacity = '1';
           
           // Update the card's actual background to transparent so it doesn't block the gradient
           cardEl.style.backgroundColor = 'transparent';
           cardEl.style.backgroundImage = `linear-gradient(180deg, rgba(${Math.max(10, r-30)}, ${Math.max(10, g-30)}, ${Math.max(10, b-30)}, 0.2) 0%, rgba(24, 24, 24, 1) 100%)`;
           
           // Apply subtle glow to the wrapper
           const wrapper = cardEl.parentElement;
           if (wrapper) {
              wrapper.style.position = 'relative';
              let ambientGlow = wrapper.querySelector('.ambient-glow') as HTMLElement;
              if (!ambientGlow) {
                 ambientGlow = document.createElement('div');
                 ambientGlow.className = 'ambient-glow';
                 ambientGlow.style.position = 'absolute';
                 ambientGlow.style.top = '-10%';
                 ambientGlow.style.left = '0';
                 ambientGlow.style.right = '0';
                 ambientGlow.style.height = '70%';
                 ambientGlow.style.zIndex = '-1';
                 ambientGlow.style.pointerEvents = 'none';
                 ambientGlow.style.background = `radial-gradient(circle at 50% 0%, rgba(${r}, ${g}, ${b}, 0.15) 0%, rgba(0,0,0,0) 70%)`;
                 ambientGlow.style.filter = 'blur(40px)';
                 wrapper.insertBefore(ambientGlow, wrapper.firstChild);
              }
           }
        };

        const fallbackColor = () => applyColor(29, 185, 84); // Spotify green fallback
        const defaultBlue = () => applyColor(14, 165, 233); // Spotify default user blue

        if (img && fac) {
           const src = img.src;
           const imgEl = new Image();
           imgEl.crossOrigin = 'Anonymous';
           imgEl.src = src;
           
           imgEl.onload = () => {
              try {
                const color = fac!.getColor(imgEl);
                applyColor(color.value[0], color.value[1], color.value[2]);
              } catch(e) {
                fallbackColor();
              }
           };
           imgEl.onerror = fallbackColor;
        } else {
           // Text avatar fallback (Letter)
           defaultBlue();
           
           // Style the fallback text avatar gracefully if possible
           const textAvatar = card.querySelector('div.bg-neutral-800') as HTMLElement;
           if (textAvatar) {
              textAvatar.style.background = '#60a5fa';
              textAvatar.style.color = '#ffffff';
              textAvatar.style.border = 'none';
              textAvatar.style.boxShadow = '0 8px 24px rgba(96, 165, 250, 0.4)';
           }
        }
      }
    }, 2000);

    return () => clearInterval(interval);
  }, []);
  
  return null;
}

// Login popup completely removed in favor of login-free Guest ID system
const LoginPrompt = () => null;

const ThumbnailEnhancer = () => {
  useEffect(() => {
    const upgradeUrl = (u: string): string => {
      if (!u || typeof u !== 'string') return u;
      if (u.includes('ab67616d00004851') || u.includes('ab67616d00001e02')) {
        return u.replace(/ab67616d0000(4851|1e02)/g, 'ab67616d0000b273');
      }
      if (u.includes('ab6761610000f68d') || u.includes('ab67616100005174')) {
        return u.replace(/ab6761610000(f68d|5174)/g, 'ab6761610000e5eb');
      }
      if (u.includes('50x50') || u.includes('150x150') || u.includes('250x250')) {
        return u.replace(/(50x50|150x150|250x250)/g, '500x500');
      }
      if (u.includes('apple.com') || u.includes('mzstatic.com')) {
        return u.replace(/\/\d+x\d+bb\.jpg/g, '/600x600bb.jpg');
      }
      if (u.includes('i.ytimg.com') || u.includes('youtube.com')) {
        return u.replace(/\/(default|mqdefault|hqdefault|sddefault)\.jpg/g, '/maxresdefault.jpg');
      }
      return u;
    };

    (window as any).getUltraHighResUrl = upgradeUrl;

    let isInspecting = false;
    let inspectScheduled = false;

    const inspectThumbnails = () => {
      inspectScheduled = false;
      if (isInspecting) return;
      isInspecting = true;
      try {
        // Find fullscreen artwork container and ensure crisp rendering
        const artImgs = document.querySelectorAll<HTMLImageElement>('#fullscreen-artwork-container img, [data-artwork-img="true"]');
        artImgs.forEach(img => {
          if (img.style.imageRendering !== '-webkit-optimize-contrast') {
            img.style.imageRendering = '-webkit-optimize-contrast';
          }
          if (img.style.filter !== 'none') {
            img.style.filter = 'none';
          }
          
          const currentSrc = img.src || img.getAttribute('src') || '';
          const upgraded = upgradeUrl(currentSrc);
          if (upgraded && upgraded !== currentSrc) {
            img.src = upgraded;
          }

          if (!img.getAttribute('data-error-handled')) {
            img.setAttribute('data-error-handled', 'true');
            img.addEventListener('error', () => {
              if (img.src.includes('maxresdefault.jpg')) {
                img.src = img.src.replace('maxresdefault.jpg', 'hq720.jpg');
              } else if (img.src.includes('hq720.jpg')) {
                img.src = img.src.replace('hq720.jpg', 'hqdefault.jpg');
              }
            });
          }
        });

        // Find canvas artwork fallback divs and strip blur filters and scale distortion
        const fallbackDivs = document.querySelectorAll<HTMLElement>('#canvas-artwork-fallback div');
        fallbackDivs.forEach(div => {
          if (div.className.includes('blur-')) {
            div.className = div.className.replace(/blur-[a-z0-9]+/g, '').replace('scale-125', '').replace('transform-gpu', '').trim();
          }
          if (div.style.filter && div.style.filter.includes('blur')) {
            div.style.filter = 'none';
          }
          const bgImg = div.style.backgroundImage;
          if (bgImg && bgImg.startsWith('url(')) {
            const rawUrl = bgImg.slice(4, -1).replace(/["']/g, '');
            const upgraded = upgradeUrl(rawUrl);
            if (upgraded !== rawUrl) {
              div.style.backgroundImage = `url("${upgraded}")`;
            }
          }
        });
      } finally {
        isInspecting = false;
      }
    };

    const scheduleInspect = () => {
      if (!inspectScheduled) {
        inspectScheduled = true;
        requestAnimationFrame(inspectThumbnails);
      }
    };

    scheduleInspect();
    const interval = setInterval(scheduleInspect, 3000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  return null;
};

// Global safety handler for PWA / Update Refresh button clicks & automatic update checks
if (typeof window !== 'undefined') {
  // Throttled SW update check (at most once every 10 minutes to prevent loops)
  if ('serviceWorker' in navigator) {
    let lastSWCheck = 0;
    const checkSWUpdate = () => {
      const now = Date.now();
      try {
        const applied = sessionStorage.getItem('spotiz_update_applied');
        if (applied && now - parseInt(applied, 10) < 15 * 60 * 1000) return;
      } catch (_) {}

      if (now - lastSWCheck < 10 * 60 * 1000) return;
      lastSWCheck = now;

      navigator.serviceWorker.getRegistrations().then(regs => {
        regs.forEach(reg => reg.update().catch(() => {}));
      }).catch(() => {});
    };

    window.addEventListener('focus', checkSWUpdate);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') checkSWUpdate();
    });
    setInterval(checkSWUpdate, 10 * 60 * 1000);
  }

  document.addEventListener('click', async (e) => {
    const target = (e.target as HTMLElement)?.closest('button');
    if (!target) return;
    const txt = (target.textContent || '').trim().toLowerCase();
    const title = (target.getAttribute('title') || '').toLowerCase();
    const ariaLabel = (target.getAttribute('aria-label') || '').toLowerCase();

    // Support dismissing the update notification
    if (title === 'dismiss' || ariaLabel === 'dismiss' || target.classList.contains('dismiss-update-btn')) {
      try {
        sessionStorage.setItem('spotiz_update_dismissed', Date.now().toString());
      } catch (_) {}
      const popup = target.closest('.fixed');
      if (popup) {
        (popup as HTMLElement).style.opacity = '0';
        setTimeout(() => {
          (popup as HTMLElement).style.display = 'none';
        }, 300);
      }
      return;
    }

    if (txt.includes('refresh for latest version') || txt.includes('refresh to update') || txt.includes('update available')) {
      // Record that user triggered the update to prevent repeated loop on reload
      try {
        sessionStorage.setItem('spotiz_update_applied', Date.now().toString());
        sessionStorage.setItem('spotiz_update_dismissed', Date.now().toString());
        localStorage.setItem('spotiz_last_sw_update', Date.now().toString());
      } catch (_) {}

      // Provide immediate feedback on the clicked button and hide popup
      target.style.opacity = '0.8';
      target.style.pointerEvents = 'none';
      const popup = target.closest('.fixed');
      if (popup) {
        (popup as HTMLElement).style.opacity = '0';
      }

      // Perform true hard refresh: wipe all CacheStorage entries so fresh bundle files are loaded
      if ('caches' in window) {
        try {
          const cacheKeys = await caches.keys();
          await Promise.all(cacheKeys.map(key => caches.delete(key)));
        } catch (_) {}
      }

      // Signal all service worker registrations to skip waiting
      if ('serviceWorker' in navigator) {
        try {
          const regs = await navigator.serviceWorker.getRegistrations();
          for (const reg of regs) {
            if (reg.waiting) {
              reg.waiting.postMessage({ type: 'SKIP_WAITING' });
            }
          }
        } catch (_) {}
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          window.location.reload();
        }, { once: true });
      }

      // Guaranteed fallback reload after 350ms
      setTimeout(() => {
        window.location.reload();
      }, 350);
    }
  }, true);
}

// Delay mounting slightly to let the main bundle's createRoot finish (since the main bundle also renders to document.getElementById('root'))
setTimeout(() => {
  if (!document.getElementById('guest-popup-root')) {
    const popupRoot = document.createElement('div');
    popupRoot.id = 'guest-popup-root';
    document.body.appendChild(popupRoot);
    createRoot(popupRoot).render(
      <>
        <ThumbnailEnhancer />
        <MobileHeroCarousel />
        <SkeletonManager />
        <DynamicProfileBackground />
        <DesktopEnhancer />
        <GuestSystemManager />
        <ReloadPrompt />
        <LegalSuiteManager />
      </>
    );
  }
}, 500);
