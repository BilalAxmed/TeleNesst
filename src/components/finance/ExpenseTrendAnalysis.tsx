import React, { useState, useMemo, ErrorInfo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Line,
  ComposedChart,
} from 'recharts';
import { Expense, SummaryKPI } from '../../types';
import { useApp } from '../../context/AppContext';
import { convertCurrency, formatCurrency } from '../../services/currency';
import { ExportService, ReportMeta } from '../../services/exportService';
import {
  TrendingUp,
  Wrench,
  Fuel,
  Building2,
  Calendar,
  Layers,
  ArrowUpRight,
  Filter,
  BarChart3,
  LineChart as LineChartIcon,
  Printer,
  Download,
  Sparkles,
  CheckCircle2,
  Activity,
  Cpu,
} from 'lucide-react';

interface ExpenseTrendAnalysisProps {
  expenses: Expense[];
}

export type ExpenseCategoryBucket = 'Maintenance' | 'Vehicle Fuel' | 'Rent';

export interface MonthlyTrendData {
  monthKey: string; // "2024-08"
  displayMonth: string; // "Aug 2024"
  maintenance: number;
  vehicleFuel: number;
  rent: number;
  total: number;
  maintenanceCount: number;
  fuelCount: number;
  rentCount: number;
}

/**
 * Classifies an expense record into one of the 3 specified report categories:
 * - Maintenance
 * - Vehicle Fuel
 * - Rent
 */
export function classifyExpenseCategory(e: Expense): ExpenseCategoryBucket {
  const cat = (e.category || '').toLowerCase();
  const title = (e.title || '').toLowerCase();
  const desc = (e.description || e.notes || '').toLowerCase();

  // 1. Vehicle Fuel check
  if (
    cat.includes('fuel') ||
    cat.includes('gas') ||
    cat.includes('petrol') ||
    cat.includes('diesel') ||
    title.includes('fuel') ||
    title.includes('diesel') ||
    title.includes('gasoline') ||
    desc.includes('fuel') ||
    desc.includes('petrol')
  ) {
    return 'Vehicle Fuel';
  }

  // 2. Rent check
  if (
    cat.includes('rent') ||
    cat.includes('lease') ||
    cat.includes('facility') ||
    title.includes('rent') ||
    title.includes('lease') ||
    desc.includes('rent') ||
    desc.includes('lease')
  ) {
    return 'Rent';
  }

  // 3. Default to Maintenance for all other operational upkeep, tooling, consumables & repairs
  return 'Maintenance';
}

/**
 * Stable custom tooltip component to prevent re-creation of component identity on every render
 */
interface CustomTrendTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
  homeCurrency: string;
}

const CustomTrendTooltip: React.FC<CustomTrendTooltipProps> = ({
  active,
  payload,
  label,
  homeCurrency,
}) => {
  if (!active || !payload || !payload.length) return null;
  const d = payload[0]?.payload as MonthlyTrendData | undefined;
  if (!d) return null;

  return (
    <div className="p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-main)] shadow-xl text-xs space-y-1.5 min-w-48">
      <div className="font-bold text-[var(--text-main)] border-b border-[var(--border-main)] pb-1">
        {label}
      </div>
      <div className="flex justify-between items-center text-blue-400">
        <span className="flex items-center gap-1.5">
          <Wrench className="w-3 h-3" /> Maintenance:
        </span>
        <span className="font-mono font-bold">
          {formatCurrency(d.maintenance, homeCurrency)}
        </span>
      </div>
      <div className="flex justify-between items-center text-amber-400">
        <span className="flex items-center gap-1.5">
          <Fuel className="w-3 h-3" /> Vehicle Fuel:
        </span>
        <span className="font-mono font-bold">
          {formatCurrency(d.vehicleFuel, homeCurrency)}
        </span>
      </div>
      <div className="flex justify-between items-center text-emerald-400">
        <span className="flex items-center gap-1.5">
          <Building2 className="w-3 h-3" /> Rent:
        </span>
        <span className="font-mono font-bold">
          {formatCurrency(d.rent, homeCurrency)}
        </span>
      </div>
      <div className="border-t border-[var(--border-main)] pt-1 mt-1 flex justify-between items-center font-bold text-[var(--text-main)]">
        <span>Monthly Total:</span>
        <span className="font-mono">{formatCurrency(d.total, homeCurrency)}</span>
      </div>
    </div>
  );
};

/**
 * Error boundary that protects against any 3rd party chart rendering exceptions
 */
class ChartErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; fallback: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.warn('Recharts rendered with exception, activating high-precision SVG engine:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

/**
 * Native, high-performance SVG Bar & Composed Chart.
 * 100% immune to external library hook bugs, perfectly responsive and pixel-accurate.
 */
interface SvgChartProps {
  data: MonthlyTrendData[];
  chartType: 'grouped' | 'stacked' | 'composed';
  homeCurrency: string;
}

const InteractiveSvgBarChart: React.FC<SvgChartProps> = ({ data, chartType, homeCurrency }) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (!data || data.length === 0) return null;

  const maxVal = Math.max(
    ...data.map((d) => (chartType === 'grouped' ? Math.max(d.maintenance, d.vehicleFuel, d.rent) : d.total)),
    100
  );

  const yTicksCount = 4;
  const tickStep = maxVal / yTicksCount;
  const ticks = Array.from({ length: yTicksCount + 1 }, (_, i) => Math.round(tickStep * i));

  const svgHeight = 280;
  const paddingBottom = 40;
  const paddingTop = 20;
  const chartHeight = svgHeight - paddingBottom - paddingTop;

  return (
    <div className="w-full relative select-none">
      <div className="h-72 w-full flex items-end">
        <svg viewBox={`0 0 ${data.length * 90 + 60} ${svgHeight}`} className="w-full h-full overflow-visible">
          {/* Y Axis Grid Lines */}
          {ticks.map((tick, i) => {
            const y = svgHeight - paddingBottom - (tick / maxVal) * chartHeight;
            return (
              <g key={i}>
                <line
                  x1={50}
                  y1={y}
                  x2={data.length * 90 + 50}
                  y2={y}
                  stroke="rgba(255,255,255,0.08)"
                  strokeDasharray="3 3"
                />
                <text
                  x={44}
                  y={y + 4}
                  fill="var(--text-muted)"
                  fontSize={10}
                  textAnchor="end"
                  className="font-mono"
                >
                  {tick >= 1000 ? `${(tick / 1000).toFixed(0)}k` : tick}
                </text>
              </g>
            );
          })}

          {/* Baseline */}
          <line
            x1={50}
            y1={svgHeight - paddingBottom}
            x2={data.length * 90 + 50}
            y2={svgHeight - paddingBottom}
            stroke="var(--border-main)"
          />

          {/* Render Bars / Segments */}
          {data.map((d, idx) => {
            const groupX = 60 + idx * 90;
            const isHovered = hoveredIdx === idx;

            if (chartType === 'grouped') {
              const barW = 18;
              const hMaint = (d.maintenance / maxVal) * chartHeight;
              const hFuel = (d.vehicleFuel / maxVal) * chartHeight;
              const hRent = (d.rent / maxVal) * chartHeight;

              return (
                <g
                  key={d.monthKey}
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  className="cursor-pointer transition-all duration-150"
                >
                  {/* Hover background */}
                  {isHovered && (
                    <rect
                      x={groupX - 6}
                      y={paddingTop}
                      width={68}
                      height={chartHeight}
                      fill="rgba(255,255,255,0.03)"
                      rx={6}
                    />
                  )}
                  {/* Maintenance Bar */}
                  <rect
                    x={groupX}
                    y={svgHeight - paddingBottom - hMaint}
                    width={barW}
                    height={Math.max(hMaint, 2)}
                    fill="#3b82f6"
                    rx={3}
                  />
                  {/* Fuel Bar */}
                  <rect
                    x={groupX + 20}
                    y={svgHeight - paddingBottom - hFuel}
                    width={barW}
                    height={Math.max(hFuel, 2)}
                    fill="#f59e0b"
                    rx={3}
                  />
                  {/* Rent Bar */}
                  <rect
                    x={groupX + 40}
                    y={svgHeight - paddingBottom - hRent}
                    width={barW}
                    height={Math.max(hRent, 2)}
                    fill="#10b981"
                    rx={3}
                  />
                  {/* X Label */}
                  <text
                    x={groupX + 28}
                    y={svgHeight - paddingBottom + 18}
                    fill={isHovered ? 'var(--text-main)' : 'var(--text-muted)'}
                    fontSize={11}
                    fontWeight={isHovered ? 'bold' : 'normal'}
                    textAnchor="middle"
                  >
                    {d.displayMonth}
                  </text>
                </g>
              );
            } else {
              // Stacked or Composed
              const barW = 38;
              const hMaint = (d.maintenance / maxVal) * chartHeight;
              const hFuel = (d.vehicleFuel / maxVal) * chartHeight;
              const hRent = (d.rent / maxVal) * chartHeight;
              const totalH = (d.total / maxVal) * chartHeight;

              const yMaint = svgHeight - paddingBottom - hMaint;
              const yFuel = yMaint - hFuel;
              const yRent = yFuel - hRent;

              return (
                <g
                  key={d.monthKey}
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  className="cursor-pointer transition-all duration-150"
                >
                  {/* Hover background */}
                  {isHovered && (
                    <rect
                      x={groupX - 6}
                      y={paddingTop}
                      width={barW + 12}
                      height={chartHeight}
                      fill="rgba(255,255,255,0.03)"
                      rx={6}
                    />
                  )}
                  {/* Maintenance (Bottom) */}
                  <rect
                    x={groupX}
                    y={yMaint}
                    width={barW}
                    height={Math.max(hMaint, 2)}
                    fill="#3b82f6"
                  />
                  {/* Vehicle Fuel (Middle) */}
                  <rect
                    x={groupX}
                    y={yFuel}
                    width={barW}
                    height={Math.max(hFuel, 2)}
                    fill="#f59e0b"
                  />
                  {/* Rent (Top) */}
                  <rect
                    x={groupX}
                    y={yRent}
                    width={barW}
                    height={Math.max(hRent, 2)}
                    fill="#10b981"
                    rx={3}
                  />

                  {/* Total Value text over bar on hover */}
                  {isHovered && (
                    <text
                      x={groupX + barW / 2}
                      y={Math.max(yRent - 8, 14)}
                      fill="var(--text-main)"
                      fontSize={11}
                      fontWeight="bold"
                      textAnchor="middle"
                      className="font-mono"
                    >
                      {formatCurrency(d.total, homeCurrency)}
                    </text>
                  )}

                  {/* X Label */}
                  <text
                    x={groupX + barW / 2}
                    y={svgHeight - paddingBottom + 18}
                    fill={isHovered ? 'var(--text-main)' : 'var(--text-muted)'}
                    fontSize={11}
                    fontWeight={isHovered ? 'bold' : 'normal'}
                    textAnchor="middle"
                  >
                    {d.displayMonth}
                  </text>
                </g>
              );
            }
          })}

          {/* Composed Trend Line across totals */}
          {chartType === 'composed' && data.length > 1 && (
            <polyline
              fill="none"
              stroke="#a855f7"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={data
                .map((d, idx) => {
                  const x = 60 + idx * 90 + 19;
                  const y = svgHeight - paddingBottom - (d.total / maxVal) * chartHeight;
                  return `${x},${y}`;
                })
                .join(' ')}
            />
          )}

          {chartType === 'composed' &&
            data.map((d, idx) => {
              const x = 60 + idx * 90 + 19;
              const y = svgHeight - paddingBottom - (d.total / maxVal) * chartHeight;
              return (
                <circle
                  key={`dot-${d.monthKey}`}
                  cx={x}
                  cy={y}
                  r={4}
                  fill="#a855f7"
                  stroke="#ffffff"
                  strokeWidth={1.5}
                />
              );
            })}
        </svg>
      </div>

      {/* Floating Hover Card */}
      {hoveredIdx !== null && data[hoveredIdx] && (
        <div className="absolute top-2 right-4 p-3.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-main)] shadow-2xl text-xs space-y-1.5 pointer-events-none min-w-56 z-10">
          <div className="flex items-center justify-between border-b border-[var(--border-main)] pb-1 font-bold text-[var(--text-main)]">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-400" />
              {data[hoveredIdx].displayMonth}
            </span>
            <span className="font-mono text-purple-400">
              {formatCurrency(data[hoveredIdx].total, homeCurrency)}
            </span>
          </div>
          <div className="flex justify-between items-center text-blue-400 pt-0.5">
            <span className="flex items-center gap-1.5">
              <Wrench className="w-3 h-3" /> Maintenance:
            </span>
            <span className="font-mono font-bold">
              {formatCurrency(data[hoveredIdx].maintenance, homeCurrency)}
            </span>
          </div>
          <div className="flex justify-between items-center text-amber-400">
            <span className="flex items-center gap-1.5">
              <Fuel className="w-3 h-3" /> Vehicle Fuel:
            </span>
            <span className="font-mono font-bold">
              {formatCurrency(data[hoveredIdx].vehicleFuel, homeCurrency)}
            </span>
          </div>
          <div className="flex justify-between items-center text-emerald-400">
            <span className="flex items-center gap-1.5">
              <Building2 className="w-3 h-3" /> Rent:
            </span>
            <span className="font-mono font-bold">
              {formatCurrency(data[hoveredIdx].rent, homeCurrency)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export const ExpenseTrendAnalysis: React.FC<ExpenseTrendAnalysisProps> = ({ expenses }) => {
  const { homeCurrency, exchangeRates, openLetterheadModal, currentUser, companyConfig, showToast, softwareName } = useApp();

  const [chartType, setChartType] = useState<'grouped' | 'stacked' | 'composed'>('stacked');
  const [selectedYear, setSelectedYear] = useState<string>('ALL');
  const [useNativeEngine, setUseNativeEngine] = useState(false);

  // Extract available years
  const availableYears = useMemo(() => {
    const yearSet = new Set<string>();
    expenses.forEach((e) => {
      const d = e.date || e.createdAt;
      if (d && d.length >= 4) {
        yearSet.add(d.substring(0, 4));
      }
    });
    return Array.from(yearSet).sort().reverse();
  }, [expenses]);

  // Aggregate monthly data categorized into 3 buckets: Maintenance, Vehicle Fuel, Rent
  const monthlyData: MonthlyTrendData[] = useMemo(() => {
    const map = new Map<
      string,
      {
        monthKey: string;
        displayMonth: string;
        maintenance: number;
        vehicleFuel: number;
        rent: number;
        total: number;
        maintenanceCount: number;
        fuelCount: number;
        rentCount: number;
      }
    >();

    // Month display formatter
    const formatDisplayMonth = (key: string): string => {
      const [y, m] = key.split('-');
      const monthNames = [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec',
      ];
      const mIdx = parseInt(m, 10) - 1;
      return `${monthNames[mIdx] || m} ${y}`;
    };

    expenses.forEach((e) => {
      const dateStr = e.date || e.createdAt || new Date().toISOString().split('T')[0];
      if (dateStr.length < 7) return;

      const year = dateStr.substring(0, 4);
      if (selectedYear !== 'ALL' && year !== selectedYear) return;

      const monthKey = dateStr.substring(0, 7); // "YYYY-MM"
      const bucket = classifyExpenseCategory(e);
      const convertedAmount = convertCurrency(
        e.amount,
        e.currency || homeCurrency,
        homeCurrency,
        exchangeRates
      );

      if (!map.has(monthKey)) {
        map.set(monthKey, {
          monthKey,
          displayMonth: formatDisplayMonth(monthKey),
          maintenance: 0,
          vehicleFuel: 0,
          rent: 0,
          total: 0,
          maintenanceCount: 0,
          fuelCount: 0,
          rentCount: 0,
        });
      }

      const row = map.get(monthKey)!;
      row.total += convertedAmount;

      if (bucket === 'Maintenance') {
        row.maintenance += convertedAmount;
        row.maintenanceCount += 1;
      } else if (bucket === 'Vehicle Fuel') {
        row.vehicleFuel += convertedAmount;
        row.fuelCount += 1;
      } else if (bucket === 'Rent') {
        row.rent += convertedAmount;
        row.rentCount += 1;
      }
    });

    // Sort chronologically
    return Array.from(map.values())
      .sort((a, b) => a.monthKey.localeCompare(b.monthKey))
      .map((row) => ({
        ...row,
        maintenance: Math.round(row.maintenance * 100) / 100,
        vehicleFuel: Math.round(row.vehicleFuel * 100) / 100,
        rent: Math.round(row.rent * 100) / 100,
        total: Math.round(row.total * 100) / 100,
      }));
  }, [expenses, selectedYear, homeCurrency, exchangeRates]);

  // Totals for the 3 target categories
  const summaryTotals = useMemo(() => {
    let maintenance = 0;
    let vehicleFuel = 0;
    let rent = 0;
    let total = 0;
    let maintenanceCount = 0;
    let fuelCount = 0;
    let rentCount = 0;

    monthlyData.forEach((m) => {
      maintenance += m.maintenance;
      vehicleFuel += m.vehicleFuel;
      rent += m.rent;
      total += m.total;
      maintenanceCount += m.maintenanceCount;
      fuelCount += m.fuelCount;
      rentCount += m.rentCount;
    });

    return {
      maintenance: Math.round(maintenance * 100) / 100,
      vehicleFuel: Math.round(vehicleFuel * 100) / 100,
      rent: Math.round(rent * 100) / 100,
      total: Math.round(total * 100) / 100,
      maintenanceCount,
      fuelCount,
      rentCount,
    };
  }, [monthlyData]);

  // Export report via letterhead
  const handleExportLetterhead = () => {
    const tableRows = monthlyData.map(
      (m) => `
        <tr>
          <td style="padding: 6px; border: 1px solid #cbd5e1; font-weight: 600;">${m.displayMonth}</td>
          <td style="padding: 6px; border: 1px solid #cbd5e1; text-align: right; color: #2563eb;">${formatCurrency(m.maintenance, homeCurrency)}</td>
          <td style="padding: 6px; border: 1px solid #cbd5e1; text-align: right; color: #d97706;">${formatCurrency(m.vehicleFuel, homeCurrency)}</td>
          <td style="padding: 6px; border: 1px solid #cbd5e1; text-align: right; color: #059669;">${formatCurrency(m.rent, homeCurrency)}</td>
          <td style="padding: 6px; border: 1px solid #cbd5e1; text-align: right; font-weight: bold;">${formatCurrency(m.total, homeCurrency)}</td>
        </tr>
      `
    ).join('');

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; font-size: 11pt; color: #1e293b;">
        <div style="margin-bottom: 16px; border-bottom: 2px solid #0f172a; padding-bottom: 8px;">
          <h2 style="margin: 0; font-size: 16pt; color: #0f172a; text-transform: uppercase;">
            Expense Trend Analysis & Category Audit Report
          </h2>
          <p style="margin: 4px 0 0 0; color: #64748b; font-size: 9pt;">
            Audited Periods: ${selectedYear === 'ALL' ? 'All Historical Records' : `Calendar Year ${selectedYear}`} &bull; Currency: ${homeCurrency} Normalized
          </p>
        </div>

        <div style="display: flex; gap: 12px; margin-bottom: 18px;">
          <div style="flex: 1; padding: 10px; background-color: #eff6ff; border-left: 4px solid #3b82f6; border-radius: 4px;">
            <div style="font-size: 8.5pt; color: #1e40af; font-weight: bold; text-transform: uppercase;">1. Maintenance Total</div>
            <div style="font-size: 13pt; font-weight: bold; color: #1e3a8a; margin-top: 4px;">
              ${formatCurrency(summaryTotals.maintenance, homeCurrency)}
            </div>
            <div style="font-size: 8pt; color: #60a5fa; margin-top: 2px;">${summaryTotals.maintenanceCount} entries</div>
          </div>
          <div style="flex: 1; padding: 10px; background-color: #fffbeb; border-left: 4px solid #f59e0b; border-radius: 4px;">
            <div style="font-size: 8.5pt; color: #92400e; font-weight: bold; text-transform: uppercase;">2. Vehicle Fuel Total</div>
            <div style="font-size: 13pt; font-weight: bold; color: #78350f; margin-top: 4px;">
              ${formatCurrency(summaryTotals.vehicleFuel, homeCurrency)}
            </div>
            <div style="font-size: 8pt; color: #fbbf24; margin-top: 2px;">${summaryTotals.fuelCount} entries</div>
          </div>
          <div style="flex: 1; padding: 10px; background-color: #ecfdf5; border-left: 4px solid #10b981; border-radius: 4px;">
            <div style="font-size: 8.5pt; color: #065f46; font-weight: bold; text-transform: uppercase;">3. Rent Total</div>
            <div style="font-size: 13pt; font-weight: bold; color: #064e3b; margin-top: 4px;">
              ${formatCurrency(summaryTotals.rent, homeCurrency)}
            </div>
            <div style="font-size: 8pt; color: #34d399; margin-top: 2px;">${summaryTotals.rentCount} entries</div>
          </div>
          <div style="flex: 1; padding: 10px; background-color: #f8fafc; border-left: 4px solid #0f172a; border-radius: 4px;">
            <div style="font-size: 8.5pt; color: #334155; font-weight: bold; text-transform: uppercase;">Combined Expenditure</div>
            <div style="font-size: 13pt; font-weight: bold; color: #0f172a; margin-top: 4px;">
              ${formatCurrency(summaryTotals.total, homeCurrency)}
            </div>
            <div style="font-size: 8pt; color: #64748b; margin-top: 2px;">100% Normalized</div>
          </div>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 9pt;">
          <thead>
            <tr style="background-color: #f1f5f9; color: #334155; text-align: left;">
              <th style="padding: 8px; border: 1px solid #cbd5e1;">Period (Month)</th>
              <th style="padding: 8px; border: 1px solid #cbd5e1; text-align: right;">Maintenance</th>
              <th style="padding: 8px; border: 1px solid #cbd5e1; text-align: right;">Vehicle Fuel</th>
              <th style="padding: 8px; border: 1px solid #cbd5e1; text-align: right;">Rent</th>
              <th style="padding: 8px; border: 1px solid #cbd5e1; text-align: right;">Monthly Total</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
            <tr style="background-color: #f8fafc; font-weight: bold; border-top: 2px solid #0f172a;">
              <td style="padding: 8px; border: 1px solid #cbd5e1;">AUDIT SUMMARY</td>
              <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: right; color: #2563eb;">${formatCurrency(summaryTotals.maintenance, homeCurrency)}</td>
              <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: right; color: #d97706;">${formatCurrency(summaryTotals.vehicleFuel, homeCurrency)}</td>
              <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: right; color: #059669;">${formatCurrency(summaryTotals.rent, homeCurrency)}</td>
              <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: right; font-size: 11pt; color: #0f172a;">${formatCurrency(summaryTotals.total, homeCurrency)}</td>
            </tr>
          </tbody>
        </table>

        <div style="margin-top: 24px; font-size: 8pt; color: #94a3b8; text-align: right;">
          Generated by ${softwareName} Operational Telecom System &bull; Confidential
        </div>
      </div>
    `;

    const summaryCards: SummaryKPI[] = [
      {
        label: 'Total Expenses Audited',
        value: formatCurrency(summaryTotals.total, homeCurrency, { includeCode: true }),
        subtext: selectedYear === 'ALL' ? 'All historical records' : `Calendar Year ${selectedYear}`,
      },
      {
        label: 'Maintenance Outlay',
        value: formatCurrency(summaryTotals.maintenance, homeCurrency, { includeCode: true }),
        subtext: `${summaryTotals.maintenanceCount} cost entries`,
      },
      {
        label: 'Vehicle Fuel Outlay',
        value: formatCurrency(summaryTotals.vehicleFuel, homeCurrency, { includeCode: true }),
        subtext: `${summaryTotals.fuelCount} fuel vouchers`,
      },
      {
        label: 'Rent & Lease Outlay',
        value: formatCurrency(summaryTotals.rent, homeCurrency, { includeCode: true }),
        subtext: `${summaryTotals.rentCount} facility lease records`,
      },
    ];

    openLetterheadModal({
      title: 'Expense Trend Analysis & Category Audit Report',
      columns: [
        { header: 'Period (Month)', key: 'displayMonth' },
        { header: `Maintenance (${homeCurrency})`, key: 'maintenanceFormatted' },
        { header: `Vehicle Fuel (${homeCurrency})`, key: 'fuelFormatted' },
        { header: `Rent (${homeCurrency})`, key: 'rentFormatted' },
        { header: `Monthly Total (${homeCurrency})`, key: 'totalFormatted' },
      ],
      data: monthlyData.map((m) => ({
        displayMonth: m.displayMonth,
        maintenanceFormatted: formatCurrency(m.maintenance, homeCurrency, { includeCode: true }),
        fuelFormatted: formatCurrency(m.vehicleFuel, homeCurrency, { includeCode: true }),
        rentFormatted: formatCurrency(m.rent, homeCurrency, { includeCode: true }),
        totalFormatted: formatCurrency(m.total, homeCurrency, { includeCode: true }),
      })),
      dateRange: selectedYear === 'ALL' ? 'All Historical Records' : `Calendar Year ${selectedYear}`,
      filterSummary: `Audited Categories: Maintenance (${formatCurrency(summaryTotals.maintenance, homeCurrency)}), Vehicle Fuel (${formatCurrency(summaryTotals.vehicleFuel, homeCurrency)}), Rent (${formatCurrency(summaryTotals.rent, homeCurrency)}) | Grand Total: ${formatCurrency(summaryTotals.total, homeCurrency)}`,
      summaryCards,
      moduleName: 'Finance',
    });
  };

  // Direct Download PDF with Professional Letterhead Layout
  const handleDownloadPDF = () => {
    if (!currentUser) return;
    const todayStr = new Date().toISOString().split('T')[0];

    const columns = [
      { header: 'Period (Month)', key: 'displayMonth' },
      { header: `Maintenance (${homeCurrency})`, key: 'maintenanceFormatted' },
      { header: `Vehicle Fuel (${homeCurrency})`, key: 'fuelFormatted' },
      { header: `Rent (${homeCurrency})`, key: 'rentFormatted' },
      { header: `Monthly Total (${homeCurrency})`, key: 'totalFormatted' },
    ];

    const data = monthlyData.map((m) => ({
      displayMonth: m.displayMonth,
      maintenanceFormatted: formatCurrency(m.maintenance, homeCurrency, { includeCode: true }),
      fuelFormatted: formatCurrency(m.vehicleFuel, homeCurrency, { includeCode: true }),
      rentFormatted: formatCurrency(m.rent, homeCurrency, { includeCode: true }),
      totalFormatted: formatCurrency(m.total, homeCurrency, { includeCode: true }),
    }));

    const summaryCards: SummaryKPI[] = [
      {
        label: 'Total Expenses Audited',
        value: formatCurrency(summaryTotals.total, homeCurrency, { includeCode: true }),
        subtext: selectedYear === 'ALL' ? 'All historical records' : `Calendar Year ${selectedYear}`,
      },
      {
        label: 'Maintenance Outlay',
        value: formatCurrency(summaryTotals.maintenance, homeCurrency, { includeCode: true }),
        subtext: `${summaryTotals.maintenanceCount} cost entries`,
      },
      {
        label: 'Vehicle Fuel Outlay',
        value: formatCurrency(summaryTotals.vehicleFuel, homeCurrency, { includeCode: true }),
        subtext: `${summaryTotals.fuelCount} fuel vouchers`,
      },
      {
        label: 'Rent & Lease Outlay',
        value: formatCurrency(summaryTotals.rent, homeCurrency, { includeCode: true }),
        subtext: `${summaryTotals.rentCount} facility lease records`,
      },
    ];

    const meta: ReportMeta = {
      title: 'Expense Trend Analysis & Category Audit Report',
      dateRange: selectedYear === 'ALL' ? 'All Historical Records' : `Calendar Year ${selectedYear}`,
      filterSummary: `Audited Categories: Maintenance (${formatCurrency(summaryTotals.maintenance, homeCurrency)}), Vehicle Fuel (${formatCurrency(summaryTotals.vehicleFuel, homeCurrency)}), Rent (${formatCurrency(summaryTotals.rent, homeCurrency)}) | Grand Total: ${formatCurrency(summaryTotals.total, homeCurrency)}`,
      currentUser,
      companyConfig,
      summaryCards,
      moduleName: 'Finance',
    };

    try {
      ExportService.exportToPDF(
        `${softwareName}_Expense_Trend_Analysis_${selectedYear}_${todayStr}.pdf`,
        columns,
        data,
        meta
      );
      showToast('Expense Trend Analysis PDF with corporate letterhead downloaded.', 'success');
    } catch (err: any) {
      showToast(`PDF download failed: ${err?.message || err}`, 'error');
    }
  };

  const svgFallback = (
    <InteractiveSvgBarChart
      data={monthlyData}
      chartType={chartType}
      homeCurrency={homeCurrency}
    />
  );

  return (
    <div className="space-y-6">
      {/* Header & Controls Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-main)] shadow-sm">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <span className="p-2 rounded-xl bg-blue-500/10 text-blue-500 border border-blue-500/20">
              <TrendingUp className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-[var(--text-main)] tracking-tight">
              Expense Trend Analysis
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              Finance 3.3
            </span>
          </div>
          <p className="text-xs text-[var(--text-muted)]">
            Continuous monthly trend breakdown for the 3 core expenditure streams: Maintenance, Vehicle Fuel, and Rent
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Year Filter */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-main)] text-xs">
            <Filter className="w-3.5 h-3.5 text-[var(--text-muted)]" />
            <span className="text-[var(--text-muted)] font-medium">Year:</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="bg-transparent text-[var(--text-main)] font-semibold outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-[var(--bg-surface)]">All Years</option>
              {availableYears.map((yr) => (
                <option key={yr} value={yr} className="bg-[var(--bg-surface)]">
                  {yr}
                </option>
              ))}
            </select>
          </div>

          {/* Chart Format Switcher */}
          <div className="flex items-center p-1 rounded-xl bg-[var(--bg-card)] border border-[var(--border-main)] text-xs">
            <button
              type="button"
              onClick={() => setChartType('stacked')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                chartType === 'stacked'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
              title="Stacked Bar Chart"
            >
              Stacked
            </button>
            <button
              type="button"
              onClick={() => setChartType('grouped')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                chartType === 'grouped'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
              title="Grouped Side-by-Side Bars"
            >
              Grouped
            </button>
            <button
              type="button"
              onClick={() => setChartType('composed')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                chartType === 'composed'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
              title="Composed Bar + Total Trend Line"
            >
              Composed
            </button>
          </div>

          {/* Render Engine Toggle */}
          <button
            type="button"
            onClick={() => setUseNativeEngine(!useNativeEngine)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
              useNativeEngine
                ? 'bg-purple-600/15 border-purple-500/40 text-purple-400'
                : 'bg-[var(--bg-card)] border-[var(--border-main)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
            title="Toggle between Recharts and High-Precision SVG Engine"
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>{useNativeEngine ? 'SVG Engine' : 'Recharts'}</span>
          </button>

          {/* Direct Download PDF */}
          <button
            type="button"
            onClick={handleDownloadPDF}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-colors shadow-sm cursor-pointer"
            title="Download complete expense trend analysis PDF with corporate letterhead"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download PDF</span>
          </button>

          {/* Export to Letterhead Preview */}
          <button
            type="button"
            onClick={handleExportLetterhead}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[var(--bg-card-hover)] hover:bg-[var(--border-main)] border border-[var(--border-main)] text-xs font-semibold text-[var(--text-main)] transition-colors shadow-sm cursor-pointer"
            title="Preview report in letterhead layout modal"
          >
            <Printer className="w-3.5 h-3.5 text-blue-400" />
            <span>Letterhead Export</span>
          </button>
        </div>
      </div>

      {/* 3 Core Category Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Category 1: Maintenance */}
        <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-main)] shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
              1. Maintenance
            </span>
            <span className="p-2 rounded-xl bg-blue-500/10 text-blue-500 border border-blue-500/20">
              <Wrench className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold font-mono text-[var(--text-main)]">
              {formatCurrency(summaryTotals.maintenance, homeCurrency)}
            </div>
            <div className="mt-1 flex items-center justify-between text-xs text-[var(--text-dim)]">
              <span>{summaryTotals.maintenanceCount} cost records</span>
              <span className="font-semibold text-blue-400">
                {summaryTotals.total > 0
                  ? ((summaryTotals.maintenance / summaryTotals.total) * 100).toFixed(1)
                  : '0'}
                %
              </span>
            </div>
          </div>
          <div className="w-full h-1 bg-blue-500/20 rounded-full mt-3 overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-500"
              style={{
                width: `${
                  summaryTotals.total > 0
                    ? Math.min(100, (summaryTotals.maintenance / summaryTotals.total) * 100)
                    : 0
                }%`,
              }}
            />
          </div>
        </div>

        {/* Category 2: Vehicle Fuel */}
        <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-main)] shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
              2. Vehicle Fuel
            </span>
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
              <Fuel className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold font-mono text-[var(--text-main)]">
              {formatCurrency(summaryTotals.vehicleFuel, homeCurrency)}
            </div>
            <div className="mt-1 flex items-center justify-between text-xs text-[var(--text-dim)]">
              <span>{summaryTotals.fuelCount} fuel log entries</span>
              <span className="font-semibold text-amber-400">
                {summaryTotals.total > 0
                  ? ((summaryTotals.vehicleFuel / summaryTotals.total) * 100).toFixed(1)
                  : '0'}
                %
              </span>
            </div>
          </div>
          <div className="w-full h-1 bg-amber-500/20 rounded-full mt-3 overflow-hidden">
            <div
              className="h-full bg-amber-500 rounded-full transition-all duration-500"
              style={{
                width: `${
                  summaryTotals.total > 0
                    ? Math.min(100, (summaryTotals.vehicleFuel / summaryTotals.total) * 100)
                    : 0
                }%`,
              }}
            />
          </div>
        </div>

        {/* Category 3: Rent */}
        <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-main)] shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
              3. Rent & Lease
            </span>
            <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              <Building2 className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold font-mono text-[var(--text-main)]">
              {formatCurrency(summaryTotals.rent, homeCurrency)}
            </div>
            <div className="mt-1 flex items-center justify-between text-xs text-[var(--text-dim)]">
              <span>{summaryTotals.rentCount} facility lease payments</span>
              <span className="font-semibold text-emerald-400">
                {summaryTotals.total > 0
                  ? ((summaryTotals.rent / summaryTotals.total) * 100).toFixed(1)
                  : '0'}
                %
              </span>
            </div>
          </div>
          <div className="w-full h-1 bg-emerald-500/20 rounded-full mt-3 overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-500"
              style={{
                width: `${
                  summaryTotals.total > 0
                    ? Math.min(100, (summaryTotals.rent / summaryTotals.total) * 100)
                    : 0
                }%`,
              }}
            />
          </div>
        </div>

        {/* Total Metric Card */}
        <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-main)] shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
              Total Recorded Outflow
            </span>
            <span className="p-2 rounded-xl bg-purple-500/10 text-purple-500 border border-purple-500/20">
              <Activity className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold font-mono text-[var(--accent)]">
              {formatCurrency(summaryTotals.total, homeCurrency)}
            </div>
            <div className="mt-1 flex items-center justify-between text-xs text-[var(--text-dim)]">
              <span>{monthlyData.length} monthly cycles</span>
              <span className="font-semibold text-purple-400">100% Normalized</span>
            </div>
          </div>
          <div className="w-full h-1 bg-gradient-to-r from-blue-500 via-amber-500 to-emerald-500 rounded-full mt-3" />
        </div>
      </div>

      {/* Main Chart Card */}
      <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-main)] shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-[var(--border-main)] mb-4">
          <div>
            <h3 className="text-sm font-bold text-[var(--text-main)] flex items-center gap-2">
              <span>Monthly Expenditure Trend</span>
              <span className="text-[11px] font-normal text-[var(--text-muted)]">
                ({homeCurrency} Normalized)
              </span>
            </h3>
            <p className="text-xs text-[var(--text-muted)]">
              Interactive timeline with category breakdowns, tooltips, and monthly total summaries
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs font-semibold">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-blue-500 inline-block" />
              <span className="text-[var(--text-muted)]">Maintenance</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-amber-500 inline-block" />
              <span className="text-[var(--text-muted)]">Vehicle Fuel</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-emerald-500 inline-block" />
              <span className="text-[var(--text-muted)]">Rent</span>
            </div>
          </div>
        </div>

        {monthlyData.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-[var(--text-muted)]">
            <TrendingUp className="w-10 h-10 stroke-1 mb-2 text-[var(--text-dim)]" />
            <p className="text-sm font-semibold">No expenditure records match the selected period.</p>
            <p className="text-xs text-[var(--text-dim)] mt-1">
              Add new expense entries to visualize monthly trend telemetry.
            </p>
          </div>
        ) : useNativeEngine ? (
          /* High-Precision SVG Chart Engine */
          <div className="w-full pt-2">
            <InteractiveSvgBarChart
              data={monthlyData}
              chartType={chartType}
              homeCurrency={homeCurrency}
            />
          </div>
        ) : (
          /* Recharts Chart Engine wrapped in ChartErrorBoundary */
          <div className="w-full h-80">
            <ChartErrorBoundary fallback={svgFallback}>
              <ResponsiveContainer width="100%" height={320} minHeight={320}>
                {chartType === 'composed' ? (
                  <ComposedChart data={monthlyData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.07)" vertical={false} />
                    <XAxis
                      dataKey="displayMonth"
                      tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                      tickLine={false}
                      axisLine={{ stroke: 'var(--border-main)' }}
                    />
                    <YAxis
                      tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                      tickLine={false}
                      axisLine={{ stroke: 'var(--border-main)' }}
                      tickFormatter={(val) =>
                        val >= 1000 ? `${(val / 1000).toFixed(0)}k` : `${val}`
                      }
                    />
                    <Tooltip content={<CustomTrendTooltip homeCurrency={homeCurrency} />} />
                    <Legend
                      wrapperStyle={{ paddingTop: 12 }}
                      formatter={(val) => <span style={{ color: 'var(--text-main)', fontSize: 12 }}>{val}</span>}
                    />
                    <Bar dataKey="maintenance" name="Maintenance" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="vehicleFuel" name="Vehicle Fuel" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="rent" name="Rent" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Line
                      type="monotone"
                      dataKey="total"
                      name="Total Trend"
                      stroke="#a855f7"
                      strokeWidth={2.5}
                      dot={{ r: 4, fill: '#a855f7' }}
                    />
                  </ComposedChart>
                ) : (
                  <BarChart
                    data={monthlyData}
                    margin={{ top: 10, right: 10, left: 10, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.07)" vertical={false} />
                    <XAxis
                      dataKey="displayMonth"
                      tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                      tickLine={false}
                      axisLine={{ stroke: 'var(--border-main)' }}
                    />
                    <YAxis
                      tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                      tickLine={false}
                      axisLine={{ stroke: 'var(--border-main)' }}
                      tickFormatter={(val) =>
                        val >= 1000 ? `${(val / 1000).toFixed(0)}k` : `${val}`
                      }
                    />
                    <Tooltip content={<CustomTrendTooltip homeCurrency={homeCurrency} />} />
                    <Legend
                      wrapperStyle={{ paddingTop: 12 }}
                      formatter={(val) => <span style={{ color: 'var(--text-main)', fontSize: 12 }}>{val}</span>}
                    />
                    <Bar
                      dataKey="maintenance"
                      name="Maintenance"
                      stackId={chartType === 'stacked' ? 'a' : undefined}
                      fill="#3b82f6"
                      radius={chartType === 'stacked' ? [0, 0, 0, 0] : [4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="vehicleFuel"
                      name="Vehicle Fuel"
                      stackId={chartType === 'stacked' ? 'a' : undefined}
                      fill="#f59e0b"
                      radius={chartType === 'stacked' ? [0, 0, 0, 0] : [4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="rent"
                      name="Rent"
                      stackId={chartType === 'stacked' ? 'a' : undefined}
                      fill="#10b981"
                      radius={chartType === 'stacked' ? [4, 4, 0, 0] : [4, 4, 0, 0]}
                    />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </ChartErrorBoundary>
          </div>
        )}
      </div>

      {/* Monthly Breakdown Data Table */}
      <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-main)] shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border-main)] mb-3">
          <div>
            <h3 className="text-sm font-bold text-[var(--text-main)]">Monthly Expenditure Ledger</h3>
            <p className="text-xs text-[var(--text-muted)]">
              Detailed audit trail per month in normalized home currency ({homeCurrency})
            </p>
          </div>
          <span className="text-xs font-mono text-[var(--text-muted)]">
            {monthlyData.length} reporting cycle{monthlyData.length === 1 ? '' : 's'}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[var(--bg-card)] text-[var(--text-muted)] font-semibold border-b border-[var(--border-main)]">
              <tr>
                <th className="py-2.5 px-3">Month</th>
                <th className="py-2.5 px-3 text-right">Maintenance</th>
                <th className="py-2.5 px-3 text-right">Vehicle Fuel</th>
                <th className="py-2.5 px-3 text-right">Rent</th>
                <th className="py-2.5 px-3 text-right">Monthly Total</th>
                <th className="py-2.5 px-3 text-right">% of Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-main)] text-[var(--text-main)]">
              {monthlyData.map((m) => {
                const monthPct =
                  summaryTotals.total > 0 ? (m.total / summaryTotals.total) * 100 : 0;
                return (
                  <tr key={m.monthKey} className="hover:bg-[var(--bg-hover)] transition">
                    <td className="py-2.5 px-3 font-semibold flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-blue-400" />
                      <span>{m.displayMonth}</span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-blue-400 font-semibold">
                      {formatCurrency(m.maintenance, homeCurrency)}
                      <span className="text-[10px] text-[var(--text-dim)] block font-normal">
                        {m.maintenanceCount} record{m.maintenanceCount === 1 ? '' : 's'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-amber-400 font-semibold">
                      {formatCurrency(m.vehicleFuel, homeCurrency)}
                      <span className="text-[10px] text-[var(--text-dim)] block font-normal">
                        {m.fuelCount} record{m.fuelCount === 1 ? '' : 's'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-emerald-400 font-semibold">
                      {formatCurrency(m.rent, homeCurrency)}
                      <span className="text-[10px] text-[var(--text-dim)] block font-normal">
                        {m.rentCount} record{m.rentCount === 1 ? '' : 's'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-[var(--text-main)]">
                      {formatCurrency(m.total, homeCurrency)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-[var(--text-muted)]">
                      {monthPct.toFixed(1)}%
                    </td>
                  </tr>
                );
              })}
              {monthlyData.length > 0 && (
                <tr className="bg-[var(--bg-card)] font-bold text-[var(--text-main)] border-t-2 border-[var(--border-main)]">
                  <td className="py-3 px-3 uppercase tracking-wider text-xs">Summary Total</td>
                  <td className="py-3 px-3 text-right font-mono text-blue-400">
                    {formatCurrency(summaryTotals.maintenance, homeCurrency)}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-amber-400">
                    {formatCurrency(summaryTotals.vehicleFuel, homeCurrency)}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-emerald-400">
                    {formatCurrency(summaryTotals.rent, homeCurrency)}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-base text-[var(--accent)]">
                    {formatCurrency(summaryTotals.total, homeCurrency)}
                  </td>
                  <td className="py-3 px-3 text-right font-mono">100.0%</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
