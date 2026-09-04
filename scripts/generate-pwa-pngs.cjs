const fs = require('fs');
const zlib = require('zlib');

function crc32(buf) {
  let crc = 0 ^ (-1);
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xFF];
  }
  return (crc ^ (-1)) >>> 0;
}

const table = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let k = 0; k < 8; k++) {
    c = ((c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1));
  }
  table[i] = c;
}

function makeChunk(type, data) {
  const len = data.length;
  const buf = Buffer.alloc(4 + 4 + len + 4);
  buf.writeUInt32BE(len, 0);
  buf.write(type, 4);
  data.copy(buf, 8);
  const crc = crc32(buf.subarray(4, 8 + len));
  buf.writeUInt32BE(crc, 8 + len);
  return buf;
}

function generateIconPNG(size, isMaskable = false) {
  const width = size;
  const height = size;
  const rawData = Buffer.alloc(height * (1 + width * 4));
  let offset = 0;

  // Center and radius parameters relative to size
  const scale = isMaskable ? 0.78 : 0.88;
  const cx = width * (isMaskable ? 0.49 : 0.46);
  const cy = height * (isMaskable ? 0.54 : 0.54);
  const rOuter = (size / 2) * scale;
  const rInner = rOuter * 0.95;

  // Crown position relative to size
  const crownCx = cx + rOuter * 0.68;
  const crownCy = cy - rOuter * 0.72;
  const crownR = rOuter * 0.42;

  for (let y = 0; y < height; y++) {
    rawData[offset++] = 0; // Filter 0
    for (let x = 0; x < width; x++) {
      let r = 0, g = 0, b = 0, a = 0;

      if (isMaskable) {
        // Dark background for maskable
        r = 18; g = 18; b = 18; a = 255;
      }

      // 1. Check Distance to Main Orb Center
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // 2. Check Distance to Crown Area
      const cdx = x - crownCx;
      const cdy = y - crownCy;
      const cdist = Math.sqrt(cdx * cdx + cdy * cdy);

      if (dist <= rOuter) {
        if (dist > rInner) {
          // Gold Bezel
          const angle = Math.atan2(dy, dx);
          const goldShine = 0.5 + 0.5 * Math.sin(angle * 2 + 1.2);
          r = Math.round(218 * (0.8 + 0.25 * goldShine));
          g = Math.round(165 * (0.75 + 0.3 * goldShine));
          b = Math.round(32 * (0.6 + 0.4 * goldShine));
          a = 255;
        } else {
          // 3D Glass Emerald Orb
          const nx = dx / rInner;
          const ny = dy / rInner;
          const nz = Math.max(0, Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny)));

          // Radial base gradient (dark forest green at edges, vibrant emerald at center-top)
          const lightX = -0.3;
          const lightY = -0.4;
          const lightZ = 0.8;
          const dot = Math.max(0, nx * lightX + ny * lightY + nz * lightZ);
          
          // Spotify vibrant green #1ed760 with glossy depths
          const baseR = 25 + Math.round(50 * dot);
          const baseG = 160 + Math.round(75 * dot);
          const baseB = 70 + Math.round(40 * dot);

          // Specular highlights
          const spec = Math.pow(dot, 6);
          const specHighlight = Math.round(255 * spec * 0.6);

          r = Math.min(255, baseR + specHighlight);
          g = Math.min(255, baseG + specHighlight);
          b = Math.min(255, baseB + specHighlight);
          a = 255;

          // 3D Ceramic White Sound Arcs (Embossed)
          // Top Arc, Mid Arc, Bottom Arc
          const checkArc = (arcYOffset, arcRadius, thickness, angleSpread) => {
            const adx = x - cx;
            const ady = y - (cy + arcYOffset * (rInner / 180));
            const adist = Math.sqrt(adx * adx + ady * ady);
            const aAngle = Math.atan2(ady, adx);
            // Arc is in top half of its relative center
            if (aAngle > -Math.PI * 0.95 && aAngle < -Math.PI * 0.05) {
              const diff = Math.abs(adist - arcRadius * (rInner / 180));
              if (diff <= thickness * (rInner / 180)) {
                return 1 - (diff / (thickness * (rInner / 180)));
              }
            }
            return 0;
          };

          const a1 = checkArc(55, 145, 12, 0.4);
          const a2 = checkArc(45, 115, 10.5, 0.35);
          const a3 = checkArc(35, 85, 9.5, 0.3);
          const arcIntensity = Math.max(a1, a2, a3);

          if (arcIntensity > 0) {
            // White Ceramic with subtle ambient drop-shadow
            const arcR = Math.round(248 + 7 * arcIntensity);
            const arcG = Math.round(250 + 5 * arcIntensity);
            const arcB = Math.round(252 + 3 * arcIntensity);
            
            r = Math.round(r * (1 - arcIntensity) + arcR * arcIntensity);
            g = Math.round(g * (1 - arcIntensity) + arcG * arcIntensity);
            b = Math.round(b * (1 - arcIntensity) + arcB * arcIntensity);
          }
        }
      }

      // Render Royal Crown atop Upper-Right
      if (cdist <= crownR) {
        // Crown Gold & Jewels
        const cAngle = Math.atan2(cdy, cdx);
        const goldShine = 0.5 + 0.5 * Math.sin(cAngle * 3);
        const crownRVal = Math.round(250 * (0.8 + 0.2 * goldShine));
        const crownGVal = Math.round(195 * (0.8 + 0.2 * goldShine));
        const crownBVal = Math.round(40 * (0.6 + 0.4 * goldShine));

        // Inset Gemstones (Ruby, Emerald, Sapphire)
        let gemR = crownRVal, gemG = crownGVal, gemB = crownBVal;
        if (cdist < crownR * 0.45) {
          gemR = 225; gemG = 29; gemB = 72; // Ruby center
        } else if (cdx < 0 && cdist < crownR * 0.75) {
          gemR = 37; gemG = 99; gemB = 235; // Sapphire
        } else if (cdx > 0 && cdist < crownR * 0.75) {
          gemR = 16; gemG = 185; gemB = 129; // Emerald
        }

        r = gemR;
        g = gemG;
        b = gemB;
        a = 255;
      }

      rawData[offset++] = r;
      rawData[offset++] = g;
      rawData[offset++] = b;
      rawData[offset++] = a;
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr.writeUInt8(8, 8);
  ihdr.writeUInt8(6, 9);
  ihdr.writeUInt8(0, 10);
  ihdr.writeUInt8(0, 11);
  ihdr.writeUInt8(0, 12);

  const compressed = zlib.deflateSync(rawData);
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdrChunk = makeChunk('IHDR', ihdr);
  const idatChunk = makeChunk('IDAT', compressed);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// Generate all standard PWA PNG assets
fs.writeFileSync('public/pwa-512x512.png', generateIconPNG(512, false));
fs.writeFileSync('public/pwa-192x192.png', generateIconPNG(192, false));
fs.writeFileSync('public/apple-touch-icon.png', generateIconPNG(180, false));
fs.writeFileSync('public/pwa-maskable-512x512.png', generateIconPNG(512, true));
fs.writeFileSync('public/favicon.png', generateIconPNG(64, false));

console.log('Successfully generated all PWA PNG icons!');
