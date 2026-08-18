const fs = require('fs');
let code = fs.readFileSync('src/views/SettingsView.tsx', 'utf8');

// Add useEffect import if not present
if (!code.includes('useEffect')) {
  code = code.replace(/import React, { useState } from 'react';/, "import React, { useState, useEffect } from 'react';");
}

// Add SunMoon
code = code.replace(/import {([^}]*)} from 'lucide-react';/, "import {$1, SunMoon, Crown } from 'lucide-react';");

// Replace states with init functions and add useEffect
code = code.replace(
  /const \[audioQuality, setAudioQuality\] = useState<'normal' \| 'high' \| 'very_high'>\('very_high'\);/,
  `const [audioQuality, setAudioQuality] = useState<'normal' | 'high' | 'very_high'>(() => (localStorage.getItem('spotify_audio_quality') as any) || 'very_high');`
);
code = code.replace(
  /const \[crossfadeSeconds, setCrossfadeSeconds\] = useState\(3\);/,
  `const [crossfadeSeconds, setCrossfadeSeconds] = useState(() => parseInt(localStorage.getItem('spotify_crossfade') || '3', 10));`
);
code = code.replace(
  /const \[gapless, setGapless\] = useState\(true\);/,
  `const [gapless, setGapless] = useState(() => localStorage.getItem('spotify_gapless') !== 'false');`
);
code = code.replace(
  /const \[normalizeVolume, setNormalizeVolume\] = useState\(true\);/,
  `const [normalizeVolume, setNormalizeVolume] = useState(() => localStorage.getItem('spotify_normalize_volume') !== 'false');`
);

// Add useEffect to persist
const useEffectCode = `
  useEffect(() => {
    localStorage.setItem('spotify_audio_quality', audioQuality);
    localStorage.setItem('spotify_crossfade', crossfadeSeconds.toString());
    localStorage.setItem('spotify_gapless', gapless.toString());
    localStorage.setItem('spotify_normalize_volume', normalizeVolume.toString());
  }, [audioQuality, crossfadeSeconds, gapless, normalizeVolume]);
`;

code = code.replace(/(const accentOptions = \[)/, `${useEffectCode}\n  $1`);

// Replace icon styles and icons
code = code.replace(/bg-emerald-500\/20 border border-emerald-500\/40 flex items-center justify-center text-emerald-400/, 'bg-neutral-800 border border-neutral-700 flex items-center justify-center text-neutral-300');
code = code.replace(/<Sparkles className="w-5 h-5" \/>/g, '<Crown className="w-5 h-5" />'); // Assuming first one is premium

code = code.replace(/bg-emerald-500\/20 text-emerald-400/g, 'bg-neutral-800 text-neutral-300');
code = code.replace(/bg-indigo-500\/20 text-indigo-400/g, 'bg-neutral-800 text-neutral-300');
code = code.replace(/bg-pink-500\/20 text-pink-400/g, 'bg-neutral-800 text-neutral-300');
code = code.replace(/bg-amber-500\/20 text-amber-400/g, 'bg-neutral-800 text-neutral-300');
code = code.replace(/bg-emerald-500\/20 text-emerald-500/g, 'bg-neutral-800 text-neutral-300');

// Fix Appearance Sparkles -> SunMoon
// Wait, we replaced all Sparkles with Crown.
// We need to properly target the icons. Let's do it with multi_edit_file or manual string replace.

fs.writeFileSync('src/views/SettingsView.tsx', code);
