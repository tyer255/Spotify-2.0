import fs from 'fs';

const path = './server/services/spotifyCanvasService.ts';
let code = fs.readFileSync(path, 'utf8');

const target1 = `  private static async resolveSpotifyIdDynamically(title: string, artist: string): Promise<string | null> {`;
const replace1 = `  private static async resolveSpotifyIdDynamically(title: string, artist: string): Promise<string[]> {`;

const target2 = `    // Check hardcoded map first to avoid proxy/DDG bans for popular songs
    const hardcoded = this.getHardcodedId(title, artist);
    if (hardcoded) return hardcoded;`;
const replace2 = `    const ids: string[] = [];
    // Check hardcoded map first to avoid proxy/DDG bans for popular songs
    const hardcoded = this.getHardcodedId(title, artist);
    if (hardcoded) ids.push(hardcoded);`;

const target3 = `            if (res && res.tracks && res.tracks.length > 0) {
                return res.tracks[0].id;
            }`;
const replace3 = `            if (res && res.tracks && res.tracks.length > 0) {
                for (const t of res.tracks.slice(0, 3)) if (t.id) ids.push(t.id);
            }`;

const target4 = `                        console.log(\`[CanvasService] YouTube mapping success for \${title}: \${spot[1]}\`);
                        return spot[1];`;
const replace4 = `                        console.log(\`[CanvasService] YouTube mapping success for \${title}: \${spot[1]}\`);
                        if (!ids.includes(spot[1])) ids.push(spot[1]);`;

const target5 = `            if (id2) return id2;`;
const replace5 = ``;

const target6 = `            if (id1) return id1;`;
const replace6 = ``;

const target7 = `                            console.log(\`[CanvasService] MusicBrainz mapping success for \${title}: \${match[1]}\`);
                            return match[1];`;
const replace7 = `                            console.log(\`[CanvasService] MusicBrainz mapping success for \${title}: \${match[1]}\`);
                            if (!ids.includes(match[1])) ids.push(match[1]);`;

const target8 = `                                        console.log(\`[CanvasService] Deezer->MB mapping success for \${title}: \${match[1]}\`);
                                        return match[1];`;
const replace8 = `                                        console.log(\`[CanvasService] Deezer->MB mapping success for \${title}: \${match[1]}\`);
                                        if (!ids.includes(match[1])) ids.push(match[1]);`;

const target9 = `        console.warn("[CanvasService] Deezer fallback failed");
    }

    return null;`;
const replace9 = `        console.warn("[CanvasService] Deezer fallback failed");
    }

    return ids;`;

const target10 = `    if (!trackId || !/^[a-zA-Z0-9]{22}$/.test(trackId)) {
        if (input.title) {
            const resolvedId = await this.resolveSpotifyIdDynamically(input.title, input.artist || '');
            if (resolvedId) {
                trackId = resolvedId;
            } else {
                return this.createErrorResult(input, 'CANVAS_FETCH_FAILED', 'Could not resolve Spotify ID from title and artist');
            }
        } else {
            return this.createErrorResult(input, 'CANVAS_FETCH_FAILED', 'Invalid track ID format and no title provided for fallback search');
        }
    }`;
const replace10 = `    let possibleIds: string[] = [];
    if (trackId && /^[a-zA-Z0-9]{22}$/.test(trackId)) {
        possibleIds.push(trackId);
    } else if (input.title) {
        possibleIds = await this.resolveSpotifyIdDynamically(input.title, input.artist || '');
        if (possibleIds.length === 0) {
            return this.createErrorResult(input, 'CANVAS_FETCH_FAILED', 'Could not resolve Spotify ID from title and artist');
        }
    } else {
        return this.createErrorResult(input, 'CANVAS_FETCH_FAILED', 'Invalid track ID format and no title provided for fallback search');
    }`;

const target11 = `    const cacheKey = trackId;
    const cached = this.resolutionCache.get(cacheKey);
    if (cached && Date.now() < cached.expiry) {
      return cached.data;
    }

    try {
      const result = await this.resolveCanvasDynamically(trackId, input);
      if (result.status === 'CANVAS_FOUND') {
        this.resolutionCache.set(cacheKey, { data: result, expiry: Date.now() + 6 * 3600 * 1000 });
      } else if (result.status === 'CANVAS_NOT_AVAILABLE') {
        this.resolutionCache.set(cacheKey, { data: result, expiry: Date.now() + 3600 * 1000 });
      } else {
        this.resolutionCache.set(cacheKey, { data: result, expiry: Date.now() + 5 * 60 * 1000 });
      }
      return result;
    } catch (error: any) {
      const failedResult = this.createErrorResult(input, 'CANVAS_FETCH_FAILED', error?.message || 'Unknown error');
      this.resolutionCache.set(cacheKey, { data: failedResult, expiry: Date.now() + 5 * 60 * 1000 });
      return failedResult;
    }`;
const replace11 = `    let lastResult: SpotifyCanvasResult | null = null;
    
    for (const tId of possibleIds) {
        const cacheKey = tId;
        const cached = this.resolutionCache.get(cacheKey);
        if (cached && Date.now() < cached.expiry && cached.data.status === 'CANVAS_FOUND') {
            return cached.data;
        }

        try {
            const result = await this.resolveCanvasDynamically(tId, input);
            if (result.status === 'CANVAS_FOUND') {
                this.resolutionCache.set(cacheKey, { data: result, expiry: Date.now() + 6 * 3600 * 1000 });
                return result; // Found it! Stop searching.
            } else if (result.status === 'CANVAS_NOT_AVAILABLE') {
                this.resolutionCache.set(cacheKey, { data: result, expiry: Date.now() + 3600 * 1000 });
            } else {
                this.resolutionCache.set(cacheKey, { data: result, expiry: Date.now() + 5 * 60 * 1000 });
            }
            lastResult = result;
        } catch (error: any) {
            const failedResult = this.createErrorResult(input, 'CANVAS_FETCH_FAILED', error?.message || 'Unknown error');
            this.resolutionCache.set(cacheKey, { data: failedResult, expiry: Date.now() + 5 * 60 * 1000 });
            lastResult = failedResult;
        }
    }
    
    return lastResult || this.createErrorResult(input, 'CANVAS_NOT_AVAILABLE', 'No canvas found across all possible Spotify IDs');`;

code = code.replace(target1, replace1);
code = code.replace(target2, replace2);
code = code.replace(target3, replace3);
// Careful, checkVideosForSpotifyId has two places where it returns spot[1]. Wait, checkVideosForSpotifyId returns spot[1].
// We need to modify checkVideosForSpotifyId to not return immediately, but push.
code = code.replace(target4, replace4);
code = code.replace(target4, replace4); // do it twice just in case? Actually there's only one checkVideosForSpotifyId definition.
code = code.replace(target5, replace5);
code = code.replace(target6, replace6);
code = code.replace(target7, replace7);
code = code.replace(target8, replace8);
code = code.replace(target9, replace9);
code = code.replace(target10, replace10);
code = code.replace(target11, replace11);

// We need to fix checkVideosForSpotifyId since it returns string | null. We should make it return void and just push to ids.
code = code.replace(`return spot[1];`, `if (!ids.includes(spot[1])) ids.push(spot[1]);`);

// Fix the ID return
code = code.replace(`    return null;\n  }`, `    return ids;\n  }`);

fs.writeFileSync(path, code);
console.log("Patched array successfully");
