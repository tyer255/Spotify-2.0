import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { FastAverageColor } from 'fast-average-color';
import SkeletonManager from './utils/SkeletonManager';
import './bundle/index-Bfvfzxe5.js';
import './bundle/index-M2dOfOkA.css';

const DynamicProfileBackground = () => {
  useEffect(() => {
    let fac: FastAverageColor | null = null;
    try {
      fac = new FastAverageColor();
    } catch (e) {
      console.warn('FastAverageColor initialization failed', e);
    }

    const interval = setInterval(() => {
      // Find the card container by looking for Spotiz Premium or Log out badges/buttons
      const premiumSpans = Array.from(document.querySelectorAll('span, p, button')).filter(el => {
         const text = el.textContent?.trim().toUpperCase() || '';
         return (text.includes('SPOTIZ PREMIUM') || text.includes('LOG OUT')) && text.length < 50;
      });
      
      for (const el of premiumSpans) {
        // Find the main profile card container. Usually bg-[#181818] or similar.
        const card = el.closest('div.bg-\\[\\#181818\\]') || el.closest('.max-w-xl')?.querySelector('div.bg-\\[\\#181818\\]') || el.closest('.rounded-3xl');
        
        if (card && !card.hasAttribute('data-dynamic-bg')) {
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
                textAvatar.style.background = 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)';
                textAvatar.style.color = '#ffffff';
                textAvatar.style.border = 'none';
                textAvatar.style.boxShadow = '0 8px 24px rgba(29, 78, 216, 0.4)';
             }
          }
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);
  
  return null;
}

const LoginPrompt = () => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      // Don't show if already dismissed in this session
      if (sessionStorage.getItem('guest_prompt_shown')) {
        return;
      }

      // Wait a bit for the app to initialize its IndexedDB
      await new Promise(resolve => setTimeout(resolve, 2500));

      // Check IndexedDB for Firebase Auth state
      try {
        const request = indexedDB.open('firebaseLocalStorageDb');
        request.onsuccess = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          if (!db.objectStoreNames.contains('firebaseLocalStorage')) {
            setShow(true);
            return;
          }
          const tx = db.transaction('firebaseLocalStorage', 'readonly');
          const store = tx.objectStore('firebaseLocalStorage');
          const countReq = store.count();
          countReq.onsuccess = () => {
            if (countReq.result === 0) {
              setShow(true);
            }
          };
          countReq.onerror = () => {
            setShow(true);
          };
        };
        request.onerror = () => {
          setShow(true);
        };
      } catch (err) {
        setShow(true);
      }
    };

    checkAuth();
  }, []);

  const handleDismiss = () => {
    setShow(false);
    sessionStorage.setItem('guest_prompt_shown', 'true');
  };

  const handleLoginClick = () => {
    handleDismiss();
    
    // Attempt to navigate to the profile tab, assuming the app listens to history state or we can click a tab
    // Let's try to push state to the profile view if we can
    try {
      if (window.history.state) {
        const currentIndex = typeof window.history.state.viewIndex === 'number' ? window.history.state.viewIndex : 0;
        window.history.pushState({ viewIndex: currentIndex + 1, viewKey: 'profile' }, "");
        window.dispatchEvent(new PopStateEvent('popstate', { state: { viewIndex: currentIndex + 1, viewKey: 'profile' } }));
      }
    } catch (e) {
      // Ignore
    }

    // Try finding the profile button visually and clicking it (bottom nav or top nav)
    setTimeout(() => {
      const allButtons = Array.from(document.querySelectorAll('button, div'));
      const profileBtn = allButtons.find(el => {
         const html = el.innerHTML;
         return html.includes('M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2') || // Lucide User
                html.includes('circle cx="12" cy="7" r="4"'); // Lucide User circle
      });
      if (profileBtn) {
        (profileBtn as HTMLElement).click();
      }
    }, 100);
  };

  if (!show) return null;

  return (
    <AnimatePresence>
      {show && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-sm overflow-hidden bg-[#181818] border border-white/10 rounded-2xl shadow-2xl p-6 md:p-8 flex flex-col items-center text-center"
          >
            <button 
              onClick={handleDismiss}
              className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-colors cursor-pointer"
              title="Dismiss"
            >
              <X size={18} />
            </button>

            <div className="w-16 h-16 bg-[#1DB954]/10 rounded-full flex items-center justify-center mb-5">
               <svg viewBox="0 0 24 24" width="32" height="32" fill="#1DB954">
                 <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.503 17.308c-.216.353-.674.468-1.027.252-2.812-1.718-6.352-2.107-10.522-1.155-.404.092-.806-.157-.899-.561-.092-.404.157-.806.561-.899 4.568-1.044 8.487-.601 11.635 1.336.353.216.468.674.252 1.027zm1.47-3.267c-.272.443-.852.585-1.295.313-3.219-1.979-8.127-2.551-11.935-1.394-.499.152-1.028-.133-1.18-.632-.152-.499.133-1.028.632-1.18 4.357-1.322 9.773-.687 13.465 1.598.443.272.585.852.313 1.295zm.126-3.41c-3.86-2.292-10.231-2.503-13.918-1.383-.593.18-1.222-.154-1.402-.747-.18-.593.154-1.222.747-1.402 4.238-1.286 11.278-1.042 15.728 1.597.534.317.708 1.008.391 1.542-.317.534-1.008.708-1.546.393z"/>
               </svg>
            </div>
            
            <h2 className="text-xl font-bold text-white mb-2 tracking-tight">Experience More</h2>
            <p className="text-neutral-400 mb-6 leading-relaxed text-sm">
              Log in to save your favorite songs, create custom playlists, and sync your music across all devices.
            </p>

            <button 
              onClick={handleLoginClick}
              className="w-full py-3 bg-[#1DB954] hover:bg-[#1ed760] text-black font-bold text-sm rounded-full shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer"
            >
              Log In to Spotiz
            </button>
            
            <button 
              onClick={handleDismiss}
              className="mt-4 text-xs font-semibold text-neutral-400 hover:text-white transition-colors uppercase tracking-wider cursor-pointer"
            >
              Not Now
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

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

    const inspectThumbnails = () => {
      // Find fullscreen artwork container and ensure crisp rendering
      const artImgs = document.querySelectorAll<HTMLImageElement>('#fullscreen-artwork-container img, [data-artwork-img="true"]');
      artImgs.forEach(img => {
        img.style.imageRendering = '-webkit-optimize-contrast';
        img.style.filter = 'none';
        img.style.transform = 'none';
        
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
    };

    inspectThumbnails();
    const interval = setInterval(inspectThumbnails, 400);

    const observer = new MutationObserver(() => {
      inspectThumbnails();
    });
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['src', 'style', 'class'] });

    return () => {
      clearInterval(interval);
      observer.disconnect();
    };
  }, []);

  return null;
};

// Delay mounting slightly to let the main bundle's createRoot finish (since the main bundle also renders to document.getElementById('root'))
setTimeout(() => {
  if (!document.getElementById('guest-popup-root')) {
    const popupRoot = document.createElement('div');
    popupRoot.id = 'guest-popup-root';
    document.body.appendChild(popupRoot);
    createRoot(popupRoot).render(
      <>
        <ThumbnailEnhancer />
        <SkeletonManager />
        <DynamicProfileBackground />
        <LoginPrompt />
      </>
    );
  }
}, 500);
