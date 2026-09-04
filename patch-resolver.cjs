const fs = require('fs');
let code = fs.readFileSync('server/services/AudioStreamResolver.ts', 'utf8');

// 1. Update cleanBaseTitle
const cleanBaseStart = code.indexOf('export function cleanBaseTitle');
const cleanBaseEnd = code.indexOf('export function isArtistMatch');
if (cleanBaseStart !== -1 && cleanBaseEnd !== -1) {
  const newCleanBase = `export function cleanBaseTitle(title: string): string {
  if (!title) return '';
  return stripDiacritics(title)
    .replace(/\\s*[\\(\\[][^\\)\\]]*[\\)\\]]/gi, '')
    .replace(/[^\\w\\s\\u0900-\\u097F\\u0A00-\\u0A7F\\u0B80-\\u0BFF\\u0C00-\\u0C7F\\u0D00-\\u0D7F]/g, ' ')
    .replace(/\\s+/g, ' ')
    .trim()
    .toLowerCase();
}

`;
  code = code.substring(0, cleanBaseStart) + newCleanBase + code.substring(cleanBaseEnd);
}

// 2. Add 'lyrics' to PLATFORM_NOISE_TOKENS if not there (it's already there)
// But let's make sure 'lyric' and 'lyrics' are handled.

// 3. Update ytQueries
const ytQueriesStart = code.indexOf('const ytQueries = [');
const ytQueriesEnd = code.indexOf('].filter((q) => q && q.length > 1);', ytQueriesStart);
if (ytQueriesStart !== -1 && ytQueriesEnd !== -1) {
  const newYtQueries = `const ytQueries = [
      \`\${title} \${artist} lyrics\`.trim(),
      \`\${cleanT} \${artist} lyrics\`.trim(),
      \`\${title} \${artist} audio\`.trim(),
      \`\${title} \${artist} official audio\`.trim(),
      \`\${title} \${artist}\`.trim(),
      \`\${artist} - \${title}\`.trim(),
      cleanT !== title.toLowerCase() ? \`\${cleanT} \${artist}\`.trim() : '',
    `;
  code = code.substring(0, ytQueriesStart) + newYtQueries + code.substring(ytQueriesEnd);
}

fs.writeFileSync('server/services/AudioStreamResolver.ts', code);
console.log("Patched AudioStreamResolver");
