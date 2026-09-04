import { IMusicProvider } from './MusicProvider';
import { OpenMusicProvider } from './OpenMusicProvider';
import { SpotifyMusicProvider } from './SpotifyMusicProvider';

class ProviderManager {
  private providers: IMusicProvider[] = [];
  private activeProvider: IMusicProvider;

  constructor() {
    const spotify = new SpotifyMusicProvider();
    const openProvider = new OpenMusicProvider();

    this.providers = [spotify, openProvider];

    // Always use OpenMusicProvider for the main app to avoid Spotify's 403 Premium restrictions on Web API
    this.activeProvider = openProvider;
    console.log('[ProviderManager] Initialized with Open Authorized Music Provider (Real iTunes, Deezer & LRCLIB Metadata)');
    if (spotify.isConfigured()) {
      console.log('[ProviderManager] Spotify Web API configured for background tasks (Canvas/Lookup).');
    }
  }

  getProvider(): IMusicProvider {
    return this.activeProvider;
  }

  getProviderStatus() {
    return {
      activeProviderId: this.activeProvider.id,
      activeProviderName: this.activeProvider.name,
      isConfigured: this.activeProvider.isConfigured(),
      availableProviders: this.providers.map((p) => ({
        id: p.id,
        name: p.name,
        isConfigured: p.isConfigured(),
      })),
    };
  }
}

export const providerManager = new ProviderManager();
