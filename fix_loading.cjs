const fs = require('fs');
let code = fs.readFileSync('src/context/UserContext.tsx', 'utf8');

// 1. Remove setLoading(false) from loadProfile
code = code.replace(
  /console\.warn\('Failed to load profile:', e\);\n\s*\} finally \{\n\s*setLoading\(false\);\n\s*\}/g,
  `console.warn('Failed to load profile:', e);
    }`
);

// 2. Add setLoading(false) to the end of onAuthStateChanged
code = code.replace(
  /loadProfile\(\); \/\/ Load guest profile\n\s*\}\n\s*\}\);\n\s*return \(\) =>/g,
  `loadProfile(); // Load guest profile
      }
      setLoading(false); // Firebase auth state resolved
    });
    return () =>`
);

// Wait, is there any other place?
fs.writeFileSync('src/context/UserContext.tsx', code);
