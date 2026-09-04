const fs = require('fs');
let code = fs.readFileSync('src/components/Player/FullscreenPlayer.tsx', 'utf8');

code = code.replace("import { api } from '../../services/apiClient'; from '../Common/CreatePlaylistModal';", "import { api } from '../../services/apiClient';");

fs.writeFileSync('src/components/Player/FullscreenPlayer.tsx', code);
