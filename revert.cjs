const fs = require('fs');

const files = [
  'src/views/Settings/SettingsHome.tsx',
  'src/views/Settings/SettingsSearch.tsx',
  'src/views/Settings/SettingsSubpages.tsx',
  'src/views/SearchView.tsx',
  'src/views/LibraryView.tsx',
  'src/views/PlaylistView.tsx'
];

for (const file of files) {
  if (!fs.existsSync(file)) continue;
  let content = fs.readFileSync(file, 'utf8');
  
  // Undo `ga sm:p-` -> `gap-`
  content = content.replace(/ga sm:p-/g, 'gap-');
  
  // Undo `wra sm:p-` -> `wrap-`
  content = content.replace(/wra sm:p-/g, 'wrap-');

  // Undo `to sm:p-` -> `top-`
  content = content.replace(/to sm:p-/g, 'top-');
  
  fs.writeFileSync(file, content, 'utf8');
}
