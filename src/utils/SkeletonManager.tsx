import React, { useEffect } from 'react';
import './skeleton.css';

const SKELETON_HTML = {
  home: `
    <div class="spotiz-skeleton-wrapper">
      <div class="spotiz-skeleton skel-title" style="height: 28px; width: 220px; margin-bottom: -10px;"></div>
      <div class="skel-grid">
        ${Array(6).fill(`<div class="skel-card"><div class="spotiz-skeleton skel-card-img"></div><div class="spotiz-skeleton skel-card-title"></div><div class="spotiz-skeleton skel-card-sub"></div></div>`).join('')}
      </div>
      <div class="spotiz-skeleton skel-title" style="height: 28px; width: 180px; margin-top: 20px; margin-bottom: -10px;"></div>
      <div class="skel-grid">
        ${Array(6).fill(`<div class="skel-card"><div class="spotiz-skeleton skel-card-img"></div><div class="spotiz-skeleton skel-card-title"></div><div class="spotiz-skeleton skel-card-sub"></div></div>`).join('')}
      </div>
    </div>
  `,
  search: `
    <div class="spotiz-skeleton-wrapper">
      <div class="skel-grid">
        ${Array(4).fill(`<div class="skel-card" style="align-items: center; text-align: center;"><div class="spotiz-skeleton skel-card-img circle" style="width: 120px; height: 120px; margin: 0 auto;"></div><div class="spotiz-skeleton skel-card-title" style="margin: 0 auto;"></div></div>`).join('')}
      </div>
      <div class="skel-row-container" style="margin-top: 2rem;">
        ${Array(6).fill(`<div class="skel-row"><div class="spotiz-skeleton skel-row-img"></div><div class="skel-row-text"><div class="spotiz-skeleton skel-row-title"></div><div class="spotiz-skeleton skel-row-sub"></div></div></div>`).join('')}
      </div>
    </div>
  `,
  artist: `
    <div class="spotiz-skeleton-wrapper">
      <div class="skel-header" style="align-items: center; flex-direction: column; text-align: center; gap: 1rem;">
        <div class="spotiz-skeleton skel-cover circle" style="width: 180px; height: 180px;"></div>
        <div class="spotiz-skeleton skel-title" style="width: 250px; margin: 0 auto; height: 40px;"></div>
        <div class="spotiz-skeleton skel-subtitle" style="width: 150px; margin: 0 auto;"></div>
      </div>
      <div class="skel-row-container" style="margin-top: 2rem;">
        ${Array(8).fill(`<div class="skel-row"><div class="spotiz-skeleton skel-row-img"></div><div class="skel-row-text"><div class="spotiz-skeleton skel-row-title"></div><div class="spotiz-skeleton skel-row-sub"></div></div></div>`).join('')}
      </div>
    </div>
  `,
  album: `
    <div class="spotiz-skeleton-wrapper">
      <div class="skel-header" style="flex-direction: row; align-items: flex-end;">
        <div class="spotiz-skeleton skel-cover" style="box-shadow: 0 8px 32px rgba(0,0,0,0.5);"></div>
        <div class="skel-header-text">
          <div class="spotiz-skeleton skel-subtitle" style="height: 14px;"></div>
          <div class="spotiz-skeleton skel-title" style="width: 80%; height: 50px;"></div>
          <div class="spotiz-skeleton skel-subtitle" style="width: 40%;"></div>
        </div>
      </div>
      <div class="skel-row-container" style="margin-top: 2.5rem;">
        ${Array(8).fill(`<div class="skel-row"><div class="spotiz-skeleton" style="width: 24px; height: 24px; border-radius: 4px;"></div><div class="skel-row-text"><div class="spotiz-skeleton skel-row-title"></div><div class="spotiz-skeleton skel-row-sub"></div></div></div>`).join('')}
      </div>
    </div>
  `,
  playlist: `
    <div class="spotiz-skeleton-wrapper">
      <div class="skel-header" style="flex-direction: row; align-items: flex-end;">
        <div class="spotiz-skeleton skel-cover" style="box-shadow: 0 8px 32px rgba(0,0,0,0.5);"></div>
        <div class="skel-header-text">
          <div class="spotiz-skeleton skel-subtitle" style="height: 14px;"></div>
          <div class="spotiz-skeleton skel-title" style="width: 70%; height: 50px;"></div>
          <div class="spotiz-skeleton skel-subtitle" style="width: 50%;"></div>
        </div>
      </div>
      <div class="skel-row-container" style="margin-top: 2.5rem;">
        ${Array(10).fill(`<div class="skel-row"><div class="spotiz-skeleton skel-row-img"></div><div class="skel-row-text"><div class="spotiz-skeleton skel-row-title"></div><div class="spotiz-skeleton skel-row-sub"></div></div></div>`).join('')}
      </div>
    </div>
  `,
  library: `
    <div class="spotiz-skeleton-wrapper">
      <div class="spotiz-skeleton skel-title" style="height: 32px; width: 180px; margin-bottom: 15px;"></div>
      <div class="skel-grid">
        ${Array(8).fill(`<div class="skel-card"><div class="spotiz-skeleton skel-card-img"></div><div class="spotiz-skeleton skel-card-title"></div><div class="spotiz-skeleton skel-card-sub"></div></div>`).join('')}
      </div>
    </div>
  `,
  lyrics: `
    <div class="spotiz-skeleton-wrapper" style="align-items: center; text-align: center; gap: 2.5rem; padding-top: 5rem;">
       ${Array(6).fill(0).map(() => `<div class="spotiz-skeleton skel-title" style="width: ${50 + Math.random() * 30}%; height: 36px; margin: 0 auto; border-radius: 8px;"></div>`).join('')}
    </div>
  `
};

const getPageType = (spinner: HTMLElement) => {
  const state = window.history.state;
  let view = state?.viewKey || '';
  
  if (typeof view === 'string') {
      if (view.includes('search')) return 'search';
      if (view.includes('artist')) return 'artist';
      if (view.includes('album')) return 'album';
      if (view.includes('playlist')) return 'playlist';
      if (view.includes('library')) return 'library';
      if (view.includes('lyrics')) return 'lyrics';
      if (view.includes('home')) return 'home';
  }
  
  let p = spinner.parentElement;
  while(p) {
      const text = p.textContent?.toLowerCase() || '';
      if (text.includes('search') || p.querySelector('input[type="text"]')) return 'search';
      if (text.includes('artist')) return 'artist';
      if (text.includes('album')) return 'album';
      if (text.includes('playlist')) return 'playlist';
      if (text.includes('library')) return 'library';
      if (text.includes('lyrics')) return 'lyrics';
      p = p.parentElement;
  }
  
  return 'home';
};

const SkeletonManager = () => {
  useEffect(() => {
    if (!document.getElementById('spotiz-skeleton-styles')) {
      const style = document.createElement('style');
      style.id = 'spotiz-skeleton-styles';
      style.innerHTML = `
        @keyframes spotizShimmer {
          0% { background-position: -1000px 0; }
          100% { background-position: 1000px 0; }
        }
        .spotiz-skeleton {
          background: #202020;
          background-image: linear-gradient(90deg, #202020 0px, #2e2e2e 100px, #202020 200px);
          background-size: 1000px 100%;
          animation: spotizShimmer 2.5s infinite linear;
        }
        .spotiz-skeleton-wrapper {
          width: 100%; height: 100%; display: flex; flex-direction: column; padding: 1.5rem; gap: 2rem; box-sizing: border-box;
          animation: skelFadeIn 0.3s ease;
          overflow: hidden;
        }
        @keyframes skelFadeIn { from { opacity: 0; } to { opacity: 1; } }
        .skel-header { display: flex; gap: 1.5rem; align-items: flex-end; }
        @media (max-width: 640px) {
           .skel-header { flex-direction: column !important; align-items: center !important; text-align: center; }
           .skel-header-text { align-items: center; text-align: center; }
        }
        .skel-cover { width: 192px; height: 192px; border-radius: 8px; flex-shrink: 0; box-shadow: 0 8px 24px rgba(0,0,0,0.3); }
        .skel-cover.circle { border-radius: 50%; }
        .skel-header-text { display: flex; flex-direction: column; gap: 0.75rem; width: 100%; justify-content: flex-end; }
        .skel-title { height: 48px; width: 60%; border-radius: 4px; }
        .skel-subtitle { height: 20px; width: 30%; border-radius: 4px; }
        .skel-row-container { display: flex; flex-direction: column; gap: 1rem; width: 100%; }
        .skel-row { display: flex; align-items: center; gap: 1rem; width: 100%; padding: 0.5rem; border-radius: 8px; }
        .skel-row-img { width: 48px; height: 48px; border-radius: 4px; flex-shrink: 0; }
        .skel-row-text { display: flex; flex-direction: column; gap: 0.6rem; width: 100%; }
        .skel-row-title { height: 16px; width: 40%; border-radius: 4px; }
        .skel-row-sub { height: 12px; width: 25%; border-radius: 4px; }
        .skel-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 1.5rem; width: 100%; }
        .skel-card { display: flex; flex-direction: column; gap: 1rem; background: rgba(32,32,32,0.4); padding: 1rem; border-radius: 8px; }
        .skel-card-img { width: 100%; aspect-ratio: 1; border-radius: 6px; box-shadow: 0 4px 12px rgba(0,0,0,0.2); }
        .skel-card-img.circle { border-radius: 50%; }
        .skel-card-title { height: 16px; width: 80%; border-radius: 4px; }
        .skel-card-sub { height: 12px; width: 50%; border-radius: 4px; }
        
        .skeleton-overlay-container {
           position: fixed;
           z-index: 40;
           pointer-events: none;
           will-change: transform, opacity;
        }
      `;
      document.head.appendChild(style);
    }

    const injectedSkeletons = new Map<HTMLElement, { overlay: HTMLElement; parent: HTMLElement }>();
    let scrollResizeAttached = false;

    const detachScrollResize = () => {
       if (scrollResizeAttached && injectedSkeletons.size === 0) {
           scrollResizeAttached = false;
           window.removeEventListener('scroll', onScrollOrResize);
           window.removeEventListener('resize', onScrollOrResize);
       }
    };

    const updateAllPositions = () => {
       if (injectedSkeletons.size === 0) return;
       
       const staleSpinners: HTMLElement[] = [];
       injectedSkeletons.forEach((data, spinner) => {
           const { overlay, parent } = data;
           if (!document.contains(parent) || !document.contains(spinner)) {
               overlay.remove();
               staleSpinners.push(spinner);
               return;
           }
           
           const rect = parent.getBoundingClientRect();
           if (rect.width === 0 || rect.height === 0) {
               overlay.style.opacity = '0';
               return;
           }
           
           overlay.style.opacity = '1';
           overlay.style.top = `${rect.top}px`;
           overlay.style.left = `${rect.left}px`;
           overlay.style.width = `${rect.width}px`;
           overlay.style.height = `${rect.height}px`;
       });

       if (staleSpinners.length > 0) {
           staleSpinners.forEach(s => injectedSkeletons.delete(s));
           if (injectedSkeletons.size === 0) {
               detachScrollResize();
           }
       }
    };

    let throttledUpdateTimer: any = null;
    const onScrollOrResize = () => {
       if (throttledUpdateTimer || injectedSkeletons.size === 0) return;
       throttledUpdateTimer = requestAnimationFrame(() => {
           throttledUpdateTimer = null;
           updateAllPositions();
       });
    };

    const attachScrollResize = () => {
       if (!scrollResizeAttached && injectedSkeletons.size > 0) {
           scrollResizeAttached = true;
           // IMPORTANT: Do NOT use capture: true so inner container scrolling (like the full player) is not intercepted
           window.addEventListener('scroll', onScrollOrResize, { passive: true });
           window.addEventListener('resize', onScrollOrResize, { passive: true });
       }
    };

    const positionSingleSkeleton = (spinner: HTMLElement, overlay: HTMLElement, parent: HTMLElement) => {
       const rect = parent.getBoundingClientRect();
       if (rect.width === 0 || rect.height === 0) {
           overlay.style.opacity = '0';
           return;
       }
       overlay.style.opacity = '1';
       overlay.style.top = `${rect.top}px`;
       overlay.style.left = `${rect.left}px`;
       overlay.style.width = `${rect.width}px`;
       overlay.style.height = `${rect.height}px`;
    };

    const isExcludedPlayerElement = (el: Element | null): boolean => {
      if (!el) return true;
      if (el.closest('button, [role="button"], .mini-player, [data-player], aside, nav, header, footer, [class*="player"], [id*="player"], [id*="fullscreen"], [id*="canvas"], [aria-label*="Play"], [aria-label*="Pause"], [title*="Play"], [title*="Pause"], [data-track-id]')) {
        return true;
      }
      return false;
    };

    let mutationRaf: any = null;
    const pendingMutations: MutationRecord[] = [];

    const processMutations = () => {
      mutationRaf = null;
      if (pendingMutations.length === 0) return;
      const records = pendingMutations.splice(0, pendingMutations.length);

      records.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const el = node as HTMLElement;
            // Skip player, controls, audio elements entirely
            if (isExcludedPlayerElement(el)) {
              return;
            }

            const spinners = el.classList?.contains('animate-spin') ? [el] : Array.from(el.querySelectorAll('.animate-spin'));
            
            spinners.forEach(spinner => {
               const parent = spinner.parentElement;
               if (!parent || isExcludedPlayerElement(parent) || isExcludedPlayerElement(spinner)) return;
               
               // Exclude buttons, player controls, mini player, audio playback indicators, small spinners
               if (spinner.classList.contains('w-3') || spinner.classList.contains('w-4') || spinner.classList.contains('w-5') || spinner.classList.contains('w-6') || spinner.classList.contains('w-7') || spinner.classList.contains('w-8') || spinner.classList.contains('w-10') || spinner.classList.contains('w-12') || spinner.classList.contains('w-14') || spinner.classList.contains('w-16')) return;
               if (spinner.classList.contains('h-3') || spinner.classList.contains('h-4') || spinner.classList.contains('h-5') || spinner.classList.contains('h-6') || spinner.classList.contains('h-7') || spinner.classList.contains('h-8') || spinner.classList.contains('h-10') || spinner.classList.contains('h-12') || spinner.classList.contains('h-14') || spinner.classList.contains('h-16')) return;
               
               if (!injectedSkeletons.has(spinner as HTMLElement)) {
                  (spinner as HTMLElement).style.opacity = '0';
                  
                  const pageType = getPageType(spinner as HTMLElement);
                  const skeletonHtml = SKELETON_HTML[pageType as keyof typeof SKELETON_HTML] || SKELETON_HTML.home;
                  
                  const overlay = document.createElement('div');
                  overlay.className = 'skeleton-overlay-container';
                  overlay.style.backgroundColor = '#121212';
                  overlay.innerHTML = skeletonHtml;
                  
                  document.body.appendChild(overlay);
                  positionSingleSkeleton(spinner as HTMLElement, overlay, parent);
                  
                  injectedSkeletons.set(spinner as HTMLElement, { overlay, parent });
                  attachScrollResize();
               }
            });
          }
        });
        
        mutation.removedNodes.forEach(node => {
           if (node.nodeType === Node.ELEMENT_NODE) {
              const el = node as HTMLElement;
              for (const [spinner, data] of Array.from(injectedSkeletons.entries())) {
                 if (el === spinner || el.contains(spinner)) {
                    const { overlay } = data;
                    overlay.style.transition = 'opacity 0.25s ease';
                    overlay.style.opacity = '0';
                    setTimeout(() => overlay.remove(), 250);
                    injectedSkeletons.delete(spinner);
                 }
              }
              if (injectedSkeletons.size === 0) {
                 detachScrollResize();
              }
           }
        });
      });
    };

    const handleMutations = (mutations: MutationRecord[]) => {
      pendingMutations.push(...mutations);
      if (!mutationRaf) {
        mutationRaf = requestAnimationFrame(processMutations);
      }
    };

    const targetContainer = document.getElementById('root') || document.body;
    const observer = new MutationObserver(handleMutations);
    observer.observe(targetContainer, { childList: true, subtree: true });

    return () => {
        observer.disconnect();
        detachScrollResize();
        if (mutationRaf) cancelAnimationFrame(mutationRaf);
        if (throttledUpdateTimer) cancelAnimationFrame(throttledUpdateTimer);
        injectedSkeletons.forEach(({ overlay }) => overlay.remove());
        injectedSkeletons.clear();
    };
  }, []);

  return null;
};

export default SkeletonManager;
