const fs = require('fs');
let code = fs.readFileSync('src/context/UserContext.tsx', 'utf8');

// Replace `const [loading, setLoading] = useState<boolean>(true);`
// with `const [loading, setLoading] = useState<boolean>(true); const [authResolved, setAuthResolved] = useState<boolean>(false);`
code = code.replace(
  /const \[loading, setLoading\] = useState<boolean>\(true\);/,
  `const [loading, setLoading] = useState<boolean>(true);
  const [authResolved, setAuthResolved] = useState<boolean>(false);`
);

// In onAuthStateChanged:
code = code.replace(
  /if \(user\) {\n\s*setLoading\(true\); \/\/ Wait for firebase fetch/g,
  `if (user) {
        setLoading(true); // Wait for firebase fetch`
);

code = code.replace(
  /unsubs\.push\(unsubUser, unsubLiked, unsubFollowed, unsubPlaylists, unsubDownloads\);\n\s*setLoading\(false\);\n\s*\} else \{/g,
  `unsubs.push(unsubUser, unsubLiked, unsubFollowed, unsubPlaylists, unsubDownloads);
        setLoading(false);
        setAuthResolved(true);
      } else {`
);

// Logged out case inside onAuthStateChanged
code = code.replace(
  /loadProfile\(\); \/\/ Load guest profile\n\s*\}/g,
  `loadProfile(); // Load guest profile
        setAuthResolved(true);
      }`
);

// Make sure loadProfile never sets loading(false) if auth is not resolved
code = code.replace(
  /if \(!auth\.currentUser\) setLoading\(false\);/g,
  `// Do not set loading to false here, wait for auth to resolve
      // Or just do nothing, auth listener handles it.`
);

// We need to export authResolved? No, just use `loading || !authResolved`
code = code.replace(
  /return \(\n\s*<UserContext\.Provider/g,
  `if (!authResolved) return null; // or a loading spinner
  
  return (
    <UserContext.Provider`
);

fs.writeFileSync('src/context/UserContext.tsx', code);
