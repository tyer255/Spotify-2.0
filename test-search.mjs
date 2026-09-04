import fetch from 'node-fetch';
async function test() {
  const res = await fetch('http://127.0.0.1:3000/api/search?q=4cOdK2wGLETKBW3PvgPWqT');
  const data = await res.json();
  console.log(JSON.stringify(data.data.songs.slice(0, 3), null, 2));
}
test();
