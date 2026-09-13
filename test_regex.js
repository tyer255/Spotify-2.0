const urls = [
  "https://c.saavncdn.com/504/Arz-Kiya-Hai-Coke-Studio-Bharat-Hindi-2025-20250818054005-150x150.jpg",
  "https://c.saavncdn.com/504/Arz-Kiya-Hai-Coke-Studio-Bharat-Hindi-2025-20250818054005-50x50.jpg",
  "https://c.saavncdn.com/123/something-250x250.png"
];
urls.forEach(url => {
  let largeArt = url.replace(/-\d+x\d+\.(jpg|jpeg|png)/i, '-500x500.$1').replace(/(50x50|150x150|250x250)/g, '500x500');
  console.log(largeArt);
});
