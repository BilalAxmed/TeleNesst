import React, { useState, useEffect } from 'react';
import { cloudSyncService } from '../../services/cloudSyncService';
import { CloudSyncState } from '../../types';
import {
  Cloud,
  CloudCheck,
  CloudOff,
  RefreshCw,
  AlertCircle,
  Check,
  Lock,
} from 'lucide-react';
import { CloudSyncModal } from './CloudSyncModal';

export const CloudSyncWidget: React.FC = () => {
  const [syncState, setSyncState] = useState<CloudSyncState>(() => cloudSyncService.getState());
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const unsub = cloudSyncService.subscribe((state) => {
      setSyncState(state);
    });
    return () => unsub();
  }, []);

  // Determine badge appearance
  let icon = <Cloud className="w-3.5 h-3.5 text-slate-400" />;
  let label = 'Offline Mode';
  let badgeClass = 'text-[var(--text-muted)] border-[var(--border-main)] hover:border-blue-500/40';

  if (!syncState.isOnline) {
    icon = <CloudOff className="w-3.5 h-3.5 text-amber-400" />;
    label = syncState.pendingChangesCount > 0 ? `${syncState.pendingChangesCount} Pending` : 'Offline';
    badgeClass = 'text-amber-400 border-amber-500/30 bg-amber-500/10';
  } else if (syncState.status === 'syncing') {
    icon = <RefreshCw className="w-3.5 h-3.5 text-blue-400 animate-spin" />;
    label = 'Syncing...';
    badgeClass = 'text-blue-400 border-blue-500/40 bg-blue-500/10';
  } else if (syncState.isAuthenticated && syncState.user) {
    if (syncState.pendingChangesCount > 0) {
      icon = <Cloud className="w-3.5 h-3.5 text-amber-400" />;
      label = `${syncState.pendingChangesCount} Pending`;
      badgeClass = 'text-amber-400 border-amber-500/30 bg-amber-500/10';
    } else {
      icon = <CloudCheck className="w-3.5 h-3.5 text-emerald-400" />;
      label = 'Cloud Synced';
      badgeClass = 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
    }
  } else {
    // Offline-only mode (not signed in to cloud sync)
    icon = <Cloud className="w-3.5 h-3.5 text-blue-400/80" />;
    label = 'Cloud Sync';
    badgeClass = 'text-[var(--text-muted)] border-[var(--border-main)] bg-[var(--bg-card)]';
  }

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition text-xs font-semibold cursor-pointer shadow-xs ${badgeClass}`}
        title={
          syncState.isAuthenticated && syncState.user
            ? `Cloud Sync: Authenticated as ${syncState.user.email} (${label})`
            : 'Cloud Sync: Click to connect Google Account or Cloud ID (Currently Offline-Only Mode)'
        }
      >
        {icon}
        <span className="hidden xl:inline">{label}</span>
        {syncState.pendingChangesCount > 0 && (
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping shrink-0" />
        )}
      </button>

      <CloudSyncModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
};
