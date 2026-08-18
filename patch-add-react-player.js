import fs from 'fs';
let code = fs.readFileSync('src/context/PlayerContext.tsx', 'utf8');

if (!code.includes("import ReactPlayer")) {
  code = code.replace("import React,", "import ReactPlayer from 'react-player';\nimport React,");
}

code = code.replace(/<audio\s+ref=\{audioRef\}[\s\S]*?\/>/, `$&
      {youtubeUrl && (
        <ReactPlayer
          ref={reactPlayerRef}
          url={youtubeUrl}
          playing={isPlaying}
          volume={isMuted ? 0 : volume}
          playbackRate={playbackRate}
          width="1px"
          height="1px"
          playsInline
          config={{ youtube: { playerVars: { origin: typeof window !== 'undefined' ? window.location.origin : '' } } as any }}
          style={{ position: 'absolute', top: '-9999px', left: '-9999px', opacity: 0, pointerEvents: 'none' }}
          onProgress={(state: any) => {
            if (state && typeof state.playedSeconds === 'number') {
              setPosition(state.playedSeconds);
            }
          }}
          onDuration={(dur: number) => {
            if (dur > 5) setDuration(dur);
          }}
          onEnded={() => {
            handleTrackEnd();
          }}
          onBuffer={() => setIsLoading(true)}
          onBufferEnd={() => setIsLoading(false)}
          onError={() => {
            setError('Playback unavailable for this track.');
            setIsPlaying(false);
          }}
        />
      )}`);

fs.writeFileSync('src/context/PlayerContext.tsx', code);
console.log("Added ReactPlayer back successfully");
