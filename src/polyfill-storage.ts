// Polyfill for localStorage and sessionStorage when blocked (e.g. in iframes with 3rd party cookies disabled)
const memoryStorage = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = String(value); },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
    get length() { return Object.keys(store).length; },
    key: (index: number) => Object.keys(store)[index] || null
  };
})();

try {
  // Test if localStorage is accessible
  const testKey = '__test_storage__';
  window.localStorage.setItem(testKey, testKey);
  window.localStorage.removeItem(testKey);
} catch (e) {
  console.warn('localStorage is not available, falling back to memory storage', e);
  // Override localStorage and sessionStorage
  Object.defineProperty(window, 'localStorage', { value: memoryStorage, writable: true, configurable: true });
  Object.defineProperty(window, 'sessionStorage', { value: memoryStorage, writable: true, configurable: true });
}
