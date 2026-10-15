import React, { useState, useRef, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { ONLINE_LOGO_PRESETS, OnlineLogoPreset } from '../../data/logoPresets';
import {
  X,
  Upload,
  Globe,
  Sparkles,
  Check,
  RotateCcw,
  Save,
  Search,
  AlertCircle,
  FileImage,
  Eye,
  Link,
  Laptop,
  CheckCircle2,
} from 'lucide-react';

export const SoftwareLogoModal: React.FC = () => {
  const {
    isLogoModalOpen,
    setIsLogoModalOpen,
    companyConfig,
    updateSoftwareLogo,
    showToast,
    softwareName,
  } = useApp();

  const [mainTab, setMainTab] = useState<'online' | 'upload'>('online');
  const [onlineSubTab, setOnlineSubTab] = useState<'presets' | 'url'>('presets');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [onlineInputUrl, setOnlineInputUrl] = useState<string>('');
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const [uploadedFileSize, setUploadedFileSize] = useState<string>('');
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync state when modal opens
  useEffect(() => {
    if (isLogoModalOpen) {
      setPreviewUrl(companyConfig?.logoUrl || '');
      setOnlineInputUrl('');
      setUploadedFileName('');
      setUploadedFileSize('');
      setSearchQuery('');
    }
  }, [isLogoModalOpen, companyConfig?.logoUrl]);

  // Filtered online presets
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

  if (!isLogoModalOpen) return null;

  // Local PC file upload handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processUploadedFile(file);
    }
  };

  const processUploadedFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file (PNG, JPG, SVG, WebP, GIF).', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast('File size is too large. Maximum size is 5MB.', 'warning');
      return;
    }

    setUploadedFileName(file.name);
    setUploadedFileSize(`${(file.size / 1024).toFixed(1)} KB`);

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setPreviewUrl(dataUrl);
        showToast(`Loaded "${file.name}" from PC. Click "Apply Logo" to save.`, 'info');
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

  // Online URL application
  const handleApplyOnlineUrl = () => {
    const url = onlineInputUrl.trim();
    if (!url) {
      showToast('Please enter an image web URL.', 'warning');
      return;
    }
    if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('data:image/')) {
      showToast('URL must begin with https:// or http://', 'error');
      return;
    }
    setPreviewUrl(url);
    showToast('Online image loaded into preview. Click "Apply Logo" to confirm.', 'info');
  };

  // Save changes
  const handleSave = () => {
    updateSoftwareLogo(previewUrl);
    showToast('Software Logo updated successfully across all modules & header!', 'success');
    setIsLogoModalOpen(false);
  };

  // Reset to default
  const handleResetToDefault = () => {
    setPreviewUrl('');
    updateSoftwareLogo('');
    setOnlineInputUrl('');
    setUploadedFileName('');
    showToast(`Restored standard ${softwareName} vector logo.`, 'info');
    setIsLogoModalOpen(false);
  };

  const categories = [
    'All',
    'Telecom & 5G',
    'Fiber Optics',
    'Servers & Cloud',
    'Modern & Abstract',
    'Corporate Shield',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs animate-in fade-in">
      <div
        className="w-full max-w-4xl max-h-[92vh] rounded-2xl bg-[var(--bg-card)] border border-[var(--border-main)] shadow-2xl flex flex-col overflow-hidden text-[var(--text-main)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-main)] bg-[var(--bg-surface)]/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20 shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-[var(--text-main)]">
                  Choose Software Logo
                </h3>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  Feature #7
                </span>
              </div>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                Select from online curated telecom icons and web links, or upload directly from your PC
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsLogoModalOpen(false)}
            className="p-1.5 rounded-lg text-[var(--text-dim)] hover:text-[var(--text-main)] hover:bg-[var(--bg-hover)] transition cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Source Switcher: Online vs PC */}
        <div className="px-5 pt-3.5 pb-2 border-b border-[var(--border-main)] flex flex-wrap items-center justify-between gap-3 bg-[var(--bg-card)]">
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-main)]">
            <button
              type="button"
              onClick={() => setMainTab('online')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                mainTab === 'online'
                  ? 'bg-[var(--accent)] text-white shadow-xs'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>1. Choose from Online</span>
            </button>
            <button
              type="button"
              onClick={() => setMainTab('upload')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                mainTab === 'upload'
                  ? 'bg-[var(--accent)] text-white shadow-xs'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              <Laptop className="w-3.5 h-3.5" />
              <span>2. Upload from PC</span>
            </button>
          </div>

          {/* Quick status */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-[var(--text-dim)]">Current Status:</span>
            {previewUrl ? (
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Custom Logo Selected
              </span>
            ) : (
              <span className="text-blue-400 font-semibold">Standard {softwareName} SVG</span>
            )}
          </div>
        </div>

        {/* Modal Body: Two-Column Workspace */}
        <div className="flex-1 overflow-y-auto p-5 grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Main Controls Section (Col 8) */}
          <div className="lg:col-span-8 space-y-4">
            {/* TAB A: SELECT FROM ONLINE */}
            {mainTab === 'online' && (
              <div className="space-y-3.5">
                {/* Online Subtabs: Curated Presets vs Direct URL */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setOnlineSubTab('presets')}
                      className={`text-xs px-2.5 py-1 rounded-md font-semibold transition cursor-pointer ${
                        onlineSubTab === 'presets'
                          ? 'bg-[var(--bg-surface)] text-[var(--accent)] border border-[var(--accent)]/30 font-bold'
                          : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                      }`}
                    >
                      Curated Online Gallery ({ONLINE_LOGO_PRESETS.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setOnlineSubTab('url')}
                      className={`text-xs px-2.5 py-1 rounded-md font-semibold transition cursor-pointer flex items-center gap-1 ${
                        onlineSubTab === 'url'
                          ? 'bg-[var(--bg-surface)] text-[var(--accent)] border border-[var(--accent)]/30 font-bold'
                          : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                      }`}
                    >
                      <Link className="w-3 h-3" />
                      <span>Direct Web Image URL</span>
                    </button>
                  </div>

                  {onlineSubTab === 'presets' && (
                    <span className="text-[11px] text-[var(--text-dim)] hidden sm:inline">
                      Showing {filteredPresets.length} logos
                    </span>
                  )}
                </div>

                {/* Subtab 1: Curated Online Presets */}
                {onlineSubTab === 'presets' && (
                  <div className="space-y-3">
                    {/* Search & Category Filter */}
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
                        {categories.map((cat) => (
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

                    {/* Logo Presets Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[350px] overflow-y-auto pr-1">
                      {filteredPresets.map((preset) => {
                        const isSelected = previewUrl === preset.url;
                        return (
                          <div
                            key={preset.id}
                            onClick={() => {
                              setPreviewUrl(preset.url);
                              showToast(`Selected "${preset.name}". Click Apply to save.`, 'info');
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
                                {isSelected ? (
                                  <div className="w-4 h-4 rounded-full bg-[var(--accent)] text-white flex items-center justify-center shrink-0">
                                    <Check className="w-2.5 h-2.5" />
                                  </div>
                                ) : (
                                  <span
                                    className="w-2 h-2 rounded-full shrink-0"
                                    style={{ backgroundColor: preset.badgeColor }}
                                    title={preset.category}
                                  />
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
                          No online logos found matching "{searchQuery}". Try searching for "telecom", "fiber", or reset filter to "All".
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Subtab 2: Direct Image URL */}
                {onlineSubTab === 'url' && (
                  <div className="p-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-main)] space-y-3.5">
                    <div>
                      <label className="block text-xs font-bold text-[var(--text-main)] mb-1">
                        Paste Online Image Web Address (HTTPS)
                      </label>
                      <p className="text-[11px] text-[var(--text-muted)] mb-2">
                        Enter any public image link from company CDN, GitHub repository, Imgur, or cloud storage.
                      </p>
                      <div className="flex items-center gap-2">
                        <input
                          type="url"
                          value={onlineInputUrl}
                          onChange={(e) => setOnlineInputUrl(e.target.value)}
                          placeholder="https://company.example.com/assets/logo.png"
                          className="flex-1 px-3 py-2 rounded-lg bg-[var(--bg-input)] border border-[var(--border-main)] text-xs text-[var(--text-main)] font-mono focus:outline-none focus:border-[var(--accent)]"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleApplyOnlineUrl();
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={handleApplyOnlineUrl}
                          className="px-4 py-2 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-bold transition shrink-0 cursor-pointer shadow-xs"
                        >
                          Load & Preview
                        </button>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-[var(--border-main)] text-xs text-[var(--text-dim)] space-y-1.5">
                      <div className="font-semibold text-[var(--text-muted)]">
                        Quick Demo Links to Test:
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
                  </div>
                )}
              </div>
            )}

            {/* TAB B: UPLOAD FROM LOCAL PC */}
            {mainTab === 'upload' && (
              <div className="space-y-3.5">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/png, image/jpeg, image/svg+xml, image/webp, image/gif"
                  className="hidden"
                />

                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`p-8 rounded-2xl border-2 border-dashed transition-all cursor-pointer text-center flex flex-col items-center justify-center gap-3 ${
                    isDragOver
                      ? 'border-[var(--accent)] bg-[var(--accent)]/15 scale-[1.01]'
                      : 'border-[var(--border-main)] hover:border-[var(--accent)]/70 bg-[var(--bg-surface)]/60 hover:bg-[var(--bg-surface)]'
                  }`}
                >
                  <div className="p-3.5 rounded-2xl bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20 shadow-sm">
                    <Upload className="w-7 h-7" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[var(--text-main)]">
                      Click to choose image file or drag & drop here
                    </p>
                    <p className="text-xs text-[var(--text-muted)] mt-1">
                      Upload from your PC disk: PNG, JPG, WebP, GIF, or SVG (Up to 5MB)
                    </p>
                  </div>
                  <button
                    type="button"
                    className="px-4 py-2 rounded-lg bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] border border-[var(--border-main)] text-xs font-bold text-[var(--text-main)] transition shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <Laptop className="w-3.5 h-3.5 text-[var(--accent)]" />
                    <span>Browse PC Storage</span>
                  </button>
                </div>

                {uploadedFileName && (
                  <div className="p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-main)] flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <FileImage className="w-4 h-4 text-emerald-400" />
                      <div>
                        <div className="font-bold text-[var(--text-main)]">{uploadedFileName}</div>
                        <div className="text-[10px] text-[var(--text-dim)]">{uploadedFileSize}</div>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      Ready to Apply
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Live Simulation Previews (Col 4) */}
          <div className="lg:col-span-4 space-y-3.5">
            <div className="p-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-main)] space-y-3.5 shadow-xs">
              <div className="flex items-center justify-between pb-2 border-b border-[var(--border-main)]">
                <span className="text-xs font-bold text-[var(--text-main)] flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-blue-400" />
                  <span>Real-time Context Preview</span>
                </span>
                <span className="text-[9px] font-mono text-[var(--text-dim)]">
                  {previewUrl ? 'Custom' : 'Default'}
                </span>
              </div>

              {/* Large Zoomed Box */}
              <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-main)]">
                <div className="w-20 h-20 rounded-xl bg-slate-900 border border-white/10 p-1 flex items-center justify-center overflow-hidden shadow-inner">
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="Logo preview"
                      className="max-w-full max-h-full object-contain"
                    />
                  ) : (
                    <svg
                      className="w-10 h-10 text-[var(--accent)]"
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
                <span className="text-[10px] text-[var(--text-muted)] mt-2 font-medium">
                  {previewUrl ? 'Custom Selected Logo' : `Default ${softwareName} SVG`}
                </span>
              </div>

              {/* Header Simulation */}
              <div>
                <span className="block text-[10px] font-semibold text-[var(--text-muted)] mb-1 uppercase tracking-wider">
                  Top Navbar Header
                </span>
                <div className="p-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border-main)] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-white shadow-xs overflow-hidden border border-white/20"
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
                          className="w-3.5 h-3.5 text-white"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M12 2L20.5 7V17L12 22L3.5 17V7L12 2Z" fill="currentColor" fillOpacity="0.2" />
                          <circle cx="12" cy="12" r="2.5" fill="currentColor" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <div className="text-[11px] font-bold text-[var(--text-main)] leading-tight">
                        {softwareName}
                      </div>
                      <div className="text-[8px] text-[var(--text-dim)]">ICT OS</div>
                    </div>
                  </div>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    Live
                  </span>
                </div>
              </div>

              {/* Letterhead Preview */}
              <div>
                <span className="block text-[10px] font-semibold text-[var(--text-muted)] mb-1 uppercase tracking-wider">
                  Report Letterhead
                </span>
                <div className="p-2.5 rounded-lg bg-white text-slate-900 border border-slate-200 shadow-xs space-y-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-blue-600 flex items-center justify-center overflow-hidden shrink-0">
                      {previewUrl ? (
                        <img
                          src={previewUrl}
                          alt="Letterhead Logo"
                          className="w-full h-full object-contain p-0.5"
                        />
                      ) : (
                        <span className="text-[9px] font-black text-white">{(softwareName || 'TN').substring(0, 2).toUpperCase()}</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="text-[10px] font-bold text-slate-900 truncate">
                        {companyConfig?.companyName || `${softwareName} ICT Logistics`}
                      </div>
                      <div className="text-[7px] text-slate-500">Official Report</div>
                    </div>
                  </div>
                  <div className="h-0.5 bg-blue-600 w-full" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="px-5 py-3.5 border-t border-[var(--border-main)] bg-[var(--bg-surface)]/60 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleResetToDefault}
            className="text-xs px-3 py-1.5 rounded-lg bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] border border-[var(--border-main)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
            title={`Revert to Default ${softwareName} Vector`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to Default SVG</span>
          </button>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={() => setIsLogoModalOpen(false)}
              className="text-xs px-4 py-2 rounded-lg bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] border border-[var(--border-main)] text-[var(--text-main)] font-semibold transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="text-xs px-5 py-2 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-bold transition shadow flex items-center gap-1.5 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Apply Logo</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
