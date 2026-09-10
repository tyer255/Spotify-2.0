const fs = require('fs');

const files = [
  'src/views/Settings/SettingsHome.tsx',
  'src/views/Settings/SettingsSubpages.tsx',
  'src/views/SearchView.tsx',
  'src/views/LibraryView.tsx'
];

for (const file of files) {
  if (!fs.existsSync(file)) continue;
  let content = fs.readFileSync(file, 'utf8');
  
  content = content.replace(/hig sm:h-/g, 'high-');
  content = content.replace(/searc sm:h-/g, 'search-');
  
  fs.writeFileSync(file, content, 'utf8');
}
