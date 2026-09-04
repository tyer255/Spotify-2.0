import fetch from 'node-fetch';
import * as cheerio from 'cheerio';

async function run() {
  const res = await fetch("https://open.spotify.com/embed/playlist/37i9dQZF1DXcBWIGoYBM5M");
  const html = await res.text();
  const $ = cheerio.load(html);
  const nextData = $('#__NEXT_DATA__').html();
  if (nextData) {
      const data = JSON.parse(nextData);
      const entity = data.props.pageProps.state.data.entity;
      if (entity && entity.trackList) {
          console.log(JSON.stringify(entity.trackList[0], null, 2));
      }
  }
}
run();
