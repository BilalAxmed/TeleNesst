import React, { useState, useRef } from 'react';
import JSZip from 'jszip';
import * as XLSX from 'xlsx';
import { storage } from '../../services/storage';
import { networkStorageService } from '../../services/networkStorageService';
import { useApp } from '../../context/AppContext';
import { User, InventoryItem, StockMovement } from '../../types';
import {
  Upload,
  FileCheck,
  AlertTriangle,
  CheckCircle2,
  HardDrive,
  Network,
  Usb,
  Cloud,
  Clipboard,
  FileText,
  X,
  Layers,
  ShieldCheck,
  RefreshCw,
  Archive,
  ArrowRight,
  Database,
  RotateCcw,
  Sliders,
  Check,
} from 'lucide-react';

interface DataImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onImportCompleted: () => void;
  showToast: (message: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
}

export type ImportSourceType = 'local_file' | 'portable_usb' | 'network_share' | 'cloud_url' | 'clipboard';
export type ImportStrategy = 'replace' | 'merge' | 'append';

interface ValidationResult {
  isValid: boolean;
  app: string;
  version: string;
  exportedAt: string;
  sourceDescription: string;
  errors: string[];
  warnings: string[];
  counts: {
    inventory: number;
    movements: number;
    ftth: number;
    fttb: number;
    fttm: number;
    expenses: number;
    projects: number;
    dailyWorks: number;
    users: number;
  };
  rawJson: string;
}

export const DataImportModal: React.FC<DataImportModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onImportCompleted,
  showToast,
}) => {
  const { softwareName } = useApp();
  const [selectedSource, setSelectedSource] = useState<ImportSourceType>('local_file');
  const [cloudUrl, setCloudUrl] = useState('');
  const [pastedJson, setPastedJson] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');

  // Validation State
  const [validation, setValidation] = useState<ValidationResult | null>(null);

  // Strategy & Confirmation State
  const [strategy, setStrategy] = useState<ImportStrategy>('replace');
  const [userConfirmedOverwrite, setUserConfirmedOverwrite] = useState(false);
  const [isApplying, setIsApplying] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Current Database Counts for Comparison
  const currentCounts = {
    inventory: storage.getInventory().length,
    movements: storage.getMovements().length,
    ftth: storage.getFTTH().length,
    fttb: storage.getFTTB().length,
    fttm: storage.getFTTM().length,
    expenses: storage.getExpenses().length,
    projects: storage.getProjects().length,
    dailyWorks: storage.getDailyWorks().length,
    users: storage.getUsers().length,
  };

  /**
   * Validate raw JSON text against TeleNest Schema
   */
  const validateData = (jsonText: string, sourceLabel: string): ValidationResult => {
    const errors: string[] = [];
    const warnings: string[] = [];

    let parsed: any = null;
    try {
      parsed = JSON.parse(jsonText);
    } catch (e: any) {
      return {
        isValid: false,
        app: 'Unknown',
        version: 'Unknown',
        exportedAt: 'Unknown',
        sourceDescription: sourceLabel,
        errors: [`Invalid JSON syntax: ${e?.message || e}`],
        warnings: [],
        counts: {
          inventory: 0,
          movements: 0,
          ftth: 0,
          fttb: 0,
          fttm: 0,
          expenses: 0,
          projects: 0,
          dailyWorks: 0,
          users: 0,
        },
        rawJson: '',
      };
    }

    if (!parsed || typeof parsed !== 'object') {
      errors.push('Payload is not a valid JSON object.');
    }

    const appSig = parsed.app || parsed.softwareName;
    const currentSoftware = softwareName || 'TeleNest';
    if (appSig && appSig !== 'TeleNest' && appSig !== currentSoftware) {
      warnings.push(
        `App signature is "${appSig}". Attempting schema mapping.`
      );
    }

    const dataObj = parsed.data || parsed;
    if (!dataObj) {
      errors.push('Missing database payload "data" object.');
    }

    const counts = {
      inventory: Array.isArray(dataObj?.inventory) ? dataObj.inventory.length : 0,
      movements: Array.isArray(dataObj?.movements) ? dataObj.movements.length : 0,
      ftth: Array.isArray(dataObj?.ftth) ? dataObj.ftth.length : 0,
      fttb: Array.isArray(dataObj?.fttb) ? dataObj.fttb.length : 0,
      fttm: Array.isArray(dataObj?.fttm) ? dataObj.fttm.length : 0,
      expenses: Array.isArray(dataObj?.expenses) ? dataObj.expenses.length : 0,
      projects: Array.isArray(dataObj?.projects) ? dataObj.projects.length : 0,
      dailyWorks: Array.isArray(dataObj?.dailyWorks) ? dataObj.dailyWorks.length : 0,
      users: Array.isArray(dataObj?.users) ? dataObj.users.length : 0,
    };

    if (counts.inventory === 0 && counts.projects === 0 && counts.dailyWorks === 0) {
      warnings.push('File contains 0 inventory, projects, and daily works records.');
    }

    // Re-structure to standard format if needed
    const normalizedPayload = {
      app: appSig || currentSoftware,
      softwareName: currentSoftware,
      developer: parsed.developer || 'Bilal Ahmed',
      exportedAt: parsed.exportedAt || new Date().toISOString(),
      version: parsed.version || '1.0.0',
      data: dataObj,
    };

    return {
      isValid: errors.length === 0,
      app: appSig || currentSoftware,
      version: parsed.version || '1.0.0',
      exportedAt: parsed.exportedAt || new Date().toISOString(),
      sourceDescription: sourceLabel,
      errors,
      warnings,
      counts,
      rawJson: JSON.stringify(normalizedPayload, null, 2),
    };
  };

  /**
   * Process File (JSON, Excel, or ZIP Archive)
   */
  const handleProcessFile = async (file: File) => {
    setIsLoading(true);
    setLoadingMessage(`Reading ${file.name}...`);
    try {
      const lowerName = file.name.toLowerCase();
      if (lowerName.endsWith('.zip')) {
        // Unpack ZIP Archive
        setLoadingMessage('Extracting master database from ZIP archive...');
        const zip = await JSZip.loadAsync(file);
        let masterJsonText = '';

        // Look for master JSON file in ZIP
        const candidates = [
          `${softwareName}_Enterprise_Database_Master.json`,
          `${softwareName}_Database_Master.json`,
          'TeleNest_Enterprise_Database_Master.json',
          'TeleNest_Database_Master.json',
          'database.json',
        ];

        for (const candidate of candidates) {
          const zipFile = zip.file(candidate);
          if (zipFile) {
            masterJsonText = await zipFile.async('text');
            break;
          }
        }

        // If not found, look for any .json file in root
        if (!masterJsonText) {
          for (const [relativePath, zipEntry] of Object.entries(zip.files)) {
            if (relativePath.endsWith('.json') && !zipEntry.dir) {
              masterJsonText = await zipEntry.async('text');
              break;
            }
          }
        }

        if (!masterJsonText) {
          throw new Error(`No valid ${softwareName} JSON master database found inside this ZIP package.`);
        }

        const res = validateData(masterJsonText, `ZIP Archive: ${file.name}`);
        setValidation(res);
      } else if (lowerName.endsWith('.xlsx') || lowerName.endsWith('.xls') || lowerName.endsWith('.csv')) {
        // Process Excel Spreadsheet or CSV
        setLoadingMessage('Parsing Excel workbook / CSV sheets...');
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        
        const extractedData: Record<string, any[]> = {};
        workbook.SheetNames.forEach((sheetName) => {
          const sheet = workbook.Sheets[sheetName];
          const rows = XLSX.utils.sheet_to_json<Record<string, any>>(sheet);
          const lowerSheet = sheetName.toLowerCase().replace(/[^a-z]/g, '');
          
          if (lowerSheet.includes('daily') || lowerSheet.includes('work') || lowerSheet.includes('activit')) {
            extractedData.dailyWorks = rows.map((r, i) => ({
              id: r.id || `dw_imp_${Date.now()}_${i}`,
              rowNumber: i + 1,
              siteId: r['Site ID'] || r.siteId || `SITE-${i + 1}`,
              siteName: r['Site Name'] || r.siteName || 'Field Site',
              date: r.Date || r.date || new Date().toISOString().split('T')[0],
              completionDateTime: r['Completion Date/Time'] || r.completionDateTime || new Date().toISOString().replace('T', ' ').substring(0, 19),
              projectCode: r['Project Code'] || r.projectCode || 'PRJ-GEN',
              projectName: r['Project Name'] || r.projectName || 'General Rollout',
              workType: r['Work Type'] || r.workType || 'FTTH',
              teamLead: r['Team Lead'] || r.teamLead || 'Operator',
              techniciansCount: Number(r['Technicians'] || r.techniciansCount || 2),
              tasksCompleted: r['Tasks Completed'] || r.tasksCompleted || 'Field works executed',
              metersInstalled: Number(r['Meters Installed'] || r.metersInstalled || 0),
              issuesEncountered: r['Issues Encountered'] || r.issuesEncountered || 'None',
              status: (r.Status || r.status || 'Completed') as any,
              isRowChecked: true,
              weatherCondition: r['Weather'] || r.weatherCondition || 'Clear',
              safetyIncidentReported: Boolean(r.safetyIncidentReported || false),
              photos: [],
              notes: r.Notes || r.notes || 'Imported from spreadsheet',
            }));
          } else if (lowerSheet.includes('inventory') || lowerSheet.includes('stock') || lowerSheet.includes('item')) {
            extractedData.inventory = rows.map((r, i) => ({
              id: r.id || `inv_imp_${Date.now()}_${i}`,
              name: r['Item Name'] || r.name || `Item ${i + 1}`,
              itemCode: r['Item Code'] || r.itemCode || `SKU-${Date.now().toString().slice(-4)}-${i}`,
              category: r.Category || r.category || 'Corning Fiber Optic Cables',
              unit: r.Unit || r.unit || 'Pcs',
              totalIn: Number(r['Total In'] || r.totalIn || 100),
              totalOut: Number(r['Total Out'] || r.totalOut || 0),
              currentStock: Number(r['Current Stock'] || r['Stock'] || r.currentStock || 100),
              unitPrice: Number(r['Unit Price'] || r.unitPrice || 10),
              currency: r.Currency || r.currency || 'USD',
              minimumStockAlert: Number(r['Min Alert'] || r.minimumStockAlert || 5),
              status: 'In Stock',
              lastUpdated: new Date().toISOString(),
            }));
          } else if (lowerSheet.includes('project')) {
            extractedData.projects = rows.map((r, i) => ({
              id: r.id || `prj_imp_${Date.now()}_${i}`,
              code: r['Project Code'] || r.code || `PRJ-${i + 1}`,
              name: r['Project Name'] || r.name || 'Fiber Network Expansion',
              type: r['Type'] || r.type || 'FTTH',
              client: r['Client'] || r.client || 'Enterprise Telecom Client',
              budget: Number(r['Budget'] || r.budget || 50000),
              startDate: r['Start Date'] || r.startDate || new Date().toISOString().split('T')[0],
              status: r['Status'] || r.status || 'In Progress',
              progressPercentage: Number(r['Progress %'] || r.progressPercentage || 50),
              manager: r['Manager'] || r.manager || 'Bilal Ahmed',
            }));
          }
        });

        // If sheet names were generic (e.g. Sheet1), parse first sheet as inventory or daily works
        if (Object.keys(extractedData).length === 0 && workbook.SheetNames.length > 0) {
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const rows = XLSX.utils.sheet_to_json<Record<string, any>>(firstSheet);
          if (rows.length > 0) {
            const hasSite = rows.some((r) => r['Site ID'] || r.siteId || r['Tasks Completed']);
            if (hasSite) {
              extractedData.dailyWorks = rows.map((r, i) => ({
                id: r.id || `dw_imp_${Date.now()}_${i}`,
                rowNumber: i + 1,
                siteId: r['Site ID'] || r.siteId || `SITE-${i + 1}`,
                siteName: r['Site Name'] || r.siteName || 'Field Site',
                date: r.Date || r.date || new Date().toISOString().split('T')[0],
                completionDateTime: r['Completion Date/Time'] || r.completionDateTime || new Date().toISOString().replace('T', ' ').substring(0, 19),
                projectCode: r['Project Code'] || r.projectCode || 'PRJ-GEN',
                projectName: r['Project Name'] || r.projectName || 'General Rollout',
                workType: r['Work Type'] || r.workType || 'FTTH',
                teamLead: r['Team Lead'] || r.teamLead || 'Operator',
                techniciansCount: Number(r['Technicians'] || r.techniciansCount || 2),
                tasksCompleted: r['Tasks Completed'] || r.tasksCompleted || 'Field works completed',
                metersInstalled: Number(r['Meters Installed'] || r.metersInstalled || 0),
                issuesEncountered: r['Issues Encountered'] || r.issuesEncountered || 'None',
                status: 'Completed',
                isRowChecked: true,
                weatherCondition: 'Clear',
                safetyIncidentReported: false,
                photos: [],
                notes: 'Imported from spreadsheet',
              }));
            } else {
              extractedData.inventory = rows.map((r, i) => ({
                id: r.id || `inv_imp_${Date.now()}_${i}`,
                name: r['Item Name'] || r.name || r['Title'] || `Item ${i + 1}`,
                itemCode: r['Item Code'] || r.itemCode || r['SKU'] || `SKU-${i + 1}`,
                category: r.Category || r.category || 'General',
                unit: r.Unit || r.unit || 'Pcs',
                totalIn: Number(r['Total In'] || r.totalIn || 100),
                totalOut: Number(r['Total Out'] || r.totalOut || 0),
                currentStock: Number(r['Current Stock'] || r['Stock'] || r.currentStock || 100),
                unitPrice: Number(r['Unit Price'] || r.unitPrice || 10),
                currency: 'USD',
                minimumStockAlert: 5,
                status: 'In Stock',
                lastUpdated: new Date().toISOString(),
              }));
            }
          }
        }

        const jsonPayload = JSON.stringify({
          app: softwareName || 'TeleNest',
          version: '1.0.0',
          exportedAt: new Date().toISOString(),
          data: extractedData,
        });

        const res = validateData(jsonPayload, `Excel Spreadsheet: ${file.name}`);
        setValidation(res);
      } else {
        // Standard JSON File
        const text = await file.text();
        const res = validateData(text, `File: ${file.name}`);
        setValidation(res);
      }
    } catch (err: any) {
      showToast(`Failed to parse file: ${err?.message || err}`, 'error');
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  /**
   * Import From Connected Office Network Storage
   */
  const handleImportFromNetworkStorage = async () => {
    setIsLoading(true);
    setLoadingMessage('Reading directly from connected office network storage...');
    try {
      const netState = networkStorageService.getState();
      if (!netState.isActive) {
        throw new Error('Network storage is not currently connected. Please configure network storage first.');
      }

      // Read directly using networkStorageService
      const res = await networkStorageService.readFromNetworkStorage();
      if (res.success) {
        // Fetch snapshot
        const fullBackup = storage.exportFullBackup();
        const validated = validateData(
          fullBackup,
          `Office Network Device: ${netState.networkPathAlias || netState.folderName}`
        );
        setValidation(validated);
        showToast('Database read from network storage and validated successfully.', 'success');
      } else {
        throw new Error(res.message);
      }
    } catch (err: any) {
      showToast(err?.message || 'Failed to read from network storage.', 'error');
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  /**
   * Import from Portable Storage Device (Prompt Directory or File)
   */
  const handleBrowsePortableDevice = async () => {
    if ('showOpenFilePicker' in window) {
      try {
        const [fileHandle] = await (window as any).showOpenFilePicker({
          types: [
            {
              description: `${softwareName} Backup Files (.json, .zip)`,
              accept: {
                'application/json': ['.json'],
                'application/zip': ['.zip'],
              },
            },
          ],
        });
        const file = await fileHandle.getFile();
        await handleProcessFile(file);
      } catch (err: any) {
        if (err?.name !== 'AbortError') {
          showToast(`Could not open file from portable storage: ${err?.message || err}`, 'error');
        }
      }
    } else {
      fileInputRef.current?.click();
    }
  };

  /**
   * Import From Cloud URL
   */
  const handleFetchCloudUrl = async () => {
    if (!cloudUrl.trim()) {
      showToast('Please enter a valid HTTP/HTTPS URL.', 'warning');
      return;
    }

    setIsLoading(true);
    setLoadingMessage('Fetching database from cloud URL...');
    try {
      const resp = await fetch(cloudUrl.trim());
      if (!resp.ok) {
        throw new Error(`Cloud server returned HTTP status ${resp.status}`);
      }
      const text = await resp.text();
      const res = validateData(text, `Cloud URL: ${cloudUrl.trim()}`);
      setValidation(res);
      showToast('Cloud database downloaded and validated successfully.', 'success');
    } catch (err: any) {
      showToast(`Cloud fetch failed: ${err?.message || err}`, 'error');
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  /**
   * Import From Clipboard / Direct JSON
   */
  const handleValidatePastedJson = () => {
    if (!pastedJson.trim()) {
      showToast('Please paste a valid JSON backup text.', 'warning');
      return;
    }
    const res = validateData(pastedJson.trim(), 'Pasted JSON Payload');
    setValidation(res);
  };

  /**
   * Final Apply Import Step with Protection Against Accidental Overwrite
   */
  const handleApplyImport = async () => {
    if (!validation || !validation.isValid) {
      showToast(`Please provide a valid ${softwareName} database before importing.`, 'error');
      return;
    }

    // Require explicit confirmation for replace strategy
    if (strategy === 'replace' && !userConfirmedOverwrite) {
      showToast('Please check the confirmation box to authorize replacing existing data.', 'warning');
      return;
    }

    setIsApplying(true);
    try {
      const user = currentUser || {
        id: 'usr_import',
        fullName: 'System Administrator',
        role: 'Developer/CEO',
      } as User;

      const result = storage.importDatabaseWithStrategy(validation.rawJson, user, strategy);

      if (result.success) {
        showToast(result.message, 'success');

        // Also sync to connected network storage if active
        if (networkStorageService.isNetworkStorageActive()) {
          await networkStorageService.saveNow();
        }

        onImportCompleted();
        onClose();
      } else {
        showToast(result.message, 'error');
      }
    } catch (err: any) {
      showToast(`Import application error: ${err?.message || err}`, 'error');
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-2xl shadow-2xl overflow-hidden text-[var(--text-main)]">
        {/* Hidden standard file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,.zip,.xlsx,.xls,.csv"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleProcessFile(file);
            e.target.value = '';
          }}
          className="hidden"
        />

        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-main)] bg-[var(--bg-card)]/70">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-600/15 text-blue-400 border border-blue-500/30">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-[var(--text-main)]">
                  Unified Data Import Center
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30">
                  Universal Multi-Location
                </span>
              </div>
              <p className="text-xs text-[var(--text-muted)]">
                Import {softwareName} data from portable storage, network shares, cloud storage, or local disk with validation
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg text-[var(--text-dim)] hover:text-[var(--text-main)] hover:bg-[var(--bg-hover)] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
          {/* STEP 1: Select Source Location */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="font-bold text-sm text-[var(--text-main)] flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">
                  1
                </span>
                <span>Select Data Source Location</span>
              </div>
              {validation && (
                <button
                  type="button"
                  onClick={() => {
                    setValidation(null);
                    setUserConfirmedOverwrite(false);
                  }}
                  className="text-xs text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Choose Different Source</span>
                </button>
              )}
            </div>

            {/* Source Type Pills */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              <button
                type="button"
                onClick={() => setSelectedSource('local_file')}
                className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                  selectedSource === 'local_file'
                    ? 'bg-blue-500/15 border-blue-500/50 text-[var(--text-main)] shadow-sm'
                    : 'bg-[var(--bg-card)] border-[var(--border-main)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
                }`}
              >
                <HardDrive className="w-5 h-5 text-blue-400 mb-2" />
                <div>
                  <div className="font-bold text-xs">Local File</div>
                  <div className="text-[10px] text-[var(--text-dim)]">JSON / ZIP Package</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedSource('portable_usb')}
                className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                  selectedSource === 'portable_usb'
                    ? 'bg-emerald-500/15 border-emerald-500/50 text-[var(--text-main)] shadow-sm'
                    : 'bg-[var(--bg-card)] border-[var(--border-main)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
                }`}
              >
                <Usb className="w-5 h-5 text-emerald-400 mb-2" />
                <div>
                  <div className="font-bold text-xs">Portable Drive</div>
                  <div className="text-[10px] text-[var(--text-dim)]">USB / Flash / SSD</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedSource('network_share')}
                className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                  selectedSource === 'network_share'
                    ? 'bg-indigo-500/15 border-indigo-500/50 text-[var(--text-main)] shadow-sm'
                    : 'bg-[var(--bg-card)] border-[var(--border-main)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
                }`}
              >
                <Network className="w-5 h-5 text-indigo-400 mb-2" />
                <div>
                  <div className="font-bold text-xs">Network Share</div>
                  <div className="text-[10px] text-[var(--text-dim)]">Office NAS / SMB</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedSource('cloud_url')}
                className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                  selectedSource === 'cloud_url'
                    ? 'bg-purple-500/15 border-purple-500/50 text-[var(--text-main)] shadow-sm'
                    : 'bg-[var(--bg-card)] border-[var(--border-main)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
                }`}
              >
                <Cloud className="w-5 h-5 text-purple-400 mb-2" />
                <div>
                  <div className="font-bold text-xs">Cloud URL</div>
                  <div className="text-[10px] text-[var(--text-dim)]">Drive / Dropbox / HTTP</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedSource('clipboard')}
                className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between col-span-2 sm:col-span-1 ${
                  selectedSource === 'clipboard'
                    ? 'bg-amber-500/15 border-amber-500/50 text-[var(--text-main)] shadow-sm'
                    : 'bg-[var(--bg-card)] border-[var(--border-main)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
                }`}
              >
                <Clipboard className="w-5 h-5 text-amber-400 mb-2" />
                <div>
                  <div className="font-bold text-xs">Direct Text</div>
                  <div className="text-[10px] text-[var(--text-dim)]">Clipboard JSON</div>
                </div>
              </button>
            </div>

            {/* Source Specific Selection Controls */}
            {!validation && (
              <div className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-main)] animate-in fade-in">
                {selectedSource === 'local_file' && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                      <h4 className="font-bold text-xs text-[var(--text-main)]">
                        Select {softwareName} File from Local Disk
                      </h4>
                      <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                        Upload <code className="text-blue-300 font-mono">{softwareName}_Enterprise_Database_Master.json</code> or master package <code className="text-blue-300 font-mono">{softwareName}_Software_Data.zip</code>.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isLoading}
                      className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold flex items-center gap-2 transition shadow cursor-pointer shrink-0"
                    >
                      <Upload className="w-4 h-4" />
                      <span>Browse Local Disk File</span>
                    </button>
                  </div>
                )}

                {selectedSource === 'portable_usb' && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                      <h4 className="font-bold text-xs text-[var(--text-main)] flex items-center gap-1.5">
                        <Usb className="w-4 h-4 text-emerald-400" />
                        <span>Select File from Portable USB / External Drive</span>
                      </h4>
                      <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                        Access data directly from connected removable media (USB thumb drive, rugged SSD, external HDD).
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleBrowsePortableDevice}
                      disabled={isLoading}
                      className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-2 transition shadow cursor-pointer shrink-0"
                    >
                      <Usb className="w-4 h-4" />
                      <span>Browse Portable Storage</span>
                    </button>
                  </div>
                )}

                {selectedSource === 'network_share' && (
                  <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div>
                        <h4 className="font-bold text-xs text-[var(--text-main)] flex items-center gap-1.5">
                          <Network className="w-4 h-4 text-indigo-400" />
                          <span>Import from Office Network Storage</span>
                        </h4>
                        <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                          Load master data directly from the office NAS drive or mapped network share.
                        </p>
                      </div>

                      {networkStorageService.getState().isActive ? (
                        <button
                          type="button"
                          onClick={handleImportFromNetworkStorage}
                          disabled={isLoading}
                          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center gap-2 transition shadow cursor-pointer shrink-0"
                        >
                          <Network className="w-4 h-4" />
                          <span>Import from Connected Network Path</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-4 py-2 rounded-xl bg-[var(--bg-surface)] hover:bg-[var(--bg-hover)] border border-[var(--border-main)] font-semibold text-xs transition cursor-pointer"
                        >
                          Browse Mapped Network Drive File
                        </button>
                      )}
                    </div>

                    <div className="p-2.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-main)] text-[11px] flex items-center justify-between">
                      <span className="text-[var(--text-muted)]">Current Network Storage Path:</span>
                      <span className="font-mono font-bold text-[var(--text-main)]">
                        {networkStorageService.getState().networkPathAlias ||
                          networkStorageService.getState().folderName ||
                          'Not currently mounted'}
                      </span>
                    </div>
                  </div>
                )}

                {selectedSource === 'cloud_url' && (
                  <div className="space-y-2.5">
                    <label className="block text-[11px] font-semibold text-[var(--text-muted)]">
                      Enter Direct Cloud Download URL or HTTP WebDAV Endpoint
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="url"
                        value={cloudUrl}
                        onChange={(e) => setCloudUrl(e.target.value)}
                        placeholder="https://drive.google.com/uc?export=download&id=... or https://storage.company.com/telenest_master.json"
                        className="flex-1 px-3 py-2 rounded-lg bg-[var(--bg-input)] border border-[var(--border-main)] text-xs text-[var(--text-main)] font-mono focus:outline-none focus:border-purple-500"
                      />
                      <button
                        type="button"
                        onClick={handleFetchCloudUrl}
                        disabled={isLoading || !cloudUrl.trim()}
                        className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0"
                      >
                        <Cloud className="w-3.5 h-3.5" />
                        <span>Fetch from Cloud</span>
                      </button>
                    </div>
                    <p className="text-[10px] text-[var(--text-dim)]">
                      Direct raw link to {softwareName} master JSON file on Google Drive, Dropbox, OneDrive, or AWS S3.
                    </p>
                  </div>
                )}

                {selectedSource === 'clipboard' && (
                  <div className="space-y-2.5">
                    <label className="block text-[11px] font-semibold text-[var(--text-muted)]">
                      Paste {softwareName} Backup JSON Text
                    </label>
                    <textarea
                      rows={4}
                      value={pastedJson}
                      onChange={(e) => setPastedJson(e.target.value)}
                      placeholder={`{"app": "${softwareName}", "developer": "Bilal Ahmed", "data": { "inventory": [...], "projects": [...] } }`}
                      className="w-full p-2.5 rounded-lg bg-[var(--bg-input)] border border-[var(--border-main)] text-xs text-[var(--text-main)] font-mono focus:outline-none focus:border-amber-500"
                    />
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={handleValidatePastedJson}
                        disabled={!pastedJson.trim()}
                        className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-bold transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <FileCheck className="w-3.5 h-3.5" />
                        <span>Validate Pasted JSON</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Loading Indicator */}
            {isLoading && (
              <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center gap-3 text-blue-400">
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span className="font-semibold text-xs">{loadingMessage || 'Processing data...'}</span>
              </div>
            )}
          </div>

          {/* STEP 2: Pre-Import Data Validation & Relational Inspection */}
          {validation && (
            <div className="space-y-4 animate-in fade-in">
              <div className="font-bold text-sm text-[var(--text-main)] flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">
                  2
                </span>
                <span>Pre-Import Data Validation &amp; Verification</span>
                {validation.isValid ? (
                  <span className="ml-auto px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Verified {softwareName} Schema
                  </span>
                ) : (
                  <span className="ml-auto px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Validation Errors
                  </span>
                )}
              </div>

              {/* Source Info Header */}
              <div className="p-3.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-main)] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="text-[10px] uppercase font-bold text-[var(--text-dim)]">Source Verified</div>
                  <div className="text-xs font-bold text-[var(--text-main)] truncate mt-0.5">
                    {validation.sourceDescription}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] uppercase font-bold text-[var(--text-dim)]">Export Timestamp</div>
                  <div className="text-xs font-mono text-[var(--text-muted)] mt-0.5">
                    {validation.exportedAt ? new Date(validation.exportedAt).toLocaleString() : 'Unknown'}
                  </div>
                </div>
              </div>

              {/* Validation Errors or Warnings */}
              {validation.errors.length > 0 && (
                <div className="p-3.5 rounded-xl bg-rose-950/30 border border-rose-500/40 text-rose-300 space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-rose-400">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Schema Validation Failed</span>
                  </div>
                  <ul className="list-disc pl-5 text-[11px] space-y-0.5">
                    {validation.errors.map((e, idx) => (
                      <li key={idx}>{e}</li>
                    ))}
                  </ul>
                </div>
              )}

              {validation.warnings.length > 0 && (
                <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-500/30 text-amber-300 space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-amber-400">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Import Notice</span>
                  </div>
                  <ul className="list-disc pl-5 text-[11px] space-y-0.5">
                    {validation.warnings.map((w, idx) => (
                      <li key={idx}>{w}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Side-by-Side Entity Record Count Comparison Matrix */}
              <div className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-main)] space-y-3">
                <div className="font-bold text-xs text-[var(--text-main)] flex items-center gap-2">
                  <Layers className="w-4 h-4 text-blue-400" />
                  <span>Entity Comparison (Incoming Dataset vs. Current Workstation Database)</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono text-xs">
                  <div className="p-2.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-main)]">
                    <div className="text-[10px] text-[var(--text-dim)] uppercase">Warehouse Inventory</div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[var(--text-muted)]">{currentCounts.inventory} curr</span>
                      <ArrowRight className="w-3 h-3 text-blue-400" />
                      <strong className="text-blue-400">{validation.counts.inventory} new</strong>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-main)]">
                    <div className="text-[10px] text-[var(--text-dim)] uppercase">Stock Movements</div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[var(--text-muted)]">{currentCounts.movements} curr</span>
                      <ArrowRight className="w-3 h-3 text-blue-400" />
                      <strong className="text-blue-400">{validation.counts.movements} new</strong>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-main)]">
                    <div className="text-[10px] text-[var(--text-dim)] uppercase">Telecom Sites (FTTx)</div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[var(--text-muted)]">
                        {currentCounts.ftth + currentCounts.fttb + currentCounts.fttm} curr
                      </span>
                      <ArrowRight className="w-3 h-3 text-blue-400" />
                      <strong className="text-blue-400">
                        {validation.counts.ftth + validation.counts.fttb + validation.counts.fttm} new
                      </strong>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-main)]">
                    <div className="text-[10px] text-[var(--text-dim)] uppercase">Engineering Projects</div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[var(--text-muted)]">{currentCounts.projects} curr</span>
                      <ArrowRight className="w-3 h-3 text-blue-400" />
                      <strong className="text-blue-400">{validation.counts.projects} new</strong>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-main)]">
                    <div className="text-[10px] text-[var(--text-dim)] uppercase">Field Daily Works</div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[var(--text-muted)]">{currentCounts.dailyWorks} curr</span>
                      <ArrowRight className="w-3 h-3 text-blue-400" />
                      <strong className="text-blue-400">{validation.counts.dailyWorks} new</strong>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-main)]">
                    <div className="text-[10px] text-[var(--text-dim)] uppercase">Finance Expenses</div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[var(--text-muted)]">{currentCounts.expenses} curr</span>
                      <ArrowRight className="w-3 h-3 text-blue-400" />
                      <strong className="text-blue-400">{validation.counts.expenses} new</strong>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-main)] col-span-2">
                    <div className="text-[10px] text-[var(--text-dim)] uppercase">Security &amp; Root Authority</div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-emerald-400 font-semibold flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Bilal Ahmed (CEO) Strictly Preserved
                      </span>
                      <span className="text-[var(--text-dim)] font-mono">100% Immutable</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* STEP 3: Import Strategy & Overwrite Protection */}
              <div className="space-y-3">
                <div className="font-bold text-sm text-[var(--text-main)] flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">
                    3
                  </span>
                  <span>Select Import Strategy &amp; Authorize</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {/* Strategy A: Replace Entire Database */}
                  <label
                    className={`p-3.5 rounded-xl border text-left cursor-pointer transition flex flex-col justify-between ${
                      strategy === 'replace'
                        ? 'bg-amber-500/10 border-amber-500/50 shadow-sm'
                        : 'bg-[var(--bg-card)] border-[var(--border-main)] hover:border-amber-500/30'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <input
                        type="radio"
                        name="importStrategy"
                        value="replace"
                        checked={strategy === 'replace'}
                        onChange={() => setStrategy('replace')}
                        className="text-amber-500 focus:ring-amber-500"
                      />
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-amber-500/15 text-amber-400 border border-amber-500/25">
                        Full Restore
                      </span>
                    </div>
                    <div className="font-bold text-xs text-[var(--text-main)]">
                      Replace Database (Overwrite)
                    </div>
                    <p className="text-[10px] text-[var(--text-muted)] mt-1 leading-relaxed">
                      Replaces existing database records with this snapshot. A pre-import emergency safety snapshot is created automatically.
                    </p>
                  </label>

                  {/* Strategy B: Smart Merge */}
                  <label
                    className={`p-3.5 rounded-xl border text-left cursor-pointer transition flex flex-col justify-between ${
                      strategy === 'merge'
                        ? 'bg-blue-500/10 border-blue-500/50 shadow-sm'
                        : 'bg-[var(--bg-card)] border-[var(--border-main)] hover:border-blue-500/30'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <input
                        type="radio"
                        name="importStrategy"
                        value="merge"
                        checked={strategy === 'merge'}
                        onChange={() => setStrategy('merge')}
                        className="text-blue-500 focus:ring-blue-500"
                      />
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-blue-500/15 text-blue-400 border border-blue-500/25">
                        Non-Destructive
                      </span>
                    </div>
                    <div className="font-bold text-xs text-[var(--text-main)]">
                      Smart Merge &amp; Update
                    </div>
                    <p className="text-[10px] text-[var(--text-muted)] mt-1 leading-relaxed">
                      Preserves current records. Adds newly discovered items and updates existing records by SKU code or identifier.
                    </p>
                  </label>

                  {/* Strategy C: Append Only */}
                  <label
                    className={`p-3.5 rounded-xl border text-left cursor-pointer transition flex flex-col justify-between ${
                      strategy === 'append'
                        ? 'bg-emerald-500/10 border-emerald-500/50 shadow-sm'
                        : 'bg-[var(--bg-card)] border-[var(--border-main)] hover:border-emerald-500/30'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <input
                        type="radio"
                        name="importStrategy"
                        value="append"
                        checked={strategy === 'append'}
                        onChange={() => setStrategy('append')}
                        className="text-emerald-500 focus:ring-emerald-500"
                      />
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                        Strict Append
                      </span>
                    </div>
                    <div className="font-bold text-xs text-[var(--text-main)]">
                      Append Only (Insert New)
                    </div>
                    <p className="text-[10px] text-[var(--text-muted)] mt-1 leading-relaxed">
                      Never modifies or replaces any existing record. Only imports items that do not already exist in the database.
                    </p>
                  </label>
                </div>

                {/* Overwrite Protection Confirmation Box (Required if strategy is 'replace') */}
                {strategy === 'replace' && (
                  <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-500/50 space-y-2.5 animate-in fade-in">
                    <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>Explicit Overwrite Confirmation Required</span>
                    </div>
                    <p className="text-[11px] text-amber-200/90 leading-relaxed">
                      In accordance with {softwareName} security protocols, existing records will not be overwritten without explicit confirmation. A safety rollback snapshot will be generated automatically before applying.
                    </p>
                    <label className="flex items-start gap-2.5 pt-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={userConfirmedOverwrite}
                        onChange={(e) => setUserConfirmedOverwrite(e.target.checked)}
                        className="mt-0.5 rounded text-amber-500 focus:ring-amber-500"
                      />
                      <span className="font-bold text-xs text-[var(--text-main)] select-none">
                        I authorize replacing the existing database with this imported dataset.
                      </span>
                    </label>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-4 border-t border-[var(--border-main)] bg-[var(--bg-card)]/50 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-[11px] text-[var(--text-dim)] flex items-center gap-1.5 self-start sm:self-center">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Preserves software configuration, custom categories, and theme settings</span>
          </div>

          <div className="flex items-center gap-2 self-end">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-[var(--bg-surface)] hover:bg-[var(--bg-hover)] border border-[var(--border-main)] font-semibold text-xs transition cursor-pointer"
            >
              Cancel
            </button>

            {validation && (
              <button
                onClick={handleApplyImport}
                disabled={
                  isApplying ||
                  !validation.isValid ||
                  (strategy === 'replace' && !userConfirmedOverwrite)
                }
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs shadow-lg transition flex items-center gap-2 cursor-pointer"
              >
                {isApplying ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Applying Changes...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>
                      {strategy === 'replace'
                        ? 'Confirm & Overwrite Database'
                        : strategy === 'merge'
                        ? 'Confirm & Merge Dataset'
                        : 'Confirm & Append Records'}
                    </span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
