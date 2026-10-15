import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

let isMounted = false;

// Ensure mount executes exactly once whether document is loading or ready
function mount() {
  if (isMounted) return;
  isMounted = true;

  let rootEl = document.getElementById('root');
  if (!rootEl) {
    rootEl = document.createElement('div');
    rootEl.id = 'root';
    if (document.body) {
      document.body.appendChild(rootEl);
    } else {
      document.documentElement.appendChild(rootEl);
    }
  }

  try {
    const root = createRoot(rootEl);
    root.render(
      <StrictMode>
        <App />
      </StrictMode>
    );
  } catch (err: any) {
    console.error('[TeleNest] React mount exception caught:', err);
    if (rootEl) {
      rootEl.innerHTML = `
        <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #090d16; color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 24px;">
          <div style="max-width: 480px; width: 100%; background: #131722; border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 16px; padding: 32px; text-align: center; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);">
            <div style="width: 48px; height: 48px; margin: 0 auto 16px; border-radius: 12px; background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.2); display: flex; align-items: center; justify-content: center; color: #ef4444; font-size: 24px;">⚠️</div>
            <h2 style="font-size: 20px; font-weight: 700; margin: 0 0 8px; color: #ffffff;">TeleNest Startup Shield</h2>
            <p style="font-size: 13px; color: #94a3b8; margin: 0 0 20px; line-height: 1.5;">An unexpected issue was intercepted on boot. You can reload the software to retry initialization.</p>
            <button onclick="window.location.reload()" style="background: #2563eb; color: #ffffff; border: none; padding: 10px 24px; border-radius: 10px; font-weight: 600; font-size: 13px; cursor: pointer; transition: background 0.2s;">
              Reload Application
            </button>
          </div>
        </div>
      `;
    }
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mount);
} else {
  mount();
}

// Safely initialize PWA service worker asynchronously after app mounts
if (typeof window !== 'undefined') {
  setTimeout(() => {
    import('./services/pwaService')
      .then(({ pwaService }) => {
        pwaService?.subscribe((state) => {
          if (state.isOfflineReady) {
            console.log('[TeleNest] Offline mode ready: Assets cached successfully.');
          }
        });
      })
      .catch((err) => {
        console.warn('[TeleNest] PWA registration skipped:', err);
      });
  }, 100);
}
