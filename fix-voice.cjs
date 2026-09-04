const fs = require('fs');
let file = fs.readFileSync('src/views/SearchView.tsx', 'utf8');

file = file.replace(
    "{/* Spotify Code Scanner Overlay */}",
    `<VoiceSearchOverlay 
        isListening={isListening} 
        onClose={() => { 
          if (recognitionRef.current) recognitionRef.current.stop(); 
          setIsListening(false); 
        }} 
        transcript={searchQuery || ""} 
      />

      {/* Spotify Code Scanner Overlay */}`
);

fs.writeFileSync('src/views/SearchView.tsx', file);
console.log("Patched VoiceSearchOverlay 2");
