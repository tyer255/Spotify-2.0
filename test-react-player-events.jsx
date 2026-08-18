import React from 'react';
import ReactPlayer from 'react-player';
import { renderToString } from 'react-dom/server';

const App = () => (
  <ReactPlayer url="https://youtube.com/watch?v=q8icF9_Rpls" 
    onDurationChange={(d) => console.log('dur', d)}
    onTimeUpdate={(e) => console.log('time', e)}
    onWaiting={() => console.log('waiting')}
    onPlaying={() => console.log('playing')}
  />
);
console.log(renderToString(<App />));
