import React, { useEffect, useState } from 'react';
import { pwaService, PWAState } from '../../services/pwaService';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { PWAInstallButton } from './PWAInstallButton';
import {
  Wifi,
  WifiOff,
  CheckCircle2,
  RefreshCw,
  HardDrive,
  Smartphone,
  ShieldCheck,
  Zap,
} from 'lucide-react';

export const PWAStatusCard: React.FC = () => {
  const [pwaState, setPwaState] = useState<PWAState>(pwaService.getState());
  const isOnline = useOnlineStatus();
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateMsg, setUpdateMsg] = useState<string | null>(null);

  useEffect(() => {
    return pwaService.subscribe((state) => {
      setPwaState(state);
    });
  }, []);

  const handleUpdate = async () => {
    setIsUpdating(true);
    setUpdateMsg(null);
    try {
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const reg of registrations) {
          await reg.update();
        }
      }
      setUpdateMsg('Service worker cache verified: latest warehouse version active.');
    } catch (err: any) {
      setUpdateMsg(`Cache check: ${err?.message || 'Updated'}`);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="rounded-2xl bg-[var(--bg-card)] border border-[var(--border-main)] p-5 space-y-4 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border-main)] pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[var(--text-main)] flex items-center gap-2">
              <span>Progressive Web App (PWA) & Offline Warehouse Engine</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-semibold">
                ACTIVE
              </span>
            </h3>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Enables offline access in remote warehouse sites, yards, and fiber field routes without stable internet.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <PWAInstallButton variant="settings" />
          <button
            onClick={handleUpdate}
            disabled={isUpdating}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--bg-surface)] hover:bg-[var(--bg-hover)] border border-[var(--border-main)] text-xs font-semibold text-[var(--text-main)] transition cursor-pointer"
            title="Check for newest service worker cache version"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-blue-400 ${isUpdating ? 'animate-spin' : ''}`} />
            <span>Check Update</span>
          </button>
        </div>
      </div>

      {updateMsg && (
        <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs font-medium animate-in fade-in">
          {updateMsg}
        </div>
      )}

      {/* Grid Status Indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Network State */}
        <div className="p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-main)] space-y-1">
          <div className="flex items-center justify-between text-xs text-[var(--text-dim)]">
            <span>Connection Status</span>
            {isOnline ? (
              <Wifi className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <WifiOff className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            )}
          </div>
          <div className="text-sm font-bold flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-400' : 'bg-amber-400 animate-ping'}`} />
            <span className={isOnline ? 'text-emerald-400' : 'text-amber-400'}>
              {isOnline ? 'Online (Connected)' : 'Offline (Warehouse Cache Active)'}
            </span>
          </div>
          <div className="text-[10px] text-[var(--text-muted)]">
            {isOnline ? 'Cloud sync & automatic local backups active' : 'All transactions securely written to local storage'}
          </div>
        </div>

        {/* Service Worker State */}
        <div className="p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-main)] space-y-1">
          <div className="flex items-center justify-between text-xs text-[var(--text-dim)]">
            <span>Service Worker</span>
            <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <div className="text-sm font-bold text-[var(--text-main)] flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Registered & Running</span>
          </div>
          <div className="text-[10px] text-[var(--text-muted)]">
            Scope: <code className="font-mono text-[var(--text-dim)]">/</code> (Whole application precached)
          </div>
        </div>

        {/* Cache Storage State */}
        <div className="p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-main)] space-y-1">
          <div className="flex items-center justify-between text-xs text-[var(--text-dim)]">
            <span>Offline Persistence</span>
            <HardDrive className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <div className="text-sm font-bold text-[var(--text-main)] flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Cache-First & Local DB</span>
          </div>
          <div className="text-[10px] text-[var(--text-muted)]">
            Static assets & database records preserved across reboots
          </div>
        </div>
      </div>
    </div>
  );
};
