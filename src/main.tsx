import { suppressYouTubeErrors } from "./utils/errorSuppressor";
suppressYouTubeErrors();

import './polyfill-storage.ts';
import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
console.log('Spotiz PWA Version 2.0.5 Loaded');
import './index.css';
import { ErrorBoundary } from './ErrorBoundary.tsx';

// Capture PWA install prompt globally
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  (window as any).deferredPWAInstallPrompt = e;
  window.dispatchEvent(new Event('pwa-prompt-ready'));
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
