function cleanBaseTitle(title) {
  if (!title) return '';
  return title
    .replace(/\s*[\(\[][^\)\]]*[\)\]]/gi, '')
    .replace(/[^\w\s\u0900-\u097F\u0A00-\u0A7F\u0B80-\u0BFF\u0C00-\u0C7F\u0D00-\u0D7F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}
console.log(cleanBaseTitle('Sunflower (Spider-Man: Into the Spider-Verse)'));
