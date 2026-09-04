async function getCanvasUrl(trackId) {
  try {
    // 1. Get anonymous token
    const tokenRes = await fetch('https://open.spotify.com/get_access_token?reason=transport&productType=web_player', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
      }
    });
    if (!tokenRes.ok) {
      console.log('Token fetch failed', tokenRes.status);
      return null;
    }
    const tokenData = await tokenRes.json();
    const accessToken = tokenData.accessToken;
    
    // 2. Fetch canvas using protobuf
    const trackUri = 'spotify:track:' + trackId;
    const reqBuffer = Buffer.concat([
      Buffer.from([0x0a, trackUri.length + 2, 0x0a, trackUri.length]),
      Buffer.from(trackUri)
    ]);
    
    const res = await fetch('https://spclient.wg.spotify.com/canvaz-cache/v0/canvases', {
      method: 'POST',
      headers: {
        'accept': 'application/protobuf',
        'content-type': 'application/x-www-form-urlencoded',
        'authorization': `Bearer ${accessToken}`
      },
      body: reqBuffer
    });
    
    if (!res.ok) {
      console.log('Canvas fetch failed', res.status);
      return null;
    }
    
    const resBuffer = Buffer.from(await res.arrayBuffer());
    // find http in the buffer
    const str = resBuffer.toString('utf8');
    const match = str.match(/https:\/\/[^\s]+?\.mp4/);
    if (match) {
      return match[0];
    }
    return null;
  } catch (e) {
    console.error(e);
    return null;
  }
}

getCanvasUrl('0VjIjW4GlUZAMYd2vXMi3b').then(console.log);
