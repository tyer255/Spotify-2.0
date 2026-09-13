const fetch = require('node-fetch');
(async () => {
  const url = 'https://i.scdn.co/image/ab67616d0000b2739aa819fdf84c78fc1976391d';
  const res = await fetch(url);
  const buffer = await res.buffer();
  console.log("Size:", buffer.length);
})();
