async function getToken() {
  const res = await fetch('https://open.spotify.com/get_access_token?reason=transport&productType=web_player', {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'
    }
  });
  const text = await res.text();
  console.log("Status:", res.status);
  console.log("HTML length:", text.substring(0, 100));
}
getToken();
