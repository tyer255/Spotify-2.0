import fs from 'fs';
const path = './server/services/spotifyCanvasService.ts';
let code = fs.readFileSync(path, 'utf8');

const target = `    } catch(e) {
        console.warn("[CanvasService] Deezer fallback failed");
    }
    return null;
  }`;

const replace = `    } catch(e) {
        console.warn("[CanvasService] Deezer fallback failed");
    }
    return ids;
  }`;
code = code.replace(target, replace);
fs.writeFileSync(path, code);
