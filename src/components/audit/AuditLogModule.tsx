import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { storage } from '../../services/storage';
import { ActivityLog } from '../../types';
import {
  FileCheck,
  Search,
  Filter,
  ShieldCheck,
  Lock,
  Printer,
  Calendar,
  UserCheck,
  CheckCircle,
  AlertCircle,
  Activity,
  History,
} from 'lucide-react';

export const AuditLogModule: React.FC = () => {
  const { openLetterheadModal, currentUser, isDevCEO, isAdmin, softwareName } = useApp();
  const [logs] = useState<ActivityLog[]>(() => storage.getAuditLogs());

  const [searchQuery, setSearchQuery] = useState('');
  const [moduleFilter, setModuleFilter] = useState('ALL');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchSearch =
        log.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.module.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.action.toLowerCase().includes(searchQuery.toLowerCase());

      const matchModule = moduleFilter === 'ALL' || log.module === moduleFilter;
      const matchAction = actionFilter === 'ALL' || log.action === actionFilter;

      let matchDate = true;
      if (dateFrom) matchDate = matchDate && log.timestamp >= dateFrom;
      if (dateTo) matchDate = matchDate && log.timestamp.split('T')[0] <= dateTo;

      return matchSearch && matchModule && matchAction && matchDate;
    });
  }, [logs, searchQuery, moduleFilter, actionFilter, dateFrom, dateTo]);

  const handleExportAudit = () => {
    const columns = [
      { header: 'Timestamp', key: 'timestamp' },
      { header: 'User', key: 'userName' },
      { header: 'Role', key: 'userRole' },
      { header: 'Action', key: 'action' },
      { header: 'Module', key: 'module' },
      { header: 'Audit Description', key: 'description' },
    ];

    openLetterheadModal({
      title: `${softwareName} Immutable System Audit Trail & Compliance Register`,
      columns,
      data: filteredLogs,
      dateRange: dateFrom && dateTo ? `${dateFrom} to ${dateTo}` : `Generated: ${new Date().toLocaleDateString()}`,
      filterSummary: `Total Activity Records: ${filteredLogs.length}`,
    });
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'CREATE':
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
      case 'UPDATE':
        return 'bg-blue-500/15 text-blue-400 border-blue-500/30';
      case 'DELETE':
        return 'bg-rose-500/15 text-rose-400 border-rose-500/30';
      case 'PASSWORD_CHANGE':
        return 'bg-purple-500/15 text-purple-400 border-purple-500/30';
      case 'LOGIN':
        return 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30';
      default:
        return 'bg-[var(--bg-input)] text-[var(--text-muted)] border-[var(--border-light)]';
    }
  };

  return (
    <div className="p-4 lg:p-6 space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black tracking-tight text-[var(--text-main)]">
              Audit Trail & Compliance Ledger
            </h1>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              ISO 27001 Non-Deletable
            </span>
          </div>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            Cryptographically sealed and append-only activity register tracking inventory flows, ICT changes, and auth events
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border-main)] text-xs text-[var(--text-dim)]">
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            <span>Immutable Append-Only</span>
          </div>

          <button
            onClick={handleExportAudit}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] border border-[var(--border-main)] text-xs font-semibold text-[var(--text-main)] transition"
          >
            <Printer className="w-3.5 h-3.5 text-blue-400" />
            <span>Export Letterhead</span>
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-main)] flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <div className="relative w-full">
            <Search className="w-3.5 h-3.5 text-[var(--text-dim)] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search user, description, module or action..."
              className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-[var(--bg-input)] border border-[var(--border-main)] text-xs text-[var(--text-main)] focus:outline-none focus:border-[var(--accent)]"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={moduleFilter}
            onChange={(e) => setModuleFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg bg-[var(--bg-input)] border border-[var(--border-main)] text-xs text-[var(--text-main)]"
          >
            <option value="ALL">All Modules</option>
            <option value="Inventory">Inventory</option>
            <option value="ICT_Work">ICT Works</option>
            <option value="Finance">Finance</option>
            <option value="Projects">Projects</option>
            <option value="Daily_Works">Daily Works</option>
            <option value="Users">Users & Auth</option>
            <option value="Settings">System Settings</option>
          </select>

          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg bg-[var(--bg-input)] border border-[var(--border-main)] text-xs text-[var(--text-main)]"
          >
            <option value="ALL">All Actions</option>
            <option value="CREATE">CREATE</option>
            <option value="UPDATE">UPDATE</option>
            <option value="DELETE">DELETE</option>
            <option value="LOGIN">LOGIN</option>
            <option value="PASSWORD_CHANGE">PASSWORD_CHANGE</option>
          </select>

          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-[var(--text-dim)]">From:</span>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="px-2 py-1 rounded bg-[var(--bg-input)] border border-[var(--border-main)] text-[11px] text-[var(--text-main)]"
            />
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="border border-[var(--border-main)] rounded-xl overflow-hidden bg-[var(--bg-card)] shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[var(--border-main)] bg-[var(--bg-surface)] text-[var(--text-muted)] font-semibold">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4 text-center">Action</th>
                <th className="py-3 px-4">Target Module</th>
                <th className="py-3 px-4">Detailed Operation Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-main)]/60">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[var(--text-dim)]">
                    No activity records found matching filters.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-[var(--bg-hover)] transition">
                    <td className="py-3 px-4 font-mono text-[var(--text-dim)] text-[11px] whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-bold text-[var(--text-main)] whitespace-nowrap">
                      {log.userName}
                    </td>
                    <td className="py-3 px-4 text-[10px] text-blue-400 whitespace-nowrap">
                      {log.userRole}
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${getActionBadge(
                          log.action
                        )}`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded bg-[var(--bg-input)] text-[11px] font-medium border border-[var(--border-light)] text-[var(--text-muted)]">
                        {log.module}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[var(--text-main)]">{log.description}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
