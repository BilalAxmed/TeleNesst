import React, { useRef, useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { useApp } from '../../context/AppContext';
import { ExportService } from '../../services/exportService';
import {
  Printer,
  FileSpreadsheet,
  FileText,
  Download,
  X,
  Building2,
  CheckCircle2,
  Calendar,
  Layers,
  Sparkles,
  QrCode,
  ShieldCheck,
  Copy,
  Check,
} from 'lucide-react';

export const LetterheadModal: React.FC = () => {
  const {
    letterheadModalData,
    closeLetterheadModal,
    companyConfig,
    currentUser,
    showToast,
    softwareName,
  } = useApp();

  const printAreaRef = useRef<HTMLDivElement>(null);
  const [reportQrUrl, setReportQrUrl] = useState<string>('');
  const [copiedQr, setCopiedQr] = useState(false);

  useEffect(() => {
    if (!letterheadModalData) {
      setReportQrUrl('');
      return;
    }

    const reportPayload = `${softwareName.toUpperCase()} VERIFIED REPORT
Doc: ${letterheadModalData.title}
Organization: ${companyConfig.companyName}
Rows: ${letterheadModalData.data.length} records
Scope: ${letterheadModalData.filterSummary || 'Complete Dataset'}
Period: ${letterheadModalData.dateRange || 'All Records'}
Generated: ${new Date().toISOString()}
Signatory: ${currentUser?.fullName || 'Authorized Auditor'} (${currentUser?.role || 'User'})
Lead Developer: ${companyConfig.developedBy}`;

    QRCode.toDataURL(reportPayload, {
      width: 250,
      margin: 1,
      color: { dark: '#0f172a', light: '#ffffff' },
    })
      .then((url) => setReportQrUrl(url))
      .catch((err) => console.error('Failed to generate report QR:', err));
  }, [letterheadModalData, companyConfig, currentUser]);

  if (!letterheadModalData) return null;

  const { title, columns, data, dateRange, filterSummary, summaryCards, moduleName } = letterheadModalData;

  const reportMeta = {
    title,
    dateRange,
    filterSummary,
    currentUser: currentUser || ({
      id: 'sys',
      fullName: 'System Operator',
      username: 'operator',
      role: 'Standard User' as const,
      email: 'ops@telenest.org',
      recoveryEmail: 'ops@telenest.org',
      passwordHash: '',
      createdAt: '',
      isLocked: false,
    } as any),
    companyConfig,
    summaryCards,
    moduleName,
  };

  const cleanFilename = title.replace(/[^a-z0-9]/gi, '_').toLowerCase();

  // Export handlers
  const handlePDF = () => {
    try {
      ExportService.exportToPDF(`${cleanFilename}.pdf`, columns, data, reportMeta);
      showToast('PDF with letterhead generated successfully.', 'success');
    } catch (err: any) {
      showToast(`PDF Export failed: ${err?.message || err}`, 'error');
    }
  };

  const handleExcel = () => {
    try {
      ExportService.exportToExcel(`${cleanFilename}.xlsx`, 'Report', columns, data, reportMeta);
      showToast('Excel report downloaded.', 'success');
    } catch (err: any) {
      showToast(`Excel Export failed: ${err?.message || err}`, 'error');
    }
  };

  const handleCSV = () => {
    try {
      ExportService.exportToCSV(`${cleanFilename}.csv`, columns, data);
      showToast('CSV file downloaded.', 'success');
    } catch (err: any) {
      showToast(`CSV Export failed: ${err?.message || err}`, 'error');
    }
  };

  const handlePrint = async () => {
    try {
      const result = await ExportService.openPrintLetterhead(columns, data, reportMeta);
      if (result.method === 'popup') {
        showToast('Print-ready corporate letterhead opened in window.', 'info');
      } else if (result.method === 'iframe') {
        showToast('Document sent directly to print dialogue.', 'info');
      } else {
        showToast('Print-formatted PDF downloaded successfully.', 'success');
      }
    } catch (err: any) {
      // Direct fallback
      handlePDF();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-5xl max-h-[92vh] flex flex-col bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-2xl shadow-2xl overflow-hidden text-[var(--text-main)]">
        {/* Top Control Bar */}
        <div className="p-4 border-b border-[var(--border-main)] flex items-center justify-between bg-[var(--bg-card)]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[var(--text-main)]">
                Corporate Report & Letterhead Dispatch
              </h2>
              <p className="text-[11px] text-[var(--text-muted)]">
                Formal document preview formatted for Executive Presentation & Audits
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePDF}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition shadow"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Download PDF</span>
            </button>

            <button
              onClick={handleExcel}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Export Excel</span>
            </button>

            <button
              onClick={handleCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow"
            >
              <Download className="w-3.5 h-3.5" />
              <span>CSV</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--bg-surface)] hover:bg-[var(--bg-hover)] border border-[var(--border-main)] text-xs font-semibold text-[var(--text-main)] transition"
            >
              <Printer className="w-3.5 h-3.5 text-blue-400" />
              <span>Print</span>
            </button>

            <button
              onClick={closeLetterheadModal}
              className="p-1.5 rounded-lg text-[var(--text-dim)] hover:text-[var(--text-main)] hover:bg-[var(--bg-hover)] ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Letterhead Document Preview */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-950/40">
          {/* Printable Sheet */}
          <div
            ref={printAreaRef}
            className="max-w-4xl mx-auto bg-white text-slate-900 rounded-xl shadow-xl p-8 border border-slate-200"
          >
            {/* Top Corporate Stripe */}
            <div className="h-2 w-full bg-slate-900 rounded-t -mt-8 -mx-8 mb-6 overflow-hidden flex">
              <div className="w-3/4 bg-slate-900" />
              <div className="w-1/4 bg-blue-600" />
            </div>

            {/* Letterhead Header */}
            <div className="flex items-start justify-between border-b-2 border-slate-200 pb-5">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center font-black text-white text-base tracking-wider">
                    TN
                  </div>
                  <div>
                    <h1 className="text-xl font-black tracking-tight text-slate-900">
                      {companyConfig.companyName}
                    </h1>
                    <div className="text-[11px] font-medium text-slate-500">
                      {companyConfig.tagline} &bull; Architect: <span className="font-semibold text-slate-700">{companyConfig.developedBy}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-right text-[11px] text-slate-600 leading-tight">
                <div className="font-bold text-slate-900">{companyConfig.addressLine1}</div>
                <div>{companyConfig.addressLine2}</div>
                <div className="mt-1">
                  <span className="font-semibold text-slate-800">Phone:</span> {companyConfig.phone} &bull;{' '}
                  <span className="font-semibold text-slate-800">Email:</span> {companyConfig.email}
                </div>
                <div>
                  <span className="font-semibold text-slate-800">Web:</span> {companyConfig.website}
                </div>
              </div>
            </div>

            {/* Document Title Banner with Verification QR Code */}
            <div className="my-5 p-4 rounded-lg bg-slate-50 border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-600">
                  Official Operations Record / Verification Report
                </span>
                <h2 className="text-lg font-bold text-slate-900">{title}</h2>
                <div className="text-xs text-slate-600 mt-0.5">
                  {dateRange && <span className="mr-3">Period: <strong className="text-slate-800">{dateRange}</strong></span>}
                  {filterSummary && <span>Scope: <strong className="text-slate-800">{filterSummary}</strong></span>}
                </div>
              </div>

              {/* Scannable Report Verification QR Block */}
              <div className="flex items-center gap-3 bg-white p-2 rounded-lg border border-slate-200 shadow-2xs">
                {reportQrUrl ? (
                  <img
                    src={reportQrUrl}
                    alt="Report Verification QR"
                    className="w-16 h-16 object-contain border border-slate-200 rounded"
                  />
                ) : (
                  <div className="w-16 h-16 bg-slate-100 rounded flex items-center justify-center">
                    <QrCode className="w-6 h-6 text-slate-400" />
                  </div>
                )}
                <div className="text-[10px] text-slate-600 space-y-0.5">
                  <div className="flex items-center gap-1 text-emerald-700 font-bold">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>{softwareName} Certified QR</span>
                  </div>
                  <div>Verified: <strong>{currentUser?.fullName}</strong></div>
                  <div>Role: {currentUser?.role}</div>
                  <div className="text-[9px] text-slate-400 font-mono">{new Date().toLocaleString()}</div>
                </div>
              </div>
            </div>

            {/* Executive Summary Cards (Module Data Summaries) */}
            {summaryCards && summaryCards.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
                {summaryCards.map((card, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg bg-slate-50 border border-slate-200 relative overflow-hidden"
                  >
                    <div
                      className={`absolute left-0 top-0 bottom-0 w-1 ${
                        idx === 0
                          ? 'bg-blue-600'
                          : idx === 1
                          ? 'bg-emerald-600'
                          : idx === 2
                          ? 'bg-purple-600'
                          : 'bg-amber-600'
                      }`}
                    />
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 truncate pl-1">
                      {card.label}
                    </div>
                    <div className="text-sm sm:text-base font-extrabold font-mono text-slate-900 mt-1 pl-1 truncate">
                      {card.value}
                    </div>
                    {card.subtext && (
                      <div className="text-[10px] text-slate-500 pl-1 mt-0.5 truncate">
                        {card.subtext}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Tabular Data */}
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <th className="py-2.5 px-3 w-10 text-center text-slate-400">#</th>
                    {columns.map((c) => (
                      <th key={c.key} className="py-2.5 px-3 whitespace-nowrap">
                        {c.header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-700">
                  {data.slice(0, 100).map((row, idx) => (
                    <tr key={idx} className={idx % 2 === 1 ? 'bg-slate-50/70' : 'bg-white'}>
                      <td className="py-2 px-3 text-center text-[10px] text-slate-400 font-mono">
                        {idx + 1}
                      </td>
                      {columns.map((c) => (
                        <td key={c.key} className="py-2 px-3 text-[11px]">
                          {row[c.key] !== undefined && row[c.key] !== null ? String(row[c.key]) : '—'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {data.length > 100 && (
              <div className="p-2 text-center text-[11px] text-slate-500 italic">
                (Preview displaying first 100 of {data.length} records. The full record set is exported in PDF/Excel/CSV.)
              </div>
            )}

            {/* Letterhead Footer */}
            <div className="mt-8 pt-4 border-t border-slate-200 flex flex-col md:flex-row items-center justify-between text-[10px] text-slate-500 gap-2">
              <div>
                Confidential &bull; {softwareName} Enterprise ICT Inventory Platform &bull; Developed by Bilal Ahmed
              </div>
              <div className="font-mono text-slate-400">
                Document Hash: SHA256_{Date.now().toString(16).toUpperCase()} &bull; Page 1 of 1
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
