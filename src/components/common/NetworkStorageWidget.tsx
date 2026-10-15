import React, { useState, useEffect } from 'react';
import { networkStorageService, NetworkStorageState } from '../../services/networkStorageService';
import { Network, Usb, AlertTriangle, CheckCircle2, RefreshCw } from 'lucide-react';
import { NetworkStorageModal } from '../settings/NetworkStorageModal';

interface NetworkStorageWidgetProps {
  showToast?: (message: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
}

export const NetworkStorageWidget: React.FC<NetworkStorageWidgetProps> = ({ showToast }) => {
  const [state, setState] = useState<NetworkStorageState>(() => networkStorageService.getState());
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const unsub = networkStorageService.subscribe((s) => setState(s));
    return () => unsub();
  }, []);

  if (!state.isActive) {
    return (
      <>
        <button
          onClick={() => setIsModalOpen(true)}
          className="hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[var(--border-main)] bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] text-[var(--text-muted)] hover:text-blue-400 text-xs font-semibold transition cursor-pointer"
          title="Configure Portable or Office Network Storage"
        >
          <Network className="w-3.5 h-3.5 text-blue-400" />
          <span>Network Drive</span>
        </button>

        {isModalOpen && (
          <NetworkStorageModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            showToast={showToast || (() => {})}
          />
        )}
      </>
    );
  }

  // Determine badge appearance when active
  let badgeClass = 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
  let icon = <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />;
  let label = 'Office Network';

  if (state.status === 'disconnected') {
    badgeClass = 'text-rose-400 border-rose-500/40 bg-rose-500/15 animate-pulse';
    icon = <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />;
    label = 'Drive Offline';
  } else if (state.status === 'checking') {
    badgeClass = 'text-blue-400 border-blue-500/30 bg-blue-500/10';
    icon = <RefreshCw className="w-3.5 h-3.5 text-blue-400 animate-spin" />;
    label = 'Checking...';
  } else if (state.locationType === 'portable_usb') {
    label = 'Portable USB';
    icon = <Usb className="w-3.5 h-3.5 text-emerald-400" />;
  }

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition text-xs font-semibold cursor-pointer shadow-xs ${badgeClass}`}
        title={`Storage Location: ${state.networkPathAlias || state.folderName || 'Connected'}. Click to configure.`}
      >
        {icon}
        <span className="hidden sm:inline font-mono text-[11px]">{label}</span>
      </button>

      {isModalOpen && (
        <NetworkStorageModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          showToast={showToast || (() => {})}
        />
      )}
    </>
  );
};
