import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { storage, DEFAULT_INVENTORY_CATEGORIES } from '../../services/storage';
import { InventoryItem, StockMovement } from '../../types';
import { convertCurrency, formatCurrency } from '../../services/currency';
import { ConfirmDeleteModal } from '../common/ConfirmDeleteModal';
import { ItemQRCodeModal } from '../common/ItemQRCodeModal';
import { BatchQRModal } from '../common/BatchQRModal';
import { InventoryScannerModal } from './InventoryScannerModal';
import {
  Box,
  ArrowDownUp,
  Plus,
  Search,
  Filter,
  Download,
  FileSpreadsheet,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownLeft,
  Edit2,
  Trash2,
  History,
  CheckCircle2,
  X,
  Printer,
  ChevronRight,
  QrCode,
  Tag,
  Tags,
  FolderPlus,
  ScanBarcode,
} from 'lucide-react';

export const InventoryModule: React.FC = () => {
  const {
    currentUser,
    subTab,
    setSubTab,
    homeCurrency,
    exchangeRates,
    openLetterheadModal,
    showToast,
    triggerDataRefresh,
    canAccessFeature,
    inventoryCategories,
    addInventoryCategory,
    deleteInventoryCategory,
  } = useApp();

  const [items, setItems] = useState<InventoryItem[]>(() => storage.getInventory());
  const [movements, setMovements] = useState<StockMovement[]>(() => storage.getMovements());

  // Search & Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedStockStatus, setSelectedStockStatus] = useState<'ALL' | 'LOW' | 'HEALTHY'>('ALL');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Modals
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<InventoryItem | null>(null);
  const [isDeletingItem, setIsDeletingItem] = useState(false);
  const [movementToDelete, setMovementToDelete] = useState<StockMovement | null>(null);
  const [isDeletingMovement, setIsDeletingMovement] = useState(false);
  const [qrItem, setQrItem] = useState<InventoryItem | null>(null);
  const [isBatchQrOpen, setIsBatchQrOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannedInitialCodeForCreate, setScannedInitialCodeForCreate] = useState<string>('');

  // Category Management Modal & SKU Modal Custom Category States
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCategoryModalInput, setNewCategoryModalInput] = useState('');
  const [selectedCategoryInModal, setSelectedCategoryInModal] = useState<string>('Fiber Optics');
  const [isAddingCustomCategory, setIsAddingCustomCategory] = useState(false);
  const [customCategoryInput, setCustomCategoryInput] = useState('');

  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
  const [movementForm, setMovementForm] = useState({
    itemId: '',
    type: 'IN' as 'IN' | 'OUT',
    quantity: 1,
    referenceNo: '',
    projectOrRecipient: '',
    vendorOrSupplier: '',
    unitCost: 0,
    currency: homeCurrency,
    notes: '',
  });

  const [viewHistoryItem, setViewHistoryItem] = useState<InventoryItem | null>(null);

  // Dynamic categories including standard defaults and custom user-created categories
  const categories = useMemo(() => {
    return ['ALL', ...inventoryCategories];
  }, [inventoryCategories]);

  // Refresh local data
  const reloadData = () => {
    setItems(storage.getInventory());
    setMovements(storage.getMovements());
    triggerDataRefresh();
  };

  // Filtered inventory items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch =
        item.itemCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.supplier.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCat = selectedCategory === 'ALL' || item.category === selectedCategory;

      const isLow = item.currentStock <= item.minThreshold;
      const matchesStatus =
        selectedStockStatus === 'ALL' ||
        (selectedStockStatus === 'LOW' && isLow) ||
        (selectedStockStatus === 'HEALTHY' && !isLow);

      return matchesSearch && matchesCat && matchesStatus;
    });
  }, [items, searchQuery, selectedCategory, selectedStockStatus]);

  // Filtered movements
  const filteredMovements = useMemo(() => {
    return movements.filter((mov) => {
      const matchesSearch =
        mov.itemCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        mov.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        mov.referenceNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        mov.projectOrRecipient.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesItem = !viewHistoryItem || mov.itemId === viewHistoryItem.id;

      let matchesDate = true;
      if (dateFrom) matchesDate = matchesDate && mov.date >= dateFrom;
      if (dateTo) matchesDate = matchesDate && mov.date <= dateTo;

      return matchesSearch && matchesItem && matchesDate;
    });
  }, [movements, searchQuery, viewHistoryItem, dateFrom, dateTo]);

  // Handle Save Item (Add/Edit)
  const handleSaveItem = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const itemCode = formData.get('itemCode') as string;
    const name = formData.get('name') as string;
    const rawCategory = (formData.get('category') as string) || '';
    const customCategoryName = (formData.get('customCategoryName') as string) || '';

    // Determine final category (supporting custom newly created categories)
    let category = selectedCategoryInModal;
    if (isAddingCustomCategory && customCategoryInput.trim()) {
      category = customCategoryInput.trim();
      addInventoryCategory(category);
    } else if (rawCategory === '__ADD_CUSTOM__' && customCategoryName.trim()) {
      category = customCategoryName.trim();
      addInventoryCategory(category);
    } else if (customCategoryName.trim()) {
      category = customCategoryName.trim();
      addInventoryCategory(category);
    } else if (selectedCategoryInModal) {
      category = selectedCategoryInModal;
    } else if (rawCategory && rawCategory !== '__ADD_CUSTOM__') {
      category = rawCategory;
    } else {
      category = 'Fiber Optics';
    }

    const unit = formData.get('unit') as any;
    const minThreshold = parseFloat(formData.get('minThreshold') as string) || 0;
    const unitPrice = parseFloat(formData.get('unitPrice') as string) || 0;
    const currency = (formData.get('currency') as string) || homeCurrency;
    const location = (formData.get('location') as string) || '';
    const supplier = (formData.get('supplier') as string) || '';
    const description = (formData.get('description') as string) || '';

    if (editingItem) {
      // Update
      const updated = items.map((it) =>
        it.id === editingItem.id
          ? {
              ...it,
              itemCode,
              name,
              category,
              unit,
              minThreshold,
              unitPrice,
              currency,
              location,
              supplier,
              description,
              lastUpdated: new Date().toISOString(),
              lastUpdatedByUserId: currentUser?.id,
              lastUpdatedByUserName: currentUser?.fullName,
            }
          : it
      );
      storage.saveInventory(updated);
      storage.logActivity({
        userId: currentUser?.id || 'sys',
        userName: currentUser?.fullName || 'User',
        userRole: currentUser?.role || 'Standard User',
        action: 'UPDATE',
        module: 'Inventory',
        targetId: editingItem.id,
        description: `Updated inventory item ${itemCode} - ${name}`,
      });
      showToast(`Item ${itemCode} updated successfully.`, 'success');
    } else {
      // Create
      const newItem: InventoryItem = {
        id: `inv_${Date.now()}`,
        itemCode,
        name,
        category,
        unit,
        currentStock: 0,
        totalIn: 0,
        totalOut: 0,
        minThreshold,
        unitPrice,
        currency,
        location,
        supplier,
        description,
        lastUpdated: new Date().toISOString(),
        createdByUserId: currentUser?.id,
        createdByUserName: currentUser?.fullName,
        lastUpdatedByUserId: currentUser?.id,
        lastUpdatedByUserName: currentUser?.fullName,
      };
      storage.saveInventory([...items, newItem]);
      storage.logActivity({
        userId: currentUser?.id || 'sys',
        userName: currentUser?.fullName || 'User',
        userRole: currentUser?.role || 'Standard User',
        action: 'CREATE',
        module: 'Inventory',
        targetId: newItem.id,
        description: `Created new inventory master record ${itemCode} (${name})`,
      });
      showToast(`Item ${itemCode} created successfully.`, 'success');
    }

    setIsItemModalOpen(false);
    setEditingItem(null);
    reloadData();
  };

  // Handle Delete Item
  const handleDeleteItem = (item: InventoryItem) => {
    setItemToDelete(item);
  };

  // Confirm Delete Item
  const handleConfirmDeleteItem = () => {
    if (!itemToDelete) return;
    setIsDeletingItem(true);
    try {
      const stored = storage.getInventory();
      const updated = stored.filter((i) => i.id !== itemToDelete.id);
      storage.saveInventory(updated);
      setItems(updated);
      storage.logActivity({
        userId: currentUser?.id || 'sys',
        userName: currentUser?.fullName || 'User',
        userRole: currentUser?.role || 'Standard User',
        action: 'DELETE',
        module: 'Inventory',
        targetId: itemToDelete.id,
        description: `Deleted inventory item ${itemToDelete.itemCode} - ${itemToDelete.name}`,
      });
      showToast(`Item ${itemToDelete.itemCode} (${itemToDelete.name}) permanently deleted.`, 'warning');
      setItemToDelete(null);
      reloadData();
      triggerDataRefresh();
    } catch (err: any) {
      showToast(`Failed to delete item: ${err?.message || err}`, 'error');
    } finally {
      setIsDeletingItem(false);
    }
  };

  // Delete Movement Log Record
  const handleDeleteMovement = (m: StockMovement) => {
    setMovementToDelete(m);
  };

  const handleConfirmDeleteMovement = () => {
    if (!movementToDelete) return;
    setIsDeletingMovement(true);
    try {
      const stored = storage.getMovements();
      const updated = stored.filter((m) => m.id !== movementToDelete.id);
      storage.saveMovements(updated);
      setMovements(updated);
      storage.logActivity({
        userId: currentUser?.id || 'sys',
        userName: currentUser?.fullName || 'User',
        userRole: currentUser?.role || 'Standard User',
        action: 'DELETE',
        module: 'Inventory',
        targetId: movementToDelete.id,
        description: `Deleted stock movement log ${movementToDelete.referenceNo} (${movementToDelete.type}) for ${movementToDelete.itemCode}`,
      });
      showToast(`Movement log ${movementToDelete.referenceNo} permanently removed.`, 'warning');
      setMovementToDelete(null);
      reloadData();
      triggerDataRefresh();
    } catch (err: any) {
      showToast(`Failed to delete movement record: ${err?.message || err}`, 'error');
    } finally {
      setIsDeletingMovement(false);
    }
  };

  // Handle Record Stock Movement (IN / OUT)
  const handleSaveMovement = (e: React.FormEvent) => {
    e.preventDefault();
    const targetItem = items.find((i) => i.id === movementForm.itemId);
    if (!targetItem) {
      showToast('Please select a valid item.', 'error');
      return;
    }

    const qty = Math.max(1, Number(movementForm.quantity));
    if (movementForm.type === 'OUT' && qty > targetItem.currentStock) {
      showToast(`Cannot dispatch ${qty} ${targetItem.unit}. Available stock is only ${targetItem.currentStock} ${targetItem.unit}.`, 'error');
      return;
    }

    const previousBalance = targetItem.currentStock;
    const newBalance =
      movementForm.type === 'IN' ? previousBalance + qty : previousBalance - qty;

    const newMovement: StockMovement = {
      id: `mov_${Date.now()}`,
      itemId: targetItem.id,
      itemCode: targetItem.itemCode,
      itemName: targetItem.name,
      type: movementForm.type,
      quantity: qty,
      previousBalance,
      newBalance,
      referenceNo: movementForm.referenceNo || `REF-${Date.now().toString().slice(-4)}`,
      projectOrRecipient: movementForm.projectOrRecipient || (movementForm.type === 'IN' ? 'Warehouse North Depot' : 'Field Operations Site'),
      vendorOrSupplier: movementForm.vendorOrSupplier || targetItem.supplier,
      date: new Date().toISOString().split('T')[0],
      unitCost: movementForm.unitCost || targetItem.unitPrice,
      currency: movementForm.currency || targetItem.currency,
      notes: movementForm.notes,
      createdByUserId: currentUser?.id || 'sys',
      createdByUserName: currentUser?.fullName || 'Staff',
    };

    // Update item stock running totals
    const updatedItems = items.map((it) => {
      if (it.id === targetItem.id) {
        return {
          ...it,
          currentStock: newBalance,
          totalIn: movementForm.type === 'IN' ? it.totalIn + qty : it.totalIn,
          totalOut: movementForm.type === 'OUT' ? it.totalOut + qty : it.totalOut,
          lastUpdated: new Date().toISOString(),
        };
      }
      return it;
    });

    storage.saveInventory(updatedItems);
    storage.saveMovements([newMovement, ...movements]);

    storage.logActivity({
      userId: currentUser?.id || 'sys',
      userName: currentUser?.fullName || 'User',
      userRole: currentUser?.role || 'Standard User',
      action: 'CREATE',
      module: 'Inventory',
      targetId: newMovement.id,
      description: `Stock ${movementForm.type}: ${qty} ${targetItem.unit} of ${targetItem.itemCode} (New balance: ${newBalance})`,
    });

    showToast(`Stock ${movementForm.type} recorded for ${targetItem.itemCode}.`, 'success');
    setIsMovementModalOpen(false);
    reloadData();
  };

  // Export Inventory Master Table
  const handleExportInventory = () => {
    const columns = [
      { header: 'Item Code', key: 'itemCode' },
      { header: 'Item Name', key: 'name' },
      { header: 'Category', key: 'category' },
      { header: 'Current Balance', key: 'currentStockFormatted' },
      { header: 'Total In', key: 'totalInFormatted' },
      { header: 'Total Out', key: 'totalOutFormatted' },
      { header: 'Unit Price', key: 'unitPriceFormatted' },
      { header: 'Converted Home Total', key: 'convertedValue' },
      { header: 'Storage Bin / Location', key: 'location' },
      { header: 'Stock Health', key: 'status' },
    ];

    const data = filteredItems.map((item) => {
      const convertedVal = convertCurrency(
        item.currentStock * item.unitPrice,
        item.currency,
        homeCurrency,
        exchangeRates
      );
      return {
        itemCode: item.itemCode,
        name: item.name,
        category: item.category,
        currentStockFormatted: `${item.currentStock.toLocaleString()} ${item.unit}`,
        totalInFormatted: `${item.totalIn.toLocaleString()} ${item.unit}`,
        totalOutFormatted: `${item.totalOut.toLocaleString()} ${item.unit}`,
        unitPriceFormatted: formatCurrency(item.unitPrice, item.currency, { includeCode: true }),
        convertedValue: formatCurrency(convertedVal, homeCurrency, { includeCode: true }),
        location: item.location,
        status: item.currentStock <= item.minThreshold ? 'LOW STOCK ALERT' : 'OPTIMAL',
      };
    });

    openLetterheadModal({
      title: 'In-Out-Remains Inventory Valuation & Balance Sheet',
      columns,
      data,
      dateRange: `As of ${new Date().toLocaleDateString()}`,
      filterSummary: `Category: ${selectedCategory}, Scope: ${filteredItems.length} SKUs`,
    });
  };

  // Export Movements Table
  const handleExportMovements = () => {
    const columns = [
      { header: 'Date', key: 'date' },
      { header: 'Ref No', key: 'referenceNo' },
      { header: 'Type', key: 'type' },
      { header: 'Item Code', key: 'itemCode' },
      { header: 'Item Name', key: 'itemName' },
      { header: 'Qty', key: 'quantity' },
      { header: 'Prev Balance', key: 'previousBalance' },
      { header: 'New Balance', key: 'newBalance' },
      { header: 'Project / Destination', key: 'projectOrRecipient' },
      { header: 'Authorized By', key: 'createdByUserName' },
    ];

    const data = filteredMovements.map((m) => ({
      ...m,
      quantity: `${m.type === 'IN' ? '+' : '-'}${m.quantity.toLocaleString()}`,
      previousBalance: m.previousBalance.toLocaleString(),
      newBalance: m.newBalance.toLocaleString(),
    }));

    openLetterheadModal({
      title: 'Stock Movements Audit Register (Incoming & Outgoing Dispatch)',
      columns,
      data,
      dateRange: dateFrom && dateTo ? `${dateFrom} to ${dateTo}` : 'Historical Transactions',
      filterSummary: `Transactions Count: ${data.length}`,
    });
  };

  const isMovementsTab = subTab === 'movements';

  return (
    <div className="p-4 lg:p-6 space-y-6 animate-in fade-in">
      {/* Top Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black tracking-tight text-[var(--text-main)]">
              In-Out-Remains Inventory
            </h1>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
              Module 1
            </span>
          </div>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            Real-time optical cables, splicing hardware, and active telecom gear balance tracking
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Sub Tab Switcher */}
          <div className="flex rounded-lg bg-[var(--bg-card)] p-1 border border-[var(--border-main)] text-xs font-semibold">
            <button
              onClick={() => setSubTab('stock-list')}
              className={`px-3 py-1.5 rounded-md transition ${
                !isMovementsTab ? 'bg-[var(--accent)] text-white shadow-xs' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              Stock Master
            </button>
            <button
              onClick={() => setSubTab('movements')}
              className={`px-3 py-1.5 rounded-md transition ${
                isMovementsTab ? 'bg-[var(--accent)] text-white shadow-xs' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              Movements History
            </button>
          </div>

          {/* Action: Scan Barcode / QR with Camera */}
          <button
            onClick={() => setIsScannerOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-sm transition cursor-pointer"
            title="Scan QR or Barcode using device camera to quickly update stock levels"
          >
            <ScanBarcode className="w-3.5 h-3.5" />
            <span>Scan Barcode / QR</span>
          </button>

          {/* Action: Record Movement */}
          <button
            onClick={() => {
              setMovementForm({
                itemId: items[0]?.id || '',
                type: 'IN',
                quantity: 100,
                referenceNo: `PO-${Date.now().toString().slice(-4)}`,
                projectOrRecipient: '',
                vendorOrSupplier: '',
                unitCost: items[0]?.unitPrice || 0,
                currency: items[0]?.currency || homeCurrency,
                notes: '',
              });
              setIsMovementModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow transition"
          >
            <ArrowDownUp className="w-3.5 h-3.5" />
            <span>Record In/Out</span>
          </button>

          {/* Action: Add Item */}
          <button
            onClick={() => {
              setEditingItem(null);
              setSelectedCategoryInModal(inventoryCategories[0] || 'Fiber Optics');
              setIsAddingCustomCategory(false);
              setCustomCategoryInput('');
              setIsItemModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-bold shadow transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Item</span>
          </button>

          {/* Action: SKU Categories Manager */}
          <button
            onClick={() => setIsCategoryModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] border border-[var(--border-main)] text-xs font-semibold text-[var(--text-main)] transition cursor-pointer"
            title="Manage and Add SKU Categories"
          >
            <Tag className="w-3.5 h-3.5 text-[var(--accent)]" />
            <span>SKU Categories ({inventoryCategories.length})</span>
          </button>

          {/* Action: QR Batch Generator */}
          <button
            onClick={() => setIsBatchQrOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] border border-[var(--border-main)] text-xs font-semibold text-[var(--text-main)] transition cursor-pointer"
            title="Batch generate & print QR code labels"
          >
            <QrCode className="w-3.5 h-3.5 text-emerald-400" />
            <span>QR Label Center</span>
          </button>

          {/* Action: Export Report */}
          <button
            onClick={isMovementsTab ? handleExportMovements : handleExportInventory}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] border border-[var(--border-main)] text-xs font-semibold text-[var(--text-main)] transition cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-blue-400" />
            <span>Export Letterhead</span>
          </button>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-main)]">
          <div className="text-[11px] font-medium text-[var(--text-dim)]">Total SKUs in Depot</div>
          <div className="text-xl font-extrabold text-[var(--text-main)] mt-1">{items.length}</div>
          <div className="text-[10px] text-blue-400 font-semibold mt-0.5">Categorized in {inventoryCategories.length} categories</div>
        </div>

        <div className="p-3.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-main)]">
          <div className="text-[11px] font-medium text-[var(--text-dim)]">Total Inflow Movements</div>
          <div className="text-xl font-extrabold text-emerald-400 mt-1">
            {movements.filter((m) => m.type === 'IN').reduce((acc, m) => acc + m.quantity, 0).toLocaleString()}
          </div>
          <div className="text-[10px] text-[var(--text-dim)] mt-0.5">Incoming stock units</div>
        </div>

        <div className="p-3.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-main)]">
          <div className="text-[11px] font-medium text-[var(--text-dim)]">Total Outflow Dispatches</div>
          <div className="text-xl font-extrabold text-amber-400 mt-1">
            {movements.filter((m) => m.type === 'OUT').reduce((acc, m) => acc + m.quantity, 0).toLocaleString()}
          </div>
          <div className="text-[10px] text-[var(--text-dim)] mt-0.5">Dispatched to ICT sites</div>
        </div>

        <div className="p-3.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-main)]">
          <div className="text-[11px] font-medium text-[var(--text-dim)]">Low Stock SKUs</div>
          <div className="text-xl font-extrabold text-rose-400 mt-1">
            {items.filter((i) => i.currentStock <= i.minThreshold).length}
          </div>
          <div className="text-[10px] text-rose-400 font-semibold mt-0.5">Below threshold warnings</div>
        </div>
      </div>

      {/* Filter & Search Controls */}
      <div className="p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-main)] flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <div className="relative w-full">
            <Search className="w-3.5 h-3.5 text-[var(--text-dim)] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search code, name, location or supplier..."
              className="w-full pl-8 pr-9 py-1.5 rounded-lg bg-[var(--bg-input)] border border-[var(--border-main)] text-xs text-[var(--text-main)] focus:outline-none focus:border-[var(--accent)]"
            />
            <button
              type="button"
              onClick={() => setIsScannerOpen(true)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-dim)] hover:text-blue-400 transition cursor-pointer"
              title="Quick Scan Barcode with Camera"
            >
              <ScanBarcode className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {!isMovementsTab ? (
            <>
              {/* Category Dropdown */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg bg-[var(--bg-input)] border border-[var(--border-main)] text-xs text-[var(--text-main)] focus:outline-none"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              {/* Status Filter */}
              <select
                value={selectedStockStatus}
                onChange={(e) => setSelectedStockStatus(e.target.value as any)}
                className="px-2.5 py-1.5 rounded-lg bg-[var(--bg-input)] border border-[var(--border-main)] text-xs text-[var(--text-main)] focus:outline-none"
              >
                <option value="ALL">All Stock Levels</option>
                <option value="LOW">Low Stock Alert Only</option>
                <option value="HEALTHY">Optimal Balance Only</option>
              </select>
            </>
          ) : (
            <>
              {/* Date Filters for movements */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-[var(--text-dim)]">From:</span>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="px-2 py-1 rounded bg-[var(--bg-input)] border border-[var(--border-main)] text-[11px] text-[var(--text-main)]"
                />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-[var(--text-dim)]">To:</span>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="px-2 py-1 rounded bg-[var(--bg-input)] border border-[var(--border-main)] text-[11px] text-[var(--text-main)]"
                />
              </div>
              {viewHistoryItem && (
                <div className="flex items-center gap-1 px-2 py-1 rounded bg-blue-500/10 text-blue-400 text-[11px] font-semibold border border-blue-500/20">
                  <span>Filtered: {viewHistoryItem.itemCode}</span>
                  <button onClick={() => setViewHistoryItem(null)}>
                    <X className="w-3 h-3 ml-1" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Main Table: Stock Master or Movements */}
      {!isMovementsTab ? (
        /* Stock Master Grid */
        <div className="border border-[var(--border-main)] rounded-xl overflow-hidden bg-[var(--bg-card)] shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[var(--border-main)] bg-[var(--bg-surface)] text-[var(--text-muted)] font-semibold">
                  <th className="py-3 px-4">Item Code</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4 text-right">In (Total)</th>
                  <th className="py-3 px-4 text-right">Out (Total)</th>
                  <th className="py-3 px-4 text-right">Current Balance</th>
                  <th className="py-3 px-4 text-right">Unit Price</th>
                  <th className="py-3 px-4">Location / Bay</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-main)]/60">
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-[var(--text-dim)]">
                      No inventory items match the selected criteria.
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item) => {
                    const isLow = item.currentStock <= item.minThreshold;
                    return (
                      <tr key={item.id} className="hover:bg-[var(--bg-hover)] transition group">
                        <td className="py-3 px-4 font-mono font-bold text-[var(--text-main)]">
                          {item.itemCode}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-[var(--text-main)]">{item.name}</div>
                          <div className="text-[10px] text-[var(--text-dim)] truncate max-w-xs">
                            {item.description}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[var(--bg-input)] border border-[var(--border-light)] text-[var(--text-muted)]">
                            {item.category}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-emerald-400">
                          {item.totalIn.toLocaleString()} <span className="text-[10px] text-[var(--text-dim)]">{item.unit}</span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-amber-400">
                          {item.totalOut.toLocaleString()} <span className="text-[10px] text-[var(--text-dim)]">{item.unit}</span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-base text-[var(--text-main)]">
                          {item.currentStock.toLocaleString()}{' '}
                          <span className="text-xs font-normal text-[var(--text-dim)]">{item.unit}</span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-[var(--text-muted)]">
                          {formatCurrency(item.unitPrice, item.currency)}
                        </td>
                        <td className="py-3 px-4 text-[var(--text-muted)]">{item.location}</td>
                        <td className="py-3 px-4 text-center">
                          {isLow ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/25">
                              <AlertTriangle className="w-3 h-3" />
                              <span>Low Stock</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Healthy</span>
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            {/* QR Code Tag & Print */}
                            <button
                              onClick={() => setQrItem(item)}
                              className="p-1.5 rounded hover:bg-[var(--bg-surface)] text-[var(--text-dim)] hover:text-emerald-400 transition cursor-pointer"
                              title="Generate & Print SKU QR Code"
                            >
                              <QrCode className="w-3.5 h-3.5" />
                            </button>

                            {/* View History */}
                            <button
                              onClick={() => {
                                setViewHistoryItem(item);
                                setSubTab('movements');
                              }}
                              className="p-1.5 rounded hover:bg-[var(--bg-surface)] text-[var(--text-dim)] hover:text-blue-400 transition cursor-pointer"
                              title="View item ledger history"
                            >
                              <History className="w-3.5 h-3.5" />
                            </button>

                            {/* Edit SKU */}
                            {canAccessFeature('canEditInventory') && (
                              <button
                                onClick={() => {
                                  setEditingItem(item);
                                  setSelectedCategoryInModal(item.category || inventoryCategories[0] || 'Fiber Optics');
                                  setIsAddingCustomCategory(false);
                                  setCustomCategoryInput('');
                                  setIsItemModalOpen(true);
                                }}
                                className="p-1.5 rounded hover:bg-[var(--bg-surface)] text-[var(--text-dim)] hover:text-[var(--text-main)] transition cursor-pointer"
                                title="Edit item master"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {/* Delete SKU */}
                            {canAccessFeature('canDeleteInventory') && (
                              <button
                                onClick={() => handleDeleteItem(item)}
                                className="p-1.5 rounded hover:bg-rose-950/40 text-[var(--text-dim)] hover:text-rose-400 transition cursor-pointer"
                                title="Delete SKU"
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
          </div>
        </div>
      ) : (
        /* Movements Log Grid */
        <div className="border border-[var(--border-main)] rounded-xl overflow-hidden bg-[var(--bg-card)] shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[var(--border-main)] bg-[var(--bg-surface)] text-[var(--text-muted)] font-semibold">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Ref / PO</th>
                  <th className="py-3 px-4">Flow</th>
                  <th className="py-3 px-4">Item Code</th>
                  <th className="py-3 px-4">Item Name</th>
                  <th className="py-3 px-4 text-right">Quantity</th>
                  <th className="py-3 px-4 text-right">Previous Bal</th>
                  <th className="py-3 px-4 text-right">New Bal</th>
                  <th className="py-3 px-4">Recipient / Site</th>
                  <th className="py-3 px-4">Officer</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-main)]/60">
                {filteredMovements.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="py-8 text-center text-[var(--text-dim)]">
                      No stock movements found.
                    </td>
                  </tr>
                ) : (
                  filteredMovements.map((m) => (
                    <tr key={m.id} className="hover:bg-[var(--bg-hover)] transition">
                      <td className="py-3 px-4 font-mono text-[var(--text-muted)]">{m.date}</td>
                      <td className="py-3 px-4 font-mono font-semibold text-[var(--text-main)]">
                        {m.referenceNo}
                      </td>
                      <td className="py-3 px-4">
                        {m.type === 'IN' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                            <ArrowDownLeft className="w-3 h-3" />
                            <span>IN</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/25">
                            <ArrowUpRight className="w-3 h-3" />
                            <span>OUT</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-blue-400">{m.itemCode}</td>
                      <td className="py-3 px-4 font-medium text-[var(--text-main)]">{m.itemName}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-[var(--text-main)]">
                        {m.type === 'IN' ? `+${m.quantity.toLocaleString()}` : `-${m.quantity.toLocaleString()}`}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-[var(--text-dim)]">
                        {m.previousBalance.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-[var(--text-main)]">
                        {m.newBalance.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-[var(--text-muted)]">{m.projectOrRecipient}</td>
                      <td className="py-3 px-4 text-[var(--text-dim)]">{m.createdByUserName}</td>
                      <td className="py-3 px-4 text-center">
                        {canAccessFeature('canDeleteInventory') && (
                          <button
                            type="button"
                            onClick={() => handleDeleteMovement(m)}
                            className="p-1.5 rounded hover:bg-rose-950/40 text-[var(--text-dim)] hover:text-rose-400 transition cursor-pointer"
                            title="Delete Movement Log"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Record Movement Modal */}
      {isMovementModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-lg bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-2xl shadow-2xl p-6 text-[var(--text-main)] overflow-hidden">
            <div className="flex items-center justify-between pb-4 border-b border-[var(--border-main)]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-blue-600/10 text-blue-400 border border-blue-500/20">
                  <ArrowDownUp className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold">Record Stock In / Out Flow</h3>
                  <p className="text-xs text-[var(--text-muted)]">
                    Direct warehouse transaction linked to project site or procurement PO
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsMovementModalOpen(false)}
                className="p-1 rounded-lg text-[var(--text-dim)] hover:text-[var(--text-main)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMovement} className="mt-5 space-y-4 text-xs">
              {/* Type Switcher */}
              <div>
                <label className="block font-semibold text-[var(--text-muted)] mb-1">
                  Movement Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setMovementForm({ ...movementForm, type: 'IN' })}
                    className={`py-2 rounded-lg font-bold flex items-center justify-center gap-2 border transition ${
                      movementForm.type === 'IN'
                        ? 'bg-emerald-600 text-white border-emerald-500 shadow'
                        : 'bg-[var(--bg-card)] border-[var(--border-main)] text-[var(--text-muted)]'
                    }`}
                  >
                    <ArrowDownLeft className="w-4 h-4" />
                    <span>INCOMING (Stock In)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMovementForm({ ...movementForm, type: 'OUT' })}
                    className={`py-2 rounded-lg font-bold flex items-center justify-center gap-2 border transition ${
                      movementForm.type === 'OUT'
                        ? 'bg-amber-600 text-white border-amber-500 shadow'
                        : 'bg-[var(--bg-card)] border-[var(--border-main)] text-[var(--text-muted)]'
                    }`}
                  >
                    <ArrowUpRight className="w-4 h-4" />
                    <span>OUTGOING (Dispatch Out)</span>
                  </button>
                </div>
              </div>

              {/* Item selection */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-semibold text-[var(--text-muted)]">
                    Select Item SKU
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsMovementModalOpen(false);
                      setIsScannerOpen(true);
                    }}
                    className="text-[11px] text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <ScanBarcode className="w-3.5 h-3.5" />
                    <span>Scan Item Barcode</span>
                  </button>
                </div>
                <select
                  required
                  value={movementForm.itemId}
                  onChange={(e) => {
                    const sel = items.find((i) => i.id === e.target.value);
                    setMovementForm({
                      ...movementForm,
                      itemId: e.target.value,
                      unitCost: sel?.unitPrice || 0,
                      currency: sel?.currency || homeCurrency,
                    });
                  }}
                  className="w-full px-3 py-2 rounded-lg bg-[var(--bg-input)] border border-[var(--border-main)] text-[var(--text-main)]"
                >
                  {items.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.itemCode} - {i.name} (Current: {i.currentStock} {i.unit})
                    </option>
                  ))}
                </select>
              </div>

              {/* Quantity */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[var(--text-muted)] mb-1">
                    Quantity
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={movementForm.quantity}
                    onChange={(e) =>
                      setMovementForm({ ...movementForm, quantity: Math.max(1, parseInt(e.target.value) || 0) })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-[var(--bg-input)] border border-[var(--border-main)] text-[var(--text-main)]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[var(--text-muted)] mb-1">
                    Reference / PO Number
                  </label>
                  <input
                    type="text"
                    required
                    value={movementForm.referenceNo}
                    onChange={(e) => setMovementForm({ ...movementForm, referenceNo: e.target.value })}
                    placeholder="e.g. PO-8831 or REQ-G11-04"
                    className="w-full px-3 py-2 rounded-lg bg-[var(--bg-input)] border border-[var(--border-main)] text-[var(--text-main)]"
                  />
                </div>
              </div>

              {/* Recipient / Supplier */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[var(--text-muted)] mb-1">
                    {movementForm.type === 'IN' ? 'Receiving Depot / Bay' : 'Site / Project Recipient'}
                  </label>
                  <input
                    type="text"
                    required
                    value={movementForm.projectOrRecipient}
                    onChange={(e) =>
                      setMovementForm({ ...movementForm, projectOrRecipient: e.target.value })
                    }
                    placeholder={
                      movementForm.type === 'IN'
                        ? 'Warehouse Bay A-12'
                        : 'Sector G-11 FTTH Project Site'
                    }
                    className="w-full px-3 py-2 rounded-lg bg-[var(--bg-input)] border border-[var(--border-main)] text-[var(--text-main)]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[var(--text-muted)] mb-1">
                    Supplier / Dispatched To
                  </label>
                  <input
                    type="text"
                    value={movementForm.vendorOrSupplier}
                    onChange={(e) =>
                      setMovementForm({ ...movementForm, vendorOrSupplier: e.target.value })
                    }
                    placeholder="e.g. Corning Logistics or Splicing Squad 2"
                    className="w-full px-3 py-2 rounded-lg bg-[var(--bg-input)] border border-[var(--border-main)] text-[var(--text-main)]"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block font-semibold text-[var(--text-muted)] mb-1">
                  Transaction Notes
                </label>
                <input
                  type="text"
                  value={movementForm.notes}
                  onChange={(e) => setMovementForm({ ...movementForm, notes: e.target.value })}
                  placeholder="e.g. Cleared QA inspection, delivered on wooden drums"
                  className="w-full px-3 py-2 rounded-lg bg-[var(--bg-input)] border border-[var(--border-main)] text-[var(--text-main)]"
                />
              </div>

              {/* Submit */}
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsMovementModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] text-[var(--text-main)] font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-bold transition shadow"
                >
                  Confirm & Update Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Item Master Modal */}
      {isItemModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-xl bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-2xl shadow-2xl p-6 text-[var(--text-main)] overflow-hidden">
            <div className="flex items-center justify-between pb-4 border-b border-[var(--border-main)]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-blue-600/10 text-blue-400 border border-blue-500/20">
                  <Box className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold">
                    {editingItem ? 'Edit Master SKU' : 'Add New Inventory SKU'}
                  </h3>
                  <p className="text-xs text-[var(--text-muted)]">
                    Specify telecom hardware specifications and reorder thresholds
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsItemModalOpen(false)}
                className="p-1 rounded-lg text-[var(--text-dim)] hover:text-[var(--text-main)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="mt-5 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[var(--text-muted)] mb-1">
                    Item Code (SKU)
                  </label>
                  <input
                    type="text"
                    name="itemCode"
                    required
                    defaultValue={editingItem?.itemCode || scannedInitialCodeForCreate || ''}
                    placeholder="e.g. FIB-144C-G652D"
                    className="w-full px-3 py-2 rounded-lg bg-[var(--bg-input)] border border-[var(--border-main)] text-[var(--text-main)] font-mono"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-semibold text-[var(--text-muted)]">
                      Category
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingCustomCategory(!isAddingCustomCategory);
                        if (!isAddingCustomCategory) setCustomCategoryInput('');
                      }}
                      className="text-[11px] text-[var(--accent)] hover:underline font-semibold flex items-center gap-0.5 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>{isAddingCustomCategory ? 'Select Existing' : '+ Custom Category'}</span>
                    </button>
                  </div>

                  {!isAddingCustomCategory ? (
                    <select
                      name="category"
                      value={selectedCategoryInModal}
                      onChange={(e) => {
                        if (e.target.value === '__ADD_CUSTOM__') {
                          setIsAddingCustomCategory(true);
                          setCustomCategoryInput('');
                        } else {
                          setSelectedCategoryInModal(e.target.value);
                        }
                      }}
                      className="w-full px-3 py-2 rounded-lg bg-[var(--bg-input)] border border-[var(--border-main)] text-[var(--text-main)]"
                    >
                      {inventoryCategories.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                      <option value="__ADD_CUSTOM__" className="text-[var(--accent)] font-semibold">
                        + Add Custom Category...
                      </option>
                    </select>
                  ) : (
                    <div className="p-2 rounded-lg bg-[var(--bg-card)] border border-[var(--accent)]/40 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--accent)] flex items-center gap-1">
                          <Tag className="w-3 h-3" />
                          New Category Name
                        </span>
                        <button
                          type="button"
                          onClick={() => setIsAddingCustomCategory(false)}
                          className="text-[10px] text-[var(--text-dim)] hover:text-[var(--text-main)] cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          name="customCategoryName"
                          value={customCategoryInput}
                          onChange={(e) => setCustomCategoryInput(e.target.value)}
                          placeholder="e.g. 5G Small Cells, Solar Inverters"
                          className="flex-1 px-2 py-1.5 rounded-md bg-[var(--bg-input)] border border-[var(--border-main)] text-xs text-[var(--text-main)] focus:outline-none focus:border-[var(--accent)]"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              if (customCategoryInput.trim()) {
                                addInventoryCategory(customCategoryInput.trim());
                                setSelectedCategoryInModal(customCategoryInput.trim());
                                setIsAddingCustomCategory(false);
                              }
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (customCategoryInput.trim()) {
                              addInventoryCategory(customCategoryInput.trim());
                              setSelectedCategoryInModal(customCategoryInput.trim());
                              setIsAddingCustomCategory(false);
                            }
                          }}
                          disabled={!customCategoryInput.trim()}
                          className="px-2.5 py-1.5 rounded-md bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-[11px] font-bold disabled:opacity-50 transition cursor-pointer shrink-0"
                        >
                          Add & Select
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[var(--text-muted)] mb-1">
                  Item Name & Full Specification
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  defaultValue={editingItem?.name || ''}
                  placeholder="e.g. 144-Core Single Mode Outdoor Armored Optical Cable"
                  className="w-full px-3 py-2 rounded-lg bg-[var(--bg-input)] border border-[var(--border-main)] text-[var(--text-main)]"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-[var(--text-muted)] mb-1">Unit</label>
                  <select
                    name="unit"
                    defaultValue={editingItem?.unit || 'Meters'}
                    className="w-full px-3 py-2 rounded-lg bg-[var(--bg-input)] border border-[var(--border-main)] text-[var(--text-main)]"
                  >
                    <option value="Meters">Meters</option>
                    <option value="Pcs">Pcs</option>
                    <option value="Drums">Drums</option>
                    <option value="Rolls">Rolls</option>
                    <option value="Boxes">Boxes</option>
                    <option value="Kits">Kits</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-[var(--text-muted)] mb-1">
                    Min Alert Threshold
                  </label>
                  <input
                    type="number"
                    name="minThreshold"
                    defaultValue={editingItem?.minThreshold || 500}
                    className="w-full px-3 py-2 rounded-lg bg-[var(--bg-input)] border border-[var(--border-main)] text-[var(--text-main)]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[var(--text-muted)] mb-1">
                    Unit Cost
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="unitPrice"
                    defaultValue={editingItem?.unitPrice || 1.0}
                    className="w-full px-3 py-2 rounded-lg bg-[var(--bg-input)] border border-[var(--border-main)] text-[var(--text-main)]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[var(--text-muted)] mb-1">
                    Warehouse Location / Bay
                  </label>
                  <input
                    type="text"
                    name="location"
                    defaultValue={editingItem?.location || 'Aisle 2, Rack B'}
                    className="w-full px-3 py-2 rounded-lg bg-[var(--bg-input)] border border-[var(--border-main)] text-[var(--text-main)]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[var(--text-muted)] mb-1">
                    Manufacturer / Supplier
                  </label>
                  <input
                    type="text"
                    name="supplier"
                    defaultValue={editingItem?.supplier || 'Corning / Prysmian'}
                    className="w-full px-3 py-2 rounded-lg bg-[var(--bg-input)] border border-[var(--border-main)] text-[var(--text-main)]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[var(--text-muted)] mb-1">
                  Technical Description & Standards
                </label>
                <textarea
                  name="description"
                  rows={2}
                  defaultValue={editingItem?.description || ''}
                  placeholder="e.g. ITU-T G.652.D loose tube heavy outdoor direct burial armored cable"
                  className="w-full px-3 py-2 rounded-lg bg-[var(--bg-input)] border border-[var(--border-main)] text-[var(--text-main)]"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsItemModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] text-[var(--text-main)] font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-bold transition shadow"
                >
                  {editingItem ? 'Update Master Record' : 'Save SKU to Warehouse'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Deletion Modal for Inventory Item */}
      <ConfirmDeleteModal
        isOpen={!!itemToDelete}
        title="Delete Inventory SKU"
        itemName={itemToDelete ? `${itemToDelete.itemCode} - ${itemToDelete.name}` : ''}
        entityName={itemToDelete ? `${itemToDelete.itemCode} - ${itemToDelete.name}` : ''}
        itemType="Inventory Item"
        entityType="Inventory Item"
        warningMessage="This item and its master record will be deleted from the warehouse ledger. Any historical movements referencing this SKU will remain in the transaction operations record."
        description="This item and its master record will be deleted from the warehouse ledger. Any historical movements referencing this SKU will remain in the transaction operations record."
        onConfirm={handleConfirmDeleteItem}
        onClose={() => setItemToDelete(null)}
        onCancel={() => setItemToDelete(null)}
        isDeleting={isDeletingItem}
        isLoading={isDeletingItem}
      />

      {/* Confirmation Deletion Modal for Movement Record */}
      <ConfirmDeleteModal
        isOpen={!!movementToDelete}
        title="Delete Stock Movement Record"
        itemName={movementToDelete ? `${movementToDelete.referenceNo} (${movementToDelete.type}) - ${movementToDelete.itemCode}` : ''}
        entityName={movementToDelete ? `${movementToDelete.referenceNo} (${movementToDelete.type}) - ${movementToDelete.itemCode}` : ''}
        itemType="Stock Movement"
        entityType="Stock Movement"
        warningMessage="This movement entry will be removed from the transaction ledger history."
        description="This movement entry will be removed from the transaction ledger history."
        onConfirm={handleConfirmDeleteMovement}
        onClose={() => setMovementToDelete(null)}
        onCancel={() => setMovementToDelete(null)}
        isDeleting={isDeletingMovement}
        isLoading={isDeletingMovement}
      />

      {/* Item QR Code Modal */}
      <ItemQRCodeModal
        isOpen={!!qrItem}
        item={qrItem}
        onClose={() => setQrItem(null)}
      />

      {/* Batch QR Code Generator Modal */}
      <BatchQRModal
        isOpen={isBatchQrOpen}
        items={items}
        onClose={() => setIsBatchQrOpen(false)}
      />

      {/* Warehouse QR & Barcode Camera Scanner */}
      <InventoryScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        items={items}
        currentUser={currentUser}
        homeCurrency={homeCurrency}
        onItemUpdated={reloadData}
        showToast={showToast}
        onOpenCreateItem={(initialCode) => {
          setEditingItem(null);
          setSelectedCategoryInModal(inventoryCategories[0] || 'Fiber Optics');
          setIsAddingCustomCategory(false);
          setCustomCategoryInput('');
          setScannedInitialCodeForCreate(initialCode);
          setIsItemModalOpen(true);
        }}
        onViewInTable={(itemCode) => {
          setSearchQuery(itemCode);
          setSubTab('stock-list');
          setIsScannerOpen(false);
        }}
        onOpenItemQr={(item) => {
          setQrItem(item);
          setIsScannerOpen(false);
        }}
        onOpenEditItem={(item) => {
          setEditingItem(item);
          setSelectedCategoryInModal(item.category);
          setIsItemModalOpen(true);
          setIsScannerOpen(false);
        }}
      />

      {/* Manage Inventory SKU Categories Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-xl rounded-2xl bg-[var(--bg-card)] border border-[var(--border-main)] shadow-2xl p-5 space-y-4 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-main)]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20">
                  <Tag className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[var(--text-main)]">
                    Inventory SKU Categories
                  </h3>
                  <p className="text-xs text-[var(--text-muted)]">
                    Create custom categories with custom names and organize your telecom depot taxonomy
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCategoryModalOpen(false)}
                className="p-1 rounded-lg text-[var(--text-dim)] hover:text-[var(--text-main)] transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Add Custom Category Card */}
            <div className="p-3.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-main)] space-y-2">
              <div className="text-xs font-bold text-[var(--text-main)] flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5 text-[var(--accent)]" />
                <span>Add New Custom Category</span>
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (newCategoryModalInput.trim()) {
                    const success = addInventoryCategory(newCategoryModalInput.trim());
                    if (success) {
                      setNewCategoryModalInput('');
                    }
                  }
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={newCategoryModalInput}
                  onChange={(e) => setNewCategoryModalInput(e.target.value)}
                  placeholder="e.g. 5G Base Stations, Microducts, Microwave Dishes..."
                  className="flex-1 px-3 py-2 rounded-lg bg-[var(--bg-input)] border border-[var(--border-main)] text-xs text-[var(--text-main)] focus:outline-none focus:border-[var(--accent)]"
                />
                <button
                  type="submit"
                  disabled={!newCategoryModalInput.trim()}
                  className="px-4 py-2 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-bold disabled:opacity-50 transition flex items-center gap-1.5 cursor-pointer shrink-0 shadow"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Category</span>
                </button>
              </form>
            </div>

            {/* Categories List */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-2 min-h-[220px]">
              <div className="text-[11px] font-semibold text-[var(--text-dim)] uppercase tracking-wider flex items-center justify-between">
                <span>Active SKU Categories ({inventoryCategories.length})</span>
                <span>Assigned Items & Actions</span>
              </div>

              <div className="space-y-1.5">
                {inventoryCategories.map((cat) => {
                  const count = items.filter(
                    (it) => (it.category || '').toLowerCase() === cat.toLowerCase()
                  ).length;
                  const isStandard = DEFAULT_INVENTORY_CATEGORIES.some(
                    (c) => c.toLowerCase() === cat.toLowerCase()
                  );

                  return (
                    <div
                      key={cat}
                      className="p-2.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-main)] hover:border-[var(--accent)]/40 transition flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-2 h-2 rounded-full bg-[var(--accent)] shrink-0" />
                        <span className="font-semibold text-[var(--text-main)] truncate">
                          {cat}
                        </span>
                        {isStandard ? (
                          <span className="text-[10px] px-1.5 py-0.2 rounded font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20 shrink-0">
                            Standard
                          </span>
                        ) : (
                          <span className="text-[10px] px-1.5 py-0.2 rounded font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                            Custom
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-[var(--bg-card)] border border-[var(--border-main)] text-[var(--text-muted)]">
                          {count} {count === 1 ? 'item' : 'items'}
                        </span>

                        {/* Filter by Category shortcut */}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCategory(cat);
                            setIsCategoryModalOpen(false);
                            setSubTab('stock-list');
                          }}
                          className="p-1.5 rounded hover:bg-[var(--bg-card)] text-[var(--text-dim)] hover:text-blue-400 transition cursor-pointer"
                          title={`Filter inventory by ${cat}`}
                        >
                          <Filter className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete custom category */}
                        {!isStandard && (
                          <button
                            type="button"
                            onClick={() => deleteInventoryCategory(cat)}
                            disabled={count > 0}
                            className="p-1.5 rounded hover:bg-rose-500/10 text-[var(--text-dim)] hover:text-rose-400 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
                            title={
                              count > 0
                                ? `Cannot delete: in use by ${count} items`
                                : 'Delete custom category'
                            }
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-[var(--border-main)] flex items-center justify-between text-xs text-[var(--text-dim)]">
              <span>Standard categories are enterprise defaults. Custom categories can be deleted when not in use.</span>
              <button
                type="button"
                onClick={() => setIsCategoryModalOpen(false)}
                className="px-4 py-1.5 rounded-lg bg-[var(--bg-surface)] hover:bg-[var(--bg-hover)] border border-[var(--border-main)] text-[var(--text-main)] font-semibold transition cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
