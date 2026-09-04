const fs = require('fs');
let code = fs.readFileSync('src/components/Common/ClonePlaylistModal.tsx', 'utf8');

code = code.replace(/setError\(res\.error \|\| 'Failed to import playlist\. Make sure it is public\.'\);/, "setError(typeof res.error === 'string' ? res.error : (res.error?.message || 'Failed to import playlist. Make sure it is public.'));");

fs.writeFileSync('src/components/Common/ClonePlaylistModal.tsx', code);
