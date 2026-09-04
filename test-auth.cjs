async function test() {
  const headers = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' };
  const res1 = await fetch('https://open.spotify.com/', { headers });
  
  // Use Headers.getSetCookie() in newer Node versions
  const cookies = res1.headers.getSetCookie ? res1.headers.getSetCookie() : [];
  if (!cookies.length) return console.log("No cookies");
  const cookieStr = cookies.map(c => c.split(';')[0]).join('; ');
  console.log("Cookies:", cookieStr);

  const res2 = await fetch('https://open.spotify.com/get_access_token?reason=transport&productType=web_player', {
    headers: { ...headers, 'Cookie': cookieStr, 'Accept': 'application/json' }
  });
  console.log("Status:", res2.status);
  console.log("Body:", await res2.text());
}
test();
