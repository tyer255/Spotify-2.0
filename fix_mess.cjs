const fs = require('fs');

const files = [
  'src/views/Settings/SettingsHome.tsx',
  'src/views/Settings/SettingsSearch.tsx',
  'src/views/Settings/SettingsSubpages.tsx',
  'src/views/SearchView.tsx',
  'src/views/LibraryView.tsx',
  'src/views/PlaylistView.tsx',
  'src/views/AlbumView.tsx',
  'src/views/HomeView.tsx'
];

for (const file of files) {
  if (!fs.existsSync(file)) continue;
  let content = fs.readFileSync(file, 'utf8');
  
  content = content.replace(/shado sm:w-/g, 'shadow-');
  content = content.replace(/overflo sm:w-/g, 'overflow-');
  content = content.replace(/botto sm:m-/g, 'bottom-');
  content = content.replace(/fro sm:m-/g, 'from-');
  content = content.replace(/zoo sm:m-/g, 'zoom-');
  content = content.replace(/grou sm:p-/g, 'group-');
  content = content.replace(/dro sm:p-/g, 'drop-');
  content = content.replace(/to sm:p-/g, 'top-');
  content = content.replace(/clam sm:p-/g, 'clamp-');
  content = content.replace(/wra sm:p-/g, 'wrap-');
  content = content.replace(/t sm:y-/g, 'ty-'); // just in case for opacity, but wait opacity- didn't match `py-`. It was just `y-`. Oh wait my regex was `py-`.
  content = content.replace(/c sm:p-/g, 'cp-');
  content = content.replace(/ma sm:x-/g, 'max-');
  content = content.replace(/ma sm:y-/g, 'may-');
  content = content.replace(/o sm:m-/g, 'om-'); // from / bottom already caught
  
  // also text-s sm:m-? Wait, my regex was 'm-'.
  content = content.replace(/s sm:m-/g, 'sm-');
  content = content.replace(/botto sm:m-/g, 'bottom-');
  content = content.replace(/roo sm:m-/g, 'room-');
  content = content.replace(/for sm:m-/g, 'form-');
  content = content.replace(/syste sm:m-/g, 'system-');
  content = content.replace(/the sm:m-/g, 'them-');
  content = content.replace(/custo sm:m-/g, 'custom-');
  content = content.replace(/gra sm:m-/g, 'gram-');
  content = content.replace(/nu sm:m-/g, 'num-');
  content = content.replace(/ite sm:m-/g, 'item-');
  content = content.replace(/botto sm:m/g, 'bottom');

  content = content.replace(/a sm:w-/g, 'aw-');
  content = content.replace(/b sm:w-/g, 'bw-');
  content = content.replace(/e sm:w-/g, 'ew-');
  content = content.replace(/o sm:w-/g, 'ow-');
  content = content.replace(/l sm:w-/g, 'lw-');

  // Let's just fix any `[a-z] sm:[a-z]-` by reviewing.
  
  fs.writeFileSync(file, content, 'utf8');
}
