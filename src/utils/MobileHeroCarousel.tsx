import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Play, ChevronLeft, ChevronRight } from 'lucide-react';

interface CarouselItem {
  id: string;
  title: string;
  artist: string;
  imgSrc: string;
  originalElement: HTMLElement;
}

export const MobileHeroCarousel = () => {
  const [items, setItems] = useState<CarouselItem[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [containerNode, setContainerNode] = useState<HTMLElement | null>(null);

  // Responsive screen tracking
  const [windowWidth, setWindowWidth] = useState<number>(() =>
    typeof window !== 'undefined' ? window.innerWidth : 390
  );

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && containerNode) {
      resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          if (entry.contentRect.width > 0) {
            setWindowWidth(window.innerWidth);
          }
        }
      });
      resizeObserver.observe(containerNode);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      if (resizeObserver) resizeObserver.disconnect();
    };
  }, [containerNode]);

  const isDesktop = windowWidth >= 1024;
  const isTablet = windowWidth >= 640 && windowWidth < 1024;
  const isMobile = windowWidth < 640;

  // Responsive Metrics
  const dims = isDesktop
    ? {
        containerHeight: '480px',
        paddingTop: '22px',
        trackHeight: '300px',
        cardWidth: 230,
        cardHeight: 295,
        leftCardOffset: -180,
        rightCardOffset: 180,
        titleSize: '28px',
        playBtnSize: '52px',
        playIconSize: '24px',
        badgeFontSize: '13px',
        dotActiveWidth: '26px',
      }
    : isTablet
    ? {
        containerHeight: '440px',
        paddingTop: '18px',
        trackHeight: '270px',
        cardWidth: 200,
        cardHeight: 260,
        leftCardOffset: -140,
        rightCardOffset: 140,
        titleSize: '25px',
        playBtnSize: '48px',
        playIconSize: '22px',
        badgeFontSize: '12px',
        dotActiveWidth: '24px',
      }
    : {
        // Mobile (<640px) - exact identical approved dimensions
        containerHeight: '390px',
        paddingTop: '16px',
        trackHeight: '240px',
        cardWidth: 165,
        cardHeight: 225,
        leftCardOffset: -95,
        rightCardOffset: 95,
        titleSize: '22px',
        playBtnSize: '44px',
        playIconSize: '20px',
        badgeFontSize: '12px',
        dotActiveWidth: '22px',
      };

  useEffect(() => {
    let mounted = true;
    const interval = setInterval(() => {
      // 1. Check if we are on Search Page
      const isSearchPage = document.querySelector('input[placeholder*="Search"], input[placeholder*="search"]') !== null;
      if (isSearchPage) {
        if (containerNode) containerNode.style.display = 'none';
        return;
      }

      // 2. Find the top filter row and the Ad Container
      const filterRow = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.trim() === 'All')?.closest('.sticky');
      
      const spans = Array.from(document.querySelectorAll('span')).filter(s => s.textContent?.trim() === 'Advertisement');
      // Hide the old ad container completely
      if (spans.length > 0) {
        let el = spans[0] as HTMLElement;
        while (el && !el.className.includes('relative') && !el.className.includes('overflow-hidden')) {
          if (el.tagName === 'BODY') break;
          el = el.parentElement as HTMLElement;
        }
        if (el) {
          let adParent = el.parentElement as HTMLElement;
          if (adParent && (adParent.className.includes('my-2') || adParent.className.includes('my-4'))) {
            adParent.style.display = 'none';
          } else {
            el.style.display = 'none';
          }
        }
      }

      // 3. Extract items from the DOM (Scraping real music data)
      if (items.length === 0) {
        const itemNodes = Array.from(document.querySelectorAll('.group'));
        const extracted: CarouselItem[] = [];
        itemNodes.forEach((node, idx) => {
          const img = node.querySelector('img');
          const titleEl = node.querySelector('h2, h3, h4, h5, .font-semibold, .font-bold');
          const artistEl = node.querySelector('p, .text-neutral-400');
          // Check for valid image and ensure it's a music card (has object-cover)
          if (img && img.src && !img.src.includes('data:image') && titleEl && img.className.includes('object-cover')) {
            extracted.push({
              id: `carousel-item-${idx}`,
              title: titleEl.textContent?.trim() || 'Unknown',
              artist: artistEl?.textContent?.trim() || 'Artist',
              imgSrc: img.src,
              originalElement: node as HTMLElement
            });
          }
        });
        
        // Remove duplicates by title
        const unique = extracted.filter((v, i, a) => a.findIndex(t => (t.title === v.title)) === i);
        
        if (unique.length >= 3 && mounted) {
          // Take top 5
          setItems(unique.slice(0, 5));
        }
      }

      // 4. Mount container if not exists and inject IMMEDIATELY after filter row
      if (filterRow && filterRow.parentElement && !isSearchPage) {
        let heroRoot = document.getElementById('spotiz-mobile-hero-root');
        if (!heroRoot) {
          heroRoot = document.createElement('div');
          heroRoot.id = 'spotiz-mobile-hero-root';
          // Render on mobile, tablet, and desktop with natural spacing
          heroRoot.className = 'w-full pt-2 mb-3 relative z-10 block'; 
          // Insert immediately after the filter row
          filterRow.parentElement.insertBefore(heroRoot, filterRow.nextSibling);
        }
        if (mounted) setContainerNode(heroRoot);
      } else if (containerNode && !isSearchPage) {
        containerNode.style.display = 'block';
      }

    }, 1000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [items.length, containerNode]);

  // Touch swipe support (preserved for mobile/touch)
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [isPaused, setIsPaused] = useState(false);

  // Desktop Mouse Drag & Hover State
  const [dragOffset, setDragOffset] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const isMouseDownRef = useRef(false);
  const startXRef = useRef(0);
  const dragDeltaXRef = useRef(0);
  const hasDraggedRef = useRef(false);

  // Auto-rotate
  useEffect(() => {
    if (items.length === 0 || isPaused) return;
    const rotate = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % items.length);
    }, 4000);
    return () => clearInterval(rotate);
  }, [items.length, isPaused]);

  // Clean up global drag listeners if unmounted
  useEffect(() => {
    return () => {
      isMouseDownRef.current = false;
    };
  }, []);

  if (!containerNode || items.length === 0) return null;

  const handleNext = () => setActiveIndex((prev) => (prev + 1) % items.length);
  const handlePrev = () => setActiveIndex((prev) => (prev - 1 + items.length) % items.length);

  // Mobile Touch Swipe Handling
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsPaused(true);
    if (e.touches.length > 0) {
      setTouchStartX(e.touches[0].clientX);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX !== null && e.changedTouches.length > 0) {
      const deltaX = e.changedTouches[0].clientX - touchStartX;
      if (deltaX > 45) {
        handlePrev();
      } else if (deltaX < -45) {
        handleNext();
      }
    }
    setTouchStartX(null);
    setTimeout(() => setIsPaused(false), 3000);
  };

  // Desktop Mouse Drag Handling
  const handleMouseDown = (e: React.MouseEvent) => {
    // Only primary left mouse button
    if (e.button !== 0) return;

    // Do not initiate drag when clicking interactive buttons
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('[data-no-drag]')) {
      return;
    }

    setIsPaused(true);
    isMouseDownRef.current = true;
    startXRef.current = e.clientX;
    dragDeltaXRef.current = 0;
    hasDraggedRef.current = false;

    const onMouseMove = (moveEvent: MouseEvent) => {
      if (!isMouseDownRef.current) return;
      const deltaX = moveEvent.clientX - startXRef.current;
      dragDeltaXRef.current = deltaX;

      if (Math.abs(deltaX) > 6) {
        if (!hasDraggedRef.current) {
          hasDraggedRef.current = true;
          setIsDragging(true);
        }
        // Responsive, physical-feeling displacement with subtle dampening (max 140px)
        const clampedDelta = Math.sign(deltaX) * Math.min(140, Math.pow(Math.abs(deltaX), 0.92));
        setDragOffset(clampedDelta);
      }
    };

    const onMouseUp = () => {
      if (!isMouseDownRef.current) return;
      isMouseDownRef.current = false;
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);

      const finalDelta = dragDeltaXRef.current;
      setDragOffset(0);
      setIsDragging(false);

      // Drag threshold of 45px to trigger card shift
      if (finalDelta < -45) {
        handleNext();
      } else if (finalDelta > 45) {
        handlePrev();
      }

      // Suppress accidental click-to-play after dragging
      if (hasDraggedRef.current) {
        setTimeout(() => {
          hasDraggedRef.current = false;
        }, 120);
      }

      setTimeout(() => {
        setIsPaused(false);
      }, 2500);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const handlePlay = (e?: React.MouseEvent | Event | any, targetItem?: CarouselItem) => {
    if (e && typeof e.stopPropagation === 'function') {
      e.stopPropagation();
    }
    const itemToPlay = targetItem || (e && e.originalElement ? e : items[activeIndex]);
    if (itemToPlay && itemToPlay.originalElement) {
      itemToPlay.originalElement.click();
    }
  };

  const currentItem = items[activeIndex];

  return createPortal(
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => {
        if (!isMouseDownRef.current) setIsPaused(false);
      }}
      style={{
        position: 'relative',
        width: '100%',
        minHeight: dims.containerHeight,
        height: dims.containerHeight,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        paddingTop: dims.paddingTop,
        overflow: 'hidden',
        borderRadius: isDesktop ? '28px' : '24px',
        backgroundColor: '#0a0c10',
        boxShadow: '0 20px 45px rgba(0, 0, 0, 0.6)',
        border: '1px solid rgba(255, 255, 255, 0.07)',
        transition: 'height 0.3s ease, min-height 0.3s ease',
        userSelect: 'none',
        WebkitUserSelect: 'none',
      }}
    >
      {/* Cinematic Background Blur */}
      <img
        src={currentItem.imgSrc}
        referrerPolicy="no-referrer"
        alt=""
        draggable={false}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          opacity: 0.35,
          filter: 'blur(40px)',
          transform: 'scale(1.25)',
          pointerEvents: 'none',
          transition: 'all 0.8s ease-in-out',
          zIndex: 0,
          userSelect: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to bottom, rgba(10,12,16,0.15) 0%, rgba(10,12,16,0.75) 60%, #0a0c10 100%)',
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />

      {/* Carousel Track */}
      <div
        onMouseDown={handleMouseDown}
        style={{
          position: 'relative',
          width: '100%',
          height: dims.trackHeight,
          perspective: '1000px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10,
          cursor: isMobile ? 'default' : isDragging ? 'grabbing' : 'grab',
          userSelect: 'none',
          WebkitUserSelect: 'none',
        }}
      >
        {/* Desktop / Tablet Navigation Arrows */}
        {!isMobile && (
          <>
            <button
              type="button"
              data-no-drag="true"
              onClick={(e) => {
                e.stopPropagation();
                handlePrev();
              }}
              aria-label="Previous track"
              style={{
                position: 'absolute',
                left: isDesktop ? '20px' : '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: isDesktop ? '44px' : '38px',
                height: isDesktop ? '44px' : '38px',
                borderRadius: '50%',
                backgroundColor: 'rgba(0, 0, 0, 0.55)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                zIndex: 40,
                backdropFilter: 'blur(8px)',
                boxShadow: '0 4px 14px rgba(0,0,0,0.6)',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
                e.currentTarget.style.transform = 'translateY(-50%) scale(1.08)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.55)';
                e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
              }}
            >
              <ChevronLeft style={{ width: isDesktop ? '22px' : '18px', height: isDesktop ? '22px' : '18px' }} />
            </button>

            <button
              type="button"
              data-no-drag="true"
              onClick={(e) => {
                e.stopPropagation();
                handleNext();
              }}
              aria-label="Next track"
              style={{
                position: 'absolute',
                right: isDesktop ? '20px' : '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: isDesktop ? '44px' : '38px',
                height: isDesktop ? '44px' : '38px',
                borderRadius: '50%',
                backgroundColor: 'rgba(0, 0, 0, 0.55)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                zIndex: 40,
                backdropFilter: 'blur(8px)',
                boxShadow: '0 4px 14px rgba(0,0,0,0.6)',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
                e.currentTarget.style.transform = 'translateY(-50%) scale(1.08)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.55)';
                e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
              }}
            >
              <ChevronRight style={{ width: isDesktop ? '22px' : '18px', height: isDesktop ? '22px' : '18px' }} />
            </button>
          </>
        )}

        {items.map((item, idx) => {
          let position: 'center' | 'left' | 'right' | 'hidden' = 'hidden';
          let zIndex = 10;
          let transform = '';
          let opacity = 0;
          let border = '1px solid rgba(255, 255, 255, 0.08)';
          let boxShadow = '0 10px 25px rgba(0,0,0,0.5)';

          const isCenter = idx === activeIndex;
          const isLeft = idx === (activeIndex - 1 + items.length) % items.length;
          const isRight = idx === (activeIndex + 1) % items.length;
          const isHovered = hoveredIdx === idx && !isDragging && !isMobile;

          if (isCenter) {
            position = 'center';
            zIndex = 30;
            opacity = 1;
            transform = isDragging
              ? `translateX(${dragOffset}px) scale(1) translateZ(0px)`
              : isHovered
              ? 'translateX(0px) translateY(-4px) scale(1.018) translateZ(10px)'
              : 'translateX(0px) translateY(0px) scale(1) translateZ(0px)';
            border = isHovered
              ? '1.5px solid rgba(255, 255, 255, 0.38)'
              : '1.5px solid rgba(255, 255, 255, 0.25)';
            boxShadow = isHovered
              ? '0 24px 48px rgba(0,0,0,0.85), 0 8px 24px rgba(30,215,96,0.22), inset 0 1px 1px rgba(255,255,255,0.4)'
              : '0 20px 40px rgba(0,0,0,0.8), 0 0 20px rgba(30,215,96,0.18), inset 0 1px 1px rgba(255,255,255,0.3)';
          } else if (isLeft) {
            position = 'left';
            zIndex = isHovered ? 25 : 20;
            opacity = isHovered ? 0.85 : 0.65;
            transform = isDragging
              ? `translateX(${dims.leftCardOffset + dragOffset * 0.55}px) scale(0.85) translateZ(-40px) rotateY(16deg)`
              : isHovered
              ? `translateX(${dims.leftCardOffset}px) translateY(-3px) scale(0.87) translateZ(-25px) rotateY(11deg)`
              : `translateX(${dims.leftCardOffset}px) translateY(0px) scale(0.85) translateZ(-40px) rotateY(16deg)`;
            border = isHovered
              ? '1px solid rgba(255, 255, 255, 0.22)'
              : '1px solid rgba(255, 255, 255, 0.08)';
            boxShadow = isHovered
              ? '0 16px 34px rgba(0,0,0,0.65)'
              : '0 10px 25px rgba(0,0,0,0.5)';
          } else if (isRight) {
            position = 'right';
            zIndex = isHovered ? 25 : 20;
            opacity = isHovered ? 0.85 : 0.65;
            transform = isDragging
              ? `translateX(${dims.rightCardOffset + dragOffset * 0.55}px) scale(0.85) translateZ(-40px) rotateY(-16deg)`
              : isHovered
              ? `translateX(${dims.rightCardOffset}px) translateY(-3px) scale(0.87) translateZ(-25px) rotateY(-11deg)`
              : `translateX(${dims.rightCardOffset}px) translateY(0px) scale(0.85) translateZ(-40px) rotateY(-16deg)`;
            border = isHovered
              ? '1px solid rgba(255, 255, 255, 0.22)'
              : '1px solid rgba(255, 255, 255, 0.08)';
            boxShadow = isHovered
              ? '0 16px 34px rgba(0,0,0,0.65)'
              : '0 10px 25px rgba(0,0,0,0.5)';
          } else {
            const offsetFromActive = (idx - activeIndex + items.length) % items.length;
            const isExitToLeft = offsetFromActive > items.length / 2;
            transform = isExitToLeft
              ? `translateX(${dims.leftCardOffset - 80}px) scale(0.65) translateZ(-80px) rotateY(20deg)`
              : `translateX(${dims.rightCardOffset + 80}px) scale(0.65) translateZ(-80px) rotateY(-20deg)`;
            opacity = 0;
            zIndex = 5;
          }

          return (
            <div
              key={item.id}
              onMouseEnter={() => {
                if (!isMobile) setHoveredIdx(idx);
              }}
              onMouseLeave={() => {
                if (!isMobile) setHoveredIdx(null);
              }}
              onClick={(e) => {
                if (e && typeof e.stopPropagation === 'function') {
                  e.stopPropagation();
                }
                // If user was actively dragging, suppress click-to-play
                if (hasDraggedRef.current) {
                  return;
                }
                if (position === 'left') handlePrev();
                if (position === 'right') handleNext();
                if (position === 'center') handlePlay(e, item);
              }}
              style={{
                position: 'absolute',
                width: `${dims.cardWidth}px`,
                height: `${dims.cardHeight}px`,
                left: `calc(50% - ${dims.cardWidth / 2}px)`,
                top: '8px',
                borderRadius: '16px',
                overflow: 'hidden',
                cursor: isMobile ? 'pointer' : isDragging ? 'grabbing' : 'pointer',
                border,
                backgroundColor: '#181818',
                boxShadow,
                transition: isDragging
                  ? 'none'
                  : 'transform 0.45s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.45s cubic-bezier(0.22, 1, 0.36, 1), border-color 0.3s ease, box-shadow 0.45s ease',
                zIndex,
                transform,
                opacity,
                pointerEvents: position === 'hidden' ? 'none' : 'auto',
                userSelect: 'none',
                WebkitUserSelect: 'none',
              }}
            >
              <img
                src={item.imgSrc}
                alt={item.title}
                referrerPolicy="no-referrer"
                draggable={false}
                onDragStart={(e) => e.preventDefault()}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: 'block',
                  userSelect: 'none',
                  WebkitUserSelect: 'none',
                  pointerEvents: 'none',
                  transform: isHovered ? 'scale(1.025)' : 'scale(1)',
                  transition: 'transform 0.4s cubic-bezier(0.22, 1, 0.36, 1)',
                }}
              />

              {/* Directional specular lighting sheen on card hover */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: 'inherit',
                  background: 'linear-gradient(180deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0) 45%)',
                  opacity: isHovered ? (position === 'center' ? 1 : 0.75) : 0,
                  pointerEvents: 'none',
                  transition: 'opacity 0.35s ease',
                  zIndex: 2,
                }}
              />

              {/* Play Button Overlay on Center Card */}
              {position === 'center' && (
                <div
                  data-no-drag="true"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (hasDraggedRef.current) return;
                    handlePlay(e, item);
                  }}
                  style={{
                    position: 'absolute',
                    bottom: '12px',
                    right: '12px',
                    width: dims.playBtnSize,
                    height: dims.playBtnSize,
                    borderRadius: '50%',
                    backgroundColor: '#1ed760',
                    color: '#000',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: isHovered
                      ? '0 8px 24px rgba(0,0,0,0.7), 0 0 16px rgba(30,215,96,0.5)'
                      : '0 6px 18px rgba(0,0,0,0.6), 0 0 12px rgba(30,215,96,0.4)',
                    cursor: 'pointer',
                    zIndex: 35,
                    transform: isHovered ? 'scale(1.06)' : 'scale(1)',
                    transition: 'transform 0.25s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.25s ease',
                  }}
                >
                  <Play
                    style={{
                      width: dims.playIconSize,
                      height: dims.playIconSize,
                      marginLeft: '2px',
                      fill: 'currentColor',
                    }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Meta Text */}
      <div
        style={{
          position: 'relative',
          zIndex: 20,
          marginTop: isDesktop ? '14px' : '10px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          paddingLeft: '16px',
          paddingRight: '16px',
          width: '100%',
          maxWidth: isDesktop ? '80%' : '92%',
        }}
      >
        <h2
          style={{
            fontSize: dims.titleSize,
            fontWeight: 800,
            color: '#ffffff',
            letterSpacing: '-0.02em',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            width: '100%',
            margin: 0,
            textShadow: '0 2px 8px rgba(0,0,0,0.8)',
          }}
        >
          {currentItem.title}
        </h2>

        {/* Metadata Badges */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexWrap: 'wrap',
            gap: isDesktop ? '10px' : '8px',
            marginTop: '8px',
            marginBottom: '10px',
            fontSize: dims.badgeFontSize,
            color: '#d4d4d4',
            fontWeight: 500,
          }}
        >
          <span style={{ padding: '3px 12px', borderRadius: '9999px', backgroundColor: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.06)' }}>
            Spotiz
          </span>
          <span
            style={{
              padding: '3px 12px',
              borderRadius: '9999px',
              backgroundColor: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.06)',
              maxWidth: isDesktop ? '200px' : '140px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {currentItem.artist}
          </span>
          <span
            style={{
              padding: '3px 12px',
              borderRadius: '9999px',
              backgroundColor: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.06)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <span style={{ color: '#1ed760' }}>★</span> 5.0
          </span>
        </div>

        {/* Pagination Dots */}
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }} data-no-drag="true">
          {items.map((_, i) => (
            <div
              key={i}
              data-no-drag="true"
              onClick={() => setActiveIndex(i)}
              style={{
                height: '5px',
                borderRadius: '9999px',
                transition: 'all 0.4s ease',
                cursor: 'pointer',
                width: i === activeIndex ? dims.dotActiveWidth : '6px',
                backgroundColor: i === activeIndex ? '#1ed760' : 'rgba(255,255,255,0.3)',
              }}
            />
          ))}
        </div>
      </div>
    </div>,
    containerNode
  );
};

