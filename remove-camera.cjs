const fs = require('fs');
let file = fs.readFileSync('src/views/SearchView.tsx', 'utf8');

// 1. Remove SpotifyCodeScanner import
file = file.replace("import { SpotifyCodeScanner } from '../components/Scanner/SpotifyCodeScanner';\n", "");

// 2. Remove Camera icon import
file = file.replace("  Camera,\n", "");

// 3. Remove isScannerOpen state
file = file.replace("  const [isScannerOpen, setIsScannerOpen] = useState(false);\n", "");

// 4. Remove Camera Scanner button in header
const oldHeaderCamera = `            {/* Camera Scanner Icon on right */}
            <button
              onClick={() => {
                setIsScannerOpen(true);
              }}
              className="p-1.5 text-white hover:text-neutral-300 transition-colors cursor-pointer"
              title="Search with camera"
            >
              <Camera className="w-6 h-6 sm:w-7 sm:h-7 stroke-[2]" />
            </button>`;

file = file.replace(oldHeaderCamera, "");

// 5. Update VoiceSearchOverlay and remove SpotifyCodeScanner overlay
const oldOverlays = `<VoiceSearchOverlay 
        isListening={isListening} 
        onClose={() => { 
          if (recognitionRef.current) recognitionRef.current.stop(); 
          setIsListening(false); 
        }} 
        transcript={searchQuery || ""} 
      />

      {/* Spotify Code Scanner Overlay */}
      <SpotifyCodeScanner
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onCodeScanned={(query, resolvedTrack) => {
          if (resolvedTrack) {
            showToast(\`Found: \${resolvedTrack.title} - \${resolvedTrack.artist}\`);
            setIsSearchFocused(true);
            const searchQuery = \`\${resolvedTrack.title} \${resolvedTrack.artist}\`;
            if (onSearchChange) onSearchChange(searchQuery);
            executeFullSearch(searchQuery);
          } else if (query) {
            showToast(\`Scanned: \${query}\`);
            setIsSearchFocused(true);
            if (onSearchChange) onSearchChange(query);
            executeFullSearch(query);
          }
        }}
      />`;

const newOverlays = `<VoiceSearchOverlay 
        isListening={isListening} 
        onClose={() => { 
          if (recognitionRef.current) recognitionRef.current.stop(); 
          setIsListening(false); 
        }} 
        transcript={searchQuery || ""}
        onToggleListening={toggleVoiceSearch}
        onSelectSuggestion={(sugg) => {
          if (recognitionRef.current) recognitionRef.current.stop();
          setIsListening(false);
          if (onSearchChange) onSearchChange(sugg);
          submitSearch(sugg);
        }}
      />`;

file = file.replace(oldOverlays, newOverlays);

fs.writeFileSync('src/views/SearchView.tsx', file);
console.log("Successfully removed Camera feature and updated VoiceSearchOverlay");
