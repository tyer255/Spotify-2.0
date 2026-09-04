import fs from 'fs';

const path = './server/services/spotifyCanvasService.ts';
let code = fs.readFileSync(path, 'utf8');

const target1 = `const SPOTIFY_ID_MAP: Record<string, string> = {
    'tauba tauba': '25Nxyrng0Z3jC5Q0hAibpw', // Hardcoded map for known popular track to avoid matching issues
    'tauba tauba - karan aujla': '25Nxyrng0Z3jC5Q0hAibpw'
};`;

const replace1 = `const SPOTIFY_ID_MAP: Record<string, string> = {
    'tauba tauba': '25Nxyrng0Z3jC5Q0hAibpw',
    'tauba tauba - karan aujla': '25Nxyrng0Z3jC5Q0hAibpw',
    'dekha tenu': '34Fh4HXZmnuBdtgejWUZg2',
    'dekhha tenu': '34Fh4HXZmnuBdtgejWUZg2',
    'dekha tenu - mohammad faiz': '34Fh4HXZmnuBdtgejWUZg2',
    'dekhha tenu (from "mr. and mrs. mahi")': '34Fh4HXZmnuBdtgejWUZg2'
};`;

code = code.replace(target1, replace1);

fs.writeFileSync(path, code);
console.log("Patched Map successfully");
