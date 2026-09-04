const fs = require('fs');
let code = fs.readFileSync('src/context/UserContext.tsx', 'utf8');

// Update playlist creation to ensure auth.currentUser.uid is used if available, otherwise profile?.id
code = code.replace(
  /userId: profile\?\.id \|\| 'guest-user',/,
  "userId: auth.currentUser ? auth.currentUser.uid : (profile?.id || 'guest-user'),"
);

// In the migration logic, update the playlist's userId to user.uid
code = code.replace(
  /const plRef = doc\(db, 'playlists', pl\.id\);\n\s*batch\.set\(plRef, pl, \{ merge: true \}\);/g,
  `const plRef = doc(db, 'playlists', pl.id);
                    pl.userId = user.uid; // FIX: Ensure ownership matches the authenticated user
                    batch.set(plRef, pl, { merge: true });`
);

fs.writeFileSync('src/context/UserContext.tsx', code);
