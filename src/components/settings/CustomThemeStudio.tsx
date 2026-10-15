import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { CustomThemePalette } from '../../types';
import {
  CUSTOM_PRESET_TEMPLATES,
  DEFAULT_CUSTOM_PALETTE,
  applyCustomThemeVariables,
} from '../../styles/themes';
import {
  Palette,
  Sparkles,
  Check,
  RotateCcw,
  Download,
  Upload,
  Eye,
  Sun,
  Moon,
  Copy,
  CheckCheck,
  Layers,
  Box,
  TrendingUp,
  Shield,
  Sliders,
  RefreshCw,
} from 'lucide-react';

interface ColorPickerFieldProps {
  label: string;
  description: string;
  value: string;
  onChange: (val: string) => void;
}

const ColorPickerField: React.FC<ColorPickerFieldProps> = ({
  label,
  description,
  value,
  onChange,
}) => {
  return (
    <div className="p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-main)] flex items-center justify-between gap-3 hover:border-[var(--border-light)] transition">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-bold text-xs text-[var(--text-main)] truncate">{label}</span>
        </div>
        <p className="text-[10px] text-[var(--text-dim)] truncate mt-0.5">{description}</p>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-20 px-2 py-1 text-[11px] font-mono rounded bg-[var(--bg-input)] border border-[var(--border-main)] text-[var(--text-main)] uppercase text-center focus:outline-none focus:border-[var(--accent)]"
        />
        <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-[var(--border-main)] shadow-xs cursor-pointer">
          <input
            type="color"
            value={value.startsWith('#') ? value : '#000000'}
            onChange={(e) => onChange(e.target.value)}
            className="absolute -top-2 -left-2 w-12 h-12 cursor-pointer border-0 p-0"
            title={`Pick color for ${label}`}
          />
        </div>
      </div>
    </div>
  );
};

export const CustomThemeStudio: React.FC = () => {
  const {
    customPalette,
    saveAndApplyCustomPalette,
    theme,
    setTheme,
    showToast,
    softwareName,
  } = useApp();

  // Local draft palette being edited
  const [draft, setDraft] = useState<CustomThemePalette>(() => customPalette || DEFAULT_CUSTOM_PALETTE);
  const [isCopied, setIsCopied] = useState(false);
  const [importJsonText, setImportJsonText] = useState('');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [liveTestActive, setLiveTestActive] = useState(theme === 'theme-custom');

  useEffect(() => {
    if (customPalette) {
      setDraft(customPalette);
    }
  }, [customPalette]);

  // Live test on the actual document when liveTestActive is on
  useEffect(() => {
    if (liveTestActive) {
      applyCustomThemeVariables(draft);
    }
  }, [draft, liveTestActive]);

  const updateColor = (key: keyof CustomThemePalette, val: string) => {
    setDraft((prev) => {
      const next = { ...prev, [key]: val };
      if (key === 'accent') {
        // Auto-generate sensible glow
        next.accentGlow = `${val}33`;
      }
      return next;
    });
  };

  const handleApply = () => {
    saveAndApplyCustomPalette(draft);
    setLiveTestActive(true);
    showToast(`Custom theme "${draft.name || 'Custom Colors'}" activated!`, 'success');
  };

  const handleSelectTemplate = (tpl: (typeof CUSTOM_PRESET_TEMPLATES)[0]) => {
    setDraft(tpl.palette);
    if (liveTestActive) {
      applyCustomThemeVariables(tpl.palette);
    }
    showToast(`Loaded "${tpl.name}" template.`, 'info');
  };

  const handleResetToDefault = () => {
    setDraft(DEFAULT_CUSTOM_PALETTE);
    if (liveTestActive) {
      applyCustomThemeVariables(DEFAULT_CUSTOM_PALETTE);
    }
    showToast('Reset to default cyber dark combination.', 'info');
  };

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(draft, null, 2));
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
    showToast('Theme JSON copied to clipboard.', 'success');
  };

  const handleDownloadJson = () => {
    const jsonStr = JSON.stringify(draft, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${softwareName}_Theme_${(draft.name || 'custom').replace(/\s+/g, '_')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Theme configuration file downloaded.', 'success');
  };

  const handleImportJson = () => {
    try {
      const parsed = JSON.parse(importJsonText);
      if (!parsed.bgMain || !parsed.textMain || !parsed.accent) {
        throw new Error('Missing essential color properties.');
      }
      const newPalette: CustomThemePalette = {
        ...DEFAULT_CUSTOM_PALETTE,
        ...parsed,
      };
      setDraft(newPalette);
      setIsImportModalOpen(false);
      setImportJsonText('');
      showToast('Custom theme imported successfully.', 'success');
    } catch (err: any) {
      showToast(`Invalid JSON format: ${err.message}`, 'error');
    }
  };

  const isCurrentActiveTheme = theme === 'theme-custom';

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Studio Header Card */}
      <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-main)] shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[var(--border-main)]">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black tracking-tight text-[var(--text-main)]">
                  Manual Theme Studio & Color Designer
                </h2>
                <span
                  className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                    isCurrentActiveTheme
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                  }`}
                >
                  {isCurrentActiveTheme ? 'Active Theme' : 'Design Mode'}
                </span>
              </div>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                Manually design, calibrate, and choose your exact software color combination with real-time feedback
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setLiveTestActive((prev) => !prev)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                liveTestActive
                  ? 'bg-blue-600/15 text-blue-400 border-blue-500/40'
                  : 'bg-[var(--bg-surface)] text-[var(--text-muted)] border-[var(--border-main)] hover:text-[var(--text-main)]'
              }`}
              title="Toggle instant viewport preview"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Live Test: {liveTestActive ? 'ON' : 'OFF'}</span>
            </button>

            <button
              onClick={handleApply}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-bold shadow-md transition"
            >
              <Check className="w-4 h-4" />
              <span>Apply & Save Colors</span>
            </button>
          </div>
        </div>

        {/* Starting Presets Bar */}
        <div className="mt-4">
          <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-dim)] flex items-center gap-1 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>Instant Harmonic Starting Palettes (Click to Remix)</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
            {CUSTOM_PRESET_TEMPLATES.map((tpl) => (
              <button
                key={tpl.name}
                onClick={() => handleSelectTemplate(tpl)}
                className="p-2 rounded-xl border border-[var(--border-main)] bg-[var(--bg-surface)] hover:border-[var(--border-light)] hover:scale-[1.02] text-left transition group"
              >
                <div className="flex items-center gap-1 mb-1.5">
                  <div
                    className="w-3.5 h-3.5 rounded-full border border-white/20 shrink-0"
                    style={{ backgroundColor: tpl.palette.accent }}
                  />
                  <div
                    className="w-3.5 h-3.5 rounded-full border border-white/20 shrink-0"
                    style={{ backgroundColor: tpl.palette.bgCard }}
                  />
                  <div
                    className="w-3.5 h-3.5 rounded-full border border-white/20 shrink-0"
                    style={{ backgroundColor: tpl.palette.bgMain }}
                  />
                </div>
                <div className="font-bold text-[11px] text-[var(--text-main)] truncate">
                  {tpl.name}
                </div>
                <div className="text-[9px] text-[var(--text-dim)]">
                  {tpl.palette.isDark ? 'Dark' : 'Light'} Mode
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Studio Grid: Left Color Pickers, Right Interactive Live Simulation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Comprehensive Color Pickers (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-main)] shadow-sm space-y-4">
            {/* Palette Name & Mode */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-4 border-b border-[var(--border-main)]">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1">
                  Palette Label / Custom Name
                </label>
                <input
                  type="text"
                  value={draft.name}
                  onChange={(e) => updateColor('name', e.target.value)}
                  placeholder="e.g. My TeleNest Theme"
                  className="w-full px-3 py-1.5 rounded-lg bg-[var(--bg-input)] border border-[var(--border-main)] text-xs text-[var(--text-main)] focus:outline-none focus:border-[var(--accent)] font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1">
                  Contrast Mode
                </label>
                <div className="flex rounded-lg bg-[var(--bg-input)] p-1 border border-[var(--border-main)] text-xs font-semibold">
                  <button
                    onClick={() => updateColor('isDark', true as any)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-1 rounded-md transition ${
                      draft.isDark
                        ? 'bg-[var(--accent)] text-white shadow-xs'
                        : 'text-[var(--text-muted)]'
                    }`}
                  >
                    <Moon className="w-3.5 h-3.5" />
                    <span>Dark Workspace</span>
                  </button>
                  <button
                    onClick={() => updateColor('isDark', false as any)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-1 rounded-md transition ${
                      !draft.isDark
                        ? 'bg-[var(--accent)] text-white shadow-xs'
                        : 'text-[var(--text-muted)]'
                    }`}
                  >
                    <Sun className="w-3.5 h-3.5" />
                    <span>Light Workspace</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Section 1: Backgrounds */}
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-dim)] mb-2.5">
                1. Structural Backgrounds
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <ColorPickerField
                  label="Workspace Main Canvas"
                  description="Root background behind all modules (--bg-main)"
                  value={draft.bgMain}
                  onChange={(v) => updateColor('bgMain', v)}
                />
                <ColorPickerField
                  label="Navigation & Headers"
                  description="Topbar, sidebar, headers (--bg-surface)"
                  value={draft.bgSurface}
                  onChange={(v) => updateColor('bgSurface', v)}
                />
                <ColorPickerField
                  label="Cards & Modals"
                  description="KPI blocks, tables, panels (--bg-card)"
                  value={draft.bgCard}
                  onChange={(v) => updateColor('bgCard', v)}
                />
                <ColorPickerField
                  label="Input Boxes & Fields"
                  description="Form fields, selects, search (--bg-input)"
                  value={draft.bgInput}
                  onChange={(v) => updateColor('bgInput', v)}
                />
                <ColorPickerField
                  label="Hover Highlight"
                  description="Row hovers and active states (--bg-hover)"
                  value={draft.bgHover}
                  onChange={(v) => updateColor('bgHover', v)}
                />
              </div>
            </div>

            {/* Section 2: Accent & Brand Identifiers */}
            <div className="pt-2">
              <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-dim)] mb-2.5">
                2. Brand Accents & Interactive Glow
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <ColorPickerField
                  label="Primary Accent Color"
                  description="Action buttons, active tabs (--accent)"
                  value={draft.accent}
                  onChange={(v) => updateColor('accent', v)}
                />
                <ColorPickerField
                  label="Accent Hover Color"
                  description="Hover state for main buttons (--accent-hover)"
                  value={draft.accentHover}
                  onChange={(v) => updateColor('accentHover', v)}
                />
              </div>
            </div>

            {/* Section 3: Typography & Contrast */}
            <div className="pt-2">
              <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-dim)] mb-2.5">
                3. Typography & Hierarchy
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <ColorPickerField
                  label="Main Text Heading"
                  description="Primary high-contrast text (--text-main)"
                  value={draft.textMain}
                  onChange={(v) => updateColor('textMain', v)}
                />
                <ColorPickerField
                  label="Secondary Muted Text"
                  description="Subtitles, descriptions (--text-muted)"
                  value={draft.textMuted}
                  onChange={(v) => updateColor('textMuted', v)}
                />
                <ColorPickerField
                  label="Dim & Metadata Text"
                  description="Timestamps, units, tags (--text-dim)"
                  value={draft.textDim}
                  onChange={(v) => updateColor('textDim', v)}
                />
              </div>
            </div>

            {/* Section 4: Borders & Dividers */}
            <div className="pt-2">
              <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-dim)] mb-2.5">
                4. Borders & Structural Geometry
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <ColorPickerField
                  label="Main Border"
                  description="Primary card & grid borders (--border-main)"
                  value={draft.borderMain}
                  onChange={(v) => updateColor('borderMain', v)}
                />
                <ColorPickerField
                  label="Light Border"
                  description="Hover borders and subtle lines (--border-light)"
                  value={draft.borderLight}
                  onChange={(v) => updateColor('borderLight', v)}
                />
              </div>
            </div>

            {/* Backup / Export / Reset Bar */}
            <div className="pt-4 border-t border-[var(--border-main)] flex items-center justify-between flex-wrap gap-2 text-xs">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyJson}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--bg-surface)] hover:bg-[var(--bg-hover)] border border-[var(--border-main)] text-[var(--text-main)] font-semibold transition"
                >
                  {isCopied ? <CheckCheck className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{isCopied ? 'Copied!' : 'Copy JSON'}</span>
                </button>

                <button
                  onClick={handleDownloadJson}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--bg-surface)] hover:bg-[var(--bg-hover)] border border-[var(--border-main)] text-[var(--text-main)] font-semibold transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>

                <button
                  onClick={() => setIsImportModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--bg-surface)] hover:bg-[var(--bg-hover)] border border-[var(--border-main)] text-[var(--text-main)] font-semibold transition"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Import</span>
                </button>
              </div>

              <button
                onClick={handleResetToDefault}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[var(--text-dim)] hover:text-rose-400 transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Colors</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Live Interactive Mock Preview (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="sticky top-20 space-y-4">
            <div className="p-4 rounded-2xl border border-[var(--border-main)] bg-[var(--bg-card)] shadow-md">
              <div className="flex items-center justify-between pb-3 border-b border-[var(--border-main)]">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-blue-400" />
                  <span className="font-bold text-xs text-[var(--text-main)]">
                    Isolated Optical Simulation Box
                  </span>
                </div>
                <span className="text-[10px] font-mono text-[var(--text-dim)]">
                  Live CSS Render
                </span>
              </div>

              {/* Mock Container with Draft Palette explicitly applied via inline CSS variables */}
              <div
                className="mt-3 p-4 rounded-xl border transition-all duration-300 shadow-inner space-y-3"
                style={{
                  backgroundColor: draft.bgMain,
                  color: draft.textMain,
                  borderColor: draft.borderMain,
                }}
              >
                {/* Mock Header */}
                <div
                  className="p-3 rounded-lg border flex items-center justify-between"
                  style={{
                    backgroundColor: draft.bgSurface,
                    borderColor: draft.borderMain,
                  }}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-6 h-6 rounded-md text-white flex items-center justify-center font-black text-[10px]"
                      style={{ backgroundColor: draft.accent }}
                    >
                      TN
                    </div>
                    <div>
                      <div className="font-bold text-xs" style={{ color: draft.textMain }}>
                        {softwareName} Mockup
                      </div>
                      <div className="text-[9px]" style={{ color: draft.textDim }}>
                        {draft.name || 'Custom Combination'}
                      </div>
                    </div>
                  </div>
                  <div
                    className="px-2 py-0.5 rounded text-[10px] font-mono font-bold border"
                    style={{
                      backgroundColor: draft.bgInput,
                      borderColor: draft.borderLight,
                      color: draft.accent,
                    }}
                  >
                    Online
                  </div>
                </div>

                {/* Mock KPI Card */}
                <div
                  className="p-3.5 rounded-lg border shadow-xs"
                  style={{
                    backgroundColor: draft.bgCard,
                    borderColor: draft.borderMain,
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: draft.textDim }}>
                      Total Inventory Valuation
                    </span>
                    <div
                      className="p-1.5 rounded-md border"
                      style={{
                        backgroundColor: `${draft.accent}1f`,
                        color: draft.accent,
                        borderColor: `${draft.accent}3d`,
                      }}
                    >
                      <Box className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <div className="text-xl font-black font-mono mt-1.5" style={{ color: draft.textMain }}>
                    $1,482,900
                  </div>
                  <div className="text-[10px] mt-1 flex items-center justify-between" style={{ color: draft.textMuted }}>
                    <span>84 Optical Cables</span>
                    <span className="font-bold" style={{ color: draft.accent }}>
                      +14.2% Growth
                    </span>
                  </div>
                </div>

                {/* Mock Input & Button Row */}
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      readOnly
                      value="Search fiber drums, projects..."
                      className="flex-1 px-2.5 py-1.5 rounded-md text-[11px] border focus:outline-none"
                      style={{
                        backgroundColor: draft.bgInput,
                        color: draft.textMuted,
                        borderColor: draft.borderMain,
                      }}
                    />
                    <button
                      className="px-3 py-1.5 rounded-md font-bold text-xs text-white shadow-xs transition"
                      style={{
                        backgroundColor: draft.accent,
                      }}
                    >
                      Action
                    </button>
                  </div>

                  {/* Mock Progress bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px]" style={{ color: draft.textMuted }}>
                      <span>Splicing Verification</span>
                      <span className="font-mono font-bold" style={{ color: draft.accent }}>78%</span>
                    </div>
                    <div
                      className="w-full h-1.5 rounded-full overflow-hidden border"
                      style={{
                        backgroundColor: draft.bgInput,
                        borderColor: draft.borderMain,
                      }}
                    >
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: '78%',
                          backgroundColor: draft.accent,
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Mock Table Snippet */}
                <div
                  className="rounded-lg border overflow-hidden text-[10px]"
                  style={{
                    backgroundColor: draft.bgSurface,
                    borderColor: draft.borderMain,
                  }}
                >
                  <div
                    className="p-2 border-b flex justify-between font-bold"
                    style={{
                      backgroundColor: draft.bgCard,
                      borderColor: draft.borderMain,
                      color: draft.textMuted,
                    }}
                  >
                    <span>Item</span>
                    <span>Status</span>
                  </div>
                  <div
                    className="p-2 flex justify-between items-center"
                    style={{ borderBottom: `1px solid ${draft.borderLight}` }}
                  >
                    <span style={{ color: draft.textMain }}>48-Core Optical Ribbon</span>
                    <span
                      className="px-1.5 py-0.2 rounded font-mono font-bold text-[9px]"
                      style={{
                        backgroundColor: `${draft.accent}1a`,
                        color: draft.accent,
                      }}
                    >
                      Passed
                    </span>
                  </div>
                  <div className="p-2 flex justify-between items-center">
                    <span style={{ color: draft.textDim }}>Fujikura Arc Splicer</span>
                    <span style={{ color: draft.textMuted }}>Calibrated</span>
                  </div>
                </div>
              </div>

              {/* Primary Apply Button */}
              <div className="mt-4">
                <button
                  onClick={handleApply}
                  className="w-full py-2.5 rounded-xl font-bold text-xs text-white shadow-md transition flex items-center justify-center gap-2 hover:opacity-95"
                  style={{ backgroundColor: draft.accent }}
                >
                  <Check className="w-4 h-4" />
                  <span>Activate This Custom Palette System-Wide</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Import Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-2xl shadow-2xl p-6 text-[var(--text-main)]">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-main)]">
              <h3 className="font-bold text-sm">Import Custom Theme JSON</h3>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="text-[var(--text-dim)] hover:text-[var(--text-main)]"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-2">
              Paste exported {softwareName} theme JSON configuration code below:
            </p>
            <textarea
              value={importJsonText}
              onChange={(e) => setImportJsonText(e.target.value)}
              rows={8}
              placeholder='{ "bgMain": "#0c0e12", "textMain": "#f8fafc", "accent": "#3b82f6", ... }'
              className="w-full mt-3 p-3 font-mono text-xs rounded-xl bg-[var(--bg-input)] border border-[var(--border-main)] text-[var(--text-main)] focus:outline-none focus:border-[var(--accent)]"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="px-3 py-1.5 rounded-lg bg-[var(--bg-card)] text-xs text-[var(--text-main)]"
              >
                Cancel
              </button>
              <button
                onClick={handleImportJson}
                className="px-4 py-1.5 rounded-lg bg-[var(--accent)] text-white text-xs font-bold"
              >
                Parse & Load Palette
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
