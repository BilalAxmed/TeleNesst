import React, { useEffect, useState } from 'react';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { WifiOff, Wifi, ShieldCheck, RefreshCw } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();
  const [wasOffline, setWasOffline] = useState(false);
  const [showRestoredNotice, setShowRestoredNotice] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setWasOffline(true);
      setShowRestoredNotice(false);
    } else if (wasOffline) {
      // Transitioned from offline to online
      setShowRestoredNotice(true);
      const timer = setTimeout(() => {
        setShowRestoredNotice(false);
        setWasOffline(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, wasOffline]);

  // Connection Restored banner
  if (showRestoredNotice) {
    return (
      <div
        className="fixed bottom-4 left-4 z-50 flex items-center gap-2.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white shadow-2xl border border-emerald-400/40 animate-in fade-in slide-in-from-bottom-2"
        role="status"
        aria-live="polite"
      >
        <Wifi className="w-4 h-4 text-emerald-200 animate-pulse" />
        <span>Connection Restored — Cloud and local auto-save synchronized.</span>
      </div>
    );
  }

  // Active Offline banner
  if (!isOnline) {
    return (
      <div
        className="fixed bottom-4 left-4 z-50 max-w-md rounded-xl bg-amber-600/95 backdrop-blur-md px-4 py-3 text-xs text-white shadow-2xl border border-amber-400/50 animate-in fade-in slide-in-from-bottom-2 flex items-start gap-3"
        role="alert"
        aria-live="assertive"
      >
        <div className="p-1 rounded-lg bg-black/20 shrink-0 mt-0.5">
          <WifiOff className="w-4 h-4 text-amber-100 animate-pulse" />
        </div>
        <div className="space-y-1">
          <div className="font-bold flex items-center gap-1.5 text-amber-50">
            <span>Remote Warehouse Offline Mode</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-black/30 text-amber-200">
              OFFLINE
            </span>
          </div>
          <p className="text-[11px] text-amber-100 leading-relaxed">
            Operating from local cache without stable internet. Inventory updates, splicing logs, and daily works are safely stored locally.
          </p>
        </div>
      </div>
    );
  }

  return null;
};
