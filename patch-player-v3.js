import fs from 'fs';
let code = fs.readFileSync('src/context/PlayerContext.tsx', 'utf8');

// replace getCurrentTime()
code = code.replace(/reactPlayerRef\.current\.getCurrentTime\(\)/g, "reactPlayerRef.current.currentTime");

// replace seekTo
code = code.replace(/reactPlayerRef\.current\.seekTo\(clamped, 'seconds'\);/g, "reactPlayerRef.current.currentTime = clamped;");

// replace props
code = code.replace(/url={youtubeUrl}/g, "src={youtubeUrl}");
code = code.replace(/onProgress={\({ playedSeconds, loadedSeconds }: any\) => {[\s\S]*?}}/g, `onTimeUpdate={(e: any) => {
            if (e && e.currentTarget) {
              setPosition(e.currentTarget.currentTime);
              // setBufferedPosition not easily available on standard event, ignore or estimate
            }
          }}`);
code = code.replace(/onDuration={\(dur\) => {[\s\S]*?}}/g, `onDurationChange={(e: any) => {
            if (e && e.currentTarget && e.currentTarget.duration > 5) {
              setDuration(e.currentTarget.duration);
            }
          }}`);
code = code.replace(/onBuffer={\(\) => setIsLoading\(true\)}/g, "onWaiting={() => setIsLoading(true)}");
code = code.replace(/onBufferEnd={\(\) => setIsLoading\(false\)}/g, "onPlaying={() => setIsLoading(false)}");

fs.writeFileSync('src/context/PlayerContext.tsx', code);
console.log("Patched v3 successfully");
