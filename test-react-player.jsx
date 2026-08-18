import React from 'react';
import ReactPlayer from 'react-player';
import { renderToString } from 'react-dom/server';

const App = () => (
  <ReactPlayer url="https://youtube.com/watch?v=q8icF9_Rpls" />
);

console.log(renderToString(<App />));
