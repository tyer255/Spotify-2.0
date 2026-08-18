const fs = require('fs');
let code = fs.readFileSync('src/context/PlayerContext.tsx', 'utf8');

if (!code.includes('crossfadeSeconds')) {
  // Add to PlayerContextType
  code = code.replace(
    /interface PlayerContextType extends PlaybackState \{/,
    `interface PlayerContextType extends PlaybackState {\n  audioQuality: 'normal' | 'high' | 'very_high';\n  setAudioQuality: (quality: 'normal' | 'high' | 'very_high') => void;\n  crossfadeSeconds: number;\n  setCrossfadeSeconds: (sec: number) => void;\n  gapless: boolean;\n  setGapless: (gapless: boolean) => void;\n  normalizeVolume: boolean;\n  setNormalizeVolume: (normalize: boolean) => void;`
  );

  // Add state to PlayerProvider
  const stateCode = `
  const [audioQuality, setAudioQualityState] = useState<'normal' | 'high' | 'very_high'>(() => (localStorage.getItem('spotify_audio_quality') as any) || 'very_high');
  const [crossfadeSeconds, setCrossfadeSecondsState] = useState(() => parseInt(localStorage.getItem('spotify_crossfade') || '3', 10));
  const [gapless, setGaplessState] = useState(() => localStorage.getItem('spotify_gapless') !== 'false');
  const [normalizeVolume, setNormalizeVolumeState] = useState(() => localStorage.getItem('spotify_normalize_volume') !== 'false');

  const setAudioQuality = (val: 'normal' | 'high' | 'very_high') => {
    setAudioQualityState(val);
    localStorage.setItem('spotify_audio_quality', val);
  };
  const setCrossfadeSeconds = (val: number) => {
    setCrossfadeSecondsState(val);
    localStorage.setItem('spotify_crossfade', val.toString());
  };
  const setGapless = (val: boolean) => {
    setGaplessState(val);
    localStorage.setItem('spotify_gapless', val.toString());
  };
  const setNormalizeVolume = (val: boolean) => {
    setNormalizeVolumeState(val);
    localStorage.setItem('spotify_normalize_volume', val.toString());
  };
  `;

  code = code.replace(
    /const \[volume, setVolumeState\] = useState<number>\(0.85\);/,
    `const [volume, setVolumeState] = useState<number>(0.85);\n${stateCode}`
  );

  // Add to return value
  code = code.replace(
    /return \(\n\s*<PlayerContext\.Provider\n\s*value=\{\{/,
    `return (\n    <PlayerContext.Provider\n      value={{\n        audioQuality, setAudioQuality, crossfadeSeconds, setCrossfadeSeconds, gapless, setGapless, normalizeVolume, setNormalizeVolume,`
  );

  fs.writeFileSync('src/context/PlayerContext.tsx', code);
}
