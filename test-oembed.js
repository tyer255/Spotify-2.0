const fetch = require('node-fetch');
fetch('https://open.spotify.com/oembed?url=spotify:track:4cOdK2wGLETKBW3PvgPWqT').then(r => r.json()).then(console.log);
