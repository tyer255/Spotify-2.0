import fs from 'fs';
let code = fs.readFileSync('src/views/PremiumView.tsx', 'utf8');

// Add confetti import
if (!code.includes("import confetti from 'canvas-confetti';")) {
  code = code.replace("import React from 'react';", "import React, { useEffect } from 'react';\nimport confetti from 'canvas-confetti';");
}

// Add useEffect
if (!code.includes("confetti(")) {
  code = code.replace("export const PremiumView: React.FC<PremiumViewProps> = ({ onNavigate }) => {", `export const PremiumView: React.FC<PremiumViewProps> = ({ onNavigate }) => {
  useEffect(() => {
    // Fire confetti when the view mounts
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
  }, []);
`);
}

// Update Standard Plan Card
const oldStandardCard = `<div className="relative rounded-3xl bg-[#181818] border border-white/10 p-6 space-y-5 shadow-2xl overflow-hidden">`;

const newStandardCard = `<motion.div 
            animate={{ boxShadow: ["0 0 0px rgba(16,185,129,0)", "0 0 20px rgba(16,185,129,0.4)", "0 0 0px rgba(16,185,129,0)"], borderColor: ["rgba(255,255,255,0.1)", "rgba(16,185,129,0.5)", "rgba(255,255,255,0.1)"] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="relative rounded-3xl bg-[#181818] border border-white/10 p-6 space-y-5 shadow-2xl overflow-hidden"
          >`;

code = code.replace(oldStandardCard, newStandardCard);

// Make sure to close motion.div instead of div for the standard card.
// We need to replace the closing tag of that specific div.
// It's easier to replace the entire block, but let's see.
