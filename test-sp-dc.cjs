async function test() {
  const res = await fetch('https://open.spotify.com/get_access_token?reason=transport&productType=web_player', {
    headers: {
      'Cookie': 'sp_dc=fake_cookie_123',
      'User-Agent': 'Mozilla/5.0'
    }
  });
  console.log(res.status);
  console.log((await res.text()).substring(0, 100));
}
test();
