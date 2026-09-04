const fs = require('fs');
const file = 'src/context/PlayerContext.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(`            onPause={() => {
              setIsPlaying(false);
            }}`, "");

// Change the container size and opacity to be safe
code = code.replace(
`          style={{
            position: 'fixed',
            bottom: 0,
            right: 0,
            width: '200px',
            height: '200px',
            opacity: 0.001,
            pointerEvents: 'none',
            zIndex: -1,
          }}`,
`          style={{
            position: 'fixed',
            bottom: '-500px',
            right: '-500px',
            width: '300px',
            height: '300px',
            opacity: 1,
            pointerEvents: 'none',
            zIndex: -1,
          }}`
);

fs.writeFileSync(file, code);
