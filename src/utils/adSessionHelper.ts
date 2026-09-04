export function getHomeAdPosition(): number {
  if (typeof window === 'undefined') return 0;
  try {
    const key = 'spotiz_ad_home_position';
    const stored = sessionStorage.getItem(key);
    if (stored !== null) {
      const parsed = parseInt(stored, 10);
      if (parsed === 0 || parsed === 1) return parsed;
    }
    // Randomly select 0 (Top of feed) or 1 (After 1 content section) for fresh session
    const newPos = Math.random() < 0.5 ? 0 : 1;
    sessionStorage.setItem(key, newPos.toString());
    return newPos;
  } catch {
    return 0;
  }
}
