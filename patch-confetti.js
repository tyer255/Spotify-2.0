import fs from 'fs';
let code = fs.readFileSync('src/views/PremiumView.tsx', 'utf8');

if (!code.includes("canvas-confetti")) {
  code = code.replace(/import React from 'react';/, "import React, { useEffect } from 'react';\nimport confetti from 'canvas-confetti';");
}

if (!code.includes("confetti(")) {
  code = code.replace(/export const PremiumView: React\.FC<PremiumViewProps> = \(\{ onNavigate \}\) => \{/, `export const PremiumView: React.FC<PremiumViewProps> = ({ onNavigate }) => {
  useEffect(() => {
    const duration = 2.5 * 1000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.8 },
        colors: ['#10B981', '#34D399', '#ffffff']
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.8 },
        colors: ['#10B981', '#34D399', '#ffffff']
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  }, []);`);
}

fs.writeFileSync('src/views/PremiumView.tsx', code);
console.log("Patched confetti");
