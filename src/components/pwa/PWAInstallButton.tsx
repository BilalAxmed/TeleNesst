import React, { useState } from 'react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { useApp } from '../../context/AppContext';
import { Download, Smartphone, Share, PlusSquare, X, CheckCircle2 } from 'lucide-react';

interface PWAInstallButtonProps {
  variant?: 'navbar' | 'sidebar' | 'card' | 'settings';
  className?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  variant = 'navbar',
  className = '',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const { softwareName } = useApp();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  // If running in standalone mode (already installed), do not show install prompt
  if (isInstalled) {
    if (variant === 'settings' || variant === 'card') {
      return (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{softwareName} PWA is installed and running standalone</span>
        </div>
      );
    }
    return null;
  }

  const handleInstallClick = async () => {
    setIsInstalling(true);
    try {
      await install();
    } finally {
      setIsInstalling(false);
    }
  };

  // Chromium / Desktop / Android flow
  const renderInstallButton = () => {
    if (variant === 'navbar') {
      return (
        <button
          onClick={handleInstallClick}
          disabled={isInstalling}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-xs cursor-pointer ${className}`}
          title={`Install ${softwareName} Progressive Web App for offline warehouse use`}
          id="btn-navbar-install-pwa"
        >
          <Download className="w-3.5 h-3.5 animate-bounce" />
          <span className="hidden sm:inline">Install App</span>
        </button>
      );
    }

    if (variant === 'sidebar') {
      return (
        <button
          onClick={handleInstallClick}
          disabled={isInstalling}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl bg-blue-600/15 hover:bg-blue-600/25 border border-blue-500/30 text-blue-300 text-xs font-semibold transition text-left cursor-pointer ${className}`}
          id="btn-sidebar-install-pwa"
        >
          <Smartphone className="w-4 h-4 text-blue-400 shrink-0" />
          <div className="flex-1 truncate">
            <div className="font-bold text-[var(--text-main)]">Install {softwareName} PWA</div>
            <div className="text-[10px] text-[var(--text-muted)]">Offline warehouse app</div>
          </div>
          <Download className="w-3.5 h-3.5 text-blue-400 shrink-0" />
        </button>
      );
    }

    // Default card or settings variant
    return (
      <button
        onClick={handleInstallClick}
        disabled={isInstalling}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow cursor-pointer ${className}`}
        id="btn-settings-install-pwa"
      >
        <Download className="w-4 h-4" />
        <span>Install Desktop / Mobile App</span>
      </button>
    );
  };

  // iOS Safari flow
  const renderIOSButton = () => {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] border border-[var(--border-main)] text-xs font-semibold text-[var(--text-main)] transition cursor-pointer ${className}`}
          title={`Add ${softwareName} to iPhone / iPad Home Screen`}
          id="btn-ios-install-pwa"
        >
          <Smartphone className="w-3.5 h-3.5 text-blue-400" />
          <span>Install on iOS</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in">
            <div className="w-full max-w-sm rounded-2xl bg-[var(--bg-card)] border border-[var(--border-main)] p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-[var(--border-main)] pb-3">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-blue-400" />
                  <h3 className="text-sm font-bold text-[var(--text-main)]">Install {softwareName} on iOS</h3>
                </div>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface)] transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs text-[var(--text-muted)]">
                <p>To use {softwareName} offline in warehouse locations on your iPhone or iPad:</p>
                <div className="flex items-start gap-3 p-2.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-main)]">
                  <Share className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                  <span>
                    1. Tap the <strong>Share</strong> button in Safari's bottom toolbar.
                  </span>
                </div>
                <div className="flex items-start gap-3 p-2.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-main)]">
                  <PlusSquare className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    2. Scroll down and tap <strong>Add to Home Screen</strong>.
                  </span>
                </div>
                <div className="flex items-start gap-3 p-2.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-main)]">
                  <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                  <span>
                    3. Tap <strong>Add</strong> in the top-right corner. {softwareName} will launch in full standalone mode with offline caching.
                  </span>
                </div>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition cursor-pointer"
              >
                Got It
              </button>
            </div>
          </div>
        )}
      </>
    );
  };

  if (isInstallable) {
    return renderInstallButton();
  }

  if (isIOS) {
    return renderIOSButton();
  }

  // If in settings/card view and not yet promptable, provide informational indicator
  if (variant === 'settings' || variant === 'card') {
    return (
      <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
        <Smartphone className="w-4 h-4 text-blue-400" />
        <span>PWA Ready — Available via browser install icon or shortcut</span>
      </div>
    );
  }

  return null;
};
