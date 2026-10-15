import React, { useState, useEffect } from 'react';
import {
  Shield,
  CheckCircle2,
  X,
  Lock,
  Box,
  Radio,
  Briefcase,
  DollarSign,
  ClipboardList,
  FileSpreadsheet,
  Sliders,
  Check,
  AlertCircle,
  Crown,
} from 'lucide-react';
import { User, UserRole, UserOperationsPermissions, DEFAULT_OPERATIONS_PERMISSIONS } from '../../types';

interface UserPermissionsModalProps {
  isOpen: boolean;
  user: User | null;
  currentUserRole?: string;
  isDevCEO: boolean;
  isAdmin: boolean;
  onClose: () => void;
  onSave: (userId: string, updatedRole: UserRole, permissions: UserOperationsPermissions) => void;
}

export const UserPermissionsModal: React.FC<UserPermissionsModalProps> = ({
  isOpen,
  user,
  isDevCEO,
  isAdmin,
  onClose,
  onSave,
}) => {
  const [role, setRole] = useState<UserRole>('Standard User');
  const [permissions, setPermissions] = useState<UserOperationsPermissions>(
    DEFAULT_OPERATIONS_PERMISSIONS['Standard User']
  );

  useEffect(() => {
    if (user) {
      setRole(user.role);
      setPermissions(
        user.operationsPermissions ||
          DEFAULT_OPERATIONS_PERMISSIONS[user.role] ||
          DEFAULT_OPERATIONS_PERMISSIONS['Standard User']
      );
    }
  }, [user]);

  if (!isOpen || !user) return null;

  const isTargetCEO = user.role === 'Developer/CEO';
  // Rule: Only Developer/CEO has full rights to modify other users and the software.
  // Admin & Standard users have NO permission to modify Developer/CEO or other users.
  // Developer/CEO account is root authority and cannot be demoted or have its permissions altered.
  const canModifyRole = isDevCEO && !isTargetCEO;
  const canModifyPermissions = isDevCEO && !isTargetCEO;

  const handleToggle = (key: keyof UserOperationsPermissions) => {
    if (!canModifyPermissions) return;
    setPermissions((prev) => {
      const nextVal = !prev[key];
      const updated: UserOperationsPermissions = {
        ...prev,
        [key]: nextVal,
      };
      if (key === 'canViewInventory') updated.canAccessInventory = nextVal;
      if (key === 'canAccessInventory') updated.canViewInventory = nextVal;
      if (key === 'canViewICT') updated.canAccessICT = nextVal;
      if (key === 'canAccessICT') updated.canViewICT = nextVal;
      if (key === 'canViewProjects') updated.canAccessProjects = nextVal;
      if (key === 'canAccessProjects') updated.canViewProjects = nextVal;
      if (key === 'canViewFinance') updated.canAccessFinance = nextVal;
      if (key === 'canAccessFinance') updated.canViewFinance = nextVal;
      if (key === 'canViewDailyWorks') updated.canAccessDailyWorks = nextVal;
      if (key === 'canAccessDailyWorks') updated.canViewDailyWorks = nextVal;
      return updated;
    });
  };

  const applyPreset = (presetName: 'full' | 'field' | 'warehouse' | 'finance' | 'readonly') => {
    if (!canModifyPermissions) return;

    if (presetName === 'full') {
      setPermissions({
        ...DEFAULT_OPERATIONS_PERMISSIONS['Developer/CEO'],
        canViewInventory: true,
        canViewICT: true,
        canViewProjects: true,
        canViewFinance: true,
        canViewDailyWorks: true,
      });
    } else if (presetName === 'field') {
      setPermissions({
        canAccessInventory: true,
        canViewInventory: true,
        canEditInventory: false,
        canDeleteInventory: false,
        canAccessICT: true,
        canViewICT: true,
        canEditICT: true,
        canDeleteICT: false,
        canAccessProjects: true,
        canViewProjects: true,
        canEditProjects: true,
        canDeleteProjects: false,
        canAccessFinance: false,
        canViewFinance: false,
        canEditFinance: false,
        canDeleteFinance: false,
        canAccessDailyWorks: true,
        canViewDailyWorks: true,
        canEditDailyWorks: true,
        canExportReports: true,
        canAccessAnalytics: true,
        canPrintLetterhead: true,
        canAccessSettings: false,
      });
    } else if (presetName === 'warehouse') {
      setPermissions({
        canAccessInventory: true,
        canViewInventory: true,
        canEditInventory: true,
        canDeleteInventory: false,
        canAccessICT: false,
        canViewICT: false,
        canEditICT: false,
        canDeleteICT: false,
        canAccessProjects: true,
        canViewProjects: true,
        canEditProjects: false,
        canDeleteProjects: false,
        canAccessFinance: false,
        canViewFinance: false,
        canEditFinance: false,
        canDeleteFinance: false,
        canAccessDailyWorks: true,
        canViewDailyWorks: true,
        canEditDailyWorks: true,
        canExportReports: true,
        canAccessAnalytics: true,
        canPrintLetterhead: true,
        canAccessSettings: false,
      });
    } else if (presetName === 'finance') {
      setPermissions({
        canAccessInventory: true,
        canViewInventory: true,
        canEditInventory: false,
        canDeleteInventory: false,
        canAccessICT: false,
        canViewICT: false,
        canEditICT: false,
        canDeleteICT: false,
        canAccessProjects: true,
        canViewProjects: true,
        canEditProjects: false,
        canDeleteProjects: false,
        canAccessFinance: true,
        canViewFinance: true,
        canEditFinance: true,
        canDeleteFinance: false,
        canAccessDailyWorks: false,
        canViewDailyWorks: false,
        canEditDailyWorks: false,
        canExportReports: true,
        canAccessAnalytics: true,
        canPrintLetterhead: true,
        canAccessSettings: false,
      });
    } else if (presetName === 'readonly') {
      setPermissions({
        canAccessInventory: true,
        canViewInventory: true,
        canEditInventory: false,
        canDeleteInventory: false,
        canAccessICT: true,
        canViewICT: true,
        canEditICT: false,
        canDeleteICT: false,
        canAccessProjects: true,
        canViewProjects: true,
        canEditProjects: false,
        canDeleteProjects: false,
        canAccessFinance: true,
        canViewFinance: true,
        canEditFinance: false,
        canDeleteFinance: false,
        canAccessDailyWorks: true,
        canViewDailyWorks: true,
        canEditDailyWorks: false,
        canExportReports: false,
        canAccessAnalytics: true,
        canPrintLetterhead: false,
        canAccessSettings: false,
      });
    }
  };

  const handleSave = () => {
    const finalPermissions: UserOperationsPermissions = {
      ...permissions,
      canAccessInventory: permissions.canAccessInventory ?? permissions.canViewInventory ?? true,
      canViewInventory: permissions.canViewInventory ?? permissions.canAccessInventory ?? true,
      canAccessICT: permissions.canAccessICT ?? permissions.canViewICT ?? true,
      canViewICT: permissions.canViewICT ?? permissions.canAccessICT ?? true,
      canAccessProjects: permissions.canAccessProjects ?? permissions.canViewProjects ?? true,
      canViewProjects: permissions.canViewProjects ?? permissions.canAccessProjects ?? true,
      canAccessFinance: permissions.canAccessFinance ?? permissions.canViewFinance ?? false,
      canViewFinance: permissions.canViewFinance ?? permissions.canAccessFinance ?? false,
      canAccessDailyWorks: permissions.canAccessDailyWorks ?? permissions.canViewDailyWorks ?? true,
      canViewDailyWorks: permissions.canViewDailyWorks ?? permissions.canAccessDailyWorks ?? true,
    };
    onSave(user.id, role, finalPermissions);
    onClose();
  };

  const featureGroups = [
    {
      title: 'Inventory & Stock Depot',
      icon: Box,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/20',
      items: [
        {
          key: 'canViewInventory' as keyof UserOperationsPermissions,
          label: 'View Stock Balances & Depots',
          desc: 'Access Stock Master, warehouse ledgers, and SKU balances',
        },
        {
          key: 'canEditInventory' as keyof UserOperationsPermissions,
          label: 'Stock Movements & Add/Edit SKUs',
          desc: 'Record Flow IN/OUT dispatches and create or edit inventory items',
        },
        {
          key: 'canDeleteInventory' as keyof UserOperationsPermissions,
          label: 'Delete Inventory SKUs',
          desc: 'Permanently remove stock catalog entries from warehouse ledger',
          danger: true,
        },
      ],
    },
    {
      title: 'ICT Field Operations & Fiber Insights',
      icon: Radio,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/20',
      items: [
        {
          key: 'canViewICT' as keyof UserOperationsPermissions,
          label: 'View Fiber Optic Insights',
          desc: 'Access FTTH, FTTB, and FTTM infrastructure metrics & maps',
        },
        {
          key: 'canEditICT' as keyof UserOperationsPermissions,
          label: 'Add & Modify ICT Records',
          desc: 'Log optical splicing, testing results, and customer premises links',
        },
        {
          key: 'canDeleteICT' as keyof UserOperationsPermissions,
          label: 'Delete ICT Network Records',
          desc: 'Permanently delete optical route and fiber site documentation',
          danger: true,
        },
      ],
    },
    {
      title: 'Telecom Projects & Milestones',
      icon: Briefcase,
      color: 'text-indigo-400',
      bgColor: 'bg-indigo-500/10',
      borderColor: 'border-indigo-500/20',
      items: [
        {
          key: 'canViewProjects' as keyof UserOperationsPermissions,
          label: 'View Projects & Milestones',
          desc: 'Inspect telecom rollout status, Gantt timeline, and deliverables',
        },
        {
          key: 'canEditProjects' as keyof UserOperationsPermissions,
          label: 'Create & Update Projects',
          desc: 'Modify project deliverables, assign personnel, and update progress',
        },
        {
          key: 'canDeleteProjects' as keyof UserOperationsPermissions,
          label: 'Delete Project Records',
          desc: 'Permanently remove project files and contract milestones',
          danger: true,
        },
      ],
    },
    {
      title: 'Commercial, Finance & Expenses',
      icon: DollarSign,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/20',
      items: [
        {
          key: 'canViewFinance' as keyof UserOperationsPermissions,
          label: 'View Financial Ledger',
          desc: 'Review project disbursements, multi-currency ledger, and totals',
        },
        {
          key: 'canEditFinance' as keyof UserOperationsPermissions,
          label: 'Record Expenses & Invoices',
          desc: 'Submit PO invoices, field technician allowances, and receipts',
        },
        {
          key: 'canDeleteFinance' as keyof UserOperationsPermissions,
          label: 'Delete Financial Vouchers',
          desc: 'Permanently delete fiscal transactions and expense entries',
          danger: true,
        },
      ],
    },
    {
      title: 'Field Logs & Daily Works',
      icon: ClipboardList,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/20',
      items: [
        {
          key: 'canViewDailyWorks' as keyof UserOperationsPermissions,
          label: 'View Daily Site Logs',
          desc: 'Inspect field technician reports, route surveys, and weather logs',
        },
        {
          key: 'canEditDailyWorks' as keyof UserOperationsPermissions,
          label: 'Submit & Edit Field Works',
          desc: 'Create daily progress entries, cable meterage installed, and photos',
        },
      ],
    },
    {
      title: 'Official Reports & Verification',
      icon: FileSpreadsheet,
      color: 'text-teal-400',
      bgColor: 'bg-teal-500/10',
      borderColor: 'border-teal-500/20',
      items: [
        {
          key: 'canExportReports' as keyof UserOperationsPermissions,
          label: 'Generate Letterhead & QR Reports',
          desc: 'Export official verified documents with cryptographic QR certification',
        },
      ],
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-3xl bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-[var(--border-main)] bg-[var(--bg-card)]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/25">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-[var(--text-main)]">
                  Operations Core Access & Role Assignment
                </h3>
                {isTargetCEO && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                    <Crown className="w-3 h-3" />
                    Developer/CEO
                  </span>
                )}
              </div>
              <p className="text-xs text-[var(--text-muted)]">
                Assign role and authorize specific Operations features for{' '}
                <strong className="text-[var(--text-main)]">{user.fullName}</strong> ({user.username})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--text-dim)] hover:text-[var(--text-main)] hover:bg-[var(--bg-hover)] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
          {/* Notice about Developer/CEO exclusive governance */}
          <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/25 text-blue-300 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-blue-400" />
            <div className="space-y-0.5 leading-relaxed">
              <span className="font-bold text-[11px] text-blue-200">
                {isDevCEO
                  ? 'Developer/CEO System Authority: Full Management Rights'
                  : 'Read-Only View: Admin & Standard User Restricted'}
              </span>
              <p className="text-[11px] text-blue-300/90">
                {isDevCEO
                  ? 'As Developer/CEO, you have full rights to assign roles and configure granular operations permissions for team members. Note: Exactly one Developer/CEO account is permitted in the system.'
                  : 'Only the Developer/CEO possesses permission to modify user accounts, assign roles, or alter feature access. Admin and Standard users cannot modify the Developer/CEO account or other user accounts.'}
              </p>
            </div>
          </div>

          {/* Role Selection Box */}
          <div className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-main)] space-y-3">
            <div className="flex items-center justify-between">
              <div className="font-bold text-xs text-[var(--text-main)] flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-purple-400" />
                <span>Primary Access Tier</span>
              </div>
              <span className="text-[10px] text-[var(--text-dim)]">
                Determines base security tier
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* Standard User */}
              <button
                type="button"
                disabled={!canModifyRole || isTargetCEO}
                onClick={() => setRole('Standard User')}
                className={`p-3 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${
                  role === 'Standard User'
                    ? 'bg-blue-600/15 border-blue-500 text-blue-300 shadow-sm'
                    : 'bg-[var(--bg-surface)] border-[var(--border-main)] text-[var(--text-muted)] hover:border-blue-500/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-[var(--text-main)]">Standard User</span>
                  {role === 'Standard User' && <Check className="w-4 h-4 text-blue-400" />}
                </div>
                <p className="text-[10px] text-[var(--text-dim)] mt-1.5 leading-normal">
                  Field engineer or technician with assigned operations permissions
                </p>
              </button>

              {/* Admin */}
              <button
                type="button"
                disabled={!canModifyRole || isTargetCEO}
                onClick={() => setRole('Admin')}
                className={`p-3 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${
                  role === 'Admin'
                    ? 'bg-emerald-600/15 border-emerald-500 text-emerald-300 shadow-sm'
                    : 'bg-[var(--bg-surface)] border-[var(--border-main)] text-[var(--text-muted)] hover:border-emerald-500/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-[var(--text-main)]">Administrator</span>
                  {role === 'Admin' && <Check className="w-4 h-4 text-emerald-400" />}
                </div>
                <p className="text-[10px] text-[var(--text-dim)] mt-1.5 leading-normal">
                  Operations supervisor with administrative access (cannot modify Developer/CEO)
                </p>
              </button>

              {/* Developer/CEO - Exclusively reserved for single Bilal Ahmed account */}
              <button
                type="button"
                disabled={true}
                className={`p-3 rounded-xl border text-left transition flex flex-col justify-between opacity-80 cursor-not-allowed ${
                  isTargetCEO
                    ? 'bg-amber-600/15 border-amber-500 text-amber-300 shadow-sm'
                    : 'bg-[var(--bg-surface)] border-[var(--border-main)] text-[var(--text-dim)]'
                }`}
                title={
                  isTargetCEO
                    ? 'Root Authority: Permanent Developer/CEO account'
                    : 'Single Account Rule: Only one Developer/CEO account is permitted in TeleNest'
                }
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-[var(--text-main)] flex items-center gap-1">
                    <Crown className="w-3.5 h-3.5 text-amber-400" />
                    <span>Developer / CEO</span>
                  </span>
                  {isTargetCEO && <Check className="w-4 h-4 text-amber-400" />}
                </div>
                <p className="text-[10px] text-[var(--text-dim)] mt-1.5 leading-normal">
                  {isTargetCEO
                    ? 'Single Root Authority (Full Rights)'
                    : 'Exclusively reserved for primary account Bilal Ahmed'}
                </p>
              </button>
            </div>
          </div>

          {/* Quick Presets Bar */}
          {canModifyPermissions && (
            <div className="p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-main)] flex flex-wrap items-center justify-between gap-2">
              <span className="text-[11px] font-bold text-[var(--text-muted)]">
                Quick Feature Templates:
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => applyPreset('full')}
                  className="px-2.5 py-1 rounded-lg bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] border border-[var(--border-main)] text-[11px] font-semibold text-[var(--text-main)] transition cursor-pointer"
                >
                  Full Access
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('field')}
                  className="px-2.5 py-1 rounded-lg bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] border border-[var(--border-main)] text-[11px] font-semibold text-blue-400 transition cursor-pointer"
                >
                  Field Engineer
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('warehouse')}
                  className="px-2.5 py-1 rounded-lg bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] border border-[var(--border-main)] text-[11px] font-semibold text-amber-400 transition cursor-pointer"
                >
                  Depot Storekeeper
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('finance')}
                  className="px-2.5 py-1 rounded-lg bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] border border-[var(--border-main)] text-[11px] font-semibold text-emerald-400 transition cursor-pointer"
                >
                  Finance Officer
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('readonly')}
                  className="px-2.5 py-1 rounded-lg bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] border border-[var(--border-main)] text-[11px] font-semibold text-slate-400 transition cursor-pointer"
                >
                  Read-Only
                </button>
              </div>
            </div>
          )}

          {/* Granular Operations Features Grid */}
          <div className="space-y-5">
            <div className="flex items-center justify-between pb-1">
              <span className="text-xs font-bold text-[var(--text-main)] uppercase tracking-wider">
                Operations Core Feature Access Rules
              </span>
              <span className="text-[10px] text-[var(--text-dim)]">
                {Object.values(permissions).filter(Boolean).length} / {Object.keys(permissions).length} Features Enabled
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4.5">
              {featureGroups.map((group, gIdx) => {
                const GroupIcon = group.icon;
                return (
                  <div
                    key={gIdx}
                    className="p-4.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-main)] space-y-3.5"
                  >
                    <div className="flex items-center gap-2 pb-2.5 border-b border-[var(--border-main)]/60">
                      <div className={`p-1.5 rounded-lg ${group.bgColor} ${group.color} border ${group.borderColor}`}>
                        <GroupIcon className="w-4 h-4" />
                      </div>
                      <span className="font-bold text-xs text-[var(--text-main)]">
                        {group.title}
                      </span>
                    </div>

                    <div className="space-y-2.5">
                      {group.items.map((item) => {
                        const isChecked = isTargetCEO ? true : !!permissions[item.key];
                        return (
                          <label
                            key={item.key}
                            className={`flex items-start justify-between gap-2.5 p-2.5 rounded-lg transition select-none ${
                              canModifyPermissions
                                ? 'hover:bg-[var(--bg-hover)] cursor-pointer'
                                : 'cursor-not-allowed opacity-80'
                            } ${isChecked ? 'bg-[var(--bg-surface)]/60' : ''}`}
                          >
                            <div className="flex-1 pr-2">
                              <div className="flex items-center gap-1.5">
                                <span className={`font-semibold text-[11px] ${
                                  isChecked ? 'text-[var(--text-main)]' : 'text-[var(--text-dim)]'
                                }`}>
                                  {item.label}
                                </span>
                                {item.danger && (
                                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/25">
                                    Delete
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-[var(--text-muted)] leading-tight mt-0.5">
                                {item.desc}
                              </p>
                            </div>

                            <input
                              type="checkbox"
                              checked={isChecked}
                              disabled={!canModifyPermissions || isTargetCEO}
                              onChange={() => handleToggle(item.key)}
                              className="mt-1 w-4 h-4 rounded text-blue-600 focus:ring-0 focus:ring-offset-0 bg-[var(--bg-input)] border-[var(--border-main)] cursor-pointer disabled:cursor-not-allowed"
                            />
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-[var(--border-main)] bg-[var(--bg-card)] flex items-center justify-between">
          <div className="text-[11px] text-[var(--text-muted)]">
            Changes saved to encrypted local system ledger
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-[var(--bg-surface)] hover:bg-[var(--bg-hover)] border border-[var(--border-main)] text-xs font-semibold text-[var(--text-main)] transition cursor-pointer"
            >
              Cancel
            </button>
            {canModifyPermissions && !isTargetCEO ? (
              <button
                type="button"
                onClick={handleSave}
                className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-bold transition shadow-md cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Apply & Save Permissions</span>
              </button>
            ) : (
              <div className="px-3 py-1.5 rounded-lg bg-slate-500/10 text-[var(--text-dim)] border border-[var(--border-main)] text-xs font-semibold">
                {isTargetCEO ? 'Developer/CEO Permissions Locked' : 'Read-Only (Requires Developer/CEO)'}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
