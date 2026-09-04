import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { extractColorsFromImage, ExtractedColors } from '../../utils/colorExtractor';

interface DynamicAmbientBackgroundProps {
  artworkUrl?: string;
  isDimmed?: boolean;
}

export const DynamicAmbientBackground: React.FC<DynamicAmbientBackgroundProps> = ({
  artworkUrl,
  isDimmed = false,
}) => {
  const [colors, setColors] = useState<ExtractedColors | null>(null);
  const prevArtworkRef = useRef<string | undefined>(undefined);

  // Extract colors only when artworkUrl changes
  useEffect(() => {
    if (!artworkUrl) return;
    if (prevArtworkRef.current === artworkUrl && colors) return;
    prevArtworkRef.current = artworkUrl;

    let isCurrent = true;
    extractColorsFromImage(artworkUrl).then((res) => {
      if (isCurrent) {
        setColors(res);
      }
    });

    return () => {
      isCurrent = false;
    };
  }, [artworkUrl]);

  const activeKey = artworkUrl || 'fallback-ambient';

  return (
    <div
      id="dynamic-ambient-background"
      className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none select-none z-0"
    >
      <AnimatePresence mode="sync">
        <motion.div
          key={activeKey}
          initial={{ opacity: 0 }}
          animate={{ opacity: isDimmed ? 0.35 : 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
          className="absolute inset-0 w-full h-full transform-gpu"
        >
          {/* LAYER 1: Deep Root Base Tone (Never pitch black, blends with artwork dominant tone) */}
          <div
            className="absolute inset-0 w-full h-full transition-colors duration-700"
            style={{
              backgroundColor: colors?.darkBase || '#121a15',
            }}
          />

          {/* LAYER 2: Highly Blurred, Enlarged Artwork Fill (True Dynamic Organic Texture) */}
          {artworkUrl && (
            <div
              className="absolute -inset-16 w-[calc(100%+8rem)] h-[calc(100%+8rem)] transform-gpu scale-125"
              style={{
                backgroundImage: `url(${artworkUrl})`,
                backgroundPosition: 'center',
                backgroundSize: 'cover',
                filter: 'blur(72px) saturate(1.45) brightness(0.62)',
                opacity: 0.85,
              }}
            />
          )}

          {/* LAYER 3: Dynamic Multi-Point Radial Aura Lighting (derived from extracted vibrant & primary colors) */}
          {colors && (
            <>
              {/* Top-left / center vibrant color spotlight */}
              <div
                className="absolute -top-[20%] -left-[15%] w-[80vw] h-[80vw] max-w-[900px] max-h-[900px] rounded-full blur-[90px] opacity-45 mix-blend-screen transform-gpu pointer-events-none"
                style={{
                  background: `radial-gradient(circle, ${colors.vibrant} 0%, ${colors.primary} 45%, transparent 75%)`,
                }}
              />

              {/* Bottom-right secondary hue illumination */}
              <div
                className="absolute -bottom-[20%] -right-[15%] w-[75vw] h-[75vw] max-w-[850px] max-h-[850px] rounded-full blur-[100px] opacity-35 mix-blend-screen transform-gpu pointer-events-none"
                style={{
                  background: `radial-gradient(circle, ${colors.secondary} 0%, ${colors.darkBase} 50%, transparent 80%)`,
                }}
              />
            </>
          )}

          {/* LAYER 4: Smooth Dark Readability Scrim (Ensures crystal clear lyrics, typography and controls) */}
          <div
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{
              background: `
                linear-gradient(
                  to bottom,
                  rgba(0, 0, 0, 0.42) 0%,
                  rgba(0, 0, 0, 0.18) 25%,
                  rgba(0, 0, 0, 0.22) 55%,
                  rgba(0, 0, 0, 0.55) 85%,
                  rgba(0, 0, 0, 0.75) 100%
                )
              `,
            }}
          />

          {/* LAYER 5: Fine Vignette Edge Softener */}
          <div
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0, 0, 0, 0.5) 100%)',
            }}
          />
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
