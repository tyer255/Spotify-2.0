const fs = require('fs');

const fixValue = (file) => {
  if (!fs.existsSync(file)) return;
  let code = fs.readFileSync(file, 'utf8');
  
  // Replace value={searchQuery} with value={searchQuery || ''} if not already done
  code = code.replace(/value=\{searchQuery\}/g, "value={searchQuery || ''}");
  
  // Replace value={nameInput} with value={nameInput || ''}
  code = code.replace(/value=\{nameInput\}/g, "value={nameInput || ''}");
  
  // Replace value={songSearchQuery} with value={songSearchQuery || ''}
  code = code.replace(/value=\{songSearchQuery\}/g, "value={songSearchQuery || ''}");

  // Replace value={title} with value={title || ''}
  code = code.replace(/value=\{title\}/g, "value={title || ''}");

  // Replace value={enteredOtp}, email, password
  code = code.replace(/value=\{enteredOtp\}/g, "value={enteredOtp || ''}");
  code = code.replace(/value=\{email\}/g, "value={email || ''}");
  code = code.replace(/value=\{password\}/g, "value={password || ''}");
  
  // Fix player inputs
  code = code.replace(/value=\{Number.isNaN\(currentDisplayTime\) \? 0 : currentDisplayTime\}/g, "value={typeof currentDisplayTime === 'number' && !Number.isNaN(currentDisplayTime) ? currentDisplayTime : 0}");
  code = code.replace(/value=\{Number.isNaN\(currentPos\) \? 0 : currentPos\}/g, "value={typeof currentPos === 'number' && !Number.isNaN(currentPos) ? currentPos : 0}");
  code = code.replace(/value=\{isMuted \? 0 : \(Number.isNaN\(volume\) \? 1 : volume\)\}/g, "value={isMuted ? 0 : (typeof volume === 'number' && !Number.isNaN(volume) ? volume : 1)}");
  
  // Settings crossfade
  code = code.replace(/value=\{Number.isNaN\(crossfadeSeconds\) \? 3 : crossfadeSeconds\}/g, "value={typeof crossfadeSeconds === 'number' && !Number.isNaN(crossfadeSeconds) ? crossfadeSeconds : 3}");
  
  fs.writeFileSync(file, code);
};

fixValue('src/views/SearchView.tsx');
fixValue('src/views/ProfileView.tsx');
fixValue('src/views/PlaylistView.tsx');
fixValue('src/views/LibraryView.tsx');
fixValue('src/views/SettingsView.tsx');
fixValue('src/components/Common/CreatePlaylistModal.tsx');
fixValue('src/components/Auth/AuthModal.tsx');
fixValue('src/components/Player/FullscreenPlayer.tsx');
fixValue('src/components/Player/MiniPlayer.tsx');
fixValue('src/components/Player/LyricsDrawer.tsx');

