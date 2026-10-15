import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  User,
  ThemeId,
  CompanyLetterheadConfig,
  ExchangeRates,
  CustomThemePalette,
  UserOperationsPermissions,
  DEFAULT_OPERATIONS_PERMISSIONS,
  SummaryKPI,
} from '../types';
import { storage, INITIAL_COMPANY_CONFIG } from '../services/storage';
import { DEFAULT_EXCHANGE_RATES } from '../services/currency';
import {
  DEFAULT_CUSTOM_PALETTE,
  applyCustomThemeVariables,
  clearCustomThemeVariables,
} from '../styles/themes';
import { autoSaveService } from '../services/autoSaveService';
import { testFirestoreConnection } from '../services/firebase';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  timestamp: number;
}

export interface LetterheadModalData {
  title: string;
  columns: { header: string; key: string }[];
  data: Record<string, any>[];
  dateRange?: string;
  filterSummary?: string;
  summaryCards?: SummaryKPI[];
  moduleName?: string;
}

interface AppContextType {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  users: User[];
  refreshUsers: () => void;
  login: (username: string, password: string) => { success: boolean; message?: string };
  logout: () => void;
  theme: ThemeId;
  setTheme: (theme: ThemeId) => void;
  customPalette: CustomThemePalette;
  setCustomPalette: (palette: CustomThemePalette) => void;
  saveAndApplyCustomPalette: (palette: CustomThemePalette) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  subTab: string;
  setSubTab: (sub: string) => void;
  homeCurrency: string;
  setHomeCurrency: (currency: string) => void;
  exchangeRates: ExchangeRates;
  setExchangeRates: (rates: ExchangeRates) => void;
  companyConfig: CompanyLetterheadConfig;
  setCompanyConfig: (config: CompanyLetterheadConfig) => void;
  letterheadConfig: CompanyLetterheadConfig;
  setLetterheadConfig: (config: CompanyLetterheadConfig) => void;
  updateSoftwareLogo: (logoUrl: string) => void;
  isDevCEO: boolean;
  isAdmin: boolean;
  toasts: ToastMessage[];
  showToast: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
  dismissToast: (id: string) => void;
  isCommandPaletteOpen: boolean;
  setIsCommandPaletteOpen: (open: boolean) => void;
  dataRevision: number;
  triggerDataRefresh: () => void;
  letterheadModalData: LetterheadModalData | null;
  openLetterheadModal: (data: LetterheadModalData) => void;
  closeLetterheadModal: () => void;
  isLoginModalOpen: boolean;
  setIsLoginModalOpen: (open: boolean) => void;
  isLogoModalOpen: boolean;
  setIsLogoModalOpen: (open: boolean) => void;
  canAccessFeature: (key: keyof UserOperationsPermissions) => boolean;
  resetOptionsAndSystemConfiguration: () => void;
  resetAllDatabaseToFactory: () => void;
  eraseAllWorkData: () => void;
  inventoryCategories: string[];
  addInventoryCategory: (name: string) => boolean;
  deleteInventoryCategory: (name: string) => boolean;
  refreshInventoryCategories: () => void;
  softwareName: string;
  setSoftwareName: (name: string) => void;
  resetSoftwareName: () => void;
  isForgotPinModalOpen: boolean;
  setIsForgotPinModalOpen: (open: boolean) => void;
  prefilledRecoveryUser: User | null;
  setPrefilledRecoveryUser: (user: User | null) => void;
  resetUserCredentials: (userId: string, newPassword: string, newPin?: string) => { success: boolean; message: string };
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Default to stored or primary user so the software interface renders immediately on load
  const [currentUser, setCurrentUserState] = useState<User | null>(() => {
    try {
      const saved = storage.getCurrentUser();
      if (saved) return saved;
      const all = storage.getUsers();
      return all.find((u) => u?.isDefault || u?.role === 'Developer/CEO') || all[0] || null;
    } catch {
      return null;
    }
  });
  const [users, setUsers] = useState<User[]>(() => {
    try {
      const u = storage.getUsers();
      return Array.isArray(u) && u.length > 0 ? u : [];
    } catch (e) {
      console.warn('Failed to load users from storage:', e);
      return [];
    }
  });
  const [theme, setThemeState] = useState<ThemeId>(() => {
    try {
      const saved = localStorage.getItem('telenest_global_theme_v1');
      if (saved) {
        const cleaned = saved.replace(/^"|"$/g, '').trim() as ThemeId;
        if (cleaned) return cleaned;
      }
    } catch (e) {
      console.warn('Failed to read theme preference:', e);
    }
    return 'theme-blue';
  });
  const [customPalette, setCustomPaletteState] = useState<CustomThemePalette>(() => {
    try {
      const saved = localStorage.getItem('telenest_custom_palette_v1');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to parse custom palette:', e);
    }
    return DEFAULT_CUSTOM_PALETTE;
  });
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [subTab, setSubTab] = useState<string>('');
  const [companyConfig, setCompanyConfigState] = useState<CompanyLetterheadConfig>(() => {
    try {
      return storage.getCompanyConfig();
    } catch {
      return INITIAL_COMPANY_CONFIG;
    }
  });
  const [homeCurrency, setHomeCurrencyState] = useState<string>(() => {
    try {
      return companyConfig?.homeCurrency || 'USD';
    } catch {
      return 'USD';
    }
  });
  const [exchangeRates, setExchangeRatesState] = useState<ExchangeRates>(() => {
    try {
      return storage.getExchangeRates();
    } catch {
      return DEFAULT_EXCHANGE_RATES;
    }
  });
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState<boolean>(false);
  const [dataRevision, setDataRevision] = useState<number>(0);
  const [letterheadModalData, setLetterheadModalData] = useState<LetterheadModalData | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [isLogoModalOpen, setIsLogoModalOpen] = useState<boolean>(false);
  const [inventoryCategories, setInventoryCategories] = useState<string[]>(() => {
    try {
      return storage.getAllInventoryCategories();
    } catch {
      return [];
    }
  });
  const [softwareName, setSoftwareNameState] = useState<string>(() => {
    try {
      return storage.getSoftwareName();
    } catch {
      return 'TeleNest';
    }
  });
  const [isForgotPinModalOpen, setIsForgotPinModalOpen] = useState<boolean>(false);
  const [prefilledRecoveryUser, setPrefilledRecoveryUser] = useState<User | null>(null);

  useEffect(() => {
    testFirestoreConnection().catch((err) => {
      console.warn('Initial Firestore connection probe:', err);
    });
  }, []);

  const setSoftwareName = useCallback((name: string) => {
    const trimmed = (name || 'TeleNest').trim();
    storage.setSoftwareName(trimmed);
    setSoftwareNameState(trimmed);
    setDataRevision((v) => v + 1);
  }, []);

  const resetSoftwareName = useCallback(() => {
    storage.resetSoftwareName();
    setSoftwareNameState('TeleNest');
    setDataRevision((v) => v + 1);
  }, []);

  const triggerDataRefresh = useCallback(() => {
    setDataRevision((v) => v + 1);
  }, []);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`;
    setToasts((prev) => [...prev, { id, message, type, timestamp: Date.now() }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const resetUserCredentials = useCallback(
    (userId: string, newPassword: string, newPin?: string) => {
      const allUsers = storage.getUsers();
      const target = allUsers.find((u) => u.id === userId);
      if (!target) {
        return { success: false, message: 'User not found in system.' };
      }
      const updatedUser: User = {
        ...target,
        passwordHash: newPassword,
        ...(newPin ? { pin: newPin } : {}),
      };
      const updatedUsers = allUsers.map((u) => (u.id === userId ? updatedUser : u));
      storage.saveUsers(updatedUsers);
      setUsers(updatedUsers);
      if (currentUser?.id === userId) {
        setCurrentUserState(updatedUser);
        storage.setCurrentUser(updatedUser);
      }
      storage.logActivity({
        userId: target.id,
        userName: target.fullName,
        userRole: target.role,
        action: 'PASSWORD_CHANGE',
        module: 'Users',
        targetId: target.id,
        description: `User credentials updated for ${target.fullName}.`,
      });
      showToast(`Credentials successfully updated for ${target.fullName}!`, 'success');
      return { success: true, message: 'Credentials updated successfully.' };
    },
    [currentUser, showToast]
  );

  const refreshInventoryCategories = useCallback(() => {
    setInventoryCategories(storage.getAllInventoryCategories());
  }, []);

  const addInventoryCategory = useCallback(
    (name: string): boolean => {
      const trimmed = name.trim();
      if (!trimmed) {
        showToast('Category name cannot be blank', 'error');
        return false;
      }
      const current = storage.getAllInventoryCategories();
      const existing = current.find((c) => c.toLowerCase() === trimmed.toLowerCase());
      if (existing) {
        showToast(`Category "${existing}" already exists`, 'info');
        return true;
      }
      const updated = storage.addInventoryCategory(trimmed);
      setInventoryCategories(updated);
      triggerDataRefresh();
      showToast(`Custom category "${trimmed}" added successfully`, 'success');
      return true;
    },
    [showToast, triggerDataRefresh]
  );

  const deleteInventoryCategory = useCallback(
    (name: string): boolean => {
      const trimmed = name.trim();
      // Check if any inventory items are using it
      const currentInv = storage.getInventory();
      const inUse = currentInv.some(
        (it) => (it.category || '').toLowerCase() === trimmed.toLowerCase()
      );
      if (inUse) {
        showToast(
          `Cannot delete category "${trimmed}" because active inventory items are assigned to it`,
          'error'
        );
        return false;
      }
      const updated = storage.deleteCustomCategory(trimmed);
      setInventoryCategories(updated);
      triggerDataRefresh();
      showToast(`Category "${trimmed}" removed`, 'info');
      return true;
    },
    [showToast, triggerDataRefresh]
  );

  const refreshUsers = useCallback(() => {
    setUsers(storage.getUsers());
  }, []);

  // Apply theme to DOM
  useEffect(() => {
    if (theme === 'theme-custom') {
      applyCustomThemeVariables(customPalette);
    } else {
      clearCustomThemeVariables();
      document.documentElement.setAttribute('data-theme', theme);
    }
    localStorage.setItem('telenest_global_theme_v1', theme);
  }, [theme, customPalette]);

  const saveAndApplyCustomPalette = useCallback((palette: CustomThemePalette) => {
    setCustomPaletteState(palette);
    try {
      localStorage.setItem('telenest_custom_palette_v1', JSON.stringify(palette));
    } catch (e) {
      console.error('Failed to save custom palette:', e);
    }
    setThemeState('theme-custom');
  }, []);

  // Global keyboard shortcuts: Ctrl+K / Cmd+K (Search) and Ctrl+S / Cmd+S (Manual Save)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+K / Cmd+K: Global Quick Search
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }

      // Ctrl+S / Cmd+S: Manual Save Work
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        autoSaveService.manualSave('Keyboard Shortcut (Ctrl+S)').then((result) => {
          if (result.success) {
            showToast(`Work saved manually (Ctrl+S) at ${result.timestamp}. All records synced.`, 'success');
          } else {
            showToast('Manual save encountered an issue.', 'error');
          }
        });
        triggerDataRefresh();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showToast, triggerDataRefresh]);

  const setTheme = useCallback((newTheme: ThemeId) => {
    setThemeState(newTheme);
    if (currentUser) {
      const updatedUsers = users.map((u) => (u.id === currentUser.id ? { ...u, themePreference: newTheme } : u));
      storage.saveUsers(updatedUsers);
      const updatedCurrent = { ...currentUser, themePreference: newTheme };
      storage.setCurrentUser(updatedCurrent);
      setCurrentUserState(updatedCurrent);
      setUsers(updatedUsers);
    }
  }, [currentUser, users]);

  const setCurrentUser = useCallback((user: User | null) => {
    setCurrentUserState(user);
    if (user) {
      storage.setCurrentUser(user);
      if (user.themePreference && (user.themePreference as ThemeId) !== theme) {
        setThemeState(user.themePreference as ThemeId);
      }
    }
  }, [theme]);

  const setCompanyConfig = useCallback((config: CompanyLetterheadConfig) => {
    setCompanyConfigState(config);
    storage.saveCompanyConfig(config);
    if (config.homeCurrency !== homeCurrency) {
      setHomeCurrencyState(config.homeCurrency);
    }
  }, [homeCurrency]);

  const updateSoftwareLogo = useCallback((logoUrl: string) => {
    setCompanyConfigState((prev) => {
      const updated = { ...prev, logoUrl };
      storage.saveCompanyConfig(updated);
      return updated;
    });
    setDataRevision((v) => v + 1);
  }, []);

  const setHomeCurrency = useCallback((curr: string) => {
    setHomeCurrencyState(curr);
    const updatedConfig = { ...companyConfig, homeCurrency: curr };
    setCompanyConfigState(updatedConfig);
    storage.saveCompanyConfig(updatedConfig);
  }, [companyConfig]);

  const setExchangeRates = useCallback((rates: ExchangeRates) => {
    setExchangeRatesState(rates);
    storage.saveExchangeRates(rates);
  }, []);

  const login = useCallback((username: string, credential: string) => {
    const allUsers = storage.getUsers();
    const found = allUsers.find(
      (u) => u.username.toLowerCase() === username.trim().toLowerCase() || u.email.toLowerCase() === username.trim().toLowerCase()
    );

    if (!found) {
      return { 
        success: false, 
        message: 'Invalid user account. Access Denied.' 
      };
    }

    if (found.isLocked) {
      return { 
        success: false, 
        message: 'Account is locked. Access Denied.' 
      };
    }

    const trimmedCred = credential.trim();
    const isPasswordValid = found.passwordHash === trimmedCred;
    const isPinValid = Boolean(found.pin && found.pin === trimmedCred);

    if (!isPasswordValid && !isPinValid) {
      return { 
        success: false, 
        message: 'Invalid PIN. Access Denied.' 
      };
    }

    // Success
    const updatedUser = { ...found, lastLogin: new Date().toISOString() };
    const updatedUsers = allUsers.map((u) => (u.id === found.id ? updatedUser : u));
    storage.saveUsers(updatedUsers);
    storage.setCurrentUser(updatedUser);
    setCurrentUserState(updatedUser);
    setUsers(updatedUsers);

    if (updatedUser.themePreference) {
      setThemeState(updatedUser.themePreference as ThemeId);
    }

    storage.logActivity({
      userId: updatedUser.id,
      userName: updatedUser.fullName,
      userRole: updatedUser.role,
      action: 'LOGIN',
      module: 'System',
      targetId: updatedUser.id,
      description: `User ${updatedUser.fullName} (${updatedUser.role}) authenticated successfully.`,
    });

    showToast(`Access Granted. Welcome, ${updatedUser.fullName}!`, 'success');
    setIsLoginModalOpen(false);
    return { success: true };
  }, [showToast]);

  const logout = useCallback(() => {
    if (currentUser) {
      storage.logActivity({
        userId: currentUser.id,
        userName: currentUser.fullName,
        userRole: currentUser.role,
        action: 'LOGOUT',
        module: 'System',
        targetId: currentUser.id,
        description: `User ${currentUser.fullName} locked session / signed out.`,
      });
    }
    storage.clearCurrentUser();
    setCurrentUserState(null);
    showToast('Session locked. Please authenticate to open the dashboard.', 'info');
  }, [currentUser, showToast]);

  const openLetterheadModal = useCallback((data: LetterheadModalData) => {
    setLetterheadModalData(data);
  }, []);

  const closeLetterheadModal = useCallback(() => {
    setLetterheadModalData(null);
  }, []);

  const canAccessFeature = useCallback(
    (key: keyof UserOperationsPermissions): boolean => {
      if (!currentUser) return false;
      if (currentUser.role === 'Developer/CEO') return true;
      if (
        currentUser.operationsPermissions &&
        currentUser.operationsPermissions[key] !== undefined
      ) {
        return !!currentUser.operationsPermissions[key];
      }
      const defaults = DEFAULT_OPERATIONS_PERMISSIONS[currentUser.role];
      return defaults ? !!defaults[key] : false;
    },
    [currentUser]
  );

  const resetOptionsAndSystemConfiguration = useCallback(() => {
    if (!currentUser) return;
    storage.resetOptionsAndSystemConfig(currentUser);
    setThemeState('theme-blue');
    setCustomPaletteState(DEFAULT_CUSTOM_PALETTE);
    clearCustomThemeVariables();
    document.documentElement.setAttribute('data-theme', 'theme-blue');
    localStorage.setItem('telenest_global_theme_v1', 'theme-blue');
    setCompanyConfigState(INITIAL_COMPANY_CONFIG);
    setHomeCurrencyState('USD');
    setExchangeRatesState(DEFAULT_EXCHANGE_RATES);
    triggerDataRefresh();
    showToast('Options & System Configuration have been reset to enterprise defaults.', 'success');
  }, [currentUser, triggerDataRefresh, showToast]);

  const resetAllDatabaseToFactory = useCallback(() => {
    if (!currentUser) return;
    storage.resetToFactoryDefaults(currentUser);
    setThemeState('theme-blue');
    setCustomPaletteState(DEFAULT_CUSTOM_PALETTE);
    clearCustomThemeVariables();
    document.documentElement.setAttribute('data-theme', 'theme-blue');
    localStorage.setItem('telenest_global_theme_v1', 'theme-blue');
    setCompanyConfigState(INITIAL_COMPANY_CONFIG);
    setHomeCurrencyState('USD');
    setExchangeRatesState(DEFAULT_EXCHANGE_RATES);
    setUsers(storage.getUsers());
    setCurrentUserState(storage.getCurrentUser());
    setInventoryCategories(storage.getAllInventoryCategories());
    triggerDataRefresh();
    showToast('System database successfully restored to factory seed state.', 'success');
  }, [currentUser, triggerDataRefresh, showToast]);

  const eraseAllWorkData = useCallback(() => {
    if (!currentUser) return;
    storage.eraseAllWorkData(currentUser);
    triggerDataRefresh();
    showToast(
      'All saved work data permanently erased across all modules. Settings and user accounts preserved.',
      'warning'
    );
  }, [currentUser, triggerDataRefresh, showToast]);

  return (
    <AppContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        users,
        refreshUsers,
        login,
        logout,
        theme,
        setTheme,
        customPalette,
        setCustomPalette: setCustomPaletteState,
        saveAndApplyCustomPalette,
        activeTab,
        setActiveTab,
        subTab,
        setSubTab,
        homeCurrency,
        setHomeCurrency,
        exchangeRates,
        setExchangeRates,
        companyConfig,
        setCompanyConfig,
        letterheadConfig: companyConfig,
        setLetterheadConfig: setCompanyConfig,
        updateSoftwareLogo,
        isDevCEO: currentUser?.role === 'Developer/CEO',
        isAdmin: currentUser?.role === 'Admin',
        toasts,
        showToast,
        dismissToast,
        isCommandPaletteOpen,
        setIsCommandPaletteOpen,
        dataRevision,
        triggerDataRefresh,
        letterheadModalData,
        openLetterheadModal,
        closeLetterheadModal,
        isLoginModalOpen,
        setIsLoginModalOpen,
        isLogoModalOpen,
        setIsLogoModalOpen,
        canAccessFeature,
        resetOptionsAndSystemConfiguration,
        resetAllDatabaseToFactory,
        eraseAllWorkData,
        inventoryCategories,
        addInventoryCategory,
        deleteInventoryCategory,
        refreshInventoryCategories,
        softwareName,
        setSoftwareName,
        resetSoftwareName,
        isForgotPinModalOpen,
        setIsForgotPinModalOpen,
        prefilledRecoveryUser,
        setPrefilledRecoveryUser,
        resetUserCredentials,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within an AppProvider');
  return ctx;
};
