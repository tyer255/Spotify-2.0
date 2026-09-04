const fs = require('fs');
const content = fs.readFileSync('src/utils/artistAliases.ts', 'utf-8');

const newEntry = `  {
    canonicalName: 'Noor Khan',
    realNames: ['Noor Khan', 'Noor'],
    spotifyNames: ['Noor Khan', 'Noor', 'Khan, Noor'],
    aliases: ['Noor Khan', 'Noor', 'Khan, Noor'],
    genres: ['Hindi', 'Pop', 'Indie'],
    followers: 1000000,
    portraitUrl: 'https://cdn-images.dzcdn.net/images/artist/6f99819fd83c4f2d9da189179a95a9e5/1000x1000-000000-80-0-0.jpg',
    bio: 'Noor Khan is an acclaimed Indian artist known for collaborating on chart-topping indie tracks like Aarzu.',
  },
`;

const updated = content.replace('export const ARTIST_ALIAS_DATABASE: ArtistAliasEntry[] = [', 'export const ARTIST_ALIAS_DATABASE: ArtistAliasEntry[] = [\n' + newEntry);
fs.writeFileSync('src/utils/artistAliases.ts', updated);
