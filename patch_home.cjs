const fs = require('fs');
let code = fs.readFileSync('src/views/HomeView.tsx', 'utf8');

code = code.replace(/<Sparkles className="w-5 h-5 text-emerald-400" \/>/, '<Music className="w-5 h-5 text-neutral-400" />');
code = code.replace(/<Flame className="w-5 h-5 text-amber-500" \/>/, '<Flame className="w-5 h-5 text-neutral-400" />');
code = code.replace(/<Disc className="w-5 h-5 text-indigo-400" \/>/, '<Disc className="w-5 h-5 text-neutral-400" />');
code = code.replace(/<Radio className="w-5 h-5 text-pink-400" \/>/, '<Radio className="w-5 h-5 text-neutral-400" />');

fs.writeFileSync('src/views/HomeView.tsx', code);
