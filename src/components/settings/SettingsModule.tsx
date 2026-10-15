import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { THEMES } from '../../styles/themes';
import { SUPPORTED_CURRENCIES, DEFAULT_EXCHANGE_RATES } from '../../services/currency';
import { storage, INITIAL_COMPANY_CONFIG } from '../../services/storage';
import { ThemeId } from '../../types';
import { CustomThemeStudio } from './CustomThemeStudio';
import { SoftwareLogoStudio } from './SoftwareLogoStudio';
import { PortablePackageService } from '../../services/portablePackageService';
import { PWAStatusCard } from '../pwa/PWAStatusCard';
import {
  Settings,
  Palette,
  DollarSign,
  Printer,
  Database,
  Download,
  Upload,
  RefreshCw,
  Check,
  AlertTriangle,
  FileText,
  Terminal,
  Shield,
  Save,
  Sliders,
  Sparkles,
  FileSpreadsheet,
  FileCode,
  HardDrive,
  RotateCcw,
  Layers,
  Globe,
  FolderDown,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  Image as ImageIcon,
  Trash2,
  Monitor,
  FolderArchive,
  Cpu,
  ShieldCheck,
  Archive,
  Package,
  X,
  Network,
  Server,
  Usb,
  FolderSync,
  Unlink,
  ArrowRight,
} from 'lucide-react';
import { NetworkStorageModal } from './NetworkStorageModal';
import { DataImportModal } from './DataImportModal';
import { ExternalSyncDirectorySection } from './ExternalSyncDirectorySection';
import { networkStorageService, NetworkStorageState } from '../../services/networkStorageService';

export const SettingsModule: React.FC = () => {
  const {
    theme,
    setTheme,
    subTab,
    setSubTab,
    homeCurrency,
    setHomeCurrency,
    exchangeRates,
    setExchangeRates,
    letterheadConfig,
    setLetterheadConfig,
    showToast,
    isDevCEO,
    triggerDataRefresh,
    currentUser,
    resetOptionsAndSystemConfiguration,
    resetAllDatabaseToFactory,
    eraseAllWorkData,
    softwareName,
    setSoftwareName,
    resetSoftwareName,
  } = useApp();

  const [activeSettingsTab, setActiveSettingsTab] = useState<
    'software-name' | 'general' | 'logo' | 'custom-colors' | 'currencies' | 'letterhead' | 'storage' | 'backup'
  >('general');

  // Software name local editor state
  const [editSoftwareName, setEditSoftwareName] = useState(softwareName);

  useEffect(() => {
    setEditSoftwareName(softwareName);
  }, [softwareName]);

  const safeSoftwareName = (softwareName || 'TeleNest').replace(/[^a-zA-Z0-9_-]/g, '_');

  // Network Storage & Data Import States
  const [isNetworkStorageModalOpen, setIsNetworkStorageModalOpen] = useState(false);
  const [isDataImportModalOpen, setIsDataImportModalOpen] = useState(false);
  const [networkState, setNetworkState] = useState<NetworkStorageState>(() => networkStorageService.getState());

  useEffect(() => {
    const unsub = networkStorageService.subscribe((s) => setNetworkState(s));
    return () => unsub();
  }, []);

  useEffect(() => {
    if (subTab === 'software-name') {
      setActiveSettingsTab('software-name');
    } else if (subTab === 'custom-colors' || subTab === 'theme-studio') {
      setActiveSettingsTab('custom-colors');
    } else if (subTab === 'logo' || subTab === 'software-logo') {
      setActiveSettingsTab('logo');
    } else if (subTab === 'storage' || subTab === 'network-storage') {
      setActiveSettingsTab('storage');
    } else if (
      subTab === 'general' ||
      subTab === 'currencies' ||
      subTab === 'letterhead' ||
      subTab === 'backup'
    ) {
      setActiveSettingsTab(subTab as any);
    }
  }, [subTab]);

  // Letterhead local form
  const [localLetterhead, setLocalLetterhead] = useState(letterheadConfig);

  // Exchange rates local form
  const [localRates, setLocalRates] = useState(exchangeRates);

  // Synchronize local states when context updates (e.g. after reset)
  useEffect(() => {
    setLocalLetterhead(letterheadConfig);
  }, [letterheadConfig]);

  useEffect(() => {
    setLocalRates(exchangeRates);
  }, [exchangeRates]);

  // Modals
  const [isResetOptionsModalOpen, setIsResetOptionsModalOpen] = useState(false);
  const [isFactoryResetModalOpen, setIsFactoryResetModalOpen] = useState(false);
  const [isEraseDataModalOpen, setIsEraseDataModalOpen] = useState(false);
  const [isExportSoftwareDataModalOpen, setIsExportSoftwareDataModalOpen] = useState(false);
  const [eraseConfirmText, setEraseConfirmText] = useState('');
  const [isErasing, setIsErasing] = useState(false);

  // Export progress states
  const [exportingType, setExportingType] = useState<string | null>(null);
  const [exportProgress, setExportProgress] = useState<string | null>(null);

  // Helper download blob
  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getFileDate = () => new Date().toISOString().split('T')[0];

  // Handle Save Letterhead
  const handleSaveLetterhead = (e: React.FormEvent) => {
    e.preventDefault();
    setLetterheadConfig(localLetterhead);
    showToast('Company letterhead branding template updated.', 'success');
  };

  // Handle Save Rates
  const handleSaveRates = (e: React.FormEvent) => {
    e.preventDefault();
    setExchangeRates(localRates);
    showToast('Exchange rate table updated.', 'success');
  };

  // Software Name Handlers
  const handleSaveSoftwareName = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = editSoftwareName.trim();
    if (!clean) {
      showToast('Software Name cannot be blank.', 'error');
      return;
    }
    setSoftwareName(clean);
  };

  const handleResetSoftwareNameToDefault = () => {
    resetSoftwareName();
    setEditSoftwareName('TeleNest');
  };

  // Reset Individual Subsections
  const handleResetThemeToDefault = () => {
    setTheme('theme-obsidian');
    showToast('Theme reset to Obsidian Dark.', 'info');
  };

  const handleResetRatesToDefault = () => {
    setLocalRates(DEFAULT_EXCHANGE_RATES);
    setExchangeRates(DEFAULT_EXCHANGE_RATES);
    showToast('Exchange rates reset to standard baseline rates.', 'info');
  };

  const handleResetLetterheadToDefault = () => {
    setLocalLetterhead(INITIAL_COMPANY_CONFIG);
    setLetterheadConfig(INITIAL_COMPANY_CONFIG);
    showToast('Company letterhead reset to master template.', 'info');
  };

  // Execute Options & System Configuration Reset
  const handleConfirmResetOptionsAndConfig = () => {
    resetOptionsAndSystemConfiguration();
    setEditSoftwareName('TeleNest');
    setLocalLetterhead(INITIAL_COMPANY_CONFIG);
    setLocalRates(DEFAULT_EXCHANGE_RATES);
    setIsResetOptionsModalOpen(false);
  };

  // Execute Factory Seed Reset
  const handleConfirmFactoryReset = () => {
    if (!isDevCEO) {
      showToast('Only Developer/CEO can reset the database to factory seed state.', 'error');
      return;
    }
    resetAllDatabaseToFactory();
    setEditSoftwareName('TeleNest');
    setLocalLetterhead(INITIAL_COMPANY_CONFIG);
    setLocalRates(DEFAULT_EXCHANGE_RATES);
    setIsFactoryResetModalOpen(false);
  };

  // Execute Erase Operational Work Data (Preserves settings, users & config)
  const handleConfirmEraseData = async () => {
    setIsErasing(true);
    try {
      eraseAllWorkData();
      setIsEraseDataModalOpen(false);
      setEraseConfirmText('');
    } catch (err: any) {
      showToast(`Failed to erase data: ${err?.message || err}`, 'error');
    } finally {
      setIsErasing(false);
    }
  };

  // --- REPAIRED SOFTWARE EXPORT OPTIONS ---

  // 1. Complete Enterprise Database Backup (.JSON)
  const handleExportJson = () => {
    setExportingType('json');
    try {
      const backupJson = storage.exportFullBackup();
      const blob = new Blob([backupJson], { type: 'application/json' });
      downloadBlob(blob, `${safeSoftwareName}_Enterprise_Database_Master_${getFileDate()}.json`);
      showToast('Complete Enterprise JSON backup file downloaded.', 'success');
    } catch (err: any) {
      showToast('Failed to export JSON backup.', 'error');
    } finally {
      setExportingType(null);
    }
  };

  // 3. Executive 5-Sheet Excel Workbook (.XLSX)
  const handleExportExcel = () => {
    setExportingType('excel');
    try {
      const snapshotStr = storage.exportFullBackup();
      const snapshot = JSON.parse(snapshotStr);
      const buffer = PortablePackageService.generateExcelWorkbook(snapshot);
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      downloadBlob(blob, `${safeSoftwareName}_Executive_Inventory_Workbook_${getFileDate()}.xlsx`);
      showToast('Executive 5-Sheet Excel Workbook downloaded.', 'success');
    } catch (err: any) {
      showToast('Failed to generate Excel workbook.', 'error');
    } finally {
      setExportingType(null);
    }
  };

  // 4. Daily Work Field Operations & Technician Log (.JSON)
  const handleExportDailyWork = () => {
    setExportingType('dailywork');
    try {
      const snapshotStr = storage.exportFullBackup();
      const snapshot = JSON.parse(snapshotStr);
      const dwJson = PortablePackageService.generateDailyWorkReportJson(snapshot);
      const blob = new Blob([dwJson], { type: 'application/json' });
      downloadBlob(blob, `${safeSoftwareName}_DailyWork_Report_${getFileDate()}.json`);
      showToast('Field Operations & Splicing Daily Work Report downloaded.', 'success');
    } catch (err: any) {
      showToast('Failed to export Daily Work report.', 'error');
    } finally {
      setExportingType(null);
    }
  };

  // 5. Fleet Logistics & Cash Expenses (.CSV)
  const handleExportCsv = () => {
    setExportingType('csv');
    try {
      const snapshotStr = storage.exportFullBackup();
      const snapshot = JSON.parse(snapshotStr);
      const csvStr = PortablePackageService.generateFleetCashCsv(snapshot);
      const blob = new Blob([csvStr], { type: 'text/csv;charset=utf-8;' });
      downloadBlob(blob, `${safeSoftwareName}_Fleet_Cash_Expenses_${getFileDate()}.csv`);
      showToast('Fleet Fuel & Logistics Expenses CSV downloaded.', 'success');
    } catch (err: any) {
      showToast('Failed to export CSV report.', 'error');
    } finally {
      setExportingType(null);
    }
  };

  // 6. Relational Database Schema & Data Dump (.SQL)
  const handleExportSql = () => {
    setExportingType('sql');
    try {
      const snapshotStr = storage.exportFullBackup();
      const snapshot = JSON.parse(snapshotStr);
      const sqlStr = PortablePackageService.generateSchemaDumpSql(snapshot);
      const blob = new Blob([sqlStr], { type: 'text/plain;charset=utf-8;' });
      downloadBlob(blob, `${safeSoftwareName}_Database_Schema_Dump_${getFileDate()}.sql`);
      showToast('ANSI Relational SQL Schema & Data Dump downloaded.', 'success');
    } catch (err: any) {
      showToast('Failed to generate SQL dump.', 'error');
    } finally {
      setExportingType(null);
    }
  };

  // 7. Single-File Self-Contained Offline Web App (.HTML) - Always export current and latest version
  const handleExportSingleHtml = async () => {
    setExportingType('html');
    setExportProgress('Compiling latest single-file offline application with live data...');
    try {
      const snapshotStr = storage.exportFullBackup();
      const bundle = await PortablePackageService.fetchOfflineAppBundle(true);
      const htmlStr = PortablePackageService.generateRootAppHtml(bundle, snapshotStr);
      const blob = new Blob([htmlStr], { type: 'text/html;charset=utf-8;' });
      downloadBlob(blob, `${safeSoftwareName}_Offline_Standalone_${getFileDate()}.html`);
      showToast('Single-File Self-Contained Offline Web App (latest live version) downloaded.', 'success');
    } catch (err: any) {
      showToast('Failed to generate standalone HTML app.', 'error');
    } finally {
      setExportingType(null);
      setExportProgress(null);
    }
  };

  // 8. Portable Windows Application (.ZIP & .EXE) - Always export current and latest version exactly as it is
  const handleExportPortableZip = async () => {
    setExportingType('portable-zip');
    setExportProgress('Capturing live database snapshot and compiling latest application version...');
    try {
      // Dynamic live compilation guarantees all current features, settings, UI changes, data structures, and functionality are included
      await PortablePackageService.exportFullZipPackage((step) => {
        setExportProgress(step);
      });
      showToast(`${softwareName}-Portable package (latest live version) successfully generated and downloaded.`, 'success');
    } catch (err: any) {
      showToast(`Failed to export portable package: ${err?.message || err}`, 'error');
    } finally {
      setExportingType(null);
      setExportProgress(null);
    }
  };

  const handleExportNativeExe = async () => {
    setExportingType('portable-exe');
    try {
      await PortablePackageService.downloadNativeExe();
      showToast(`${softwareName}.exe standalone executable downloaded.`, 'success');
    } catch (err: any) {
      showToast(`Failed to download ${softwareName}.exe: ${err?.message || err}`, 'error');
    } finally {
      setExportingType(null);
    }
  };

  // 9. All-in-One Software Data Master Archive (.ZIP)
  const handleExportAllSoftwareDataZip = async () => {
    setExportingType('software-data-zip');
    setExportProgress('Extracting and compiling all software data tables...');
    try {
      await PortablePackageService.exportSoftwareDataPackage((step) => {
        setExportProgress(step);
      });
      showToast('Complete Software Data Master Archive (.ZIP) downloaded successfully.', 'success');
      setIsExportSoftwareDataModalOpen(false);
    } catch (err: any) {
      showToast(`Failed to export software data package: ${err?.message || err}`, 'error');
    } finally {
      setExportingType(null);
      setExportProgress(null);
    }
  };

  // Handle Restore Backup
  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const res = storage.importFullBackup(
          content,
          currentUser || {
            id: 'sys',
            fullName: 'Operator',
            username: 'operator',
            role: 'Developer/CEO',
            email: 'admin@telenest.org',
            recoveryEmail: 'admin@telenest.org',
            passwordHash: '',
            department: 'Executive',
            avatar: '',
            securityAnswers: { q1_city: '', q2_school: '', q3_nickname: '', q4_vehicle: '' },
            isLocked: false,
            canEditInventory: true,
            canEditFinance: true,
            canEditICT: true,
            canAccessSystemSettings: true,
            themePreference: 'theme-obsidian',
            createdAt: '',
          }
        );
        if (res) {
          showToast('Database successfully restored from backup!', 'success');
          triggerDataRefresh();
        } else {
          showToast('Restore failed: Invalid backup format or manifest mismatch.', 'error');
        }
      } catch (err: any) {
        showToast(`Failed to parse file: ${err?.message || err}`, 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Portable & Network Storage Operations
  const handleSaveToNetwork = async () => {
    try {
      const res = await networkStorageService.saveToNetworkStorage();
      if (res.success) {
        showToast(res.message, 'success');
      } else {
        showToast(res.message, 'error');
      }
    } catch (err: any) {
      showToast(`Error saving to network storage: ${err?.message || err}`, 'error');
    }
  };

  const handleReadFromNetwork = async () => {
    try {
      const res = await networkStorageService.readFromNetworkStorage();
      if (res.success) {
        triggerDataRefresh();
        showToast(res.message, 'success');
      } else {
        showToast(res.message, 'error');
      }
    } catch (err: any) {
      showToast(`Error reading from network storage: ${err?.message || err}`, 'error');
    }
  };

  const handleReconnectNetwork = async () => {
    try {
      const res = await networkStorageService.reconnect();
      if (res.success) {
        showToast(res.message, 'success');
      } else {
        showToast(res.message, 'error');
      }
    } catch (err: any) {
      showToast(`Reconnection error: ${err?.message || err}`, 'error');
    }
  };

  const handleDisconnectNetwork = async () => {
    if (window.confirm('Disconnect from portable / office network storage and return to internal storage?')) {
      await networkStorageService.disconnect();
      showToast('Switched to internal database storage.', 'info');
    }
  };

  return (
    <div className="p-4 lg:p-6 space-y-6 animate-in fade-in">
      {/* Header with Quick Action Buttons */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black tracking-tight text-[var(--text-main)]">
              Options & System Configuration
            </h1>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
              Module 6 & Setup
            </span>
          </div>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            Branding, 5 luxury themes, multi-currency valuation tables, unified export center, and system configuration
          </p>
        </div>

        {/* Header Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsResetOptionsModalOpen(true)}
            className="px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
            title="Safely reset themes, palette, currencies, letterhead, and autosave back to defaults"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Options & Config</span>
          </button>
          <button
            onClick={() => {
              setActiveSettingsTab('backup');
              setSubTab('backup');
              setIsExportSoftwareDataModalOpen(true);
            }}
            className="px-3.5 py-1.5 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
            id="btn-header-export-software-data"
            title="Open Software Data Export Center and download records"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Software Data</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex rounded-lg bg-[var(--bg-card)] p-1 border border-[var(--border-main)] text-xs font-bold overflow-x-auto">
        <button
          onClick={() => {
            setActiveSettingsTab('software-name');
            setSubTab('software-name');
          }}
          className={`px-3 py-1.5 rounded-md transition whitespace-nowrap flex items-center gap-1.5 ${
            activeSettingsTab === 'software-name' ? 'bg-[var(--accent)] text-white shadow-xs' : 'text-[var(--text-muted)]'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Software Name</span>
        </button>
        <button
          onClick={() => {
            setActiveSettingsTab('general');
            setSubTab('general');
          }}
          className={`px-3 py-1.5 rounded-md transition whitespace-nowrap ${
            activeSettingsTab === 'general' ? 'bg-[var(--accent)] text-white shadow-xs' : 'text-[var(--text-muted)]'
          }`}
        >
          Themes & Visuals
        </button>
        <button
          onClick={() => {
            setActiveSettingsTab('logo');
            setSubTab('logo');
          }}
          className={`px-3 py-1.5 rounded-md transition whitespace-nowrap flex items-center gap-1.5 ${
            activeSettingsTab === 'logo' ? 'bg-[var(--accent)] text-white shadow-xs' : 'text-[var(--text-muted)]'
          }`}
        >
          <ImageIcon className="w-3.5 h-3.5" />
          <span>Software Logo</span>
        </button>
        <button
          onClick={() => {
            setActiveSettingsTab('custom-colors');
            setSubTab('custom-colors');
          }}
          className={`px-3 py-1.5 rounded-md transition whitespace-nowrap flex items-center gap-1.5 ${
            activeSettingsTab === 'custom-colors' ? 'bg-[var(--accent)] text-white shadow-xs' : 'text-[var(--text-muted)]'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Manual Color Studio</span>
          {theme === 'theme-custom' && (
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          )}
        </button>
        <button
          onClick={() => {
            setActiveSettingsTab('currencies');
            setSubTab('currencies');
          }}
          className={`px-3 py-1.5 rounded-md transition whitespace-nowrap ${
            activeSettingsTab === 'currencies' ? 'bg-[var(--accent)] text-white shadow-xs' : 'text-[var(--text-muted)]'
          }`}
        >
          Currencies & Rates
        </button>
        <button
          onClick={() => {
            setActiveSettingsTab('letterhead');
            setSubTab('letterhead');
          }}
          className={`px-3 py-1.5 rounded-md transition whitespace-nowrap ${
            activeSettingsTab === 'letterhead' ? 'bg-[var(--accent)] text-white shadow-xs' : 'text-[var(--text-muted)]'
          }`}
        >
          Letterhead Settings
        </button>
        <button
          onClick={() => {
            setActiveSettingsTab('storage');
            setSubTab('storage');
          }}
          className={`px-3 py-1.5 rounded-md transition whitespace-nowrap flex items-center gap-1.5 ${
            activeSettingsTab === 'storage' ? 'bg-[var(--accent)] text-white shadow-xs' : 'text-[var(--text-muted)]'
          }`}
        >
          <Network className="w-3.5 h-3.5" />
          <span>Portable &amp; Network Storage</span>
          {networkState.isActive && (
            <span
              className={`w-2 h-2 rounded-full ${
                networkState.status === 'connected' ? 'bg-emerald-400' : 'bg-rose-400 animate-pulse'
              }`}
            />
          )}
        </button>
        <button
          onClick={() => {
            setActiveSettingsTab('backup');
            setSubTab('backup');
          }}
          className={`px-3 py-1.5 rounded-md transition whitespace-nowrap flex items-center gap-1.5 ${
            activeSettingsTab === 'backup' ? 'bg-[var(--accent)] text-white shadow-xs' : 'text-[var(--text-muted)]'
          }`}
        >
          <FolderDown className="w-3.5 h-3.5" />
          <span>Database, Exports & Reset</span>
        </button>
      </div>

      {/* Software Name Section Component */}
      {(() => null)()}

      {/* Software Name Dedicated Tab */}
      {activeSettingsTab === 'software-name' && (
        <div className="space-y-6">
          <div className="p-5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-main)] shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-[var(--text-main)]">
                      Software Name & Global Brand Identity
                    </h2>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold">
                      {softwareName}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">
                    Change the global software name. It automatically updates everywhere: browser title, header, login screen, dashboard, menus, pages, settings, reports, exports, and notifications.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleResetSoftwareNameToDefault}
                className="text-xs px-2.5 py-1.5 rounded-lg bg-[var(--bg-surface)] hover:bg-[var(--bg-hover)] border border-[var(--border-main)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
                title="Reset to default software name (TeleNest)"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset to Default</span>
              </button>
            </div>

            {/* Input Form */}
            <form onSubmit={handleSaveSoftwareName} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1.5">
                  Configure Software Name
                </label>
                <div className="flex flex-col sm:flex-row gap-2.5">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={editSoftwareName}
                      onChange={(e) => setEditSoftwareName(e.target.value)}
                      placeholder="e.g. TeleNest ERP, Nexus Logistics, Apex ICT..."
                      className="w-full px-3.5 py-2.5 rounded-lg bg-[var(--bg-input)] border border-[var(--border-main)] focus:border-[var(--accent)] text-[var(--text-main)] font-bold text-sm tracking-tight outline-none transition"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-[var(--text-dim)]">
                      {editSoftwareName.length} chars
                    </span>
                  </div>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm shrink-0 cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save & Apply Everywhere</span>
                  </button>
                </div>
              </div>

              {/* Quick Presets */}
              <div>
                <div className="text-[11px] font-semibold text-[var(--text-dim)] mb-1.5 flex items-center gap-1.5">
                  <span>Quick Suggestions / Industry Presets:</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'TeleNest',
                    'TeleNest ERP',
                    'Nexus Telecom',
                    'OmniWarehouse',
                    'Apex ICT Operations',
                    'Prime Logistics Hub',
                  ].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => {
                        setEditSoftwareName(preset);
                        setSoftwareName(preset);
                      }}
                      className={`text-xs px-2.5 py-1 rounded-md border transition cursor-pointer ${
                        softwareName === preset
                          ? 'bg-[var(--accent)]/15 border-[var(--accent)] text-[var(--accent)] font-bold'
                          : 'bg-[var(--bg-surface)] hover:bg-[var(--bg-hover)] border-[var(--border-main)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Real-Time Live Multi-Location Preview */}
              <div className="pt-3 border-t border-[var(--border-main)]">
                <div className="text-xs font-bold text-[var(--text-main)] mb-2 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Live Real-Time Surface Preview</span>
                  <span className="text-[10px] text-[var(--text-dim)] font-normal ml-1">
                    (Previewing as "{editSoftwareName.trim() || softwareName}")
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs">
                  {/* 1. Header Navbar Preview */}
                  <div className="p-3 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-main)] space-y-1.5">
                    <div className="text-[10px] uppercase font-bold tracking-wider text-[var(--text-dim)]">
                      1. Top Header Navbar
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <div className="w-6 h-6 rounded bg-[var(--accent)] flex items-center justify-center text-white text-[10px] font-bold">
                        {(editSoftwareName.trim() || softwareName).charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <div className="font-extrabold text-xs text-[var(--text-main)] truncate">
                          {editSoftwareName.trim() || softwareName}
                        </div>
                        <div className="text-[9px] text-[var(--text-dim)]">ICT OS</div>
                      </div>
                    </div>
                  </div>

                  {/* 2. Browser Tab Title Preview */}
                  <div className="p-3 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-main)] space-y-1.5">
                    <div className="text-[10px] uppercase font-bold tracking-wider text-[var(--text-dim)]">
                      2. Browser Tab Title
                    </div>
                    <div className="flex items-center gap-1.5 p-1 rounded bg-[var(--bg-card)] border border-[var(--border-light)] text-[11px] truncate">
                      <Globe className="w-3 h-3 text-blue-400 shrink-0" />
                      <span className="truncate font-medium text-[var(--text-main)]">
                        {editSoftwareName.trim() || softwareName} - Warehouse...
                      </span>
                    </div>
                  </div>

                  {/* 3. Login Gateway Preview */}
                  <div className="p-3 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-main)] space-y-1.5">
                    <div className="text-[10px] uppercase font-bold tracking-wider text-[var(--text-dim)]">
                      3. Login Security Gateway
                    </div>
                    <div className="flex items-center gap-2 pt-1 text-[11px]">
                      <Shield className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" />
                      <span className="font-bold text-[var(--text-main)] truncate">
                        {editSoftwareName.trim() || softwareName} Access Gateway
                      </span>
                    </div>
                  </div>

                  {/* 4. Export & Reports Preview */}
                  <div className="p-3 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-main)] space-y-1.5">
                    <div className="text-[10px] uppercase font-bold tracking-wider text-[var(--text-dim)]">
                      4. Reports &amp; Exports
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] font-mono text-[var(--accent)] pt-1 truncate">
                      <FileSpreadsheet className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">
                        {(editSoftwareName.trim() || softwareName).replace(/[^a-zA-Z0-9_-]/g, '_')}_Inventory_Report.xlsx
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Global Propagation Confirmation Note */}
              <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
                <span>
                  Active System Identity: <strong>{softwareName}</strong>. All system modules, notifications, activity logs, and export generators immediately use this name.
                </span>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 1. Themes & Visual Styles */}
      {activeSettingsTab === 'general' && (
        <div className="space-y-6">
          {/* Software Name Setting Card (also featured in General) */}
          <div className="p-5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-main)] shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-[var(--text-main)]">
                      Software Name & Global Brand Identity
                    </h2>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold">
                      {softwareName}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">
                    Configure the global software name. It automatically updates everywhere across the entire software with zero old-name remnants.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleResetSoftwareNameToDefault}
                className="text-xs px-2.5 py-1.5 rounded-lg bg-[var(--bg-surface)] hover:bg-[var(--bg-hover)] border border-[var(--border-main)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
                title="Reset to default software name (TeleNest)"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset to Default</span>
              </button>
            </div>

            {/* Input Form */}
            <form onSubmit={handleSaveSoftwareName} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1.5">
                  Change Software Name
                </label>
                <div className="flex flex-col sm:flex-row gap-2.5">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={editSoftwareName}
                      onChange={(e) => setEditSoftwareName(e.target.value)}
                      placeholder="e.g. TeleNest ERP, Nexus Logistics, Apex ICT..."
                      className="w-full px-3.5 py-2.5 rounded-lg bg-[var(--bg-input)] border border-[var(--border-main)] focus:border-[var(--accent)] text-[var(--text-main)] font-bold text-sm tracking-tight outline-none transition"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-[var(--text-dim)]">
                      {editSoftwareName.length} chars
                    </span>
                  </div>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm shrink-0 cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save & Apply Everywhere</span>
                  </button>
                </div>
              </div>

              {/* Quick Presets */}
              <div>
                <div className="text-[11px] font-semibold text-[var(--text-dim)] mb-1.5 flex items-center gap-1.5">
                  <span>Quick Suggestions:</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'TeleNest',
                    'TeleNest ERP',
                    'Nexus Telecom',
                    'OmniWarehouse',
                    'Apex ICT Operations',
                  ].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => {
                        setEditSoftwareName(preset);
                        setSoftwareName(preset);
                      }}
                      className={`text-xs px-2.5 py-1 rounded-md border transition cursor-pointer ${
                        softwareName === preset
                          ? 'bg-[var(--accent)]/15 border-[var(--accent)] text-[var(--accent)] font-bold'
                          : 'bg-[var(--bg-surface)] hover:bg-[var(--bg-hover)] border-[var(--border-main)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
            </form>
          </div>

          <div className="p-5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-main)] shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2">
                <Palette className="w-5 h-5 text-blue-400" />
                <h2 className="text-base font-bold text-[var(--text-main)]">
                  Preset Visual Themes & High-Contrast Palettes
                </h2>
              </div>
              <button
                onClick={handleResetThemeToDefault}
                className="text-xs px-2.5 py-1 rounded bg-[var(--bg-surface)] hover:bg-[var(--bg-hover)] border border-[var(--border-main)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition flex items-center gap-1.5 self-start sm:self-auto"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Theme to Default</span>
              </button>
            </div>
            <p className="text-xs text-[var(--text-muted)] mb-5">
              Select one of the 5 certified enterprise themes designed for warehouse control rooms, outdoor field laptops, and high-luminosity displays.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {THEMES.map((th) => (
                <div
                  key={th.id}
                  onClick={() => setTheme(th.id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer relative overflow-hidden group ${
                    theme === th.id
                      ? 'border-blue-500 shadow-md bg-[var(--bg-surface)]'
                      : 'border-[var(--border-main)] hover:border-blue-500/40 bg-[var(--bg-surface)]/60'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-sm text-[var(--text-main)] flex items-center gap-2">
                        {th.name}
                        {theme === th.id && (
                          <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
                        )}
                      </h3>
                      <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                        {th.description}
                      </p>
                    </div>
                    {theme === th.id && (
                      <div className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center shrink-0">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </div>

                  {/* Theme Palette Swatch Preview */}
                  <div
                    className="h-16 rounded-lg border border-white/10 p-2 flex flex-col justify-between"
                    style={{ backgroundColor: th.previewBg }}
                  >
                    <div className="flex items-center justify-between">
                      <div
                        className="px-2 py-0.5 rounded text-[10px] font-mono font-bold"
                        style={{
                          backgroundColor: th.previewCard,
                          color: th.previewText,
                          borderColor: th.accentColor,
                        }}
                      >
                        Sample UI Element
                      </div>
                      <div
                        className="w-3.5 h-3.5 rounded-full"
                        style={{ backgroundColor: th.accentColor }}
                      />
                    </div>
                    <div className="flex gap-1.5">
                      <div
                        className="h-2 w-8 rounded-full"
                        style={{ backgroundColor: th.accentColor }}
                      />
                      <div
                        className="h-2 w-14 rounded-full opacity-40"
                        style={{ backgroundColor: th.previewText }}
                      />
                      <div
                        className="h-2 w-6 rounded-full opacity-20"
                        style={{ backgroundColor: th.previewText }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Manual Color Studio Banner */}
            <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-blue-950/30 via-purple-950/20 to-transparent border border-blue-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-[var(--text-main)]">
                      Want Pixel-Level Color Control?
                    </h3>
                    {theme === 'theme-custom' && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                        Custom Active
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                    Customize every surface, border, background, input box, text contrast, and interactive brand accent.
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setActiveSettingsTab('custom-colors');
                  setSubTab('custom-colors');
                }}
                className="px-4 py-2 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-bold shrink-0 shadow-sm transition flex items-center gap-1.5 self-start sm:self-auto"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Launch Manual Color Studio</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Software Logo Studio Tab */}
      {activeSettingsTab === 'logo' && <SoftwareLogoStudio />}

      {/* Manual Color Studio Tab */}
      {activeSettingsTab === 'custom-colors' && <CustomThemeStudio />}

      {/* 2. Currencies & Exchange Rates */}
      {activeSettingsTab === 'currencies' && (
        <div className="space-y-6">
          <div className="p-5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-main)] shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-400" />
                <h2 className="text-base font-bold text-[var(--text-main)]">
                  Multi-Currency Engine & Exchange Rates
                </h2>
              </div>
              <button
                type="button"
                onClick={handleResetRatesToDefault}
                className="text-xs px-2.5 py-1 rounded bg-[var(--bg-surface)] hover:bg-[var(--bg-hover)] border border-[var(--border-main)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition flex items-center gap-1.5 self-start sm:self-auto"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Rates to Standard</span>
              </button>
            </div>
            <p className="text-xs text-[var(--text-muted)] mb-5">
              Define your primary enterprise valuation currency and configure custom exchange rates relative to USD ($1.00 base).
            </p>

            <form onSubmit={handleSaveRates} className="space-y-5 text-xs">
              <div>
                <label className="block font-semibold text-[var(--text-muted)] mb-1">
                  Primary Enterprise Home Currency
                </label>
                <select
                  value={homeCurrency}
                  onChange={(e) => setHomeCurrency(e.target.value)}
                  className="w-full max-w-sm px-3 py-2 rounded-lg bg-[var(--bg-input)] border border-[var(--border-main)] text-[var(--text-main)] font-semibold"
                >
                  {SUPPORTED_CURRENCIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.code} - {c.name} ({c.symbol})
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-[var(--text-dim)] mt-1">
                  All inventory asset valuations, ongoing burn-rates, and financial dashboards will automatically convert into this home currency.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-xs text-[var(--text-main)] mb-3">
                  Manual Exchange Rate Matrix (Units per 1.00 USD)
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {Object.keys(localRates).map((cur) => (
                    <div
                      key={cur}
                      className="p-3 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-main)]"
                    >
                      <label className="block text-[11px] font-bold text-blue-400 mb-1">
                        1 USD = {cur}
                      </label>
                      <input
                        type="number"
                        step="0.0001"
                        value={localRates[cur]}
                        onChange={(e) =>
                          setLocalRates({
                            ...localRates,
                            [cur]: parseFloat(e.target.value) || 1,
                          })
                        }
                        className="w-full px-2.5 py-1.5 rounded bg-[var(--bg-input)] border border-[var(--border-main)] text-[var(--text-main)] font-mono font-semibold text-xs"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={handleResetRatesToDefault}
                  className="px-3 py-2 rounded-lg bg-[var(--bg-surface)] hover:bg-[var(--bg-hover)] border border-[var(--border-main)] text-[var(--text-muted)] font-bold transition flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Rates</span>
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-bold transition shadow"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Exchange Rates</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Company Letterhead Configuration */}
      {activeSettingsTab === 'letterhead' && (
        <div className="p-5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-main)] shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
            <div className="flex items-center gap-2">
              <Printer className="w-5 h-5 text-purple-400" />
              <h2 className="text-base font-bold text-[var(--text-main)]">
                Corporate Letterhead Template Designer
              </h2>
            </div>
            <button
              type="button"
              onClick={handleResetLetterheadToDefault}
              className="text-xs px-2.5 py-1 rounded bg-[var(--bg-surface)] hover:bg-[var(--bg-hover)] border border-[var(--border-main)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition flex items-center gap-1.5 self-start sm:self-auto"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset to Master Template</span>
            </button>
          </div>
          <p className="text-xs text-[var(--text-muted)] mb-5">
            Configure the formal branding block applied to every generated PDF, Excel sheet, and print-friendly export across all modules.
          </p>

          {/* Software Logo Quick Banner in Letterhead */}
          <div className="mb-5 p-3.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-main)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20 flex items-center justify-center overflow-hidden shrink-0">
                {letterheadConfig?.logoUrl ? (
                  <img
                    src={letterheadConfig.logoUrl}
                    alt="Current Logo"
                    className="w-full h-full object-contain p-0.5"
                  />
                ) : (
                  <ImageIcon className="w-5 h-5 text-[var(--accent)]" />
                )}
              </div>
              <div>
                <div className="text-xs font-bold text-[var(--text-main)] flex items-center gap-1.5">
                  <span>Current Software Logo</span>
                  {letterheadConfig?.logoUrl ? (
                    <span className="text-[10px] px-1.5 py-0.2 rounded font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      Custom Active
                    </span>
                  ) : (
                    <span className="text-[10px] px-1.5 py-0.2 rounded font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      TeleNest Default
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-[var(--text-muted)]">
                  {letterheadConfig?.logoUrl
                    ? 'Applied to header navbar, dashboard and letterheads.'
                    : 'Upload your corporate logo from PC or choose from online presets.'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setActiveSettingsTab('logo');
                setSubTab('logo');
              }}
              className="text-xs px-3 py-1.5 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-bold transition flex items-center gap-1.5 shrink-0 self-start sm:self-auto cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Change Logo (PC / Online)</span>
            </button>
          </div>

          <form onSubmit={handleSaveLetterhead} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-[var(--text-muted)] mb-1">
                  Enterprise / Corporate Name
                </label>
                <input
                  type="text"
                  value={localLetterhead.companyName}
                  onChange={(e) => setLocalLetterhead({ ...localLetterhead, companyName: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-[var(--bg-input)] border border-[var(--border-main)] text-[var(--text-main)] font-bold"
                />
              </div>
              <div>
                <label className="block font-semibold text-[var(--text-muted)] mb-1">
                  Corporate Tagline
                </label>
                <input
                  type="text"
                  value={localLetterhead.tagline}
                  onChange={(e) => setLocalLetterhead({ ...localLetterhead, tagline: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-[var(--bg-input)] border border-[var(--border-main)] text-[var(--text-main)]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="block font-semibold text-[var(--text-muted)] mb-1">
                  Official Phone Contact
                </label>
                <input
                  type="text"
                  value={localLetterhead.phone}
                  onChange={(e) => setLocalLetterhead({ ...localLetterhead, phone: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-[var(--bg-input)] border border-[var(--border-main)] text-[var(--text-main)]"
                />
              </div>
              <div>
                <label className="block font-semibold text-[var(--text-muted)] mb-1">
                  Corporate Email
                </label>
                <input
                  type="text"
                  value={localLetterhead.email}
                  onChange={(e) => setLocalLetterhead({ ...localLetterhead, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-[var(--bg-input)] border border-[var(--border-main)] text-[var(--text-main)]"
                />
              </div>
              <div>
                <label className="block font-semibold text-[var(--text-muted)] mb-1">
                  Developed By / Architect
                </label>
                <input
                  type="text"
                  value={localLetterhead.developedBy}
                  onChange={(e) => setLocalLetterhead({ ...localLetterhead, developedBy: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-[var(--bg-input)] border border-[var(--border-main)] text-[var(--text-main)]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-[var(--text-muted)] mb-1">
                  License Registration Number
                </label>
                <input
                  type="text"
                  value={localLetterhead.licenseNumber}
                  onChange={(e) => setLocalLetterhead({ ...localLetterhead, licenseNumber: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-[var(--bg-input)] border border-[var(--border-main)] text-[var(--text-main)] font-mono"
                />
              </div>
              <div>
                <label className="block font-semibold text-[var(--text-muted)] mb-1">
                  Tax Registration (TRN / NTN)
                </label>
                <input
                  type="text"
                  value={localLetterhead.taxRegistration}
                  onChange={(e) => setLocalLetterhead({ ...localLetterhead, taxRegistration: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-[var(--bg-input)] border border-[var(--border-main)] text-[var(--text-main)] font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-[var(--text-muted)] mb-1">
                  Address Line 1 (Facility & Street)
                </label>
                <input
                  type="text"
                  value={localLetterhead.addressLine1}
                  onChange={(e) => setLocalLetterhead({ ...localLetterhead, addressLine1: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-[var(--bg-input)] border border-[var(--border-main)] text-[var(--text-main)]"
                />
              </div>
              <div>
                <label className="block font-semibold text-[var(--text-muted)] mb-1">
                  Address Line 2 (City, Regional Hubs)
                </label>
                <input
                  type="text"
                  value={localLetterhead.addressLine2}
                  onChange={(e) => setLocalLetterhead({ ...localLetterhead, addressLine2: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-[var(--bg-input)] border border-[var(--border-main)] text-[var(--text-main)]"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={handleResetLetterheadToDefault}
                className="px-3 py-2 rounded-lg bg-[var(--bg-surface)] hover:bg-[var(--bg-hover)] border border-[var(--border-main)] text-[var(--text-muted)] font-bold transition flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset to Template</span>
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-bold transition shadow"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Letterhead Branding</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 4. Portable Storage & Office Network Storage Control Center */}
      {activeSettingsTab === 'storage' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Main Status & Control Card */}
          <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-main)] shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border-main)] pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-500/15 text-blue-400 border border-blue-500/30">
                  <Network className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-base font-bold text-[var(--text-main)]">
                      Portable &amp; Office Network Storage
                    </h2>
                    {networkState.isActive ? (
                      networkState.status === 'connected' ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Connected &amp; Active
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30 flex items-center gap-1 animate-pulse">
                          <AlertTriangle className="w-3 h-3" />
                          Storage Disconnected
                        </span>
                      )
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[var(--bg-surface)] text-[var(--text-dim)] border border-[var(--border-main)]">
                        Internal Browser Storage
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">
                    Store and read {softwareName} application data directly from a portable storage device or office network share.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsNetworkStorageModalOpen(true)}
                  className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition shadow flex items-center gap-1.5 cursor-pointer"
                >
                  <Server className="w-3.5 h-3.5" />
                  <span>{networkState.isActive ? 'Configure Storage' : 'Select Storage Location'}</span>
                </button>
              </div>
            </div>

            {/* If Storage is Active */}
            {networkState.isActive ? (
              <div className="space-y-4">
                {networkState.status === 'disconnected' && (
                  <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="flex items-start gap-2.5">
                      <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="font-bold text-rose-100 block">
                          Network / Portable Storage Disconnected
                        </strong>
                        <span>
                          {networkState.lastErrorMessage ||
                            'The configured network path or portable device is currently inaccessible. Check cable connections, VPN, or network drive permissions.'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={handleReconnectNetwork}
                        className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition flex items-center gap-1 cursor-pointer"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Retry Connection</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Storage Spec Details Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-main)]">
                    <div className="text-[10px] text-[var(--text-dim)] uppercase font-semibold">
                      Storage Path / Alias
                    </div>
                    <div className="font-mono font-bold text-[var(--text-main)] truncate mt-1">
                      {networkState.networkPathAlias || networkState.folderName || 'Selected Location'}
                    </div>
                    <div className="text-[10px] text-[var(--text-dim)] mt-0.5">
                      Target Folder: <code className="text-blue-400 font-mono">{networkState.folderName}</code>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-main)]">
                    <div className="text-[10px] text-[var(--text-dim)] uppercase font-semibold">
                      Hardware Location Type
                    </div>
                    <div className="font-bold text-[var(--text-main)] mt-1 flex items-center gap-1.5">
                      {networkState.locationType === 'portable_usb' ? (
                        <>
                          <Usb className="w-3.5 h-3.5 text-blue-400" />
                          <span>Portable USB Drive</span>
                        </>
                      ) : (
                        <>
                          <Network className="w-3.5 h-3.5 text-blue-400" />
                          <span>Office Network Share (NAS)</span>
                        </>
                      )}
                    </div>
                    <div className="text-[10px] text-[var(--text-dim)] mt-0.5">Physical Device</div>
                  </div>

                  <div className="p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-main)]">
                    <div className="text-[10px] text-[var(--text-dim)] uppercase font-semibold">
                      Storage Exclusivity Policy
                    </div>
                    <div className="font-bold text-emerald-400 mt-1 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>{networkState.storeOnlyOnNetwork ? 'Network Only (No Local Copies)' : 'Dual Mirroring'}</span>
                    </div>
                    <div className="text-[10px] text-[var(--text-dim)] mt-0.5">
                      {networkState.storeOnlyOnNetwork
                        ? 'Zero duplicate local data stored'
                        : 'Local backup mirror enabled'}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-main)]">
                    <div className="text-[10px] text-[var(--text-dim)] uppercase font-semibold">
                      Last Write / Sync
                    </div>
                    <div className="font-mono font-bold text-[var(--text-main)] mt-1">
                      {networkState.lastWriteTimestamp
                        ? new Date(networkState.lastWriteTimestamp).toLocaleTimeString()
                        : 'Pending write'}
                    </div>
                    <div className="text-[10px] text-[var(--text-dim)] mt-0.5">
                      Auto-syncs on every change
                    </div>
                  </div>
                </div>

                {/* Direct Action Toolbar */}
                <div className="p-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-main)] flex flex-wrap items-center justify-between gap-3">
                  <div className="text-xs text-[var(--text-muted)]">
                    <strong className="text-[var(--text-main)] font-semibold block">
                      Direct Storage Operations
                    </strong>
                    <span>
                      Save or reload the master database directly from the connected drive at any time.
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSaveToNetwork}
                      className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow flex items-center gap-1.5 cursor-pointer"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Save Now to Drive</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleReadFromNetwork}
                      className="px-3.5 py-2 rounded-lg bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] border border-[var(--border-main)] text-[var(--text-main)] font-semibold text-xs transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-blue-400" />
                      <span>Reload from Drive</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleDisconnectNetwork}
                      className="px-3 py-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <Unlink className="w-3.5 h-3.5" />
                      <span>Disconnect</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* If Storage Not Active - Setup Promo */
              <div className="p-6 rounded-xl bg-gradient-to-r from-blue-950/20 via-[var(--bg-surface)] to-indigo-950/20 border border-blue-500/30 space-y-4">
                <div className="space-y-2">
                  <h3 className="text-sm font-bold text-[var(--text-main)] flex items-center gap-2">
                    <HardDrive className="w-4 h-4 text-blue-400" />
                    <span>Store Application Data Directly on Office Network / Portable Storage</span>
                  </h3>
                  <p className="text-xs text-[var(--text-muted)] leading-relaxed max-w-3xl">
                    Configure {softwareName} to save and load all operational data (inventory, movements, fiber deployments, projects, daily work, and financials) directly to a portable USB hard drive or shared office network folder (NAS / UNC Path / Mapped Drive).
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs pt-1">
                  <div className="p-3 rounded-lg bg-[var(--bg-card)] border border-[var(--border-main)] space-y-1">
                    <div className="font-bold text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Direct Network Storage</span>
                    </div>
                    <p className="text-[11px] text-[var(--text-muted)]">
                      Saves and reads directly from the selected folder. Zero duplicate data stored locally.
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-[var(--bg-card)] border border-[var(--border-main)] space-y-1">
                    <div className="font-bold text-blue-400 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Preserves Structure</span>
                    </div>
                    <p className="text-[11px] text-[var(--text-muted)]">
                      All existing database entities, relational models, and software settings remain 100% intact.
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-[var(--bg-card)] border border-[var(--border-main)] space-y-1">
                    <div className="font-bold text-amber-400 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Safe Disconnection Guard</span>
                    </div>
                    <p className="text-[11px] text-[var(--text-muted)]">
                      Instant status alerts and non-destructive fallbacks prevent data corruption if network disconnects.
                    </p>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setIsNetworkStorageModalOpen(true)}
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition shadow flex items-center gap-2 cursor-pointer"
                  >
                    <FolderSync className="w-4 h-4" />
                    <span>Select Portable / Office Network Storage Location</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* External Network & Portable Directory Synchronization Section */}
          <ExternalSyncDirectorySection showToast={showToast} />

          {/* Unified Data Import Center Launch Card */}
          <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-main)] shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Upload className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-[var(--text-main)]">
                  Data Import Option — Ingest {softwareName} Data
                </h3>
              </div>
              <p className="text-xs text-[var(--text-muted)] max-w-2xl">
                Import {softwareName} database records from any accessible source: portable storage (USB), office network storage (NAS), local storage files, or cloud URLs. Includes automatic schema validation and merge/replace options.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsDataImportModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow flex items-center gap-2 shrink-0 cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Launch Data Import Center</span>
            </button>
          </div>
        </div>
      )}

      {/* 5. Comprehensive Software Export Center, Database & System Reset */}
      {activeSettingsTab === 'backup' && (
        <div className="space-y-6">
          {/* PWA & Remote Warehouse Offline Engine Status */}
          <PWAStatusCard />

          {/* Unified Data Import Center Banner */}
          <div className="p-5 rounded-xl bg-gradient-to-r from-emerald-950/30 via-[var(--bg-card)] to-blue-950/20 border-2 border-emerald-500/40 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-[var(--text-main)]">
                      Data Import Option (Unified Import Center)
                    </h3>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      MULTI-SOURCE
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-muted)]">
                    Import {softwareName} data from portable storage (USB), office network storage, local files, or cloud URLs with pre-flight integrity verification.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsDataImportModalOpen(true)}
                className="px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow flex items-center gap-2 cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                <span>Open Data Import Center</span>
              </button>
            </div>
          </div>

          {/* Portable / Office Network Storage Direct Path Card */}
          <div className="p-5 rounded-xl bg-[var(--bg-card)] border border-blue-500/30 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <Network className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-[var(--text-main)]">
                    Office Network &amp; Portable Storage Path
                  </h4>
                  {networkState.isActive ? (
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      Mounted: {networkState.folderName}
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[var(--bg-surface)] text-[var(--text-dim)] border border-[var(--border-main)]">
                      Default Internal Storage
                    </span>
                  )}
                </div>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  {networkState.isActive
                    ? `Direct read/write active to ${networkState.networkPathAlias || networkState.folderName}. Zero duplicate local copies stored.`
                    : `Connect a portable USB drive or office network share to save and read ${softwareName} data directly from the network.`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsNetworkStorageModalOpen(true)}
                className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition shadow flex items-center gap-1.5 cursor-pointer"
              >
                <Server className="w-3.5 h-3.5" />
                <span>{networkState.isActive ? 'Manage Network Storage' : 'Select Storage Location'}</span>
              </button>
            </div>
          </div>

          {/* External Network & Portable Directory Synchronization Section */}
          <ExternalSyncDirectorySection showToast={showToast} />

          {/* SECTION A: Repaired & Unified Software Export Center */}
          <div className="p-5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-main)] shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
              <div className="flex items-center gap-2">
                <FolderDown className="w-5 h-5 text-blue-400" />
                <h2 className="text-base font-bold text-[var(--text-main)]">
                  Software Export Center (All Formats)
                </h2>
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 self-start sm:self-auto">
                Verified Formats
              </span>
            </div>
            <p className="text-xs text-[var(--text-muted)] mb-5">
              Export live database backups, relational SQL databases, executive spreadsheets, comma-separated ledgers, and operational reports.
            </p>

            {/* FEATURED: Export Software Data - Complete Master Package & Instant Downloads */}
            <div className="mb-5 p-5 rounded-xl bg-gradient-to-r from-blue-950/40 via-[var(--bg-surface)] to-emerald-950/20 border-2 border-blue-500/40 shadow-md">
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="p-2.5 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
                      <Download className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-black text-[var(--text-main)]">
                          Export Software Data
                        </h3>
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                          ALL-IN-ONE MASTER PACKAGE
                        </span>
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> VERIFIED REPOSITORY
                        </span>
                      </div>
                      <p className="text-xs text-[var(--text-muted)] leading-relaxed mt-1 max-w-3xl">
                        Generate and download your complete software data in a single unified archive (<code className="text-blue-300 font-mono">{safeSoftwareName}_Software_Data.zip</code>). Includes the Enterprise Master JSON snapshot, 5-Sheet Executive Excel workbook, Field Operations Daily Work report, Fleet Fuel &amp; Cash expenses CSV ledger, ANSI Relational SQL schema dump, and system configurations.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono text-[var(--text-muted)] pt-1">
                    <span className="bg-[var(--bg-card)] px-2.5 py-1 rounded-md border border-[var(--border-main)] flex items-center gap-1">
                      📦 <strong className="text-[var(--text-main)]">{storage.getInventory().length}</strong> Items
                    </span>
                    <span className="bg-[var(--bg-card)] px-2.5 py-1 rounded-md border border-[var(--border-main)] flex items-center gap-1">
                      🔄 <strong className="text-[var(--text-main)]">{storage.getMovements().length}</strong> Movements
                    </span>
                    <span className="bg-[var(--bg-card)] px-2.5 py-1 rounded-md border border-[var(--border-main)] flex items-center gap-1">
                      🌐 <strong className="text-[var(--text-main)]">{storage.getFTTH().length + storage.getFTTB().length + storage.getFTTM().length}</strong> Fiber Deployments
                    </span>
                    <span className="bg-[var(--bg-card)] px-2.5 py-1 rounded-md border border-[var(--border-main)] flex items-center gap-1">
                      🏗️ <strong className="text-[var(--text-main)]">{storage.getProjects().length}</strong> Projects
                    </span>
                    <span className="bg-[var(--bg-card)] px-2.5 py-1 rounded-md border border-[var(--border-main)] flex items-center gap-1">
                      💵 <strong className="text-[var(--text-main)]">{storage.getExpenses().length}</strong> Expenses
                    </span>
                    <span className="bg-[var(--bg-card)] px-2.5 py-1 rounded-md border border-[var(--border-main)] flex items-center gap-1">
                      📋 <strong className="text-[var(--text-main)]">{storage.getDailyWorks().length}</strong> Daily Works
                    </span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row lg:flex-col gap-2 shrink-0 lg:min-w-[240px]">
                  <button
                    onClick={handleExportAllSoftwareDataZip}
                    disabled={exportingType !== null}
                    className="py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs transition shadow flex items-center justify-center gap-2 cursor-pointer"
                    id="btn-export-all-software-data-zip"
                  >
                    <Archive className="w-4 h-4" />
                    <span>{exportingType === 'software-data-zip' ? 'Packaging Software Data...' : 'Export Complete Software Data (.ZIP)'}</span>
                  </button>
                  <button
                    onClick={() => setIsExportSoftwareDataModalOpen(true)}
                    className="py-2 px-3 rounded-lg bg-[var(--bg-card)] hover:bg-[var(--bg-surface)] border border-[var(--border-main)] text-[var(--text-main)] hover:text-blue-400 font-semibold text-xs transition flex items-center justify-center gap-2 cursor-pointer"
                    id="btn-open-export-software-data-modal"
                  >
                    <Sliders className="w-3.5 h-3.5 text-blue-400" />
                    <span>Choose Specific Formats</span>
                  </button>
                </div>
              </div>

              {exportingType === 'software-data-zip' && exportProgress && (
                <div className="mt-3 pt-3 border-t border-[var(--border-main)] flex items-center gap-2 text-xs text-blue-400 animate-pulse">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>{exportProgress}</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* PRIMARY EXPORT: Portable Windows Application */}
              <div className="p-5 rounded-xl bg-[var(--bg-surface)] border-2 border-blue-500/40 flex flex-col justify-between hover:border-blue-500/70 transition md:col-span-2 lg:col-span-3 shadow-md relative overflow-hidden">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 shrink-0">
                      <Monitor className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <h3 className="font-bold text-base text-[var(--text-main)]">
                          Portable Windows Application (Zero-Installation Standalone)
                        </h3>
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                          WINDOWS 11 &amp; 10 NATIVE
                        </span>
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" /> ZERO ADMIN RIGHTS
                        </span>
                      </div>
                      <p className="text-xs text-[var(--text-muted)] leading-relaxed max-w-3xl">
                        A complete self-contained portable folder structure (<code className="text-blue-300">{safeSoftwareName}-Portable/</code>) that runs instantly without installation, Google AI Studio, or developer tools. Stores all database snapshots, reports, and user profile sessions in a local <code className="text-emerald-300">Data/</code> folder using strictly relative paths. Ready to copy to USB drives or any other Windows PC.
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-[var(--text-muted)]">
                        <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-md border border-emerald-500/20 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Always Latest Live Version (Zero Cache)
                        </span>
                        <span className="inline-flex items-center gap-1 bg-[var(--bg-card)] px-2.5 py-1 rounded-md border border-[var(--border-color)]">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Pre-compiled <strong className="text-[var(--text-main)]">{safeSoftwareName}.exe</strong> included
                        </span>
                        <span className="inline-flex items-center gap-1 bg-[var(--bg-card)] px-2.5 py-1 rounded-md border border-[var(--border-color)]">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Isolated <strong className="text-[var(--text-main)]">Data/Profile</strong> local cache
                        </span>
                        <span className="inline-flex items-center gap-1 bg-[var(--bg-card)] px-2.5 py-1 rounded-md border border-[var(--border-color)]">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Auto-creates missing folders safely
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row md:flex-col gap-2 shrink-0 md:min-w-[240px]">
                    <button
                      onClick={handleExportPortableZip}
                      disabled={exportingType !== null}
                      className="py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs transition shadow flex items-center justify-center gap-2"
                    >
                      <FolderArchive className="w-4 h-4" />
                      <span>{exportingType === 'portable-zip' ? 'Packaging Portable ZIP...' : 'Download Portable ZIP Package'}</span>
                    </button>
                    <button
                      onClick={handleExportNativeExe}
                      disabled={exportingType !== null}
                      className="py-2 px-3 rounded-lg bg-[var(--bg-card)] hover:bg-[var(--bg-surface)] border border-[var(--border-color)] text-[var(--text-main)] hover:text-blue-400 font-semibold text-xs transition flex items-center justify-center gap-2"
                    >
                      <Cpu className="w-3.5 h-3.5 text-blue-400" />
                      <span>Download {safeSoftwareName}.exe Only</span>
                    </button>
                  </div>
                </div>

                {exportingType === 'portable-zip' && exportProgress && (
                  <div className="mt-3 pt-3 border-t border-[var(--border-color)] flex items-center gap-2 text-xs text-blue-400 animate-pulse">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>{exportProgress}</span>
                  </div>
                )}
              </div>

              {/* Export 1: Master JSON Backup */}
              <div className="p-4 rounded-xl bg-[var(--bg-surface)] border border-emerald-500/30 flex flex-col justify-between hover:border-emerald-500/60 transition">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                      <Database className="w-5 h-5" />
                    </span>
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                      JSON MASTER
                    </span>
                  </div>
                  <h3 className="font-bold text-sm text-[var(--text-main)]">
                    Enterprise Database Master
                  </h3>
                  <p className="text-[11px] text-[var(--text-muted)] mt-1.5 leading-relaxed">
                    Full encrypted JSON snapshot of all inventory items, stock movements, FTTH/FTTB/FTTM fiber records, expenses, projects, daily works, and audit logs.
                  </p>
                </div>
                <button
                  onClick={handleExportJson}
                  disabled={exportingType !== null}
                  className="mt-4 w-full py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs transition shadow flex items-center justify-center gap-2"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Master JSON</span>
                </button>
              </div>

              {/* Export 3: Executive Excel Workbook */}
              <div className="p-4 rounded-xl bg-[var(--bg-surface)] border border-green-500/30 flex flex-col justify-between hover:border-green-500/60 transition">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="p-2 rounded-lg bg-green-500/10 text-green-400">
                      <FileSpreadsheet className="w-5 h-5" />
                    </span>
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-green-500/20 text-green-300">
                      XLSX WORKBOOK
                    </span>
                  </div>
                  <h3 className="font-bold text-sm text-[var(--text-main)]">
                    Executive 5-Sheet Excel Report
                  </h3>
                  <p className="text-[11px] text-[var(--text-muted)] mt-1.5 leading-relaxed">
                    Professional spreadsheet containing Inventory Stock Balances, Valuation Matrix, Movements Ledger, Projects, and Financial Expense summaries.
                  </p>
                </div>
                <button
                  onClick={handleExportExcel}
                  disabled={exportingType !== null}
                  className="mt-4 w-full py-2 px-3 rounded-lg bg-green-700 hover:bg-green-600 disabled:opacity-50 text-white font-bold text-xs transition shadow flex items-center justify-center gap-2"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Excel (.XLSX)</span>
                </button>
              </div>

              {/* Export 4: Daily Work & Field Ops JSON */}
              <div className="p-4 rounded-xl bg-[var(--bg-surface)] border border-cyan-500/30 flex flex-col justify-between hover:border-cyan-500/60 transition">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
                      <Clock className="w-5 h-5" />
                    </span>
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300">
                      DAILY WORK
                    </span>
                  </div>
                  <h3 className="font-bold text-sm text-[var(--text-main)]">
                    Field Operations & Splicing Report
                  </h3>
                  <p className="text-[11px] text-[var(--text-muted)] mt-1.5 leading-relaxed">
                    Dedicated snapshot of all Daily Work logs, technicians deployed, meters installed, optical power readings, issues, and supervisor approvals.
                  </p>
                </div>
                <button
                  onClick={handleExportDailyWork}
                  disabled={exportingType !== null}
                  className="mt-4 w-full py-2 px-3 rounded-lg bg-cyan-700 hover:bg-cyan-600 disabled:opacity-50 text-white font-bold text-xs transition shadow flex items-center justify-center gap-2"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Daily Work (.JSON)</span>
                </button>
              </div>

              {/* Export 5: Fleet Cash & Expenses CSV */}
              <div className="p-4 rounded-xl bg-[var(--bg-surface)] border border-orange-500/30 flex flex-col justify-between hover:border-orange-500/60 transition">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="p-2 rounded-lg bg-orange-500/10 text-orange-400">
                      <DollarSign className="w-5 h-5" />
                    </span>
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-300">
                      CSV LEDGER
                    </span>
                  </div>
                  <h3 className="font-bold text-sm text-[var(--text-main)]">
                    Fleet Fuel & Cash Expenses
                  </h3>
                  <p className="text-[11px] text-[var(--text-muted)] mt-1.5 leading-relaxed">
                    Universal comma-separated ledger compatible with QuickBooks, SAP, and PowerBI containing vehicle fuel logs, warehouse rent, and petty cash.
                  </p>
                </div>
                <button
                  onClick={handleExportCsv}
                  disabled={exportingType !== null}
                  className="mt-4 w-full py-2 px-3 rounded-lg bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white font-bold text-xs transition shadow flex items-center justify-center gap-2"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Fleet Cash (.CSV)</span>
                </button>
              </div>

              {/* Export 6: SQL Relational Dump */}
              <div className="p-4 rounded-xl bg-[var(--bg-surface)] border border-indigo-500/30 flex flex-col justify-between hover:border-indigo-500/60 transition">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                      <FileCode className="w-5 h-5" />
                    </span>
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
                      SQL DDL/DML
                    </span>
                  </div>
                  <h3 className="font-bold text-sm text-[var(--text-main)]">
                    Relational SQL Database Dump
                  </h3>
                  <p className="text-[11px] text-[var(--text-muted)] mt-1.5 leading-relaxed">
                    Standard ANSI SQL script containing CREATE TABLE definitions and INSERT records ready to restore into PostgreSQL, MySQL, or SQL Server.
                  </p>
                </div>
                <button
                  onClick={handleExportSql}
                  disabled={exportingType !== null}
                  className="mt-4 w-full py-2 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs transition shadow flex items-center justify-center gap-2"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download SQL Dump (.SQL)</span>
                </button>
              </div>

              {/* Export 7: Single-File Offline Web App */}
              <div className="p-4 rounded-xl bg-[var(--bg-surface)] border border-purple-500/30 flex flex-col justify-between hover:border-purple-500/60 transition md:col-span-2 lg:col-span-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Globe className="w-4 h-4 text-purple-400" />
                      <h3 className="font-bold text-sm text-[var(--text-main)]">
                        Standalone Self-Contained Offline Web App (Single File .HTML)
                      </h3>
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300">
                        ZERO DEPENDENCIES
                      </span>
                    </div>
                    <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                      A single fully inlined HTML document containing the entire {softwareName} web application and your database records pre-seeded. Runs instantly on any computer, USB drive, Mac, Linux, or tablet simply by double clicking—no node, no web server required.
                    </p>
                  </div>
                  <button
                    onClick={handleExportSingleHtml}
                    disabled={exportingType !== null}
                    className="py-2 px-4 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold text-xs transition shadow flex items-center justify-center gap-2 shrink-0 self-start sm:self-auto"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Standalone App (.HTML)</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION B: Reset Options & System Configuration (Safe Reset) */}
          <div className="p-5 rounded-xl bg-[var(--bg-card)] border border-amber-500/30 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-amber-400 mb-1">
                  <RotateCcw className="w-5 h-5" />
                  <h3 className="text-base font-bold text-[var(--text-main)]">
                    Reset Options & System Configuration
                  </h3>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Safe Operation
                  </span>
                </div>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed max-w-2xl mt-1">
                  Safely restores visual theme, custom color palette studio, primary home currency (USD), exchange rate table, corporate letterhead template, and autosave parameters back to enterprise factory defaults.
                </p>
                <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-mono text-emerald-400">
                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Inventory Items Preserved
                  </span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Stock Movements Preserved
                  </span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Fiber FTTH/B/M Records Preserved
                  </span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Daily Works & Logs Preserved
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsResetOptionsModalOpen(true)}
                className="px-4 py-2.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs transition shadow flex items-center gap-2 shrink-0 self-start sm:self-auto"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Options & Configuration</span>
              </button>
            </div>
          </div>

          {/* SECTION C: Database Restore & Unified Data Import */}
          <div className="p-5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-main)] shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
              <div className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-emerald-400" />
                <h2 className="text-base font-bold text-[var(--text-main)]">
                  Restore &amp; Import Database
                </h2>
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 self-start sm:self-auto">
                Multi-Source Ingestion
              </span>
            </div>
            <p className="text-xs text-[var(--text-muted)] mb-4 leading-relaxed">
              Import or restore {softwareName} records from any source: portable storage (USB), office network storage (NAS), local backup JSON files, or cloud URLs. Includes automatic schema validation, integrity checks, and merge/replace strategies.
            </p>
            <div className="p-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-main)] flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-[var(--text-muted)]">
                <p className="font-semibold text-[var(--text-main)]">
                  Unified Data Import Center or Direct File Picker
                </p>
                <p className="text-[11px] text-[var(--text-dim)] mt-0.5">
                  Supported sources: Portable Storage, Office Network, Local Files (.json/.zip), Cloud URLs
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsDataImportModalOpen(true)}
                  className="py-2 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow flex items-center gap-2 cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Launch Unified Data Import</span>
                </button>
                <label className="py-2 px-3 rounded-lg bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] border border-[var(--border-main)] text-[var(--text-main)] font-semibold text-xs transition shadow flex items-center gap-2 cursor-pointer">
                  <Database className="w-3.5 h-3.5 text-blue-400" />
                  <span>Quick JSON File</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportBackup}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>

          {/* SECTION D: Erase Data (Permanent Operational Work Data Purge) */}
          <div className="p-5 rounded-xl bg-red-950/25 border border-red-500/40 text-xs">
            <div className="flex items-center justify-between gap-3 mb-2">
              <div className="flex items-center gap-2 font-bold text-red-400">
                <Trash2 className="w-5 h-5 text-red-400" />
                <h3 className="text-sm font-bold text-red-300">
                  Erase Data — Operational Clean Slate
                </h3>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-red-500/20 text-red-300 border border-red-500/30">
                Permanent Action
              </span>
            </div>
            <p className="text-[var(--text-muted)] leading-relaxed mb-3">
              Permanently deletes all saved operational work data from every software category and module: Warehouse Inventory & Stock Movements, FTTH / FTTB / FTTM infrastructure sites, ongoing & completed Projects, Daily Field Activities & photos, and Expense ledgers.
            </p>
            <div className="p-3 rounded-lg bg-[var(--bg-card)] border border-[var(--border-main)] mb-4 text-[11px] space-y-1">
              <div className="font-semibold text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Safely Preserved:</span>
              </div>
              <p className="text-[var(--text-muted)] pl-5">
                Software settings, themes, custom color palettes, user accounts, roles & permissions, the Developer/CEO account, exchange rates, SKU categories, and company letterhead are strictly preserved.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setEraseConfirmText('');
                setIsEraseDataModalOpen(true);
              }}
              className="px-4 py-2.5 rounded-lg bg-red-600 hover:bg-red-500 active:bg-red-700 text-white font-bold transition flex items-center gap-2 shadow-lg shadow-red-950/50 cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>Erase Data</span>
            </button>
          </div>

          {/* SECTION E: Factory Seed Reset (Complete Data Wipe) */}
          {isDevCEO && (
            <div className="p-5 rounded-xl bg-rose-950/20 border border-rose-600/30 text-xs">
              <div className="flex items-center gap-2 font-bold text-rose-400 mb-1">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="text-sm font-bold text-rose-300">
                  Developer / CEO Danger Zone: Restore Factory Seed Database
                </h3>
              </div>
              <p className="text-[var(--text-muted)] leading-relaxed mb-4">
                This will purge all custom inventory items, stock movements, expenses, and daily work records, restoring the clean factory seed dataset for {softwareName}.
              </p>
              <button
                onClick={() => setIsFactoryResetModalOpen(true)}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold transition flex items-center gap-2"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Reset Database to Factory Seed State</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: Confirm Reset Options & System Configuration */}
      {isResetOptionsModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-[var(--bg-card)] border border-[var(--border-main)] rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <RotateCcw className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[var(--text-main)]">
                  Reset Options & System Configuration?
                </h3>
                <p className="text-xs text-[var(--text-muted)]">
                  Restore enterprise default configurations
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-main)] space-y-2 text-xs">
              <p className="font-semibold text-[var(--text-main)]">The following will be reset to factory defaults:</p>
              <ul className="list-disc list-inside text-[var(--text-muted)] space-y-1">
                <li>Software Name reset to TeleNest default</li>
                <li>Visual theme set to Obsidian Dark</li>
                <li>Design studio manual color palette</li>
                <li>Primary enterprise currency set to USD ($1.00 base)</li>
                <li>Exchange rate table reset to standard conversion rates</li>
                <li>Corporate letterhead reset to default master template</li>
                <li>AutoSave interval reset to 1 minute</li>
              </ul>
              <div className="pt-2 border-t border-[var(--border-main)] text-emerald-400 font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>All your stock, movements, expenses, and logs remain untouched.</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsResetOptionsModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-[var(--bg-surface)] hover:bg-[var(--bg-hover)] border border-[var(--border-main)] text-[var(--text-muted)] font-semibold text-xs transition"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmResetOptionsAndConfig}
                className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs transition shadow flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Confirm Reset Options</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Confirm Factory Seed Database Reset */}
      {isFactoryResetModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-[var(--bg-card)] border border-rose-600/40 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-rose-300">
                  Restore Factory Seed Database?
                </h3>
                <p className="text-xs text-[var(--text-muted)]">
                  Irreversible operation: Purges all recorded items
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-rose-950/20 border border-rose-600/30 text-xs text-[var(--text-muted)] leading-relaxed space-y-2">
              <p className="text-rose-300 font-semibold">
                WARNING: This will purge all database records and replace them with the pristine initial seed dataset.
              </p>
              <p>
                We strongly recommend downloading an Enterprise Database Master (.JSON) backup before proceeding.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsFactoryResetModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-[var(--bg-surface)] hover:bg-[var(--bg-hover)] border border-[var(--border-main)] text-[var(--text-muted)] font-semibold text-xs transition"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmFactoryReset}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition shadow flex items-center gap-1.5"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Yes, Reset to Factory Seed</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Confirm Erase Operational Work Data */}
      {isEraseDataModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="w-full max-w-lg bg-[var(--bg-card)] border border-red-500/40 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3 border-b border-[var(--border-main)] pb-3">
              <div className="p-2.5 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-base font-bold text-red-400">
                  Confirmation Warning: Permanently Erase All Work Data?
                </h4>
                <p className="text-xs text-[var(--text-muted)]">
                  Irreversible operation across all software modules
                </p>
              </div>
            </div>

            <div className="text-xs text-[var(--text-muted)] space-y-2.5 leading-relaxed">
              <div className="p-3 rounded-lg bg-red-950/30 border border-red-600/30 text-red-200">
                <p className="font-bold text-red-300 mb-1">Warning: All operational work records will be permanently erased:</p>
                <ul className="list-disc list-inside space-y-1 text-[11px] text-red-200/90 pl-1">
                  <li>Warehouse inventory items and stock balance levels</li>
                  <li>All historical stock movements and ledger transactions</li>
                  <li>FTTH, FTTB, and FTTM infrastructure site records</li>
                  <li>Ongoing, testing, and completed project milestones</li>
                  <li>Daily field activities, technician work logs, and site photos</li>
                  <li>Maintenance and ongoing operational expense ledgers</li>
                </ul>
              </div>

              <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-500/30 text-emerald-300 text-[11px]">
                <p className="font-bold text-emerald-400 mb-0.5">The following will NOT be deleted:</p>
                <p>Software settings, appearance & themes, user accounts, roles & permissions, the Developer/CEO account, exchange rates, and company configuration.</p>
              </div>

              <div className="pt-2">
                <label className="block font-semibold text-[var(--text-main)] mb-1">
                  Type <span className="font-mono text-red-400 font-bold">ERASE</span> to confirm permanent deletion:
                </label>
                <input
                  type="text"
                  value={eraseConfirmText}
                  onChange={(e) => setEraseConfirmText(e.target.value)}
                  placeholder="Type ERASE here..."
                  className="w-full px-3 py-2 rounded-lg bg-[var(--bg-input)] border border-[var(--border-main)] text-sm text-[var(--text-main)] font-mono focus:border-red-500 focus:outline-none"
                  autoFocus
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[var(--border-main)]">
              <button
                type="button"
                onClick={() => {
                  setIsEraseDataModalOpen(false);
                  setEraseConfirmText('');
                }}
                className="px-4 py-2 rounded-lg bg-[var(--bg-surface)] hover:bg-[var(--bg-hover)] border border-[var(--border-main)] text-[var(--text-muted)] font-semibold text-xs transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={eraseConfirmText.trim().toUpperCase() !== 'ERASE' || isErasing}
                onClick={handleConfirmEraseData}
                className={`px-4 py-2 rounded-lg font-bold text-xs transition shadow flex items-center gap-1.5 cursor-pointer ${
                  eraseConfirmText.trim().toUpperCase() === 'ERASE' && !isErasing
                    ? 'bg-red-600 hover:bg-red-500 active:bg-red-700 text-white'
                    : 'bg-red-950/40 text-red-500/40 cursor-not-allowed border border-red-900/30'
                }`}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isErasing ? 'Erasing Data...' : 'Permanently Erase All Work Data'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Export Software Data Modal */}
      {isExportSoftwareDataModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl bg-[var(--bg-card)] border border-[var(--border-main)] shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-[var(--border-main)] flex items-center justify-between bg-[var(--bg-surface)]">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[var(--text-main)] flex items-center gap-2">
                    Export Software Data Center
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300">
                      LIVE REPOSITORY
                    </span>
                  </h3>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">
                    Select a targeted data format or generate the complete all-inclusive software data master package (.zip).
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsExportSoftwareDataModalOpen(false)}
                className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-card)] transition cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4">
              {/* PRIMARY RECOMMENDED: All-in-One Software Data ZIP */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-blue-950/40 via-[var(--bg-surface)] to-emerald-950/20 border-2 border-blue-500/40 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Archive className="w-5 h-5 text-blue-400" />
                      <h4 className="font-bold text-sm text-[var(--text-main)]">
                        Complete Software Data Master Package (.ZIP)
                      </h4>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        RECOMMENDED
                      </span>
                    </div>
                    <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                      Packages all 6 critical export formats together into one compressed archive: Master JSON snapshot, 5-sheet Executive Excel report, Field Daily Work operations log, Fleet &amp; Cash expenses CSV, Relational SQL schema dump, and system settings.
                    </p>
                  </div>
                  <button
                    onClick={handleExportAllSoftwareDataZip}
                    disabled={exportingType !== null}
                    className="py-2.5 px-5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs transition shadow flex items-center justify-center gap-2 shrink-0 cursor-pointer"
                  >
                    <Archive className="w-4 h-4" />
                    <span>{exportingType === 'software-data-zip' ? 'Packaging Data...' : 'Download Master ZIP (.zip)'}</span>
                  </button>
                </div>
                {exportingType === 'software-data-zip' && exportProgress && (
                  <div className="mt-3 pt-3 border-t border-[var(--border-main)] flex items-center gap-2 text-xs text-blue-400 animate-pulse">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>{exportProgress}</span>
                  </div>
                )}
              </div>

              {/* INDIVIDUAL FORMATS GRID */}
              <h4 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider pt-2">
                Individual Formats &amp; Reports
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* 1. Master JSON */}
                <div className="p-3.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-main)] flex items-start justify-between gap-3 hover:border-emerald-500/40 transition">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Database className="w-4 h-4 text-emerald-400" />
                      <h5 className="font-bold text-xs text-[var(--text-main)]">Enterprise Database Master (.JSON)</h5>
                    </div>
                    <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                      Complete encrypted snapshot for system restores and disaster recovery.
                    </p>
                  </div>
                  <button
                    onClick={handleExportJson}
                    disabled={exportingType !== null}
                    className="py-1.5 px-3 rounded-lg bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30 text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>JSON</span>
                  </button>
                </div>

                {/* 2. Executive Excel */}
                <div className="p-3.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-main)] flex items-start justify-between gap-3 hover:border-emerald-500/40 transition">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                      <h5 className="font-bold text-xs text-[var(--text-main)]">Executive 5-Sheet Workbook (.XLSX)</h5>
                    </div>
                    <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                      Multi-sheet spreadsheet for inventory valuation, stock ledger, and executive reporting.
                    </p>
                  </div>
                  <button
                    onClick={handleExportExcel}
                    disabled={exportingType !== null}
                    className="py-1.5 px-3 rounded-lg bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30 text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Excel</span>
                  </button>
                </div>

                {/* 3. Relational SQL Dump */}
                <div className="p-3.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-main)] flex items-start justify-between gap-3 hover:border-blue-500/40 transition">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <FileCode className="w-4 h-4 text-blue-400" />
                      <h5 className="font-bold text-xs text-[var(--text-main)]">Relational SQL Database Dump (.SQL)</h5>
                    </div>
                    <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                      ANSI SQL DDL &amp; DML statements for PostgreSQL, MySQL, and SQLite.
                    </p>
                  </div>
                  <button
                    onClick={handleExportSql}
                    disabled={exportingType !== null}
                    className="py-1.5 px-3 rounded-lg bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/30 text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>SQL</span>
                  </button>
                </div>

                {/* 4. Field Operations Daily Work */}
                <div className="p-3.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-main)] flex items-start justify-between gap-3 hover:border-purple-500/40 transition">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-purple-400" />
                      <h5 className="font-bold text-xs text-[var(--text-main)]">Daily Work Field Operations (.JSON)</h5>
                    </div>
                    <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                      Technician field logs, fiber core splicing counts, optical power dBm.
                    </p>
                  </div>
                  <button
                    onClick={handleExportDailyWork}
                    disabled={exportingType !== null}
                    className="py-1.5 px-3 rounded-lg bg-purple-600/20 hover:bg-purple-600 text-purple-300 hover:text-white border border-purple-500/30 text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Daily Logs</span>
                  </button>
                </div>

                {/* 5. Fleet & Expenses CSV */}
                <div className="p-3.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-main)] flex items-start justify-between gap-3 hover:border-amber-500/40 transition">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-amber-400" />
                      <h5 className="font-bold text-xs text-[var(--text-main)]">Fleet Fuel &amp; Cash Expenses (.CSV)</h5>
                    </div>
                    <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                      Standard comma-separated ledger compatible with QuickBooks, SAP, and Excel.
                    </p>
                  </div>
                  <button
                    onClick={handleExportCsv}
                    disabled={exportingType !== null}
                    className="py-1.5 px-3 rounded-lg bg-amber-600/20 hover:bg-amber-600 text-amber-300 hover:text-white border border-amber-500/30 text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>CSV</span>
                  </button>
                </div>

                {/* 6. Standalone Offline Web App */}
                <div className="p-3.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-main)] flex items-start justify-between gap-3 hover:border-cyan-500/40 transition">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-cyan-400" />
                      <h5 className="font-bold text-xs text-[var(--text-main)]">Standalone Offline Web App (.HTML)</h5>
                    </div>
                    <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                      Single-file application with all data inlined. Runs offline in any web browser.
                    </p>
                  </div>
                  <button
                    onClick={handleExportSingleHtml}
                    disabled={exportingType !== null}
                    className="py-1.5 px-3 rounded-lg bg-cyan-600/20 hover:bg-cyan-600 text-cyan-300 hover:text-white border border-cyan-500/30 text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>HTML</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-[var(--border-main)] flex items-center justify-between bg-[var(--bg-surface)]">
              <span className="text-xs text-[var(--text-muted)]">
                All exports include verified live data with active timestamps.
              </span>
              <button
                onClick={() => setIsExportSoftwareDataModalOpen(false)}
                className="py-2 px-4 rounded-lg bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] border border-[var(--border-main)] text-[var(--text-main)] font-semibold text-xs transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Network & Portable Storage Configuration Modal */}
      {isNetworkStorageModalOpen && (
        <NetworkStorageModal
          isOpen={isNetworkStorageModalOpen}
          onClose={() => setIsNetworkStorageModalOpen(false)}
          showToast={showToast}
        />
      )}

      {/* Unified Multi-Source Data Import Modal */}
      {isDataImportModalOpen && (
        <DataImportModal
          isOpen={isDataImportModalOpen}
          onClose={() => setIsDataImportModalOpen(false)}
          currentUser={currentUser}
          onImportCompleted={() => {
            triggerDataRefresh();
            showToast(`${softwareName} database successfully imported and verified!`, 'success');
          }}
          showToast={showToast}
        />
      )}
    </div>
  );
};
