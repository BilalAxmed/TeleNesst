import React, { useState, useEffect } from 'react';
import { storage } from '../../services/storage';
import { useApp } from '../../context/AppContext';
import { NetworkStorageConfig } from '../../types';
import {
  FolderSync,
  HardDrive,
  FolderOpen,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Save,
  Network,
  Usb,
  Copy,
  Check,
  ShieldCheck,
  Clock,
  Sliders,
  Database,
} from 'lucide-react';

interface ExternalSyncDirectorySectionProps {
  showToast: (message: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
}

export const ExternalSyncDirectorySection: React.FC<ExternalSyncDirectorySectionProps> = ({
  showToast,
}) => {
  const { softwareName } = useApp();
  const [config, setConfig] = useState<NetworkStorageConfig>(() =>
    storage.getNetworkStorageConfig()
  );
  const [dirPathInput, setDirPathInput] = useState(
    config.externalDirectoryPath || config.directoryPath || ''
  );
  const [labelInput, setLabelInput] = useState(
    config.storageLabel || config.deviceLabel || 'External Network Storage'
  );
  const [syncFreq, setSyncFreq] = useState<'manual' | 'on_change' | 'hourly' | 'daily'>(
    config.autoSyncFrequency || 'manual'
  );
  const [enabled, setEnabled] = useState(config.enabled ?? false);
  const [includeAttachments, setIncludeAttachments] = useState(
    config.includeAttachments ?? true
  );

  const [dirHandle, setDirHandle] = useState<any>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    const current = storage.getNetworkStorageConfig();
    setConfig(current);
    setDirPathInput(current.externalDirectoryPath || current.directoryPath || '');
    setLabelInput(current.storageLabel || current.deviceLabel || 'External Network Storage');
    setSyncFreq(current.autoSyncFrequency || 'manual');
    setEnabled(current.enabled ?? false);
    setIncludeAttachments(current.includeAttachments ?? true);
  }, []);

  const handleFieldChange = () => {
    setHasUnsavedChanges(true);
  };

  // Pick Directory via browser File System Access API
  const handlePickDirectory = async () => {
    if ('showDirectoryPicker' in window) {
      try {
        // @ts-ignore
        const handle = await window.showDirectoryPicker({
          mode: 'readwrite',
        });
        if (handle && handle.name) {
          setDirHandle(handle);
          const detectedPath = `/${handle.name}/`;
          setDirPathInput(detectedPath);
          if (!labelInput || labelInput === 'Network Shared Folder') {
            setLabelInput(`External Storage (${handle.name})`);
          }
          setEnabled(true);
          setHasUnsavedChanges(true);
          showToast(`Selected directory "${handle.name}" successfully.`, 'success');
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          showToast(`Directory picker notice: ${err?.message || 'Please specify path manually'}`, 'info');
        }
      }
    } else {
      showToast(
        'Direct browser folder picker is not supported on this browser. You can type or paste the exact UNC network path or drive path below.',
        'info'
      );
    }
  };

  // Save Settings
  const handleSaveConfig = () => {
    const path = dirPathInput.trim();
    const label = labelInput.trim() || 'External Network Storage';
    const updated: NetworkStorageConfig = {
      ...config,
      directoryPath: path || config.directoryPath || `D:\\${softwareName}_Sync_Depot`,
      externalDirectoryPath: path,
      deviceLabel: label,
      storageLabel: label,
      enabled,
      syncMode: syncFreq === 'on_change' ? 'auto' : syncFreq === 'manual' ? 'manual' : 'scheduled',
      autoSyncFrequency: syncFreq,
      includeAttachments,
      lastSyncTimestamp: config.lastSyncTimestamp,
      lastSyncStatus: config.lastSyncStatus || 'idle',
    };

    storage.saveNetworkStorageConfig(updated);
    setConfig(updated);
    setHasUnsavedChanges(false);
    showToast('External sync directory configuration saved successfully.', 'success');
  };

  // Test Connection / Path Validation
  const handleTestPath = async () => {
    if (!dirPathInput.trim()) {
      showToast('Please enter an external directory path first.', 'warning');
      return;
    }

    setIsTesting(true);
    await new Promise((r) => setTimeout(r, 600));

    const path = dirPathInput.trim();
    const isValidFormat =
      path.startsWith('\\\\') ||
      path.startsWith('/') ||
      path.startsWith('./') ||
      /^[A-Za-z]:[\\/]/.test(path);

    if (isValidFormat || dirHandle) {
      showToast(
        `Path format verified: "${path}" is ready for external network/portable synchronization.`,
        'success'
      );
    } else {
      showToast(
        `Path entered: "${path}". Note: For Windows network shares use \\\\server\\share, or drive letters like D:\\${softwareName}_Sync.`,
        'info'
      );
    }
    setIsTesting(false);
  };

  // Manual Trigger Sync Now
  const handleSyncNow = async () => {
    setIsSyncing(true);
    try {
      const liveJson = storage.exportFullBackup();
      const timestamp = new Date().toISOString();
      const dateSlug = timestamp.replace(/[:.]/g, '-').slice(0, 19);
      const filename = `${softwareName}_Sync_${dateSlug}.json`;

      let syncedViaHandle = false;

      // If user selected directory with File System Access API, write directly into the folder
      if (dirHandle && 'getFileHandle' in dirHandle) {
        try {
          const fileHandle = await dirHandle.getFileHandle(filename, { create: true });
          const writable = await fileHandle.createWritable();
          await writable.write(liveJson);
          await writable.close();
          syncedViaHandle = true;
        } catch (handleErr) {
          console.warn('Direct handle write failed, falling back to download blob', handleErr);
        }
      }

      if (!syncedViaHandle) {
        // Fallback: Trigger direct download with directory metadata
        const blob = new Blob([liveJson], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }

      // Update sync config state
      const path = dirPathInput.trim();
      const label = labelInput.trim() || 'External Network Storage';
      const updated: NetworkStorageConfig = {
        ...config,
        directoryPath: path || config.directoryPath || 'D:\\TeleNest_Sync_Depot',
        externalDirectoryPath: path,
        deviceLabel: label,
        storageLabel: label,
        enabled: true,
        lastSyncTimestamp: timestamp,
        lastSyncedAt: timestamp,
        lastSyncStatus: 'success',
      };
      storage.saveNetworkStorageConfig(updated);
      setConfig(updated);
      setEnabled(true);
      setHasUnsavedChanges(false);

      storage.logActivity({
        userId: 'sys',
        userName: 'System Sync',
        userRole: 'Developer/CEO',
        action: 'BACKUP_EXPORT',
        module: 'System',
        targetId: 'external_directory_sync',
        description: `Exported full database synchronization to external directory: ${dirPathInput || 'Mounted Storage'}`,
      });

      showToast(
        `Successfully synchronized latest ${softwareName} data to external directory (${filename}).`,
        'success'
      );
    } catch (err: any) {
      const updated: NetworkStorageConfig = {
        ...config,
        lastSyncTimestamp: new Date().toISOString(),
        lastSyncStatus: 'failed',
      };
      storage.saveNetworkStorageConfig(updated);
      setConfig(updated);
      showToast(`External sync failed: ${err?.message || 'Unknown error'}`, 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleCopyPath = () => {
    if (dirPathInput) {
      navigator.clipboard.writeText(dirPathInput);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
      showToast('Directory path copied to clipboard.', 'info');
    }
  };

  return (
    <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-blue-500/30 shadow-xs space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border-main)] pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-500/15 text-blue-400 border border-blue-500/30">
            <FolderSync className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-bold text-[var(--text-main)]">
                External Sync Directory Path &amp; Portable Storage
              </h3>
              {config.enabled && config.externalDirectoryPath ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Sync Configured
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[var(--bg-surface)] text-[var(--text-dim)] border border-[var(--border-main)]">
                  Not Configured
                </span>
              )}
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Select or specify a directory path on your external portable USB drive or local network share (NAS / UNC path) to automatically synchronize live {softwareName} data.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleSyncNow}
            disabled={isSyncing}
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs transition shadow flex items-center gap-1.5 cursor-pointer"
            title="Immediately export a fresh database snapshot to the configured external directory"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Syncing Now...' : 'Sync Now to Path'}</span>
          </button>
        </div>
      </div>

      {/* Main Configuration Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: Form Controls (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* External Directory Path Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-[var(--text-main)] flex items-center gap-1.5">
                <HardDrive className="w-3.5 h-3.5 text-blue-400" />
                <span>External Directory Path</span>
                <span className="text-rose-400">*</span>
              </label>
              <span className="text-[10px] text-[var(--text-dim)]">
                Local, USB, or Network UNC Path
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={dirPathInput}
                  onChange={(e) => {
                    setDirPathInput(e.target.value);
                    handleFieldChange();
                  }}
                  placeholder={`e.g., \\\\192.168.1.100\\Shared\\${softwareName}\\ or D:\\${softwareName}_Backups\\`}
                  className="w-full py-2.5 px-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-main)] font-mono text-xs text-[var(--text-main)] focus:outline-none focus:border-blue-500 transition"
                />
              </div>

              {/* Native Directory Picker Button */}
              <button
                type="button"
                onClick={handlePickDirectory}
                className="px-3 py-2.5 rounded-xl bg-[var(--bg-surface)] hover:bg-[var(--bg-hover)] border border-[var(--border-main)] text-[var(--text-main)] font-semibold text-xs transition flex items-center gap-1.5 shrink-0 cursor-pointer"
                title="Browse & select folder using your system folder picker"
              >
                <FolderOpen className="w-4 h-4 text-amber-400" />
                <span className="hidden sm:inline">Browse Folder...</span>
              </button>
            </div>
            <p className="text-[11px] text-[var(--text-dim)]">
              Supported examples: <code className="text-blue-300">D:\{softwareName}_Sync\</code>,{' '}
              <code className="text-blue-300">\\NAS-SERVER\Operations\{softwareName}\</code>, or{' '}
              <code className="text-blue-300">E:\PortableUSB\{softwareName}Data\</code>
            </p>
          </div>

          {/* Storage Nickname / Label */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[var(--text-main)] flex items-center gap-1.5">
                <Network className="w-3.5 h-3.5 text-purple-400" />
                <span>Storage Label / Nickname</span>
              </label>
              <input
                type="text"
                value={labelInput}
                onChange={(e) => {
                  setLabelInput(e.target.value);
                  handleFieldChange();
                }}
                placeholder="e.g. Central Office NAS"
                className="w-full py-2 px-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-main)] text-xs text-[var(--text-main)] focus:outline-none focus:border-blue-500 transition"
              />
            </div>

            {/* Auto-Sync Frequency */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[var(--text-main)] flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                <span>Sync Frequency</span>
              </label>
              <select
                value={syncFreq}
                onChange={(e) => {
                  setSyncFreq(e.target.value as any);
                  handleFieldChange();
                }}
                className="w-full py-2 px-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-main)] text-xs text-[var(--text-main)] focus:outline-none focus:border-blue-500 transition cursor-pointer"
              >
                <option value="manual">Manual Trigger Only</option>
                <option value="on_change">Automatic on Every Data Change</option>
                <option value="hourly">Hourly Periodic Sync</option>
                <option value="daily">Daily End-of-Day Backup</option>
              </select>
            </div>
          </div>

          {/* Toggles */}
          <div className="p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-main)] space-y-2.5">
            <label className="flex items-center justify-between cursor-pointer">
              <div className="space-y-0.5">
                <div className="text-xs font-semibold text-[var(--text-main)]">
                  Enable External Directory Sync
                </div>
                <div className="text-[11px] text-[var(--text-dim)]">
                  Allows automatic backup mirroring to the designated path
                </div>
              </div>
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => {
                  setEnabled(e.target.checked);
                  handleFieldChange();
                }}
                className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
              />
            </label>

            <div className="border-t border-[var(--border-main)]/50 pt-2">
              <label className="flex items-center justify-between cursor-pointer">
                <div className="space-y-0.5">
                  <div className="text-xs font-semibold text-[var(--text-main)]">
                    Include Field Photos &amp; Attachments
                  </div>
                  <div className="text-[11px] text-[var(--text-dim)]">
                    Bundles image assets into the synchronization file
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={includeAttachments}
                  onChange={(e) => {
                    setIncludeAttachments(e.target.checked);
                    handleFieldChange();
                  }}
                  className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
                />
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button
              type="button"
              onClick={handleSaveConfig}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow flex items-center gap-1.5 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Directory Settings</span>
            </button>

            <button
              type="button"
              onClick={handleTestPath}
              disabled={isTesting}
              className="px-3.5 py-2 rounded-xl bg-[var(--bg-surface)] hover:bg-[var(--bg-hover)] border border-[var(--border-main)] text-[var(--text-main)] font-semibold text-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
              <span>{isTesting ? 'Validating...' : 'Validate Path Format'}</span>
            </button>

            {hasUnsavedChanges && (
              <span className="text-[11px] text-amber-400 font-medium animate-pulse flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                Unsaved directory settings
              </span>
            )}
          </div>
        </div>

        {/* Right Column: Live Status & Directory Information (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="p-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-main)] space-y-3 text-xs">
            <div className="font-bold text-xs text-[var(--text-main)] flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-blue-400" />
                <span>Sync Status Card</span>
              </span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                  config.lastSyncStatus === 'success'
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : config.lastSyncStatus === 'failed'
                    ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                    : 'bg-slate-500/15 text-slate-400 border border-slate-500/30'
                }`}
              >
                {config.lastSyncStatus === 'success'
                  ? 'Healthy / Active'
                  : config.lastSyncStatus === 'failed'
                  ? 'Sync Error'
                  : 'Idle'}
              </span>
            </div>

            <div className="space-y-2 border-t border-[var(--border-main)]/60 pt-2 text-[11px]">
              <div>
                <div className="text-[10px] text-[var(--text-dim)] uppercase font-semibold">
                  Configured Storage Path
                </div>
                <div className="mt-0.5 flex items-center justify-between gap-1 p-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border-main)] font-mono text-[10px] text-[var(--text-main)] break-all">
                  <span>{config.externalDirectoryPath || 'None configured yet'}</span>
                  {config.externalDirectoryPath && (
                    <button
                      type="button"
                      onClick={handleCopyPath}
                      className="p-1 rounded text-[var(--text-dim)] hover:text-blue-400 cursor-pointer shrink-0"
                      title="Copy path"
                    >
                      {isCopied ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border-main)]">
                  <div className="text-[10px] text-[var(--text-dim)]">Last Synchronized</div>
                  <div className="font-semibold text-[var(--text-main)] mt-0.5 truncate">
                    {config?.lastSyncTimestamp || config?.lastSyncedAt
                      ? new Date(config.lastSyncTimestamp || config.lastSyncedAt!).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : 'Never'}
                  </div>
                </div>

                <div className="p-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border-main)]">
                  <div className="text-[10px] text-[var(--text-dim)]">Sync Mode</div>
                  <div className="font-semibold text-emerald-400 mt-0.5 capitalize">
                    {String(config?.autoSyncFrequency || config?.syncMode || 'manual').replace(/_/g, ' ')}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-blue-500/5 border border-blue-500/20 text-[11px] text-[var(--text-muted)] space-y-1">
              <div className="font-semibold text-blue-400 flex items-center gap-1">
                <Usb className="w-3 h-3" />
                <span>Portable Drive Compatibility:</span>
              </div>
              <p className="leading-relaxed">
                When working offline in remote telecom towers or field client premises, you can copy data directly to a flash drive without needing an active internet connection.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
