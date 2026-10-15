import React, { useState, useEffect } from 'react';
import {
  cloudSyncService,
} from '../../services/cloudSyncService';
import { CloudSyncState } from '../../types';
import { useApp } from '../../context/AppContext';
import {
  Cloud,
  CloudCheck,
  CloudOff,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Shield,
  Lock,
  LogOut,
  User,
  ArrowRight,
  Clock,
  Database,
  Layers,
  X,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Laptop,
} from 'lucide-react';

interface CloudSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CloudSyncModal: React.FC<CloudSyncModalProps> = ({ isOpen, onClose }) => {
  const { showToast, softwareName } = useApp();
  const [syncState, setSyncState] = useState<CloudSyncState>(() => cloudSyncService.getState());
  const [isSyncing, setIsSyncing] = useState(false);
  const [activeTab, setActiveTab] = useState<'sync' | 'conflicts' | 'security'>('sync');

  // Form inputs for custom sign-in
  const [googleEmail, setGoogleEmail] = useState('bilalaxmed.47@gmail.com');
  const [customCloudId, setCustomCloudId] = useState('');
  const [authMode, setAuthMode] = useState<'google' | 'cloud_id'>('google');
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  useEffect(() => {
    const unsub = cloudSyncService.subscribe((state) => {
      setSyncState(state);
    });
    return () => unsub();
  }, []);

  if (!isOpen) return null;

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      const res = await cloudSyncService.syncNow(true);
      if (res.success) {
        showToast(res.message, 'success');
      } else {
        showToast(res.message, 'error');
      }
    } catch (e: any) {
      showToast(`Sync failed: ${e?.message || e}`, 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSignInGoogle = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsAuthenticating(true);
    try {
      const res = await cloudSyncService.signInWithGoogle(googleEmail, 'Bilal Ahmed');
      if (res.success) {
        showToast(res.message, 'success');
      } else {
        showToast(res.message, 'error');
      }
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleSignInCloudId = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customCloudId.trim()) {
      showToast('Please enter a valid Cloud ID', 'error');
      return;
    }
    setIsAuthenticating(true);
    try {
      const res = await cloudSyncService.signInWithCloudId(customCloudId);
      if (res.success) {
        showToast(res.message, 'success');
        setCustomCloudId('');
      } else {
        showToast(res.message, 'error');
      }
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleSignOut = async () => {
    const res = await cloudSyncService.signOut();
    showToast(res.message, 'info');
  };

  // Format last sync display
  const getLastSyncFormatted = () => {
    if (!syncState.lastSyncTime) return 'Never synced';
    const date = new Date(syncState.lastSyncTime);
    return `${date.toLocaleDateString()} at ${date.toLocaleTimeString()}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-2xl rounded-2xl bg-[var(--bg-card)] border border-[var(--border-main)] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-[var(--border-main)] bg-[var(--bg-surface)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md ${
                syncState.isAuthenticated
                  ? 'bg-gradient-to-tr from-blue-600 to-cyan-500'
                  : 'bg-gradient-to-tr from-slate-600 to-slate-500'
              }`}
            >
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[var(--text-main)]">
                  Secure Cloud Sync Center
                </h2>
                {syncState.isOnline ? (
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Online
                  </span>
                ) : (
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    Offline Mode
                  </span>
                )}
              </div>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                Offline-first data replication with Google Account & Cloud ID synchronization
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-[var(--bg-hover)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-5 border-b border-[var(--border-main)] bg-[var(--bg-surface)]/50 flex gap-2 pt-2">
          <button
            onClick={() => setActiveTab('sync')}
            className={`pb-2.5 px-3 text-xs font-bold transition border-b-2 flex items-center gap-1.5 ${
              activeTab === 'sync'
                ? 'border-[var(--accent)] text-[var(--text-main)]'
                : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            <Cloud className="w-3.5 h-3.5" />
            <span>Sync & Identity</span>
          </button>
          <button
            onClick={() => setActiveTab('conflicts')}
            className={`pb-2.5 px-3 text-xs font-bold transition border-b-2 flex items-center gap-1.5 ${
              activeTab === 'conflicts'
                ? 'border-[var(--accent)] text-[var(--text-main)]'
                : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Conflict Log ({syncState.conflicts.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`pb-2.5 px-3 text-xs font-bold transition border-b-2 flex items-center gap-1.5 ${
              activeTab === 'security'
                ? 'border-[var(--accent)] text-[var(--text-main)]'
                : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Credential Security</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 overflow-y-auto flex-1 space-y-5 text-xs">
          {activeTab === 'sync' && (
            <>
              {/* Authenticated State */}
              {syncState.isAuthenticated && syncState.user ? (
                <div className="space-y-4">
                  {/* Identity Card */}
                  <div className="p-4 rounded-xl bg-[var(--bg-surface)] border border-blue-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <img
                          src={
                            syncState.user.avatarUrl ||
                            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
                          }
                          alt="Cloud User"
                          className="w-12 h-12 rounded-xl object-cover border-2 border-blue-400 shadow-md"
                        />
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold shadow">
                          G
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-[var(--text-main)]">
                            {syncState.user.name}
                          </span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-bold border border-blue-500/30">
                            {syncState.user.provider === 'google' ? 'Google Account' : 'Cloud ID'}
                          </span>
                        </div>
                        <div className="text-[11px] text-[var(--text-muted)] font-mono">
                          {syncState.user.email}
                        </div>
                        <div className="text-[10px] text-emerald-400 flex items-center gap-1 mt-0.5">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Cloud Identity Active &bull; ID: {syncState.user.cloudId}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={handleSignOut}
                      className="px-3 py-1.5 rounded-lg bg-[var(--bg-card)] hover:bg-red-500/20 text-[var(--text-muted)] hover:text-red-400 border border-[var(--border-main)] transition flex items-center gap-1.5 self-start sm:self-auto font-semibold"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Disconnect</span>
                    </button>
                  </div>

                  {/* Sync Status Card */}
                  <div className="p-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-main)] space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="font-bold text-[var(--text-main)]">Synchronization Status</div>
                        <div className="text-[11px] text-[var(--text-muted)] flex items-center gap-1.5 mt-0.5">
                          <Clock className="w-3.5 h-3.5 text-blue-400" />
                          <span>Last Synced: {getLastSyncFormatted()}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 self-start sm:self-auto">
                        <button
                          onClick={handleManualSync}
                          disabled={isSyncing || !syncState.isOnline}
                          className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold transition shadow flex items-center gap-2 cursor-pointer"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                          <span>{isSyncing ? 'Synchronizing...' : 'Sync Now'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Pending Queue Indicator */}
                    <div className="pt-2 border-t border-[var(--border-main)] flex items-center justify-between text-[11px]">
                      <span className="text-[var(--text-muted)]">Local Changes Pending Upload:</span>
                      <span
                        className={`font-mono font-bold px-2 py-0.5 rounded ${
                          syncState.pendingChangesCount > 0
                            ? 'bg-amber-500/20 text-amber-300'
                            : 'bg-emerald-500/10 text-emerald-400'
                        }`}
                      >
                        {syncState.pendingChangesCount} pending mutation(s)
                      </span>
                    </div>

                    {/* Auto-Sync Switch */}
                    <div className="pt-2 border-t border-[var(--border-main)] flex items-center justify-between">
                      <div>
                        <span className="font-semibold text-[var(--text-main)]">
                          Automatic Background Synchronization
                        </span>
                        <p className="text-[10px] text-[var(--text-muted)]">
                          Synchronizes changes automatically on network reconnect and periodic heartbeat
                        </p>
                      </div>
                      <button
                        onClick={() => cloudSyncService.setAutoSync(!syncState.autoSync)}
                        className={`px-3 py-1 rounded-full text-[10px] font-bold font-mono transition ${
                          syncState.autoSync
                            ? 'bg-emerald-600 text-white'
                            : 'bg-[var(--bg-input)] text-[var(--text-muted)] border border-[var(--border-main)]'
                        }`}
                      >
                        {syncState.autoSync ? 'ENABLED' : 'DISABLED'}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* Offline-Only / Sign-In Required */
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-gradient-to-br from-[var(--bg-surface)] to-[var(--bg-card)] border border-[var(--border-main)]">
                    <div className="flex items-start gap-3">
                      <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 shrink-0">
                        <CloudOff className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-[var(--text-main)]">
                          Currently Operating in Offline-Only Mode
                        </h3>
                        <p className="text-[11px] text-[var(--text-muted)] mt-1 leading-relaxed">
                          All software features, warehouse inventories, daily field activities, and reports are working completely offline without an internet connection. If you want to synchronize across multiple Windows PCs or backup securely to your cloud profile, authenticate below.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Provider Tabs */}
                  <div className="p-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-main)] space-y-4">
                    <div className="flex items-center gap-2 border-b border-[var(--border-main)] pb-3">
                      <button
                        type="button"
                        onClick={() => setAuthMode('google')}
                        className={`px-3 py-1.5 rounded-lg font-bold text-xs transition flex items-center gap-1.5 ${
                          authMode === 'google'
                            ? 'bg-blue-600 text-white'
                            : 'bg-[var(--bg-card)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
                        }`}
                      >
                        <span className="font-bold text-xs">G</span>
                        <span>Sign In with Google Account</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setAuthMode('cloud_id')}
                        className={`px-3 py-1.5 rounded-lg font-bold text-xs transition flex items-center gap-1.5 ${
                          authMode === 'cloud_id'
                            ? 'bg-blue-600 text-white'
                            : 'bg-[var(--bg-card)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
                        }`}
                      >
                        <Cloud className="w-3.5 h-3.5" />
                        <span>Use {softwareName} Cloud ID</span>
                      </button>
                    </div>

                    {authMode === 'google' ? (
                      <form onSubmit={handleSignInGoogle} className="space-y-3">
                        <div>
                          <label className="block text-[11px] font-semibold text-[var(--text-muted)] mb-1">
                            Google Account Email
                          </label>
                          <input
                            type="email"
                            value={googleEmail}
                            onChange={(e) => setGoogleEmail(e.target.value)}
                            required
                            placeholder="user@gmail.com"
                            className="w-full px-3 py-2 rounded-lg bg-[var(--bg-input)] border border-[var(--border-main)] text-[var(--text-main)] font-mono text-xs"
                          />
                        </div>
                        <div className="flex items-center justify-between pt-1">
                          <span className="text-[10px] text-[var(--text-dim)]">
                            One-click authenticated session for developer & team
                          </span>
                          <button
                            type="submit"
                            disabled={isAuthenticating}
                            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold transition flex items-center gap-1.5 shadow"
                          >
                            <span className="font-bold">G</span>
                            <span>{isAuthenticating ? 'Connecting...' : 'Connect Google Cloud ID'}</span>
                          </button>
                        </div>
                      </form>
                    ) : (
                      <form onSubmit={handleSignInCloudId} className="space-y-3">
                        <div>
                          <label className="block text-[11px] font-semibold text-[var(--text-muted)] mb-1">
                            Enterprise {softwareName} Cloud ID
                          </label>
                          <input
                            type="text"
                            value={customCloudId}
                            onChange={(e) => setCustomCloudId(e.target.value)}
                            required
                            placeholder="e.g. telenest_depot_north_01"
                            className="w-full px-3 py-2 rounded-lg bg-[var(--bg-input)] border border-[var(--border-main)] text-[var(--text-main)] font-mono text-xs"
                          />
                        </div>
                        <div className="flex items-center justify-between pt-1">
                          <span className="text-[10px] text-[var(--text-dim)]">
                            Custom private node synchronization identifier
                          </span>
                          <button
                            type="submit"
                            disabled={isAuthenticating}
                            className="px-4 py-2 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-50 text-white font-bold transition flex items-center gap-1.5 shadow"
                          >
                            <Cloud className="w-3.5 h-3.5" />
                            <span>{isAuthenticating ? 'Connecting...' : 'Connect Cloud ID'}</span>
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Conflict Log Tab */}
          {activeTab === 'conflicts' && (
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-main)] flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-[var(--text-main)]">
                    Conflict Resolution & Deduplication Ledger
                  </h3>
                  <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                    Deterministic entity reconciliation engine: newer timestamp takes precedence with zero data loss.
                  </p>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 font-bold border border-blue-500/20">
                  {syncState.conflicts.length} Reconciled
                </span>
              </div>

              {syncState.conflicts.length === 0 ? (
                <div className="p-8 rounded-xl bg-[var(--bg-surface)]/50 border border-dashed border-[var(--border-main)] text-center">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-80" />
                  <p className="font-bold text-sm text-[var(--text-main)]">
                    No Data Conflicts Detected
                  </p>
                  <p className="text-xs text-[var(--text-muted)] mt-1 max-w-sm mx-auto">
                    All local inventory items, stock movements, fiber records, and project files are in complete synchronization without duplicates.
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto">
                  {syncState.conflicts.map((cf) => (
                    <div
                      key={cf.id}
                      className="p-3 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-main)] flex items-start justify-between gap-3 text-[11px]"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[var(--text-main)]">
                            [{cf.entityType}] {cf.itemName || cf.entityId}
                          </span>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold ${
                              cf.resolution === 'LOCAL_PRESERVED'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                            }`}
                          >
                            {cf.resolution === 'LOCAL_PRESERVED' ? 'LOCAL KEPT' : 'CLOUD APPLIED'}
                          </span>
                        </div>
                        <p className="text-[var(--text-muted)] mt-1">{cf.details}</p>
                      </div>
                      <span className="text-[10px] font-mono text-[var(--text-dim)] shrink-0">
                        {new Date(cf.localTime).toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shrink-0">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-emerald-300">
                      Zero Credential Exposure Guarantee
                    </h3>
                    <p className="text-[11px] text-[var(--text-muted)] mt-1 leading-relaxed">
                      {softwareName} implements strict local credential sanitation. Before any cloud payload is compiled or transmitted, user password hashes, PIN codes, security answers, and authentication tokens are programmatically stripped.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-main)]">
                  <div className="font-bold text-[var(--text-main)] flex items-center gap-1.5 mb-1 text-xs">
                    <Lock className="w-3.5 h-3.5 text-blue-400" />
                    <span>Protected Elements (Never Synced)</span>
                  </div>
                  <ul className="text-[11px] text-[var(--text-muted)] space-y-1 pl-4 list-disc">
                    <li>Account password hashes (<code className="text-blue-300">passwordHash</code>)</li>
                    <li>Quick-login 4-digit PIN codes (<code className="text-blue-300">pin</code>)</li>
                    <li>Security recovery answers (<code className="text-blue-300">securityAnswers</code>)</li>
                    <li>Private session secret tokens</li>
                  </ul>
                </div>

                <div className="p-3.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-main)]">
                  <div className="font-bold text-[var(--text-main)] flex items-center gap-1.5 mb-1 text-xs">
                    <Database className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Synchronized Operational Data</span>
                  </div>
                  <ul className="text-[11px] text-[var(--text-muted)] space-y-1 pl-4 list-disc">
                    <li>Warehouse inventory stock balances & SKUs</li>
                    <li>Stock in/out/dispatch movements ledger</li>
                    <li>FTTH/FTTB/FTTM fiber site logs</li>
                    <li>Turnkey projects & milestones</li>
                    <li>Fleet fuel & cash expenses</li>
                  </ul>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-[var(--bg-surface)]/60 border border-[var(--border-main)] text-[11px] text-[var(--text-dim)] flex items-center gap-2">
                <Laptop className="w-4 h-4 text-blue-400 shrink-0" />
                <span>Compatible with Windows 11, 10, 8.1, and 7 portable offline deployment packages.</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[var(--border-main)] bg-[var(--bg-surface)] flex items-center justify-between">
          <div className="text-[11px] text-[var(--text-muted)] flex items-center gap-1">
            <span>Mode:</span>
            <span className="font-bold text-[var(--text-main)]">
              {syncState.isAuthenticated ? 'Cloud Synchronized' : 'Offline-Only'}
            </span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] border border-[var(--border-main)] text-[var(--text-main)] font-bold text-xs transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
