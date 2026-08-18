import fs from 'fs';
let code = fs.readFileSync('src/context/PlayerContext.tsx', 'utf8');

code = code.replace(/if \(audio\.duration && !isNaN\(audio\.duration\) && isFinite\(audio\.duration\) && audio\.duration > 5\) {[\s\S]*?setDuration\(audio\.duration\);\n\s*}/, `const actualDur = audio.duration;
        const trackDur = currentTrackRef.current?.duration;
        if (actualDur >= 29 && actualDur <= 31 && trackDur && trackDur > 40) {
          setDuration(trackDur);
        } else if (actualDur && !isNaN(actualDur) && isFinite(actualDur) && actualDur > 5) {
          setDuration(actualDur);
        } else if (trackDur && trackDur > 5) {
          setDuration(trackDur);
        }`);

fs.writeFileSync('src/context/PlayerContext.tsx', code);
console.log("Patched duration logic successfully");
