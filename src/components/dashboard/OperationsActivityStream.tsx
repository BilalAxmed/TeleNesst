import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { storage } from '../../services/storage';
import { AuditLogEntry, UserRole } from '../../types';
import {
  Activity,
  Shield,
  Search,
  Filter,
  ArrowRight,
  Download,
  PlusCircle,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Box,
  Layers,
  HardHat,
  Briefcase,
  DollarSign,
  UserCheck,
  Calendar,
  Lock,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  X,
  RefreshCw,
} from 'lucide-react';

export type ActivityCategory =
  | 'ALL'
  | 'Inventory'
  | 'ICT_Work'
  | 'DailyWorks'
  | 'Projects'
  | 'Finance'
  | 'System';

interface UnifiedActivityItem {
  id: string;
  timestamp: string;
  relativeTime: string;
  userName: string;
  userRole: UserRole | string;
  action: string;
  module: ActivityCategory;
  description: string;
  targetId?: string;
  targetModuleTab?: string;
  targetSubTab?: string;
  details?: Record<string, any>;
  badgeTone: 'emerald' | 'blue' | 'purple' | 'amber' | 'rose' | 'cyan' | 'slate';
}

export const OperationsActivityStream: React.FC = () => {
  const {
    setActiveTab,
    setSubTab,
    openLetterheadModal,
    currentUser,
    showToast,
    dataRevision,
    softwareName,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ActivityCategory>('ALL');
  const [isExpanded, setIsExpanded] = useState(false);
  const [viewMode, setViewMode] = useState<'timeline' | 'compact'>('timeline');
  const [selectedItemForModal, setSelectedItemForModal] = useState<UnifiedActivityItem | null>(null);
  const [isNewLogModalOpen, setIsNewLogModalOpen] = useState(false);

  // Manual Activity Log Form state
  const [newLogDescription, setNewLogDescription] = useState('');
  const [newLogModule, setNewLogModule] = useState<'Inventory' | 'ICT_Work' | 'DailyWorks' | 'Projects' | 'Finance' | 'System'>('DailyWorks');
  const [newLogAction, setNewLogAction] = useState<'CREATE' | 'UPDATE' | 'DELETE' | 'SETTINGS_CHANGE'>('CREATE');

  // Compute relative time string helper
  const getRelativeTimeString = (isoDate: string): string => {
    try {
      const diffMs = Date.now() - new Date(isoDate).getTime();
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      if (diffMinutes < 1) return 'Just now';
      if (diffMinutes < 60) return `${diffMinutes}m ago`;
      const diffHours = Math.floor(diffMinutes / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays}d ago`;
      return new Date(isoDate).toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch {
      return 'Recently';
    }
  };

  // Compile Unified Operations Feed
  const unifiedActivities: UnifiedActivityItem[] = useMemo(() => {
    const items: UnifiedActivityItem[] = [];

    // 1. Audit logs from storage
    const auditLogs = storage.getAuditLogs();
    auditLogs.forEach((log) => {
      let badgeTone: UnifiedActivityItem['badgeTone'] = 'blue';
      if (log.action === 'CREATE') badgeTone = 'emerald';
      else if (log.action === 'DELETE') badgeTone = 'rose';
      else if (log.action === 'LOGIN' || log.action === 'LOGOUT') badgeTone = 'cyan';
      else if (log.action === 'BACKUP_EXPORT') badgeTone = 'purple';
      else if (log.action === 'SETTINGS_CHANGE') badgeTone = 'amber';

      let targetModuleTab = 'dashboard';
      let targetSubTab: string | undefined = undefined;

      if (log.module === 'Inventory') {
        targetModuleTab = 'inventory';
        targetSubTab = 'stock-list';
      } else if (log.module === 'ICT_Work') {
        targetModuleTab = 'ict-insights';
        targetSubTab = 'ftth';
      } else if (log.module === 'DailyWorks') {
        targetModuleTab = 'projects';
        targetSubTab = 'daily-works';
      } else if (log.module === 'Projects') {
        targetModuleTab = 'projects';
        targetSubTab = 'ongoing';
      } else if (log.module === 'Finance') {
        targetModuleTab = 'finance';
        targetSubTab = 'maintenance';
      } else if (log.module === 'Users') {
        targetModuleTab = 'users';
      } else if (log.module === 'System') {
        targetModuleTab = 'settings';
      }

      items.push({
        id: log.id,
        timestamp: log.timestamp,
        relativeTime: getRelativeTimeString(log.timestamp),
        userName: log.userName,
        userRole: log.userRole,
        action: log.action,
        module: log.module as ActivityCategory,
        description: log.description,
        targetId: log.targetId,
        targetModuleTab,
        targetSubTab,
        details: log.details,
        badgeTone,
      });
    });

    // 2. Synthesize recent warehouse stock movements if not present in audit log
    try {
      const movements = storage.getMovements().slice(0, 10);
      movements.forEach((m) => {
        // Prevent duplicate if already described
        const exists = items.some((item) => item.description.includes(m.referenceNo) || item.targetId === m.id);
        if (!exists) {
          items.push({
            id: `mov_sync_${m.id}`,
            timestamp: m.date.includes('T') ? m.date : `${m.date}T10:00:00Z`,
            relativeTime: getRelativeTimeString(m.date.includes('T') ? m.date : `${m.date}T10:00:00Z`),
            userName: m.createdByUserName || 'Warehouse Team',
            userRole: 'Store Keeper',
            action: m.type === 'IN' ? 'STOCK_IN' : 'STOCK_OUT',
            module: 'Inventory',
            description: `Stock ${m.type}: ${m.quantity.toLocaleString()} units of ${m.itemName} (${m.type === 'OUT' ? 'Issued to ' + (m.projectOrRecipient || 'Field') : 'Received from ' + (m.vendorOrSupplier || 'Supplier')})`,
            targetId: m.itemId,
            targetModuleTab: 'inventory',
            targetSubTab: 'movements',
            badgeTone: m.type === 'IN' ? 'emerald' : 'amber',
            details: { ...m },
          });
        }
      });
    } catch (e) {
      console.error('Error synthesizing movements:', e);
    }

    // 3. Synthesize daily works logs
    try {
      const dailyWorks = storage.getDailyWorks().slice(0, 6);
      dailyWorks.forEach((dw) => {
        const exists = items.some((item) => item.targetId === dw.id || item.description.includes(dw.projectName));
        if (!exists) {
          items.push({
            id: `dw_sync_${dw.id}`,
            timestamp: dw.completionDateTime || `${dw.date}T17:00:00Z`,
            relativeTime: getRelativeTimeString(dw.completionDateTime || `${dw.date}T17:00:00Z`),
            userName: dw.teamLead || 'Field Team',
            userRole: 'Field Technician',
            action: dw.status === 'Verified' ? 'VERIFIED' : 'SUBMITTED',
            module: 'DailyWorks',
            description: `Field Progress: ${dw.workType} on ${dw.projectName} (${dw.metersInstalled?.toLocaleString() || 0}m installed, ${dw.tasksCompleted || 'tasks completed'})`,
            targetId: dw.id,
            targetModuleTab: 'projects',
            targetSubTab: 'daily-works',
            badgeTone: dw.status === 'Verified' ? 'emerald' : 'cyan',
            details: { ...dw },
          });
        }
      });
    } catch (e) {
      console.error('Error synthesizing daily works:', e);
    }

    // Sort chronologically descending (newest first)
    return items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [dataRevision]);

  // Filtered Activities
  const filteredActivities = useMemo(() => {
    return unifiedActivities.filter((item) => {
      const matchCategory = selectedCategory === 'ALL' || item.module === selectedCategory;
      if (!matchCategory) return false;

      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase().trim();
      return (
        item.description.toLowerCase().includes(q) ||
        item.userName.toLowerCase().includes(q) ||
        item.action.toLowerCase().includes(q) ||
        item.module.toLowerCase().includes(q) ||
        item.userRole.toLowerCase().includes(q)
      );
    });
  }, [unifiedActivities, selectedCategory, searchQuery]);

  // Counts by category
  const categoryCounts = useMemo(() => {
    const counts: Record<ActivityCategory, number> = {
      ALL: unifiedActivities.length,
      Inventory: 0,
      ICT_Work: 0,
      DailyWorks: 0,
      Projects: 0,
      Finance: 0,
      System: 0,
    };
    unifiedActivities.forEach((act) => {
      if (counts[act.module] !== undefined) {
        counts[act.module]++;
      }
    });
    return counts;
  }, [unifiedActivities]);

  // Handle Export Official Letterhead Audit Trail
  const handleExportLetterhead = () => {
    const columns = [
      { header: 'Time & Date', key: 'timestamp' },
      { header: 'Personnel', key: 'userName' },
      { header: 'Designation', key: 'userRole' },
      { header: 'Operation Action', key: 'action' },
      { header: 'Subsystem / Module', key: 'module' },
      { header: 'Operational Description & Reference', key: 'description' },
    ];

    const data = filteredActivities.map((act) => ({
      timestamp: new Date(act.timestamp).toLocaleString(),
      userName: act.userName,
      userRole: act.userRole,
      action: act.action,
      module: act.module,
      description: act.description,
    }));

    openLetterheadModal({
      title: `${softwareName} Comprehensive Operations Activity & Audit Stream Register`,
      columns,
      data,
      dateRange: `Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`,
      filterSummary: `Filtered Category: ${selectedCategory} • Total Operation Events: ${filteredActivities.length}`,
    });
  };

  // Submit manual operation note
  const handleCreateManualLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLogDescription.trim()) return;

    storage.logActivity({
      userId: currentUser?.id || 'usr_manual',
      userName: currentUser?.fullName || 'Authorized Operator',
      userRole: currentUser?.role || 'Developer/CEO',
      action: newLogAction,
      module: newLogModule,
      targetId: `manual_${Date.now()}`,
      description: newLogDescription.trim(),
      details: { manualEntry: true, loggedAt: new Date().toISOString() },
    });

    showToast('Operational activity logged successfully to live stream.', 'success');
    setNewLogDescription('');
    setIsNewLogModalOpen(false);
  };

  // Icon mapping
  const getModuleIcon = (module: ActivityCategory) => {
    switch (module) {
      case 'Inventory':
        return Box;
      case 'ICT_Work':
        return Layers;
      case 'DailyWorks':
        return HardHat;
      case 'Projects':
        return Briefcase;
      case 'Finance':
        return DollarSign;
      case 'System':
        return Shield;
      default:
        return Activity;
    }
  };

  const getActionBadgeStyle = (tone: UnifiedActivityItem['badgeTone']) => {
    switch (tone) {
      case 'emerald':
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
      case 'amber':
        return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
      case 'rose':
        return 'bg-rose-500/15 text-rose-400 border-rose-500/30';
      case 'purple':
        return 'bg-purple-500/15 text-purple-400 border-purple-500/30';
      case 'cyan':
        return 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30';
      case 'slate':
        return 'bg-slate-500/15 text-slate-400 border-slate-500/30';
      default:
        return 'bg-blue-500/15 text-blue-400 border-blue-500/30';
    }
  };

  const displayedList = isExpanded ? filteredActivities : filteredActivities.slice(0, 6);

  return (
    <div className="p-4 sm:p-5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-main)] shadow-xs transition-all">
      {/* Stream Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--border-main)]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/25 flex items-center justify-center text-blue-400 shrink-0">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-sm sm:text-base text-[var(--text-main)] tracking-tight">
                Recent Operations Activity Stream
              </h2>
              {/* Pulsing Live Dot */}
              <span className="relative flex h-2 w-2" title="Live Continuous Stream Active">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </div>
            <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
              Real-time chronological events from warehouse logistics, fiber field works, ICT rollouts & finance
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setIsNewLogModalOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[var(--bg-surface)] hover:bg-[var(--bg-hover)] border border-[var(--border-main)] text-xs font-semibold text-[var(--text-main)] transition cursor-pointer"
            title="Log manual operational note"
          >
            <PlusCircle className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Log Event</span>
          </button>

          <button
            onClick={handleExportLetterhead}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[var(--bg-surface)] hover:bg-[var(--bg-hover)] border border-[var(--border-main)] text-xs font-semibold text-[var(--text-main)] transition cursor-pointer"
            title="Export official Letterhead Activity Report"
          >
            <Download className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline">Export Report</span>
          </button>

          {/* View Toggle */}
          <div className="flex items-center rounded-lg border border-[var(--border-main)] bg-[var(--bg-surface)] p-0.5 text-xs">
            <button
              onClick={() => setViewMode('timeline')}
              className={`px-2 py-1 rounded text-[10px] font-semibold transition ${
                viewMode === 'timeline'
                  ? 'bg-[var(--accent)] text-white'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              Timeline
            </button>
            <button
              onClick={() => setViewMode('compact')}
              className={`px-2 py-1 rounded text-[10px] font-semibold transition ${
                viewMode === 'compact'
                  ? 'bg-[var(--accent)] text-white'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              Compact
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="mt-3 flex flex-col md:flex-row md:items-center justify-between gap-2.5">
        {/* Category Pills */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
          {(
            [
              { id: 'ALL', label: 'All Events' },
              { id: 'Inventory', label: 'Warehouse Stock' },
              { id: 'ICT_Work', label: 'ICT Telecom' },
              { id: 'DailyWorks', label: 'Daily Field Works' },
              { id: 'Projects', label: 'Projects' },
              { id: 'Finance', label: 'Finance' },
              { id: 'System', label: 'System & Auth' },
            ] as { id: ActivityCategory; label: string }[]
          ).map((cat) => {
            const isSelected = selectedCategory === cat.id;
            const count = categoryCounts[cat.id] || 0;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition cursor-pointer shrink-0 ${
                  isSelected
                    ? 'bg-[var(--accent)] text-white shadow-xs'
                    : 'bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-hover)] border border-[var(--border-main)]'
                }`}
              >
                <span>{cat.label}</span>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-[var(--bg-card)] text-[var(--text-dim)]'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-64 shrink-0">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-dim)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter operations..."
            className="w-full pl-8 pr-7 py-1 text-xs rounded-lg bg-[var(--bg-surface)] border border-[var(--border-main)] text-[var(--text-main)] placeholder:text-[var(--text-dim)] focus:outline-none focus:border-[var(--accent)] transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--text-dim)] hover:text-[var(--text-main)] p-0.5"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Activity Stream Entries */}
      <div className="mt-3.5">
        {displayedList.length === 0 ? (
          <div className="py-8 px-4 text-center border border-dashed border-[var(--border-main)] rounded-xl bg-[var(--bg-surface)]/40">
            <Activity className="w-6 h-6 mx-auto text-[var(--text-dim)] mb-1.5 opacity-50" />
            <p className="text-xs font-medium text-[var(--text-muted)]">No operations matching current filter</p>
            <p className="text-[10px] text-[var(--text-dim)] mt-0.5">
              Try switching category tab or clearing search keywords.
            </p>
          </div>
        ) : viewMode === 'timeline' ? (
          /* Timeline View */
          <div className="relative pl-5 sm:pl-6 space-y-3 before:absolute before:left-2 sm:before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[var(--border-main)]/80">
            {displayedList.map((item) => {
              const Icon = getModuleIcon(item.module);
              return (
                <div
                  key={item.id}
                  className="relative group flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-lg bg-[var(--bg-surface)]/60 hover:bg-[var(--bg-hover)] border border-[var(--border-main)] transition"
                >
                  {/* Timeline Node Icon */}
                  <div className="absolute -left-5 sm:-left-6 top-3 -translate-x-1/2 w-4 h-4 rounded-full bg-[var(--bg-card)] border-2 border-blue-400 flex items-center justify-center shrink-0 shadow-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  </div>

                  <div className="flex items-start gap-2.5 min-w-0 flex-1">
                    <div className="w-7 h-7 rounded-lg bg-[var(--bg-card)] border border-[var(--border-main)] flex items-center justify-center text-[var(--text-muted)] shrink-0 mt-0.5">
                      <Icon className="w-3.5 h-3.5" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span
                          className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold border uppercase tracking-wider ${getActionBadgeStyle(
                            item.badgeTone
                          )}`}
                        >
                          {item.action}
                        </span>
                        <span className="text-xs font-bold text-[var(--text-main)] truncate">
                          {item.userName}
                        </span>
                        <span className="text-[10px] text-[var(--text-dim)]">({item.userRole})</span>
                        <span className="text-[10px] text-blue-400/90 font-medium">#{item.module}</span>
                      </div>

                      <div className="text-xs text-[var(--text-muted)] mt-1 leading-relaxed break-words">
                        {item.description}
                      </div>
                    </div>
                  </div>

                  {/* Actions & Timestamps */}
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0 pt-1 sm:pt-0">
                    <div className="text-right">
                      <div className="text-[10px] font-mono font-medium text-[var(--text-main)]">
                        {item.relativeTime}
                      </div>
                      <div className="text-[9px] font-mono text-[var(--text-dim)]">
                        {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {item.targetModuleTab && (
                        <button
                          onClick={() => {
                            setActiveTab(item.targetModuleTab!);
                            if (item.targetSubTab) setSubTab(item.targetSubTab);
                            showToast(`Navigated to ${item.module} workspace`, 'info');
                          }}
                          className="px-2 py-1 rounded bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] border border-[var(--border-main)] text-[10px] font-semibold text-blue-400 hover:text-blue-300 transition flex items-center gap-1 cursor-pointer"
                          title={`Open ${item.module}`}
                        >
                          <span>Open</span>
                          <ArrowRight className="w-2.5 h-2.5" />
                        </button>
                      )}

                      <button
                        onClick={() => setSelectedItemForModal(item)}
                        className="p-1 rounded bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] border border-[var(--border-main)] text-[var(--text-dim)] hover:text-[var(--text-main)] transition cursor-pointer"
                        title="View audit details"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* High-Density Compact Table View */
          <div className="border border-[var(--border-main)] rounded-lg overflow-hidden bg-[var(--bg-surface)]/40 divide-y divide-[var(--border-main)]/60 text-xs">
            {displayedList.map((item) => {
              const Icon = getModuleIcon(item.module);
              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-2 hover:bg-[var(--bg-hover)] transition gap-2"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <Icon className="w-3.5 h-3.5 text-[var(--text-dim)] shrink-0" />
                    <span
                      className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold border uppercase shrink-0 ${getActionBadgeStyle(
                        item.badgeTone
                      )}`}
                    >
                      {item.action}
                    </span>
                    <span className="font-semibold text-[var(--text-main)] text-xs shrink-0">
                      {item.userName}
                    </span>
                    <span className="text-[11px] text-[var(--text-muted)] truncate min-w-0">
                      {item.description}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] font-mono text-[var(--text-dim)]">
                      {item.relativeTime}
                    </span>
                    {item.targetModuleTab && (
                      <button
                        onClick={() => {
                          setActiveTab(item.targetModuleTab!);
                          if (item.targetSubTab) setSubTab(item.targetSubTab);
                        }}
                        className="text-[10px] text-blue-400 hover:underline flex items-center gap-0.5 cursor-pointer"
                      >
                        <span>Open</span>
                        <ArrowRight className="w-2.5 h-2.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Stream Footer with Expand / Show More Toggle */}
      <div className="mt-3.5 pt-2.5 border-t border-[var(--border-main)] flex items-center justify-between text-xs text-[var(--text-dim)]">
        <div className="flex items-center gap-2 font-mono text-[10px]">
          <span>
            Showing {displayedList.length} of {filteredActivities.length} operational records
          </span>
          <span className="inline-block w-1 h-1 rounded-full bg-[var(--border-main)]" />
          <span className="text-emerald-400 font-semibold">Continuous In-Memory Sync</span>
        </div>

        {filteredActivities.length > 6 && (
          <button
            onClick={() => setIsExpanded((prev) => !prev)}
            className="flex items-center gap-1 text-xs font-semibold text-blue-400 hover:text-blue-300 transition cursor-pointer"
          >
            <span>{isExpanded ? 'Show Less (Collapse)' : `Show All (${filteredActivities.length})`}</span>
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        )}
      </div>

      {/* Detail Modal for Selected Event */}
      {selectedItemForModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
          onClick={() => setSelectedItemForModal(null)}
        >
          <div
            className="w-full max-w-lg bg-[var(--bg-card)] border border-[var(--border-main)] rounded-xl shadow-2xl p-5 text-[var(--text-main)] animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-main)]">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-blue-400" />
                <h3 className="font-bold text-sm">Operation Audit Record Detail</h3>
              </div>
              <button
                onClick={() => setSelectedItemForModal(null)}
                className="p-1 rounded text-[var(--text-dim)] hover:text-[var(--text-main)] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 bg-[var(--bg-surface)] p-3 rounded-lg border border-[var(--border-main)]">
                <div>
                  <div className="text-[10px] text-[var(--text-dim)] uppercase font-mono">Event ID</div>
                  <div className="font-mono font-semibold">{selectedItemForModal.id}</div>
                </div>
                <div>
                  <div className="text-[10px] text-[var(--text-dim)] uppercase font-mono">Timestamp</div>
                  <div className="font-mono">{new Date(selectedItemForModal.timestamp).toLocaleString()}</div>
                </div>
                <div className="mt-2">
                  <div className="text-[10px] text-[var(--text-dim)] uppercase font-mono">Authorized User</div>
                  <div className="font-semibold text-[var(--text-main)]">
                    {selectedItemForModal.userName} ({selectedItemForModal.userRole})
                  </div>
                </div>
                <div className="mt-2">
                  <div className="text-[10px] text-[var(--text-dim)] uppercase font-mono">Action & Subsystem</div>
                  <div className="font-semibold text-blue-400">
                    {selectedItemForModal.action} in {selectedItemForModal.module}
                  </div>
                </div>
              </div>

              <div>
                <div className="text-[10px] text-[var(--text-dim)] uppercase font-mono mb-1">
                  Operation Narrative Description
                </div>
                <div className="p-3 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-main)] leading-relaxed">
                  {selectedItemForModal.description}
                </div>
              </div>

              {selectedItemForModal.details && (
                <div>
                  <div className="text-[10px] text-[var(--text-dim)] uppercase font-mono mb-1">
                    Structured Audit Payload
                  </div>
                  <pre className="p-3 rounded-lg bg-[var(--bg-main)] border border-[var(--border-main)] text-[10px] font-mono overflow-x-auto text-emerald-400">
                    {JSON.stringify(selectedItemForModal.details, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div className="mt-5 pt-3 border-t border-[var(--border-main)] flex items-center justify-between">
              <span className="text-[10px] font-mono text-[var(--text-dim)]">ISO-27001 Non-Repudiation Log</span>
              <div className="flex items-center gap-2">
                {selectedItemForModal.targetModuleTab && (
                  <button
                    onClick={() => {
                      setActiveTab(selectedItemForModal.targetModuleTab!);
                      if (selectedItemForModal.targetSubTab) setSubTab(selectedItemForModal.targetSubTab);
                      setSelectedItemForModal(null);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-[var(--accent)] text-white text-xs font-semibold hover:opacity-90 transition flex items-center gap-1 cursor-pointer"
                  >
                    <span>Open in {selectedItemForModal.module}</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
                <button
                  onClick={() => setSelectedItemForModal(null)}
                  className="px-3 py-1.5 rounded-lg bg-[var(--bg-surface)] hover:bg-[var(--bg-hover)] border border-[var(--border-main)] text-xs text-[var(--text-main)] cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manual Operation Event Logging Modal */}
      {isNewLogModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
          onClick={() => setIsNewLogModalOpen(false)}
        >
          <div
            className="w-full max-w-md bg-[var(--bg-card)] border border-[var(--border-main)] rounded-xl shadow-2xl p-5 text-[var(--text-main)] animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-main)]">
              <div className="flex items-center gap-2">
                <PlusCircle className="w-4 h-4 text-emerald-400" />
                <h3 className="font-bold text-sm">Log Operational Activity Event</h3>
              </div>
              <button
                onClick={() => setIsNewLogModalOpen(false)}
                className="p-1 rounded text-[var(--text-dim)] hover:text-[var(--text-main)] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateManualLog} className="mt-4 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-mono text-[var(--text-dim)] uppercase mb-1">
                    Subsystem Module
                  </label>
                  <select
                    value={newLogModule}
                    onChange={(e) => setNewLogModule(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-main)] text-xs text-[var(--text-main)] focus:outline-none"
                  >
                    <option value="DailyWorks">DailyWorks (Field)</option>
                    <option value="Inventory">Inventory (Stock)</option>
                    <option value="ICT_Work">ICT_Work (Telecom)</option>
                    <option value="Projects">Projects (Turnkey)</option>
                    <option value="Finance">Finance (Expenses)</option>
                    <option value="System">System & Security</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-[var(--text-dim)] uppercase mb-1">
                    Action Type
                  </label>
                  <select
                    value={newLogAction}
                    onChange={(e) => setNewLogAction(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-main)] text-xs text-[var(--text-main)] focus:outline-none"
                  >
                    <option value="CREATE">CREATE (New Event)</option>
                    <option value="UPDATE">UPDATE (Revision)</option>
                    <option value="SETTINGS_CHANGE">SETTINGS / CONFIG</option>
                    <option value="DELETE">DELETE (Removal)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono text-[var(--text-dim)] uppercase mb-1">
                  Event Description / Operational Note
                </label>
                <textarea
                  required
                  rows={3}
                  value={newLogDescription}
                  onChange={(e) => setNewLogDescription(e.target.value)}
                  placeholder="e.g. Splicing team completed 6 FAT closures in Sector H-8. OTDR link budget verified."
                  className="w-full p-2.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-main)] text-xs text-[var(--text-main)] placeholder:text-[var(--text-dim)] focus:outline-none focus:border-[var(--accent)]"
                />
              </div>

              <div className="p-2.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-main)] text-[11px] text-[var(--text-muted)] flex items-center gap-2">
                <UserCheck className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <span>
                  Logging as <strong className="text-[var(--text-main)]">{currentUser?.fullName}</strong> ({currentUser?.role})
                </span>
              </div>

              <div className="pt-3 border-t border-[var(--border-main)] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewLogModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg bg-[var(--bg-surface)] hover:bg-[var(--bg-hover)] border border-[var(--border-main)] text-xs text-[var(--text-main)] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 rounded-lg bg-[var(--accent)] text-white text-xs font-semibold hover:opacity-90 transition cursor-pointer"
                >
                  Append to Live Stream
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
