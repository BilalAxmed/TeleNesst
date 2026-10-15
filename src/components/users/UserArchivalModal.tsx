import React, { useState, useMemo } from 'react';
import {
  X,
  AlertTriangle,
  Download,
  ShieldCheck,
  Trash2,
  Archive,
  CheckCircle2,
  FileText,
  Clock,
  Package,
  Layers,
  Calendar,
  DollarSign,
  Wifi,
  Lock,
} from 'lucide-react';
import { User, UserActivityDossier } from '../../types';
import { storage } from '../../services/storage';
import { useApp } from '../../context/AppContext';

interface UserArchivalModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUser: User | null;
  currentUser: User | null;
  onSuccess: () => void;
}

export const UserArchivalModal: React.FC<UserArchivalModalProps> = ({
  isOpen,
  onClose,
  targetUser,
  currentUser,
  onSuccess,
}) => {
  const { softwareName } = useApp();
  const [hasDownloadedBackup, setHasDownloadedBackup] = useState(false);
  const [purgeFromActiveDb, setPurgeFromActiveDb] = useState(false);
  const [confirmPurgeCheckbox, setConfirmPurgeCheckbox] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const dossier: UserActivityDossier | null = useMemo(() => {
    if (!targetUser || !isOpen) return null;
    return storage.getUserActivityDossier(targetUser.id);
  }, [targetUser, isOpen]);

  if (!isOpen || !targetUser || !currentUser) return null;

  const stats = dossier?.stats || {
    totalActivities: 0,
    dailyWorksCount: 0,
    stockMovementsCount: 0,
    inventoryItemsAuthoredCount: 0,
    projectsManagedCount: 0,
    expensesLoggedCount: 0,
    ftthCount: 0,
    fttbCount: 0,
    fttmCount: 0,
  };

  // Trigger Offline Archive Download
  const handleDownloadArchive = () => {
    if (!dossier) return;
    try {
      const jsonString = storage.exportUserDossierJson(dossier);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const sanitizedName = targetUser.username.replace(/[^a-z0-9_-]/gi, '_');
      link.download = `${softwareName}_UserArchive_${sanitizedName}_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setHasDownloadedBackup(true);
    } catch (e) {
      console.error('Failed to download offline user archive:', e);
    }
  };

  // Perform Archival & Removal
  const handleConfirmRemoval = async () => {
    if (purgeFromActiveDb && !confirmPurgeCheckbox) return;

    setIsProcessing(true);
    try {
      // 1. If not yet downloaded to local disk, force auto-download now
      if (!hasDownloadedBackup && dossier) {
        handleDownloadArchive();
      }

      // 2. Perform safe archiving in storage
      storage.archiveAndRemoveUser(targetUser, currentUser, purgeFromActiveDb);

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Failed to archive and remove user:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const isFormValid = !purgeFromActiveDb || confirmPurgeCheckbox;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/80 backdrop-blur-md overflow-y-auto animate-in fade-in">
      <div className="relative w-full max-w-2xl bg-[var(--bg-main)] border border-[var(--border-main)] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 md:p-6 border-b border-[var(--border-main)] bg-[var(--bg-surface)]/70 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400">
              <Archive className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight text-[var(--text-main)]">
                User Offboarding & Data Archival Protection
              </h2>
              <p className="text-xs text-[var(--text-dim)]">
                Pre-removal safety compliance & permanent Developer/CEO offline archive
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-[var(--bg-surface)] hover:bg-[var(--border-main)] text-[var(--text-dim)] hover:text-[var(--text-main)] transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 md:p-6 space-y-5 overflow-y-auto max-h-[75vh]">
          {/* Target User Snapshot */}
          <div className="p-3.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-main)] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-500/15 border border-purple-500/30 flex items-center justify-center font-bold text-sm text-purple-400">
                {targetUser.fullName.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-[var(--text-main)]">{targetUser.fullName}</span>
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-[var(--accent)]/15 text-[var(--accent)]">
                    {targetUser.role}
                  </span>
                </div>
                <p className="text-xs text-[var(--text-dim)] font-mono">
                  @{targetUser.username} • {targetUser.department || 'Operations Team'} • ID: {targetUser.id}
                </p>
              </div>
            </div>
          </div>

          {/* User Data Footprint Summary */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-dim)]">
              Historical Work Footprint to be Archived:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="p-2.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-main)] text-center">
                <span className="text-xs text-[var(--text-dim)] block">Audit Logs</span>
                <span className="text-sm font-black text-purple-400">{stats.totalActivities}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-main)] text-center">
                <span className="text-xs text-[var(--text-dim)] block">Daily Works</span>
                <span className="text-sm font-black text-blue-400">{stats.dailyWorksCount}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-main)] text-center">
                <span className="text-xs text-[var(--text-dim)] block">Stock Movements</span>
                <span className="text-sm font-black text-amber-400">{stats.stockMovementsCount}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-main)] text-center">
                <span className="text-xs text-[var(--text-dim)] block">Turnkey Projects</span>
                <span className="text-sm font-black text-emerald-400">{stats.projectsManagedCount}</span>
              </div>
            </div>
          </div>

          {/* Mandatory Offline Backup Section */}
          <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30 space-y-3">
            <div className="flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-xs font-black uppercase tracking-wider text-blue-400">
                  Mandatory Offline Archive Backup
                </h4>
                <p className="text-xs text-[var(--text-dim)] leading-relaxed">
                  {softwareName} safeguards institutional telecom records. Before account removal, this user's complete
                  work, credentials, audit trail, and activity history must be exported offline and will remain
                  permanently accessible to the Developer/CEO in {softwareName}.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-blue-500/20">
              <div className="flex items-center gap-2">
                {hasDownloadedBackup ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/25">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Offline Archive Downloaded (.JSON)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-xs text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/25">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Pending Offline Export
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={handleDownloadArchive}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{hasDownloadedBackup ? 'Re-Download Offline Archive (.JSON)' : 'Save & Export Offline Archive (.JSON)'}</span>
              </button>
            </div>
          </div>

          {/* Active Database Records Policy */}
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-dim)]">
              Record Retention Policy during Account Removal:
            </label>

            {/* Option 1: Safe Retention (Default) */}
            <label
              className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition ${
                !purgeFromActiveDb
                  ? 'bg-emerald-500/10 border-emerald-500/40 text-[var(--text-main)]'
                  : 'bg-[var(--bg-surface)] border-[var(--border-main)] text-[var(--text-dim)] hover:border-[var(--border-light)]'
              }`}
            >
              <input
                type="radio"
                name="retentionPolicy"
                checked={!purgeFromActiveDb}
                onChange={() => setPurgeFromActiveDb(false)}
                className="mt-1 text-emerald-500 focus:ring-emerald-500"
              />
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-emerald-400">
                    Safe Retention (Recommended & Default)
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                    Compliant
                  </span>
                </div>
                <p className="text-xs text-[var(--text-dim)] leading-relaxed">
                  The user login credentials will be removed, but all daily works, stock movements, fiber records, and
                  expenses created by this user will <strong className="text-[var(--text-main)]">remain intact</strong> in the active database with their author attribution for audit compliance.
                </p>
              </div>
            </label>

            {/* Option 2: Strict Deletion */}
            <label
              className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition ${
                purgeFromActiveDb
                  ? 'bg-rose-500/10 border-rose-500/40 text-[var(--text-main)]'
                  : 'bg-[var(--bg-surface)] border-[var(--border-main)] text-[var(--text-dim)] hover:border-[var(--border-light)]'
              }`}
            >
              <input
                type="radio"
                name="retentionPolicy"
                checked={purgeFromActiveDb}
                onChange={() => setPurgeFromActiveDb(true)}
                className="mt-1 text-rose-500 focus:ring-rose-500"
              />
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-rose-400">
                    Strict Deletion (Explicit Developer/CEO choice only)
                  </span>
                </div>
                <p className="text-xs text-[var(--text-dim)] leading-relaxed">
                  Permanently purge all operational records (daily works, stock movements, projects, expenses) created
                  by this user from the active database. (The saved offline backup will still remain accessible to the Developer/CEO).
                </p>
              </div>
            </label>

            {/* Explicit confirmation checkbox if Strict Deletion selected */}
            {purgeFromActiveDb && (
              <div className="p-3 rounded-lg bg-rose-500/15 border border-rose-500/30 flex items-start gap-2.5 animate-in fade-in">
                <input
                  type="checkbox"
                  id="confirmPurgeRecords"
                  checked={confirmPurgeCheckbox}
                  onChange={(e) => setConfirmPurgeCheckbox(e.target.checked)}
                  className="mt-0.5 text-rose-600 rounded focus:ring-rose-500"
                />
                <label
                  htmlFor="confirmPurgeRecords"
                  className="text-xs text-rose-200 font-semibold cursor-pointer select-none"
                >
                  I explicitly confirm that I want to permanently delete all active operational records created by{' '}
                  <span className="underline font-bold">{targetUser.fullName}</span> from the active database.
                </label>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 md:p-6 border-t border-[var(--border-main)] bg-[var(--bg-surface)]/70 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="w-full sm:w-auto px-4 py-2 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-main)] hover:bg-[var(--border-main)] text-xs font-semibold text-[var(--text-main)] transition"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleConfirmRemoval}
            disabled={!isFormValid || isProcessing}
            className={`w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-xs font-black transition shadow-lg ${
              isFormValid && !isProcessing
                ? purgeFromActiveDb
                  ? 'bg-rose-600 hover:bg-rose-500 text-white'
                  : 'bg-amber-600 hover:bg-amber-500 text-white'
                : 'bg-gray-700/50 text-gray-500 cursor-not-allowed'
            }`}
          >
            <Archive className="w-4 h-4" />
            <span>
              {isProcessing
                ? 'Archiving & Processing...'
                : hasDownloadedBackup
                ? 'Complete User Removal & Archival'
                : 'Auto-Export Offline Backup & Remove User'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
