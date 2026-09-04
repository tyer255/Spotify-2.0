const fs = require('fs');
let code = fs.readFileSync('src/utils/personalizedRecommendations.ts', 'utf8');

// Remove track fallback for artist image
code = code.replace(
  /if \(!cat\.image && \(track\.images\?\.large \|\| track\.images\?\.medium\)\) \{\s*cat\.image = track\.images\.large \|\| track\.images\.medium \|\| '';\s*\}/g,
  ''
);

fs.writeFileSync('src/utils/personalizedRecommendations.ts', code);
