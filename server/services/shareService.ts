import { Track } from '../../src/types';

export interface ShareRecord {
  shareId: string;
  type: 'song' | 'lyrics';
  songId: string;
  title: string;
  artist: string;
  artwork: string;
  album?: string;
  duration?: number;
  lyrics?: string;
  customImageBase64?: string;
  generatedAt: number;
}

const sharesDB = new Map<string, ShareRecord>();
const MAX_SHARES = 10000;

export class ShareService {
  static createShare(data: Omit<ShareRecord, 'shareId' | 'generatedAt'>): ShareRecord {
    // Generate an 8-character secure-looking random string
    const shareId = Math.random().toString(36).substring(2, 10) + Date.now().toString(36).substring(4);
    
    const record: ShareRecord = {
      ...data,
      shareId,
      generatedAt: Date.now(),
    };
    
    if (sharesDB.size >= MAX_SHARES) {
      // Remove oldest entry
      const firstKey = sharesDB.keys().next().value;
      if (firstKey) sharesDB.delete(firstKey);
    }
    
    sharesDB.set(shareId, record);
    return record;
  }

  static getShare(shareId: string): ShareRecord | null {
    return sharesDB.get(shareId) || null;
  }
}
