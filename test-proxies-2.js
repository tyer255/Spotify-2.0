const proxies = [
  'https://api.allorigins.win/raw?url=',
  'https://api.codetabs.com/v1/proxy?quest=',
  'https://cors-anywhere.herokuapp.com/',
  'https://proxy.cors.sh/',
  'https://thingproxy.freeboard.io/fetch/'
];

const target = 'https://open.spotify.com/get_access_token?reason=transport&productType=web_player';

async function test() {
  for (let p of proxies) {
    try {
      let r = await fetch(p + encodeURIComponent(target), { timeout: 3000 });
      let t = await r.text();
      console.log(p, t.slice(0, 50));
    } catch (e) {
      console.log(p, e.message);
    }
  }
}
test();
