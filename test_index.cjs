const fs = require('fs');
let code = fs.readFileSync('src/components/Player/TabletRightPlayer.tsx', 'utf8');

const oldLines = `              {lyricsData && lyricsData.lines && lyricsData.lines.length > 0 ? (
                lyricsData.lines.slice(displayIndex, displayIndex + 4).map((line, i) => {`;

const newLines = `              {lyricsData && lyricsData.lines && lyricsData.lines.length > 0 ? (
                lyricsData.lines.slice(Math.max(0, displayIndex), Math.max(0, displayIndex) + 4).map((line, i) => {`;

code = code.replace(oldLines, newLines);
fs.writeFileSync('src/components/Player/TabletRightPlayer.tsx', code);
