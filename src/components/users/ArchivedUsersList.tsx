import React, { useState } from 'react';
import {
  Archive,
  Download,
  Eye,
  RotateCcw,
  Trash2,
  ShieldCheck,
  Clock,
  HardDrive,
  CheckCircle2,
  AlertTriangle,
  Search,
  Filter,
  User as UserIcon,
} from 'lucide-react';
import { ArchivedUserBackup, User } from '../../types';
import { storage } from '../../services/storage';
import { useApp } from '../../context/AppContext';
import { UserDossierModal } from './UserDossierModal';

interface ArchivedUsersListProps {
  currentUser: User | null;
  onUserRestored: () => void;
  showToast: (msg: string, type: 'success' | 'warning' | 'error' | 'info') => void;
}

export const ArchivedUsersList: React.FC<ArchivedUsersListProps> = ({
  currentUser,
  onUserRestored,
  showToast,
}) => {
  const { softwareName } = useApp();
  const [archivedUsers, setArchivedUsers] = useState<ArchivedUserBackup[]>(() =>
    storage.getArchivedUsers()
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArchiveForDossier, setSelectedArchiveForDossier] = useState<ArchivedUserBackup | null>(null);
  const [archiveToDelete, setArchiveToDelete] = useState<ArchivedUserBackup | null>(null);

  const reloadData = () => {
    setArchivedUsers(storage.getArchivedUsers());
  };

  const isDevCEO = currentUser?.role === 'Developer/CEO';

  // Filter archived users
  const filteredList = archivedUsers.filter((b) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      b.user.fullName.toLowerCase().includes(q) ||
      b.user.username.toLowerCase().includes(q) ||
      (b.user.department && b.user.department.toLowerCase().includes(q)) ||
      (b.archivedByUserName && b.archivedByUserName.toLowerCase().includes(q))
    );
  });

  // Download Offline Backup JSON
  const handleDownloadBackup = (backup: ArchivedUserBackup) => {
    try {
      const blob = new Blob([backup.rawJsonSnapshot], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const sanitizedName = backup.user.username.replace(/[^a-z0-9_-]/gi, '_');
      link.download = `${softwareName}_UserArchive_${sanitizedName}_${backup.id}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showToast(`Offline backup for "${backup.user.fullName}" downloaded.`, 'success');
    } catch (e) {
      showToast('Failed to download backup JSON.', 'error');
    }
  };

  // Restore User
  const handleRestoreUser = (backup: ArchivedUserBackup) => {
    if (!currentUser) return;
    const ok = storage.restoreArchivedUser(backup.id, currentUser);
    if (ok) {
      showToast(`User account "${backup.user.fullName}" restored successfully.`, 'success');
      reloadData();
      onUserRestored();
    } else {
      showToast(
        `Cannot restore: username "@${backup.user.username}" is already in use by an active account.`,
        'error'
      );
    }
  };

  // Confirm Purge Archive
  const handleConfirmPurgeArchive = () => {
    if (!archiveToDelete || !currentUser) return;
    storage.deleteArchivedUserBackup(archiveToDelete.id, currentUser);
    showToast(`Offline backup archive permanently purged.`, 'warning');
    setArchiveToDelete(null);
    reloadData();
  };

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/25 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
            <Archive className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-[var(--text-main)] flex items-center gap-2">
              <span>Archived User Backups & Work Dossiers</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-bold">
                Developer/CEO Exclusive Access
              </span>
            </h3>
            <p className="text-xs text-[var(--text-dim)] mt-0.5">
              Offline backups preserved when accounts were offboarded. Full historical dossiers, audit logs, and field works remain permanently accessible.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold px-3 py-1.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-main)] text-[var(--text-main)]">
            Total Archives: {archivedUsers.length}
          </span>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-dim)]" />
          <input
            type="text"
            placeholder="Search archived users by name, handle, role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-main)] text-xs text-[var(--text-main)] focus:outline-none focus:border-[var(--accent)]"
          />
        </div>
      </div>

      {/* Archived List / Cards */}
      {filteredList.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-main)] space-y-3">
          <div className="w-12 h-12 rounded-full bg-[var(--border-main)]/50 flex items-center justify-center mx-auto text-[var(--text-dim)]">
            <Archive className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-[var(--text-main)]">No Archived User Backups</h4>
          <p className="text-xs text-[var(--text-dim)] max-w-md mx-auto">
            When users are removed from the system, their complete activity and work history will be securely archived here and made available offline for the Developer/CEO.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {filteredList.map((backup) => (
            <div
              key={backup.id}
              className="p-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-main)] hover:border-[var(--border-light)] transition flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              {/* User Info */}
              <div className="flex items-start gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center font-bold text-sm text-purple-400 shrink-0 mt-0.5">
                  {backup.user.fullName.charAt(0)}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-sm font-bold text-[var(--text-main)]">{backup.user.fullName}</h4>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded font-bold bg-[var(--accent)]/15 text-[var(--accent)]">
                      {backup.user.role}
                    </span>
                    {backup.recordsRetainedInLiveDb ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                        <CheckCircle2 className="w-3 h-3" />
                        Live Records Retained
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-rose-500/15 text-rose-400 border border-rose-500/25">
                        <AlertTriangle className="w-3 h-3" />
                        Live Records Purged
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[var(--text-dim)] font-mono">
                    @{backup.user.username} • {backup.user.department || 'Operations Team'} • Archive ID: {backup.id}
                  </p>
                  <div className="flex items-center gap-3 text-[11px] text-[var(--text-muted)] pt-1">
                    <span>Archived on: {new Date(backup.archivedAt).toLocaleString()}</span>
                    <span>•</span>
                    <span>Archived By: {backup.archivedByUserName}</span>
                    <span>•</span>
                    <span>Size: {(backup.archiveSizeBytes / 1024).toFixed(1)} KB</span>
                  </div>
                </div>
              </div>

              {/* Stats & Actions */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-[var(--border-main)]">
                {/* Stats badge */}
                <div className="flex items-center gap-2 text-xs font-mono bg-[var(--bg-main)] px-3 py-1.5 rounded-lg border border-[var(--border-main)] text-[var(--text-dim)]">
                  <span>{backup.dossier.stats.totalActivities} logs</span>
                  <span>•</span>
                  <span>{backup.dossier.stats.dailyWorksCount} works</span>
                  <span>•</span>
                  <span>{backup.dossier.stats.stockMovementsCount} movs</span>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-1.5 w-full sm:w-auto">
                  <button
                    onClick={() => setSelectedArchiveForDossier(backup)}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg bg-[var(--accent)]/10 hover:bg-[var(--accent)]/20 text-[var(--accent)] text-xs font-bold transition border border-[var(--accent)]/25"
                    title="Inspect Complete Historical Dossier"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Inspect</span>
                  </button>

                  <button
                    onClick={() => handleDownloadBackup(backup)}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600/15 hover:bg-emerald-600/25 text-emerald-400 text-xs font-bold transition border border-emerald-500/25"
                    title="Download Offline Archive (.JSON)"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </button>

                  <button
                    onClick={() => handleRestoreUser(backup)}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600/15 hover:bg-blue-600/25 text-blue-400 text-xs font-bold transition border border-blue-500/25"
                    title="Restore User Account"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Restore</span>
                  </button>

                  {isDevCEO && (
                    <button
                      onClick={() => setArchiveToDelete(backup)}
                      className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition border border-rose-500/20"
                      title="Permanently Purge Archive"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dossier Inspector Modal */}
      {selectedArchiveForDossier && (
        <UserDossierModal
          isOpen={!!selectedArchiveForDossier}
          onClose={() => setSelectedArchiveForDossier(null)}
          userId={selectedArchiveForDossier.user.id}
          isArchivedUser={true}
        />
      )}

      {/* Purge Archive Confirmation Modal */}
      {archiveToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-[var(--bg-main)] border border-rose-500/30 rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-base font-black text-[var(--text-main)]">
                Permanently Purge Archive?
              </h3>
            </div>
            <p className="text-xs text-[var(--text-dim)] leading-relaxed">
              Are you sure you want to permanently delete the archived backup for{' '}
              <strong className="text-[var(--text-main)]">{archiveToDelete.user.fullName}</strong>?
              This will irreversibly remove this backup file from the Developer/CEO permanent storage.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setArchiveToDelete(null)}
                className="px-4 py-2 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-main)] text-xs font-semibold text-[var(--text-main)] transition"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmPurgeArchive}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition shadow-sm"
              >
                Permanently Purge
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
