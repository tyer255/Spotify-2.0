import fs from 'fs';
let code = fs.readFileSync('src/context/PlayerContext.tsx', 'utf8');

code = code.replace(/audio\.play\(\)\.catch\(\(\) => {/g, `audio.play().catch((err: any) => {
          if (err.name === 'AbortError') return;`);

code = code.replace(/await audio\.play\(\);/g, `try {
          await audio.play();
        } catch (err: any) {
          if (err.name !== 'AbortError') throw err;
        }`);

fs.writeFileSync('src/context/PlayerContext.tsx', code);
