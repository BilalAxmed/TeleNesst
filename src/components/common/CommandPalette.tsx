import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Search,
  Box,
  Layers,
  DollarSign,
  Briefcase,
  Users,
  Settings,
  FileText,
  Palette,
  LogOut,
  ArrowRight,
  Sparkles,
  Download,
  Check,
  X,
  Network,
  Building2,
  Radio,
  HardHat,
  Database,
  Calendar,
  Activity,
  Image as ImageIcon,
  KeyRound,
} from 'lucide-react';
import { THEMES } from '../../styles/themes';
import { storage } from '../../services/storage';
import { formatCurrency } from '../../services/currency';
import { PortablePackageService } from '../../services/portablePackageService';

export type SearchCategory = 'All' | 'Inventory' | 'ICT Work' | 'Projects' | 'Expenses' | 'System';

interface SearchResultItem {
  id: string;
  title: string;
  subtitle: string;
  category: 'Inventory' | 'ICT Work' | 'Projects' | 'Expenses' | 'System';
  badge?: string;
  badgeTone?: 'emerald' | 'blue' | 'purple' | 'amber' | 'rose' | 'cyan' | 'neutral';
  icon: React.ComponentType<{ className?: string }>;
  searchString: string;
  action: () => void;
}

export const CommandPalette: React.FC = () => {
  const {
    isCommandPaletteOpen,
    setIsCommandPaletteOpen,
    setActiveTab,
    setSubTab,
    setTheme,
    logout,
    showToast,
    homeCurrency,
    dataRevision,
    setIsLogoModalOpen,
    softwareName,
    currentUser,
    setIsForgotPinModalOpen,
    setPrefilledRecoveryUser,
  } = useApp();

  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<SearchCategory>('All');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Auto focus and reset when opened
  useEffect(() => {
    if (isCommandPaletteOpen) {
      setQuery('');
      setSelectedCategory('All');
      setSelectedIndex(0);
      const timer = setTimeout(() => inputRef.current?.focus(), 40);
      return () => clearTimeout(timer);
    }
  }, [isCommandPaletteOpen]);

  // Compile real live items across Inventory, ICT Work, Projects, Expenses, and System
  const allSearchItems: SearchResultItem[] = useMemo(() => {
    const items: SearchResultItem[] = [];

    // 1. REAL INVENTORY ITEMS
    try {
      const inventory = storage.getInventory();
      inventory.forEach((inv) => {
        const isLow = inv.currentStock <= inv.minThreshold;
        items.push({
          id: `inv-${inv.id}`,
          title: inv.name,
          subtitle: `${inv.itemCode} • ${inv.location || 'Warehouse North'} • ${inv.category}`,
          category: 'Inventory',
          badge: `${inv.currentStock.toLocaleString()} ${inv.unit}${isLow ? ' (Low)' : ''}`,
          badgeTone: isLow ? 'amber' : 'emerald',
          icon: Box,
          searchString: `${inv.name} ${inv.itemCode} ${inv.category} ${inv.location} ${inv.supplier || ''} ${inv.description || ''}`,
          action: () => {
            setActiveTab('inventory');
            showToast(`Selected Inventory: ${inv.name} (${inv.currentStock.toLocaleString()} ${inv.unit})`, 'info');
            setIsCommandPaletteOpen(false);
          },
        });
      });
    } catch (e) {
      console.error('Error fetching inventory for search:', e);
    }

    // 2. REAL ICT WORK (FTTH, FTTB, FTTM)
    try {
      const ftthRecords = storage.getFTTH();
      ftthRecords.forEach((ftth) => {
        items.push({
          id: `ict-ftth-${ftth.id}`,
          title: `FTTH Cluster ${ftth.clusterId} (${ftth.zone})`,
          subtitle: `${ftth.clientOperator} • ${ftth.fatsInstalled || 0} FATs • ${ftth.homesPassed || 0} Homes • ${ftth.supervisor || 'Field Lead'}`,
          category: 'ICT Work',
          badge: ftth.testingStatus || (ftth.isWorkDone ? 'Done' : 'FTTH'),
          badgeTone: ftth.testingStatus === 'Passed' ? 'emerald' : 'cyan',
          icon: Network,
          searchString: `FTTH ${ftth.clusterId} ${ftth.zone} ${ftth.clientOperator} ${ftth.supervisor || ''} ${ftth.notes || ''}`,
          action: () => {
            setActiveTab('ict-insights');
            setSubTab('ftth');
            showToast(`Opened FTTH Cluster: ${ftth.clusterId}`, 'info');
            setIsCommandPaletteOpen(false);
          },
        });
      });

      const fttbRecords = storage.getFTTB();
      fttbRecords.forEach((fttb) => {
        items.push({
          id: `ict-fttb-${fttb.id}`,
          title: `FTTB ${fttb.buildingName} (${fttb.buildingId})`,
          subtitle: `${fttb.mduBoxType || 'MDU'} • ${fttb.activeCustomerPorts || 0} Ports • ${fttb.risersCount || 0} Risers • ${fttb.supervisor || 'Tech'}`,
          category: 'ICT Work',
          badge: fttb.status || 'FTTB',
          badgeTone: 'blue',
          icon: Building2,
          searchString: `FTTB ${fttb.buildingName} ${fttb.buildingId} ${fttb.mduBoxType || ''} ${fttb.supervisor || ''} ${fttb.notes || ''}`,
          action: () => {
            setActiveTab('ict-insights');
            setSubTab('fttb');
            showToast(`Opened FTTB Building: ${fttb.buildingName}`, 'info');
            setIsCommandPaletteOpen(false);
          },
        });
      });

      const fttmRecords = storage.getFTTM();
      fttmRecords.forEach((fttm) => {
        items.push({
          id: `ict-fttm-${fttm.id}`,
          title: `FTTM ${fttm.towerName} (${fttm.siteId})`,
          subtitle: `${fttm.metroSector} • ${fttm.backhaulBandwidth} • Lead: ${fttm.leadEngineer || 'Engineer'}`,
          category: 'ICT Work',
          badge: fttm.status || 'FTTM',
          badgeTone: 'purple',
          icon: Radio,
          searchString: `FTTM ${fttm.towerName} ${fttm.siteId} ${fttm.metroSector} ${fttm.leadEngineer || ''} ${fttm.btsNodeId || ''}`,
          action: () => {
            setActiveTab('ict-insights');
            setSubTab('fttm');
            showToast(`Opened FTTM Tower: ${fttm.towerName}`, 'info');
            setIsCommandPaletteOpen(false);
          },
        });
      });
    } catch (e) {
      console.error('Error fetching ICT works for search:', e);
    }

    // 3. REAL PROJECTS & DAILY WORKS
    try {
      const projects = storage.getProjects();
      projects.forEach((prj) => {
        const isDone = prj.status === 'Completed';
        items.push({
          id: `prj-${prj.id}`,
          title: prj.title,
          subtitle: `${prj.code} • Client: ${prj.client} • Manager: ${prj.projectManager}`,
          category: 'Projects',
          badge: `${prj.status} (${prj.progressPercent || 0}%)`,
          badgeTone: isDone ? 'emerald' : 'blue',
          icon: Briefcase,
          searchString: `Project ${prj.title} ${prj.code} ${prj.client} ${prj.projectManager} ${prj.category} ${prj.notes || ''}`,
          action: () => {
            setActiveTab('projects');
            setSubTab(isDone ? 'completed' : 'ongoing');
            showToast(`Opened Project: ${prj.title}`, 'info');
            setIsCommandPaletteOpen(false);
          },
        });
      });

      const dailyWorks = storage.getDailyWorks();
      dailyWorks.forEach((dw) => {
        items.push({
          id: `dw-${dw.id}`,
          title: `Daily Work: ${dw.projectName || dw.projectCode} (${dw.date})`,
          subtitle: `${dw.workType} • ${dw.metersInstalled ? dw.metersInstalled.toLocaleString() + 'm' : '0m'} • Lead: ${dw.teamLead}`,
          category: 'Projects',
          badge: dw.status || 'Daily Log',
          badgeTone: dw.status === 'Verified' ? 'emerald' : 'amber',
          icon: HardHat,
          searchString: `Daily Work ${dw.projectName} ${dw.projectCode} ${dw.workType} ${dw.teamLead} ${dw.date} ${dw.tasksCompleted || ''}`,
          action: () => {
            setActiveTab('projects');
            setSubTab('daily-works');
            showToast(`Opened Daily Work for ${dw.date}`, 'info');
            setIsCommandPaletteOpen(false);
          },
        });
      });
    } catch (e) {
      console.error('Error fetching projects for search:', e);
    }

    // 4. REAL EXPENSES
    try {
      const expenses = storage.getExpenses();
      expenses.forEach((exp) => {
        const isMaintenance = exp.type === 'Maintenance' || exp.type === 'MAINTENANCE';
        items.push({
          id: `exp-${exp.id}`,
          title: exp.title,
          subtitle: `${exp.vendor || exp.paidTo || 'Operational'} • ${exp.category} • ${exp.date}`,
          category: 'Expenses',
          badge: formatCurrency(exp.amount, exp.currency || homeCurrency || 'USD'),
          badgeTone: isMaintenance ? 'rose' : 'emerald',
          icon: DollarSign,
          searchString: `Expense ${exp.title} ${exp.category} ${exp.vendor || ''} ${exp.paidTo || ''} ${exp.invoiceRef || ''} ${exp.notes || ''}`,
          action: () => {
            setActiveTab('finance');
            setSubTab(isMaintenance ? 'maintenance' : 'ongoing');
            showToast(`Opened Expense: ${exp.title}`, 'info');
            setIsCommandPaletteOpen(false);
          },
        });
      });
    } catch (e) {
      console.error('Error fetching expenses for search:', e);
    }

    // 5. SYSTEM NAVIGATION & ACTIONS
    items.push(
      {
        id: 'sys-activity-stream',
        title: 'Recent Operations Activity Stream',
        subtitle: 'Live chronological feed of warehouse, ICT, field works & finance',
        category: 'System',
        badge: 'Live Feed',
        badgeTone: 'emerald',
        icon: Activity,
        searchString: 'recent operations activity stream audit live feed logs timeline history events',
        action: () => {
          setActiveTab('dashboard');
          setIsCommandPaletteOpen(false);
          showToast('Opened Recent Operations Activity Stream', 'info');
        },
      },
      {
        id: 'sys-dashboard',
        title: 'Executive Dashboard',
        subtitle: 'Overview of warehouse KPIs, projects & finance',
        category: 'System',
        badge: 'Hub',
        badgeTone: 'neutral',
        icon: Sparkles,
        searchString: 'dashboard kpi analytics home overview',
        action: () => {
          setActiveTab('dashboard');
          setIsCommandPaletteOpen(false);
        },
      },
      {
        id: 'sys-inventory-root',
        title: 'Warehouse Stock Master',
        subtitle: 'In-Out-Remains inventory ledger & movements',
        category: 'System',
        badge: 'Module',
        badgeTone: 'neutral',
        icon: Box,
        searchString: 'inventory warehouse stock in out remains fiber cables',
        action: () => {
          setActiveTab('inventory');
          setIsCommandPaletteOpen(false);
        },
      },
      {
        id: 'sys-ict-root',
        title: 'ICT Infrastructure Workspace',
        subtitle: 'FTTH clusters, FTTB risers & FTTM towers',
        category: 'System',
        badge: 'Module',
        badgeTone: 'neutral',
        icon: Layers,
        searchString: 'ict telecom ftth fttb fttm fiber rollout network',
        action: () => {
          setActiveTab('ict-insights');
          setIsCommandPaletteOpen(false);
        },
      },
      {
        id: 'sys-projects-root',
        title: 'Operations & Deployments',
        subtitle: 'Ongoing projects, archives & daily field sheets',
        category: 'System',
        badge: 'Module',
        badgeTone: 'neutral',
        icon: Briefcase,
        searchString: 'projects operations daily works deployments milestones',
        action: () => {
          setActiveTab('projects');
          setIsCommandPaletteOpen(false);
        },
      },
      {
        id: 'sys-finance-root',
        title: 'Finance & Expense Ledgers',
        subtitle: 'Maintenance, recurring overheads & petty cash',
        category: 'System',
        badge: 'Module',
        badgeTone: 'neutral',
        icon: DollarSign,
        searchString: 'finance expenses money costs overheads bills',
        action: () => {
          setActiveTab('finance');
          setIsCommandPaletteOpen(false);
        },
      },
      {
        id: 'sys-users',
        title: 'User Management & Access Control',
        subtitle: 'User accounts, permissions matrix & security',
        category: 'System',
        badge: 'Admin',
        badgeTone: 'neutral',
        icon: Users,
        searchString: 'users admin roles accounts security permissions bilal',
        action: () => {
          setActiveTab('users');
          setIsCommandPaletteOpen(false);
        },
      },
      {
        id: 'sys-forgot-pin',
        title: 'Forgot PIN? / Security PIN Recovery',
        subtitle: 'Send secure 6-digit verification code to registered email & create new PIN',
        category: 'System',
        badge: 'Security',
        badgeTone: 'amber',
        icon: KeyRound,
        searchString: 'forgot pin password reset recovery code email security verification',
        action: () => {
          setPrefilledRecoveryUser(currentUser);
          setIsForgotPinModalOpen(true);
          setIsCommandPaletteOpen(false);
        },
      },
      {
        id: 'sys-settings',
        title: 'System Settings & Rates',
        subtitle: 'Theme studio, currencies, letterhead, database backup',
        category: 'System',
        badge: 'Config',
        badgeTone: 'neutral',
        icon: Settings,
        searchString: 'settings options themes currencies rates letterhead backup',
        action: () => {
          setActiveTab('settings');
          setIsCommandPaletteOpen(false);
        },
      },
      {
        id: 'act-software-name',
        title: `Rename Software (${softwareName})`,
        subtitle: 'Configure dynamic software name, brand identity & window title',
        category: 'System',
        badge: 'Branding',
        badgeTone: 'amber',
        icon: Sparkles,
        searchString: `software name rename app brand title identity ${softwareName}`,
        action: () => {
          setActiveTab('settings');
          setSubTab('software-name');
          setIsCommandPaletteOpen(false);
        },
      },
      {
        id: 'act-software-logo',
        title: 'Choose Software Logo (Online or PC)',
        subtitle: 'Select from online telecom gallery, web URL, or upload from PC disk',
        category: 'System',
        badge: 'Brand',
        badgeTone: 'cyan',
        icon: ImageIcon,
        searchString: 'software logo change logo brand upload pc select online icon identity emblem vector',
        action: () => {
          setIsCommandPaletteOpen(false);
          setIsLogoModalOpen(true);
        },
      },
      {
        id: 'act-export-excel',
        title: 'Export Master Inventory Report (.xlsx)',
        subtitle: '5 complete spreadsheet sheets with formulas & charts',
        category: 'System',
        badge: 'Excel',
        badgeTone: 'emerald',
        icon: Download,
        searchString: 'export excel spreadsheet report download xlsx',
        action: () => {
          setIsCommandPaletteOpen(false);
          PortablePackageService.downloadExcelReport();
          showToast('Downloading Master Inventory Excel Report...', 'success');
        },
      },
      {
        id: 'act-export-json',
        title: 'Export Full Database Backup (.json)',
        subtitle: 'Encrypted snapshot of all inventory, ICT, projects & finance',
        category: 'System',
        badge: 'Backup',
        badgeTone: 'blue',
        icon: Database,
        searchString: 'backup export json database snapshot save',
        action: () => {
          setIsCommandPaletteOpen(false);
          PortablePackageService.downloadMasterDatabaseJson();
          showToast('Downloaded Full Database Master Backup (.json)', 'success');
        },
      },
      {
        id: 'act-logout',
        title: 'Lock / Sign Out Session',
        subtitle: 'Securely exit active terminal session',
        category: 'System',
        badge: 'Auth',
        badgeTone: 'rose',
        icon: LogOut,
        searchString: 'logout sign out lock exit switch account',
        action: () => {
          setIsCommandPaletteOpen(false);
          logout();
        },
      }
    );

    return items;
  }, [homeCurrency, dataRevision, setActiveTab, setSubTab, logout, showToast, setIsCommandPaletteOpen, setIsLogoModalOpen, softwareName]);

  // Filter items by category chip and query text
  const filteredItems = useMemo(() => {
    let list = allSearchItems;

    if (selectedCategory !== 'All') {
      list = list.filter((item) => item.category === selectedCategory);
    }

    if (!query.trim()) {
      return list;
    }

    const terms = query.toLowerCase().trim().split(/\s+/);
    return list.filter((item) => {
      const target = `${item.title} ${item.subtitle} ${item.category} ${item.searchString}`.toLowerCase();
      return terms.every((t) => target.includes(t));
    });
  }, [allSearchItems, query, selectedCategory]);

  // Counts per category
  const categoryCounts = useMemo(() => {
    const counts: Record<SearchCategory, number> = {
      'All': 0,
      'Inventory': 0,
      'ICT Work': 0,
      'Projects': 0,
      'Expenses': 0,
      'System': 0,
    };

    const q = query.toLowerCase().trim();
    allSearchItems.forEach((item) => {
      const match = !q || `${item.title} ${item.subtitle} ${item.searchString}`.toLowerCase().includes(q);
      if (match) {
        counts['All']++;
        if (counts[item.category] !== undefined) {
          counts[item.category]++;
        }
      }
    });

    return counts;
  }, [allSearchItems, query]);

  // Keep selected index valid
  useEffect(() => {
    setSelectedIndex(0);
  }, [query, selectedCategory]);

  // Scroll active item into view
  useEffect(() => {
    if (listRef.current) {
      const activeEl = listRef.current.querySelector('[data-selected="true"]') as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % (filteredItems.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + (filteredItems.length || 1)) % (filteredItems.length || 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        filteredItems[selectedIndex].action();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsCommandPaletteOpen(false);
    } else if (e.key === 'Tab') {
      e.preventDefault();
      const categories: SearchCategory[] = ['All', 'Inventory', 'ICT Work', 'Projects', 'Expenses', 'System'];
      const currentIndex = categories.indexOf(selectedCategory);
      const nextIndex = e.shiftKey
        ? (currentIndex - 1 + categories.length) % categories.length
        : (currentIndex + 1) % categories.length;
      setSelectedCategory(categories[nextIndex]);
    }
  };

  const getBadgeStyle = (tone?: string) => {
    switch (tone) {
      case 'emerald':
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25';
      case 'amber':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/25';
      case 'rose':
        return 'text-rose-400 bg-rose-500/10 border-rose-500/25';
      case 'purple':
        return 'text-purple-400 bg-purple-500/10 border-purple-500/25';
      case 'cyan':
        return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/25';
      case 'blue':
        return 'text-blue-400 bg-blue-500/10 border-blue-500/25';
      default:
        return 'text-[var(--text-muted)] bg-[var(--bg-surface)] border-[var(--border-main)]';
    }
  };

  if (!isCommandPaletteOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-8 sm:pt-12 p-2 bg-black/55 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={() => setIsCommandPaletteOpen(false)}
    >
      {/* Small Compact Modal Frame */}
      <div
        className="w-full max-w-[420px] bg-[var(--bg-card)] border border-[var(--border-main)] rounded-xl shadow-2xl overflow-hidden text-[var(--text-main)] animate-in zoom-in-95 duration-150 flex flex-col max-h-[75vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Compact Search Bar Header */}
        <div className="flex items-center gap-2 px-3 py-2 border-b border-[var(--border-main)] bg-[var(--bg-surface)]">
          <Search className="w-3.5 h-3.5 text-[var(--text-dim)] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search inventory, ICT, projects, expenses..."
            className="w-full bg-transparent text-xs focus:outline-none placeholder:text-[var(--text-dim)] text-[var(--text-main)] py-0.5 leading-tight"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-0.5 rounded text-[var(--text-dim)] hover:text-[var(--text-main)] transition cursor-pointer"
              title="Clear search"
            >
              <X className="w-3 h-3" />
            </button>
          )}
          <kbd className="text-[8px] px-1 py-0.5 rounded bg-[var(--bg-card)] border border-[var(--border-main)] text-[var(--text-dim)] font-mono shrink-0 select-none">
            ESC
          </kbd>
        </div>

        {/* Category Filter Chips Bar (Small & Sleek) */}
        <div className="flex items-center gap-1 px-2 py-1.2 border-b border-[var(--border-main)] bg-[var(--bg-main)]/50 overflow-x-auto no-scrollbar">
          {(['All', 'Inventory', 'ICT Work', 'Projects', 'Expenses', 'System'] as SearchCategory[]).map((cat) => {
            const count = categoryCounts[cat] || 0;
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[9.5px] font-medium transition whitespace-nowrap cursor-pointer shrink-0 ${
                  isSelected
                    ? 'bg-[var(--accent)] text-white shadow-xs'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-hover)]'
                }`}
              >
                <span>{cat}</span>
                <span
                  className={`text-[8.5px] px-1 rounded-full font-mono leading-none ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-[var(--bg-card)] text-[var(--text-dim)]'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Small Scrollable Results List */}
        <div
          ref={listRef}
          className="overflow-y-auto max-h-[260px] p-1 space-y-0.5"
        >
          {filteredItems.length === 0 ? (
            <div className="py-6 px-3 text-center">
              <p className="text-[11px] font-medium text-[var(--text-muted)]">No matching records found</p>
              <p className="text-[9.5px] text-[var(--text-dim)] mt-0.5">
                Try searching for cables, reels, cluster codes, projects, or vendors.
              </p>
            </div>
          ) : (
            filteredItems.map((item, idx) => {
              const Icon = item.icon;
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.id}
                  data-selected={isSelected ? 'true' : 'false'}
                  onClick={() => item.action()}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between px-2 py-1.2 rounded-md cursor-pointer transition select-none ${
                    isSelected
                      ? 'bg-[var(--accent)] text-white shadow-xs'
                      : 'hover:bg-[var(--bg-hover)] text-[var(--text-main)]'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div
                      className={`w-5 h-5 rounded flex items-center justify-center shrink-0 ${
                        isSelected
                          ? 'bg-white/20 text-white'
                          : 'bg-[var(--bg-surface)] text-[var(--text-muted)] border border-[var(--border-main)]'
                      }`}
                    >
                      <Icon className="w-3 h-3" />
                    </div>
                    <div className="min-w-0 flex-1 pr-1.5">
                      <div className="font-medium text-[11px] leading-tight truncate">{item.title}</div>
                      <div
                        className={`text-[9.5px] truncate leading-tight mt-0.5 ${
                          isSelected ? 'text-white/80' : 'text-[var(--text-dim)]'
                        }`}
                      >
                        {item.subtitle}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0 ml-1">
                    {item.badge && (
                      <span
                        className={`text-[8.5px] font-mono px-1 py-0.2 rounded border leading-none ${
                          isSelected
                            ? 'bg-white/20 text-white border-white/30'
                            : getBadgeStyle(item.badgeTone)
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                    <ArrowRight
                      className={`w-2.5 h-2.5 transition-transform ${
                        isSelected ? 'text-white translate-x-0.5' : 'text-[var(--text-dim)] opacity-35'
                      }`}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Small Compact Footer */}
        <div className="px-2.5 py-1 border-t border-[var(--border-main)] bg-[var(--bg-surface)] flex items-center justify-between text-[9px] text-[var(--text-dim)] select-none">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-0.5">
              <kbd className="px-1 py-0.2 bg-[var(--bg-card)] border border-[var(--border-main)] rounded text-[8px] font-mono">
                &uarr;&darr;
              </kbd>
              <span>navigate</span>
            </span>
            <span className="flex items-center gap-0.5">
              <kbd className="px-1 py-0.2 bg-[var(--bg-card)] border border-[var(--border-main)] rounded text-[8px] font-mono">
                &crarr;
              </kbd>
              <span>open</span>
            </span>
            <span className="flex items-center gap-0.5 hidden sm:inline-flex">
              <kbd className="px-1 py-0.2 bg-[var(--bg-card)] border border-[var(--border-main)] rounded text-[8px] font-mono">
                Tab
              </kbd>
              <span>filter</span>
            </span>
          </div>

          <div className="flex items-center gap-1 font-mono text-[8.5px]">
            <span>{filteredItems.length}</span>
            <span>matches</span>
          </div>
        </div>
      </div>
    </div>
  );
};
