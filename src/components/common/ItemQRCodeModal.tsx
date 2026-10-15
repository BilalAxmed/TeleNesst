import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { InventoryItem } from '../../types';
import { formatCurrency } from '../../services/currency';
import { useApp } from '../../context/AppContext';
import {
  X,
  Download,
  Printer,
  Copy,
  Check,
  QrCode,
  Box,
  Building2,
  Tag,
  ShieldCheck,
  MapPin,
} from 'lucide-react';

interface ItemQRCodeModalProps {
  isOpen: boolean;
  item: InventoryItem | null;
  onClose: () => void;
}

export const ItemQRCodeModal: React.FC<ItemQRCodeModalProps> = ({
  isOpen,
  item,
  onClose,
}) => {
  const { softwareName } = useApp();
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [payloadType, setPayloadType] = useState<'text' | 'json'>('text');

  useEffect(() => {
    if (!isOpen || !item) {
      setQrDataUrl('');
      return;
    }

    const payload =
      payloadType === 'json'
        ? JSON.stringify(
            {
              system: `${softwareName} ICT`,
              sku: item.itemCode,
              name: item.name,
              category: item.category,
              stock: item.currentStock,
              unit: item.unit,
              location: item.location,
              price: item.unitPrice,
              currency: item.currency,
              supplier: item.supplier,
              verifiedBy: 'Bilal Ahmed (Developer/CEO)',
              timestamp: new Date().toISOString(),
            },
            null,
            2
          )
        : `${(softwareName || 'ICT').toUpperCase()} ASSET TAG
SKU: ${item.itemCode}
Item: ${item.name}
Category: ${item.category}
Location: ${item.location}
Stock: ${item.currentStock} ${item.unit}
Unit Price: ${formatCurrency(item.unitPrice, item.currency)}
Supplier: ${item.supplier}
Verified: ${softwareName} Telecom Engineering`;

    QRCode.toDataURL(payload, {
      width: 400,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'H',
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('Failed to generate QR code:', err));
  }, [isOpen, item, payloadType]);

  if (!isOpen || !item) return null;

  const handleCopyPayload = () => {
    const textToCopy =
      payloadType === 'json'
        ? JSON.stringify({ sku: item.itemCode, name: item.name, location: item.location }, null, 2)
        : `SKU: ${item.itemCode} | ${item.name} | Location: ${item.location}`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `QR_${item.itemCode.replace(/[^a-z0-9]/gi, '_')}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handlePrintLabel = () => {
    const printWindow = window.open('', '_blank', 'width=600,height=600');
    if (!printWindow) return;

    const printHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Asset Label - ${item.itemCode}</title>
          <style>
            @page { size: 80mm 50mm; margin: 0; }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              margin: 0;
              padding: 6mm;
              box-sizing: border-box;
              background: #fff;
              color: #0f172a;
            }
            .label-card {
              border: 1.5px solid #0f172a;
              border-radius: 4px;
              padding: 4mm;
              display: flex;
              gap: 4mm;
              align-items: center;
            }
            .qr-col img {
              width: 28mm;
              height: 28mm;
              display: block;
            }
            .info-col {
              flex: 1;
              font-size: 8pt;
              line-height: 1.3;
            }
            .header-tag {
              font-size: 7pt;
              font-weight: 800;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              color: #2563eb;
              margin-bottom: 2px;
            }
            .sku-title {
              font-size: 11pt;
              font-weight: 900;
              font-family: monospace;
              letter-spacing: -0.5px;
              margin: 0 0 2px 0;
            }
            .item-name {
              font-size: 8.5pt;
              font-weight: 700;
              margin-bottom: 4px;
              max-height: 2.6em;
              overflow: hidden;
            }
            .meta-line {
              font-size: 7pt;
              color: #475569;
            }
            .loc-badge {
              display: inline-block;
              margin-top: 3px;
              background: #f1f5f9;
              padding: 1px 4px;
              border-radius: 2px;
              font-weight: 600;
              font-size: 6.5pt;
            }
            @media print {
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="label-card">
            <div class="qr-col">
              <img src="${qrDataUrl}" alt="QR" />
            </div>
            <div class="info-col">
              <div class="header-tag">${softwareName} ICT Logistics</div>
              <div class="sku-title">${item.itemCode}</div>
              <div class="item-name">${item.name}</div>
              <div class="meta-line">Category: ${item.category}</div>
              <div class="meta-line">Stock: ${item.currentStock} ${item.unit}</div>
              <div class="loc-badge">BIN: ${item.location}</div>
            </div>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(printHtml);
    printWindow.document.close();
    setTimeout(() => {
      try {
        printWindow.focus();
        printWindow.print();
      } catch (err) {
        console.warn('Print error:', err);
      }
    }, 300);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-2xl shadow-2xl p-6 text-[var(--text-main)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Accent Line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-500" />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[var(--border-main)]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[var(--text-main)] tracking-tight">
                Product QR Code & Asset Tag
              </h3>
              <p className="text-xs text-[var(--text-muted)]">
                Instant scannable label for warehouse racks, asset auditing, and dispatch tracking
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

        {/* Asset Tag Preview Card */}
        <div className="mt-5 p-4 rounded-xl bg-white text-slate-900 border border-slate-300 shadow-md">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-3">
            <div className="flex items-center gap-1.5 text-blue-700 font-extrabold text-[11px] tracking-tight">
              <Building2 className="w-3.5 h-3.5" />
              <span>TELENEST ICT & TELECOM ASSET</span>
            </div>
            <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded font-semibold">
              {item.category}
            </span>
          </div>

          <div className="flex items-center gap-4">
            {/* Scannable QR Code Image */}
            <div className="shrink-0 p-2 bg-white rounded-lg border border-slate-200 shadow-xs">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt={`QR Code for ${item.itemCode}`}
                  className="w-28 h-28 object-contain"
                />
              ) : (
                <div className="w-28 h-28 flex items-center justify-center text-xs text-slate-400">
                  Generating...
                </div>
              )}
            </div>

            {/* Item Details on Tag */}
            <div className="flex-1 min-w-0 text-left">
              <div className="text-[10px] font-mono font-bold text-slate-400">SKU CODE</div>
              <div className="text-sm font-extrabold font-mono text-slate-900 tracking-tight">
                {item.itemCode}
              </div>

              <div className="text-xs font-bold text-slate-800 mt-1 line-clamp-2 leading-snug">
                {item.name}
              </div>

              <div className="mt-2 grid grid-cols-2 gap-2 text-[10px]">
                <div className="bg-slate-50 p-1.5 rounded border border-slate-200">
                  <span className="text-slate-500 block">Stock Balance</span>
                  <span className="font-bold text-slate-900 font-mono">
                    {item.currentStock} {item.unit}
                  </span>
                </div>
                <div className="bg-slate-50 p-1.5 rounded border border-slate-200">
                  <span className="text-slate-500 block">Unit Cost</span>
                  <span className="font-bold text-emerald-700 font-mono">
                    {formatCurrency(item.unitPrice, item.currency)}
                  </span>
                </div>
              </div>

              <div className="mt-2 flex items-center gap-1.5 text-[10px] text-slate-600 font-medium">
                <MapPin className="w-3 h-3 text-blue-600 shrink-0" />
                <span className="truncate">Location: {item.location}</span>
              </div>
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-slate-200 flex items-center justify-between text-[9px] text-slate-500 font-mono">
            <span>Supplier: {item.supplier || `${softwareName} Certified`}</span>
            <span className="flex items-center gap-1 text-emerald-700 font-semibold">
              <ShieldCheck className="w-3 h-3" />
              <span>Verified Hardware</span>
            </span>
          </div>
        </div>

        {/* Payload Selector & Quick Copy */}
        <div className="mt-4 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-1 bg-[var(--bg-input)] p-1 rounded-lg border border-[var(--border-main)]">
            <button
              type="button"
              onClick={() => setPayloadType('text')}
              className={`px-2.5 py-1 rounded text-[11px] font-semibold transition cursor-pointer ${
                payloadType === 'text'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-[var(--text-dim)] hover:text-[var(--text-main)]'
              }`}
            >
              Readable Tag
            </button>
            <button
              type="button"
              onClick={() => setPayloadType('json')}
              className={`px-2.5 py-1 rounded text-[11px] font-semibold transition cursor-pointer ${
                payloadType === 'json'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-[var(--text-dim)] hover:text-[var(--text-main)]'
              }`}
            >
              JSON Payload
            </button>
          </div>

          <button
            type="button"
            onClick={handleCopyPayload}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] border border-[var(--border-main)] text-xs text-[var(--text-main)] transition cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy Data'}</span>
          </button>
        </div>

        {/* Action Controls */}
        <div className="mt-6 flex items-center justify-end gap-2.5 pt-4 border-t border-[var(--border-main)]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] border border-[var(--border-main)] text-xs font-semibold text-[var(--text-main)] transition cursor-pointer"
          >
            Close
          </button>

          <button
            type="button"
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] border border-[var(--border-main)] text-xs font-bold text-[var(--text-main)] transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-blue-400" />
            <span>Download PNG</span>
          </button>

          <button
            type="button"
            onClick={handlePrintLabel}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-bold transition shadow-md shadow-blue-900/30 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Asset Tag</span>
          </button>
        </div>
      </div>
    </div>
  );
};
