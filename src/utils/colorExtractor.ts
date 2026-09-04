/**
 * Color Extractor Utility
 * Extracts dominant, vibrant, and secondary colors from image URLs dynamically with in-memory caching.
 */

export interface ExtractedColors {
  primary: string;       // Main dominant color (hex / rgb)
  secondary: string;     // Supporting accent color
  darkBase: string;      // Deep tone for background contrast
  vibrant: string;       // High saturation vibrant color
  gradientCss: string;   // Ready-to-use radial/linear background gradient
}

// In-memory cache to prevent repeated canvas processing on the same image
const colorCache = new Map<string, ExtractedColors>();

// Fallback palette when no artwork or extraction fails
const DEFAULT_PALETTE: ExtractedColors = {
  primary: '#1e3a2f',
  secondary: '#2e4a3d',
  darkBase: '#0d1a15',
  vibrant: '#1db954',
  gradientCss: 'radial-gradient(circle at 30% 30%, #1e3a2f 0%, #0d1a15 60%, #050a08 100%)',
};

/**
 * Fast RGB to Hex conversion
 */
function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Calculate relative luminance / brightness
 */
function getBrightness(r: number, g: number, b: number): number {
  return (r * 299 + g * 587 + b * 114) / 1000;
}

/**
 * Calculate saturation (0 to 1)
 */
function getSaturation(r: number, g: number, b: number): number {
  const max = Math.max(r, g, b) / 255;
  const min = Math.min(r, g, b) / 255;
  if (max === min) return 0;
  const d = max - min;
  const l = (max + min) / 2;
  return l > 0.5 ? d / (2 - max - min) : d / (max + min);
}

/**
 * Adjust color brightness
 */
function adjustBrightness(hex: string, factor: number): string {
  const cleanHex = hex.replace('#', '');
  if (cleanHex.length !== 6) return hex;
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  return rgbToHex(r * factor, g * factor, b * factor);
}

/**
 * Extract dominant colors from an Image object using downscaled Canvas
 */
export async function extractColorsFromImage(imageUrl?: string): Promise<ExtractedColors> {
  if (!imageUrl) return DEFAULT_PALETTE;

  // 1. Check cache first
  if (colorCache.has(imageUrl)) {
    return colorCache.get(imageUrl)!;
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    const handleSuccess = () => {
      try {
        const canvas = document.createElement('canvas');
        // Small sample size is extremely fast (<2ms) and naturally clusters colors
        const sampleSize = 32;
        canvas.width = sampleSize;
        canvas.height = sampleSize;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });

        if (!ctx) {
          const fallback = fallbackFromUrl(imageUrl);
          colorCache.set(imageUrl, fallback);
          resolve(fallback);
          return;
        }

        ctx.drawImage(img, 0, 0, sampleSize, sampleSize);
        const imageData = ctx.getImageData(0, 0, sampleSize, sampleSize).data;

        let totalR = 0;
        let totalG = 0;
        let totalB = 0;
        let count = 0;

        let bestVibrant = { r: 30, g: 185, b: 84, score: -1 };
        let darkest = { r: 15, g: 15, b: 15, lum: 999 };
        let lightest = { r: 80, g: 80, b: 80, lum: -1 };

        // Sample pixels with step
        for (let i = 0; i < imageData.length; i += 16) {
          const r = imageData[i];
          const g = imageData[i + 1];
          const b = imageData[i + 2];
          const a = imageData[i + 3];

          if (a < 128) continue; // ignore transparent pixels

          totalR += r;
          totalG += g;
          totalB += b;
          count++;

          const lum = getBrightness(r, g, b);
          const sat = getSaturation(r, g, b);

          // We want vibrant colors (good saturation + medium luminance)
          const score = sat * 1.5 + (lum > 40 && lum < 200 ? 1 : 0.2);
          if (score > bestVibrant.score && lum > 30) {
            bestVibrant = { r, g, b, score };
          }

          if (lum < darkest.lum && lum > 10) {
            darkest = { r, g, b, lum };
          }
          if (lum > lightest.lum && lum < 230) {
            lightest = { r, g, b, lum };
          }
        }

        if (count === 0) {
          const fallback = fallbackFromUrl(imageUrl);
          colorCache.set(imageUrl, fallback);
          resolve(fallback);
          return;
        }

        const avgR = Math.round(totalR / count);
        const avgG = Math.round(totalG / count);
        const avgB = Math.round(totalB / count);

        const primaryHex = rgbToHex(avgR, avgG, avgB);
        const vibrantHex = bestVibrant.score > 0 ? rgbToHex(bestVibrant.r, bestVibrant.g, bestVibrant.b) : primaryHex;
        const secondaryHex = lightest.lum > 0 ? rgbToHex(lightest.r, lightest.g, lightest.b) : adjustBrightness(primaryHex, 1.3);
        const darkBaseHex = darkest.lum < 900 ? rgbToHex(darkest.r * 0.5, darkest.g * 0.5, darkest.b * 0.5) : adjustBrightness(primaryHex, 0.3);

        const result: ExtractedColors = {
          primary: primaryHex,
          secondary: secondaryHex,
          darkBase: darkBaseHex,
          vibrant: vibrantHex,
          gradientCss: `radial-gradient(circle at 40% 30%, ${primaryHex} 0%, ${darkBaseHex} 70%, #060807 100%)`,
        };

        colorCache.set(imageUrl, result);
        resolve(result);
      } catch {
        // In case of CORS canvas security error
        const fallback = fallbackFromUrl(imageUrl);
        colorCache.set(imageUrl, fallback);
        resolve(fallback);
      }
    };

    const handleError = () => {
      const fallback = fallbackFromUrl(imageUrl);
      colorCache.set(imageUrl, fallback);
      resolve(fallback);
    };

    img.onload = handleSuccess;
    img.onerror = handleError;
    img.src = imageUrl;
  });
}

/**
 * Deterministic fallback palette from string hash to avoid pure black
 */
function fallbackFromUrl(url: string): ExtractedColors {
  let hash = 0;
  for (let i = 0; i < url.length; i++) {
    hash = (hash << 5) - hash + url.charCodeAt(i);
    hash |= 0;
  }
  const hue1 = Math.abs(hash % 360);
  const hue2 = (hue1 + 40) % 360;

  const primary = `hsl(${hue1}, 45%, 28%)`;
  const vibrant = `hsl(${hue1}, 65%, 45%)`;
  const secondary = `hsl(${hue2}, 40%, 35%)`;
  const darkBase = `hsl(${hue1}, 35%, 10%)`;

  return {
    primary,
    secondary,
    darkBase,
    vibrant,
    gradientCss: `radial-gradient(circle at 35% 35%, ${primary} 0%, ${darkBase} 70%, #080a09 100%)`,
  };
}
