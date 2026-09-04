const fs = require('fs');
let code = fs.readFileSync('src/context/UserContext.tsx', 'utf8');

// Restore setLoading(false) in loadProfile
code = code.replace(
  /console\.warn\('Failed to load profile:', e\);\n\s*\}/g,
  `console.warn('Failed to load profile:', e);
    } finally {
      if (!auth.currentUser) setLoading(false);
    }`
);

// We need to rewrite onAuthStateChanged
code = code.replace(
  /if \(user\) {\n\s*const userRef = doc\(db, 'users', user.uid\);/g,
  `if (user) {
        setLoading(true); // Wait for firebase fetch
        const userRef = doc(db, 'users', user.uid);`
);

code = code.replace(
  /unsubs\.push\(unsubUser, unsubLiked, unsubFollowed, unsubPlaylists, unsubDownloads\);\n\s*\}/g,
  `unsubs.push(unsubUser, unsubLiked, unsubFollowed, unsubPlaylists, unsubDownloads);
        setLoading(false);
      }`
);

// We should remove the hardcoded setLoading(false) we added previously in onAuthStateChanged
code = code.replace(
  /setLoading\(false\); \/\/ Firebase auth state resolved\n\s*\}\);\n\s*return \(\) => \{/g,
  `});
    return () => {`
);

fs.writeFileSync('src/context/UserContext.tsx', code);
