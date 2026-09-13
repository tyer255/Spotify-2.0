const fs = require('fs');
let code = fs.readFileSync('server/services/AudioStreamResolver.ts', 'utf-8');

code = code.replace(/url: \`youtube:\$\{vid\.videoId\}\`,\n\s*fallbackUrls: \[\`youtube:\$\{vid\.videoId\}\`\],\n\s*duration: dur,\n\s*source: \`YouTube \(\$\{vid\.title\}\)\`,\n\s*bitrate: '320kbps',\n\s*mimeType: 'video\/youtube',\n\s*isDirectAudio: false,\n\s*isMediaDescriptor: true,\n\s*descriptorType: 'youtube',\n\s*mediaUri: \`youtube:\$\{vid\.videoId\}\`,/,
`url: \`/api/stream/youtube/\${vid.videoId}\`,
            fallbackUrls: [\`/api/stream/youtube/\${vid.videoId}\`],
            duration: dur,
            source: \`YouTube (\${vid.title})\`,
            bitrate: '320kbps',
            mimeType: 'audio/mpeg',
            isDirectAudio: true,
            isMediaDescriptor: false,
            descriptorType: 'direct',
            mediaUri: \`/api/stream/youtube/\${vid.videoId}\`,`);

fs.writeFileSync('server/services/AudioStreamResolver.ts', code);
