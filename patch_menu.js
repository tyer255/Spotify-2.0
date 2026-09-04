import fs from 'fs';
let content = fs.readFileSync('src/components/Navigation/CreateActionMenu.tsx', 'utf8');

const regex = /\{\/\* 1\.5 Clone Playlist Option \*\/\}[\s\S]*?\{\/\* 2\. Collaborative Playlist Option/;

if (regex.test(content)) {
    content = content.replace(regex, '{/* 2. Collaborative Playlist Option');
    fs.writeFileSync('src/components/Navigation/CreateActionMenu.tsx', content);
    console.log('Removed clone playlist button');
} else {
    console.log('Regex not found in CreateActionMenu');
}
