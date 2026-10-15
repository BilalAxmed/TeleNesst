import React, { useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { autoSaveService } from './services/autoSaveService';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { DashboardModule } from './components/dashboard/DashboardModule';
import { InventoryModule } from './components/inventory/InventoryModule';
import { ICTInsightsModule } from './components/ict/ICTInsightsModule';
import { FinanceModule } from './components/finance/FinanceModule';
import { ProjectsModule } from './components/projects/ProjectsModule';
import { UsersModule } from './components/users/UsersModule';
import { SettingsModule } from './components/settings/SettingsModule';
import { LetterheadModal } from './components/export/LetterheadModal';
import { CommandPalette } from './components/common/CommandPalette';
import { ToastContainer } from './components/common/ToastContainer';
import { LoginModal } from './components/auth/LoginModal';
import { LoginScreen } from './components/auth/LoginScreen';
import { SoftwareLogoModal } from './components/common/SoftwareLogoModal';
import { GlobalErrorBoundary } from './components/common/GlobalErrorBoundary';
import { OfflineIndicator } from './components/pwa/OfflineIndicator';
import { NetworkStorageAlertBanner } from './components/common/NetworkStorageAlertBanner';

import { PasswordRecoveryModal } from './components/auth/PasswordRecoveryModal';

const AppContent: React.FC = () => {
  const {
    currentUser,
    activeTab,
    setActiveTab,
    setSubTab,
    showToast,
    triggerDataRefresh,
    isForgotPinModalOpen,
    setIsForgotPinModalOpen,
  } = useApp();

  // Manual save with global shortcut key: CTRL+S / CMD+S
  useEffect(() => {
    if (!currentUser) return;
    const handleKeyDown = async (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        try {
          const res = await autoSaveService.triggerSave(true, 'Manual User Save (CTRL+S)');
          triggerDataRefresh();
          if (res.success) {
            showToast(
              `Manual Save (CTRL+S) Complete! Synced to ${res.destination} (${res.totalRecords} total records saved at ${res.timestamp})`,
              'success'
            );
          } else {
            showToast(res.message || 'Snapshot saved to system database.', 'info');
          }
        } catch (err: any) {
          showToast(`Manual save error: ${err?.message || err}`, 'error');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentUser, showToast, triggerDataRefresh]);

  // If user is not authenticated, display the Login Menu first!
  if (!currentUser) {
    return (
      <>
        <LoginScreen />
        <PasswordRecoveryModal
          isOpen={isForgotPinModalOpen}
          onClose={() => setIsForgotPinModalOpen(false)}
          onBackToLogin={() => setIsForgotPinModalOpen(false)}
        />
        <ToastContainer />
      </>
    );
  }

  const renderActiveModule = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardModule />;
      case 'inventory':
        return <InventoryModule />;
      case 'ict-insights':
        return <ICTInsightsModule />;
      case 'finance':
        return <FinanceModule />;
      case 'projects':
        return <ProjectsModule />;
      case 'users':
        return <UsersModule />;
      case 'settings':
        return <SettingsModule />;
      default:
        return <DashboardModule />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-main)] text-[var(--text-main)] font-sans antialiased selection:bg-blue-600/30 selection:text-white">
      {/* Top Navbar */}
      <Navbar />

      {/* Real-Time Office Network & Portable Storage Connectivity Alert Banner */}
      <NetworkStorageAlertBanner
        onOpenSettings={() => {
          setActiveTab('settings');
          setSubTab('storage');
        }}
        showToast={showToast}
      />

      {/* Main Workspace Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Responsive Sidebar */}
        <Sidebar />

        {/* Dynamic Module Content Viewport */}
        <main className="flex-1 overflow-y-auto bg-[var(--bg-main)]">
          {renderActiveModule()}
        </main>
      </div>

      {/* System Overlays & Modals */}
      <LetterheadModal />
      <CommandPalette />
      <ToastContainer />
      <LoginModal />
      <SoftwareLogoModal />
      <OfflineIndicator />
    </div>
  );
};

export default function App() {
  return (
    <GlobalErrorBoundary>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </GlobalErrorBoundary>
  );
}
