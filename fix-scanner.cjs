const fs = require('fs');
let file = fs.readFileSync('src/components/Scanner/SpotifyCodeScanner.tsx', 'utf8');

file = file.replace(
  'export function SpotifyCodeScanner({ isOpen, onClose }: ScannerProps) {',
  'export function SpotifyCodeScanner({ isOpen, onCodeScanned, onClose }: ScannerProps) {'
);

fs.writeFileSync('src/components/Scanner/SpotifyCodeScanner.tsx', file);
