const fs = require('fs');
let code = fs.readFileSync('server/services/AudioStreamResolver.ts', 'utf-8');

code = code.replace(/url: \`\/api\/stream\/youtube\/\$\{vid\.videoId\}\`,\n\s*fallbackUrls: \[\`\/api\/stream\/youtube\/\$\{vid\.videoId\}\`\],\n\s*duration: dur,\n\s*source: \`YouTube \(\$\{vid\.title\}\)\`,\n\s*bitrate: '320kbps',\n\s*mimeType: 'audio\/mpeg',\n\s*isDirectAudio: true,\n\s*isMediaDescriptor: false,\n\s*descriptorType: 'direct',\n\s*mediaUri: \`\/api\/stream\/youtube\/\$\{vid\.videoId\}\`,/,
`url: \`youtube:\${vid.videoId}\`,
            fallbackUrls: [\`youtube:\${vid.videoId}\`],
            duration: dur,
            source: \`YouTube (\${vid.title})\`,
            bitrate: '320kbps',
            mimeType: 'video/youtube',
            isDirectAudio: false,
            isMediaDescriptor: true,
            descriptorType: 'youtube',
            mediaUri: \`youtube:\${vid.videoId}\`,`);

fs.writeFileSync('server/services/AudioStreamResolver.ts', code);
