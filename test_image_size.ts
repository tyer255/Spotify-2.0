(async () => {
  const url = 'https://image-cdn-fa.spotifycdn.com/image/ab67706c0000da84f02187297b91d51e0199e07d';
  const res = await fetch(url);
  const buf = await res.arrayBuffer();
  console.log("Size:", buf.byteLength);
})();
