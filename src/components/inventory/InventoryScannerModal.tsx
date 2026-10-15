import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { InventoryItem, StockMovement, User } from '../../types';
import { storage } from '../../services/storage';
import { formatCurrency, convertCurrency } from '../../services/currency';
import {
  Camera,
  CameraOff,
  ScanBarcode,
  X,
  CheckCircle2,
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  RefreshCw,
  Plus,
  Minus,
  Sliders,
  Volume2,
  VolumeX,
  Zap,
  RotateCcw,
  Sparkles,
  Search,
  ExternalLink,
  History,
  Box,
  MapPin,
  Building2,
  QrCode,
  Edit3,
  Layers,
  FileText,
  DollarSign,
  PackageCheck,
} from 'lucide-react';

interface InventoryScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: InventoryItem[];
  currentUser: User | null;
  homeCurrency: string;
  onItemUpdated: () => void;
  showToast: (message: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
  onOpenCreateItem?: (initialCode: string) => void;
  onViewInTable?: (itemCode: string) => void;
  onOpenItemQr?: (item: InventoryItem) => void;
  onOpenEditItem?: (item: InventoryItem) => void;
}

interface ScanSessionLog {
  id: string;
  itemCode: string;
  itemName: string;
  type: 'IN' | 'OUT' | 'ADJUST';
  qty: number;
  newBalance: number;
  time: string;
}

// Play synthesizer beep on successful barcode read
const playAudioBeep = (isSuccess = true) => {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    if (isSuccess) {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
      osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.1); // E6
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.15);
    } else {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(300, ctx.currentTime);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.2);
    }

    // Haptic feedback if available on mobile
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(isSuccess ? [80] : [50, 50, 50]);
    }
  } catch {
    // Ignore audio permission or context creation errors
  }
};

export const InventoryScannerModal: React.FC<InventoryScannerModalProps> = ({
  isOpen,
  onClose,
  items,
  currentUser,
  homeCurrency,
  onItemUpdated,
  showToast,
  onOpenCreateItem,
  onViewInTable,
  onOpenItemQr,
  onOpenEditItem,
}) => {
  const [scannerInstance, setScannerInstance] = useState<Html5Qrcode | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameras, setCameras] = useState<{ id: string; label: string }[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [continuousMode, setContinuousMode] = useState(false);
  const [scannerMode, setScannerMode] = useState<'lookup' | 'adjust'>('lookup');

  // Scanned item & update state
  const [scannedRawText, setScannedRawText] = useState<string | null>(null);
  const [matchedItem, setMatchedItem] = useState<InventoryItem | null>(null);
  const [unmatchedCode, setUnmatchedCode] = useState<string | null>(null);

  // Quick Action form inside scanner
  const [actionMode, setActionMode] = useState<'IN' | 'OUT' | 'SET'>('IN');
  const [updateQuantity, setUpdateQuantity] = useState<number>(1);
  const [referenceNo, setReferenceNo] = useState<string>('');
  const [recipientOrProject, setRecipientOrProject] = useState<string>('');
  const [supplierOrBay, setSupplierOrBay] = useState<string>('');
  const [actionNotes, setActionNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Session activity history
  const [sessionLogs, setSessionLogs] = useState<ScanSessionLog[]>([]);

  // Simulator / Manual search state
  const [manualCodeInput, setManualCodeInput] = useState('');

  // Scanner element container ID
  const readerElementId = 'telenest-barcode-reader';
  const scannerRef = useRef<Html5Qrcode | null>(null);

  // Parse raw barcode / QR string and resolve item
  const resolveScannedCode = useCallback(
    (code: string): { item: InventoryItem | null; parsedSku: string } => {
      const trimmed = code.trim();
      let targetSku = trimmed;

      // Check if it's JSON from TeleNest QR modal
      if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
        try {
          const parsed = JSON.parse(trimmed);
          if (parsed.sku) targetSku = parsed.sku;
          else if (parsed.itemCode) targetSku = parsed.itemCode;
          else if (parsed.id) targetSku = parsed.id;
        } catch {
          // fallback to trimmed
        }
      } else {
        // Check for text tag pattern: "SKU: XYZ"
        const skuMatch = trimmed.match(/SKU:\s*([^\s\n\r|]+)/i);
        if (skuMatch && skuMatch[1]) {
          targetSku = skuMatch[1].trim();
        }
      }

      // Look up matching item in inventory (case insensitive)
      const cleanTarget = targetSku.toLowerCase();
      const item =
        items.find(
          (i) =>
            i.itemCode.toLowerCase() === cleanTarget ||
            i.id.toLowerCase() === cleanTarget ||
            i.name.toLowerCase() === cleanTarget
        ) ||
        // Fuzzy match: strip dashes/spaces
        items.find(
          (i) =>
            i.itemCode.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() ===
            cleanTarget.replace(/[^a-zA-Z0-9]/g, '')
        ) ||
        null;

      return { item, parsedSku: targetSku };
    },
    [items]
  );

  // Handle a detected scan
  const handleCodeScanned = useCallback(
    (decodedText: string) => {
      setScannedRawText(decodedText);
      const { item, parsedSku } = resolveScannedCode(decodedText);

      if (soundEnabled) {
        playAudioBeep(Boolean(item));
      }

      if (item) {
        setMatchedItem(item);
        setUnmatchedCode(null);
        setUpdateQuantity(1);
        setReferenceNo(`SCAN-${Date.now().toString().slice(-4)}`);
        setRecipientOrProject('Field Operations Site');
        setSupplierOrBay(item.supplier || 'North Depot Bay');
        setActionNotes(`Barcode scan update (${decodedText.slice(0, 30)})`);
      } else {
        setMatchedItem(null);
        setUnmatchedCode(parsedSku);
        showToast(`Item code "${parsedSku}" not found in inventory.`, 'warning');
      }
    },
    [resolveScannedCode, soundEnabled, showToast]
  );

  // Start Camera Scanner
  const startCamera = useCallback(
    async (cameraIdOrFacing?: string) => {
      setCameraError(null);
      try {
        // Ensure DOM element is present
        const el = document.getElementById(readerElementId);
        if (!el) return;

        // Cleanup existing scanner instance if any
        if (scannerRef.current) {
          try {
            if (scannerRef.current.isScanning) {
              await scannerRef.current.stop();
            }
            await scannerRef.current.clear();
          } catch {
            // ignore
          }
          scannerRef.current = null;
        }

        const formatsToSupport = [
          Html5QrcodeSupportedFormats.QR_CODE,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.ITF,
          Html5QrcodeSupportedFormats.DATA_MATRIX,
        ];

        const html5QrCode = new Html5Qrcode(readerElementId, {
          formatsToSupport,
          verbose: false,
        });

        scannerRef.current = html5QrCode;
        setScannerInstance(html5QrCode);

        // Fetch cameras list if not populated
        try {
          const devices = await Html5Qrcode.getCameras();
          if (devices && devices.length > 0) {
            setCameras(devices);
            if (!selectedCameraId) {
              // Prefer back/environment facing camera
              const backCam = devices.find(
                (d) =>
                  d.label.toLowerCase().includes('back') ||
                  d.label.toLowerCase().includes('rear') ||
                  d.label.toLowerCase().includes('environment')
              );
              setSelectedCameraId(backCam ? backCam.id : devices[0].id);
            }
          }
        } catch {
          // getCameras might be blocked in some iframe permissions
        }

        const cameraConfig = cameraIdOrFacing
          ? { deviceId: { exact: cameraIdOrFacing } }
          : selectedCameraId
          ? { deviceId: { exact: selectedCameraId } }
          : { facingMode: 'environment' };

        await html5QrCode.start(
          cameraConfig,
          {
            fps: 15,
            qrbox: (viewfinderWidth, viewfinderHeight) => {
              const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
              const edgeSize = Math.max(180, Math.floor(minEdge * 0.75));
              return { width: edgeSize, height: edgeSize };
            },
            aspectRatio: 1.0,
          },
          (decodedText) => {
            handleCodeScanned(decodedText);
          },
          () => {
            // Scan frame error - normal while scanning
          }
        );

        setIsScanning(true);
      } catch (err: any) {
        console.warn('Camera start error:', err);
        setIsScanning(false);
        const msg = err?.message || String(err);
        if (msg.includes('NotAllowedError') || msg.includes('Permission denied')) {
          setCameraError(
            'Camera access permission was denied. Please allow camera permissions in your browser bar.'
          );
        } else if (msg.includes('NotFoundError') || msg.includes('no camera')) {
          setCameraError('No active camera detected on this device. You can use manual SKU entry below.');
        } else {
          setCameraError(
            'Camera could not be started in current viewport. You can use manual SKU lookup or test barcodes below.'
          );
        }
      }
    },
    [handleCodeScanned, selectedCameraId]
  );

  // Stop Camera Scanner
  const stopCamera = useCallback(async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        await scannerRef.current.clear();
      } catch (err) {
        console.warn('Error stopping scanner:', err);
      }
      scannerRef.current = null;
      setScannerInstance(null);
    }
    setIsScanning(false);
  }, []);

  // Manage scanner lifecycle on open/close
  useEffect(() => {
    if (isOpen) {
      // Delay slightly for modal DOM mount
      const timer = setTimeout(() => {
        startCamera();
      }, 300);
      return () => {
        clearTimeout(timer);
        stopCamera();
      };
    } else {
      stopCamera();
      setMatchedItem(null);
      setUnmatchedCode(null);
      setScannedRawText(null);
    }
  }, [isOpen, startCamera, stopCamera]);

  // Handle Switch Camera
  const handleCameraChange = async (newCamId: string) => {
    setSelectedCameraId(newCamId);
    await stopCamera();
    startCamera(newCamId);
  };

  // Perform Quick Stock Update
  const handleConfirmStockUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!matchedItem) return;

    setIsSubmitting(true);
    try {
      const qty = Math.max(1, Number(updateQuantity));
      const currentBalance = matchedItem.currentStock;
      let newBalance = currentBalance;
      let movementType: 'IN' | 'OUT' = 'IN';

      if (actionMode === 'IN') {
        newBalance = currentBalance + qty;
        movementType = 'IN';
      } else if (actionMode === 'OUT') {
        if (qty > currentBalance) {
          showToast(
            `Insufficient stock: ${qty} requested, but only ${currentBalance} available.`,
            'error'
          );
          setIsSubmitting(false);
          return;
        }
        newBalance = currentBalance - qty;
        movementType = 'OUT';
      } else if (actionMode === 'SET') {
        // Physical count reconciliation
        const targetPhysical = Number(updateQuantity);
        if (targetPhysical < 0) {
          showToast('Physical count cannot be negative.', 'error');
          setIsSubmitting(false);
          return;
        }
        const delta = targetPhysical - currentBalance;
        if (delta === 0) {
          showToast('Physical count matches current balance (no change needed).', 'info');
          setIsSubmitting(false);
          return;
        }
        movementType = delta > 0 ? 'IN' : 'OUT';
        newBalance = targetPhysical;
      }

      const movementQty =
        actionMode === 'SET' ? Math.abs(Number(updateQuantity) - currentBalance) : qty;

      // Create StockMovement record
      const newMovement: StockMovement = {
        id: `mov_scan_${Date.now()}`,
        itemId: matchedItem.id,
        itemCode: matchedItem.itemCode,
        itemName: matchedItem.name,
        type: movementType,
        quantity: movementQty,
        previousBalance: currentBalance,
        newBalance,
        referenceNo: referenceNo || `SCAN-${Date.now().toString().slice(-4)}`,
        projectOrRecipient:
          recipientOrProject ||
          (movementType === 'IN' ? 'Warehouse North Depot' : 'Field Operations Site'),
        vendorOrSupplier: supplierOrBay || matchedItem.supplier,
        date: new Date().toISOString().split('T')[0],
        unitCost: matchedItem.unitPrice,
        currency: matchedItem.currency || homeCurrency,
        notes: actionNotes || `QR/Barcode Scanner ${movementType} update`,
        createdByUserId: currentUser?.id || 'sys',
        createdByUserName: currentUser?.fullName || 'Warehouse Scanner',
      };

      // Save updated inventory in storage
      const allItems = storage.getInventory();
      const updatedList = allItems.map((it) => {
        if (it.id === matchedItem.id) {
          return {
            ...it,
            currentStock: newBalance,
            totalIn: movementType === 'IN' ? it.totalIn + movementQty : it.totalIn,
            totalOut: movementType === 'OUT' ? it.totalOut + movementQty : it.totalOut,
            lastUpdated: new Date().toISOString(),
          };
        }
        return it;
      });

      storage.saveInventory(updatedList);

      // Save movement
      const allMovements = storage.getMovements();
      storage.saveMovements([newMovement, ...allMovements]);

      // Audit activity
      storage.logActivity({
        userId: currentUser?.id || 'sys',
        userName: currentUser?.fullName || 'Warehouse Scanner',
        userRole: currentUser?.role || 'Standard User',
        action: 'UPDATE',
        module: 'Inventory',
        targetId: matchedItem.id,
        description: `Barcode Scanner: ${movementType} ${movementQty} ${matchedItem.unit} of ${matchedItem.itemCode}. New Balance: ${newBalance} ${matchedItem.unit}`,
      });

      // Update local state and parent
      const updatedMatchedItem = {
        ...matchedItem,
        currentStock: newBalance,
        totalIn: movementType === 'IN' ? matchedItem.totalIn + movementQty : matchedItem.totalIn,
        totalOut: movementType === 'OUT' ? matchedItem.totalOut + movementQty : matchedItem.totalOut,
      };
      setMatchedItem(updatedMatchedItem);

      // Log in session history
      setSessionLogs((prev) => [
        {
          id: String(Date.now()),
          itemCode: matchedItem.itemCode,
          itemName: matchedItem.name,
          type: actionMode === 'SET' ? 'ADJUST' : movementType,
          qty: movementQty,
          newBalance,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        },
        ...prev.slice(0, 9),
      ]);

      showToast(
        `Stock ${movementType} recorded: ${matchedItem.itemCode} is now ${newBalance} ${matchedItem.unit}.`,
        'success'
      );

      onItemUpdated();

      if (continuousMode) {
        // Clear matched item after brief pause so worker can scan next box
        setTimeout(() => {
          setMatchedItem(null);
          setScannedRawText(null);
        }, 1500);
      }
    } catch (err: any) {
      showToast(`Stock update failed: ${err?.message || err}`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Manual code search trigger
  const handleManualSearch = (codeToSearch: string) => {
    if (!codeToSearch.trim()) return;
    handleCodeScanned(codeToSearch.trim());
    setManualCodeInput('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-2xl shadow-2xl overflow-hidden text-[var(--text-main)]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--border-main)] bg-[var(--bg-card)]/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-600/15 text-blue-400 border border-blue-500/30">
              <ScanBarcode className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-[var(--text-main)]">
                  Warehouse Barcode & QR Scanner
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live Camera
                </span>
              </div>
              <p className="text-xs text-[var(--text-muted)]">
                Point camera at 1D barcodes or 2D QR tags for rapid stock adjustments & check-in
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Audio Toggle */}
            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 rounded-lg border transition cursor-pointer ${
                soundEnabled
                  ? 'bg-blue-500/15 border-blue-500/30 text-blue-400'
                  : 'bg-[var(--bg-input)] border-[var(--border-main)] text-[var(--text-dim)]'
              }`}
              title={soundEnabled ? 'Mute Scan Beep' : 'Enable Scan Audio Beep'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Continuous Scan Toggle */}
            <button
              type="button"
              onClick={() => setContinuousMode(!continuousMode)}
              className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                continuousMode
                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                  : 'bg-[var(--bg-input)] border-[var(--border-main)] text-[var(--text-dim)]'
              }`}
              title="Continuously scan items one after another"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Continuous</span>
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-[var(--text-dim)] hover:text-[var(--text-main)] hover:bg-[var(--bg-hover)] transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left Column: Camera Viewport (5 cols) */}
          <div className="lg:col-span-5 flex flex-col space-y-3">
            <div className="relative rounded-2xl overflow-hidden bg-black border border-[var(--border-main)] aspect-square flex flex-col items-center justify-center shadow-inner group">
              {/* HTML5 QR Code Mount Node */}
              <div id={readerElementId} className="w-full h-full object-cover" />

              {/* Viewfinder Decorative Framing Overlay */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-8">
                <div className="relative w-48 h-48 border-2 border-dashed border-blue-400/60 rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(59,130,246,0.2)]">
                  {/* Corner Target Reticles */}
                  <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-blue-400" />
                  <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-blue-400" />
                  <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-blue-400" />
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-blue-400" />

                  {/* Laser Scan Animation Line */}
                  <div className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-red-500 to-transparent animate-bounce opacity-80" />
                </div>
              </div>

              {/* Camera Error / Fallback State */}
              {cameraError && (
                <div className="absolute inset-0 bg-black/90 p-5 flex flex-col items-center justify-center text-center space-y-3">
                  <div className="p-3 rounded-full bg-rose-500/20 text-rose-400">
                    <CameraOff className="w-8 h-8" />
                  </div>
                  <div className="text-xs font-semibold text-rose-300 max-w-xs">{cameraError}</div>
                  <button
                    type="button"
                    onClick={() => startCamera()}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Retry Camera</span>
                  </button>
                </div>
              )}
            </div>

            {/* Camera Controls & Switcher */}
            <div className="flex items-center justify-between gap-2 text-xs">
              {cameras.length > 1 ? (
                <div className="flex items-center gap-2 flex-1">
                  <Camera className="w-3.5 h-3.5 text-[var(--text-dim)]" />
                  <select
                    value={selectedCameraId}
                    onChange={(e) => handleCameraChange(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-[var(--bg-input)] border border-[var(--border-main)] text-xs text-[var(--text-main)]"
                  >
                    {cameras.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label || `Camera ${c.id.slice(0, 6)}`}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="text-[11px] text-[var(--text-dim)] flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-blue-400" />
                  <span>Optimal lighting: Hold barcode 10-25 cm from lens</span>
                </div>
              )}

              <button
                type="button"
                onClick={() => (isScanning ? stopCamera() : startCamera())}
                className="px-2.5 py-1.5 rounded-lg bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] border border-[var(--border-main)] text-[11px] font-semibold text-[var(--text-muted)] cursor-pointer"
              >
                {isScanning ? 'Pause Camera' : 'Resume'}
              </button>
            </div>

            {/* Manual Barcode / SKU Tester Bar */}
            <div className="p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-main)] space-y-2">
              <div className="flex items-center justify-between text-[11px] font-semibold text-[var(--text-dim)]">
                <span className="flex items-center gap-1">
                  <Search className="w-3 h-3" />
                  Manual SKU / Barcode Simulator
                </span>
                <span className="text-[10px] text-[var(--text-dim)]">Desktop & Test Input</span>
              </div>

              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={manualCodeInput}
                  onChange={(e) => setManualCodeInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleManualSearch(manualCodeInput);
                    }
                  }}
                  placeholder="e.g. SKU-FBR-001 or type code..."
                  className="flex-1 px-2.5 py-1.5 rounded-lg bg-[var(--bg-input)] border border-[var(--border-main)] text-xs text-[var(--text-main)] font-mono"
                />
                <button
                  type="button"
                  onClick={() => handleManualSearch(manualCodeInput)}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition cursor-pointer"
                >
                  Lookup
                </button>
              </div>

              {/* Sample Quick-Test Pills */}
              <div className="flex items-center gap-1 flex-wrap pt-1">
                <span className="text-[10px] text-[var(--text-dim)]">Test Codes:</span>
                {items.slice(0, 4).map((it) => (
                  <button
                    key={it.id}
                    type="button"
                    onClick={() => handleManualSearch(it.itemCode)}
                    className="px-2 py-0.5 rounded-md bg-[var(--bg-surface)] hover:bg-blue-500/20 border border-[var(--border-main)] text-[10px] font-mono text-[var(--text-muted)] hover:text-blue-400 transition cursor-pointer"
                  >
                    {it.itemCode}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Matched Item & Quick Stock Operations (7 cols) */}
          <div className="lg:col-span-7 flex flex-col space-y-4">
            {/* If Item Matched */}
            {matchedItem ? (
              <div className="rounded-2xl bg-[var(--bg-card)] border border-[var(--border-main)] p-4 sm:p-5 space-y-4 shadow-sm animate-in fade-in">
                {/* Item Details Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border-main)] pb-3.5">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2.5 py-0.5 rounded-full font-mono text-xs font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30">
                        {matchedItem.itemCode}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[var(--bg-surface)] border border-[var(--border-main)] text-[var(--text-muted)]">
                        {matchedItem.category}
                      </span>
                      {matchedItem.currentStock <= matchedItem.minThreshold ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          Low Stock
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Healthy Stock
                        </span>
                      )}
                    </div>
                    <h4 className="text-base font-bold text-[var(--text-main)] leading-snug">
                      {matchedItem.name}
                    </h4>
                    <div className="flex items-center gap-4 text-xs text-[var(--text-dim)] pt-0.5">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-[var(--text-dim)]" />
                        {matchedItem.location || 'Warehouse Depot'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3 h-3 text-[var(--text-dim)]" />
                        {matchedItem.supplier || 'Standard Supplier'}
                      </span>
                    </div>
                  </div>

                  {/* Current Balance Display */}
                  <div className="p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-main)] text-right min-w-[130px]">
                    <div className="text-[10px] uppercase font-bold text-[var(--text-dim)] tracking-wider">
                      Current Stock
                    </div>
                    <div className="text-2xl font-mono font-extrabold text-[var(--text-main)]">
                      {matchedItem.currentStock.toLocaleString()}
                    </div>
                    <div className="text-[10px] font-medium text-[var(--text-dim)]">
                      {matchedItem.unit} (Min: {matchedItem.minThreshold})
                    </div>
                  </div>
                </div>

                {/* Operational Mode Switcher Tabs */}
                <div className="flex items-center gap-2 p-1 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-main)]">
                  <button
                    type="button"
                    onClick={() => setScannerMode('lookup')}
                    className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                      scannerMode === 'lookup'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                    }`}
                  >
                    <Search className="w-3.5 h-3.5" />
                    <span>Quick Item Lookup &amp; Specs</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setScannerMode('adjust')}
                    className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                      scannerMode === 'adjust'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                    }`}
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>Rapid Stock Adjustment (IN / OUT / SET)</span>
                  </button>
                </div>

                {/* MODE 1: Quick Item Lookup & Inspection */}
                {scannerMode === 'lookup' ? (
                  <div className="space-y-4 animate-in fade-in">
                    {/* Stock Health Meter */}
                    {(() => {
                      const healthPercent = Math.min(
                        100,
                        Math.round(
                          (matchedItem.currentStock / Math.max(1, (matchedItem.minThreshold || 10) * 2)) * 100
                        )
                      );
                      const totalValueNative = matchedItem.currentStock * matchedItem.unitPrice;
                      const totalValueHome = convertCurrency(
                        totalValueNative,
                        matchedItem.currency || 'USD',
                        homeCurrency
                      );
                      const isLow = matchedItem.currentStock <= matchedItem.minThreshold;

                      return (
                        <div className="p-3.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-main)] space-y-2.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-[var(--text-muted)]">Stock Health Buffer</span>
                            <span className="font-mono font-bold text-[var(--text-main)]">
                              {healthPercent}% Capacity ({matchedItem.currentStock} / Min: {matchedItem.minThreshold} {matchedItem.unit})
                            </span>
                          </div>
                          <div className="w-full h-2 rounded-full bg-[var(--bg-card)] border border-[var(--border-main)] overflow-hidden">
                            <div
                              className={`h-full transition-all duration-500 rounded-full ${
                                isLow
                                  ? 'bg-rose-500'
                                  : healthPercent < 50
                                  ? 'bg-amber-500'
                                  : 'bg-emerald-500'
                              }`}
                              style={{ width: `${healthPercent}%` }}
                            />
                          </div>
                        </div>
                      );
                    })()}

                    {/* Detailed Specifications Grid */}
                    {(() => {
                      const totalValueNative = matchedItem.currentStock * matchedItem.unitPrice;
                      const totalValueHome = convertCurrency(
                        totalValueNative,
                        matchedItem.currency || 'USD',
                        homeCurrency
                      );

                      return (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                          <div className="p-2.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-main)]">
                            <div className="text-[10px] text-[var(--text-dim)] uppercase font-semibold">
                              Unit Price
                            </div>
                            <div className="font-mono font-bold text-[var(--text-main)] mt-0.5">
                              {formatCurrency(matchedItem.unitPrice, matchedItem.currency)}
                            </div>
                            <div className="text-[10px] text-[var(--text-dim)]">per {matchedItem.unit}</div>
                          </div>

                          <div className="p-2.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-main)]">
                            <div className="text-[10px] text-[var(--text-dim)] uppercase font-semibold">
                              Total SKU Valuation
                            </div>
                            <div className="font-mono font-bold text-emerald-400 mt-0.5">
                              {formatCurrency(totalValueHome, homeCurrency)}
                            </div>
                            <div className="text-[10px] text-[var(--text-dim)] truncate">
                              ({formatCurrency(totalValueNative, matchedItem.currency)})
                            </div>
                          </div>

                          <div className="p-2.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-main)]">
                            <div className="text-[10px] text-[var(--text-dim)] uppercase font-semibold">
                              Warehouse Bay / Shelf
                            </div>
                            <div className="font-bold text-[var(--text-main)] mt-0.5 truncate">
                              {matchedItem.location || 'Depot Floor'}
                            </div>
                            <div className="text-[10px] text-[var(--text-dim)]">Physical Location</div>
                          </div>

                          <div className="p-2.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-main)]">
                            <div className="text-[10px] text-[var(--text-dim)] uppercase font-semibold">
                              Lifetime Received
                            </div>
                            <div className="font-mono font-bold text-emerald-400 mt-0.5">
                              +{matchedItem.totalIn.toLocaleString()} {matchedItem.unit}
                            </div>
                            <div className="text-[10px] text-[var(--text-dim)]">Total Stock IN</div>
                          </div>

                          <div className="p-2.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-main)]">
                            <div className="text-[10px] text-[var(--text-dim)] uppercase font-semibold">
                              Lifetime Dispatched
                            </div>
                            <div className="font-mono font-bold text-amber-400 mt-0.5">
                              -{matchedItem.totalOut.toLocaleString()} {matchedItem.unit}
                            </div>
                            <div className="text-[10px] text-[var(--text-dim)]">Total Stock OUT</div>
                          </div>

                          <div className="p-2.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-main)]">
                            <div className="text-[10px] text-[var(--text-dim)] uppercase font-semibold">
                              Vendor / Manufacturer
                            </div>
                            <div className="font-bold text-[var(--text-main)] mt-0.5 truncate">
                              {matchedItem.supplier || 'Standard Telecom'}
                            </div>
                            <div className="text-[10px] text-[var(--text-dim)]">Supplier</div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Description if present */}
                    {matchedItem.description && (
                      <div className="p-2.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-main)] text-xs">
                        <div className="text-[10px] text-[var(--text-dim)] uppercase font-semibold mb-0.5">
                          Technical Specs &amp; Notes
                        </div>
                        <p className="text-[var(--text-muted)] text-[11px] leading-relaxed">
                          {matchedItem.description}
                        </p>
                      </div>
                    )}

                    {/* Recent Item Movement History */}
                    {(() => {
                      const itemMovements = storage
                        .getMovements()
                        .filter(
                          (m) =>
                            m.itemId === matchedItem.id ||
                            m.itemCode.toLowerCase() === matchedItem.itemCode.toLowerCase()
                        )
                        .slice(0, 4);

                      return (
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs font-semibold text-[var(--text-dim)]">
                            <span className="flex items-center gap-1.5">
                              <History className="w-3.5 h-3.5 text-blue-400" />
                              <span>Recent Transactions for this SKU</span>
                            </span>
                            <span className="text-[10px] font-mono">Last {itemMovements.length} events</span>
                          </div>

                          {itemMovements.length === 0 ? (
                            <div className="p-3 rounded-lg bg-[var(--bg-surface)] border border-dashed border-[var(--border-main)] text-center text-xs text-[var(--text-dim)]">
                              No previous movements recorded for this item.
                            </div>
                          ) : (
                            <div className="divide-y divide-[var(--border-main)] rounded-lg bg-[var(--bg-surface)] border border-[var(--border-main)] overflow-hidden">
                              {itemMovements.map((mov) => (
                                <div
                                  key={mov.id}
                                  className="p-2 flex items-center justify-between text-[11px]"
                                >
                                  <div className="flex items-center gap-2">
                                    <span
                                      className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold ${
                                        mov.type === 'IN'
                                          ? 'bg-emerald-500/15 text-emerald-400'
                                          : 'bg-amber-500/15 text-amber-400'
                                      }`}
                                    >
                                      {mov.type}
                                    </span>
                                    <span className="font-mono text-[var(--text-main)] font-semibold">
                                      {mov.referenceNo}
                                    </span>
                                    <span className="text-[var(--text-dim)] truncate max-w-[140px]">
                                      {mov.projectOrRecipient}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 font-mono">
                                    <span className="font-bold text-[var(--text-main)]">
                                      {mov.type === 'IN' ? `+${mov.quantity}` : `-${mov.quantity}`} {matchedItem.unit}
                                    </span>
                                    <span className="text-[10px] text-[var(--text-dim)]">{mov.date}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })()}

                    {/* Quick Lookup Action Toolbar */}
                    <div className="pt-2 grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <button
                        type="button"
                        onClick={() => setScannerMode('adjust')}
                        className="py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition shadow cursor-pointer"
                      >
                        <Zap className="w-3.5 h-3.5" />
                        <span>Adjust Stock</span>
                      </button>

                      {onOpenItemQr && (
                        <button
                          type="button"
                          onClick={() => onOpenItemQr(matchedItem)}
                          className="py-2 px-3 rounded-xl bg-[var(--bg-surface)] hover:bg-[var(--bg-hover)] border border-[var(--border-main)] text-[var(--text-main)] font-semibold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                        >
                          <QrCode className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Show QR Tag</span>
                        </button>
                      )}

                      {onViewInTable && (
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onViewInTable(matchedItem.itemCode);
                          }}
                          className="py-2 px-3 rounded-xl bg-[var(--bg-surface)] hover:bg-[var(--bg-hover)] border border-[var(--border-main)] text-[var(--text-main)] font-semibold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                        >
                          <Box className="w-3.5 h-3.5 text-blue-400" />
                          <span>Table Row</span>
                        </button>
                      )}

                      {onOpenEditItem && (
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onOpenEditItem(matchedItem);
                          }}
                          className="py-2 px-3 rounded-xl bg-[var(--bg-surface)] hover:bg-[var(--bg-hover)] border border-[var(--border-main)] text-[var(--text-main)] font-semibold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Edit Specs</span>
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  /* MODE 2: Rapid Stock Adjustment */
                  <div className="space-y-3 animate-in fade-in">
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setActionMode('IN');
                          setUpdateQuantity(1);
                        }}
                        className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition cursor-pointer ${
                          actionMode === 'IN'
                            ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                            : 'bg-[var(--bg-surface)] border-[var(--border-main)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
                        }`}
                      >
                        <ArrowDownLeft className="w-4 h-4" />
                        <span>Stock IN (+ Receive)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setActionMode('OUT');
                          setUpdateQuantity(1);
                        }}
                        className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition cursor-pointer ${
                          actionMode === 'OUT'
                            ? 'bg-amber-600 text-white border-amber-500 shadow-sm'
                            : 'bg-[var(--bg-surface)] border-[var(--border-main)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
                        }`}
                      >
                        <ArrowUpRight className="w-4 h-4" />
                        <span>Stock OUT (- Dispatch)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setActionMode('SET');
                          setUpdateQuantity(matchedItem.currentStock);
                        }}
                        className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition cursor-pointer ${
                          actionMode === 'SET'
                            ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                            : 'bg-[var(--bg-surface)] border-[var(--border-main)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
                        }`}
                      >
                        <Sliders className="w-4 h-4" />
                        <span>Audit Count (= Set)</span>
                      </button>
                    </div>

                    {/* Stock Update Form */}
                    <form onSubmit={handleConfirmStockUpdate} className="space-y-3 text-xs">
                      {/* Quantity Quick Selector & Input */}
                      <div className="p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-main)] space-y-2.5">
                        <div className="flex items-center justify-between">
                          <label className="font-bold text-[var(--text-main)]">
                            {actionMode === 'IN'
                              ? `Receive Quantity (+ ${matchedItem.unit})`
                              : actionMode === 'OUT'
                              ? `Dispatch Quantity (- ${matchedItem.unit})`
                              : `Physical Counted Balance (${matchedItem.unit})`}
                          </label>
                          <span className="text-[11px] font-mono text-[var(--text-dim)]">
                            Resulting Balance:{' '}
                            <strong className="text-[var(--text-main)] font-bold">
                              {actionMode === 'IN'
                                ? matchedItem.currentStock + Number(updateQuantity || 0)
                                : actionMode === 'OUT'
                                ? Math.max(0, matchedItem.currentStock - Number(updateQuantity || 0))
                                : Number(updateQuantity || 0)}{' '}
                              {matchedItem.unit}
                            </strong>
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setUpdateQuantity((q) => Math.max(1, q - 1))}
                            className="w-9 h-9 rounded-lg bg-[var(--bg-card)] border border-[var(--border-main)] flex items-center justify-center font-bold text-base hover:bg-[var(--bg-hover)] cursor-pointer"
                          >
                            <Minus className="w-4 h-4" />
                          </button>

                          <input
                            type="number"
                            min={actionMode === 'SET' ? 0 : 1}
                            max={actionMode === 'OUT' ? matchedItem.currentStock : 999999}
                            required
                            value={updateQuantity}
                            onChange={(e) => setUpdateQuantity(parseInt(e.target.value) || 0)}
                            className="flex-1 px-3 py-2 text-center text-lg font-mono font-bold rounded-lg bg-[var(--bg-input)] border border-[var(--border-main)] text-[var(--text-main)]"
                          />

                          <button
                            type="button"
                            onClick={() => setUpdateQuantity((q) => q + 1)}
                            className="w-9 h-9 rounded-lg bg-[var(--bg-card)] border border-[var(--border-main)] flex items-center justify-center font-bold text-base hover:bg-[var(--bg-hover)] cursor-pointer"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Quick Presets */}
                        {actionMode !== 'SET' && (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] text-[var(--text-dim)] font-semibold">
                              Quick Add:
                            </span>
                            {[1, 5, 10, 25, 50, 100].map((preset) => (
                              <button
                                key={preset}
                                type="button"
                                onClick={() => setUpdateQuantity(preset)}
                                className="px-2 py-0.5 rounded-md bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] border border-[var(--border-main)] text-[10px] font-mono text-[var(--text-muted)] cursor-pointer"
                              >
                                +{preset}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Operational Details */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div>
                          <label className="block text-[11px] font-semibold text-[var(--text-muted)] mb-1">
                            Reference / PO Number
                          </label>
                          <input
                            type="text"
                            required
                            value={referenceNo}
                            onChange={(e) => setReferenceNo(e.target.value)}
                            placeholder="e.g. PO-8812 or DISP-G11"
                            className="w-full px-2.5 py-1.5 rounded-lg bg-[var(--bg-input)] border border-[var(--border-main)] text-xs text-[var(--text-main)] font-mono"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-[var(--text-muted)] mb-1">
                            {actionMode === 'IN' ? 'Receiving Bay / Storage' : 'Project / Destination'}
                          </label>
                          <input
                            type="text"
                            required
                            value={recipientOrProject}
                            onChange={(e) => setRecipientOrProject(e.target.value)}
                            placeholder={
                              actionMode === 'IN'
                                ? 'Warehouse Bay A-12'
                                : 'Sector G-11 FTTH Project Site'
                            }
                            className="w-full px-2.5 py-1.5 rounded-lg bg-[var(--bg-input)] border border-[var(--border-main)] text-xs text-[var(--text-main)]"
                          />
                        </div>
                      </div>

                      {/* Action Confirmation Button */}
                      <div className="pt-2 flex items-center justify-between gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            setMatchedItem(null);
                            setScannedRawText(null);
                          }}
                          className="px-3 py-2 rounded-lg bg-[var(--bg-surface)] hover:bg-[var(--bg-hover)] border border-[var(--border-main)] text-xs font-semibold text-[var(--text-muted)] cursor-pointer"
                        >
                          Clear &amp; Scan Next
                        </button>

                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className={`flex-1 flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow transition cursor-pointer ${
                            actionMode === 'IN'
                              ? 'bg-emerald-600 hover:bg-emerald-500'
                              : actionMode === 'OUT'
                              ? 'bg-amber-600 hover:bg-amber-500'
                              : 'bg-blue-600 hover:bg-blue-500'
                          }`}
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>
                            {isSubmitting
                              ? 'Updating Inventory...'
                              : actionMode === 'IN'
                              ? `Confirm Stock IN (+${updateQuantity} ${matchedItem.unit})`
                              : actionMode === 'OUT'
                              ? `Confirm Stock OUT (-${updateQuantity} ${matchedItem.unit})`
                              : `Save Physical Count (${updateQuantity} ${matchedItem.unit})`}
                          </span>
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            ) : unmatchedCode ? (
              /* Unmatched SKU / Barcode Alert */
              <div className="rounded-2xl bg-[var(--bg-card)] border border-amber-500/30 p-5 space-y-4 shadow-sm animate-in fade-in">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[var(--text-main)]">
                      Unrecognized Barcode / SKU
                    </h4>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">
                      Scanned code{' '}
                      <code className="px-1.5 py-0.5 rounded bg-[var(--bg-surface)] font-mono text-amber-400 font-bold">
                        {unmatchedCode}
                      </code>{' '}
                      is not registered in the inventory database.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  {onOpenCreateItem && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenCreateItem(unmatchedCode);
                      }}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-bold shadow transition cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Register New SKU with this Code</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setUnmatchedCode(null);
                      setScannedRawText(null);
                    }}
                    className="px-3 py-2 rounded-xl bg-[var(--bg-surface)] hover:bg-[var(--bg-hover)] border border-[var(--border-main)] text-xs font-semibold text-[var(--text-muted)] cursor-pointer"
                  >
                    Try Another Barcode
                  </button>
                </div>
              </div>
            ) : (
              /* Ready / Idle Guidance View */
              <div className="rounded-2xl bg-[var(--bg-card)] border border-dashed border-[var(--border-main)] p-8 flex flex-col items-center justify-center text-center space-y-3 min-h-[280px]">
                <div className="p-3.5 rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20 animate-pulse">
                  <ScanBarcode className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[var(--text-main)]">
                    Awaiting Barcode or QR Tag
                  </h4>
                  <p className="text-xs text-[var(--text-muted)] max-w-sm mt-1">
                    Hold any material tag, equipment box, fiber drum label, or optical patch cord
                    barcode in front of the camera. The item details and quick-update controls will
                    appear automatically.
                  </p>
                </div>
              </div>
            )}

            {/* Session Activity Log (Recent Scans) */}
            {sessionLogs.length > 0 && (
              <div className="rounded-xl bg-[var(--bg-card)] border border-[var(--border-main)] p-3 space-y-2">
                <div className="flex items-center justify-between text-xs text-[var(--text-dim)] font-semibold">
                  <span className="flex items-center gap-1.5">
                    <History className="w-3.5 h-3.5 text-blue-400" />
                    Current Session Scanned Items ({sessionLogs.length})
                  </span>
                  <button
                    type="button"
                    onClick={() => setSessionLogs([])}
                    className="text-[10px] text-[var(--text-dim)] hover:text-[var(--text-main)]"
                  >
                    Clear History
                  </button>
                </div>

                <div className="divide-y divide-[var(--border-main)] max-h-36 overflow-y-auto">
                  {sessionLogs.map((log) => (
                    <div
                      key={log.id}
                      className="py-1.5 flex items-center justify-between text-[11px]"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold ${
                            log.type === 'IN'
                              ? 'bg-emerald-500/15 text-emerald-400'
                              : log.type === 'OUT'
                              ? 'bg-amber-500/15 text-amber-400'
                              : 'bg-blue-500/15 text-blue-400'
                          }`}
                        >
                          {log.type}
                        </span>
                        <span className="font-mono font-bold text-[var(--text-main)]">
                          {log.itemCode}
                        </span>
                        <span className="text-[var(--text-muted)] truncate max-w-[160px]">
                          {log.itemName}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-semibold text-[var(--text-main)]">
                          {log.type === 'IN' ? `+${log.qty}` : log.type === 'OUT' ? `-${log.qty}` : `=${log.qty}`}
                        </span>
                        <span className="text-[10px] text-[var(--text-dim)]">{log.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
