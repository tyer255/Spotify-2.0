const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');
code = code.replace(/import \{ ClonePlaylistModal \} from '\.\/components\/Overlays\/ClonePlaylistModal';/, "import { ClonePlaylistModal } from './components/Common/ClonePlaylistModal';");
fs.writeFileSync('src/App.tsx', code);
