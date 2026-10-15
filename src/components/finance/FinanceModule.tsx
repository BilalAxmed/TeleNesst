import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { storage } from '../../services/storage';
import { Expense, SummaryKPI } from '../../types';
import { ConfirmDeleteModal } from '../common/ConfirmDeleteModal';
import { convertCurrency, formatCurrency, SUPPORTED_CURRENCIES } from '../../services/currency';
import { ExportService, ReportMeta } from '../../services/exportService';
import {
  DollarSign,
  Plus,
  Search,
  Filter,
  Calendar,
  CreditCard,
  Building,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  Printer,
  Download,
  Edit2,
  Trash2,
  X,
  ArrowUpRight,
  TrendingUp,
  Receipt,
  Repeat,
  Upload,
} from 'lucide-react';
import { ExpenseTrendAnalysis } from './ExpenseTrendAnalysis';

export const FinanceModule: React.FC = () => {
  const {
    subTab,
    setSubTab,
    currentUser,
    homeCurrency,
    exchangeRates,
    companyConfig,
    openLetterheadModal,
    showToast,
    canAccessFeature,
    triggerDataRefresh,
    softwareName,
  } = useApp();

  const [activeFinanceType, setActiveFinanceType] = useState<'maintenance' | 'ongoing' | 'trends'>(() => {
    if (subTab === 'ongoing') return 'ongoing';
    if (subTab === 'trends' || subTab === 'trend-analysis' || subTab === 'analytics') return 'trends';
    return 'maintenance';
  });

  const [expenses, setExpenses] = useState<Expense[]>(() => storage.getExpenses());

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Modals
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);
  const [isDeletingExpense, setIsDeletingExpense] = useState(false);

  useEffect(() => {
    if (
      subTab === 'maintenance' ||
      subTab === 'ongoing' ||
      subTab === 'trends' ||
      subTab === 'trend-analysis' ||
      subTab === 'analytics'
    ) {
      setActiveFinanceType(
        subTab === 'ongoing' ? 'ongoing' : subTab === 'maintenance' ? 'maintenance' : 'trends'
      );
    }
  }, [subTab]);

  const switchTab = (tab: 'maintenance' | 'ongoing' | 'trends') => {
    setActiveFinanceType(tab);
    setSubTab(tab);
  };

  const reloadData = () => {
    setExpenses(storage.getExpenses());
  };

  const maintenanceCategories = [
    'ALL',
    'Maintenance',
    'Vehicle Fuel',
    'Rent',
    'Vehicle & Transport',
    'OTDR & Splicer Tools',
    'Fusion Consumables',
    'Field Generator Fuel',
    'Safety Gear & PPE',
    'Civil Trenching Equipment',
    'Warehouse Maintenance',
  ];

  const ongoingCategories = [
    'ALL',
    'Rent',
    'Vehicle Fuel',
    'Maintenance',
    'Depot Warehouse Rent',
    'Utilities (Power & Water)',
    'Fiber Core GIS Licenses',
    'NOC Connectivity & Bandwidth',
    'Field Tech Salaries & Stipends',
    'Comprehensive Asset Insurance',
    'Software & Cloud ERP',
  ];

  // Filtered maintenance list
  const filteredMaintenance = useMemo(() => {
    return expenses.filter((e) => {
      const typeUpper = (e.type || '').toUpperCase();
      if (typeUpper !== 'MAINTENANCE') return false;
      const matchSearch =
        (e.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (e.paidTo || e.vendor || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (e.chargedTo || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (e.description || e.notes || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchCat = categoryFilter === 'ALL' || e.category === categoryFilter;
      const matchMethod = paymentMethodFilter === 'ALL' || e.paymentMethod === paymentMethodFilter;
      let matchDate = true;
      if (dateFrom) matchDate = matchDate && e.date >= dateFrom;
      if (dateTo) matchDate = matchDate && e.date <= dateTo;
      return matchSearch && matchCat && matchMethod && matchDate;
    });
  }, [expenses, searchQuery, categoryFilter, paymentMethodFilter, dateFrom, dateTo]);

  // Filtered ongoing list
  const filteredOngoing = useMemo(() => {
    return expenses.filter((e) => {
      const typeUpper = (e.type || '').toUpperCase();
      if (typeUpper !== 'ONGOING') return false;
      const matchSearch =
        (e.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (e.paidTo || e.vendor || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (e.chargedTo || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (e.description || e.notes || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchCat = categoryFilter === 'ALL' || e.category === categoryFilter;
      const matchStatus = statusFilter === 'ALL' || (e.paymentStatus || 'Paid') === statusFilter;
      return matchSearch && matchCat && matchStatus;
    });
  }, [expenses, searchQuery, categoryFilter, statusFilter]);

  // Stats calculation
  const totalMaintenanceHome = useMemo(() => {
    return filteredMaintenance.reduce((sum, e) => {
      const amt = Number(e.originalAmount ?? e.amount) || 0;
      const curr = e.originalCurrency || e.currency || homeCurrency;
      return sum + convertCurrency(amt, curr, homeCurrency, exchangeRates);
    }, 0);
  }, [filteredMaintenance, homeCurrency, exchangeRates]);

  const totalOngoingMonthlyRunRate = useMemo(() => {
    return filteredOngoing.reduce((sum, e) => {
      const amt = Number(e.originalAmount ?? e.amount) || 0;
      const curr = e.originalCurrency || e.currency || homeCurrency;
      const homeAmt = convertCurrency(amt, curr, homeCurrency, exchangeRates);
      const cycle = e.billingCycle || 'Monthly';
      if (cycle === 'Annual') return sum + homeAmt / 12;
      if (cycle === 'Quarterly') return sum + homeAmt / 3;
      if (cycle === 'Monthly') return sum + homeAmt;
      return sum;
    }, 0);
  }, [filteredOngoing, homeCurrency, exchangeRates]);

  const pendingBillsCount = useMemo(() => {
    return expenses.filter((e) => {
      const typeUpper = (e.type || '').toUpperCase();
      return typeUpper === 'ONGOING' && (e.paymentStatus || 'Paid') !== 'Paid';
    }).length;
  }, [expenses]);

  // Save Expense (Maintenance or Ongoing)
  const handleSaveExpense = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);

    const title = fd.get('title') as string;
    const category = fd.get('category') as string;
    const originalAmount = parseFloat(fd.get('originalAmount') as string) || 0;
    const originalCurrency = (fd.get('originalCurrency') as string) || homeCurrency;
    const paidTo = (fd.get('paidTo') as string) || 'Vendor / Utility';
    const chargedTo = (fd.get('chargedTo') as string) || 'Warehouse Depot Operations';
    const paymentMethod = (fd.get('paymentMethod') as any) || 'Bank Transfer';
    const date = (fd.get('date') as string) || new Date().toISOString().split('T')[0];
    const description = (fd.get('description') as string) || '';

    // Ongoing specifics
    const billingCycle = (fd.get('billingCycle') as any) || 'Monthly';
    const dueDate = (fd.get('dueDate') as string) || date;
    const paymentStatus = (fd.get('paymentStatus') as any) || 'Paid';

    const convertedHomeAmount = convertCurrency(
      originalAmount,
      originalCurrency,
      homeCurrency,
      exchangeRates
    );

    const expenseData: Expense = {
      id: editingExpense ? editingExpense.id : `exp_${Date.now()}`,
      type: activeFinanceType === 'maintenance' ? 'Maintenance' : 'Ongoing',
      title,
      category,
      amount: originalAmount,
      currency: originalCurrency,
      originalAmount,
      originalCurrency,
      convertedHomeAmount,
      paidTo,
      vendor: paidTo,
      chargedTo,
      paymentMethod,
      date,
      approvedBy: editingExpense ? editingExpense.approvedBy : currentUser?.fullName || 'Finance Lead',
      description,
      notes: description,
      receiptAttachment: editingExpense?.receiptAttachment,
      billingCycle: activeFinanceType === 'ongoing' ? billingCycle : undefined,
      dueDate: activeFinanceType === 'ongoing' ? dueDate : undefined,
      paymentStatus: activeFinanceType === 'ongoing' ? paymentStatus : 'Paid',
      createdByUserId: editingExpense ? (editingExpense.createdByUserId || currentUser?.id) : currentUser?.id,
      createdByUserName: editingExpense ? (editingExpense.createdByUserName || currentUser?.fullName) : currentUser?.fullName,
      lastUpdatedByUserId: currentUser?.id,
      lastUpdatedByUserName: currentUser?.fullName,
    };

    const updated = editingExpense
      ? expenses.map((x) => (x.id === editingExpense.id ? expenseData : x))
      : [expenseData, ...expenses];

    storage.saveExpenses(updated);
    storage.logActivity({
      userId: currentUser?.id || 'sys',
      userName: currentUser?.fullName || 'User',
      userRole: currentUser?.role || 'Standard User',
      action: editingExpense ? 'UPDATE' : 'CREATE',
      module: 'Finance',
      targetId: expenseData.id,
      description: `${editingExpense ? 'Updated' : 'Recorded'} ${expenseData.type.toLowerCase()} expense: ${expenseData.title} (${expenseData.originalCurrency} ${expenseData.originalAmount.toLocaleString()})`,
    });

    showToast(`Expense "${title}" saved.`, 'success');
    setIsExpenseModalOpen(false);
    setEditingExpense(null);
    reloadData();
  };

  // Delete Expense via Modal Confirmation
  const handleDeleteExpense = (exp: Expense) => {
    setExpenseToDelete(exp);
  };

  const handleConfirmDeleteExpense = () => {
    if (!expenseToDelete) return;
    setIsDeletingExpense(true);
    try {
      const updated = expenses.filter((x) => x.id !== expenseToDelete.id);
      storage.saveExpenses(updated);
      setExpenses(updated);
      storage.logActivity({
        userId: currentUser?.id || 'sys',
        userName: currentUser?.fullName || 'User',
        userRole: currentUser?.role || 'Standard User',
        action: 'DELETE',
        module: 'Finance',
        targetId: expenseToDelete.id,
        description: `Deleted ${expenseToDelete.type.toLowerCase()} expense ${expenseToDelete.title} (${expenseToDelete.category})`,
      });
      showToast(`Expense "${expenseToDelete.title}" permanently removed.`, 'warning');
      setExpenseToDelete(null);
      reloadData();
      triggerDataRefresh();
    } catch (err: any) {
      showToast(`Failed to delete expense: ${err?.message || err}`, 'error');
    } finally {
      setIsDeletingExpense(false);
    }
  };

  // Toggle status for ongoing bills
  const handleToggleStatus = (exp: Expense) => {
    const nextStatus: 'Paid' | 'Pending' = exp.paymentStatus === 'Paid' ? 'Pending' : 'Paid';
    const updated = expenses.map((x) => (x.id === exp.id ? { ...x, paymentStatus: nextStatus } : x));
    storage.saveExpenses(updated);
    showToast(`Marked "${exp.title}" as ${nextStatus}.`, 'info');
    reloadData();
  };

  // Export Maintenance on Letterhead
  const handleExportMaintenance = () => {
    const columns = [
      { header: 'Date', key: 'date' },
      { header: 'Expense Title', key: 'title' },
      { header: 'Category', key: 'category' },
      { header: 'Original Amount', key: 'origAmountFormatted' },
      { header: `Converted (${homeCurrency})`, key: 'homeAmountFormatted' },
      { header: 'Paid To', key: 'paidTo' },
      { header: 'Payment Method', key: 'paymentMethod' },
      { header: 'Department / Charged To', key: 'chargedTo' },
      { header: 'Approved By', key: 'approvedBy' },
    ];

    const data = filteredMaintenance.map((m) => {
      const amt = Number(m.originalAmount ?? m.amount) || 0;
      const curr = m.originalCurrency || m.currency || homeCurrency;
      const vendorName = m.paidTo || m.vendor || 'Authorized Service Vendor';
      const desc = m.description || m.notes || '';
      const charged = m.chargedTo || 'Depot Operations';
      return {
        ...m,
        paidTo: vendorName,
        description: desc,
        chargedTo: charged,
        origAmountFormatted: formatCurrency(amt, curr, { includeCode: true }),
        homeAmountFormatted: formatCurrency(
          convertCurrency(amt, curr, homeCurrency, exchangeRates),
          homeCurrency,
          { includeCode: true }
        ),
      };
    });

    const summaryCards: SummaryKPI[] = [
      {
        label: 'Total Maintenance Cost',
        value: formatCurrency(totalMaintenanceHome, homeCurrency, { includeCode: true }),
        subtext: `Normalized in ${homeCurrency}`,
      },
      {
        label: 'Direct Sum Logged',
        value: filteredMaintenance.reduce((sum, e) => sum + (Number(e.originalAmount ?? e.amount) || 0), 0).toLocaleString(),
        subtext: 'Native currencies',
      },
      {
        label: 'Filtered Cost Entries',
        value: `${data.length} Records`,
        subtext: dateFrom && dateTo ? `${dateFrom} to ${dateTo}` : 'All Periods',
      },
      {
        label: 'Reporting Standard',
        value: 'IFRS / GAAP Audited',
        subtext: `Audited by ${currentUser?.fullName || 'Finance Lead'}`,
      },
    ];

    openLetterheadModal({
      title: 'Maintenance Expense Disbursement & Settlement Register',
      columns,
      data,
      dateRange: dateFrom && dateTo ? `${dateFrom} to ${dateTo}` : `As of ${new Date().toLocaleDateString()}`,
      filterSummary: `Total Expenditure: ${formatCurrency(totalMaintenanceHome, homeCurrency, { includeCode: true })}, Entries: ${data.length}`,
      summaryCards,
      moduleName: 'Finance',
    });
  };

  // Export Ongoing on Letterhead
  const handleExportOngoing = () => {
    const columns = [
      { header: 'Operational Expense', key: 'title' },
      { header: 'Category', key: 'category' },
      { header: 'Cycle', key: 'billingCycle' },
      { header: 'Due Date', key: 'dueDate' },
      { header: 'Amount', key: 'origAmountFormatted' },
      { header: `Monthly Run-rate (${homeCurrency})`, key: 'runRateFormatted' },
      { header: 'Vendor / Provider', key: 'paidTo' },
      { header: 'Status', key: 'paymentStatus' },
    ];

    const data = filteredOngoing.map((o) => {
      const amt = Number(o.originalAmount ?? o.amount) || 0;
      const curr = o.originalCurrency || o.currency || homeCurrency;
      const cycle = o.billingCycle || 'Monthly';
      const homeAmt = convertCurrency(amt, curr, homeCurrency, exchangeRates);
      let monthly = homeAmt;
      if (cycle === 'Annual') monthly = homeAmt / 12;
      if (cycle === 'Quarterly') monthly = homeAmt / 3;

      return {
        ...o,
        billingCycle: cycle,
        paidTo: o.paidTo || o.vendor || 'Authorized Provider',
        paymentStatus: o.paymentStatus || 'Paid',
        origAmountFormatted: formatCurrency(amt, curr, { includeCode: true }),
        runRateFormatted: formatCurrency(monthly, homeCurrency, { includeCode: true }),
      };
    });

    const summaryCards: SummaryKPI[] = [
      {
        label: 'Monthly Burn Rate',
        value: formatCurrency(totalOngoingMonthlyRunRate, homeCurrency, { includeCode: true }),
        subtext: `Monthly recurring operational OPEX`,
      },
      {
        label: 'Annualized Commitment',
        value: formatCurrency(totalOngoingMonthlyRunRate * 12, homeCurrency, { includeCode: true }),
        subtext: 'Projected 12-month OPEX',
      },
      {
        label: 'Recurring Commitments',
        value: `${data.length} Contracts`,
        subtext: 'Active provider services',
      },
      {
        label: 'Settlement Status',
        value: `${data.filter((d: any) => d.paymentStatus === 'Paid').length} Paid / ${data.filter((d: any) => d.paymentStatus !== 'Paid').length} Due`,
        subtext: 'Billing fulfillment',
      },
    ];

    openLetterheadModal({
      title: 'Ongoing Operational Commitments & Recurring Burn Rate',
      columns,
      data,
      dateRange: `Report Generated: ${new Date().toLocaleDateString()}`,
      filterSummary: `Monthly Burn Rate: ${formatCurrency(totalOngoingMonthlyRunRate, homeCurrency, { includeCode: true })}, Scope: ${data.length} recurring items`,
      summaryCards,
      moduleName: 'Finance',
    });
  };

  // Download PDF directly with Professional Letterhead Layout & Executive Summaries
  const handleDownloadPDF = () => {
    if (!currentUser) return;
    const todayStr = new Date().toISOString().split('T')[0];

    if (activeFinanceType === 'maintenance') {
      const columns = [
        { header: 'Date', key: 'date' },
        { header: 'Expense Title', key: 'title' },
        { header: 'Category', key: 'category' },
        { header: 'Original Amount', key: 'origAmountFormatted' },
        { header: `Converted (${homeCurrency})`, key: 'homeAmountFormatted' },
        { header: 'Paid To', key: 'paidTo' },
        { header: 'Payment Method', key: 'paymentMethod' },
        { header: 'Department / Charged To', key: 'chargedTo' },
        { header: 'Approved By', key: 'approvedBy' },
      ];

      const data = filteredMaintenance.map((m) => {
        const amt = Number(m.originalAmount ?? m.amount) || 0;
        const curr = m.originalCurrency || m.currency || homeCurrency;
        const vendorName = m.paidTo || m.vendor || 'Authorized Service Vendor';
        const desc = m.description || m.notes || '';
        const charged = m.chargedTo || 'Depot Operations';
        return {
          ...m,
          paidTo: vendorName,
          description: desc,
          chargedTo: charged,
          origAmountFormatted: formatCurrency(amt, curr, { includeCode: true }),
          homeAmountFormatted: formatCurrency(
            convertCurrency(amt, curr, homeCurrency, exchangeRates),
            homeCurrency,
            { includeCode: true }
          ),
        };
      });

      const summaryCards: SummaryKPI[] = [
        {
          label: 'Total Maintenance Cost',
          value: formatCurrency(totalMaintenanceHome, homeCurrency, { includeCode: true }),
          subtext: `Normalized in ${homeCurrency}`,
        },
        {
          label: 'Direct Sum Logged',
          value: filteredMaintenance.reduce((sum, e) => sum + (Number(e.originalAmount ?? e.amount) || 0), 0).toLocaleString(),
          subtext: 'Native transaction currencies',
        },
        {
          label: 'Filtered Cost Entries',
          value: `${data.length} Records`,
          subtext: dateFrom && dateTo ? `${dateFrom} to ${dateTo}` : 'All Periods',
        },
        {
          label: 'Reporting Standard',
          value: 'GAAP / IFRS Verified',
          subtext: `Audited by ${currentUser.fullName} (${currentUser.role})`,
        },
      ];

      const meta: ReportMeta = {
        title: 'Maintenance Expense Disbursement & Settlement Register',
        dateRange: dateFrom && dateTo ? `${dateFrom} to ${dateTo}` : `As of ${new Date().toLocaleDateString()}`,
        filterSummary: `Total Expenditure: ${formatCurrency(totalMaintenanceHome, homeCurrency, { includeCode: true })}, Entries: ${data.length}`,
        currentUser,
        companyConfig,
        summaryCards,
        moduleName: 'Finance',
      };

      try {
        ExportService.exportToPDF(
          `${softwareName}_Finance_Maintenance_Summary_${todayStr}.pdf`,
          columns,
          data,
          meta
        );
        showToast('Finance Maintenance Summary PDF downloaded with professional letterhead layout.', 'success');
      } catch (err: any) {
        showToast(`PDF download failed: ${err?.message || err}`, 'error');
      }
    } else if (activeFinanceType === 'ongoing') {
      const columns = [
        { header: 'Operational Expense', key: 'title' },
        { header: 'Category', key: 'category' },
        { header: 'Cycle', key: 'billingCycle' },
        { header: 'Due Date', key: 'dueDate' },
        { header: 'Amount', key: 'origAmountFormatted' },
        { header: `Monthly Run-rate (${homeCurrency})`, key: 'runRateFormatted' },
        { header: 'Vendor / Provider', key: 'paidTo' },
        { header: 'Status', key: 'paymentStatus' },
      ];

      const data = filteredOngoing.map((o) => {
        const amt = Number(o.originalAmount ?? o.amount) || 0;
        const curr = o.originalCurrency || o.currency || homeCurrency;
        const cycle = o.billingCycle || 'Monthly';
        const homeAmt = convertCurrency(amt, curr, homeCurrency, exchangeRates);
        let monthly = homeAmt;
        if (cycle === 'Annual') monthly = homeAmt / 12;
        if (cycle === 'Quarterly') monthly = homeAmt / 3;

        return {
          ...o,
          billingCycle: cycle,
          paidTo: o.paidTo || o.vendor || 'Authorized Provider',
          paymentStatus: o.paymentStatus || 'Paid',
          origAmountFormatted: formatCurrency(amt, curr, { includeCode: true }),
          runRateFormatted: formatCurrency(monthly, homeCurrency, { includeCode: true }),
        };
      });

      const summaryCards: SummaryKPI[] = [
        {
          label: 'Monthly Burn Rate',
          value: formatCurrency(totalOngoingMonthlyRunRate, homeCurrency, { includeCode: true }),
          subtext: `Monthly recurring operational OPEX`,
        },
        {
          label: 'Annualized Commitment',
          value: formatCurrency(totalOngoingMonthlyRunRate * 12, homeCurrency, { includeCode: true }),
          subtext: 'Projected 12-month burn rate',
        },
        {
          label: 'Recurring Commitments',
          value: `${data.length} Contracts`,
          subtext: 'Active provider services',
        },
        {
          label: 'Settlement Status',
          value: `${data.filter((d: any) => d.paymentStatus === 'Paid').length} Paid / ${data.filter((d: any) => d.paymentStatus !== 'Paid').length} Due`,
          subtext: 'Billing fulfillment',
        },
      ];

      const meta: ReportMeta = {
        title: 'Ongoing Operational Commitments & Recurring Burn Rate',
        dateRange: `Report Generated: ${new Date().toLocaleDateString()}`,
        filterSummary: `Monthly Burn Rate: ${formatCurrency(totalOngoingMonthlyRunRate, homeCurrency, { includeCode: true })}, Scope: ${data.length} recurring items`,
        currentUser,
        companyConfig,
        summaryCards,
        moduleName: 'Finance',
      };

      try {
        ExportService.exportToPDF(
          `${softwareName}_Finance_Ongoing_Commitments_${todayStr}.pdf`,
          columns,
          data,
          meta
        );
        showToast('Ongoing Commitments Summary PDF downloaded with professional letterhead layout.', 'success');
      } catch (err: any) {
        showToast(`PDF download failed: ${err?.message || err}`, 'error');
      }
    } else {
      // Trends View Export
      const columns = [
        { header: 'Title', key: 'title' },
        { header: 'Type', key: 'type' },
        { header: 'Category', key: 'category' },
        { header: 'Date', key: 'date' },
        { header: 'Original', key: 'origAmountFormatted' },
        { header: `Normalized (${homeCurrency})`, key: 'homeAmountFormatted' },
        { header: 'Vendor / Paid To', key: 'paidTo' },
      ];

      const data = expenses.map((e) => ({
        ...e,
        origAmountFormatted: formatCurrency(e.originalAmount ?? e.amount, e.originalCurrency || e.currency || homeCurrency, { includeCode: true }),
        homeAmountFormatted: formatCurrency(
          convertCurrency(e.originalAmount ?? e.amount, e.originalCurrency || e.currency || homeCurrency, homeCurrency, exchangeRates),
          homeCurrency,
          { includeCode: true }
        ),
      }));

      const totalAll = expenses.reduce(
        (sum, e) => sum + convertCurrency(e.originalAmount ?? e.amount, e.originalCurrency || e.currency || homeCurrency, homeCurrency, exchangeRates),
        0
      );

      const summaryCards: SummaryKPI[] = [
        {
          label: 'Total All Expenditures',
          value: formatCurrency(totalAll, homeCurrency, { includeCode: true }),
          subtext: `Consolidated in ${homeCurrency}`,
        },
        {
          label: 'Total Expense Entries',
          value: `${expenses.length} Records`,
          subtext: 'Maintenance & Ongoing OPEX',
        },
        {
          label: 'Maintenance Subtotal',
          value: formatCurrency(totalMaintenanceHome, homeCurrency, { includeCode: true }),
          subtext: 'Consumables & field equipment',
        },
        {
          label: 'Monthly Recurring Burn',
          value: formatCurrency(totalOngoingMonthlyRunRate, homeCurrency, { includeCode: true }),
          subtext: 'Recurring commitments',
        },
      ];

      const meta: ReportMeta = {
        title: 'Master Financial Expenditure & Trend Audit Register',
        dateRange: `Comprehensive Master Audit: ${new Date().toLocaleDateString()}`,
        filterSummary: `Consolidated Expenditure: ${formatCurrency(totalAll, homeCurrency, { includeCode: true })} across ${expenses.length} records`,
        currentUser,
        companyConfig,
        summaryCards,
        moduleName: 'Finance',
      };

      try {
        ExportService.exportToPDF(
          `${softwareName}_Finance_Master_Summary_${todayStr}.pdf`,
          columns,
          data,
          meta
        );
        showToast('Master Financial Summary PDF with corporate letterhead downloaded.', 'success');
      } catch (err: any) {
        showToast(`PDF download failed: ${err?.message || err}`, 'error');
      }
    }
  };

  return (
    <div className="p-4 lg:p-6 space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black tracking-tight text-[var(--text-main)]">
              Finance & Expenditure Modules
            </h1>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Module 3
            </span>
          </div>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            Multi-currency tracking for maintenance consumables, equipment servicing, and ongoing recurring overheads
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Sub-Tabs */}
          <div className="flex rounded-lg bg-[var(--bg-card)] p-1 border border-[var(--border-main)] text-xs font-bold">
            <button
              onClick={() => switchTab('maintenance')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition cursor-pointer ${
                activeFinanceType === 'maintenance'
                  ? 'bg-[var(--accent)] text-white shadow-xs'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>3.1 Maintenance</span>
            </button>
            <button
              onClick={() => switchTab('ongoing')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition cursor-pointer ${
                activeFinanceType === 'ongoing'
                  ? 'bg-[var(--accent)] text-white shadow-xs'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              <Repeat className="w-3.5 h-3.5" />
              <span>3.2 Ongoing</span>
            </button>
            <button
              onClick={() => switchTab('trends')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition cursor-pointer ${
                activeFinanceType === 'trends'
                  ? 'bg-[var(--accent)] text-white shadow-xs'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>3.3 Expense Trend Analysis</span>
            </button>
          </div>

          <button
            onClick={() => {
              setEditingExpense(null);
              setIsExpenseModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-bold shadow transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Record Expense</span>
          </button>

          {/* Download PDF with Professional Letterhead Layout */}
          <button
            onClick={handleDownloadPDF}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-sm transition cursor-pointer"
            title="Download official PDF report summary with professional letterhead layout"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download PDF</span>
          </button>

          {activeFinanceType !== 'trends' && (
            <button
              onClick={activeFinanceType === 'maintenance' ? handleExportMaintenance : handleExportOngoing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] border border-[var(--border-main)] text-xs font-semibold text-[var(--text-main)] transition cursor-pointer"
              title="Preview report with corporate letterhead in modal"
            >
              <Printer className="w-3.5 h-3.5 text-blue-400" />
              <span>Letterhead Preview</span>
            </button>
          )}
        </div>
      </div>

      {activeFinanceType === 'trends' ? (
        <ExpenseTrendAnalysis expenses={expenses} />
      ) : (
        <>
          {/* Financial KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-main)]">
          <div className="text-[11px] font-medium text-[var(--text-dim)]">
            Total Maintenance Cost ({homeCurrency})
          </div>
          <div className="text-xl font-extrabold text-[var(--text-main)] mt-1">
            {formatCurrency(totalMaintenanceHome, homeCurrency, { includeCode: true })}
          </div>
          <div className="text-[10px] text-blue-400 font-semibold mt-0.5">
            {filteredMaintenance.length} maintenance receipts settled
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-main)]">
          <div className="text-[11px] font-medium text-[var(--text-dim)]">
            Monthly Operational Burn-Rate ({homeCurrency})
          </div>
          <div className="text-xl font-extrabold text-amber-400 mt-1">
            {formatCurrency(totalOngoingMonthlyRunRate, homeCurrency, { includeCode: true })}
          </div>
          <div className="text-[10px] text-[var(--text-dim)] mt-0.5">
            Normalized 30-day recurring overhead
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-main)]">
          <div className="text-[11px] font-medium text-[var(--text-dim)]">Upcoming / Pending Bills</div>
          <div className="text-xl font-extrabold text-rose-400 mt-1">
            {pendingBillsCount} Invoices
          </div>
          <div className="text-[10px] text-rose-400 font-semibold mt-0.5">
            Awaiting verification or settlement
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-main)] flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <div className="relative w-full">
            <Search className="w-3.5 h-3.5 text-[var(--text-dim)] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search expenses, vendors, projects, departments..."
              className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-[var(--bg-input)] border border-[var(--border-main)] text-xs text-[var(--text-main)] focus:outline-none focus:border-[var(--accent)]"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg bg-[var(--bg-input)] border border-[var(--border-main)] text-xs text-[var(--text-main)]"
          >
            {(activeFinanceType === 'maintenance' ? maintenanceCategories : ongoingCategories).map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {activeFinanceType === 'maintenance' ? (
            <>
              <select
                value={paymentMethodFilter}
                onChange={(e) => setPaymentMethodFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg bg-[var(--bg-input)] border border-[var(--border-main)] text-xs text-[var(--text-main)]"
              >
                <option value="ALL">All Payment Methods</option>
                <option value="Cash">Cash</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Company Card">Company Card</option>
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
            </>
          ) : (
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-[var(--bg-input)] border border-[var(--border-main)] text-xs text-[var(--text-main)]"
            >
              <option value="ALL">All Payment Statuses</option>
              <option value="Paid">Paid</option>
              <option value="Pending">Pending</option>
              <option value="Overdue">Overdue</option>
            </select>
          )}
        </div>
      </div>

      {/* Main Table: Maintenance vs. Ongoing */}
      <div className="border border-[var(--border-main)] rounded-xl overflow-hidden bg-[var(--bg-card)] shadow-xs">
        <div className="overflow-x-auto">
          {activeFinanceType === 'maintenance' ? (
            /* Maintenance Grid */
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[var(--border-main)] bg-[var(--bg-surface)] text-[var(--text-muted)] font-semibold">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Expense Title & Scope</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4 text-right">Original Amount</th>
                  <th className="py-3 px-4 text-right">Converted ({homeCurrency})</th>
                  <th className="py-3 px-4">Paid To / Vendor</th>
                  <th className="py-3 px-4">Payment Method</th>
                  <th className="py-3 px-4">Charged To</th>
                  <th className="py-3 px-4">Approved By</th>
                  <th className="py-3 px-4 text-center">Receipt</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-main)]/60">
                {filteredMaintenance.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="py-8 text-center text-[var(--text-dim)]">
                      No maintenance expense records found.
                    </td>
                  </tr>
                ) : (
                  filteredMaintenance.map((m) => {
                    const amt = Number(m.originalAmount ?? m.amount) || 0;
                    const curr = m.originalCurrency || m.currency || homeCurrency;
                    const converted = convertCurrency(amt, curr, homeCurrency, exchangeRates);
                    const vendorName = m.paidTo || m.vendor || 'Authorized Service Vendor';
                    const desc = m.description || m.notes || '';
                    const charged = m.chargedTo || 'Depot Operations';

                    return (
                      <tr key={m.id} className="hover:bg-[var(--bg-hover)] transition group">
                        <td className="py-3 px-4 font-mono text-[var(--text-muted)]">{m.date}</td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-[var(--text-main)]">{m.title}</div>
                          {desc && (
                            <div className="text-[10px] text-[var(--text-dim)] truncate max-w-xs">
                              {desc}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[var(--bg-input)] border border-[var(--border-light)] text-[var(--text-muted)]">
                            {m.category}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-semibold text-[var(--text-main)]">
                          {formatCurrency(amt, curr, { includeCode: true })}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-blue-400">
                          {formatCurrency(converted, homeCurrency, { includeCode: true })}
                        </td>
                        <td className="py-3 px-4 font-medium text-[var(--text-muted)]">{vendorName}</td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center gap-1 text-[11px] text-[var(--text-dim)]">
                            <CreditCard className="w-3 h-3" />
                            <span>{m.paymentMethod || 'Bank Transfer'}</span>
                          </span>
                        </td>
                        <td className="py-3 px-4 text-[var(--text-muted)]">{charged}</td>
                        <td className="py-3 px-4 text-[10px] text-[var(--text-dim)]">{m.approvedBy}</td>
                        <td className="py-3 px-4 text-center">
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded bg-[var(--bg-input)] text-emerald-400 border border-emerald-500/20">
                            <CheckCircle2 className="w-2.5 h-2.5" />
                            <span>Verified</span>
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => {
                                setEditingExpense(m);
                                setIsExpenseModalOpen(true);
                              }}
                              className="p-1 rounded hover:bg-[var(--bg-surface)] text-[var(--text-dim)] hover:text-[var(--text-main)]"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            {canAccessFeature('canDeleteFinance') && (
                              <button
                                type="button"
                                onClick={() => handleDeleteExpense(m)}
                                className="p-1 rounded hover:bg-rose-950/40 text-[var(--text-dim)] hover:text-rose-400 cursor-pointer transition"
                                title="Delete Maintenance Expense"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          ) : (
            /* Ongoing Grid */
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[var(--border-main)] bg-[var(--bg-surface)] text-[var(--text-muted)] font-semibold">
                  <th className="py-3 px-4">Operational Commitment</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4 text-center">Cycle</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4 text-right">Commitment Amount</th>
                  <th className="py-3 px-4 text-right">Monthly Burn Rate ({homeCurrency})</th>
                  <th className="py-3 px-4">Vendor / Authority</th>
                  <th className="py-3 px-4 text-center">Payment Status</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-main)]/60">
                {filteredOngoing.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-[var(--text-dim)]">
                      No ongoing commitments found.
                    </td>
                  </tr>
                ) : (
                  filteredOngoing.map((o) => {
                    const amt = Number(o.originalAmount ?? o.amount) || 0;
                    const curr = o.originalCurrency || o.currency || homeCurrency;
                    const cycle = o.billingCycle || 'Monthly';
                    const vendorName = o.paidTo || o.vendor || 'Authorized Provider';
                    const charged = o.chargedTo || 'General Operations';
                    const dueDate = o.dueDate || o.date || 'Monthly Continuous';
                    const homeAmt = convertCurrency(
                      amt,
                      curr,
                      homeCurrency,
                      exchangeRates
                    );
                    let monthly = homeAmt;
                    if (cycle === 'Annual') monthly = homeAmt / 12;
                    if (cycle === 'Quarterly') monthly = homeAmt / 3;

                    const isPaid = (o.paymentStatus || 'Paid') === 'Paid';
                    const isOverdue = o.paymentStatus === 'Overdue';

                    return (
                      <tr key={o.id} className="hover:bg-[var(--bg-hover)] transition">
                        <td className="py-3 px-4">
                          <div className="font-bold text-[var(--text-main)]">{o.title}</div>
                          <div className="text-[10px] text-[var(--text-dim)]">{charged}</div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[var(--bg-input)] border border-[var(--border-light)] text-[var(--text-muted)]">
                            {o.category}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center font-mono">
                          <span className="px-2 py-0.5 rounded bg-[var(--bg-input)] text-[var(--text-main)] text-[10px] font-semibold border border-[var(--border-light)]">
                            {cycle}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-[var(--text-muted)]">{dueDate}</td>
                        <td className="py-3 px-4 text-right font-mono font-semibold text-[var(--text-main)]">
                          {formatCurrency(amt, curr, { includeCode: true })}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-amber-400">
                          {formatCurrency(monthly, homeCurrency, { includeCode: true })}
                        </td>
                        <td className="py-3 px-4 font-medium text-[var(--text-muted)]">{vendorName}</td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => handleToggleStatus(o)}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border transition ${
                              isPaid
                                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25'
                                : isOverdue
                                ? 'bg-rose-500/15 text-rose-400 border-rose-500/30 hover:bg-rose-500/25'
                                : 'bg-amber-500/15 text-amber-400 border-amber-500/30 hover:bg-amber-500/25'
                            }`}
                            title="Click to toggle status"
                          >
                            {isPaid ? (
                              <CheckCircle2 className="w-3 h-3" />
                            ) : isOverdue ? (
                              <AlertTriangle className="w-3 h-3" />
                            ) : (
                              <Clock className="w-3 h-3" />
                            )}
                            <span>{o.paymentStatus}</span>
                          </button>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => {
                                setEditingExpense(o);
                                setIsExpenseModalOpen(true);
                              }}
                              className="p-1 rounded hover:bg-[var(--bg-surface)] text-[var(--text-dim)] hover:text-[var(--text-main)]"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            {canAccessFeature('canDeleteFinance') && (
                              <button
                                type="button"
                                onClick={() => handleDeleteExpense(o)}
                                className="p-1 rounded hover:bg-rose-950/40 text-[var(--text-dim)] hover:text-rose-400 cursor-pointer transition"
                                title="Delete Ongoing Commitment"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
      </>
      )}

      {/* Add / Edit Expense Modal */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-xl bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-2xl shadow-2xl p-6 text-[var(--text-main)] overflow-hidden">
            <div className="flex items-center justify-between pb-4 border-b border-[var(--border-main)]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-blue-600/10 text-blue-400 border border-blue-500/20">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold">
                    {editingExpense ? 'Edit' : 'Record'}{' '}
                    {activeFinanceType === 'maintenance' ? 'Maintenance' : 'Ongoing'} Expense
                  </h3>
                  <p className="text-xs text-[var(--text-muted)]">
                    Corporate expenditure entry with currency conversion
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsExpenseModalOpen(false)}
                className="p-1 rounded-lg text-[var(--text-dim)] hover:text-[var(--text-main)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveExpense} className="mt-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-[var(--text-muted)] mb-1">
                  Expense Title / Purpose
                </label>
                <input
                  type="text"
                  name="title"
                  required
                  defaultValue={editingExpense?.title || ''}
                  placeholder="e.g. Splicer Electrodes Replacement or Warehouse Facility Rent"
                  className="w-full px-3 py-2 rounded-lg bg-[var(--bg-input)] border border-[var(--border-main)] text-[var(--text-main)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[var(--text-muted)] mb-1">
                    Category
                  </label>
                  <select
                    name="category"
                    defaultValue={
                      editingExpense?.category ||
                      (activeFinanceType === 'maintenance'
                        ? 'Vehicle & Transport'
                        : 'Depot Warehouse Rent')
                    }
                    className="w-full px-3 py-2 rounded-lg bg-[var(--bg-input)] border border-[var(--border-main)] text-[var(--text-main)]"
                  >
                    {(activeFinanceType === 'maintenance' ? maintenanceCategories : ongoingCategories)
                      .filter((c) => c !== 'ALL')
                      .map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-semibold text-[var(--text-muted)] mb-1">
                      Amount
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      name="originalAmount"
                      defaultValue={editingExpense?.originalAmount || 250}
                      className="w-full px-3 py-2 rounded-lg bg-[var(--bg-input)] border border-[var(--border-main)] text-[var(--text-main)] font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-[var(--text-muted)] mb-1">
                      Currency
                    </label>
                    <select
                      name="originalCurrency"
                      defaultValue={editingExpense?.originalCurrency || homeCurrency}
                      className="w-full px-3 py-2 rounded-lg bg-[var(--bg-input)] border border-[var(--border-main)] text-[var(--text-main)] font-mono"
                    >
                      {SUPPORTED_CURRENCIES.map((cur) => (
                        <option key={cur.code} value={cur.code}>
                          {cur.code}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[var(--text-muted)] mb-1">
                    Paid To / Vendor
                  </label>
                  <input
                    type="text"
                    name="paidTo"
                    required
                    defaultValue={editingExpense?.paidTo || 'Corning Parts Distributor'}
                    className="w-full px-3 py-2 rounded-lg bg-[var(--bg-input)] border border-[var(--border-main)] text-[var(--text-main)]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[var(--text-muted)] mb-1">
                    Charged To (Project / Dept)
                  </label>
                  <input
                    type="text"
                    name="chargedTo"
                    required
                    defaultValue={editingExpense?.chargedTo || 'Warehouse Depot Operations'}
                    className="w-full px-3 py-2 rounded-lg bg-[var(--bg-input)] border border-[var(--border-main)] text-[var(--text-main)]"
                  />
                </div>
              </div>

              {activeFinanceType === 'maintenance' ? (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-[var(--text-muted)] mb-1">
                      Date of Settlement
                    </label>
                    <input
                      type="date"
                      name="date"
                      defaultValue={editingExpense?.date || new Date().toISOString().split('T')[0]}
                      className="w-full px-3 py-2 rounded-lg bg-[var(--bg-input)] border border-[var(--border-main)] text-[var(--text-main)]"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-[var(--text-muted)] mb-1">
                      Payment Method
                    </label>
                    <select
                      name="paymentMethod"
                      defaultValue={editingExpense?.paymentMethod || 'Bank Transfer'}
                      className="w-full px-3 py-2 rounded-lg bg-[var(--bg-input)] border border-[var(--border-main)] text-[var(--text-main)]"
                    >
                      <option value="Cash">Cash</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="Company Card">Company Card</option>
                    </select>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-[var(--text-muted)] mb-1">
                      Billing Cycle
                    </label>
                    <select
                      name="billingCycle"
                      defaultValue={editingExpense?.billingCycle || 'Monthly'}
                      className="w-full px-3 py-2 rounded-lg bg-[var(--bg-input)] border border-[var(--border-main)] text-[var(--text-main)]"
                    >
                      <option value="Monthly">Monthly</option>
                      <option value="Quarterly">Quarterly</option>
                      <option value="Annual">Annual</option>
                      <option value="One-time">One-time</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-[var(--text-muted)] mb-1">
                      Due Date
                    </label>
                    <input
                      type="date"
                      name="dueDate"
                      defaultValue={editingExpense?.dueDate || new Date().toISOString().split('T')[0]}
                      className="w-full px-3 py-2 rounded-lg bg-[var(--bg-input)] border border-[var(--border-main)] text-[var(--text-main)]"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-[var(--text-muted)] mb-1">
                      Status
                    </label>
                    <select
                      name="paymentStatus"
                      defaultValue={editingExpense?.paymentStatus || 'Paid'}
                      className="w-full px-3 py-2 rounded-lg bg-[var(--bg-input)] border border-[var(--border-main)] text-[var(--text-main)]"
                    >
                      <option value="Paid">Paid</option>
                      <option value="Pending">Pending</option>
                      <option value="Overdue">Overdue</option>
                    </select>
                  </div>
                </div>
              )}

              <div>
                <label className="block font-semibold text-[var(--text-muted)] mb-1">
                  Description / Invoice Reference
                </label>
                <textarea
                  name="description"
                  rows={2}
                  defaultValue={editingExpense?.description || ''}
                  placeholder="e.g. Invoice #INV-9920 - Annual calibration for Fujikura 90S fusion splicer"
                  className="w-full px-3 py-2 rounded-lg bg-[var(--bg-input)] border border-[var(--border-main)] text-[var(--text-main)]"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsExpenseModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] text-[var(--text-main)] font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-bold transition shadow"
                >
                  Save Expense Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Expense Deletion (Maintenance & Ongoing) */}
      <ConfirmDeleteModal
        isOpen={!!expenseToDelete}
        title={`Delete ${expenseToDelete?.type === 'Ongoing' ? 'Ongoing Commitment' : 'Maintenance Expense'}`}
        itemName={expenseToDelete ? `${expenseToDelete.title} - ${formatCurrency(expenseToDelete.amount, homeCurrency, { includeCode: true })}` : ''}
        entityName={expenseToDelete ? `${expenseToDelete.title} - ${formatCurrency(expenseToDelete.amount, homeCurrency, { includeCode: true })}` : ''}
        itemType="expense voucher"
        entityType="expense record"
        warningMessage="This expense entry and its payment status records will be permanently removed from company accounts and cost analytics."
        onConfirm={handleConfirmDeleteExpense}
        onClose={() => setExpenseToDelete(null)}
        onCancel={() => setExpenseToDelete(null)}
        isDeleting={isDeletingExpense}
        isLoading={isDeletingExpense}
      />
    </div>
  );
};
