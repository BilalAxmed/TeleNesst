import React, { useState, useMemo } from 'react';
import {
  X,
  User,
  Shield,
  Clock,
  Download,
  Activity,
  Layers,
  FileText,
  Calendar,
  DollarSign,
  Wifi,
  Package,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Search,
  Filter,
  ArrowDownLeft,
  ArrowUpRight,
  HardDrive,
  Printer,
} from 'lucide-react';
import {
  User as UserType,
  UserActivityDossier,
  AuditLogEntry,
  DailyWork,
  StockMovement,
  ProjectRecord,
  ExpenseRecord,
  FTTHRecord,
  FTTBRecord,
  FTTMRecord,
} from '../../types';
import { storage } from '../../services/storage';
import { useApp } from '../../context/AppContext';

interface UserDossierModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  isArchivedUser?: boolean;
}

export const UserDossierModal: React.FC<UserDossierModalProps> = ({
  isOpen,
  onClose,
  userId,
  isArchivedUser = false,
}) => {
  const { softwareName } = useApp();
  const [activeTab, setActiveTab] = useState<
    'overview' | 'audit' | 'dailyworks' | 'stock' | 'projects' | 'finance' | 'fiber'
  >('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [auditFilter, setAuditFilter] = useState<'ALL' | 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN'>('ALL');

  const dossier: UserActivityDossier | null = useMemo(() => {
    if (!userId || !isOpen) return null;
    return storage.getUserActivityDossier(userId);
  }, [userId, isOpen]);

  if (!isOpen || !dossier) return null;

  const { user, stats, activityLogs, dailyWorks, stockMovements, inventoryItems, projects, expenses, fiberDeployments } =
    dossier;

  // Filtered Audit Logs
  const filteredAuditLogs = activityLogs.filter((log) => {
    const matchesSearch =
      !searchQuery ||
      log.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.module.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.targetId && log.targetId.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesAction = auditFilter === 'ALL' || log.action === auditFilter;
    return matchesSearch && matchesAction;
  });

  // Filtered Daily Works
  const filteredDailyWorks = dailyWorks.filter((w) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (w.siteId && w.siteId.toLowerCase().includes(q)) ||
      (w.projectName && w.projectName.toLowerCase().includes(q)) ||
      (w.tasksCompleted && w.tasksCompleted.toLowerCase().includes(q)) ||
      (w.workType && w.workType.toLowerCase().includes(q))
    );
  });

  // Filtered Stock Movements
  const filteredMovements = stockMovements.filter((m) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      m.itemCode.toLowerCase().includes(q) ||
      m.itemName.toLowerCase().includes(q) ||
      (m.projectOrRecipient && m.projectOrRecipient.toLowerCase().includes(q)) ||
      (m.referenceNo && m.referenceNo.toLowerCase().includes(q))
    );
  });

  // Export JSON file
  const handleDownloadDossierJson = () => {
    try {
      const jsonContent = storage.exportUserDossierJson(dossier);
      const blob = new Blob([jsonContent], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const sanitizedName = user.username.replace(/[^a-z0-9_-]/gi, '_');
      link.download = `${softwareName}_UserActivityDossier_${sanitizedName}_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Failed to export dossier JSON:', e);
    }
  };

  // Quick Print Dossier
  const handlePrintDossier = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/80 backdrop-blur-md overflow-y-auto animate-in fade-in">
      <div className="relative w-full max-w-6xl max-h-[92vh] flex flex-col bg-[var(--bg-main)] border border-[var(--border-main)] rounded-2xl shadow-2xl overflow-hidden">
        {/* Modal Top Header */}
        <div className="p-4 md:p-6 border-b border-[var(--border-main)] bg-[var(--bg-surface)]/70 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black tracking-tight text-[var(--text-main)]">
                  {user.fullName}
                </h2>
                <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-[var(--accent)]/15 text-[var(--accent)] border border-[var(--accent)]/30">
                  {user.role}
                </span>
                {isArchivedUser && (
                  <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                    Archived Backup
                  </span>
                )}
                {user.isLocked && (
                  <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                    Locked
                  </span>
                )}
              </div>
              <p className="text-xs text-[var(--text-dim)] flex items-center gap-2 mt-0.5">
                <span>@{user.username}</span>
                <span>•</span>
                <span>{user.department || 'Operations Team'}</span>
                <span>•</span>
                <span>User ID: {user.id}</span>
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrintDossier}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-main)] hover:bg-[var(--border-main)] text-xs font-semibold text-[var(--text-main)] transition"
              title="Print Dossier Summary"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>
            <button
              onClick={handleDownloadDossierJson}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-sm"
              title="Download Full Offline Dossier JSON"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Dossier (.JSON)</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-[var(--bg-surface)] hover:bg-[var(--border-main)] text-[var(--text-dim)] hover:text-[var(--text-main)] transition"
              title="Close Inspector"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-4 md:px-6 border-b border-[var(--border-main)] bg-[var(--bg-surface)]/30 overflow-x-auto text-xs font-bold scrollbar-none">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-2 px-3 py-3 border-b-2 transition whitespace-nowrap ${
              activeTab === 'overview'
                ? 'border-[var(--accent)] text-[var(--accent)]'
                : 'border-transparent text-[var(--text-dim)] hover:text-[var(--text-main)]'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Overview & Metrics</span>
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`flex items-center gap-2 px-3 py-3 border-b-2 transition whitespace-nowrap ${
              activeTab === 'audit'
                ? 'border-[var(--accent)] text-[var(--accent)]'
                : 'border-transparent text-[var(--text-dim)] hover:text-[var(--text-main)]'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Audit Trail ({stats.totalActivities})</span>
          </button>
          <button
            onClick={() => setActiveTab('dailyworks')}
            className={`flex items-center gap-2 px-3 py-3 border-b-2 transition whitespace-nowrap ${
              activeTab === 'dailyworks'
                ? 'border-[var(--accent)] text-[var(--accent)]'
                : 'border-transparent text-[var(--text-dim)] hover:text-[var(--text-main)]'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Daily Works ({stats.dailyWorksCount})</span>
          </button>
          <button
            onClick={() => setActiveTab('stock')}
            className={`flex items-center gap-2 px-3 py-3 border-b-2 transition whitespace-nowrap ${
              activeTab === 'stock'
                ? 'border-[var(--accent)] text-[var(--accent)]'
                : 'border-transparent text-[var(--text-dim)] hover:text-[var(--text-main)]'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Stock Movements ({stats.stockMovementsCount})</span>
          </button>
          <button
            onClick={() => setActiveTab('projects')}
            className={`flex items-center gap-2 px-3 py-3 border-b-2 transition whitespace-nowrap ${
              activeTab === 'projects'
                ? 'border-[var(--accent)] text-[var(--accent)]'
                : 'border-transparent text-[var(--text-dim)] hover:text-[var(--text-main)]'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Projects ({stats.projectsManagedCount})</span>
          </button>
          <button
            onClick={() => setActiveTab('finance')}
            className={`flex items-center gap-2 px-3 py-3 border-b-2 transition whitespace-nowrap ${
              activeTab === 'finance'
                ? 'border-[var(--accent)] text-[var(--accent)]'
                : 'border-transparent text-[var(--text-dim)] hover:text-[var(--text-main)]'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>Finance & Expenses ({stats.expensesLoggedCount})</span>
          </button>
          <button
            onClick={() => setActiveTab('fiber')}
            className={`flex items-center gap-2 px-3 py-3 border-b-2 transition whitespace-nowrap ${
              activeTab === 'fiber'
                ? 'border-[var(--accent)] text-[var(--accent)]'
                : 'border-transparent text-[var(--text-dim)] hover:text-[var(--text-main)]'
            }`}
          >
            <Wifi className="w-4 h-4" />
            <span>Fiber Deployments ({stats.ftthCount + stats.fttbCount + stats.fttmCount})</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 md:p-6 flex-1 overflow-y-auto space-y-6">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Stat Cards Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-main)] space-y-1">
                  <div className="flex items-center justify-between text-xs text-[var(--text-dim)]">
                    <span>Audit & System Logs</span>
                    <Clock className="w-4 h-4 text-purple-400" />
                  </div>
                  <div className="text-2xl font-black text-[var(--text-main)]">
                    {stats.totalActivities.toLocaleString()}
                  </div>
                  <p className="text-[11px] text-[var(--text-muted)]">Recorded operations</p>
                </div>

                <div className="p-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-main)] space-y-1">
                  <div className="flex items-center justify-between text-xs text-[var(--text-dim)]">
                    <span>Daily Site Works</span>
                    <Calendar className="w-4 h-4 text-blue-400" />
                  </div>
                  <div className="text-2xl font-black text-[var(--text-main)]">
                    {stats.dailyWorksCount.toLocaleString()}
                  </div>
                  <p className="text-[11px] text-[var(--text-muted)]">Field activity sheets</p>
                </div>

                <div className="p-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-main)] space-y-1">
                  <div className="flex items-center justify-between text-xs text-[var(--text-dim)]">
                    <span>Stock Transactions</span>
                    <Package className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="text-2xl font-black text-[var(--text-main)]">
                    {stats.stockMovementsCount.toLocaleString()}
                  </div>
                  <p className="text-[11px] text-[var(--text-muted)]">Warehouse IN/OUT logs</p>
                </div>

                <div className="p-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-main)] space-y-1">
                  <div className="flex items-center justify-between text-xs text-[var(--text-dim)]">
                    <span>Fiber Clusters</span>
                    <Wifi className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="text-2xl font-black text-[var(--text-main)]">
                    {(stats.ftthCount + stats.fttbCount + stats.fttmCount).toLocaleString()}
                  </div>
                  <p className="text-[11px] text-[var(--text-muted)]">FTTH, FTTB & Towers</p>
                </div>
              </div>

              {/* User Identity Details & Account Timeline */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-main)] space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-dim)]">
                    Account Profile & Permissions
                  </h3>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1.5 border-b border-[var(--border-main)]">
                      <span className="text-[var(--text-dim)]">Full Name</span>
                      <span className="font-semibold text-[var(--text-main)]">{user.fullName}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-[var(--border-main)]">
                      <span className="text-[var(--text-dim)]">Username</span>
                      <span className="font-mono font-semibold text-[var(--text-main)]">@{user.username}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-[var(--border-main)]">
                      <span className="text-[var(--text-dim)]">System Role</span>
                      <span className="font-semibold text-[var(--text-main)]">{user.role}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-[var(--border-main)]">
                      <span className="text-[var(--text-dim)]">Department</span>
                      <span className="font-semibold text-[var(--text-main)]">{user.department || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-[var(--border-main)]">
                      <span className="text-[var(--text-dim)]">Email</span>
                      <span className="font-semibold text-[var(--text-main)]">{user.email || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between py-1.5">
                      <span className="text-[var(--text-dim)]">Account Status</span>
                      <span className={`font-semibold ${user.isLocked ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {user.isLocked ? 'Locked / Suspended' : 'Active Authorized'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-main)] space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-dim)]">
                    Activity & Audit Footprint
                  </h3>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1.5 border-b border-[var(--border-main)]">
                      <span className="text-[var(--text-dim)]">Account Created</span>
                      <span className="font-mono text-[var(--text-main)]">
                        {user.createdAt ? new Date(user.createdAt).toLocaleString() : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-[var(--border-main)]">
                      <span className="text-[var(--text-dim)]">Last Login</span>
                      <span className="font-mono text-[var(--text-main)]">
                        {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never logged in'}
                      </span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-[var(--border-main)]">
                      <span className="text-[var(--text-dim)]">Latest System Activity</span>
                      <span className="font-mono text-[var(--text-main)]">
                        {stats.lastActiveTimestamp
                          ? new Date(stats.lastActiveTimestamp).toLocaleString()
                          : 'No recent activity'}
                      </span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-[var(--border-main)]">
                      <span className="text-[var(--text-dim)]">Inventory Items Authored</span>
                      <span className="font-semibold text-[var(--text-main)]">
                        {stats.inventoryItemsAuthoredCount} items
                      </span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-[var(--border-main)]">
                      <span className="text-[var(--text-dim)]">Projects Assigned / Managed</span>
                      <span className="font-semibold text-[var(--text-main)]">{stats.projectsManagedCount} projects</span>
                    </div>
                    <div className="flex justify-between py-1.5">
                      <span className="text-[var(--text-dim)]">Finance Expenses Authored</span>
                      <span className="font-semibold text-[var(--text-main)]">{stats.expensesLoggedCount} vouchers</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Activity Mini-Feed */}
              <div className="p-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-main)] space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-dim)]">
                    Recent Activity History Preview (Latest 5 actions)
                  </h3>
                  <button
                    onClick={() => setActiveTab('audit')}
                    className="text-xs font-bold text-[var(--accent)] hover:underline flex items-center gap-1"
                  >
                    <span>View all {activityLogs.length} logs</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>

                {activityLogs.length === 0 ? (
                  <p className="text-xs text-[var(--text-dim)] py-4 text-center">
                    No activity logs recorded under this user.
                  </p>
                ) : (
                  <div className="divide-y divide-[var(--border-main)]">
                    {activityLogs.slice(0, 5).map((log) => (
                      <div key={log.id} className="py-2.5 flex items-start justify-between gap-3 text-xs">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                                log.action === 'CREATE'
                                  ? 'bg-emerald-500/10 text-emerald-400'
                                  : log.action === 'UPDATE'
                                  ? 'bg-blue-500/10 text-blue-400'
                                  : log.action === 'DELETE'
                                  ? 'bg-rose-500/10 text-rose-400'
                                  : 'bg-purple-500/10 text-purple-400'
                              }`}
                            >
                              {log.action}
                            </span>
                            <span className="font-semibold text-[var(--text-main)]">{log.module}</span>
                          </div>
                          <p className="text-[var(--text-dim)]">{log.description}</p>
                        </div>
                        <span className="font-mono text-[10px] text-[var(--text-muted)] whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: AUDIT TRAIL */}
          {activeTab === 'audit' && (
            <div className="space-y-4">
              {/* Search and Filters */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="relative w-full sm:w-72">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-dim)]" />
                  <input
                    type="text"
                    placeholder="Search logs by action or details..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-main)] text-xs text-[var(--text-main)] focus:outline-none focus:border-[var(--accent)]"
                  />
                </div>

                <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto">
                  {(['ALL', 'CREATE', 'UPDATE', 'DELETE', 'LOGIN'] as const).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setAuditFilter(mode)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                        auditFilter === mode
                          ? 'bg-[var(--accent)] text-white'
                          : 'bg-[var(--bg-surface)] border border-[var(--border-main)] text-[var(--text-dim)] hover:text-[var(--text-main)]'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              {filteredAuditLogs.length === 0 ? (
                <div className="p-8 text-center rounded-xl bg-[var(--bg-surface)] border border-[var(--border-main)] text-[var(--text-dim)] text-xs">
                  No audit entries found matching the filter.
                </div>
              ) : (
                <div className="rounded-xl border border-[var(--border-main)] overflow-hidden bg-[var(--bg-surface)]">
                  <div className="divide-y divide-[var(--border-main)]">
                    {filteredAuditLogs.map((log) => (
                      <div key={log.id} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                                log.action === 'CREATE'
                                  ? 'bg-emerald-500/10 text-emerald-400'
                                  : log.action === 'UPDATE'
                                  ? 'bg-blue-500/10 text-blue-400'
                                  : log.action === 'DELETE'
                                  ? 'bg-rose-500/10 text-rose-400'
                                  : 'bg-purple-500/10 text-purple-400'
                              }`}
                            >
                              {log.action}
                            </span>
                            <span className="font-bold text-[var(--text-main)]">{log.module}</span>
                            {log.targetId && (
                              <span className="text-[10px] font-mono text-[var(--text-muted)] bg-[var(--bg-main)] px-1.5 py-0.5 rounded">
                                ID: {log.targetId}
                              </span>
                            )}
                          </div>
                          <p className="text-[var(--text-dim)]">{log.description}</p>
                          {log.details && (
                            <pre className="text-[10px] font-mono p-1.5 rounded bg-[var(--bg-main)] border border-[var(--border-main)] text-[var(--text-muted)] overflow-x-auto max-h-24">
                              {typeof log.details === 'string' ? log.details : JSON.stringify(log.details, null, 2)}
                            </pre>
                          )}
                        </div>
                        <div className="text-right whitespace-nowrap">
                          <span className="font-mono text-[10px] text-[var(--text-muted)]">
                            {new Date(log.timestamp).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: DAILY WORKS */}
          {activeTab === 'dailyworks' && (
            <div className="space-y-4">
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-dim)]" />
                <input
                  type="text"
                  placeholder="Filter site works by site ID or project..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-main)] text-xs text-[var(--text-main)] focus:outline-none focus:border-[var(--accent)]"
                />
              </div>

              {filteredDailyWorks.length === 0 ? (
                <div className="p-8 text-center rounded-xl bg-[var(--bg-surface)] border border-[var(--border-main)] text-[var(--text-dim)] text-xs">
                  No daily work sheets associated with this user.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-[var(--border-main)] bg-[var(--bg-surface)]">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[var(--border-main)] bg-[var(--bg-main)]/60 text-[var(--text-dim)]">
                        <th className="p-3">Status</th>
                        <th className="p-3">Date</th>
                        <th className="p-3">Site ID / Name</th>
                        <th className="p-3">Project</th>
                        <th className="p-3">Work Type</th>
                        <th className="p-3">Technicians</th>
                        <th className="p-3">Tasks Completed</th>
                        <th className="p-3 text-right">Photos</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-main)] text-[var(--text-main)]">
                      {filteredDailyWorks.map((work) => (
                        <tr key={work.id} className="hover:bg-[var(--border-main)]/20 transition">
                          <td className="p-3">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                                work.status === 'Completed' || work.isRowChecked
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              }`}
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              {work.status || 'Active'}
                            </span>
                          </td>
                          <td className="p-3 font-mono text-[var(--text-dim)]">{work.date}</td>
                          <td className="p-3 font-semibold">
                            {work.siteId || 'N/A'}{' '}
                            <span className="text-[var(--text-dim)] font-normal">({work.siteName || 'Site'})</span>
                          </td>
                          <td className="p-3">{work.projectName}</td>
                          <td className="p-3">
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-blue-500/10 text-blue-400 font-mono">
                              {work.workType}
                            </span>
                          </td>
                          <td className="p-3">{work.techniciansCount} techs</td>
                          <td className="p-3 max-w-xs truncate text-[var(--text-dim)]" title={work.tasksCompleted}>
                            {work.tasksCompleted || '—'}
                          </td>
                          <td className="p-3 text-right font-mono text-[var(--text-dim)]">
                            {work.photos?.length || 0}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: STOCK MOVEMENTS */}
          {activeTab === 'stock' && (
            <div className="space-y-4">
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-dim)]" />
                <input
                  type="text"
                  placeholder="Search stock movement records..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-main)] text-xs text-[var(--text-main)] focus:outline-none focus:border-[var(--accent)]"
                />
              </div>

              {filteredMovements.length === 0 ? (
                <div className="p-8 text-center rounded-xl bg-[var(--bg-surface)] border border-[var(--border-main)] text-[var(--text-dim)] text-xs">
                  No warehouse stock transactions logged by this user.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-[var(--border-main)] bg-[var(--bg-surface)]">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[var(--border-main)] bg-[var(--bg-main)]/60 text-[var(--text-dim)]">
                        <th className="p-3">Type</th>
                        <th className="p-3">Date</th>
                        <th className="p-3">Item Code</th>
                        <th className="p-3">Item Name</th>
                        <th className="p-3 text-right">Quantity</th>
                        <th className="p-3 text-right">Balance After</th>
                        <th className="p-3">Project / Recipient</th>
                        <th className="p-3">Ref No</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-main)] text-[var(--text-main)]">
                      {filteredMovements.map((m) => (
                        <tr key={m.id} className="hover:bg-[var(--border-main)]/20 transition">
                          <td className="p-3">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                                m.type === 'IN'
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                              }`}
                            >
                              {m.type === 'IN' ? (
                                <ArrowDownLeft className="w-3 h-3" />
                              ) : (
                                <ArrowUpRight className="w-3 h-3" />
                              )}
                              {m.type}
                            </span>
                          </td>
                          <td className="p-3 font-mono text-[var(--text-dim)]">{m.date}</td>
                          <td className="p-3 font-mono font-semibold">{m.itemCode}</td>
                          <td className="p-3">{m.itemName}</td>
                          <td className="p-3 text-right font-mono font-bold">
                            {m.type === 'IN' ? '+' : '-'}
                            {m.quantity.toLocaleString()}
                          </td>
                          <td className="p-3 text-right font-mono text-[var(--text-dim)]">
                            {m.newBalance?.toLocaleString() ?? '—'}
                          </td>
                          <td className="p-3 text-[var(--text-dim)]">{m.projectOrRecipient || 'Depot'}</td>
                          <td className="p-3 font-mono text-[10px] text-[var(--text-muted)]">{m.referenceNo}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: PROJECTS */}
          {activeTab === 'projects' && (
            <div className="space-y-4">
              {projects.length === 0 ? (
                <div className="p-8 text-center rounded-xl bg-[var(--bg-surface)] border border-[var(--border-main)] text-[var(--text-dim)] text-xs">
                  No projects currently assigned to or managed by this user.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {projects.map((proj) => (
                    <div
                      key={proj.id}
                      className="p-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-main)] space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="font-mono text-[10px] text-[var(--text-dim)] bg-[var(--bg-main)] px-1.5 py-0.5 rounded">
                            {proj.code}
                          </span>
                          <h4 className="font-bold text-sm text-[var(--text-main)] mt-1">{proj.title}</h4>
                          <p className="text-xs text-[var(--text-dim)]">{proj.client}</p>
                        </div>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            proj.status === 'Completed'
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : 'bg-blue-500/10 text-blue-400'
                          }`}
                        >
                          {proj.status}
                        </span>
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs text-[var(--text-dim)]">
                          <span>Progress</span>
                          <span className="font-bold text-[var(--text-main)]">{proj.progressPercent}%</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-[var(--bg-main)] overflow-hidden">
                          <div
                            className="h-full bg-[var(--accent)] transition-all"
                            style={{ width: `${proj.progressPercent}%` }}
                          />
                        </div>
                      </div>

                      <div className="pt-2 border-t border-[var(--border-main)] flex items-center justify-between text-xs text-[var(--text-dim)]">
                        <span>Budget: {proj.currency} {proj.budget.toLocaleString()}</span>
                        <span>Manager: {proj.projectManager}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 6: FINANCE & EXPENSES */}
          {activeTab === 'finance' && (
            <div className="space-y-4">
              {expenses.length === 0 ? (
                <div className="p-8 text-center rounded-xl bg-[var(--bg-surface)] border border-[var(--border-main)] text-[var(--text-dim)] text-xs">
                  No expense records or financial vouchers logged by this user.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-[var(--border-main)] bg-[var(--bg-surface)]">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[var(--border-main)] bg-[var(--bg-main)]/60 text-[var(--text-dim)]">
                        <th className="p-3">Date</th>
                        <th className="p-3">Title / Vouchers</th>
                        <th className="p-3">Type</th>
                        <th className="p-3">Category</th>
                        <th className="p-3">Vendor / Paid To</th>
                        <th className="p-3 text-right">Amount</th>
                        <th className="p-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-main)] text-[var(--text-main)]">
                      {expenses.map((exp) => (
                        <tr key={exp.id} className="hover:bg-[var(--border-main)]/20 transition">
                          <td className="p-3 font-mono text-[var(--text-dim)]">{exp.date}</td>
                          <td className="p-3 font-semibold">{exp.title}</td>
                          <td className="p-3 font-mono text-[10px] text-[var(--text-dim)]">{exp.type}</td>
                          <td className="p-3">{exp.category}</td>
                          <td className="p-3 text-[var(--text-dim)]">{exp.paidTo || exp.vendor || '—'}</td>
                          <td className="p-3 text-right font-mono font-bold">
                            {exp.currency} {exp.amount.toLocaleString()}
                          </td>
                          <td className="p-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                exp.paymentStatus === 'Paid'
                                  ? 'bg-emerald-500/10 text-emerald-400'
                                  : 'bg-amber-500/10 text-amber-400'
                              }`}
                            >
                              {exp.paymentStatus || 'Paid'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 7: FIBER DEPLOYMENTS */}
          {activeTab === 'fiber' && (
            <div className="space-y-6">
              {/* FTTH Clusters */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-dim)] flex items-center gap-2">
                  <Wifi className="w-3.5 h-3.5 text-blue-400" />
                  <span>FTTH Cluster Rollouts ({fiberDeployments.ftth.length})</span>
                </h4>
                {fiberDeployments.ftth.length === 0 ? (
                  <p className="text-xs text-[var(--text-dim)]">No FTTH clusters registered under this user.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {fiberDeployments.ftth.map((ft) => (
                      <div
                        key={ft.id}
                        className="p-3.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-main)] space-y-1.5 text-xs"
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-[var(--text-main)]">{ft.clusterId} ({ft.zone})</span>
                          <span className="font-mono text-[10px] text-[var(--text-dim)]">{ft.clientOperator}</span>
                        </div>
                        <p className="text-[var(--text-dim)]">
                          Splitter: {ft.splitterRatio} • Power: {ft.opticalPowerDbm} dBm • Drop: {ft.dropCableMeters}m
                        </p>
                        <div className="flex justify-between text-[11px] pt-1 border-t border-[var(--border-main)] text-[var(--text-dim)]">
                          <span>Supervisor: {ft.supervisor}</span>
                          <span>Testing: {ft.testingStatus}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* FTTB Buildings */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-dim)] flex items-center gap-2">
                  <Layers className="w-3.5 h-3.5 text-purple-400" />
                  <span>FTTB Commercial Buildings ({fiberDeployments.fttb.length})</span>
                </h4>
                {fiberDeployments.fttb.length === 0 ? (
                  <p className="text-xs text-[var(--text-dim)]">No FTTB records registered under this user.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {fiberDeployments.fttb.map((b) => (
                      <div
                        key={b.id}
                        className="p-3.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-main)] space-y-1.5 text-xs"
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-[var(--text-main)]">{b.buildingName}</span>
                          <span className="font-mono text-[10px] text-[var(--text-dim)]">{b.buildingId}</span>
                        </div>
                        <p className="text-[var(--text-dim)]">
                          Floors: {b.floorsCount} • Risers: {b.risersCount} • Active Ports: {b.activeCustomerPorts}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* FTTM Telecom Towers */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-dim)] flex items-center gap-2">
                  <HardDrive className="w-3.5 h-3.5 text-amber-400" />
                  <span>FTTM Cellular Towers & Rings ({fiberDeployments.fttm.length})</span>
                </h4>
                {fiberDeployments.fttm.length === 0 ? (
                  <p className="text-xs text-[var(--text-dim)]">No FTTM telecom towers registered under this user.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {fiberDeployments.fttm.map((m) => (
                      <div
                        key={m.id}
                        className="p-3.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-main)] space-y-1.5 text-xs"
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-[var(--text-main)]">{m.towerName}</span>
                          <span className="font-mono text-[10px] text-[var(--text-dim)]">{m.siteId}</span>
                        </div>
                        <p className="text-[var(--text-dim)]">
                          Metro Sector: {m.metroSector} • Bandwidth: {m.backhaulBandwidth}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-[var(--border-main)] bg-[var(--bg-surface)]/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <span className="text-[var(--text-dim)]">
            {softwareName} Enterprise Security • Complete user tracking dossier generated for Developer/CEO
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-[var(--border-main)] hover:bg-[var(--border-light)] text-[var(--text-main)] font-semibold transition"
          >
            Close Dossier
          </button>
        </div>
      </div>
    </div>
  );
};
