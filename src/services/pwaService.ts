export interface PWAState {
  isRegistered: boolean;
  isOfflineReady: boolean;
  needRefresh: boolean;
  registration: ServiceWorkerRegistration | null;
}

type PWAStateListener = (state: PWAState) => void;

class PWAService {
  private state: PWAState = {
    isRegistered: false,
    isOfflineReady: false,
    needRefresh: false,
    registration: null,
  };

  private listeners: Set<PWAStateListener> = new Set();
  private updateFn: ((reloadPage?: boolean) => Promise<void>) | null = null;

  constructor() {
    this.init();
  }

  private init() {
    if (typeof window === 'undefined') {
      return;
    }

    // Detect if running inside an iframe (such as AI Studio preview iframe)
    try {
      const isIframe = window.self !== window.top;
      if (isIframe) {
        console.log('[TeleNest PWA] Running inside preview iframe; Service Worker registration bypassed.');
        this.state.isOfflineReady = true;
        this.notify();
        return;
      }
    } catch {
      // Accessing window.top can throw cross-origin SecurityError in nested iframes
      console.log('[TeleNest PWA] Cross-origin iframe detected; skipping Service Worker.');
      this.state.isOfflineReady = true;
      this.notify();
      return;
    }

    if (!('serviceWorker' in navigator)) {
      return;
    }

    // Attempt dynamic virtual:pwa-register import without breaking build or runtime
    import(/* @vite-ignore */ 'virtual:pwa-register')
      .then((mod) => {
        if (mod && typeof mod.registerSW === 'function') {
          this.updateFn = mod.registerSW({
            immediate: true,
            onNeedRefresh: () => {
              this.state.needRefresh = true;
              this.notify();
              console.log('[TeleNest PWA] New version detected; ready for update.');
            },
            onOfflineReady: () => {
              this.state.isOfflineReady = true;
              this.notify();
              console.log('[TeleNest PWA] Service Worker active: TeleNest is offline-ready for remote warehouses.');
            },
            onRegistered: (registration: any) => {
              this.state.isRegistered = true;
              this.state.registration = registration || null;
              this.notify();
              console.log('[TeleNest PWA] Registered scope:', registration?.scope);
            },
            onRegisterError: (error: any) => {
              console.warn('[TeleNest PWA] Service Worker registration failed with virtual import:', error);
              this.fallbackRegister();
            },
          });
        } else {
          this.fallbackRegister();
        }
      })
      .catch((err) => {
        console.warn('[TeleNest PWA] Virtual pwa-register unavailable in this context, using native fallback:', err);
        this.fallbackRegister();
      });
  }

  private fallbackRegister() {
    try {
      if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
          try {
            navigator.serviceWorker
              .register('/sw.js', { scope: '/' })
              .then((registration) => {
                this.state.isRegistered = true;
                this.state.registration = registration;
                this.state.isOfflineReady = true;
                this.notify();
                console.log('[TeleNest PWA] Fallback service worker registered at:', registration.scope);
              })
              .catch((err) => {
                console.warn('[TeleNest PWA] Fallback registration error:', err);
              });
          } catch (e) {
            console.warn('[TeleNest PWA] Fallback registration skipped:', e);
          }
        });
      }
    } catch (e) {
      console.warn('[TeleNest PWA] Service worker access error:', e);
    }
  }

  public subscribe(listener: PWAStateListener): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach((l) => l({ ...this.state }));
  }

  public getState(): PWAState {
    return { ...this.state };
  }

  public async updateNow(): Promise<void> {
    if (this.updateFn) {
      await this.updateFn(true);
    } else if (this.state.registration?.waiting) {
      this.state.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  }
}

export const pwaService = new PWAService();
