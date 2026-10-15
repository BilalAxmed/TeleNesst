import React, { useState, useRef, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { ONLINE_LOGO_PRESETS } from '../../data/logoPresets';
import {
  Upload,
  Globe,
  Sparkles,
  Image as ImageIcon,
  Check,
  RotateCcw,
  Save,
  CheckCircle2,
  AlertCircle,
  FileImage,
  Eye,
  Search,
  Link,
  Laptop,
} from 'lucide-react';

export const SoftwareLogoStudio: React.FC = () => {
  const { companyConfig, updateSoftwareLogo, showToast, softwareName } = useApp();

  const [activeTab, setActiveTab] = useState<'upload' | 'online-presets' | 'online-url'>('upload');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [previewUrl, setPreviewUrl] = useState<string>(companyConfig?.logoUrl || '');
  const [onlineInputUrl, setOnlineInputUrl] = useState<string>('');
  const [uploadFileName, setUploadFileName] = useState<string>('');
  const [uploadFileSize, setUploadFileSize] = useState<string>('');
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Synchronize when companyConfig changes
  React.useEffect(() => {
    if (companyConfig?.logoUrl && !previewUrl) {
      setPreviewUrl(companyConfig.logoUrl);
    }
  }, [companyConfig?.logoUrl]);

  // Filter presets
  const filteredPresets = useMemo(() => {
    return ONLINE_LOGO_PRESETS.filter((preset) => {
      const matchesCategory =
        selectedCategory === 'All' || preset.category === selectedCategory;
      const matchesSearch =
        !searchQuery.trim() ||
        preset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        preset.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        preset.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  // Handle local PC file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processUploadedFile(file);
  };

  const processUploadedFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      showToast('Please upload a valid image file (PNG, JPG, SVG, WebP).', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast('File size is too large. Please select an image under 5MB.', 'warning');
      return;
    }

    setUploadFileName(file.name);
    setUploadFileSize(`${(file.size / 1024).toFixed(1)} KB`);

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setPreviewUrl(dataUrl);
        showToast(`Image "${file.name}" loaded successfully. Click Apply to save.`, 'info');
      }
    };
    reader.onerror = () => {
      showToast('Failed to read image file from your PC.', 'error');
    };
    reader.readAsDataURL(file);
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processUploadedFile(file);
    }
  };

  // Handle applying online URL
  const handleApplyOnlineUrl = () => {
    const url = onlineInputUrl.trim();
    if (!url) {
      showToast('Please enter a valid image web URL.', 'warning');
      return;
    }
    if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('data:image/')) {
      showToast('URL must start with http:// or https://', 'error');
      return;
    }
    setPreviewUrl(url);
    showToast('Online URL loaded into preview. Click Apply to save.', 'info');
  };

  // Save changes to Global Context & LocalStorage
  const handleSaveLogo = () => {
    updateSoftwareLogo(previewUrl);
    showToast('Software Logo updated successfully across all modules & header!', 'success');
  };

  // Reset to default TeleNest Vector Logo
  const handleResetToDefault = () => {
    setPreviewUrl('');
    setOnlineInputUrl('');
    setUploadFileName('');
    setUploadFileSize('');
    updateSoftwareLogo('');
    showToast('Restored default TeleNest vector logo.', 'info');
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="p-5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-main)] shadow-xs">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[var(--border-main)]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[var(--text-main)]">
                  Software Logo & Corporate Identity Studio
                </h2>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  Feature #7
                </span>
              </div>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                Customize your {softwareName} application logo: upload from local PC, select from curated telecom presets, or paste an online image link.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={handleResetToDefault}
              className="text-xs px-3 py-1.5 rounded-lg bg-[var(--bg-surface)] hover:bg-[var(--bg-hover)] border border-[var(--border-main)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition flex items-center gap-1.5 cursor-pointer"
              title="Revert to TeleNest Default SVG"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset to Default</span>
            </button>
            <button
              type="button"
              onClick={handleSaveLogo}
              className="text-xs px-4 py-1.5 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-bold transition shadow flex items-center gap-1.5 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Apply Logo</span>
            </button>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center gap-1 mt-5 p-1 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-main)] w-fit flex-wrap">
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'upload'
                ? 'bg-[var(--accent)] text-white shadow-xs'
                : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload from PC</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('online-presets')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'online-presets'
                ? 'bg-[var(--accent)] text-white shadow-xs'
                : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Select Online Presets</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('online-url')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'online-url'
                ? 'bg-[var(--accent)] text-white shadow-xs'
                : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Online Image URL</span>
          </button>
        </div>

        {/* Studio Content Area & Live Preview Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
          {/* Controls Column (7 Cols) */}
          <div className="lg:col-span-7 space-y-4">
            {/* Tab 1: Upload from PC */}
            {activeTab === 'upload' && (
              <div className="space-y-4 animate-in fade-in">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/png, image/jpeg, image/svg+xml, image/webp"
                  className="hidden"
                />

                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`p-8 rounded-xl border-2 border-dashed transition-all cursor-pointer text-center flex flex-col items-center justify-center gap-3 ${
                    isDragOver
                      ? 'border-[var(--accent)] bg-[var(--accent)]/10 scale-[1.01]'
                      : 'border-[var(--border-main)] hover:border-[var(--accent)]/60 bg-[var(--bg-surface)]/60 hover:bg-[var(--bg-surface)]'
                  }`}
                >
                  <div className="p-3.5 rounded-2xl bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20 shadow-sm">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[var(--text-main)]">
                      Click to choose image or drag & drop here
                    </p>
                    <p className="text-xs text-[var(--text-muted)] mt-1">
                      Supports PNG, JPG, WebP, and SVG files up to 5MB
                    </p>
                  </div>
                  <button
                    type="button"
                    className="px-4 py-1.5 rounded-lg bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] border border-[var(--border-main)] text-xs font-semibold text-[var(--text-main)] transition shadow-xs"
                  >
                    Browse Local PC
                  </button>
                </div>

                {uploadFileName && (
                  <div className="p-3 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-main)] flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <FileImage className="w-4 h-4 text-emerald-400" />
                      <span className="font-semibold text-[var(--text-main)]">{uploadFileName}</span>
                      <span className="text-[10px] text-[var(--text-dim)]">({uploadFileSize})</span>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      Ready to Apply
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: Select Online Presets */}
            {activeTab === 'online-presets' && (
              <div className="space-y-3.5 animate-in fade-in">
                {/* Search & Category Filter Toolbar */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-dim)]" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search telecom, optical fiber, 5G, servers..."
                      className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-[var(--bg-input)] border border-[var(--border-main)] text-xs text-[var(--text-main)] focus:outline-none focus:border-[var(--accent)]"
                    />
                  </div>

                  <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
                    {[
                      'All',
                      'Telecom & 5G',
                      'Fiber Optics',
                      'Servers & Cloud',
                      'Modern & Abstract',
                      'Corporate Shield',
                    ].map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-2 py-1 rounded-md text-[11px] whitespace-nowrap transition cursor-pointer ${
                          selectedCategory === cat
                            ? 'bg-[var(--accent)] text-white font-bold'
                            : 'bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text-main)] border border-[var(--border-main)]'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="text-xs text-[var(--text-muted)] flex items-center justify-between">
                  <span>Click any curated telecom & corporate network logo to select it instantly:</span>
                  <span className="text-[11px] text-[var(--text-dim)]">{filteredPresets.length} available</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[360px] overflow-y-auto pr-1">
                  {filteredPresets.map((preset) => {
                    const isSelected = previewUrl === preset.url;
                    return (
                      <div
                        key={preset.id}
                        onClick={() => {
                          setPreviewUrl(preset.url);
                          showToast(`Selected preset: ${preset.name}`, 'info');
                        }}
                        className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center gap-3 group ${
                          isSelected
                            ? 'border-[var(--accent)] bg-[var(--accent)]/10 shadow-sm ring-1 ring-[var(--accent)]'
                            : 'border-[var(--border-main)] hover:border-[var(--accent)]/50 bg-[var(--bg-surface)]/60 hover:bg-[var(--bg-surface)]'
                        }`}
                      >
                        <div className="w-11 h-11 rounded-lg overflow-hidden border border-white/10 shrink-0 bg-slate-950 flex items-center justify-center p-0.5">
                          <img
                            src={preset.url}
                            alt={preset.name}
                            className="w-full h-full object-contain group-hover:scale-105 transition duration-200"
                            loading="lazy"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <h4 className="text-xs font-bold text-[var(--text-main)] truncate">
                              {preset.name}
                            </h4>
                            {isSelected && (
                              <div className="w-4 h-4 rounded-full bg-[var(--accent)] text-white flex items-center justify-center shrink-0">
                                <Check className="w-2.5 h-2.5" />
                              </div>
                            )}
                          </div>
                          <p className="text-[10px] text-[var(--text-muted)] truncate mt-0.5">
                            {preset.description}
                          </p>
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className="text-[9px] px-1.5 py-0.2 rounded font-mono bg-[var(--bg-card)] border border-[var(--border-main)] text-[var(--text-dim)]">
                              {preset.category}
                            </span>
                            {preset.sourceType === 'vector-svg' && (
                              <span className="text-[9px] text-emerald-400 font-mono">
                                Vector SVG
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {filteredPresets.length === 0 && (
                    <div className="col-span-2 p-8 text-center text-xs text-[var(--text-dim)] border border-dashed border-[var(--border-main)] rounded-xl">
                      No online logos found matching "{searchQuery}".
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tab 3: Online Image URL */}
            {activeTab === 'online-url' && (
              <div className="space-y-4 animate-in fade-in">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1">
                    Image Web Address (HTTPS URL)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="url"
                      value={onlineInputUrl}
                      onChange={(e) => setOnlineInputUrl(e.target.value)}
                      placeholder="https://example.com/corporate-telecom-logo.png"
                      className="flex-1 px-3 py-2 rounded-lg bg-[var(--bg-input)] border border-[var(--border-main)] text-xs text-[var(--text-main)] font-mono"
                    />
                    <button
                      type="button"
                      onClick={handleApplyOnlineUrl}
                      className="px-4 py-2 rounded-lg bg-[var(--bg-surface)] hover:bg-[var(--bg-hover)] border border-[var(--border-main)] text-xs font-bold text-[var(--text-main)] transition shrink-0 cursor-pointer"
                    >
                      Load & Preview
                    </button>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-main)] text-xs text-[var(--text-dim)] space-y-1.5">
                  <div className="font-semibold text-[var(--text-muted)] flex items-center gap-1.5">
                    <Link className="w-3 h-3 text-[var(--accent)]" />
                    <span>Quick Online SVG Demo Links:</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        const url = 'https://upload.wikimedia.org/wikipedia/commons/4/4e/Open_Source_Initiative_keyhole.svg';
                        setOnlineInputUrl(url);
                        setPreviewUrl(url);
                        showToast('Loaded Open Source Initiative emblem preview.', 'info');
                      }}
                      className="text-[11px] px-2 py-0.5 rounded bg-[var(--bg-card)] border border-[var(--border-main)] hover:border-[var(--accent)] text-[var(--text-main)] transition cursor-pointer"
                    >
                      Open Source Initiative SVG
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const url = 'https://upload.wikimedia.org/wikipedia/commons/a/a7/React-icon.svg';
                        setOnlineInputUrl(url);
                        setPreviewUrl(url);
                        showToast('Loaded React Optical Node SVG preview.', 'info');
                      }}
                      className="text-[11px] px-2 py-0.5 rounded bg-[var(--bg-card)] border border-[var(--border-main)] hover:border-[var(--accent)] text-[var(--text-main)] transition cursor-pointer"
                    >
                      Quantum React Node SVG
                    </button>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-main)] flex items-start gap-2.5 text-xs text-[var(--text-muted)]">
                  <AlertCircle className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                  <span>
                    Ensure the URL is publicly accessible with CORS headers enabled. Standard PNG with transparent backgrounds or SVG works best.
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Real-time Preview Showcase Column (5 Cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="p-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-main)] space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[var(--border-main)]">
                <span className="text-xs font-bold text-[var(--text-main)] flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-blue-400" />
                  <span>Live Context Previews</span>
                </span>
                <span className="text-[10px] font-mono text-[var(--text-dim)]">
                  {previewUrl ? 'Custom Logo' : 'Default SVG'}
                </span>
              </div>

              {/* Preview 1: Header / Navbar Bar */}
              <div>
                <label className="block text-[10px] font-semibold text-[var(--text-muted)] mb-1.5 uppercase tracking-wider">
                  Top Header Bar Simulation
                </label>
                <div className="p-2.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border-main)] flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-sm overflow-hidden border border-white/20"
                      style={{ backgroundColor: 'var(--accent)' }}
                    >
                      {previewUrl ? (
                        <img
                          src={previewUrl}
                          alt="Logo Preview"
                          className="w-full h-full object-contain p-0.5"
                        />
                      ) : (
                        <svg
                          className="w-4 h-4 text-white"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M12 2L20.5 7V17L12 22L3.5 17V7L12 2Z" fill="currentColor" fillOpacity="0.2" />
                          <circle cx="12" cy="12" r="2.5" fill="currentColor" />
                          <path d="M12 4.5v3" />
                          <path d="M12 16.5v3" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <div className="text-xs font-black text-[var(--text-main)] leading-none">
                        {softwareName}
                      </div>
                      <div className="text-[9px] text-[var(--text-dim)] mt-0.5 font-medium">
                        By Bilal Ahmed &bull; ICT Hub
                      </div>
                    </div>
                  </div>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    Live
                  </span>
                </div>
              </div>

              {/* Preview 2: Executive Letterhead Document Simulation */}
              <div>
                <label className="block text-[10px] font-semibold text-[var(--text-muted)] mb-1.5 uppercase tracking-wider">
                  Official Letterhead & Report Header
                </label>
                <div className="p-3 rounded-lg bg-white text-slate-900 border border-slate-200 shadow-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded bg-blue-600 flex items-center justify-center overflow-hidden">
                        {previewUrl ? (
                          <img
                            src={previewUrl}
                            alt="Logo preview letterhead"
                            className="w-full h-full object-contain p-0.5"
                          />
                        ) : (
                          <div className="text-[10px] font-black text-white">TN</div>
                        )}
                      </div>
                      <div>
                        <div className="text-[11px] font-bold text-slate-900 leading-tight">
                          {companyConfig?.companyName || `${softwareName} ICT Logistics`}
                        </div>
                        <div className="text-[8px] text-slate-500">
                          {companyConfig?.licenseNumber || 'ICT-TELCO-2024'}
                        </div>
                      </div>
                    </div>
                    <div className="text-[8px] text-slate-400 text-right">
                      OFFICIAL REPORT
                    </div>
                  </div>
                  <div className="h-0.5 bg-blue-600 w-full" />
                </div>
              </div>

              {/* Large Image Box */}
              <div className="pt-2 border-t border-[var(--border-main)] flex items-center justify-center">
                <div className="w-24 h-24 rounded-2xl bg-[var(--bg-card)] border-2 border-dashed border-[var(--border-main)] p-2 flex items-center justify-center overflow-hidden shadow-inner">
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="Logo Expanded View"
                      className="max-w-full max-h-full object-contain"
                    />
                  ) : (
                    <span className="text-[10px] text-[var(--text-dim)] text-center font-mono">
                      No custom logo set
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
