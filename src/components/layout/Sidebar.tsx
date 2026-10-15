import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  LayoutDashboard,
  Box,
  Layers,
  DollarSign,
  Briefcase,
  Users,
  FileCheck,
  Settings,
  ChevronRight,
  Sparkles,
  Sliders,
  Palette,
  ArrowDownUp,
  Cpu,
  Building,
  Radio,
  Clock,
  CheckCircle,
  CalendarDays,
  ShieldAlert,
} from 'lucide-react';
import { PWAInstallButton } from '../pwa/PWAInstallButton';

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  subItems?: { id: string; label: string; icon?: React.ComponentType<{ className?: string }> }[];
}

export const Sidebar: React.FC = () => {
  const { activeTab, setActiveTab, subTab, setSubTab, currentUser, canAccessFeature } = useApp();

  const allNavItems: (NavItem & { permission?: boolean })[] = [
    {
      id: 'dashboard',
      label: 'Executive Dashboard',
      icon: LayoutDashboard,
      permission: canAccessFeature('canAccessAnalytics'),
    },
    {
      id: 'inventory',
      label: 'In-Out-Remains',
      icon: Box,
      permission: canAccessFeature('canAccessInventory'),
      subItems: [
        { id: 'stock-list', label: 'Stock Master & Balances', icon: Box },
        { id: 'movements', label: 'Movement Logs (In/Out)', icon: ArrowDownUp },
      ],
    },
    {
      id: 'ict-insights',
      label: 'ICT Activity Insights',
      icon: Cpu,
      permission: canAccessFeature('canAccessICT'),
      subItems: [
        { id: 'ftth', label: 'FTTH (Fiber to Home)', icon: Layers },
        { id: 'fttb', label: 'FTTB (Fiber to Building)', icon: Building },
        { id: 'fttm', label: 'FTTM (Mobile/Metro)', icon: Radio },
      ],
    },
    {
      id: 'finance',
      label: 'Finance & Costs',
      icon: DollarSign,
      permission: canAccessFeature('canAccessFinance'),
      subItems: [
        { id: 'maintenance', label: 'Maintenance Expense' },
        { id: 'ongoing', label: 'Ongoing Expense' },
        { id: 'trends', label: 'Expense Trend Analysis' },
      ],
    },
    {
      id: 'projects',
      label: 'Projects & Operations',
      icon: Briefcase,
      permission: canAccessFeature('canAccessProjects') || canAccessFeature('canAccessDailyWorks'),
      subItems: [
        ...(canAccessFeature('canAccessProjects')
          ? [
              { id: 'ongoing', label: 'Ongoing Projects', icon: Clock },
              { id: 'completed', label: 'Completed Archives', icon: CheckCircle },
            ]
          : []),
        ...(canAccessFeature('canAccessDailyWorks')
          ? [{ id: 'daily-works', label: 'Daily Works Log', icon: CalendarDays }]
          : []),
      ],
    },
    {
      id: 'users',
      label: 'User Management',
      icon: Users,
      permission: true,
    },
    {
      id: 'settings',
      label: 'Options & Settings',
      icon: Settings,
      permission: canAccessFeature('canAccessSettings'),
      subItems: [
        { id: 'general', label: 'Preset Themes', icon: Palette },
        { id: 'custom-colors', label: 'Manual Color Studio', icon: Sliders },
        { id: 'currencies', label: 'Currencies & Rates', icon: DollarSign },
        { id: 'letterhead', label: 'Letterhead Settings' },
        { id: 'backup', label: 'Database & Backups' },
      ],
    },
  ];

  const navItems = allNavItems.filter((item) => item.permission !== false);

  const handleNavClick = (itemId: string, defaultSub?: string) => {
    setActiveTab(itemId);
    if (defaultSub) {
      setSubTab(defaultSub);
    } else {
      setSubTab('');
    }
  };

  return (
    <aside className="w-72 shrink-0 border-r border-[var(--border-main)] bg-[var(--bg-surface)] flex flex-col justify-between h-[calc(100vh-53px)] overflow-y-auto no-print">
      {/* Navigation Links */}
      <div className="px-4 py-4">
        <div className="px-3.5 pt-0.5 pb-3 text-[11px] font-bold uppercase tracking-wider text-[var(--text-dim)] flex items-center justify-between">
          <span>Operations Core</span>
          <span className="text-[10px] px-2 py-0.5 rounded-md bg-[var(--bg-card)] border border-[var(--border-main)] font-mono text-[var(--text-muted)]">
            {navItems.length} modules
          </span>
        </div>

        {/* Menu Items with increased vertical spacing (approx +5-6px) */}
        <nav aria-label="Operations Core Modules" className="space-y-3.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            const hasSub = item.subItems && item.subItems.length > 0;

            return (
              <div key={item.id} className="space-y-1.5">
                <button
                  onClick={() => handleNavClick(item.id, hasSub ? item.subItems![0].id : undefined)}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-[13.5px] font-semibold transition group ${
                    isActive
                      ? 'bg-[var(--bg-card)] text-[var(--accent)] border border-[var(--border-light)] shadow-xs'
                      : 'text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-main)]'
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <Icon
                      className={`w-5 h-5 shrink-0 transition ${
                        isActive ? 'text-[var(--accent)]' : 'text-[var(--text-dim)] group-hover:text-[var(--text-main)]'
                      }`}
                    />
                    <span className="truncate">{item.label}</span>
                  </div>

                  {hasSub && (
                    <ChevronRight
                      className={`w-4 h-4 text-[var(--text-dim)] transition-transform duration-200 ${
                        isActive ? 'rotate-90 text-[var(--accent)]' : ''
                      }`}
                    />
                  )}
                </button>

                {/* Sub-Items dropdown */}
                {hasSub && isActive && (
                  <div className="pl-6 pr-2 py-2 space-y-1.5 ml-2 border-l border-[var(--border-main)]/60 animate-in slide-in-from-top-2 duration-150">
                    {item.subItems!.map((sub) => {
                      const isSubActive = subTab === sub.id || (!subTab && sub.id === item.subItems![0].id);
                      const SubIcon = sub.icon;
                      return (
                        <button
                          key={sub.id}
                          onClick={() => {
                            setActiveTab(item.id);
                            setSubTab(sub.id);
                          }}
                          className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-medium transition ${
                            isSubActive
                              ? 'bg-[var(--accent)] text-white shadow-xs font-semibold'
                              : 'text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-main)]'
                          }`}
                        >
                          {SubIcon && <SubIcon className="w-3.5 h-3.5 shrink-0 opacity-80" />}
                          <span className="truncate">{sub.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>

      {/* In-App PWA Install Action */}
      <div className="px-2 mb-1">
        <PWAInstallButton variant="sidebar" />
      </div>

      {/* Bottom User Role & Developer info card */}
      <div className="p-3 border-t border-[var(--border-main)] bg-[var(--bg-card)]/40 m-2 rounded-xl border">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-[var(--text-dim)]">System Role:</span>
          <span className="font-bold text-blue-400">{currentUser?.role || 'Guest'}</span>
        </div>
        <div className="flex items-center justify-between text-[10px] text-[var(--text-dim)] mt-1.5">
          <span>Lead Engineer:</span>
          <span className="font-medium text-[var(--text-muted)]">Bilal Ahmed</span>
        </div>
        <div className="mt-2 pt-2 border-t border-[var(--border-main)] flex items-center justify-between text-[10px] text-[var(--text-dim)]">
          <span>Platform:</span>
          <span className="font-mono text-emerald-400">Offline Portable</span>
        </div>
      </div>
    </aside>
  );
};
