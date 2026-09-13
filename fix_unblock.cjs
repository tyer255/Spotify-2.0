const fs = require('fs');
let code = fs.readFileSync('server/services/AudioStreamResolver.ts', 'utf8');

// JioSaavn
code = code.replace(/\/\/ STRICT IDENTITY VERIFICATION BEFORE RETURNING[\s\S]*?if \(titleMatch && artistMatch\) \{[\s\S]*?return streamObj;[\s\S]*?\} else \{[\s\S]*?console\.warn\(\`\[AudioStreamResolver\] Rejecting JioSaavn[\s\S]*?\}[\s\S]*?(?=\} catch \(e\))/g, 'return streamObj;\n          ');

// YouTube
code = code.replace(/\/\/ STRICT IDENTITY VERIFICATION BEFORE RETURNING[\s\S]*?if \(titleMatch && artistMatch\) \{[\s\S]*?return streamObj;[\s\S]*?\} else \{[\s\S]*?console\.warn\(\`\[AudioStreamResolver\] Rejecting YouTube[\s\S]*?\}[\s\S]*?(?=\})/g, 'return streamObj;\n            ');

// Audius
code = code.replace(/const resTitleWords = streamObj\.resolvedTitle[\s\S]*?if \(titleMatch && artistMatch\) \{[\s\S]*?return streamObj;[\s\S]*?\} else \{[\s\S]*?console\.warn\(\`\[AudioStreamResolver\] Rejecting Audius[\s\S]*?\}/g, 'return streamObj;');

fs.writeFileSync('server/services/AudioStreamResolver.ts', code);
