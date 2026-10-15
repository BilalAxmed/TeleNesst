import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { User, ThemeId } from '../../types';
import { THEMES } from '../../styles/themes';
import { storage } from '../../services/storage';
import {
  Shield,
  Lock,
  UserCheck,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Delete,
  RefreshCw,
  Crown,
  Palette,
  Check,
} from 'lucide-react';
import { cloudSyncService } from '../../services/cloudSyncService';

export const LoginScreen: React.FC = () => {
  const {
    users,
    login,
    theme,
    setTheme,
    setCurrentUser,
    showToast,
    triggerDataRefresh,
    setIsForgotPinModalOpen,
    setPrefilledRecoveryUser,
  } = useApp();

  // Ensure effective users list is always populated even if state was empty
  const effectiveUsers = Array.isArray(users) && users.length > 0 ? users : storage.getUsers();
  const defaultUser =
    effectiveUsers.find((u) => u?.isDefault || u?.role === 'Developer/CEO') || effectiveUsers[0] || null;

  const [selectedUser, setSelectedUser] = useState<User | null>(defaultUser);
  const [pin, setPin] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);
  const [isGoogleSigningIn, setIsGoogleSigningIn] = useState<boolean>(false);
  const [capsLockActive, setCapsLockActive] = useState<boolean>(false);
  const [showThemeMenu, setShowThemeMenu] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const themeMenuRef = useRef<HTMLDivElement>(null);

  const handleGoogleSignIn = async () => {
    setIsGoogleSigningIn(true);
    setErrorMessage('');
    try {
      const res = await cloudSyncService.signInWithGoogle();
      if (res.success) {
        const fbUser = res.user;
        const email = fbUser?.email || 'bilalaxmed.47@gmail.com';
        const isSuperAdmin = email.toLowerCase() === 'bilalaxmed.47@gmail.com';

        const allUsers = storage.getUsers();
        let matchedUser = allUsers.find(
          (u) =>
            u.email?.toLowerCase() === email.toLowerCase() ||
            (isSuperAdmin && (u.role === 'Developer/CEO' || u.username.toLowerCase() === 'bilal'))
        );

        if (!matchedUser) {
          matchedUser = {
            id: `usr_${Date.now()}`,
            username: fbUser?.displayName?.replace(/\s+/g, '').toLowerCase() || email.split('@')[0],
            fullName: fbUser?.displayName || 'Google Cloud Operator',
            email: email,
            role: isSuperAdmin ? 'Developer/CEO' : 'Standard User',
            department: 'Cloud Operations & Telecom Engineering',
            avatar:
              fbUser?.photoURL ||
              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
            passwordHash: 'firebase_auth_session',
            pin: '0000',
            securityAnswers: { q1_city: '', q2_school: '', q3_nickname: '', q4_vehicle: '' },
            recoveryEmail: email,
            isLocked: false,
            canEditInventory: isSuperAdmin,
            canEditFinance: isSuperAdmin,
            canEditICT: isSuperAdmin,
            canAccessSystemSettings: isSuperAdmin,
            themePreference: 'theme-blue',
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString(),
          };
          storage.saveUsers([...allUsers, matchedUser]);
        } else {
          matchedUser = {
            ...matchedUser,
            lastLogin: new Date().toISOString(),
          };
        }

        storage.setCurrentUser(matchedUser);
        setCurrentUser(matchedUser);
        showToast(`Welcome ${matchedUser.fullName}! Authenticated via Firebase Google Auth.`, 'success');
        triggerDataRefresh();
      } else {
        setErrorMessage(res.message);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Google Authentication failed.');
    } finally {
      setIsGoogleSigningIn(false);
    }
  };

  const getInitials = (name?: string, fallback = 'U'): string => {
    if (!name) return fallback;
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return fallback;
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  // Close theme menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (themeMenuRef.current && !themeMenuRef.current.contains(e.target as Node)) {
        setShowThemeMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus the masked PIN input on mount and on selection change
  useEffect(() => {
    inputRef.current?.focus();
  }, [selectedUser]);

  // Keep selected user synced if users list updates
  useEffect(() => {
    if (!selectedUser && effectiveUsers.length > 0) {
      const def = effectiveUsers.find((u) => u?.isDefault || u?.role === 'Developer/CEO') || effectiveUsers[0];
      setSelectedUser(def);
    }
  }, [effectiveUsers, selectedUser]);

  // Monitor Caps Lock key
  useEffect(() => {
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.getModifierState) {
        setCapsLockActive(e.getModifierState('CapsLock'));
      }
    };
    window.addEventListener('keyup', handleKeyUp);
    return () => window.removeEventListener('keyup', handleKeyUp);
  }, []);

  const handleSelectUser = (user: User) => {
    setSelectedUser(user);
    setPin('');
    setErrorMessage('');
    inputRef.current?.focus();
  };

  const executePinValidation = (enteredPin: string) => {
    if (!selectedUser) {
      setErrorMessage('Please select a user account.');
      return;
    }

    if (!enteredPin || enteredPin.length < 4) {
      setErrorMessage('Please enter your 4-digit security PIN.');
      return;
    }

    setErrorMessage('');
    setIsAuthenticating(true);

    // Verify against stored user PIN
    setTimeout(() => {
      const res = login(selectedUser.username, enteredPin);
      setIsAuthenticating(false);

      if (!res.success) {
        // Generic invalid PIN message without revealing any sensitive credentials
        setErrorMessage('Invalid PIN. Access Denied.');
        setPin('');
        inputRef.current?.focus();
      }
    }, 220);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executePinValidation(pin);
  };

  const handleKeypadDigit = (digit: string) => {
    if (pin.length < 4) {
      const newPin = pin + digit;
      setPin(newPin);
      setErrorMessage('');
      if (newPin.length === 4) {
        executePinValidation(newPin);
      }
    }
  };

  const handleKeypadBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
    setErrorMessage('');
    inputRef.current?.focus();
  };

  const handleKeypadClear = () => {
    setPin('');
    setErrorMessage('');
    inputRef.current?.focus();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 4);
    setPin(val);
    setErrorMessage('');
    if (val.length === 4) {
      executePinValidation(val);
    }
  };

  const getRoleBadgeStyle = (role: string) => {
    switch (role) {
      case 'Developer/CEO':
        return 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30';
      case 'Admin':
        return 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30';
      default:
        return 'bg-[var(--accent)]/10 text-[var(--accent)] border-[var(--accent)]/30';
    }
  };

  const currentThemeObj = THEMES.find((t) => t.id === theme) || THEMES[0];

  return (
    <div
      id="login-screen-root"
      className="min-h-screen w-full flex flex-col bg-[var(--bg-main)] text-[var(--text-main)] selection:bg-[var(--accent)]/30 relative overflow-x-hidden transition-colors duration-200"
    >
      {/* Background ambient branding aura matching selected theme accent */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div
          className="absolute -top-32 -left-32 w-80 h-80 rounded-full blur-[100px] pointer-events-none opacity-20"
          style={{ backgroundColor: 'var(--accent)' }}
        />
        <div
          className="absolute top-1/2 -right-32 w-80 h-80 rounded-full blur-[100px] pointer-events-none opacity-15"
          style={{ backgroundColor: 'var(--accent)' }}
        />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, var(--accent) 1px, transparent 0)`,
            backgroundSize: '28px 28px',
          }}
        />
      </div>

      {/* Top Bar with Live Theme Selector */}
      <div className="relative z-20 w-full px-4 sm:px-8 py-3 flex items-center justify-between border-b border-[var(--border-main)] bg-[var(--bg-surface)]/80 backdrop-blur-md">
        <div className="flex items-center gap-2 text-xs font-semibold text-[var(--text-muted)]">
          <Shield className="w-4 h-4 text-[var(--accent)]" />
          <span>TeleNest ICT Security Gateway</span>
        </div>

        {/* Theme Menu Dropdown */}
        <div className="relative" ref={themeMenuRef}>
          <button
            type="button"
            id="login-theme-selector-btn"
            onClick={() => setShowThemeMenu((prev) => !prev)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border-main)] hover:border-[var(--accent)] text-xs font-medium text-[var(--text-main)] transition shadow-xs cursor-pointer"
            title="Switch theme"
          >
            <div
              className="w-3 h-3 rounded-full border border-black/10 shrink-0"
              style={{ backgroundColor: currentThemeObj.accentColor }}
            />
            <span className="hidden sm:inline">{currentThemeObj.name}</span>
            <span className="sm:hidden">Theme</span>
            <Palette className="w-3.5 h-3.5 text-[var(--text-muted)]" />
          </button>

          {showThemeMenu && (
            <div className="absolute right-0 mt-1.5 w-64 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-main)] shadow-2xl py-1.5 z-50 animate-in fade-in zoom-in-95">
              <div className="px-3 py-1.5 text-[10px] font-bold text-[var(--text-dim)] uppercase tracking-wider border-b border-[var(--border-light)]">
                Select Visual Theme
              </div>
              <div className="max-h-64 overflow-y-auto p-1 space-y-1">
                {THEMES.map((t) => {
                  const isActive = theme === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        setTheme(t.id as ThemeId);
                        setShowThemeMenu(false);
                      }}
                      className={`w-full text-left px-2.5 py-2 rounded-lg text-xs flex items-center justify-between transition cursor-pointer ${
                        isActive
                          ? 'bg-[var(--bg-hover)] text-[var(--accent)] font-semibold'
                          : 'text-[var(--text-main)] hover:bg-[var(--bg-hover)]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-3.5 h-3.5 rounded-full border border-black/10 shrink-0"
                          style={{ backgroundColor: t.accentColor }}
                        />
                        <span>{t.name}</span>
                      </div>
                      {isActive && <Check className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Authentication Container */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-4 sm:p-6 max-w-4xl mx-auto w-full">
        {/* Official Brand Header & Logo Icon */}
        <div className="text-center mb-6 flex flex-col items-center">
          <div className="relative mb-3">
            <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-[var(--bg-surface)] border-2 border-[var(--accent)]/50 p-2 shadow-xl flex items-center justify-center">
              <svg
                className="w-full h-full drop-shadow-sm"
                viewBox="0 0 256 256"
                fill="none"
              >
                <polygon
                  points="128,34 212,82 212,174 128,222 44,174 44,82"
                  fill="var(--accent)"
                  fillOpacity="0.12"
                  stroke="var(--accent)"
                  strokeWidth="6"
                  strokeLinejoin="round"
                />
                <circle
                  cx="128"
                  cy="128"
                  r="64"
                  stroke="var(--accent)"
                  strokeWidth="3.5"
                  strokeDasharray="10 6"
                  strokeOpacity="0.85"
                />
                <circle cx="128" cy="128" r="40" fill="var(--bg-surface)" stroke="var(--accent)" strokeWidth="3" />
                <circle cx="128" cy="128" r="22" fill="var(--accent)" />
                <circle cx="128" cy="128" r="10" fill="#ffffff" />
                <line x1="128" y1="52" x2="128" y2="96" stroke="var(--accent)" strokeWidth="5" strokeLinecap="round" />
                <line x1="128" y1="160" x2="128" y2="204" stroke="var(--accent)" strokeWidth="5" strokeLinecap="round" />
                <line x1="62" y1="90" x2="100" y2="112" stroke="var(--accent)" strokeWidth="5" strokeLinecap="round" />
                <line x1="156" y1="144" x2="194" y2="166" stroke="var(--accent)" strokeWidth="5" strokeLinecap="round" />
                <line x1="194" y1="90" x2="156" y2="112" stroke="var(--accent)" strokeWidth="5" strokeLinecap="round" />
                <line x1="100" y1="144" x2="62" y2="166" stroke="var(--accent)" strokeWidth="5" strokeLinecap="round" />
              </svg>
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[var(--text-main)] flex items-center justify-center gap-2">
            <span>TeleNest</span>
            <span className="text-[var(--accent)] font-light">Security Gateway</span>
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-1 max-w-sm">
            Warehouse Logistics & ICT Infrastructure Management
          </p>
        </div>

        {/* Security Alert: Generic Invalid PIN Message */}
        {errorMessage && (
          <div
            id="auth-error-banner"
            className="w-full max-w-md mb-4 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/40 text-rose-600 dark:text-rose-300 text-xs shadow-md flex items-center gap-2.5 animate-in fade-in"
          >
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <div className="font-semibold">{errorMessage}</div>
          </div>
        )}

        {/* Main Authentication Card */}
        <div className="w-full max-w-3xl bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-2xl shadow-xl backdrop-blur-xl overflow-hidden grid grid-cols-1 md:grid-cols-12 transition-colors duration-200">
          {/* Left Panel: User Profile Selection */}
          <div className="md:col-span-5 p-5 sm:p-6 border-b md:border-b-0 md:border-r border-[var(--border-main)] bg-[var(--bg-card)] flex flex-col justify-between">
            <div>
              <div className="text-[11px] font-bold text-[var(--accent)] uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5" />
                <span>Select User Account</span>
              </div>

              <div className="space-y-2">
                {effectiveUsers.map((u) => {
                  const isSelected = selectedUser?.id === u.id;
                  return (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => handleSelectUser(u)}
                      className={`w-full p-2.5 rounded-xl border text-left transition-all duration-150 flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? 'bg-[var(--bg-hover)] border-[var(--accent)] ring-1 ring-[var(--accent)]/40 shadow-xs'
                          : 'bg-[var(--bg-surface)] border-[var(--border-light)] hover:bg-[var(--bg-hover)] text-[var(--text-muted)]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="relative shrink-0">
                          {u.avatar ? (
                            <img
                              src={u.avatar}
                              alt={u.fullName || u.username}
                              className="w-9 h-9 rounded-full object-cover border border-[var(--border-main)]"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-[var(--accent)]/15 text-[var(--accent)] font-bold text-xs flex items-center justify-center border border-[var(--accent)]/30">
                              {getInitials(u.fullName || u.username)}
                            </div>
                          )}
                          {isSelected && (
                            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-[var(--accent)] border border-[var(--bg-surface)] flex items-center justify-center text-[7px] text-white font-bold">
                              ✓
                            </span>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-xs text-[var(--text-main)] truncate flex items-center gap-1">
                            <span>{u.fullName || u.username}</span>
                            {u.role === 'Developer/CEO' && (
                              <Crown className="w-3 h-3 text-amber-500 shrink-0" />
                            )}
                          </div>
                          <div className="mt-0.5 flex items-center gap-1.5 flex-wrap">
                            <span
                              className={`text-[8px] font-semibold px-1.5 py-0.2 rounded border ${
                                u.role === 'Developer/CEO'
                                ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30'
                                : getRoleBadgeStyle(u.role)
                              }`}
                            >
                              {u.role}
                            </span>
                            {u.customRole && (
                              <span className="text-[9px] text-[var(--text-dim)] truncate max-w-[120px]">
                                {u.customRole}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <ChevronRight
                        className={`w-4 h-4 shrink-0 ${
                          isSelected ? 'text-[var(--accent)]' : 'text-[var(--text-dim)]'
                        }`}
                      />
                    </button>
                  );
                })}

                {effectiveUsers.length === 0 && (
                  <div className="text-center py-4 text-xs text-[var(--text-muted)] space-y-2">
                    <p>No user profiles found in storage.</p>
                    <button
                      type="button"
                      onClick={() => {
                        window.location.reload();
                      }}
                      className="px-3 py-1.5 rounded-lg bg-blue-600 text-white font-semibold text-xs hover:bg-blue-700 transition"
                    >
                      Reload Default Profiles
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-[var(--border-main)] text-[10px] text-[var(--text-dim)] flex items-center gap-1.5">
              <Shield className="w-3 h-3 text-[var(--accent)] shrink-0" />
              <span>Authentication required to open TeleNest</span>
            </div>
          </div>

          {/* Right Panel: Masked PIN Entry & Keypad */}
          <div className="md:col-span-7 p-5 sm:p-7 flex flex-col justify-between bg-[var(--bg-surface)]">
            <div>
              {/* Active Profile Info */}
              {selectedUser ? (
                <div className="mb-5 p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-main)] flex items-center justify-between shadow-xs">
                  <div className="flex items-center gap-3">
                    {selectedUser.avatar ? (
                      <img
                        src={selectedUser.avatar}
                        alt={selectedUser.fullName || selectedUser.username}
                        className="w-10 h-10 rounded-full object-cover border border-[var(--accent)]/40"
                      />
                    ) : (
                      <div
                        className={`w-10 h-10 rounded-full font-bold text-sm flex items-center justify-center text-white ${
                          selectedUser.role === 'Developer/CEO'
                            ? 'bg-gradient-to-tr from-amber-500 to-orange-500 shadow-sm'
                            : 'bg-[var(--accent)] shadow-sm'
                        }`}
                      >
                        {selectedUser.role === 'Developer/CEO' ? (
                          <Crown className="w-5 h-5 text-white" />
                        ) : (
                          getInitials(selectedUser.fullName || selectedUser.username)
                        )}
                      </div>
                    )}
                    <div>
                      <div className="text-xs font-bold text-[var(--text-main)] flex items-center gap-1.5">
                        <span>{selectedUser.fullName || selectedUser.username}</span>
                        {selectedUser.role === 'Developer/CEO' && (
                          <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/30">
                            Root Authority
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-[var(--text-muted)] flex items-center gap-1.5 mt-0.5">
                        <span className="font-mono text-[var(--accent)] font-semibold">@{selectedUser.username}</span>
                        <span>•</span>
                        <span>{selectedUser.customRole || selectedUser.department || selectedUser.role}</span>
                      </div>
                    </div>
                  </div>

                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Active</span>
                  </span>
                </div>
              ) : (
                <div className="mb-5 p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-main)] text-center text-xs text-[var(--text-muted)]">
                  Please select an account from the left to enter PIN
                </div>
              )}

              {/* Masked PIN Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <div className="text-center mb-2">
                    <label
                      htmlFor="pin-masked-input"
                      className="text-xs font-semibold text-[var(--text-muted)] flex items-center justify-center gap-1.5"
                    >
                      <Lock className="w-3.5 h-3.5 text-[var(--accent)]" />
                      <span>Enter 4-Digit Security PIN</span>
                    </label>
                  </div>

                  {/* Visual 4-Dot Password Mask Indicators */}
                  <div className="flex justify-center items-center gap-3 my-3">
                    {[0, 1, 2, 3].map((index) => {
                      const isFilled = pin.length > index;
                      return (
                        <div
                          key={index}
                          className={`w-4 h-4 rounded-full transition-all duration-150 border flex items-center justify-center ${
                            isFilled
                              ? 'bg-[var(--accent)] border-[var(--accent)] shadow-[0_0_8px_var(--accent-glow)] scale-110'
                              : 'bg-[var(--bg-input)] border-[var(--border-main)]'
                          }`}
                        >
                          {isFilled && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                      );
                    })}
                  </div>

                  {/* Hidden/Masked Input for physical keyboard typing */}
                  <div className="relative max-w-[240px] mx-auto">
                    <input
                      id="pin-masked-input"
                      ref={inputRef}
                      type="password"
                      inputMode="numeric"
                      autoComplete="off"
                      maxLength={4}
                      value={pin}
                      onChange={handleInputChange}
                      placeholder="••••"
                      className="w-full text-center tracking-[1em] text-lg font-mono py-2 rounded-xl bg-[var(--bg-input)] border border-[var(--border-main)] text-[var(--text-main)] placeholder-[var(--text-dim)] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition cursor-text"
                    />
                  </div>

                  {capsLockActive && (
                    <div className="text-center mt-1 text-[11px] text-amber-500 font-semibold">
                      Caps Lock is ON
                    </div>
                  )}
                </div>

                {/* Tactile Numeric Keypad */}
                <div className="pt-1">
                  <div className="grid grid-cols-3 gap-2 max-w-[240px] mx-auto">
                    {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                      <button
                        key={digit}
                        type="button"
                        onClick={() => handleKeypadDigit(digit)}
                        className="h-10 rounded-lg bg-[var(--bg-input)] hover:bg-[var(--bg-hover)] active:bg-[var(--accent)] active:text-white text-[var(--text-main)] font-bold text-sm transition flex items-center justify-center border border-[var(--border-main)] shadow-xs cursor-pointer"
                      >
                        {digit}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={handleKeypadClear}
                      className="h-10 rounded-lg bg-[var(--bg-input)] hover:bg-rose-500/10 text-rose-500 font-semibold text-xs transition flex items-center justify-center border border-[var(--border-main)] cursor-pointer"
                    >
                      CLR
                    </button>
                    <button
                      type="button"
                      onClick={() => handleKeypadDigit('0')}
                      className="h-10 rounded-lg bg-[var(--bg-input)] hover:bg-[var(--bg-hover)] active:bg-[var(--accent)] active:text-white text-[var(--text-main)] font-bold text-sm transition flex items-center justify-center border border-[var(--border-main)] shadow-xs cursor-pointer"
                    >
                      0
                    </button>
                    <button
                      type="button"
                      onClick={handleKeypadBackspace}
                      className="h-10 rounded-lg bg-[var(--bg-input)] hover:bg-[var(--bg-hover)] text-[var(--text-muted)] font-semibold text-xs transition flex items-center justify-center border border-[var(--border-main)] cursor-pointer"
                      title="Backspace"
                    >
                      <Delete className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Submit / Unlock Button */}
                <button
                  type="submit"
                  disabled={isAuthenticating || pin.length < 4}
                  className="w-full max-w-[240px] mx-auto py-2.5 px-4 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] active:scale-[0.99] text-white font-bold text-xs transition shadow-md shadow-[var(--accent-glow)] flex items-center justify-center gap-2 cursor-pointer border border-[var(--accent)]/30 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isAuthenticating ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
                      <span>Validating PIN...</span>
                    </>
                  ) : (
                    <>
                      <Shield className="w-3.5 h-3.5 text-white/90" />
                      <span>Unlock Dashboard</span>
                    </>
                  )}
                </button>

                {/* Divider */}
                <div className="relative my-3 max-w-[240px] mx-auto text-center">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-[var(--border-main)]" />
                  </div>
                  <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-wider">
                    <span className="bg-[var(--bg-surface)] px-2 text-[var(--text-dim)]">or connect</span>
                  </div>
                </div>

                {/* Firebase Google Auth Button */}
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isGoogleSigningIn}
                  className="w-full max-w-[240px] mx-auto py-2 px-3 rounded-xl bg-[var(--bg-input)] hover:bg-[var(--bg-hover)] text-[var(--text-main)] font-semibold text-xs transition shadow-xs border border-[var(--border-main)] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isGoogleSigningIn ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-[var(--accent)]" />
                  ) : (
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                  )}
                  <span>Sign in with Google</span>
                </button>

                {/* Forgot PIN / Account Recovery Link */}
                <div className="text-center mt-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedUser) {
                        setPrefilledRecoveryUser(selectedUser);
                      }
                      setIsForgotPinModalOpen(true);
                    }}
                    className="text-[11px] text-[var(--text-muted)] hover:text-[var(--accent)] transition cursor-pointer underline-offset-2 hover:underline"
                  >
                    Forgot PIN or Password?
                  </button>
                </div>
              </form>
            </div>

            <div className="mt-4 pt-3 border-t border-[var(--border-main)] text-center text-[10px] text-[var(--text-dim)] flex items-center justify-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>TeleNest Enterprise &bull; Firebase Database & Auth Connected</span>
            </div>
          </div>
        </div>

        {/* Global Footer */}
        <div className="mt-6 text-center text-xs text-[var(--text-dim)]">
          <div>TeleNest Software &bull; Developed by Bilal Ahmed</div>
        </div>
      </div>
    </div>
  );
};
