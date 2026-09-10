import { ApiResponse } from '../types';

class ApiClient {
  private baseUrl = '/api';
  private searchCache = new Map<string, { data: any; timestamp: number }>();
  private suggestionsCache = new Map<string, { data: any; timestamp: number }>();
  private homeFeedCache: { data: any; timestamp: number } | null = null;
  private activeSearchController: AbortController | null = null;
  private activeSuggestionsController: AbortController | null = null;
  private sessionId: string = Math.random().toString(36).substring(2);

  // Exponential backoff retry utility
  async fetchWithRetry<T>(
    endpoint: string,
    options: RequestInit = {},
    maxRetries = 2,
    baseDelay = 500
  ): Promise<ApiResponse<T>> {
    let attempt = 0;
    while (attempt <= maxRetries) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 12000);

        const res = await fetch(`${this.baseUrl}${endpoint}`, {
          ...options,
          signal: options.signal || controller.signal,
          headers: {
            'x-session-id': this.sessionId,
            'Content-Type': 'application/json',
            ...(options.headers || {}),
          },
        });
        
        clearTimeout(timeoutId);

        if (!res.ok) {
          const errorJson = await res.json().catch(() => null);
          if (errorJson && errorJson.error) {
            return errorJson;
          }
          throw new Error(`HTTP Error ${res.status}: ${res.statusText}`);
        }

        const data: ApiResponse<T> = await res.json();
        return data;
      } catch (err: any) {
        if (err.name === 'AbortError') {
          return {
            success: false,
            data: null,
            error: {
              code: 'ABORTED',
              message: 'Request aborted',
            },
          };
        }
        attempt++;
        if (attempt > maxRetries) {
          return {
            success: false,
            data: null,
            error: {
              code: 'NETWORK_ERROR',
              message: err.message || 'Unable to connect to music service. Please check connection.',
            },
          };
        }
        // Exponential backoff
        await new Promise((resolve) => setTimeout(resolve, baseDelay * Math.pow(2, attempt - 1)));
      }
    }

    return {
      success: false,
      data: null,
      error: {
        code: 'NETWORK_ERROR',
        message: 'Request failed after multiple retries',
      },
    };
  }

  // Home Feed with client cache (valid for 5 minutes)
  async getHomeFeed(bypassCache = false) {
    if (!bypassCache && this.homeFeedCache && (Date.now() - this.homeFeedCache.timestamp < 300000)) {
      return { success: true, data: this.homeFeedCache.data };
    }
    const res = await this.fetchWithRetry<any>('/home');
    if (res.success && res.data) {
      this.homeFeedCache = {
        data: res.data,
        timestamp: Date.now(),
      };
    }
    return res;
  }

  getCachedHomeFeed() {
    return this.homeFeedCache?.data || null;
  }

  clearHomeFeedCache() {
    this.homeFeedCache = null;
  }

  // Search with client caching and in-flight cancellation

  async search(query: string, bypassCache = false) {
    const normalized = query.trim().toLowerCase().replace(/\s+/g, ' ');
    if (!normalized) {
      return { success: true, data: { songs: [], artists: [], albums: [], playlists: [], topResult: null } };
    }

    // Check client-side memory cache (valid for 5 minutes)
    if (!bypassCache) {
      const cached = this.searchCache.get(normalized);
      if (cached && Date.now() - cached.timestamp < 30000) {
        return { success: true, data: cached.data };
      }
    }

    // Cancel previous in-flight search request to prevent race conditions
    if (this.activeSearchController) {
      this.activeSearchController.abort();
    }
    this.activeSearchController = new AbortController();

    const response = await this.fetchWithRetry<any>(
      `/search?q=${encodeURIComponent(normalized)}`,
      { signal: this.activeSearchController.signal },
      0, // Fast 0-retry for search to prevent blocking queues
      0
    );

    if (response.success && response.data) {
      this.searchCache.set(normalized, {
        data: response.data,
        timestamp: Date.now(),
      });
    }

    return response;
  }

  // Search Suggestions (Fast, title-filtered song suggestions while typing)
  async getSuggestions(query: string, bypassCache = false) {
    const normalized = query.trim().toLowerCase().replace(/\s+/g, ' ');
    if (!normalized) {
      return { success: true, data: [] };
    }

    if (!bypassCache) {
      const cached = this.suggestionsCache.get(normalized);
      if (cached && Date.now() - cached.timestamp < 30000) {
        return { success: true, data: cached.data };
      }
    }

    if (this.activeSuggestionsController) {
      this.activeSuggestionsController.abort();
    }
    this.activeSuggestionsController = new AbortController();

    const response = await this.fetchWithRetry<any>(
      `/search/suggestions?q=${encodeURIComponent(normalized)}`,
      { signal: this.activeSuggestionsController.signal },
      0, // Fast suggestions don't need retry delays
      0
    );

    if (response.success && Array.isArray(response.data)) {
      this.suggestionsCache.set(normalized, {
        data: response.data,
        timestamp: Date.now(),
      });
    }

    return response;
  }

  // Track Details
  async getTrack(id: string) {
    return this.fetchWithRetry<any>(`/track/${id}`);
  }

  // Artist Details
  async getArtist(id: string) {
    return this.fetchWithRetry<any>(`/artist/${id}`);
  }

  // Album Details
  async getAlbum(id: string) {
    return this.fetchWithRetry<any>(`/album/${id}`);
  }

  // Playlist Details
  async getPlaylist(id: string) {
    return this.fetchWithRetry<any>(`/playlist/${id}`);
  }

  // Create Playlist
  async createPlaylist(title: string, description?: string, coverImage?: string, id?: string) {
    return this.fetchWithRetry<any>('/playlist', {
      method: 'POST',
      body: JSON.stringify({ title, description, coverImage, id }),
    });
  }

  // Update Playlist
  async updatePlaylist(id: string, updates: { title?: string; description?: string; coverImage?: string }) {
    return this.fetchWithRetry<any>(`/playlist/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  // Delete Playlist
  async deletePlaylist(id: string) {
    return this.fetchWithRetry<any>(`/playlist/${id}`, {
      method: 'DELETE',
    });
  }

  // Add Track to Playlist
  async addTrackToPlaylist(playlistId: string, trackId: string, track?: any) {
    return this.fetchWithRetry<any>(`/playlist/${playlistId}/tracks`, {
      method: 'POST',
      body: JSON.stringify({ trackId, track }),
    });
  }

  // Remove Track from Playlist
  async removeTrackFromPlaylist(playlistId: string, trackId: string) {
    return this.fetchWithRetry<any>(`/playlist/${playlistId}/tracks/${trackId}`, {
      method: 'DELETE',
    });
  }

  // Reorder Tracks in Playlist
  async reorderPlaylistTracks(playlistId: string, trackIds: string[]) {
    return this.fetchWithRetry<any>(`/playlist/${playlistId}/reorder`, {
      method: 'PUT',
      body: JSON.stringify({ trackIds }),
    });
  }

  // Lyrics
  async getLyrics(trackId: string, title?: string, artist?: string, duration?: number) {
    const params = new URLSearchParams();
    if (title) params.append('title', title);
    if (artist) params.append('artist', artist);
    if (duration) params.append('duration', String(duration));
    const qs = params.toString() ? `?${params.toString()}` : '';
    return this.fetchWithRetry<any>(`/lyrics/${trackId}${qs}`);
  }

  // Playback Resolve
  async resolvePlayback(
    trackId: string,
    title?: string,
    artist?: string,
    duration?: number,
    options?: { forceFresh?: boolean; discardUrl?: string }
  ) {
    return this.fetchWithRetry<any>('/playback/resolve', {
      method: 'POST',
      body: JSON.stringify({
        trackId,
        title,
        artist,
        duration,
        forceFresh: options?.forceFresh,
        discardUrl: options?.discardUrl,
      }),
    });
  }

  // Recommendations
  async getRecommendations(seedTrackId?: string, genre?: string) {
    const params = new URLSearchParams();
    if (seedTrackId) params.append('seedTrackId', seedTrackId);
    if (genre) params.append('genre', genre);
    return this.fetchWithRetry<any>(`/recommendations?${params.toString()}`);
  }

  // Radio Station
  async getShareRecord(id: string) {
    return this.fetchWithRetry<any>(`/share/${id}`);
  }

  async getRadio(seedType: 'artist' | 'song' | 'album', seedId: string, seedTitle?: string) {
    const params = new URLSearchParams({ seedType, seedId });
    if (seedTitle) params.append('seedTitle', seedTitle);
    return this.fetchWithRetry<any>(`/radio?${params.toString()}`);
  }

  // Profile
  async getProfile() {
    return this.fetchWithRetry<any>('/profile');
  }

  // Update Profile / Settings
  async updateProfile(updates: any) {
    return this.fetchWithRetry<any>('/profile', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  // Like / Unlike Track
  async toggleLikeTrack(trackId: string) {
    this.logAnalyticsEvent('like', trackId);
    return this.fetchWithRetry<any>('/like-track', {
      method: 'POST',
      body: JSON.stringify({ trackId }),
    });
  }

  // Get Liked Tracks
  async getLikedTracks() {
    return this.fetchWithRetry<any>('/liked-tracks');
  }

  // Follow / Unfollow Artist
  async toggleFollowArtist(artistId: string) {
    return this.fetchWithRetry<any>('/follow-artist', {
      method: 'POST',
      body: JSON.stringify({ artistId }),
    });
  }

  // Download / Remove Download
  async toggleDownloadTrack(trackId: string) {
    return this.fetchWithRetry<any>('/download-track', {
      method: 'POST',
      body: JSON.stringify({ trackId }),
    });
  }

  // Record History
    async logHistory(trackId: string) {
    this.logAnalyticsEvent('play', trackId);
    return this.fetchWithRetry<any>('/history', {
      method: 'POST',
      body: JSON.stringify({ trackId }),
    });
  }

  // Smart Ranking Analytics
  async logAnalyticsEvent(event_type: 'search' | 'play' | 'play_completed' | 'click' | 'like', song_id: string) {
    if (!song_id) return;
    return this.fetchWithRetry<any>('/analytics/event', {
      method: 'POST',
      body: JSON.stringify({ event_type, song_id }),
    }).catch(() => {}); // fire and forget
  }
}

export const api = new ApiClient();
