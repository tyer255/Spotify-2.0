const fs = require('fs');
const path = 'server/providers/OpenMusicProvider.ts';
let code = fs.readFileSync(path, 'utf8');

if (!code.includes('const resolutionPromises = new Map<string, Promise<any>>();')) {
  code = code.replace(
    'export class OpenMusicProvider implements IMusicProvider {',
    'const resolutionPromises = new Map<string, Promise<any>>();\n\nexport class OpenMusicProvider implements IMusicProvider {'
  );
  
  code = code.replace(
    'async resolvePlayback(',
    'async resolvePlayback_impl('
  );
  
  const wrapper = `
  async resolvePlayback(
    trackId: string,
    title?: string,
    artist?: string,
    duration?: number,
    options?: { forceFresh?: boolean; discardUrl?: string }
  ) {
    const cacheKey = \`playback-strict-v5-\${trackId}\`;
    if (!options?.forceFresh && !options?.discardUrl) {
      const cached = getFromCache<any>(cacheKey);
      if (cached) return cached;
    }

    // Deduplicate concurrent requests
    const promiseKey = \`\${trackId}_\${options?.forceFresh}\`;
    if (resolutionPromises.has(promiseKey)) {
      return resolutionPromises.get(promiseKey);
    }

    const promise = this.resolvePlayback_impl(trackId, title, artist, duration, options).finally(() => {
      resolutionPromises.delete(promiseKey);
    });
    resolutionPromises.set(promiseKey, promise);
    return promise;
  }

  async resolvePlayback_impl(`;
  
  code = code.replace(
    'async resolvePlayback_impl(',
    wrapper
  );
  
  fs.writeFileSync(path, code);
  console.log('Added deduping');
} else {
  console.log('Already deduped');
}
