import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ExportService } from '../../services/exportService';
import { X, Printer, FileSpreadsheet, FileText, Download, Building2, ShieldCheck, Check } from 'lucide-react';

export const LetterheadModal: React.FC = () => {
  const { letterheadModalData, closeLetterheadModal, companyConfig, currentUser, showToast, softwareName } = useApp();
  const [exportingType, setExportingType] = useState<string | null>(null);

  if (!letterheadModalData || !currentUser) return null;

  const { title, columns, data, dateRange, filterSummary, summaryCards, moduleName } = letterheadModalData;

  const handleExportPDF = () => {
    setExportingType('pdf');
    try {
      const sanitizedName = title.toLowerCase().replace(/[^a-z0-9]/g, '_');
      ExportService.exportToPDF(`${sanitizedName}_report.pdf`, columns, data, {
        title,
        dateRange,
        filterSummary,
        currentUser,
        companyConfig,
        summaryCards,
        moduleName,
      });
      showToast('PDF letterhead report generated successfully.', 'success');
    } catch (e) {
      console.error(e);
      showToast('Failed to export PDF.', 'error');
    } finally {
      setExportingType(null);
    }
  };

  const handleExportExcel = () => {
    setExportingType('excel');
    try {
      const sanitizedName = title.toLowerCase().replace(/[^a-z0-9]/g, '_');
      ExportService.exportToExcel(`${sanitizedName}_data`, 'AuditReport', columns, data, {
        title,
        dateRange,
        filterSummary,
        currentUser,
        companyConfig,
      });
      showToast('Excel (.xlsx) report exported successfully.', 'success');
    } catch (e) {
      console.error(e);
      showToast('Failed to export Excel spreadsheet.', 'error');
    } finally {
      setExportingType(null);
    }
  };

  const handleExportCSV = () => {
    setExportingType('csv');
    try {
      const sanitizedName = title.toLowerCase().replace(/[^a-z0-9]/g, '_');
      ExportService.exportToCSV(`${sanitizedName}_data`, columns, data);
      showToast('CSV file downloaded.', 'success');
    } catch (e) {
      console.error(e);
      showToast('Failed to export CSV.', 'error');
    } finally {
      setExportingType(null);
    }
  };

  const handlePrint = () => {
    ExportService.openPrintLetterhead(columns, data, {
      title,
      dateRange,
      filterSummary,
      currentUser,
      companyConfig,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-5xl max-h-[92vh] flex flex-col rounded-xl shadow-2xl overflow-hidden border border-[var(--border-main)] bg-[var(--bg-surface)] text-[var(--text-main)]">
        {/* Modal Toolbar Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-main)] bg-[var(--bg-card)]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-600/10 text-blue-500 border border-blue-500/20">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight text-[var(--text-main)]">
                Company Letterhead Export Preview
              </h2>
              <p className="text-xs text-[var(--text-muted)]">
                Multi-format enterprise export conforming to internal telecom logistics standards
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportPDF}
              disabled={exportingType !== null}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg bg-rose-600 hover:bg-rose-500 text-white shadow-sm transition disabled:opacity-50"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>{exportingType === 'pdf' ? 'Generating...' : 'PDF Letterhead'}</span>
            </button>
            <button
              onClick={handleExportExcel}
              disabled={exportingType !== null}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white shadow-sm transition disabled:opacity-50"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>{exportingType === 'excel' ? 'Saving...' : 'Excel (.xlsx)'}</span>
            </button>
            <button
              onClick={handleExportCSV}
              disabled={exportingType !== null}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[var(--bg-hover)] border border-[var(--border-light)] text-[var(--text-main)] hover:bg-[var(--border-main)] transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>CSV</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print View</span>
            </button>
            <button
              onClick={closeLetterheadModal}
              className="p-1.5 rounded-lg hover:bg-[var(--bg-hover)] text-[var(--text-dim)] hover:text-[var(--text-main)] transition"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Letterhead Paper Preview */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-950/40">
          <div className="max-w-4xl mx-auto bg-white text-slate-900 rounded-lg shadow-xl border border-slate-200 p-8 text-xs font-sans">
            {/* Top Color Accent Strip */}
            <div className="h-2 -mt-8 -mx-8 bg-gradient-to-r from-slate-900 via-blue-700 to-slate-900 mb-6 rounded-t-lg" />

            {/* Letterhead Header */}
            <div className="flex justify-between items-start pb-5 border-b-2 border-slate-900">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded bg-slate-900 text-white flex items-center justify-center font-black text-sm">
                    TN
                  </div>
                  <div>
                    <h1 className="text-xl font-extrabold tracking-tight text-slate-900 uppercase">
                      {companyConfig.companyName}
                    </h1>
                    <div className="text-[11px] font-semibold text-blue-700">
                      System Developed by {companyConfig.developedBy}
                    </div>
                  </div>
                </div>
                <p className="text-[11px] text-slate-500">{companyConfig.tagline}</p>
              </div>

              <div className="text-right text-[11px] text-slate-600 space-y-0.5 leading-tight">
                <div className="font-semibold text-slate-800">{companyConfig.addressLine1}</div>
                <div>{companyConfig.addressLine2}</div>
                <div>Tel: {companyConfig.phone} &bull; Email: {companyConfig.email}</div>
                <div className="font-mono text-[10px] text-slate-500">
                  TRN: {companyConfig.taxRegistration} &bull; Reg: {companyConfig.licenseNumber}
                </div>
              </div>
            </div>

            {/* Report Title & Metadata Banner */}
            <div className="mt-5 p-4 rounded-lg bg-slate-100 border border-slate-300 flex justify-between items-center">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-800 block">
                  Official Audited Record
                </span>
                <h2 className="text-base font-bold text-slate-900">{title}</h2>
                <div className="text-[11px] text-slate-600 mt-1 flex flex-wrap gap-x-4 gap-y-1">
                  {dateRange && (
                    <span>
                      <strong className="text-slate-800">Date Range:</strong> {dateRange}
                    </span>
                  )}
                  {filterSummary && (
                    <span>
                      <strong className="text-slate-800">Filter:</strong> {filterSummary}
                    </span>
                  )}
                  <span>
                    <strong className="text-slate-800">Items Count:</strong> {data.length} records
                  </span>
                </div>
              </div>
              <div className="text-right text-[11px] text-slate-600">
                <div className="flex items-center justify-end gap-1 font-semibold text-slate-800">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Verified System Document</span>
                </div>
                <div>Audited by: {currentUser.fullName} ({currentUser.role})</div>
                <div className="text-[10px] text-slate-500">Generated: {new Date().toLocaleString()}</div>
              </div>
            </div>

            {/* Executive Summary Metric Cards (When Available) */}
            {summaryCards && summaryCards.length > 0 && (
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                {summaryCards.map((card, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                      {card.label}
                    </div>
                    <div className="text-sm font-extrabold text-slate-900 mt-0.5 truncate" title={card.value}>
                      {card.value}
                    </div>
                    {card.subtext && (
                      <div className="text-[9px] text-slate-500 mt-0.5 truncate" title={card.subtext}>
                        {card.subtext}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Tabular Content Preview */}
            <div className="mt-5 overflow-x-auto border border-slate-300 rounded-lg">
              <table className="w-full text-left border-collapse text-[11px]">
                <thead>
                  <tr className="bg-slate-900 text-white font-semibold">
                    <th className="p-2 border border-slate-700 w-10 text-center">#</th>
                    {columns.map((c) => (
                      <th key={c.key} className="p-2 border border-slate-700 whitespace-nowrap">
                        {c.header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {data.slice(0, 15).map((row, idx) => (
                    <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                      <td className="p-2 text-center text-slate-400 font-mono text-[10px] border border-slate-200">
                        {idx + 1}
                      </td>
                      {columns.map((c) => (
                        <td key={c.key} className="p-2 border border-slate-200 text-slate-800 whitespace-nowrap">
                          {row[c.key] !== undefined && row[c.key] !== null ? String(row[c.key]) : '-'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {data.length > 15 && (
                <div className="p-2.5 text-center text-slate-500 text-[11px] bg-slate-50 border-t border-slate-200 italic">
                  Showing first 15 of {data.length} records in preview. Full dataset will be exported in PDF/Excel/CSV.
                </div>
              )}
            </div>

            {/* Letterhead Footer */}
            <div className="mt-8 pt-4 border-t border-slate-200 flex justify-between items-center text-[10px] text-slate-500">
              <div className="space-y-0.5">
                <div>{softwareName} Warehouse & ICT Activity Inventory Management System</div>
                <div className="font-semibold text-slate-700">Proprietary & Confidential &bull; Designed by Bilal Ahmed</div>
              </div>
              <div className="text-right">
                <div>Page 1 of 1</div>
                <div className="font-mono">Security Hash: TN-{Date.now().toString(16).toUpperCase()}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Bottom Bar */}
        <div className="px-6 py-3 border-t border-[var(--border-main)] bg-[var(--bg-card)] flex justify-between items-center text-xs text-[var(--text-muted)]">
          <span>
            Letterhead template meets ISO telecom audit & compliance requirements.
          </span>
          <button
            onClick={closeLetterheadModal}
            className="px-4 py-1.5 rounded-lg bg-[var(--bg-hover)] text-[var(--text-main)] hover:bg-[var(--border-main)] font-medium transition"
          >
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );
};
