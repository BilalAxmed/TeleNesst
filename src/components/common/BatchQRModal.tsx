import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { InventoryItem } from '../../types';
import { formatCurrency } from '../../services/currency';
import { useApp } from '../../context/AppContext';
import {
  X,
  Printer,
  QrCode,
  CheckSquare,
  Square,
  Search,
  Filter,
  Layers,
  Download,
} from 'lucide-react';

interface BatchQRModalProps {
  isOpen: boolean;
  items: InventoryItem[];
  onClose: () => void;
}

export const BatchQRModal: React.FC<BatchQRModalProps> = ({
  isOpen,
  items,
  onClose,
}) => {
  const { softwareName } = useApp();
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());
  const [qrCodeMap, setQrCodeMap] = useState<Record<string, string>>({});
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [isGenerating, setIsGenerating] = useState(false);

  // Initialize all selected by default when opened
  useEffect(() => {
    if (isOpen && items.length > 0) {
      setSelectedItemIds(new Set(items.map((i) => i.id)));
    }
  }, [isOpen, items]);

  // Generate QR codes for all items
  useEffect(() => {
    if (!isOpen || items.length === 0) return;
    let isCancelled = false;

    const generateAll = async () => {
      setIsGenerating(true);
      const map: Record<string, string> = {};

      for (const item of items) {
        if (isCancelled) break;
        try {
          const payload = `TELENEST ASSET
SKU: ${item.itemCode}
Name: ${item.name}
Cat: ${item.category}
Loc: ${item.location}
Price: ${item.unitPrice} ${item.currency}`;

          const url = await QRCode.toDataURL(payload, {
            width: 250,
            margin: 1,
            color: { dark: '#0f172a', light: '#ffffff' },
          });
          map[item.id] = url;
        } catch (e) {
          console.error(e);
        }
      }

      if (!isCancelled) {
        setQrCodeMap(map);
        setIsGenerating(false);
      }
    };

    generateAll();
    return () => {
      isCancelled = true;
    };
  }, [isOpen, items]);

  if (!isOpen) return null;

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.itemCode.toLowerCase().includes(search.toLowerCase()) ||
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.location.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'ALL' || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleToggleItem = (id: string) => {
    const next = new Set(selectedItemIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedItemIds(next);
  };

  const handleSelectAll = () => {
    if (selectedItemIds.size === filteredItems.length) {
      setSelectedItemIds(new Set());
    } else {
      setSelectedItemIds(new Set(filteredItems.map((i) => i.id)));
    }
  };

  const selectedList = items.filter((i) => selectedItemIds.has(i.id));

  const handlePrintBatch = () => {
    if (selectedList.length === 0) return;
    const printWindow = window.open('', '_blank', 'width=900,height=800');
    if (!printWindow) return;

    const cardsHtml = selectedList
      .map((item) => {
        const qrUrl = qrCodeMap[item.id] || '';
        return `
          <div class="label-box">
            <div class="top-row">
              <span class="co">TELENEST ICT</span>
              <span class="cat">${item.category}</span>
            </div>
            <div class="content-row">
              <img src="${qrUrl}" alt="${item.itemCode}" />
              <div class="details">
                <div class="sku">${item.itemCode}</div>
                <div class="name">${item.name}</div>
                <div class="loc">Location: <strong>${item.location}</strong></div>
                <div class="price">${formatCurrency(item.unitPrice, item.currency)} &bull; ${item.currentStock} ${item.unit}</div>
              </div>
            </div>
          </div>
        `;
      })
      .join('');

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${softwareName} Inventory QR Code Sticker Sheet (${selectedList.length} items)</title>
          <style>
            @page { size: A4 portrait; margin: 10mm; }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              margin: 0;
              padding: 0;
              color: #0f172a;
              background: #fff;
            }
            .grid-container {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 4mm;
            }
            .label-box {
              border: 1.5px solid #334155;
              border-radius: 6px;
              padding: 4mm;
              page-break-inside: avoid;
              background: #fff;
            }
            .top-row {
              display: flex;
              justify-content: space-between;
              align-items: center;
              font-size: 8pt;
              border-bottom: 1px solid #e2e8f0;
              padding-bottom: 2mm;
              margin-bottom: 2mm;
            }
            .top-row .co {
              font-weight: 900;
              color: #1e40af;
              letter-spacing: 0.5px;
            }
            .top-row .cat {
              font-size: 7.5pt;
              color: #64748b;
              font-weight: 600;
            }
            .content-row {
              display: flex;
              gap: 3mm;
              align-items: center;
            }
            .content-row img {
              width: 25mm;
              height: 25mm;
              display: block;
              border: 1px solid #e2e8f0;
            }
            .details {
              flex: 1;
              font-size: 8pt;
              line-height: 1.3;
            }
            .sku {
              font-size: 11pt;
              font-weight: 900;
              font-family: monospace;
              color: #0f172a;
            }
            .name {
              font-weight: 700;
              font-size: 8.5pt;
              margin: 1mm 0;
              max-height: 2.8em;
              overflow: hidden;
            }
            .loc {
              font-size: 7.5pt;
              color: #475569;
            }
            .price {
              font-size: 7.5pt;
              font-weight: bold;
              color: #047857;
              margin-top: 1mm;
            }
          </style>
        </head>
        <body>
          <div class="grid-container">
            ${cardsHtml}
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    setTimeout(() => {
      try {
        printWindow.focus();
        printWindow.print();
      } catch (err) {
        console.warn('Print error:', err);
      }
    }, 350);
  };

  const handleDownloadBatch = () => {
    if (selectedList.length === 0) return;
    selectedList.forEach((item, index) => {
      const qrUrl = qrCodeMap[item.id];
      if (!qrUrl) return;
      setTimeout(() => {
        const a = document.createElement('a');
        a.href = qrUrl;
        a.download = `QR_${item.itemCode.replace(/[^a-z0-9]/gi, '_')}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }, index * 200);
    });
  };

  const categories = Array.from(new Set(items.map((i) => i.category)));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl max-h-[90vh] bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-2xl shadow-2xl p-6 text-[var(--text-main)] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Accent Line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-500" />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[var(--border-main)]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[var(--text-main)] tracking-tight">
                Batch Inventory QR Code & Label Generator
              </h3>
              <p className="text-xs text-[var(--text-muted)]">
                Select inventory products to generate and print formatted sticker sheets for warehouse racking
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-[var(--text-dim)] hover:text-[var(--text-main)] hover:bg-[var(--bg-hover)] transition cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Filter Controls */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[var(--text-dim)]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search SKU, item name, rack location..."
                className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-[var(--bg-input)] border border-[var(--border-main)] text-xs text-[var(--text-main)]"
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-[var(--bg-input)] border border-[var(--border-main)] text-xs text-[var(--text-main)]"
            >
              <option value="ALL">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSelectAll}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] border border-[var(--border-main)] text-xs font-semibold text-[var(--text-main)] transition cursor-pointer"
            >
              {selectedItemIds.size === filteredItems.length && filteredItems.length > 0 ? (
                <CheckSquare className="w-3.5 h-3.5 text-blue-400" />
              ) : (
                <Square className="w-3.5 h-3.5 text-[var(--text-dim)]" />
              )}
              <span>Select All Visible ({filteredItems.length})</span>
            </button>
          </div>
        </div>

        {/* Items Grid */}
        <div className="mt-4 flex-1 overflow-y-auto pr-1">
          {isGenerating && (
            <div className="text-center py-2 text-xs text-blue-400 font-semibold animate-pulse">
              Generating cryptographic QR Code matrices...
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {filteredItems.map((item) => {
              const isSelected = selectedItemIds.has(item.id);
              const qrUrl = qrCodeMap[item.id];

              return (
                <div
                  key={item.id}
                  onClick={() => handleToggleItem(item.id)}
                  className={`p-3 rounded-xl border transition cursor-pointer flex gap-3 items-center ${
                    isSelected
                      ? 'bg-blue-600/10 border-blue-500/50 shadow-xs'
                      : 'bg-[var(--bg-card)] border-[var(--border-main)] opacity-60 hover:opacity-100'
                  }`}
                >
                  <div className="shrink-0">
                    {qrUrl ? (
                      <img
                        src={qrUrl}
                        alt={item.itemCode}
                        className="w-14 h-14 bg-white p-1 rounded border border-slate-300 object-contain"
                      />
                    ) : (
                      <div className="w-14 h-14 bg-[var(--bg-input)] rounded flex items-center justify-center">
                        <QrCode className="w-6 h-6 text-[var(--text-dim)]" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-xs text-[var(--text-main)]">
                        {item.itemCode}
                      </span>
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-blue-400" />
                      ) : (
                        <Square className="w-4 h-4 text-[var(--text-dim)]" />
                      )}
                    </div>
                    <div className="text-xs text-[var(--text-muted)] truncate font-medium mt-0.5">
                      {item.name}
                    </div>
                    <div className="text-[10px] text-[var(--text-dim)] flex items-center justify-between mt-1">
                      <span>{item.location}</span>
                      <span className="font-mono text-emerald-400">
                        {item.currentStock} {item.unit}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="mt-6 flex items-center justify-between pt-4 border-t border-[var(--border-main)]">
          <div className="text-xs text-[var(--text-muted)]">
            <strong className="text-[var(--text-main)]">{selectedList.length}</strong> of{' '}
            <strong>{items.length}</strong> items queued for printing
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] border border-[var(--border-main)] text-xs font-semibold text-[var(--text-main)] transition cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleDownloadBatch}
              disabled={selectedList.length === 0}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] border border-[var(--border-main)] text-xs font-bold text-[var(--text-main)] transition disabled:opacity-50 cursor-pointer"
              title="Download PNG QR image files for selected items"
            >
              <Download className="w-3.5 h-3.5 text-blue-400" />
              <span>Download PNGs ({selectedList.length})</span>
            </button>

            <button
              type="button"
              onClick={handlePrintBatch}
              disabled={selectedList.length === 0}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-bold transition shadow-md shadow-blue-900/30 disabled:opacity-50 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Sticker Sheet ({selectedList.length})</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
