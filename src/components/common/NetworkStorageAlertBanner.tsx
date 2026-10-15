import React, { useState, useEffect } from 'react';
import { networkStorageService, NetworkStorageState } from '../../services/networkStorageService';
import { AlertTriangle, RefreshCw, Network, X, ArrowRight } from 'lucide-react';
import { NetworkStorageModal } from '../settings/NetworkStorageModal';

interface NetworkStorageAlertBannerProps {
  onOpenSettings?: () => void;
  showToast?: (message: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
}

export const NetworkStorageAlertBanner: React.FC<NetworkStorageAlertBannerProps> = ({
  onOpenSettings,
  showToast,
}) => {
  const [state, setState] = useState<NetworkStorageState>(() => networkStorageService.getState());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const unsub = networkStorageService.subscribe((s) => {
      setState(s);
      if (s.status === 'connected') {
        setIsDismissed(false);
      }
    });
    return () => unsub();
  }, []);

  // Only render if network storage is configured as active and is disconnected or error
  if (!state.isActive || state.status === 'connected' || state.status === 'idle' || isDismissed) {
    return (
      <>
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

  const handleReconnect = async () => {
    setIsReconnecting(true);
    try {
      const res = await networkStorageService.reconnect();
      if (showToast) {
        showToast(res.message, res.success ? 'success' : 'error');
      }
    } finally {
      setIsReconnecting(false);
    }
  };

  return (
    <>
      <div className="w-full bg-rose-950/90 border-b border-rose-500/50 text-rose-200 px-4 py-2.5 shadow-md flex flex-col sm:flex-row items-center justify-between gap-3 animate-in slide-in-from-top text-xs z-40">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30 shrink-0">
            <AlertTriangle className="w-4 h-4 animate-bounce" />
          </div>
          <div className="min-w-0">
            <div className="font-bold text-rose-100 flex items-center gap-1.5 flex-wrap">
              <span>Network Storage Device Unavailable:</span>
              <span className="font-mono text-[11px] px-1.5 py-0.2 rounded bg-rose-900/60 border border-rose-500/30 text-rose-300">
                {state.networkPathAlias || state.folderName || 'Selected Path'}
              </span>
            </div>
            <p className="text-[11px] text-rose-300/80 truncate">
              {state.lastErrorMessage ||
                'Network connection dropped or portable device unplugged. Data modifications are held safely in memory.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
          <button
            onClick={handleReconnect}
            disabled={isReconnecting}
            className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 shadow transition cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isReconnecting ? 'animate-spin' : ''}`} />
            <span>Reconnect</span>
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="px-3 py-1.5 rounded-lg bg-black/40 hover:bg-black/60 border border-rose-500/30 text-rose-200 text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
          >
            <Network className="w-3.5 h-3.5 text-rose-300" />
            <span>Change Path</span>
          </button>

          <button
            onClick={() => setIsDismissed(true)}
            className="p-1.5 rounded-lg text-rose-400 hover:text-rose-100 hover:bg-rose-900/40 transition cursor-pointer"
            title="Dismiss temporary banner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

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
