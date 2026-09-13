const fs = require('fs');
let code = fs.readFileSync('server/services/AudioStreamResolver.ts', 'utf-8');

const replacement = `
          if (item && item.more_info?.encrypted_media_url) {
            const itemTitle = cleanBaseTitle(item.title || '');
            const primaryArt = cleanBaseTitle(item.more_info?.artistMap?.primary_artists?.map((a: any) => a.name).join(', ') || item.primary_artists || '');
            
            console.log("JioSaavn comparing:", { itemTitle, cleanT, primaryArt, cleanA });
`;
code = code.replace("if (item && item.more_info?.encrypted_media_url) {\n            const itemTitle = cleanBaseTitle(item.title || '');\n            const primaryArt = cleanBaseTitle(item.more_info?.artistMap?.primary_artists?.map((a: any) => a.name).join(', ') || item.primary_artists || '');", replacement);

fs.writeFileSync('server/services/AudioStreamResolver.ts', code);
