const fs = require('fs');
const path = './src/components/Player/TabletRightPlayer.tsx';
let content = fs.readFileSync(path, 'utf8');

// Add new imports
if (!content.includes('MonitorSpeaker')) {
  content = content.replace("VolumeX\n}", "MonitorSpeaker,\n  Share2,\n  ListMusic,\n}");
}

// Replace Volume & Extras section
const startStr = "{/* Volume & Extras */}";
const endStr = "<div className=\"flex flex-col gap-4 mt-2 w-full\">";
const startIndex = content.indexOf(startStr);
const endIndex = content.indexOf(endStr);

if (startIndex !== -1 && endIndex !== -1) {
  const newSection = `{/* Device, Share, Queue */}
        <div className="flex items-center justify-between w-full px-1 mt-1">
          <button className="text-neutral-400 hover:text-white transition-colors">
            <MonitorSpeaker className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-6">
            <button className="text-neutral-400 hover:text-white transition-colors">
              <Share2 className="w-5 h-5" />
            </button>
            <button className="text-neutral-400 hover:text-white transition-colors">
              <ListMusic className="w-5 h-5" />
            </button>
          </div>
        </div>

        `;
  content = content.substring(0, startIndex) + newSection + content.substring(endIndex);
}

// Update Lyrics preview background
const oldBg = "className=\"bg-[#7e123c] rounded-2xl p-6 flex flex-col h-auto min-h-[300px] cursor-pointer hover:bg-opacity-80 transition-colors border border-white/5 relative overflow-hidden\"";
const oldBg2 = "className=\"bg-[#7e123c] rounded-2xl p-6 flex flex-col h-auto min-h-[300px] cursor-pointer hover:bg-[#8b1442] transition-colors border border-white/5 relative overflow-hidden\"";

const newBg = "className=\"rounded-2xl p-6 flex flex-col h-auto min-h-[300px] cursor-pointer transition-colors border border-white/5 relative overflow-hidden\"\n            style={{ backgroundColor: dominantColor !== '#121212' ? dominantColor : '#7e123c' }}";

if (content.includes(oldBg2)) {
  content = content.replace(oldBg2, newBg);
} else if (content.includes(oldBg)) {
  content = content.replace(oldBg, newBg);
}

// Update lyrics box layout and typography to match screenshot
// The screenshot shows text aligned left, very bold, maybe even larger, inside a padded box.
const oldLyricsText = "className=\"flex flex-col flex-1 space-y-4 justify-center\"";
const newLyricsText = "className=\"flex flex-col flex-1 space-y-4 justify-start mt-2\"";
content = content.replace(oldLyricsText, newLyricsText);

// Reduce gap around controls
// "gap-6" might be around the progress bar or controls
content = content.replace("<div className=\"flex flex-col h-full gap-6\">", "<div className=\"flex flex-col h-full gap-4\">");
content = content.replace("<div className=\"w-full space-y-1.5 group\">", "<div className=\"w-full space-y-1.5 group mt-2\">");

fs.writeFileSync(path, content);
