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
  
  // common replacements
  content = content.replace(/p-4p-6/g, 'p-4 sm:p-6');
  content = content.replace(/w-5 h-5w-6h-6/g, 'w-5 h-5 sm:w-6 sm:h-6');
  content = content.replace(/w-4 h-4w-5h-5/g, 'w-4 h-4 sm:w-5 sm:h-5');
  content = content.replace(/text-smtext-base/g, 'text-sm sm:text-base');
  content = content.replace(/text-xstext-sm/g, 'text-xs sm:text-sm');
  content = content.replace(/flex-colflex-row/g, 'flex-col sm:flex-row');
  content = content.replace(/h-10 w-10h-12 w-12/g, 'h-10 w-10 sm:h-12 sm:w-12');
  content = content.replace(/w-10 h-10w-12h-12/g, 'w-10 h-10 sm:w-12 sm:h-12');
  content = content.replace(/px-4px-6/g, 'px-4 sm:px-6');
  content = content.replace(/py-2py-3/g, 'py-2 sm:py-3');
  content = content.replace(/py-3py-4/g, 'py-3 sm:py-4');
  content = content.replace(/px-3px-4/g, 'px-3 sm:px-4');
  content = content.replace(/gap-2gap-3/g, 'gap-2 sm:gap-3');
  content = content.replace(/gap-3gap-4/g, 'gap-3 sm:gap-4');
  content = content.replace(/gap-4gap-6/g, 'gap-4 sm:gap-6');
  content = content.replace(/text-2xltext-3xl/g, 'text-2xl sm:text-3xl');
  content = content.replace(/text-3xltext-4xl/g, 'text-3xl sm:text-4xl');
  content = content.replace(/text-4xltext-5xl/g, 'text-4xl sm:text-5xl');
  content = content.replace(/rounded-lgrounded-xl/g, 'rounded-lg sm:rounded-xl');
  content = content.replace(/rounded-fullrounded-3xl/g, 'rounded-full sm:rounded-3xl');
  content = content.replace(/hiddenflex/g, 'hidden sm:flex');
  content = content.replace(/hiddenblock/g, 'hidden sm:block');
  content = content.replace(/flexhidden/g, 'flex sm:hidden');
  content = content.replace(/blockhidden/g, 'block sm:hidden');
  content = content.replace(/grid-cols-2grid-cols-3/g, 'grid-cols-2 sm:grid-cols-3');
  content = content.replace(/grid-cols-3grid-cols-4/g, 'grid-cols-3 sm:grid-cols-4');
  content = content.replace(/w-12 h-12w-16h-16/g, 'w-12 h-12 sm:w-16 sm:h-16');
  content = content.replace(/w-16 h-16w-24h-24/g, 'w-16 h-16 sm:w-24 sm:h-24');
  content = content.replace(/w-24 h-24w-32h-32/g, 'w-24 h-24 sm:w-32 sm:h-32');
  content = content.replace(/h-48h-64/g, 'h-48 sm:h-64');
  content = content.replace(/h-64h-80/g, 'h-64 sm:h-80');
  content = content.replace(/p-6p-8/g, 'p-6 sm:p-8');
  content = content.replace(/px-6px-8/g, 'px-6 sm:px-8');
  content = content.replace(/mb-4mb-6/g, 'mb-4 sm:mb-6');
  content = content.replace(/mb-6mb-8/g, 'mb-6 sm:mb-8');
  content = content.replace(/mt-4mt-6/g, 'mt-4 sm:mt-6');
  content = content.replace(/w-fullw-auto/g, 'w-full sm:w-auto');
  content = content.replace(/bottom-20bottom-24/g, 'bottom-20 sm:bottom-24');
  content = content.replace(/bottom-24bottom-0/g, 'bottom-24 sm:bottom-0');
  content = content.replace(/items-centeritems-start/g, 'items-center sm:items-start');
  content = content.replace(/text-centertext-left/g, 'text-center sm:text-left');
  
  // also handle triple combinations like "px-3 sm:px-4 md:px-6"
  // but if we did `s/ sm://g`, it would be `px-3px-4 md:px-6` 
  
  // To be safe, just add space before any standard tailwind utility that is merged into another
  // We can use a regex to find lowercase letters followed immediately by a standard utility
  // e.g., text-smtext-base -> text-sm sm:text-base
  
  const utilities = ['p-', 'px-', 'py-', 'pt-', 'pb-', 'm-', 'mx-', 'my-', 'mt-', 'mb-', 'w-', 'h-', 'text-', 'flex', 'block', 'hidden', 'grid-', 'gap-', 'rounded-', 'items-', 'justify-'];
  
  for (let util of utilities) {
      let re = new RegExp('([a-z0-9])(' + util + '[a-z0-9]+)', 'g');
      content = content.replace(re, function(match, p1, p2) {
         return p1 + ' sm:' + p2;
      });
  }

  // After this general regex, we might need a few more iterations or we might have fixed them.
  
  fs.writeFileSync(file, content, 'utf8');
  console.log('Fixed', file);
}
