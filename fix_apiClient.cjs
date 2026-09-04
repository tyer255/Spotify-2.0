const fs = require('fs');
let code = fs.readFileSync('src/services/apiClient.ts', 'utf8');

// strip everything after logHistory block
const target = "async logHistory(trackId: string) {";
const index = code.lastIndexOf(target);

let newCode = code.substring(0, index);
newCode += `  async logHistory(trackId: string) {
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
`;
fs.writeFileSync('src/services/apiClient.ts', newCode);
