import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { THEMES } from '../../styles/themes';
import { SUPPORTED_CURRENCIES } from '../../services/currency';
import {
  Search,
  Palette,
  Shield,
  LogOut,
  UserCheck,
  ChevronDown,
  Check,
  DollarSign,
  Lock,
  Sparkles,
  Database,
  ExternalLink,
  Sliders,
  Image as ImageIcon,
  WifiOff,
} from 'lucide-react';
import { ThemeId } from '../../types';
import { AutoSaveWidget } from '../common/AutoSaveWidget';
import { CloudSyncWidget } from '../common/CloudSyncWidget';
import { NetworkStorageWidget } from '../common/NetworkStorageWidget';
import { PWAInstallButton } from '../pwa/PWAInstallButton';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';

export const Navbar: React.FC = () => {
  const {
    currentUser,
    logout,
    theme,
    setTheme,
    customPalette,
    homeCurrency,
    setHomeCurrency,
    companyConfig,
    setIsCommandPaletteOpen,
    setActiveTab,
    setSubTab,
    setIsLoginModalOpen,
    isLogoModalOpen,
    setIsLogoModalOpen,
    showToast,
    softwareName,
  } = useApp();

  const [isThemeOpen, setIsThemeOpen] = useState(false);
  const [isCurrencyOpen, setIsCurrencyOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const isOnline = useOnlineStatus();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[var(--border-main)] bg-[var(--bg-surface)]/95 backdrop-blur-md px-4 lg:px-6 py-2.5 transition-colors no-print">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Brand Identity */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-2.5 cursor-pointer select-none" onClick={() => setActiveTab('dashboard')}>
            {/* Dynamic TeleNest Theme-Responsive Logo Icon */}
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-md transition-all duration-300 relative group overflow-hidden border border-white/20 shrink-0"
              style={{
                backgroundColor: 'var(--accent)',
                boxShadow: '0 4px 14px var(--accent-glow)',
              }}
              title={`${softwareName} - Click icon to return to Dashboard, hover to change logo`}
            >
              {/* Dynamic Theme Gradient Glow Overlay */}
              <div className="absolute inset-0 bg-gradient-to-tr from-black/20 via-transparent to-white/25 pointer-events-none" />

              {/* Hover Edit Overlay to choose software logo */}
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  setIsLogoModalOpen(true);
                }}
                className="absolute inset-0 bg-black/75 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white z-20 cursor-pointer"
                title="Change Software Logo (Upload from PC or Select Online)"
              >
                <ImageIcon className="w-4 h-4 text-cyan-300 animate-pulse" />
              </div>

              {companyConfig?.logoUrl ? (
                <img
                  src={companyConfig.logoUrl}
                  alt="Software Logo"
                  className="w-full h-full object-contain p-0.5 relative z-10"
                />
              ) : (
                /* High-Tech TeleNest Nest & Network Hub SVG Icon */
                <svg
                  className="w-5 h-5 text-white transition-transform duration-300 group-hover:scale-110 relative z-10"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  {/* Outer Hexagonal Nest Lattice */}
                  <path d="M12 2L20.5 7V17L12 22L3.5 17V7L12 2Z" fill="currentColor" fillOpacity="0.2" />
                  {/* Telecom Signal Towers & Central Hub */}
                  <circle cx="12" cy="12" r="2.5" fill="currentColor" />
                  <path d="M12 4.5v3" />
                  <path d="M12 16.5v3" />
                  <path d="M6 8.5l2.5 1.5" />
                  <path d="M15.5 14l2.5 1.5" />
                  <path d="M18 8.5l-2.5 1.5" />
                  <path d="M8.5 14L6 15.5" />
                </svg>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight text-[var(--text-main)]">
                  {softwareName}
                </span>
                <span
                  className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded transition-colors"
                  style={{
                    backgroundColor: 'var(--accent-glow)',
                    color: 'var(--accent)',
                    border: '1px solid var(--accent)',
                    opacity: 0.9,
                  }}
                >
                  ICT OS
                </span>
              </div>
              <div className="text-[10px] text-[var(--text-muted)] font-medium flex items-center gap-1">
                <span>By Bilal Ahmed</span>
                <span className="text-[var(--text-dim)]">&bull;</span>
                <span className="hidden sm:inline text-[var(--text-dim)]">Warehouse & Field Hub</span>
              </div>
            </div>
          </div>
        </div>

        {/* Center: Command Palette Trigger Button (Ctrl+K) */}
        <div className="flex-1 max-w-md mx-2 hidden md:block">
          <button
            onClick={() => setIsCommandPaletteOpen(true)}
            className="w-full flex items-center justify-between px-3 py-1 rounded-lg bg-[var(--bg-input)] hover:bg-[var(--bg-hover)] border border-[var(--border-main)] text-[11px] text-[var(--text-muted)] hover:text-[var(--text-main)] transition shadow-inner cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-[var(--text-dim)] shrink-0" />
              <span className="truncate">Search Inventory, ICT work, projects, and expenses (Ctrl+K)...</span>
            </div>
            <kbd className="px-1.5 py-0.5 text-[9px] font-mono rounded bg-[var(--bg-card)] border border-[var(--border-light)] text-[var(--text-dim)] shadow-xs shrink-0">
              Ctrl K
            </kbd>
          </button>
        </div>

        {/* Right: Quick Tools, Theme Selector, Currency, User Profile */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Mobile Search Button (Ctrl+K) */}
          <button
            onClick={() => setIsCommandPaletteOpen(true)}
            className="md:hidden p-2 rounded-lg bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] border border-[var(--border-main)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition cursor-pointer"
            title="Search inventory, ICT work, projects, and expenses (Ctrl+K)"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* 1-Minute Daily Work Auto-Save & Manual Sync Widget */}
          <AutoSaveWidget variant="compact" />

          {/* Secure Google / Cloud ID Synchronization */}
          <CloudSyncWidget />

          {/* Portable USB & Office Network Storage Indicator */}
          <NetworkStorageWidget showToast={showToast} />

          {/* Remote Warehouse Offline / Online Indicator Pill */}
          {!isOnline && (
            <div
              className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-semibold"
              title="Remote Warehouse Offline Mode: Running from local cache without stable internet"
            >
              <WifiOff className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span className="hidden sm:inline">Offline</span>
            </div>
          )}

          {/* In-App PWA Install Prompt Button */}
          <PWAInstallButton variant="navbar" />

          {/* Currency Selector */}
          <div className="relative">
            <button
              onClick={() => {
                setIsCurrencyOpen((prev) => !prev);
                setIsThemeOpen(false);
                setIsUserMenuOpen(false);
              }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] border border-[var(--border-main)] text-xs font-semibold text-[var(--text-main)] transition"
              title="Home Currency Selector"
            >
              <DollarSign className="w-3.5 h-3.5 text-blue-400" />
              <span>{homeCurrency}</span>
              <ChevronDown className="w-3 h-3 text-[var(--text-dim)]" />
            </button>

            {isCurrencyOpen && (
              <div className="absolute right-0 mt-2 w-48 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-main)] shadow-2xl p-1.5 z-50 text-xs animate-in fade-in">
                <div className="px-2.5 py-1.5 font-bold text-[10px] uppercase text-[var(--text-dim)] tracking-wider">
                  Select Home Currency
                </div>
                <div className="max-h-56 overflow-y-auto space-y-0.5">
                  {SUPPORTED_CURRENCIES.map((c) => (
                    <button
                      key={c.code}
                      onClick={() => {
                        setHomeCurrency(c.code);
                        setIsCurrencyOpen(false);
                        showToast(`Home currency set to ${c.name} (${c.code})`, 'info');
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg transition text-left ${
                        homeCurrency === c.code
                          ? 'bg-[var(--accent)] text-white font-bold'
                          : 'hover:bg-[var(--bg-hover)] text-[var(--text-main)]'
                      }`}
                    >
                      <span>
                        {c.code} <span className="opacity-70 text-[11px]">({c.name})</span>
                      </span>
                      {homeCurrency === c.code && <Check className="w-3.5 h-3.5" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Quick Software Logo Selector Button */}
          <button
            type="button"
            onClick={() => setIsLogoModalOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] border border-[var(--border-main)] text-[var(--text-main)] transition text-xs font-semibold cursor-pointer shadow-xs"
            title="Change Software Logo: Select from Online or Upload from PC"
          >
            <ImageIcon className="w-4 h-4 text-cyan-400" />
            <span className="hidden lg:inline text-xs font-bold">Logo</span>
          </button>

          {/* Theme Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setIsThemeOpen((prev) => !prev);
                setIsCurrencyOpen(false);
                setIsUserMenuOpen(false);
              }}
              className="flex items-center gap-1.5 p-2 rounded-lg bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] border border-[var(--border-main)] text-[var(--text-main)] transition"
              title="Theme System Switcher"
            >
              <Palette className="w-4 h-4 text-blue-400" />
              <ChevronDown className="w-3 h-3 text-[var(--text-dim)]" />
            </button>

            {isThemeOpen && (
              <div className="absolute right-0 mt-2 w-64 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-main)] shadow-2xl p-2 z-50 text-xs animate-in fade-in">
                <div className="px-2 py-1 font-bold text-[10px] uppercase text-[var(--text-dim)] tracking-wider flex items-center justify-between">
                  <span>Preset Palettes</span>
                  <span className="text-[9px] font-mono">5 Themes</span>
                </div>
                <div className="space-y-1 mt-1">
                  {THEMES.map((th) => (
                    <button
                      key={th.id}
                      onClick={() => {
                        setTheme(th.id as ThemeId);
                        setIsThemeOpen(false);
                        showToast(`Applied ${th.name}`, 'info');
                      }}
                      className={`w-full flex items-center justify-between p-2 rounded-lg transition text-left ${
                        theme === th.id
                          ? 'bg-[var(--accent)] text-white font-bold'
                          : 'hover:bg-[var(--bg-hover)] text-[var(--text-main)]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-white/20 shrink-0"
                          style={{ backgroundColor: th.previewBg }}
                        />
                        <div>
                          <div className="font-semibold text-xs leading-none">{th.name}</div>
                          <div className="text-[10px] opacity-75 mt-0.5">
                            {th.isDark ? 'Dark Surface' : 'Crisp Light'}
                          </div>
                        </div>
                      </div>
                      {theme === th.id && <Check className="w-4 h-4" />}
                    </button>
                  ))}
                </div>

                {/* Custom Color Combination Section */}
                <div className="mt-2 pt-2 border-t border-[var(--border-main)]">
                  <div className="px-2 py-1 font-bold text-[10px] uppercase text-[var(--text-dim)] tracking-wider">
                    Manual Color Combination
                  </div>
                  <button
                    onClick={() => {
                      setTheme('theme-custom');
                      setIsThemeOpen(false);
                      showToast(`Applied custom palette "${customPalette?.name || 'Custom Theme'}"`, 'info');
                    }}
                    className={`w-full flex items-center justify-between p-2 rounded-lg transition text-left mt-0.5 ${
                      theme === 'theme-custom'
                        ? 'bg-[var(--accent)] text-white font-bold'
                        : 'hover:bg-[var(--bg-hover)] text-[var(--text-main)]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="flex items-center -space-x-1 shrink-0">
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-white/20"
                          style={{ backgroundColor: customPalette?.accent || '#06b6d4' }}
                        />
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-white/20"
                          style={{ backgroundColor: customPalette?.bgCard || '#151f32' }}
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-xs leading-none truncate">
                          {customPalette?.name || 'Custom Theme'}
                        </div>
                        <div className="text-[10px] opacity-75 mt-0.5">
                          {customPalette?.isDark ? 'Custom Dark' : 'Custom Light'}
                        </div>
                      </div>
                    </div>
                    {theme === 'theme-custom' && <Check className="w-4 h-4" />}
                  </button>

                  <button
                    onClick={() => {
                      setActiveTab('settings');
                      setSubTab('custom-colors');
                      setIsThemeOpen(false);
                    }}
                    className="w-full mt-1.5 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] border border-[var(--border-main)] text-[11px] font-bold text-[var(--accent)] transition"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>Design Colors in Studio...</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* User Account Dropdown */}
          {currentUser ? (
            <div className="relative">
              <button
                onClick={() => {
                  setIsUserMenuOpen((prev) => !prev);
                  setIsThemeOpen(false);
                  setIsCurrencyOpen(false);
                }}
                className="flex items-center gap-2 p-1 pl-2 rounded-lg bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] border border-[var(--border-main)] text-left transition"
              >
                <div className="text-right hidden sm:block">
                  <div className="text-xs font-bold text-[var(--text-main)] leading-tight">
                    {currentUser.fullName}
                  </div>
                  <div className="text-[10px] font-semibold text-blue-400 leading-tight">
                    {currentUser.role}
                  </div>
                </div>
                <img
                  src={currentUser.avatar}
                  alt={currentUser.fullName}
                  className="w-7 h-7 rounded-full object-cover border border-[var(--border-light)] shrink-0"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
                <ChevronDown className="w-3 h-3 text-[var(--text-dim)]" />
              </button>

              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-60 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-main)] shadow-2xl p-2 z-50 text-xs animate-in fade-in">
                  <div className="px-3 py-2 border-b border-[var(--border-main)] mb-1">
                    <div className="font-bold text-[var(--text-main)]">{currentUser.fullName}</div>
                    <div className="text-[11px] text-[var(--text-muted)]">{currentUser.email}</div>
                    <div className="mt-1 inline-block text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-500/10 text-blue-400">
                      {currentUser.role}
                    </div>
                  </div>

                  <div className="space-y-0.5">
                    <button
                      onClick={() => {
                        setActiveTab('users');
                        setIsUserMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-[var(--bg-hover)] text-[var(--text-main)] transition text-left"
                    >
                      <Shield className="w-3.5 h-3.5 text-[var(--text-dim)]" />
                      <span>Security & Permissions Matrix</span>
                    </button>
                    <button
                      onClick={() => {
                        setActiveTab('settings');
                        setIsUserMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-[var(--bg-hover)] text-[var(--text-main)] transition text-left"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-[var(--text-dim)]" />
                      <span>System Options & Backup</span>
                    </button>
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        setIsLoginModalOpen(true);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-[var(--bg-hover)] text-blue-400 transition text-left"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Switch Active User</span>
                    </button>
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        logout();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-rose-950/40 text-rose-400 transition text-left"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Lock / Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => setIsLoginModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-semibold shadow transition"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
