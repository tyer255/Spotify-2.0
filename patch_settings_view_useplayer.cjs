const fs = require('fs');
let code = fs.readFileSync('src/views/SettingsView.tsx', 'utf8');

if (!code.includes('usePlayer')) {
  code = code.replace(/import { useUser } from '\.\.\/context\/UserContext';/, "import { useUser } from '../context/UserContext';\nimport { usePlayer } from '../context/PlayerContext';");
}

code = code.replace(
  /const { showToast, downloadedTracksList, clearAllDownloads } = useUser\(\);/,
  `const { showToast, downloadedTracksList, clearAllDownloads } = useUser();\n  const { audioQuality, setAudioQuality, crossfadeSeconds, setCrossfadeSeconds, gapless, setGapless, normalizeVolume, setNormalizeVolume } = usePlayer();`
);

// Remove local states
code = code.replace(/const \[audioQuality, setAudioQuality\] = useState.*?;\n/, '');
code = code.replace(/const \[crossfadeSeconds, setCrossfadeSeconds\] = useState.*?;\n/, '');
code = code.replace(/const \[gapless, setGapless\] = useState.*?;\n/, '');
code = code.replace(/const \[normalizeVolume, setNormalizeVolume\] = useState.*?;\n/, '');

// Remove local useEffect
code = code.replace(/useEffect\(\(\) => \{\n\s*localStorage\.setItem\('spotify_audio_quality'[\s\S]*?\}, \[audioQuality, crossfadeSeconds, gapless, normalizeVolume\]\);\n/, '');

fs.writeFileSync('src/views/SettingsView.tsx', code);
