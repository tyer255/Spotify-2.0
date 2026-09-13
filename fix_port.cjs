const fs = require('fs');
const path = 'server.ts';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
  "const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;",
  "const PORT = 3000;"
);

fs.writeFileSync(path, code);
