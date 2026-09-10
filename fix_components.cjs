const fs = require('fs');
const files = [
  'src/components/Player/AmbientMode.tsx',
  'src/components/Player/MiniPlayer.tsx',
  'src/components/Player/FullscreenPlayer.tsx',
  'src/components/Player/LyricsDrawer.tsx'
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace("import { usePlayer } from '../../context/PlayerContext';", "import { usePlayer } from '../../context/PlayerContext';\nimport { usePlayerProgressStore } from '../../store/playerProgressStore';");
  
  if (file.includes('AmbientMode.tsx')) {
    content = content.replace("    position,\n    duration,\n", "");
    content = content.replace("    activeLyricIndex,\n", "");
    content = content.replace("  } = usePlayer();", "  } = usePlayer();\n  const { position, duration, activeLyricIndex } = usePlayerProgressStore();");
  } else if (file.includes('MiniPlayer.tsx')) {
    content = content.replace("    position,\n    duration,\n", "");
    content = content.replace("  } = usePlayer();", "  } = usePlayer();\n  const { position, duration } = usePlayerProgressStore();");
  } else if (file.includes('FullscreenPlayer.tsx')) {
    content = content.replace("    position,\n    duration,\n", "");
    content = content.replace("    activeLyricIndex,\n", "");
    content = content.replace("  } = usePlayer();", "  } = usePlayer();\n  const { position, duration, activeLyricIndex } = usePlayerProgressStore();");
  } else if (file.includes('LyricsDrawer.tsx')) {
    content = content.replace("    activeLyricIndex,\n", "");
    content = content.replace("    position,\n    duration,\n", "");
    content = content.replace("  } = usePlayer();", "  } = usePlayer();\n  const { position, duration, activeLyricIndex } = usePlayerProgressStore();");
  }

  fs.writeFileSync(file, content);
  console.log('Fixed', file);
});
