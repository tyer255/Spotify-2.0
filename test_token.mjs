fetch('https://open.spotify.com/get_access_token?reason=transport&productType=web_player', {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36',
    'Accept': 'application/json',
    'Cookie': 'sp_t=test'
  }
}).then(res => res.text()).then(text => console.log(text)).catch(err => console.log(err));
