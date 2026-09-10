const fs = require('fs');
const path = './src/components/Player/TabletRightPlayer.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace("    </div>\n    </aside>", "      </div>\n    </div>\n    </aside>");
fs.writeFileSync(path, content);
