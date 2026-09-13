const fetch = require('node-fetch');

(async () => {
  try {
    const res = await fetch('http://127.0.0.0:3000/api/stream/youtube/fHI8X4OXluQ', { method: 'HEAD' });
    console.log(res.status, res.headers.get('content-type'));
  } catch (e) {
    console.error(e);
  }
})();
