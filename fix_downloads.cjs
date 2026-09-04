const fs = require('fs');
let code = fs.readFileSync('src/context/UserContext.tsx', 'utf8');

// Modify toggleDownloadTrack to check for physical file
code = code.replace(
  /const toggleDownloadTrack = async \(track: Track\): Promise<boolean> => \{\n\s*const wasDownloaded = downloadedTrackIds\.has\(track\.id\);/,
  `const toggleDownloadTrack = async (track: Track): Promise<boolean> => {
    let wasDownloaded = downloadedTrackIds.has(track.id);
    let hasPhysicalBlob = false;
    try {
      const blob = await offlineStorage.getOfflineAudioBlob(track.id);
      hasPhysicalBlob = !!(blob && blob.size > 0);
    } catch(e) {}
    
    // If it's in Firebase but missing locally, treat as NOT downloaded so clicking will re-download the physical file
    if (wasDownloaded && !hasPhysicalBlob) {
      wasDownloaded = false;
    }
`
);

fs.writeFileSync('src/context/UserContext.tsx', code);
