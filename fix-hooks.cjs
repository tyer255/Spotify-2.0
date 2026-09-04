const fs = require('fs');
let file = fs.readFileSync('src/components/Scanner/SpotifyCodeScanner.tsx', 'utf8');

file = file.replace('export function SpotifyCodeScanner({ isOpen, onClose }: ScannerProps) {\n  if (!isOpen) return null;', 'export function SpotifyCodeScanner({ isOpen, onClose }: ScannerProps) {');

const oldReturn = `  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center font-sans">`;

const newReturn = `  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center font-sans">`;

file = file.replace(oldReturn, newReturn);
fs.writeFileSync('src/components/Scanner/SpotifyCodeScanner.tsx', file);
