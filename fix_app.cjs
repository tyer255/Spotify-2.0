const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

if (!code.includes("import { ClonePlaylistModal }")) {
  code = code.replace(
    /import \{ CreatePlaylistModal \} from '\.\/components\/Common\/CreatePlaylistModal';/,
    "import { CreatePlaylistModal } from './components/Common/CreatePlaylistModal';\nimport { ClonePlaylistModal } from './components/Common/ClonePlaylistModal';"
  );
  fs.writeFileSync('src/App.tsx', code);
}
