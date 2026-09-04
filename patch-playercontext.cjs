const fs = require('fs');
let code = fs.readFileSync('src/context/PlayerContext.tsx', 'utf8');

// Add JioTune previews to the blacklist so we always get full songs via YouTube fallback
code = code.replace(/if \(url\.includes\('cdns-preview'\) \|\| url\.includes\('p\.scdn\.co'\) \|\| url\.includes\('preview_url'\) \|\| url\.includes\('\/preview'\)\) return false;/g, "if (url.includes('cdns-preview') || url.includes('p.scdn.co') || url.includes('preview_url') || url.includes('/preview') || url.includes('jiotunepreview')) return false;");

fs.writeFileSync('src/context/PlayerContext.tsx', code);
console.log('Patched PlayerContext to fallback to full songs');
