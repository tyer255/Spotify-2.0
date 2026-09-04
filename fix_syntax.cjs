const fs = require('fs');
let code = fs.readFileSync('src/components/Player/FullscreenPlayer.tsx', 'utf8');

code = code.replace(`              )}
                  ))}
                </div>
              </div>`, `              )}`);

fs.writeFileSync('src/components/Player/FullscreenPlayer.tsx', code);
