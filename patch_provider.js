const fs = require('fs');
let content = fs.readFileSync('server/providers/ProviderManager.ts', 'utf8');

content = content.replace(
    "    // Select Spotiz if credentials exist, otherwise default to Open Authorized Music Provider\n    if (spotify.isConfigured()) {\n      this.activeProvider = spotify;\n      console.log('[ProviderManager] Initialized with Spotify Web API Provider');\n    } else {\n      this.activeProvider = openProvider;\n      console.log('[ProviderManager] Initialized with Open Authorized Music Provider (Real iTunes, Deezer & LRCLIB Metadata)');\n    }",
    "    // Always use OpenMusicProvider for the main app to avoid Spotify's 403 Premium restrictions on Web API\n    this.activeProvider = openProvider;\n    console.log('[ProviderManager] Initialized with Open Authorized Music Provider (Real iTunes, Deezer & LRCLIB Metadata)');\n    if (spotify.isConfigured()) {\n      console.log('[ProviderManager] Spotify Web API configured for background tasks (Canvas/Lookup).');\n    }"
);

fs.writeFileSync('server/providers/ProviderManager.ts', content, 'utf8');
console.log("Patched ProviderManager.ts");
