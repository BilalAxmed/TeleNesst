import React, { useState, useEffect } from 'react';
import {
  autoSaveService,
  AutoSaveState,
} from '../../services/autoSaveService';
import { useApp } from '../../context/AppContext';
import {
  Save,
  Clock,
  Cloud,
  FolderSync,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Download,
  FolderCheck,
  ChevronDown,
  X,
  FileSpreadsheet,
  Layers,
  Sparkles,
} from 'lucide-react';

interface AutoSaveWidgetProps {
  variant?: 'compact' | 'card';
}

export const AutoSaveWidget: React.FC<AutoSaveWidgetProps> = ({ variant = 'compact' }) => {
  const { showToast, currentUser, softwareName } = useApp();
  const [state, setState] = useState<AutoSaveState>(() => autoSaveService.getState());
  const [isOpen, setIsOpen] = useState(false);
  const [isManualSaving, setIsManualSaving] = useState(false);
  const [isConnectingFolder, setIsConnectingFolder] = useState(false);

  useEffect(() => {
    const unsubscribe = autoSaveService.subscribe((newState) => {
      setState(newState);
    });
    return () => unsubscribe();
  }, []);

  const handleManualSaveNow = async () => {
    setIsManualSaving(true);
    try {
      const res = await autoSaveService.triggerSave(true, 'Manual User Save');
      if (res.success) {
        showToast(
          `Daily update work saved manually to ${res.destination} at ${res.timestamp}! (${res.dailyWorksCount} daily logs, ${res.totalRecords} total records)`,
          'success'
        );
      } else {
        showToast(res.message, 'error');
      }
    } catch (e: any) {
      showToast(`Save error: ${e?.message || e}`, 'error');
    } finally {
      setIsManualSaving(false);
    }
  };

  const handleConnectFolder = async () => {
    setIsConnectingFolder(true);
    try {
      const res = await autoSaveService.connectPortableFolder();
      if (res.success) {
        showToast(res.message, 'success');
      } else {
        showToast(res.message, 'info');
      }
    } catch (e: any) {
      showToast(`Folder connection failed: ${e?.message || e}`, 'error');
    } finally {
      setIsConnectingFolder(false);
    }
  };

  const handleDownloadDailyWork = () => {
    autoSaveService.downloadDailyWorksUpdateFile();
    showToast(`Downloaded ${softwareName}_DailyWork_Update.json snapshot!`, 'success');
  };

  const handleDownloadMasterDb = () => {
    autoSaveService.downloadMasterSnapshotFile();
    showToast(`Downloaded ${softwareName}_Database_Master.json backup!`, 'success');
  };

  // Format last saved relative time
  const getLastSavedText = () => {
    if (!state.lastSavedAt) return 'Never saved';
    const diffSeconds = Math.max(0, Math.floor((Date.now() - new Date(state.lastSavedAt).getTime()) / 1000));
    if (diffSeconds < 5) return 'Just now';
    if (diffSeconds < 60) return `${diffSeconds}s ago`;
    const mins = Math.floor(diffSeconds / 60);
    return `${mins}m ago`;
  };

  if (variant === 'compact') {
    return (
      <div className="relative">
        <div className="flex items-center gap-1">
          {/* Main Status Pill */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] border border-[var(--border-main)] text-xs font-semibold text-[var(--text-main)] transition shadow-xs cursor-pointer group"
            title="1-Minute Auto-Save & Manual Sync Status. Click for controls."
          >
            <div className="relative flex items-center justify-center">
              <span
                className={`w-2 h-2 rounded-full ${
                  state.isEnabled ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                }`}
              />
              <span
                className={`absolute w-3.5 h-3.5 rounded-full ${
                  state.isEnabled ? 'bg-emerald-500/30 animate-ping' : ''
                }`}
              />
            </div>

            <div className="flex items-center gap-1.5">
              <Save className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform" />
              <span className="hidden sm:inline">Auto-Save:</span>
              <span className="text-emerald-400 font-mono text-[11px]">
                {state.isEnabled ? `${state.secondsRemaining}s` : 'Paused'}
              </span>
            </div>

            <ChevronDown className="w-3 h-3 text-[var(--text-muted)] group-hover:text-[var(--text-main)] transition" />
          </button>

          {/* Quick Manual Save Action */}
          <button
            onClick={handleManualSaveNow}
            disabled={isManualSaving}
            className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-400 text-xs font-bold transition cursor-pointer shadow-xs disabled:opacity-50"
            title="Manual Save: Save daily update work immediately to Portable Folder & Cloud"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isManualSaving ? 'animate-spin' : ''}`} />
            <span className="hidden lg:inline">Save Now</span>
          </button>
        </div>

        {/* Dropdown Popover */}
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-main)] shadow-2xl p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-[var(--border-light)]">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                    <Save className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[var(--text-main)]">Daily Work Auto-Save Engine</h4>
                    <p className="text-[10px] text-[var(--text-muted)]">
                      Saves every 1 minute to LocalStorage, Portable Folder & Cloud
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 rounded hover:bg-[var(--bg-hover)] text-[var(--text-muted)]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Status Stats */}
              <div className="grid grid-cols-2 gap-2 my-3">
                <div className="p-2 rounded-xl bg-[var(--bg-input)] border border-[var(--border-light)]">
                  <span className="text-[10px] text-[var(--text-muted)] block">Last Saved</span>
                  <span className="text-xs font-bold text-[var(--text-main)] flex items-center gap-1 mt-0.5">
                    <Clock className="w-3 h-3 text-blue-400" />
                    {getLastSavedText()}
                  </span>
                </div>
                <div className="p-2 rounded-xl bg-[var(--bg-input)] border border-[var(--border-light)]">
                  <span className="text-[10px] text-[var(--text-muted)] block">Next 1-Min Auto-Save</span>
                  <span className="text-xs font-bold text-emerald-400 font-mono flex items-center gap-1 mt-0.5">
                    <RefreshCw className="w-3 h-3 text-emerald-400 animate-spin" />
                    in {state.secondsRemaining}s
                  </span>
                </div>
              </div>

              {/* Primary Manual Save Button */}
              <button
                onClick={handleManualSaveNow}
                disabled={isManualSaving}
                className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isManualSaving ? 'Saving Daily Work...' : 'Save Daily Work Manually Now'}</span>
              </button>

              {/* Connect Disk Folder */}
              <div className="mt-3 pt-3 border-t border-[var(--border-light)] space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[var(--text-muted)] flex items-center gap-1.5">
                    <FolderSync className="w-3.5 h-3.5 text-blue-400" />
                    Portable Disk Folder
                  </span>
                  {state.isDiskFolderConnected ? (
                    <span className="text-[11px] text-emerald-400 font-bold flex items-center gap-1">
                      <FolderCheck className="w-3.5 h-3.5" />
                      {state.connectedFolderName}
                    </span>
                  ) : (
                    <button
                      onClick={handleConnectFolder}
                      disabled={isConnectingFolder}
                      className="text-[11px] text-blue-400 hover:underline font-semibold cursor-pointer"
                    >
                      {isConnectingFolder ? 'Connecting...' : 'Link Local Folder'}
                    </button>
                  )}
                </div>

                {/* Cloud Sync Status */}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[var(--text-muted)] flex items-center gap-1.5">
                    <Cloud className="w-3.5 h-3.5 text-sky-400" />
                    Cloud Backup Queue
                  </span>
                  <span className="text-[11px] text-sky-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Live Persistent
                  </span>
                </div>
              </div>

              {/* Quick Downloads */}
              <div className="mt-3 pt-2 border-t border-[var(--border-light)] flex gap-2">
                <button
                  onClick={handleDownloadDailyWork}
                  className="flex-1 py-1.5 px-2 rounded-lg bg-[var(--bg-input)] hover:bg-[var(--bg-hover)] border border-[var(--border-light)] text-[11px] font-semibold text-[var(--text-main)] flex items-center justify-center gap-1 transition"
                  title="Download Daily Work Update JSON"
                >
                  <Download className="w-3 h-3 text-emerald-400" />
                  <span>Daily Work JSON</span>
                </button>
                <button
                  onClick={handleDownloadMasterDb}
                  className="flex-1 py-1.5 px-2 rounded-lg bg-[var(--bg-input)] hover:bg-[var(--bg-hover)] border border-[var(--border-light)] text-[11px] font-semibold text-[var(--text-main)] flex items-center justify-center gap-1 transition"
                  title="Download Master DB JSON"
                >
                  <Download className="w-3 h-3 text-blue-400" />
                  <span>Master DB JSON</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  // Card Variant: For display inside ProjectsModule and Settings
  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-main)] shadow-sm space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--border-light)]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-md">
            <Save className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm sm:text-base text-[var(--text-main)]">
                Daily Update Work & Continuous Auto-Save
              </h3>
              <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                1-Min Cycle Active
              </span>
            </div>
            <p className="text-xs text-[var(--text-muted)]">
              All daily works, fiber telemetry, and inventory changes automatically snapshot every 1 minute and can be manually saved to Portable Folder / Cloud.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleManualSaveNow}
            disabled={isManualSaving}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md hover:shadow-lg transition cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isManualSaving ? 'animate-spin' : ''}`} />
            <span>{isManualSaving ? 'Saving...' : 'Save Manually Now'}</span>
          </button>
        </div>
      </div>

      {/* Progress & Countdown Bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-[var(--text-muted)] flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-emerald-400" />
            <span>Next automatic backup snapshot in:</span>
            <strong className="text-emerald-400 font-mono">{state.secondsRemaining} seconds</strong>
          </span>
          <span className="text-[var(--text-dim)] text-[11px]">
            Last saved: <strong className="text-[var(--text-main)]">{getLastSavedText()}</strong> (Total saves: {state.totalAutoSaves + state.totalManualSaves})
          </span>
        </div>

        {/* Visual Progress Bar */}
        <div className="w-full h-2 rounded-full bg-[var(--bg-input)] overflow-hidden border border-[var(--border-light)]">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-1000 ease-linear rounded-full"
            style={{
              width: `${Math.max(2, ((state.intervalSeconds - state.secondsRemaining) / state.intervalSeconds) * 100)}%`,
            }}
          />
        </div>
      </div>

      {/* Save Destinations & Direct Linking */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        {/* Destination 1: LocalStorage / App Memory */}
        <div className="p-3 rounded-xl bg-[var(--bg-input)] border border-[var(--border-light)] space-y-1">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-[var(--text-main)] flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              1. Offline Storage
            </span>
            <span className="text-[10px] text-emerald-400 font-bold">ACTIVE</span>
          </div>
          <p className="text-[11px] text-[var(--text-muted)]">
            Instant local persistent snapshot with auto-recovery on restart.
          </p>
        </div>

        {/* Destination 2: Local Portable Folder on Disk */}
        <div className="p-3 rounded-xl bg-[var(--bg-input)] border border-[var(--border-light)] space-y-1">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-[var(--text-main)] flex items-center gap-1.5">
              <FolderSync className="w-3.5 h-3.5 text-blue-400" />
              2. Portable Folder
            </span>
            {state.isDiskFolderConnected ? (
              <span className="text-[10px] text-emerald-400 font-bold">LINKED</span>
            ) : (
              <button
                onClick={handleConnectFolder}
                disabled={isConnectingFolder}
                className="text-[10px] text-blue-400 hover:underline font-bold"
              >
                {isConnectingFolder ? 'Linking...' : 'Connect Folder'}
              </button>
            )}
          </div>
          <p className="text-[11px] text-[var(--text-muted)]">
            {state.isDiskFolderConnected
              ? `Directly writes to "${state.connectedFolderName}" on disk.`
              : 'Link local folder for automatic zero-prompt disk saving.'}
          </p>
        </div>

        {/* Destination 3: Cloud Sync */}
        <div className="p-3 rounded-xl bg-[var(--bg-input)] border border-[var(--border-light)] space-y-1">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-[var(--text-main)] flex items-center gap-1.5">
              <Cloud className="w-3.5 h-3.5 text-sky-400" />
              3. Cloud Backup
            </span>
            <span className="text-[10px] text-sky-400 font-bold">SYNC READY</span>
          </div>
          <p className="text-[11px] text-[var(--text-muted)]">
            Maintains cloud backup queue & webhook dispatch payload.
          </p>
        </div>
      </div>

      {/* Manual Export Shortcuts */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[var(--border-light)]">
        <div className="text-xs text-[var(--text-muted)]">
          Manual Exports for USB, Backup Drives, or Cloud Storage:
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadDailyWork}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[var(--bg-hover)] hover:bg-[var(--bg-input)] border border-[var(--border-main)] text-xs font-semibold text-[var(--text-main)] transition"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Download Daily Work Log (.json)</span>
          </button>
          <button
            onClick={handleDownloadMasterDb}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[var(--bg-hover)] hover:bg-[var(--bg-input)] border border-[var(--border-main)] text-xs font-semibold text-[var(--text-main)] transition"
          >
            <Download className="w-3.5 h-3.5 text-blue-400" />
            <span>Download Full Master Database (.json)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
