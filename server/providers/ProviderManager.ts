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

    // Select Spotify if credentials exist, otherwise default to Open Authorized Music Provider
    if (spotify.isConfigured()) {
      this.activeProvider = spotify;
      console.log('[ProviderManager] Initialized with Spotify Web API Provider');
    } else {
      this.activeProvider = openProvider;
      console.log('[ProviderManager] Initialized with Open Authorized Music Provider (Real iTunes, Deezer & LRCLIB Metadata)');
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
