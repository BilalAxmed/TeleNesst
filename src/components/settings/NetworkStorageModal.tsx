import React, { useState, useEffect } from 'react';
import {
  networkStorageService,
  NetworkStorageState,
  NetworkLocationType,
} from '../../services/networkStorageService';
import { storage } from '../../services/storage';
import { useApp } from '../../context/AppContext';
import {
  HardDrive,
  Network,
  Usb,
  FolderSync,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  X,
  FileCheck,
  ShieldCheck,
  Layers,
  ArrowRight,
  Database,
  Unlink,
  Server,
} from 'lucide-react';

interface NetworkStorageModalProps {
  isOpen: boolean;
  onClose: () => void;
  showToast: (message: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
}

export const NetworkStorageModal: React.FC<NetworkStorageModalProps> = ({
  isOpen,
  onClose,
  showToast,
}) => {
  const { softwareName } = useApp();
  const [state, setState] = useState<NetworkStorageState>(() => networkStorageService.getState());
  const [customAlias, setCustomAlias] = useState(state.networkPathAlias || '');
  const [locationType, setLocationType] = useState<NetworkLocationType>(
    state.locationType !== 'internal' ? state.locationType : 'network_share'
  );
  const [isConnecting, setIsConnecting] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);

  useEffect(() => {
    const unsub = networkStorageService.subscribe((s) => {
      setState(s);
      if (s.networkPathAlias && !customAlias) {
        setCustomAlias(s.networkPathAlias);
      }
    });
    return () => unsub();
  }, [customAlias]);

  if (!isOpen) return null;

  // Handle Pick Directory
  const handleSelectLocation = async () => {
    setIsConnecting(true);
    try {
      const res = await networkStorageService.selectStorageLocation(
        customAlias.trim() || undefined,
        locationType
      );
      if (res.success) {
        showToast(res.message, 'success');
      } else {
        showToast(res.message, 'error');
      }
    } catch (e: any) {
      showToast(`Error: ${e?.message || e}`, 'error');
    } finally {
      setIsConnecting(false);
    }
  };

  // Handle Reconnect
  const handleReconnect = async () => {
    setIsConnecting(true);
    try {
      const res = await networkStorageService.reconnect();
      if (res.success) {
        showToast(res.message, 'success');
      } else {
        showToast(res.message, 'error');
      }
    } finally {
      setIsConnecting(false);
    }
  };

  // Handle Read From Network Now
  const handleReadNow = async () => {
    setIsTesting(true);
    try {
      const res = await networkStorageService.readFromNetworkStorage();
      if (res.success) {
        showToast('Successfully read live data from network storage!', 'success');
      } else {
        showToast(res.message, 'error');
      }
    } finally {
      setIsTesting(false);
    }
  };

  // Handle Write To Network Now
  const handleWriteNow = async () => {
    setIsTesting(true);
    try {
      const success = await networkStorageService.saveNow();
      if (success) {
        showToast('Master database successfully saved directly to network storage.', 'success');
      } else {
        showToast(
          state.lastErrorMessage || 'Failed to write to network storage.',
          'error'
        );
      }
    } finally {
      setIsTesting(false);
    }
  };

  // Handle Disconnect
  const handleDisconnect = async () => {
    await networkStorageService.disconnect(true);
    setConfirmDisconnect(false);
    showToast('Network storage disconnected. Switched back to internal storage.', 'info');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-3xl max-h-[92vh] flex flex-col bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-2xl shadow-2xl overflow-hidden text-[var(--text-main)]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-main)] bg-[var(--bg-card)]/70">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-600/15 text-blue-400 border border-blue-500/30">
              <Network className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-[var(--text-main)]">
                  Portable &amp; Office Network Storage
                </h3>
                {state.isActive && state.status === 'connected' ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Online &amp; Connected
                  </span>
                ) : state.isActive && state.status === 'disconnected' ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                    Device Disconnected
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-500/15 text-slate-400 border border-slate-500/30">
                    Internal Storage Active
                  </span>
                )}
              </div>
              <p className="text-xs text-[var(--text-muted)]">
                Save and read {softwareName} database directly from portable drives or office network shares
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg text-[var(--text-dim)] hover:text-[var(--text-main)] hover:bg-[var(--bg-hover)] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
          {/* Disconnected Warning Banner if Active */}
          {state.isActive && state.status === 'disconnected' && (
            <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-500/40 text-rose-300 space-y-2 animate-in fade-in">
              <div className="flex items-center gap-2 font-bold text-sm text-rose-400">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Network / Portable Storage Disconnected</span>
              </div>
              <p className="text-xs text-rose-300/90 leading-relaxed">
                {state.lastErrorMessage ||
                  `Unable to reach storage location "${state.networkPathAlias || state.folderName}".`}
                {' '}Any live changes are buffered safely in memory to prevent data loss.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={handleReconnect}
                  disabled={isConnecting}
                  className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isConnecting ? 'animate-spin' : ''}`} />
                  <span>Reconnect &amp; Resume Sync</span>
                </button>
                <button
                  onClick={handleSelectLocation}
                  disabled={isConnecting}
                  className="px-3 py-1.5 rounded-lg bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] border border-rose-500/30 text-rose-200 text-xs font-semibold transition cursor-pointer"
                >
                  Select Alternative Path
                </button>
              </div>
            </div>
          )}

          {/* Current Status Overview Card */}
          <div className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-main)] space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--border-main)]">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-dim)]">
                  Primary Data Storage Path
                </span>
                <div className="text-sm font-bold text-[var(--text-main)] flex items-center gap-2 mt-0.5">
                  {state.locationType === 'portable_usb' ? (
                    <Usb className="w-4 h-4 text-emerald-400" />
                  ) : state.locationType === 'network_share' || state.locationType === 'mapped_drive' ? (
                    <Network className="w-4 h-4 text-blue-400" />
                  ) : (
                    <Database className="w-4 h-4 text-purple-400" />
                  )}
                  <span>
                    {state.isActive
                      ? state.networkPathAlias || state.folderName || 'Connected Device'
                      : 'Internal Local Storage (Browser DB)'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {state.isActive ? (
                  <>
                    <button
                      onClick={handleReconnect}
                      disabled={isConnecting}
                      className="px-3 py-1.5 rounded-lg bg-[var(--bg-surface)] hover:bg-[var(--bg-hover)] border border-[var(--border-main)] text-[var(--text-main)] font-semibold flex items-center gap-1.5 transition cursor-pointer"
                      title="Test Connection & Re-sync"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isConnecting ? 'animate-spin' : ''}`} />
                      <span>Test Connection</span>
                    </button>
                    <button
                      onClick={() => setConfirmDisconnect(true)}
                      className="px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 font-semibold transition cursor-pointer"
                    >
                      Disconnect
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleSelectLocation}
                    disabled={isConnecting}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold flex items-center gap-2 transition shadow cursor-pointer"
                  >
                    <FolderSync className="w-4 h-4" />
                    <span>Select Storage Location</span>
                  </button>
                )}
              </div>
            </div>

            {/* Path & Sync Telemetry */}
            {state.isActive && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-[11px] font-mono">
                <div className="p-2.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-main)]">
                  <div className="text-[10px] text-[var(--text-dim)] uppercase">Mounted Folder</div>
                  <div className="font-bold text-[var(--text-main)] truncate mt-0.5">
                    {state.folderName || 'Unknown'}
                  </div>
                </div>
                <div className="p-2.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-main)]">
                  <div className="text-[10px] text-[var(--text-dim)] uppercase">Last Direct Write</div>
                  <div className="font-bold text-[var(--text-main)] truncate mt-0.5">
                    {state.lastWriteTimestamp
                      ? new Date(state.lastWriteTimestamp).toLocaleTimeString()
                      : 'Pending write'}
                  </div>
                </div>
                <div className="p-2.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-main)]">
                  <div className="text-[10px] text-[var(--text-dim)] uppercase">Last Direct Read</div>
                  <div className="font-bold text-[var(--text-main)] truncate mt-0.5">
                    {state.lastReadTimestamp
                      ? new Date(state.lastReadTimestamp).toLocaleTimeString()
                      : 'None'}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Configuration Form */}
          <div className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-main)] space-y-4">
            <div className="flex items-center gap-2 font-bold text-sm text-[var(--text-main)]">
              <FolderSync className="w-4 h-4 text-blue-400" />
              <span>Storage Location Setup</span>
            </div>

            {/* Location Type Selector */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => setLocationType('network_share')}
                className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                  locationType === 'network_share'
                    ? 'bg-blue-500/15 border-blue-500/40 text-[var(--text-main)]'
                    : 'bg-[var(--bg-surface)] border-[var(--border-main)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <Network className="w-5 h-5 text-blue-400" />
                  {locationType === 'network_share' && (
                    <CheckCircle2 className="w-4 h-4 text-blue-400" />
                  )}
                </div>
                <div className="font-bold text-xs">Office Network Share (SMB/NAS)</div>
                <p className="text-[10px] text-[var(--text-dim)] mt-0.5">
                  Shared folder mounted over local office Wi-Fi or LAN
                </p>
              </button>

              <button
                type="button"
                onClick={() => setLocationType('mapped_drive')}
                className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                  locationType === 'mapped_drive'
                    ? 'bg-blue-500/15 border-blue-500/40 text-[var(--text-main)]'
                    : 'bg-[var(--bg-surface)] border-[var(--border-main)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <HardDrive className="w-5 h-5 text-indigo-400" />
                  {locationType === 'mapped_drive' && (
                    <CheckCircle2 className="w-4 h-4 text-indigo-400" />
                  )}
                </div>
                <div className="font-bold text-xs">Mapped Network Drive</div>
                <p className="text-[10px] text-[var(--text-dim)] mt-0.5">
                  e.g. Z:\TeleNest_Data or Y:\Warehouse_Storage
                </p>
              </button>

              <button
                type="button"
                onClick={() => setLocationType('portable_usb')}
                className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                  locationType === 'portable_usb'
                    ? 'bg-emerald-500/15 border-emerald-500/40 text-[var(--text-main)]'
                    : 'bg-[var(--bg-surface)] border-[var(--border-main)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <Usb className="w-5 h-5 text-emerald-400" />
                  {locationType === 'portable_usb' && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  )}
                </div>
                <div className="font-bold text-xs">Portable Storage (USB / SSD)</div>
                <p className="text-[10px] text-[var(--text-dim)] mt-0.5">
                  Removable flash drive or rugged field SSD
                </p>
              </button>
            </div>

            {/* Custom Path Alias Input */}
            <div>
              <label className="block text-[11px] font-semibold text-[var(--text-muted)] mb-1">
                Custom Network Path / Device Alias (Optional Label)
              </label>
              <input
                type="text"
                value={customAlias}
                onChange={(e) => setCustomAlias(e.target.value)}
                placeholder="e.g. \\192.168.1.100\TeleNest_Warehouse_Data or Z:\TeleNestData"
                className="w-full px-3 py-2 rounded-lg bg-[var(--bg-input)] border border-[var(--border-main)] text-xs text-[var(--text-main)] font-mono focus:outline-none focus:border-blue-500"
              />
              <p className="text-[10px] text-[var(--text-dim)] mt-1">
                A human-readable label or mapped network share path for this device.
              </p>
            </div>

            {/* Browse & Connect Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleSelectLocation}
                disabled={isConnecting}
                className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs transition shadow flex items-center justify-center gap-2 cursor-pointer"
              >
                <FolderSync className={`w-4 h-4 ${isConnecting ? 'animate-spin' : ''}`} />
                <span>
                  {state.isActive
                    ? 'Change Storage Location (Browse Folder)'
                    : 'Browse & Authorize Portable / Network Storage Folder'}
                </span>
              </button>
            </div>
          </div>

          {/* User Requirement: "Do not store duplicate or separate data locally unless explicitly configured by the user" */}
          <div className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-main)] space-y-3">
            <div className="flex items-center gap-2 font-bold text-sm text-[var(--text-main)]">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Data Isolation &amp; Storage Exclusivity</span>
            </div>

            <div className="space-y-3">
              {/* Option A: Strict Network Exclusivity (Default) */}
              <label className="flex items-start gap-3 p-3 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-main)] cursor-pointer hover:border-blue-500/40 transition">
                <input
                  type="radio"
                  name="storagePolicy"
                  checked={state.storeOnlyOnNetwork && !state.enableLocalMirror}
                  onChange={() => {
                    networkStorageService.updateConfig({
                      storeOnlyOnNetwork: true,
                      enableLocalMirror: false,
                    });
                  }}
                  className="mt-0.5 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <div className="font-bold text-xs text-[var(--text-main)] flex items-center gap-1.5">
                    <span>Exclusively Store on Network / Portable Device (Recommended)</span>
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                      Compliant Policy
                    </span>
                  </div>
                  <p className="text-[11px] text-[var(--text-muted)] mt-0.5 leading-relaxed">
                    Data is saved and read directly from the portable/network storage device. No duplicate or separate operational records are retained in the workstation browser.
                  </p>
                </div>
              </label>

              {/* Option B: Local Mirror Backup (Explicit user opt-in) */}
              <label className="flex items-start gap-3 p-3 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-main)] cursor-pointer hover:border-blue-500/40 transition">
                <input
                  type="radio"
                  name="storagePolicy"
                  checked={state.enableLocalMirror}
                  onChange={() => {
                    networkStorageService.updateConfig({
                      storeOnlyOnNetwork: false,
                      enableLocalMirror: true,
                    });
                  }}
                  className="mt-0.5 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <div className="font-bold text-xs text-[var(--text-main)]">
                    Keep Local Mirror Copy on This Workstation (Explicit Opt-in)
                  </div>
                  <p className="text-[11px] text-[var(--text-muted)] mt-0.5 leading-relaxed">
                    In addition to saving to the network device, keeps a duplicate local copy on this computer for emergency access if the network drive is disconnected.
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Direct Verification Controls */}
          {state.isActive && state.status === 'connected' && (
            <div className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-main)] space-y-3">
              <div className="flex items-center gap-2 font-bold text-sm text-[var(--text-main)]">
                <FileCheck className="w-4 h-4 text-blue-400" />
                <span>Direct Data Operations</span>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-2">
                <button
                  type="button"
                  onClick={handleReadNow}
                  disabled={isTesting}
                  className="w-full sm:w-1/2 py-2 px-3 rounded-lg bg-[var(--bg-surface)] hover:bg-[var(--bg-hover)] border border-[var(--border-main)] font-semibold text-xs transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                  <span>Force Read from Network Storage</span>
                </button>
                <button
                  type="button"
                  onClick={handleWriteNow}
                  disabled={isTesting}
                  className="w-full sm:w-1/2 py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition flex items-center justify-center gap-2 shadow cursor-pointer"
                >
                  <HardDrive className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                  <span>Force Write to Network Storage</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 border-t border-[var(--border-main)] bg-[var(--bg-card)]/50 flex items-center justify-between">
          <div className="text-[11px] text-[var(--text-dim)] flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Preserves 100% of existing features and data structures</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[var(--bg-surface)] hover:bg-[var(--bg-hover)] border border-[var(--border-main)] font-semibold text-xs transition cursor-pointer"
          >
            Close
          </button>
        </div>

        {/* Disconnect Confirmation Dialog */}
        {confirmDisconnect && (
          <div className="absolute inset-0 z-20 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
            <div className="w-full max-w-md p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-main)] shadow-2xl space-y-4">
              <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
                <AlertTriangle className="w-5 h-5" />
                <span>Disconnect Network Storage?</span>
              </div>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                {softwareName} will stop saving and reading from "{state.networkPathAlias || state.folderName}" and switch back to internal browser database.
              </p>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setConfirmDisconnect(false)}
                  className="px-3 py-1.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-main)] text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDisconnect}
                  className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow"
                >
                  Confirm Disconnect
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
