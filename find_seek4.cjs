const fs = require('fs');
const bundle = fs.readFileSync('src/bundle/index-Bfvfzxe5.js', 'utf8');

const lines = bundle.split(';');
for (const line of lines) {
  if (line.includes('currentTime') && line.includes('=')) {
    console.log(line);
  }
}
