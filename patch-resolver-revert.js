import fs from 'fs';
let code = fs.readFileSync('server/services/AudioStreamResolver.ts', 'utf8');

code = code.replace(/url: \`\/api\/stream\/youtube\/\$\{bestVideo\.videoId\}\`,/g, "url: `youtube:${bestVideo.videoId}`,");
code = code.replace(/mimeType: 'audio\/mpeg',/g, "mimeType: 'video/youtube',");
code = code.replace(/source: \`YouTube Proxy \(\$\{bestVideo\.title\}\)\`,/g, "source: `YouTube IFrame (${bestVideo.title})`,");

fs.writeFileSync('server/services/AudioStreamResolver.ts', code);
console.log("Patched resolver back to youtube iframe");
