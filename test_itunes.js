const url = "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/c3/91/97/c39197c3-30b1-4f10-fbde-84d4fb4c03ba/source/60x60bb.jpg";
console.log(url.replace(/\/\d+x\d+bb\.jpg/g, '/600x600bb.jpg'));
console.log(url.replace(/\/\d+x\d+bb\.jpg/g, '/1000x1000bb.jpg'));
