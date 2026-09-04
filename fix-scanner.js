const fs = require('fs');
let file = fs.readFileSync('src/components/Scanner/SpotifyCodeScanner.tsx', 'utf8');

file = file.replace('export function SpotifyCodeScanner({ onClose }: ScannerProps) {', 'export function SpotifyCodeScanner({ isOpen, onClose }: ScannerProps) {\n  if (!isOpen) return null;');

file = file.replace('useEffect(() => {', 'useEffect(() => {\n    if (!isOpen) return;');

fs.writeFileSync('src/components/Scanner/SpotifyCodeScanner.tsx', file);
