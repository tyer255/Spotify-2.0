const rawArt = 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/44/12/32/44123281-a9f7-66a7-0e69-9524e46059c3/14UMGIM10188.rgb.jpg/100x100bb.jpg';
const largeArt = rawArt.replace(/\/\d+x\d+bb\.jpg/g, '/600x600bb.jpg');
console.log("Large Art:", largeArt);
