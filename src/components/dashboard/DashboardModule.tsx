import React, { useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { storage } from '../../services/storage';
import { formatCurrency, convertCurrency } from '../../services/currency';
import {
  LayoutDashboard,
  Box,
  Layers,
  Briefcase,
  DollarSign,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle2,
  Clock,
  TrendingUp,
  Cpu,
  Building,
  Radio,
  Printer,
  ChevronRight,
  Shield,
  Activity,
  ArrowRight,
  Zap,
} from 'lucide-react';
import { OperationsActivityStream } from './OperationsActivityStream';

export const DashboardModule: React.FC = () => {
  const {
    homeCurrency,
    exchangeRates,
    currentUser,
    setActiveTab,
    setSubTab,
    openLetterheadModal,
    companyConfig,
    softwareName,
  } = useApp();

  const inventory = storage.getInventory();
  const movements = storage.getMovements();
  const ftth = storage.getFTTH();
  const fttb = storage.getFTTB();
  const fttm = storage.getFTTM();
  const expenses = storage.getExpenses();
  const projects = storage.getProjects();
  const dailyWorks = storage.getDailyWorks();

  // Metrics Calculations
  const metrics = useMemo(() => {
    // Total Inventory Valuation converted to Home Currency
    const totalInventoryValue = inventory.reduce((sum, item) => {
      const itemVal = item.currentStock * item.unitPrice;
      const converted = convertCurrency(itemVal, item.currency, homeCurrency, exchangeRates);
      return sum + converted;
    }, 0);

    // In / Out and Remain Quantities (All Units and Specifically Pcs)
    // 1. Total Inward Units Quantity
    const movementsInQty = movements
      .filter((m) => m.type === 'IN')
      .reduce((sum, m) => sum + (Number(m.quantity) || 0), 0);
    const itemsInQty = inventory.reduce((sum, item) => sum + (Number(item.totalIn) || 0), 0);
    const totalInQuantity = Math.max(itemsInQty, movementsInQty);

    // 2. Total Outward Units Quantity
    const movementsOutQty = movements
      .filter((m) => m.type === 'OUT')
      .reduce((sum, m) => sum + (Number(m.quantity) || 0), 0);
    const itemsOutQty = inventory.reduce((sum, item) => sum + (Number(item.totalOut) || 0), 0);
    const totalOutQuantity = Math.max(itemsOutQty, movementsOutQty);

    // 3. Total Remaining Balance Units Quantity
    const totalRemainQuantity = inventory.reduce((sum, item) => sum + (Number(item.currentStock) || 0), 0);

    // 4. Specifically for items whose unit is 'Pcs' (case-insensitive)
    const pcsItems = inventory.filter((item) => (item.unit || '').trim().toLowerCase() === 'pcs');
    const pcsInQuantity = pcsItems.reduce((sum, item) => sum + (Number(item.totalIn) || 0), 0);
    const pcsOutQuantity = pcsItems.reduce((sum, item) => sum + (Number(item.totalOut) || 0), 0);
    const pcsRemainQuantity = pcsItems.reduce((sum, item) => sum + (Number(item.currentStock) || 0), 0);
    const pcsStockValue = pcsItems.reduce((sum, item) => {
      const itemVal = item.currentStock * item.unitPrice;
      return sum + convertCurrency(itemVal, item.currency, homeCurrency, exchangeRates);
    }, 0);

    // Movement Counts
    const inMovementsCount = movements.filter((m) => m.type === 'IN').length;
    const outMovementsCount = movements.filter((m) => m.type === 'OUT').length;

    // Stock Retention Ratio
    const stockRetentionRate =
      totalInQuantity > 0 ? Math.min(100, Math.round((totalRemainQuantity / totalInQuantity) * 100)) : 100;
    const stockOutRate =
      totalInQuantity > 0 ? Math.min(100, Math.round((totalOutQuantity / totalInQuantity) * 100)) : 0;

    // Low stock items
    const lowStockItems = inventory.filter((item) => item.currentStock <= item.minThreshold);

    // Total Expenses converted
    const totalExpenses = expenses.reduce((sum, exp) => {
      const amt = Number(exp.amount ?? exp.originalAmount) || 0;
      const curr = exp.currency || exp.originalCurrency || homeCurrency;
      const converted = convertCurrency(amt, curr, homeCurrency, exchangeRates);
      return sum + converted;
    }, 0);

    // Maintenance vs Ongoing (Case-insensitive)
    const maintenanceExpenses = expenses
      .filter((e) => (e.type || '').toUpperCase() === 'MAINTENANCE')
      .reduce((sum, exp) => {
        const amt = Number(exp.amount ?? exp.originalAmount) || 0;
        const curr = exp.currency || exp.originalCurrency || homeCurrency;
        return sum + convertCurrency(amt, curr, homeCurrency, exchangeRates);
      }, 0);

    const ongoingExpenses = expenses
      .filter((e) => (e.type || '').toUpperCase() === 'ONGOING')
      .reduce((sum, exp) => {
        const amt = Number(exp.amount ?? exp.originalAmount) || 0;
        const curr = exp.currency || exp.originalCurrency || homeCurrency;
        return sum + convertCurrency(amt, curr, homeCurrency, exchangeRates);
      }, 0);

    // Total Active Projects
    const activeProjects = projects.filter((p) => p.status !== 'Completed');
    const completedProjects = projects.filter((p) => p.status === 'Completed');

    // Total Portfolio Budget
    const totalProjectBudget = projects.reduce((sum, p) => {
      return sum + convertCurrency(p.budget, p.currency, homeCurrency, exchangeRates);
    }, 0);

    // Network totals
    const totalHomesPassed = ftth.reduce((sum, f) => sum + f.homesPassed, 0);
    const totalBuildings = fttb.length;
    const totalTowers = fttm.length;

    // Total fiber meters in field logs
    const totalMetersLaid = dailyWorks.reduce((sum, d) => sum + d.metersInstalled, 0);

    return {
      totalInventoryValue,
      totalInQuantity,
      totalOutQuantity,
      totalRemainQuantity,
      pcsInQuantity,
      pcsOutQuantity,
      pcsRemainQuantity,
      pcsStockValue,
      inMovementsCount,
      outMovementsCount,
      stockRetentionRate,
      stockOutRate,
      skuCount: inventory.length,
      lowStockItems,
      totalExpenses,
      maintenanceExpenses,
      ongoingExpenses,
      activeProjectsCount: activeProjects.length,
      completedProjectsCount: completedProjects.length,
      totalProjectBudget,
      totalHomesPassed,
      totalBuildings,
      totalTowers,
      totalMetersLaid,
    };
  }, [inventory, movements, expenses, projects, ftth, fttb, fttm, dailyWorks, homeCurrency, exchangeRates]);

  // Category breakdown for inventory
  const categoryBreakdown = useMemo(() => {
    const counts: Record<string, { count: number; value: number }> = {};
    inventory.forEach((item) => {
      const cat = item.category;
      if (!counts[cat]) counts[cat] = { count: 0, value: 0 };
      counts[cat].count += 1;
      const val = convertCurrency(item.currentStock * item.unitPrice, item.currency, homeCurrency, exchangeRates);
      counts[cat].value += val;
    });
    return Object.entries(counts).map(([name, data]) => ({
      name,
      count: data.count,
      value: data.value,
      percent: metrics.totalInventoryValue > 0 ? (data.value / metrics.totalInventoryValue) * 100 : 0,
    }));
  }, [inventory, metrics.totalInventoryValue, homeCurrency, exchangeRates]);

  // Quick Executive Report Export
  const handleExportExecutiveBriefing = () => {
    const columns = [
      { header: 'System Metric / Core KPI', key: 'metric' },
      { header: 'Recorded Value', key: 'value' },
      { header: 'Unit / Context', key: 'unit' },
      { header: 'Operational Status', key: 'status' },
    ];

    const data = [
      {
        metric: 'Total Capital Inventory Valuation',
        value: formatCurrency(metrics.totalInventoryValue, homeCurrency, { includeCode: true }),
        unit: 'Real-time multi-currency valuation',
        status: 'Audited & Reconciled',
      },
      {
        metric: 'Total Stock Received (IN Quantity)',
        value: `${metrics.totalInQuantity.toLocaleString()} Pcs`,
        unit: `${metrics.inMovementsCount} logged inward shipments`,
        status: 'Warehouse Inflow',
      },
      {
        metric: 'Total Stock Dispatched (OUT Quantity)',
        value: `${metrics.totalOutQuantity.toLocaleString()} Pcs`,
        unit: `${metrics.outMovementsCount} project and field dispatches`,
        status: 'Site Logistics',
      },
      {
        metric: 'Remaining Warehouse Stock (REMAIN Quantity)',
        value: `${metrics.totalRemainQuantity.toLocaleString()} Pcs`,
        unit: 'Available physical balance on warehouse floor',
        status: 'Live Balance',
      },
      {
        metric: 'Stock Valuation in Pcs (Piece-Count SKUs)',
        value: formatCurrency(metrics.pcsStockValue, homeCurrency, { includeCode: true }),
        unit: `${metrics.pcsRemainQuantity.toLocaleString()} Pcs items`,
        status: 'Asset Ledger',
      },
      {
        metric: 'Total Warehouse Active SKUs',
        value: `${metrics.skuCount} Products`,
        unit: 'Fiber, Splicing, ODF, Active Gear',
        status: 'Optimal Catalog',
      },
      {
        metric: 'Critical Reorder Thresholds',
        value: `${metrics.lowStockItems.length} SKUs Low`,
        unit: 'Stocks at or below minimum safety level',
        status: metrics.lowStockItems.length > 0 ? 'Requires Purchase Order' : 'All Stock Healthy',
      },
      {
        metric: 'Active Turnkey ICT Projects',
        value: `${metrics.activeProjectsCount} Ongoing`,
        unit: 'Milestone tracking & site logistics',
        status: 'On-schedule execution',
      },
      {
        metric: 'Cumulative Project Portfolio Value',
        value: formatCurrency(metrics.totalProjectBudget, homeCurrency, { includeCode: true }),
        unit: 'Client commitments & signed CapEx',
        status: 'Commercial Contracts',
      },
      {
        metric: 'Fiber to the Home (FTTH) Footprint',
        value: `${metrics.totalHomesPassed.toLocaleString()} Homes Passed`,
        unit: 'Fiber clusters & FATs deployed',
        status: 'Active Telecom Coverage',
      },
      {
        metric: 'Cumulative Operating Expenditure',
        value: formatCurrency(metrics.totalExpenses, homeCurrency, { includeCode: true }),
        unit: 'Maintenance & recurring overheads',
        status: 'Corporate Ledger',
      },
      {
        metric: 'Total Cable Deployed in Field Logs',
        value: `${metrics.totalMetersLaid.toLocaleString()} Meters`,
        unit: 'Underground duct & aerial installation',
        status: 'Civil Works Verified',
      },
    ];

    openLetterheadModal({
      title: `${softwareName} Executive Overview & Operational Briefing Report`,
      columns,
      data,
      dateRange: `As of ${new Date().toLocaleDateString()}`,
      filterSummary: `Audited for ${currentUser?.fullName} (${currentUser?.role})`,
    });
  };

  return (
    <div className="p-4 lg:p-6 space-y-6 animate-in fade-in">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {companyConfig?.logoUrl && (
            <div className="w-11 h-11 rounded-xl bg-[var(--bg-card)] border border-[var(--border-main)] p-1 flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
              <img
                src={companyConfig.logoUrl}
                alt="Software Logo"
                className="w-full h-full object-contain"
              />
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black tracking-tight text-[var(--text-main)]">
                Executive Warehouse & ICT Command
              </h1>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                Live Operations
              </span>
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Real-time stock valuation, inward/outward quantity flow, and operational telemetry
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => {
              setActiveTab('inventory');
              setSubTab('movements');
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-bold shadow transition"
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Stock In / Out</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('projects');
              setSubTab('ongoing');
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] border border-[var(--border-main)] text-xs font-semibold text-[var(--text-main)] transition"
          >
            <Briefcase className="w-3.5 h-3.5 text-blue-400" />
            <span>Projects Center</span>
          </button>

          <button
            onClick={handleExportExecutiveBriefing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] border border-[var(--border-main)] text-xs font-semibold text-[var(--text-main)] transition"
          >
            <Printer className="w-3.5 h-3.5 text-blue-400" />
            <span>Executive Letterhead Report</span>
          </button>
        </div>
      </div>

      {/* Executive Warehouse Stock Flow: IN, OUT & REMAIN (Value in Pcs) */}
      <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-main)] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--border-main)]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[var(--text-main)]">
                  Warehouse Stock Movement & Quantity Command
                </h2>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Value in Pcs
                </span>
              </div>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                Live aggregate warehouse quantities: Inflow, Outflow, and Remaining Balance on Floor in Pcs
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => {
                setActiveTab('inventory');
                setSubTab('movements');
              }}
              className="text-xs px-3 py-1.5 rounded-lg bg-[var(--bg-surface)] hover:bg-[var(--bg-hover)] border border-[var(--border-main)] text-[var(--text-main)] font-semibold transition flex items-center gap-1.5 cursor-pointer"
            >
              <span>Ledger Logs</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 4 Cards Grid for IN / OUT / REMAIN and VALUE IN PCS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: REMAIN UNITS QUANTITY */}
          <div
            onClick={() => {
              setActiveTab('inventory');
              setSubTab('stock-list');
            }}
            className="p-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-main)] hover:border-blue-500/40 transition cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wider">
                  Remain Stock Quantity
                </span>
                <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 group-hover:scale-105 transition">
                  <Box className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl lg:text-3xl font-black text-[var(--text-main)] font-mono tracking-tight flex items-baseline gap-1.5">
                <span>{metrics.totalRemainQuantity.toLocaleString()}</span>
                <span className="text-sm font-bold text-blue-400 uppercase font-sans">Pcs</span>
              </div>
              <p className="text-[11px] text-[var(--text-muted)] mt-1">
                Live warehouse on-hand stock
              </p>
            </div>
            <div className="mt-3 pt-2.5 border-t border-[var(--border-main)] flex items-center justify-between text-[11px]">
              <span className="text-[var(--text-dim)] font-medium">Pcs SKUs:</span>
              <span className="font-mono font-bold text-[var(--text-main)]">
                {metrics.pcsRemainQuantity.toLocaleString()} Pcs
              </span>
            </div>
          </div>

          {/* Card 2: IN UNITS QUANTITY */}
          <div
            onClick={() => {
              setActiveTab('inventory');
              setSubTab('movements');
            }}
            className="p-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-main)] hover:border-emerald-500/40 transition cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
                  Stock Inflow (IN Quantity)
                </span>
                <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 group-hover:scale-105 transition">
                  <ArrowDownLeft className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl lg:text-3xl font-black text-emerald-400 font-mono tracking-tight flex items-baseline gap-1.5">
                <span>{metrics.totalInQuantity.toLocaleString()}</span>
                <span className="text-sm font-bold text-emerald-400/80 uppercase font-sans">Pcs</span>
              </div>
              <p className="text-[11px] text-[var(--text-muted)] mt-1">
                Total inward receipts & supplies
              </p>
            </div>
            <div className="mt-3 pt-2.5 border-t border-[var(--border-main)] flex items-center justify-between text-[11px]">
              <span className="text-[var(--text-dim)] font-medium">In Receipts:</span>
              <span className="font-mono font-bold text-emerald-400">
                {metrics.inMovementsCount} Shipments ({metrics.pcsInQuantity.toLocaleString()} Pcs)
              </span>
            </div>
          </div>

          {/* Card 3: OUT UNITS QUANTITY */}
          <div
            onClick={() => {
              setActiveTab('inventory');
              setSubTab('movements');
            }}
            className="p-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-main)] hover:border-amber-500/40 transition cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
                  Stock Outflow (OUT Quantity)
                </span>
                <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 group-hover:scale-105 transition">
                  <ArrowUpRight className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl lg:text-3xl font-black text-amber-400 font-mono tracking-tight flex items-baseline gap-1.5">
                <span>{metrics.totalOutQuantity.toLocaleString()}</span>
                <span className="text-sm font-bold text-amber-400/80 uppercase font-sans">Pcs</span>
              </div>
              <p className="text-[11px] text-[var(--text-muted)] mt-1">
                Total dispatched to field & projects
              </p>
            </div>
            <div className="mt-3 pt-2.5 border-t border-[var(--border-main)] flex items-center justify-between text-[11px]">
              <span className="text-[var(--text-dim)] font-medium">Out Dispatches:</span>
              <span className="font-mono font-bold text-amber-400">
                {metrics.outMovementsCount} Runs ({metrics.pcsOutQuantity.toLocaleString()} Pcs)
              </span>
            </div>
          </div>

          {/* Card 4: VALUE IN PCS */}
          <div
            onClick={() => {
              setActiveTab('inventory');
              setSubTab('stock-list');
            }}
            className="p-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-main)] hover:border-purple-500/40 transition cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-purple-400 uppercase tracking-wider">
                  Inventory Value in Pcs
                </span>
                <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20 group-hover:scale-105 transition">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl lg:text-3xl font-black text-[var(--text-main)] font-mono tracking-tight">
                {formatCurrency(metrics.pcsStockValue, homeCurrency, { includeCode: true })}
              </div>
              <p className="text-[11px] text-[var(--text-muted)] mt-1">
                Valuation of piece-count inventory
              </p>
            </div>
            <div className="mt-3 pt-2.5 border-t border-[var(--border-main)] flex items-center justify-between text-[11px]">
              <span className="text-[var(--text-dim)] font-medium">Total Warehouse:</span>
              <span className="font-mono font-bold text-purple-400">
                {formatCurrency(metrics.totalInventoryValue, homeCurrency)}
              </span>
            </div>
          </div>
        </div>

        {/* Visual Progress / Flow Ratio Indicator */}
        <div className="pt-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-[var(--text-muted)] gap-1.5 mb-2 font-medium">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
              <span>Inflow: {metrics.totalInQuantity.toLocaleString()} Pcs (100%)</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
              <span>Dispatched (OUT): {metrics.totalOutQuantity.toLocaleString()} Pcs ({metrics.stockOutRate}%)</span>
            </span>
            <span className="flex items-center gap-1.5 font-bold text-[var(--text-main)]">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0" />
              <span>Remaining (REMAIN): {metrics.totalRemainQuantity.toLocaleString()} Pcs ({metrics.stockRetentionRate}%)</span>
            </span>
          </div>

          {/* Segmented bar */}
          <div className="h-2.5 w-full rounded-full bg-[var(--bg-input)] overflow-hidden flex">
            <div
              className="h-full bg-amber-500 transition-all duration-500"
              style={{ width: `${Math.min(100, metrics.stockOutRate)}%` }}
              title={`Dispatched: ${metrics.totalOutQuantity.toLocaleString()} Pcs`}
            />
            <div
              className="h-full bg-blue-500 transition-all duration-500"
              style={{ width: `${Math.max(0, 100 - metrics.stockOutRate)}%` }}
              title={`Remaining: ${metrics.totalRemainQuantity.toLocaleString()} Pcs`}
            />
          </div>
        </div>
      </div>

      {/* KPI Cards (4 Column Grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Inventory Valuation */}
        <div
          onClick={() => {
            setActiveTab('inventory');
            setSubTab('stock-list');
          }}
          className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-main)] hover:border-[var(--border-light)] shadow-xs transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[var(--text-dim)] uppercase tracking-wider">
              Total Stock Valuation
            </span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 group-hover:scale-105 transition">
              <Box className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-[var(--text-main)] mt-2 font-mono tracking-tight">
            {formatCurrency(metrics.totalInventoryValue, homeCurrency, { includeCode: true })}
          </div>
          <div className="text-[11px] text-[var(--text-muted)] mt-1 flex items-center justify-between">
            <span>{metrics.skuCount} active warehouse SKUs</span>
            <span className="text-emerald-400 font-bold flex items-center gap-0.5">
              <span>View</span>
              <ChevronRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* KPI 2: Low Stock Alerts */}
        <div
          onClick={() => {
            setActiveTab('inventory');
            setSubTab('stock-list');
          }}
          className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-main)] hover:border-[var(--border-light)] shadow-xs transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[var(--text-dim)] uppercase tracking-wider">
              Critical Reorders
            </span>
            <div
              className={`p-2 rounded-lg border group-hover:scale-105 transition ${
                metrics.lowStockItems.length > 0
                  ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                  : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-[var(--text-main)] mt-2 font-mono tracking-tight">
            {metrics.lowStockItems.length}
            <span className="text-xs font-normal text-[var(--text-dim)] ml-1.5">SKUs at threshold</span>
          </div>
          <div className="text-[11px] text-[var(--text-muted)] mt-1 flex items-center justify-between">
            <span className={metrics.lowStockItems.length > 0 ? 'text-rose-400 font-semibold' : 'text-emerald-400 font-semibold'}>
              {metrics.lowStockItems.length > 0 ? 'Replenishment Needed' : 'Inventory Optimal'}
            </span>
            <span className="text-blue-400 font-bold flex items-center gap-0.5">
              <span>Inspect</span>
              <ChevronRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* KPI 3: Turnkey Projects Portfolio */}
        <div
          onClick={() => {
            setActiveTab('projects');
            setSubTab('ongoing');
          }}
          className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-main)] hover:border-[var(--border-light)] shadow-xs transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[var(--text-dim)] uppercase tracking-wider">
              Projects Portfolio
            </span>
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 group-hover:scale-105 transition">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-[var(--text-main)] mt-2 font-mono tracking-tight">
            {metrics.activeProjectsCount}
            <span className="text-xs font-normal text-[var(--text-dim)] ml-1.5">Ongoing</span>
          </div>
          <div className="text-[11px] text-[var(--text-muted)] mt-1 flex items-center justify-between">
            <span className="font-mono text-blue-400">
              {formatCurrency(metrics.totalProjectBudget, homeCurrency)}
            </span>
            <span className="text-[var(--text-dim)] font-bold">
              {metrics.completedProjectsCount} delivered
            </span>
          </div>
        </div>

        {/* KPI 4: Financial Burn Rate */}
        <div
          onClick={() => {
            setActiveTab('finance');
            setSubTab('maintenance');
          }}
          className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-main)] hover:border-[var(--border-light)] shadow-xs transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[var(--text-dim)] uppercase tracking-wider">
              Cumulative Expenses
            </span>
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20 group-hover:scale-105 transition">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-[var(--text-main)] mt-2 font-mono tracking-tight">
            {formatCurrency(metrics.totalExpenses, homeCurrency, { includeCode: true })}
          </div>
          <div className="text-[11px] text-[var(--text-muted)] mt-1 flex items-center justify-between">
            <span>Maint: {formatCurrency(metrics.maintenanceExpenses, homeCurrency)}</span>
            <span className="text-purple-400 font-semibold">Ledger &bull;</span>
          </div>
        </div>
      </div>

      {/* Mid Section: Visual Breakdown & ICT Network Footprint */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Inventory Valuation by Category */}
        <div className="lg:col-span-2 p-5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-main)] shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-main)]">
              <div>
                <h2 className="font-bold text-sm text-[var(--text-main)]">
                  Inventory Asset Distribution by Category
                </h2>
                <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                  Capital breakdown across telecom fiber, active gear, and splicing gear
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-blue-400">
                100% Reconciled
              </span>
            </div>

            <div className="mt-4 space-y-3">
              {categoryBreakdown.map((cat, idx) => {
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[var(--text-main)]">{cat.name}</span>
                        <span className="text-[10px] text-[var(--text-dim)]">({cat.count} SKUs)</span>
                      </div>
                      <div className="font-mono text-xs font-semibold text-[var(--text-muted)]">
                        {formatCurrency(cat.value, homeCurrency)} &bull;{' '}
                        <span className="text-blue-400 font-bold">{cat.percent.toFixed(1)}%</span>
                      </div>
                    </div>
                    {/* Visual Progress Bar */}
                    <div className="w-full h-2 rounded-full bg-[var(--bg-input)] overflow-hidden border border-[var(--border-main)]">
                      <div
                        className="h-full bg-gradient-to-r from-blue-600 to-indigo-500 rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(cat.percent, 3)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-[var(--border-main)] flex items-center justify-between text-xs text-[var(--text-dim)]">
            <span>Primary Valuation Base: {homeCurrency}</span>
            <button
              onClick={() => {
                setActiveTab('inventory');
                setSubTab('stock-list');
              }}
              className="text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1"
            >
              <span>Explore Master Catalog</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right: ICT Network Coverage Summary */}
        <div className="p-5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-main)] shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-main)]">
              <div>
                <h2 className="font-bold text-sm text-[var(--text-main)]">
                  ICT Engineering Footprint
                </h2>
                <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                  Deployment verification across turnkey network topologies
                </p>
              </div>
              <Cpu className="w-4 h-4 text-indigo-400" />
            </div>

            <div className="mt-4 space-y-4">
              {/* FTTH */}
              <div
                onClick={() => {
                  setActiveTab('ict-insights');
                  setSubTab('ftth');
                }}
                className="p-3 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-main)] hover:border-blue-500/40 cursor-pointer transition flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-md bg-blue-500/10 text-blue-400">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-xs text-[var(--text-main)]">FTTH (Home Fiber)</div>
                    <div className="text-[10px] text-[var(--text-dim)]">{ftth.length} OLT Clusters Logged</div>
                  </div>
                </div>
                <div className="text-right font-mono">
                  <div className="font-bold text-xs text-blue-400">
                    {metrics.totalHomesPassed.toLocaleString()}
                  </div>
                  <div className="text-[9px] text-[var(--text-dim)]">Homes Passed</div>
                </div>
              </div>

              {/* FTTB */}
              <div
                onClick={() => {
                  setActiveTab('ict-insights');
                  setSubTab('fttb');
                }}
                className="p-3 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-main)] hover:border-emerald-500/40 cursor-pointer transition flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-md bg-emerald-500/10 text-emerald-400">
                    <Building className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-xs text-[var(--text-main)]">FTTB (Multi-Dwelling MDU)</div>
                    <div className="text-[10px] text-[var(--text-dim)]">{metrics.totalBuildings} Buildings Configured</div>
                  </div>
                </div>
                <div className="text-right font-mono">
                  <div className="font-bold text-xs text-emerald-400">
                    {fttb.reduce((acc, b) => acc + b.activeCustomerPorts, 0)}
                  </div>
                  <div className="text-[9px] text-[var(--text-dim)]">Live Ports</div>
                </div>
              </div>

              {/* FTTM */}
              <div
                onClick={() => {
                  setActiveTab('ict-insights');
                  setSubTab('fttm');
                }}
                className="p-3 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-main)] hover:border-purple-500/40 cursor-pointer transition flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-md bg-purple-500/10 text-purple-400">
                    <Radio className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-xs text-[var(--text-main)]">FTTM (Metro & Towers)</div>
                    <div className="text-[10px] text-[var(--text-dim)]">{metrics.totalTowers} Mobile BTS Towers</div>
                  </div>
                </div>
                <div className="text-right font-mono">
                  <div className="font-bold text-xs text-purple-400">10 Gbps</div>
                  <div className="text-[9px] text-[var(--text-dim)]">Optical Backhaul</div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[var(--border-main)]">
            <button
              onClick={() => {
                setActiveTab('ict-insights');
                setSubTab('ftth');
              }}
              className="w-full py-2 rounded-lg bg-[var(--bg-surface)] hover:bg-[var(--bg-hover)] border border-[var(--border-main)] text-xs font-semibold text-[var(--text-main)] transition flex items-center justify-center gap-1.5"
            >
              <span>View Technical CAD & Diagrams</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Low Stock Alert Watchlist */}
      <div className="p-5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-main)] shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border-main)]">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <h2 className="font-bold text-sm text-[var(--text-main)]">
              Low Stock Threshold Watchlist ({metrics.lowStockItems.length})
            </h2>
          </div>
          <button
            onClick={() => {
              setActiveTab('inventory');
              setSubTab('stock-list');
            }}
            className="text-xs font-semibold text-blue-400 hover:text-blue-300 cursor-pointer"
          >
            All Inventory
          </button>
        </div>

        <div className="mt-3 divide-y divide-[var(--border-main)]/60 max-h-64 overflow-y-auto">
          {metrics.lowStockItems.length === 0 ? (
            <div className="py-8 text-center text-xs text-[var(--text-dim)]">
              All inventory items are currently above minimum safety thresholds.
            </div>
          ) : (
            metrics.lowStockItems.map((item) => (
              <div
                key={item.id}
                className="py-2.5 flex items-center justify-between text-xs hover:bg-[var(--bg-hover)] transition px-1 rounded"
              >
                <div>
                  <div className="font-bold text-[var(--text-main)] flex items-center gap-2">
                    <span>{item.name}</span>
                    <span className="font-mono text-[10px] text-[var(--text-dim)]">({item.itemCode})</span>
                  </div>
                  <div className="text-[10px] text-[var(--text-muted)]">
                    Min Threshold: {item.minThreshold} {item.unit} &bull; Warehouse: {item.location}
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-mono font-extrabold text-rose-400 text-xs">
                    {item.currentStock} {item.unit}
                  </div>
                  <button
                    onClick={() => {
                      setActiveTab('inventory');
                      setSubTab('movements');
                    }}
                    className="text-[10px] text-blue-400 font-semibold hover:underline cursor-pointer"
                  >
                    + Stock In
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Real-Time Operational Activity Stream */}
      <OperationsActivityStream />
    </div>
  );
};
