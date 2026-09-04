function cleanTitle(title: string): string {
      return title.split(/[\(\[-]/)[0].trim().toLowerCase();
  }

const SPOTIFY_ID_MAP: Record<string, string> = {
    'bad guy billie eilish': '2Fxmhks0bxGSBdJ92vM42m',
    'angaaron': '5HABzk8BiB4G08tBqnKeSU',
    'sajni': '5U8rP7aB1647GvB5mDk1pC',
    'blinding lights the weeknd': '0VjIjW4GlUZAMYd2vXMi3b',
};

const title = "Blinding Lights (Remix)";
const artist = "The Weeknd";

const cTitle = cleanTitle(title);
console.log(cTitle);
const cArtist = artist.split(',')[0].trim().toLowerCase();
console.log(`${cTitle} ${cArtist}`);
console.log(SPOTIFY_ID_MAP[`${cTitle} ${cArtist}`]);
