import fs from 'fs';
let code = fs.readFileSync('server/services/AudioStreamResolver.ts', 'utf8');

code = code.replace(/url: \`youtube:\$\{bestVideo.videoId\}\`,/g, "url: `/api/stream/youtube/${bestVideo.videoId}`,");
code = code.replace(/mimeType: 'video\/youtube',/g, "mimeType: 'audio/mpeg',");
code = code.replace(/source: \`YouTube IFrame \(\$\{bestVideo\.title\}\)\`,/g, "source: `YouTube Proxy (${bestVideo.title})`,");

fs.writeFileSync('server/services/AudioStreamResolver.ts', code);
console.log("Patched resolver proxy successfully");
