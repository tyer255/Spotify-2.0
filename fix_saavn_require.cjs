const fs = require('fs');
let code = fs.readFileSync('server/services/AudioStreamResolver.ts', 'utf-8');

code = code.replace(
  'function decryptSaavnMediaUrl(encrypted: string): { primaryUrl: string; fallbackUrls: string[] } | null {',
  'async function decryptSaavnMediaUrl(encrypted: string): Promise<{ primaryUrl: string; fallbackUrls: string[] } | null> {'
);
code = code.replace(
  "const CryptoJS = require('crypto-js');",
  "const CryptoJS = (await import('crypto-js')).default || await import('crypto-js');"
);
code = code.replace(
  'const streamResult = decryptSaavnMediaUrl(item.more_info.encrypted_media_url);',
  'const streamResult = await decryptSaavnMediaUrl(item.more_info.encrypted_media_url);'
);

// Also let's fix the cleanBaseTitle parens issue here for "Safar (From ...)"
code = code.replace(
  'function cleanBaseTitle(title: string): string {\n  return (title || \'\').toLowerCase().replace(/[^a-z0-9\\s]/g, \'\').trim();\n}',
  'function cleanBaseTitle(title: string): string {\n  const noParens = (title || \'\').replace(/\\([^)]*\\)/g, \'\').replace(/\\[[^\\]]*\\]/g, \'\');\n  return noParens.toLowerCase().replace(/[^a-z0-9\\s]/g, \'\').trim();\n}'
);

// We need to also clean up the console.log we added earlier
code = code.replace(/console\.log\("JioSaavn comparing:".*?\n/, '');

fs.writeFileSync('server/services/AudioStreamResolver.ts', code);
