import { Track } from '../types';

const DB_NAME = 'SpotizOfflineStorageDB';
const DB_VERSION = 1;

const STORES = {
  TRACKS: 'downloaded_tracks',
  AUDIO_BLOBS: 'audio_blobs',
  ARTWORK_BLOBS: 'artwork_blobs',
};

export interface OfflineTrackRecord {
  id: string;
  track: Track;
  downloadedAt: number;
  sizeBytes: number;
}

export interface OfflineAudioRecord {
  id: string;
  blob: Blob;
  mimeType: string;
  sizeBytes: number;
}

class OfflineStorageManager {
  private dbPromise: Promise<IDBDatabase> | null = null;

  private isIDBAvailable(): boolean {
    return typeof window !== 'undefined' && 'indexedDB' in window && window.indexedDB !== null;
  }

  private getDB(): Promise<IDBDatabase> {
    if (!this.isIDBAvailable()) {
      return Promise.reject(new Error('IndexedDB is not available in this environment'));
    }

    if (this.dbPromise) {
      return this.dbPromise;
    }

    this.dbPromise = new Promise((resolve, reject) => {
      try {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
          const db = (event.target as IDBOpenDBRequest).result;
          if (!db.objectStoreNames.contains(STORES.TRACKS)) {
            db.createObjectStore(STORES.TRACKS, { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains(STORES.AUDIO_BLOBS)) {
            db.createObjectStore(STORES.AUDIO_BLOBS, { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains(STORES.ARTWORK_BLOBS)) {
            db.createObjectStore(STORES.ARTWORK_BLOBS, { keyPath: 'id' });
          }
        };

        request.onsuccess = () => {
          resolve(request.result);
        };

        request.onerror = () => {
          console.warn('[OfflineStorage] Error opening IndexedDB:', request.error);
          this.dbPromise = null;
          reject(request.error || new Error('Could not open offline database'));
        };

        request.onblocked = () => {
          console.warn('[OfflineStorage] IndexedDB blocked by other tab');
        };
      } catch (err) {
        this.dbPromise = null;
        reject(err);
      }
    });

    return this.dbPromise;
  }

  /**
   * Save complete track metadata and binary audio blob into IndexedDB
   */
  async saveOfflineTrack(track: Track, audioBlob: Blob, artworkBlob?: Blob | null): Promise<void> {
    try {
      const db = await this.getDB();
      const sizeBytes = audioBlob.size;

      const trackRecord: OfflineTrackRecord = {
        id: track.id,
        track: {
          ...track,
          // Ensure offline flag / local indicator
          streamUrl: track.streamUrl || '',
        },
        downloadedAt: Date.now(),
        sizeBytes,
      };

      const audioRecord: OfflineAudioRecord = {
        id: track.id,
        blob: audioBlob,
        mimeType: audioBlob.type || 'audio/mp4',
        sizeBytes,
      };

      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction([STORES.TRACKS, STORES.AUDIO_BLOBS], 'readwrite');
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error || new Error('Transaction aborted'));

        const tracksStore = tx.objectStore(STORES.TRACKS);
        const audioStore = tx.objectStore(STORES.AUDIO_BLOBS);

        tracksStore.put(trackRecord);
        audioStore.put(audioRecord);
      });

      // Save artwork if provided
      if (artworkBlob && artworkBlob.size > 0) {
        try {
          const artTx = db.transaction([STORES.ARTWORK_BLOBS], 'readwrite');
          artTx.objectStore(STORES.ARTWORK_BLOBS).put({
            id: track.id,
            blob: artworkBlob,
            mimeType: artworkBlob.type || 'image/jpeg',
          });
        } catch (e) {
          // Artwork caching is non-blocking
        }
      }
    } catch (err) {
      console.warn('[OfflineStorage] Failed to save track in IndexedDB:', err);
      // Also cache in CacheStorage as fallback
      if ('caches' in window) {
        try {
          const cache = await caches.open('spotify-offline-audio');
          const cacheRes = new Response(audioBlob, {
            headers: {
              'Content-Type': audioBlob.type || 'audio/mp4',
              'Content-Length': String(audioBlob.size),
            },
          });
          await cache.put(`offline-track://${track.id}`, cacheRes);
        } catch (cErr) {
          console.warn('[OfflineStorage] Fallback CacheStorage write failed:', cErr);
        }
      }
    }
  }

  /**
   * Retrieve audio Blob for offline playback
   */
  async getOfflineAudioBlob(trackId: string): Promise<Blob | null> {
    if (!trackId) return null;

    try {
      const db = await this.getDB();
      const audioRecord = await new Promise<OfflineAudioRecord | null>((resolve, reject) => {
        const tx = db.transaction([STORES.AUDIO_BLOBS], 'readonly');
        const store = tx.objectStore(STORES.AUDIO_BLOBS);
        const req = store.get(trackId);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => reject(req.error);
      });

      if (audioRecord && audioRecord.blob && audioRecord.blob.size > 0) {
        return audioRecord.blob;
      }
    } catch (err) {
      console.warn('[OfflineStorage] IndexedDB read failed, trying CacheStorage fallback:', err);
    }

    // Fallback: Check CacheStorage
    if (typeof window !== 'undefined' && 'caches' in window) {
      try {
        const cache = await caches.open('spotify-offline-audio');
        const cachedRes = await cache.match(`offline-track://${trackId}`);
        if (cachedRes) {
          const blob = await cachedRes.blob();
          if (blob && blob.size > 0) {
            return blob;
          }
        }
      } catch (cErr) {
        // ignore
      }
    }

    return null;
  }

  /**
   * Retrieve single track metadata
   */
  async getOfflineTrack(trackId: string): Promise<Track | null> {
    if (!trackId) return null;

    try {
      const db = await this.getDB();
      const record = await new Promise<OfflineTrackRecord | null>((resolve, reject) => {
        const tx = db.transaction([STORES.TRACKS], 'readonly');
        const store = tx.objectStore(STORES.TRACKS);
        const req = store.get(trackId);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => reject(req.error);
      });

      return record ? record.track : null;
    } catch (err) {
      return null;
    }
  }

  /**
   * Retrieve all saved offline tracks
   */
  async getAllOfflineTracks(): Promise<Track[]> {
    try {
      const db = await this.getDB();
      const records = await new Promise<OfflineTrackRecord[]>((resolve, reject) => {
        const tx = db.transaction([STORES.TRACKS], 'readonly');
        const store = tx.objectStore(STORES.TRACKS);
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
      });

      return records.map((r) => r.track);
    } catch (err) {
      console.warn('[OfflineStorage] Failed to get all offline tracks:', err);
      return [];
    }
  }

  /**
   * Check if track is cached offline
   */
  async isOfflineTrackCached(trackId: string): Promise<boolean> {
    if (!trackId) return false;
    const blob = await this.getOfflineAudioBlob(trackId);
    return blob !== null && blob.size > 0;
  }

  /**
   * Remove single downloaded track and its audio blob
   */
  async removeOfflineTrack(trackId: string): Promise<void> {
    if (!trackId) return;

    try {
      const db = await this.getDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction([STORES.TRACKS, STORES.AUDIO_BLOBS, STORES.ARTWORK_BLOBS], 'readwrite');
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
        tx.objectStore(STORES.TRACKS).delete(trackId);
        tx.objectStore(STORES.AUDIO_BLOBS).delete(trackId);
        tx.objectStore(STORES.ARTWORK_BLOBS).delete(trackId);
      });
    } catch (err) {
      console.warn('[OfflineStorage] Error removing track from IndexedDB:', err);
    }

    if (typeof window !== 'undefined' && 'caches' in window) {
      try {
        const cache = await caches.open('spotify-offline-audio');
        await cache.delete(`offline-track://${trackId}`);
      } catch (e) {
        // ignore
      }
    }
  }

  /**
   * Delete all offline tracks and wipe audio store
   */
  async clearAllOfflineData(): Promise<void> {
    try {
      const db = await this.getDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction([STORES.TRACKS, STORES.AUDIO_BLOBS, STORES.ARTWORK_BLOBS], 'readwrite');
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
        tx.objectStore(STORES.TRACKS).clear();
        tx.objectStore(STORES.AUDIO_BLOBS).clear();
        tx.objectStore(STORES.ARTWORK_BLOBS).clear();
      });
    } catch (err) {
      console.warn('[OfflineStorage] Error clearing IndexedDB:', err);
    }

    if (typeof window !== 'undefined' && 'caches' in window) {
      try {
        await caches.delete('spotify-offline-audio');
      } catch (e) {
        // ignore
      }
    }
  }

  /**
   * Get storage statistics
   */
  async getOfflineStorageMetrics(): Promise<{ count: number; totalBytes: number }> {
    try {
      const db = await this.getDB();
      const records = await new Promise<OfflineTrackRecord[]>((resolve, reject) => {
        const tx = db.transaction([STORES.TRACKS], 'readonly');
        const store = tx.objectStore(STORES.TRACKS);
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
      });

      const totalBytes = records.reduce((acc, r) => acc + (r.sizeBytes || 0), 0);
      return { count: records.length, totalBytes };
    } catch (err) {
      return { count: 0, totalBytes: 0 };
    }
  }
}

export const offlineStorage = new OfflineStorageManager();
