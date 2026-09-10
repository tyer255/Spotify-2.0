const fs = require('fs');
let code = fs.readFileSync('src/components/Navigation/Sidebar.tsx', 'utf8');

// Fix <aside p-4 to p-2 xl:p-4
code = code.replace(/liquid-glass-sidebar p-4/, 'liquid-glass-sidebar p-2 xl:p-4');

// Fix buttons
code = code.replace(/gap-4 px-4/g, 'gap-0 xl:gap-4 px-0 xl:px-4 justify-center xl:justify-start');
code = code.replace(/gap-3 px-4/g, 'gap-0 xl:gap-3 px-0 xl:px-4 justify-center xl:justify-start');

fs.writeFileSync('src/components/Navigation/Sidebar.tsx', code);
