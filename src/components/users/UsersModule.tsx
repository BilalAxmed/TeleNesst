import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { storage } from '../../services/storage';
import {
  User,
  UserRole,
  UserOperationsPermissions,
  DEFAULT_OPERATIONS_PERMISSIONS,
} from '../../types';
import { ConfirmDeleteModal } from '../common/ConfirmDeleteModal';
import { UserPermissionsModal } from './UserPermissionsModal';
import { UserDossierModal } from './UserDossierModal';
import { UserArchivalModal } from './UserArchivalModal';
import { ArchivedUsersList } from './ArchivedUsersList';
import {
  Users,
  Shield,
  Plus,
  Lock,
  Unlock,
  KeyRound,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  X,
  Mail,
  HelpCircle,
  Crown,
  Camera,
  Upload,
  Image as ImageIcon,
  Save,
  RotateCcw,
  Sliders,
  Check,
  Box,
  Radio,
  Briefcase,
  DollarSign,
  ClipboardList,
  FileSpreadsheet,
  FileText,
  Archive,
} from 'lucide-react';

export const UsersModule: React.FC = () => {
  const { currentUser, setCurrentUser, showToast, isDevCEO, isAdmin, refreshUsers } = useApp();
  const [users, setUsers] = useState<User[]>(() => storage.getUsers());

  // Modal states
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userPhoto, setUserPhoto] = useState<string>('');
  const [photoTab, setPhotoTab] = useState<'upload' | 'url' | 'presets'>('upload');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Operations permissions modal state
  const [userForPermissions, setUserForPermissions] = useState<User | null>(null);

  // Controlled form state for Add/Edit User Account
  const [formUsername, setFormUsername] = useState('');
  const [formFullName, setFormFullName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formRecoveryEmail, setFormRecoveryEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formDepartment, setFormDepartment] = useState('Operations & Engineering');
  const [formQ1, setFormQ1] = useState('Lahore');
  const [formQ2, setFormQ2] = useState('St. Marys');
  const [formQ3, setFormQ3] = useState('Billo');
  const [formQ4, setFormQ4] = useState('Toyota Corolla');

  // In-form permission configuration state
  const [formRole, setFormRole] = useState<UserRole>('Standard User');
  const [formCustomRole, setFormCustomRole] = useState('');
  const [formPin, setFormPin] = useState('');
  const [formPermissions, setFormPermissions] = useState<UserOperationsPermissions>(
    DEFAULT_OPERATIONS_PERMISSIONS['Standard User']
  );
  const [showPermissionsInForm, setShowPermissionsInForm] = useState(false);

  // Tab navigation & user tracking state
  const [activeMainTab, setActiveMainTab] = useState<'active' | 'archived' | 'matrix'>('active');
  const [selectedUserForDossier, setSelectedUserForDossier] = useState<User | null>(null);
  const [userForArchivalModal, setUserForArchivalModal] = useState<User | null>(null);
  const [archivedCount, setArchivedCount] = useState<number>(() => storage.getArchivedUsers().length);

  // Deletion modal state (legacy fallback)
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isDeletingUser, setIsDeletingUser] = useState(false);

  // Password & PIN change modal
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [targetUserForPassword, setTargetUserForPassword] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [newPin, setNewPin] = useState('');

  // Sample avatar presets
  const AVATAR_PRESETS = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&auto=format&fit=crop&q=80',
  ];

  const reloadData = () => {
    setUsers(storage.getUsers());
    setArchivedCount(storage.getArchivedUsers().length);
    refreshUsers();
  };

  // Permission Matrix definitions
  const permissionsMatrix = [
    { feature: 'View Inventory', ceo: true, admin: true, user: true },
    { feature: 'Add / Edit Inventory', ceo: true, admin: true, user: true },
    { feature: 'Delete Inventory SKU', ceo: true, admin: true, user: false },
    { feature: 'Stock In / Out Movement', ceo: true, admin: true, user: true },
    { feature: 'View ICT Insights (FTTH/B/M)', ceo: true, admin: true, user: true },
    { feature: 'Add / Edit ICT Records', ceo: true, admin: true, user: true },
    { feature: 'Delete ICT Records', ceo: true, admin: true, user: false },
    { feature: 'View Finance & Expenses', ceo: true, admin: true, user: 'Read-only' },
    { feature: 'Add / Edit Expenses', ceo: true, admin: true, user: false },
    { feature: 'Delete Expenses', ceo: true, admin: false, user: false },
    { feature: 'View Projects', ceo: true, admin: true, user: true },
    { feature: 'Add / Edit Projects', ceo: true, admin: true, user: true },
    { feature: 'Delete Projects', ceo: true, admin: false, user: false },
    { feature: 'Daily Works Field Logging', ceo: true, admin: true, user: true },
    { feature: 'User Management', ceo: 'Full Control', admin: 'Limited', user: false },
    { feature: 'System Settings & Backups', ceo: 'Full Control', admin: 'Read-only', user: false },
    { feature: 'Themes & Multi-currency', ceo: true, admin: true, user: 'View only' },
  ];

  // Handle Photo File Upload
  const handlePhotoFileUpload = (file: File) => {
    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file (PNG, JPG, WEBP).', 'error');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      showToast('Image size should be under 2MB for fast loading.', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (dataUrl) {
        setUserPhoto(dataUrl);
        showToast('Profile photo loaded successfully.', 'success');
      }
    };
    reader.readAsDataURL(file);
  };

  // Save User (Add or Edit Account)
  const handleSaveUser = (e?: React.FormEvent) => {
    if (e && e.preventDefault) {
      e.preventDefault();
    }

    const username = (formUsername || (editingUser ? editingUser.username : '')).trim().toLowerCase();
    const fullName = (formFullName || '').trim();
    const email = (formEmail || '').trim();
    const recoveryEmail = (formRecoveryEmail || '').trim() || email;

    if (!username) {
      showToast('Username is required.', 'error');
      return;
    }
    if (!fullName) {
      showToast('Full Name is required.', 'error');
      return;
    }
    if (!email) {
      showToast('Official Corporate Email is required.', 'error');
      return;
    }

    // Guard: Only Developer/CEO can change existing usernames
    if (editingUser && editingUser.username.toLowerCase() !== username && !isDevCEO) {
      showToast('Access Denied: Only Developer/CEO has authority to change usernames.', 'error');
      return;
    }

    // Validate username uniqueness (excluding the current user being edited)
    const isDuplicateUsername = users.some(
      (u) => (!editingUser || u.id !== editingUser.id) && u.username.toLowerCase() === username
    );
    if (isDuplicateUsername) {
      showToast(`Username "${username}" is already in use by another user account.`, 'error');
      return;
    }

    const finalAvatar =
      userPhoto.trim() ||
      editingUser?.avatar ||
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80';

    // Security Questions
    const q1 = formQ1.trim() || 'Lahore';
    const q2 = formQ2.trim() || 'St. Marys';
    const q3 = formQ3.trim() || 'Billo';
    const q4 = formQ4.trim() || 'Toyota Corolla';

    // Role validation: Only Developer/CEO exists as one account. No new or other user can ever be given Developer/CEO role.
    if (!isDevCEO) {
      showToast('Access Denied: Only Developer/CEO possesses authority to create or modify user accounts.', 'error');
      return;
    }

    const effectiveRole: UserRole = editingUser?.role === 'Developer/CEO'
      ? 'Developer/CEO'
      : (formRole === 'Admin' ? 'Admin' : 'Standard User');

    const customRole = formCustomRole.trim() || (editingUser?.role === 'Developer/CEO' ? 'Developer / CEO' : undefined);

    const enteredPin = formPin.trim();
    if (enteredPin && enteredPin.length !== 4) {
      showToast('Login PIN must be exactly 4 numeric digits.', 'error');
      return;
    }
    const pin = enteredPin || editingUser?.pin || '1234';

    if (editingUser) {
      // Guard: Admin cannot modify Developer/CEO
      if (editingUser.role === 'Developer/CEO' && !isDevCEO) {
        showToast('Only the Developer/CEO can modify Developer/CEO accounts.', 'error');
        return;
      }

      const updated = users.map((u) => {
        if (u.id === editingUser.id) {
          const userObj: User = {
            ...u,
            username,
            fullName,
            email,
            recoveryEmail,
            department: formDepartment.trim() || u.department || 'Operations & Engineering',
            avatar: finalAvatar,
            role: effectiveRole,
            customRole,
            pin,
            operationsPermissions: editingUser.role === 'Developer/CEO' ? DEFAULT_OPERATIONS_PERMISSIONS['Developer/CEO'] : formPermissions,
            securityAnswers: {
              q1_city: q1,
              q2_school: q2,
              q3_nickname: q3,
              q4_vehicle: q4,
            },
          };
          if (formPassword.trim()) {
            userObj.passwordHash = formPassword.trim();
          }
          return userObj;
        }
        return u;
      });

      storage.saveUsers(updated);
      setUsers(updated);

      // If current user updated their own profile, sync AppContext
      if (currentUser && currentUser.id === editingUser.id) {
        setCurrentUser({
          ...currentUser,
          username,
          fullName,
          email,
          recoveryEmail,
          avatar: finalAvatar,
          role: effectiveRole,
          customRole,
          pin,
          operationsPermissions: editingUser.role === 'Developer/CEO' ? DEFAULT_OPERATIONS_PERMISSIONS['Developer/CEO'] : formPermissions,
          ...(formPassword.trim() ? { passwordHash: formPassword.trim() } : {}),
        });
      }

      storage.logActivity({
        userId: currentUser?.id || 'sys',
        userName: currentUser?.fullName || 'User',
        userRole: currentUser?.role || 'Standard User',
        action: 'UPDATE',
        module: 'Users',
        targetId: editingUser.id,
        description: `Updated profile & credentials for user ${fullName} (${username}) with custom role "${customRole || effectiveRole}"`,
      });
      showToast(`User account "${fullName}" updated successfully!`, 'success');
    } else {
      // Duplicate check
      if (users.some((u) => u.username.toLowerCase() === username)) {
        showToast(`Username "${username}" already exists.`, 'error');
        return;
      }

      const newUser: User = {
        id: `usr_${Date.now()}`,
        username,
        fullName,
        email,
        recoveryEmail: recoveryEmail || email,
        role: effectiveRole,
        customRole,
        pin,
        department: formDepartment.trim() || 'Operations & Engineering',
        avatar: finalAvatar,
        isLocked: false,
        canEditInventory: true,
        canEditFinance: effectiveRole !== 'Standard User',
        canEditICT: true,
        canAccessSystemSettings: false,
        operationsPermissions: formPermissions,
        themePreference: 'theme-blue',
        createdAt: new Date().toISOString().split('T')[0],
        passwordHash: formPassword.trim() || 'tele123',
        securityAnswers: {
          q1_city: q1,
          q2_school: q2,
          q3_nickname: q3,
          q4_vehicle: q4,
        },
      };

      const updated = [...users, newUser];
      storage.saveUsers(updated);
      setUsers(updated);

      storage.logActivity({
        userId: currentUser?.id || 'sys',
        userName: currentUser?.fullName || 'User',
        userRole: currentUser?.role || 'Standard User',
        action: 'CREATE',
        module: 'Users',
        targetId: newUser.id,
        description: `Created new user account: ${fullName} (${username}) with custom role "${customRole || effectiveRole}"`,
      });
      showToast(`User account "${fullName}" created successfully!`, 'success');
    }

    setIsUserModalOpen(false);
    setEditingUser(null);
    setUserPhoto('');
    setFormPassword('');
    setFormPin('');
    setFormCustomRole('');
    reloadData();
    refreshUsers();
  };

  // Dedicated Save Operations Permissions Handler
  const handleSavePermissions = (
    userId: string,
    updatedRole: UserRole,
    permissions: UserOperationsPermissions
  ) => {
    if (!isDevCEO) {
      showToast('Access Denied: Only Developer/CEO has authority to modify permissions.', 'error');
      return;
    }

    const updated = users.map((u) => {
      if (u.id === userId) {
        // Prevent altering Developer/CEO role or permissions
        if (u.role === 'Developer/CEO') {
          return u;
        }
        return {
          ...u,
          role: updatedRole === 'Developer/CEO' ? 'Admin' : updatedRole,
          operationsPermissions: permissions,
        };
      }
      return u;
    });

    storage.saveUsers(updated);
    setUsers(updated);

    if (currentUser && currentUser.id === userId) {
      setCurrentUser({
        ...currentUser,
        role: updatedRole === 'Developer/CEO' ? 'Admin' : updatedRole,
        operationsPermissions: permissions,
      });
    }

    storage.logActivity({
      userId: currentUser?.id || 'sys',
      userName: currentUser?.fullName || 'User',
      userRole: currentUser?.role || 'Standard User',
      action: 'UPDATE',
      module: 'Users',
      targetId: userId,
      description: `Assigned role ${updatedRole} & configured Operations Core feature access for ${userId}`,
    });

    showToast('Role and Operations feature permissions assigned successfully.', 'success');
    reloadData();
  };

  // Toggle User Lock
  const handleToggleLock = (targetUser: User) => {
    if (!isDevCEO) {
      showToast('Access Denied: Only Developer/CEO has authority to lock or unlock accounts.', 'error');
      return;
    }

    // Developer/CEO cannot be locked
    if (targetUser.role === 'Developer/CEO') {
      showToast('Developer/CEO account cannot be locked or suspended.', 'error');
      return;
    }

    const updated = users.map((u) =>
      u.id === targetUser.id ? { ...u, isLocked: !u.isLocked } : u
    );
    storage.saveUsers(updated);
    storage.logActivity({
      userId: currentUser?.id || 'sys',
      userName: currentUser?.fullName || 'User',
      userRole: currentUser?.role || 'Standard User',
      action: 'UPDATE',
      module: 'Users',
      targetId: targetUser.id,
      description: `${targetUser.isLocked ? 'Unlocked' : 'Locked'} account for ${targetUser.fullName}`,
    });
    showToast(`Account ${targetUser.fullName} ${targetUser.isLocked ? 'unlocked' : 'locked'}.`, 'info');
    reloadData();
  };

  // Change Password & PIN Handler
  const handleSavePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUserForPassword) return;

    if (!isDevCEO && currentUser?.id !== targetUserForPassword.id) {
      showToast('Access Denied: Only Developer/CEO has authority to reset credentials.', 'error');
      return;
    }

    if (targetUserForPassword.role === 'Developer/CEO' && !isDevCEO) {
      showToast('Security Violation: Admin and Standard users cannot modify Developer/CEO account.', 'error');
      return;
    }

    if (newPassword && newPassword.length < 6) {
      showToast('Password must be at least 6 characters long.', 'error');
      return;
    }

    if (newPin && newPin.length !== 4) {
      showToast('Login PIN must be exactly 4 digits.', 'error');
      return;
    }

    if (!newPassword && !newPin) {
      showToast('Please enter a new Password or 4-digit PIN.', 'error');
      return;
    }

    const updated = users.map((u) => {
      if (u.id === targetUserForPassword.id) {
        return {
          ...u,
          ...(newPassword ? { passwordHash: newPassword } : {}),
          ...(newPin ? { pin: newPin } : {}),
        };
      }
      return u;
    });

    storage.saveUsers(updated);
    storage.logActivity({
      userId: currentUser?.id || 'sys',
      userName: currentUser?.fullName || 'User',
      userRole: currentUser?.role || 'Standard User',
      action: 'PASSWORD_CHANGE',
      module: 'Users',
      targetId: targetUserForPassword.id,
      description: `Credential reset (Password/PIN) for user ${targetUserForPassword.fullName}`,
    });

    showToast(`Credentials updated for ${targetUserForPassword.fullName}.`, 'success');
    setIsPasswordModalOpen(false);
    setTargetUserForPassword(null);
    setNewPassword('');
    setNewPin('');
    reloadData();
  };

  // Delete User button clicked -> open safe archival & offboarding modal
  const handleDeleteUser = (targetUser: User) => {
    if (!isDevCEO) {
      showToast('Access Denied: Only Developer/CEO has authority to delete user accounts.', 'error');
      return;
    }
    if (targetUser.role === 'Developer/CEO') {
      showToast('The Developer/CEO account is root authority and cannot be deleted.', 'error');
      return;
    }
    if (targetUser.id === currentUser?.id) {
      showToast('You cannot delete your own active account while signed in.', 'error');
      return;
    }
    // Launch UserArchivalModal for mandatory pre-removal offline export & retention prompt
    setUserForArchivalModal(targetUser);
  };

  // Confirm delete user
  const handleConfirmDeleteUser = () => {
    if (!userToDelete) return;
    setIsDeletingUser(true);
    try {
      const updated = users.filter((u) => u.id !== userToDelete.id);
      storage.saveUsers(updated);
      storage.logActivity({
        userId: currentUser?.id || 'sys',
        userName: currentUser?.fullName || 'User',
        userRole: currentUser?.role || 'Standard User',
        action: 'DELETE',
        module: 'Users',
        targetId: userToDelete.id,
        description: `Deleted user profile ${userToDelete.fullName} (${userToDelete.username})`,
      });
      showToast(`User account "${userToDelete.fullName}" permanently deleted.`, 'warning');
      setUserToDelete(null);
      reloadData();
    } catch (err: any) {
      showToast(`Failed to delete user: ${err?.message || err}`, 'error');
    } finally {
      setIsDeletingUser(false);
    }
  };

  return (
    <div className="p-4 lg:p-6 space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black tracking-tight text-[var(--text-main)]">
              User Management & Access Control
            </h1>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
              Module 5 & 7
            </span>
          </div>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            Role-Based Access Control (RBAC), multi-tier credential recovery, and account lifecycle management
          </p>
        </div>

        {isDevCEO && (
          <button
            onClick={() => {
              setEditingUser(null);
              setUserPhoto('');
              setFormUsername('');
              setFormFullName('');
              setFormCustomRole('');
              setFormPin('1234');
              setFormEmail('');
              setFormRecoveryEmail('');
              setFormPassword('tele123');
              setFormDepartment('Operations & Engineering');
              setFormRole('Standard User');
              setFormPermissions({ ...DEFAULT_OPERATIONS_PERMISSIONS['Standard User'] });
              setFormQ1('Lahore');
              setFormQ2('St. Marys');
              setFormQ3('Billo');
              setFormQ4('Toyota Corolla');
              setShowPermissionsInForm(false);
              setIsUserModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-bold shadow transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add User Account</span>
          </button>
        )}
      </div>

      {/* CEO & Admin RBAC Governance Banner */}
      <div className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-main)] flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
            <Crown className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-xs text-[var(--text-main)] flex items-center gap-2">
              <span>Developer/CEO Authority & Role Governance</span>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/25">
                Sole Root Authority: Bilal Ahmed
              </span>
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-0.5 max-w-3xl leading-relaxed">
              Only Developer/CEO holds root authority to create/edit users, assign Custom Names & Custom Roles, reset PINs, adjust permissions, and configure system settings. Admin & Standard users are strictly prevented from modifying the Developer/CEO account or elevating account privileges.
            </p>
          </div>
        </div>

        {!isDevCEO && (
          <div className="px-3 py-1.5 rounded-lg bg-slate-500/10 border border-[var(--border-main)] text-[var(--text-dim)] text-xs font-semibold shrink-0 flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-slate-400" />
            <span>Management Restricted to Developer/CEO</span>
          </div>
        )}
      </div>

      {/* Module Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-[var(--border-main)] pb-2 overflow-x-auto text-xs font-bold scrollbar-none">
        <button
          onClick={() => setActiveMainTab('active')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition cursor-pointer ${
            activeMainTab === 'active'
              ? 'bg-[var(--accent)] text-white shadow-sm'
              : 'bg-[var(--bg-card)] border border-[var(--border-main)] text-[var(--text-dim)] hover:text-[var(--text-main)]'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Active Accounts ({users.length})</span>
        </button>

        <button
          onClick={() => setActiveMainTab('archived')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition cursor-pointer ${
            activeMainTab === 'archived'
              ? 'bg-purple-600 text-white shadow-sm'
              : 'bg-[var(--bg-card)] border border-[var(--border-main)] text-[var(--text-dim)] hover:text-[var(--text-main)]'
          }`}
        >
          <Archive className="w-4 h-4 text-purple-400" />
          <span>Archived User Backups ({archivedCount})</span>
          {archivedCount > 0 && (
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                activeMainTab === 'archived' ? 'bg-white/25 text-white' : 'bg-purple-500/20 text-purple-400'
              }`}
            >
              {archivedCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveMainTab('matrix')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition cursor-pointer ${
            activeMainTab === 'matrix'
              ? 'bg-[var(--accent)] text-white shadow-sm'
              : 'bg-[var(--bg-card)] border border-[var(--border-main)] text-[var(--text-dim)] hover:text-[var(--text-main)]'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>RBAC Security Matrix</span>
        </button>
      </div>

      {/* Tab: Archived User Backups */}
      {activeMainTab === 'archived' && (
        <ArchivedUsersList
          currentUser={currentUser}
          onUserRestored={reloadData}
          showToast={showToast}
        />
      )}

      {/* Users Master Table */}
      {activeMainTab === 'active' && (
      <div className="border border-[var(--border-main)] rounded-xl overflow-hidden bg-[var(--bg-card)] shadow-xs">
        <div className="p-3 bg-[var(--bg-surface)] border-b border-[var(--border-main)] flex items-center justify-between">
          <div className="font-bold text-xs text-[var(--text-main)] flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-400" />
            <span>TeleNest User Directory ({users.length})</span>
          </div>
          <div className="text-[11px] text-[var(--text-dim)]">
            Signed in as: <span className="font-bold text-blue-400">{currentUser?.fullName}</span> (
            {currentUser?.role})
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[var(--border-main)] bg-[var(--bg-surface)]/60 text-[var(--text-muted)] font-semibold">
                <th className="py-3 px-4">User (Custom Name)</th>
                <th className="py-3 px-4">Username</th>
                <th className="py-3 px-4">System & Custom Role</th>
                <th className="py-3 px-4">Login PIN</th>
                <th className="py-3 px-4">Operations Feature Access</th>
                <th className="py-3 px-4">Recovery Email</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-main)]/60">
              {users.map((u) => {
                const isCEO = u.role === 'Developer/CEO';
                const canDelete = !isCEO && isDevCEO && u.id !== currentUser?.id;

                return (
                  <tr key={u.id} className="hover:bg-[var(--bg-hover)] transition">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="relative shrink-0">
                          {u.avatar ? (
                            <img
                              src={u.avatar}
                              alt={u.fullName}
                              className="w-8 h-8 rounded-full object-cover border border-[var(--border-main)] shadow-xs"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs text-white ${
                                isCEO ? 'bg-gradient-to-tr from-amber-500 to-orange-500' : 'bg-blue-600'
                              }`}
                            >
                              {isCEO ? <Crown className="w-4 h-4" /> : u.fullName.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          {isCEO && (
                            <div className="absolute -top-1 -right-1 p-0.5 rounded-full bg-amber-500 text-slate-950 shadow">
                              <Crown className="w-2.5 h-2.5" />
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-[var(--text-main)] flex items-center gap-1.5">
                            <span>{u.fullName}</span>
                            {isCEO && (
                              <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                Sole Developer / CEO
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-[var(--text-dim)]">{u.email}</div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4 font-mono font-semibold text-blue-400">{u.username}</td>

                    <td className="py-3 px-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              u.role === 'Developer/CEO'
                                ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                                : u.role === 'Admin'
                                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                : 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                            }`}
                          >
                            {u.role}
                          </span>
                        </div>
                        {u.customRole ? (
                          <div className="text-[11px] font-semibold text-[var(--text-main)]">
                            {u.customRole}
                          </div>
                        ) : isCEO ? (
                          <div className="text-[11px] font-semibold text-amber-400/90">
                            Developer / CEO
                          </div>
                        ) : null}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[var(--bg-surface)] border border-[var(--border-main)] font-mono text-[11px] text-[var(--text-muted)]">
                        <KeyRound className="w-3 h-3 text-blue-400" />
                        <span>••••</span>
                        {isDevCEO && (
                          <span className="text-[9px] text-[var(--text-dim)] ml-0.5">({u.pin || '4790'})</span>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      {isCEO ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/25">
                          <Crown className="w-3 h-3 text-amber-400" />
                          <span>Full Unrestricted Operations</span>
                        </span>
                      ) : (
                        <div className="flex items-center gap-1 flex-wrap max-w-xs">
                          {u.operationsPermissions?.canViewInventory && (
                            <span
                              className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/25"
                              title="Stock Master & Balances"
                            >
                              Inventory
                            </span>
                          )}
                          {u.operationsPermissions?.canViewICT && (
                            <span
                              className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/25"
                              title="ICT Fiber Insights"
                            >
                              ICT
                            </span>
                          )}
                          {u.operationsPermissions?.canViewProjects && (
                            <span
                              className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-indigo-500/15 text-indigo-400 border border-indigo-500/25"
                              title="Telecom Projects & Milestones"
                            >
                              Projects
                            </span>
                          )}
                          {u.operationsPermissions?.canViewFinance && (
                            <span
                              className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/25"
                              title="Commercial & Finance"
                            >
                              Finance
                            </span>
                          )}
                          {u.operationsPermissions?.canViewDailyWorks && (
                            <span
                              className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-purple-500/15 text-purple-400 border border-purple-500/25"
                              title="Daily Works & Field Logs"
                            >
                              Daily Works
                            </span>
                          )}
                          {u.operationsPermissions?.canExportReports && (
                            <span
                              className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-teal-500/15 text-teal-400 border border-teal-500/25"
                              title="Verified Reports & QR Verification"
                            >
                              Reports
                            </span>
                          )}
                          {u.operationsPermissions?.canDeleteInventory && (
                            <span
                              className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/25"
                              title="Authorized to Delete Inventory SKUs"
                            >
                              Del-Inv
                            </span>
                          )}
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-4 text-[var(--text-muted)] font-mono text-[11px]">
                      {u.recoveryEmail}
                    </td>

                    <td className="py-3 px-4">
                      {u.isLocked ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                          <Lock className="w-2.5 h-2.5" />
                          <span>Locked</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          <CheckCircle2 className="w-2.5 h-2.5" />
                          <span>Active</span>
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {isDevCEO ? (
                          <>
                            {/* Manage Operations Features & Role (CEO) */}
                            {!isCEO && (
                              <button
                                onClick={() => setUserForPermissions(u)}
                                className="p-1.5 rounded-lg hover:bg-purple-500/20 text-[var(--text-dim)] hover:text-purple-400 transition cursor-pointer"
                                title="Assign Role & Operations Core Feature Permissions"
                              >
                                <Sliders className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {/* Change password & PIN button */}
                            <button
                              onClick={() => {
                                setTargetUserForPassword(u);
                                setNewPassword('');
                                setNewPin('');
                                setIsPasswordModalOpen(true);
                              }}
                              className="p-1.5 rounded-lg hover:bg-[var(--bg-surface)] text-[var(--text-dim)] hover:text-blue-400 transition cursor-pointer"
                              title="Reset Password & PIN"
                            >
                              <KeyRound className="w-3.5 h-3.5" />
                            </button>

                            {/* Lock / Unlock button (Cannot lock CEO) */}
                            {!isCEO && (
                              <button
                                onClick={() => handleToggleLock(u)}
                                className="p-1.5 rounded-lg hover:bg-[var(--bg-surface)] text-[var(--text-dim)] hover:text-amber-400 transition cursor-pointer"
                                title={u.isLocked ? 'Unlock Account' : 'Lock Account'}
                              >
                                {u.isLocked ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                              </button>
                            )}

                            {/* Edit profile (Custom Name, Custom Role, PIN, etc.) */}
                            <button
                              onClick={() => {
                                setEditingUser(u);
                                setUserPhoto(u.avatar || '');
                                setFormUsername(u.username || '');
                                setFormFullName(u.fullName || '');
                                setFormCustomRole(u.customRole || (isCEO ? 'Developer / CEO' : ''));
                                setFormPin(u.pin || '');
                                setFormEmail(u.email || '');
                                setFormRecoveryEmail(u.recoveryEmail || u.email || '');
                                setFormPassword('');
                                setFormDepartment(u.department || 'Operations & Engineering');
                                setFormRole(u.role);
                                setFormPermissions(
                                  u.operationsPermissions ||
                                    DEFAULT_OPERATIONS_PERMISSIONS[u.role] ||
                                    DEFAULT_OPERATIONS_PERMISSIONS['Standard User']
                                );
                                setFormQ1(u.securityAnswers?.q1_city || 'Lahore');
                                setFormQ2(u.securityAnswers?.q2_school || 'St. Marys');
                                setFormQ3(u.securityAnswers?.q3_nickname || 'Billo');
                                setFormQ4(u.securityAnswers?.q4_vehicle || 'Toyota Corolla');
                                setShowPermissionsInForm(false);
                                setIsUserModalOpen(true);
                              }}
                              className="p-1.5 rounded-lg hover:bg-[var(--bg-surface)] text-[var(--text-dim)] hover:text-[var(--text-main)] transition cursor-pointer"
                              title="Edit Custom Name, Custom Role & Profile"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            {/* Delete user */}
                            {canDelete && (
                              <button
                                onClick={() => handleDeleteUser(u)}
                                className="p-1.5 rounded-lg hover:bg-rose-500/20 text-[var(--text-dim)] hover:text-rose-400 transition cursor-pointer"
                                title="Safely Offboard & Archive User"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {/* View User Activity & Work Dossier */}
                            <button
                              onClick={() => setSelectedUserForDossier(u)}
                              className="p-1.5 rounded-lg hover:bg-purple-500/20 text-[var(--text-dim)] hover:text-purple-400 transition cursor-pointer"
                              title="View User Work History, Data & Activity Dossier"
                            >
                              <FileText className="w-3.5 h-3.5" />
                            </button>
                          </>
                        ) : isCEO ? (
                          <div className="flex items-center gap-1.5">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/25">
                              <Crown className="w-3 h-3 text-amber-400" />
                              <span>Protected CEO</span>
                            </span>
                            <button
                              onClick={() => setSelectedUserForDossier(u)}
                              className="p-1.5 rounded-lg hover:bg-purple-500/20 text-[var(--text-dim)] hover:text-purple-400 transition cursor-pointer"
                              title="View Developer/CEO Activity & Work History Dossier"
                            >
                              <FileText className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <span className="inline-flex items-center gap-1 text-[10px] text-[var(--text-dim)]">
                              <Lock className="w-3 h-3 text-slate-400" />
                              <span>Read-Only</span>
                            </span>
                            <button
                              onClick={() => setSelectedUserForDossier(u)}
                              className="p-1.5 rounded-lg hover:bg-purple-500/20 text-[var(--text-dim)] hover:text-purple-400 transition cursor-pointer"
                              title="View User Work History & Activity Dossier"
                            >
                              <FileText className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {/* Role-Based Access Control (RBAC) Matrix Section 5.1 */}
      {(activeMainTab === 'active' || activeMainTab === 'matrix') && (
      <div className="border border-[var(--border-main)] rounded-xl overflow-hidden bg-[var(--bg-card)] shadow-xs">
        <div className="p-3 bg-[var(--bg-surface)] border-b border-[var(--border-main)] flex items-center justify-between">
          <div>
            <div className="font-bold text-xs text-[var(--text-main)] flex items-center gap-2">
              <Shield className="w-4 h-4 text-purple-400" />
              <span>Section 5.1 Role-Based Access Control (RBAC) Permission Matrix</span>
            </div>
            <p className="text-[10px] text-[var(--text-muted)] mt-0.5">
              Strictly enforced access boundary per organizational tier
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[var(--border-main)] bg-[var(--bg-surface)]/60 text-[var(--text-muted)] font-semibold">
                <th className="py-2.5 px-4">Feature / Action</th>
                <th className="py-2.5 px-4 text-center text-amber-400">Developer/CEO</th>
                <th className="py-2.5 px-4 text-center text-emerald-400">Admin</th>
                <th className="py-2.5 px-4 text-center text-blue-400">Standard User</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-main)]/60 text-[11px]">
              {permissionsMatrix.map((item, idx) => (
                <tr key={idx} className="hover:bg-[var(--bg-hover)] transition">
                  <td className="py-2.5 px-4 font-medium text-[var(--text-main)]">{item.feature}</td>

                  <td className="py-2.5 px-4 text-center">
                    {typeof item.ceo === 'boolean' ? (
                      item.ceo ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 mx-auto" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-400 mx-auto" />
                      )
                    ) : (
                      <span className="font-bold text-amber-400">{item.ceo}</span>
                    )}
                  </td>

                  <td className="py-2.5 px-4 text-center">
                    {typeof item.admin === 'boolean' ? (
                      item.admin ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 mx-auto" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-400 mx-auto" />
                      )
                    ) : (
                      <span className="font-bold text-emerald-400">{item.admin}</span>
                    )}
                  </td>

                  <td className="py-2.5 px-4 text-center">
                    {typeof item.user === 'boolean' ? (
                      item.user ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 mx-auto" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-400 mx-auto" />
                      )
                    ) : (
                      <span className="font-medium text-[var(--text-dim)]">{item.user}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {/* Add / Edit User Modal */}
      {isUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-xl bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-2xl shadow-2xl p-6 text-[var(--text-main)] overflow-hidden">
            <div className="flex items-center justify-between pb-4 border-b border-[var(--border-main)]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-blue-600/10 text-blue-400 border border-blue-500/20">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold">
                    {editingUser ? 'Edit User Credentials' : 'Add New TeleNest Account'}
                  </h3>
                  <p className="text-xs text-[var(--text-muted)]">
                    Setup role, login credentials, and 4 mandatory security recovery questions
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsUserModalOpen(false)}
                className="p-1 rounded-lg text-[var(--text-dim)] hover:text-[var(--text-main)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              noValidate
              onSubmit={(e) => {
                e.preventDefault();
                handleSaveUser();
              }}
              className="mt-5 space-y-3.5 text-xs max-h-[75vh] overflow-y-auto pr-1"
            >
              {/* Profile Photo Section */}
              <div className="p-3.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-main)] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Camera className="w-4 h-4 text-[var(--accent)]" />
                    <span className="font-bold text-xs text-[var(--text-main)]">User Profile Photo</span>
                  </div>
                  <div className="flex items-center gap-1 bg-[var(--bg-surface)] p-0.5 rounded-lg border border-[var(--border-main)]">
                    <button
                      type="button"
                      onClick={() => setPhotoTab('upload')}
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold transition ${
                        photoTab === 'upload'
                          ? 'bg-[var(--accent)] text-white'
                          : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                      }`}
                    >
                      Upload File
                    </button>
                    <button
                      type="button"
                      onClick={() => setPhotoTab('url')}
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold transition ${
                        photoTab === 'url'
                          ? 'bg-[var(--accent)] text-white'
                          : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                      }`}
                    >
                      Image URL
                    </button>
                    <button
                      type="button"
                      onClick={() => setPhotoTab('presets')}
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold transition ${
                        photoTab === 'presets'
                          ? 'bg-[var(--accent)] text-white'
                          : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                      }`}
                    >
                      Presets
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-3.5">
                  <div className="relative group shrink-0">
                    <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-[var(--accent)] shadow-md bg-slate-800 flex items-center justify-center">
                      {userPhoto || editingUser?.avatar ? (
                        <img
                          src={userPhoto || editingUser?.avatar}
                          alt="User avatar preview"
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-full h-full bg-blue-600 flex items-center justify-center text-white font-bold text-base">
                          {editingUser ? editingUser.fullName.slice(0, 2).toUpperCase() : 'TN'}
                        </div>
                      )}
                    </div>
                    {userPhoto && (
                      <button
                        type="button"
                        onClick={() => setUserPhoto('')}
                        title="Remove photo"
                        className="absolute -top-1 -right-1 p-1 rounded-full bg-rose-600 text-white shadow hover:bg-rose-500"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    {photoTab === 'upload' && (
                      <div>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handlePhotoFileUpload(file);
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-dashed border-[var(--border-main)] hover:border-[var(--accent)] hover:bg-[var(--bg-hover)] text-[var(--text-main)] font-semibold transition text-xs w-full justify-center"
                        >
                          <Upload className="w-3.5 h-3.5 text-[var(--accent)]" />
                          <span>Choose Image from Device (JPG, PNG, WebP)</span>
                        </button>
                        <p className="text-[10px] text-[var(--text-dim)] mt-1 text-center">
                          Max size 2MB. Supports drag, camera photos & local images.
                        </p>
                      </div>
                    )}

                    {photoTab === 'url' && (
                      <div className="space-y-1">
                        <input
                          type="url"
                          placeholder="https://example.com/avatar.jpg"
                          value={userPhoto}
                          onChange={(e) => setUserPhoto(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-[var(--bg-input)] border border-[var(--border-main)] text-[var(--text-main)] text-xs"
                        />
                        <p className="text-[10px] text-[var(--text-dim)]">
                          Paste a direct web link to any profile image.
                        </p>
                      </div>
                    )}

                    {photoTab === 'presets' && (
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {AVATAR_PRESETS.map((preset, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setUserPhoto(preset)}
                              className={`w-7 h-7 rounded-full overflow-hidden border-2 transition ${
                                userPhoto === preset
                                  ? 'border-[var(--accent)] scale-110 shadow'
                                  : 'border-transparent opacity-75 hover:opacity-100'
                              }`}
                            >
                              <img
                                src={preset}
                                alt={`Preset ${idx + 1}`}
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                              />
                            </button>
                          ))}
                        </div>
                        <p className="text-[10px] text-[var(--text-dim)] mt-1">
                          Click to select a corporate avatar preset.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[var(--text-muted)] mb-1 flex items-center justify-between">
                    <span>System Username</span>
                    {isDevCEO && (
                      <span className="text-[10px] text-amber-500 font-bold uppercase tracking-wider">
                        CEO Modifiable
                      </span>
                    )}
                  </label>
                  <input
                    type="text"
                    name="username"
                    required
                    readOnly={!isDevCEO}
                    value={formUsername}
                    onChange={(e) => setFormUsername(e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, ''))}
                    placeholder="e.g. ahmed_lead"
                    className={`w-full px-3 py-2 rounded-lg bg-[var(--bg-input)] border border-[var(--border-main)] text-[var(--text-main)] font-mono ${
                      !isDevCEO ? 'opacity-70 cursor-not-allowed bg-[var(--bg-card)]' : 'focus:border-amber-500'
                    }`}
                  />
                  <span className="text-[10px] text-[var(--text-dim)]">
                    {isDevCEO
                      ? 'Developer/CEO Root Authority: You can freely modify the username of any account.'
                      : 'Username cannot be modified without Developer/CEO authorization.'}
                  </span>
                </div>
                <div>
                  <label className="block font-semibold text-[var(--text-muted)] mb-1">
                    Custom User Name
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    required
                    value={formFullName}
                    onChange={(e) => setFormFullName(e.target.value)}
                    placeholder="e.g. Bilal Ahmed or Custom Name"
                    className="w-full px-3 py-2 rounded-lg bg-[var(--bg-input)] border border-[var(--border-main)] text-[var(--text-main)] font-semibold"
                  />
                  <span className="text-[10px] text-[var(--text-dim)]">Display name assigned by Developer/CEO</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[var(--text-muted)] mb-1">
                    Custom Role Title
                  </label>
                  <input
                    type="text"
                    name="customRole"
                    value={formCustomRole}
                    onChange={(e) => setFormCustomRole(e.target.value)}
                    placeholder="e.g. Senior Fiber Splicer, Warehouse Lead"
                    className="w-full px-3 py-2 rounded-lg bg-[var(--bg-input)] border border-[var(--border-main)] text-[var(--text-main)] font-semibold"
                  />
                  <span className="text-[10px] text-[var(--text-dim)]">Specific organizational role title</span>
                </div>
                <div>
                  <label className="block font-semibold text-[var(--text-muted)] mb-1">
                    System Access Tier
                  </label>
                  {editingUser?.role === 'Developer/CEO' ? (
                    <div className="w-full px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold flex items-center gap-1.5">
                      <Crown className="w-3.5 h-3.5" />
                      <span>Developer/CEO (Sole Root Account)</span>
                    </div>
                  ) : (
                    <select
                      name="role"
                      value={formRole}
                      onChange={(e) => {
                        const newRole = e.target.value as UserRole;
                        setFormRole(newRole);
                        if (newRole === 'Admin') {
                          setFormPermissions({ ...DEFAULT_OPERATIONS_PERMISSIONS['Admin'] });
                        } else {
                          setFormPermissions({ ...DEFAULT_OPERATIONS_PERMISSIONS['Standard User'] });
                        }
                      }}
                      className="w-full px-3 py-2 rounded-lg bg-[var(--bg-input)] border border-[var(--border-main)] text-[var(--text-main)] font-semibold"
                    >
                      <option value="Standard User">Standard User</option>
                      <option value="Admin">Admin</option>
                    </select>
                  )}
                  <span className="text-[10px] text-[var(--text-dim)]">
                    {editingUser?.role === 'Developer/CEO'
                      ? 'Root privilege is permanent'
                      : 'Developer/CEO role cannot be assigned to others'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[var(--text-muted)] mb-1">
                    Official Corporate Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="e.g. ahmed@telenest.org"
                    className="w-full px-3 py-2 rounded-lg bg-[var(--bg-input)] border border-[var(--border-main)] text-[var(--text-main)]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[var(--text-muted)] mb-1">
                    Pre-registered Recovery Email
                  </label>
                  <input
                    type="email"
                    name="recoveryEmail"
                    required
                    value={formRecoveryEmail}
                    onChange={(e) => setFormRecoveryEmail(e.target.value)}
                    placeholder="e.g. personal.ahmed@gmail.com"
                    className="w-full px-3 py-2 rounded-lg bg-[var(--bg-input)] border border-[var(--border-main)] text-[var(--text-main)]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[var(--text-muted)] mb-1 flex items-center gap-1">
                    <KeyRound className="w-3.5 h-3.5 text-blue-400" />
                    <span>Login PIN (4 digits)</span>
                  </label>
                  <input
                    type="text"
                    maxLength={4}
                    pattern="[0-9]*"
                    value={formPin}
                    onChange={(e) => setFormPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder="e.g. 4790"
                    className="w-full px-3 py-2 rounded-lg bg-[var(--bg-input)] border border-[var(--border-main)] text-[var(--text-main)] font-mono font-bold tracking-widest"
                  />
                  <span className="text-[10px] text-[var(--text-dim)]">4-digit PIN required on startup login</span>
                </div>

                <div>
                  <label className="block font-semibold text-[var(--text-muted)] mb-1">
                    {editingUser ? 'Update Password (Optional)' : 'Initial Password'}
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    placeholder={editingUser ? 'Leave blank to keep current' : 'Default: tele123'}
                    className="w-full px-3 py-2 rounded-lg bg-[var(--bg-input)] border border-[var(--border-main)] text-[var(--text-main)]"
                  />
                  <span className="text-[10px] text-[var(--text-dim)]">Minimum 6 characters</span>
                </div>
              </div>

              {/* Operations Core Feature Permissions in Modal Form */}
              <div className="pt-2 border-t border-[var(--border-main)]">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-bold text-[11px] text-purple-400 flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5" />
                    <span>Operations Core Feature Access ({Object.values(formPermissions).filter(Boolean).length} Active)</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowPermissionsInForm(!showPermissionsInForm)}
                    className="text-[10px] text-blue-400 hover:text-blue-300 font-semibold cursor-pointer"
                  >
                    {showPermissionsInForm ? 'Collapse Permissions' : 'Customize Feature Access'}
                  </button>
                </div>

                {showPermissionsInForm && (
                  <div className="p-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-main)] space-y-3.5">
                    <div className="flex items-center justify-between text-[10px] text-[var(--text-muted)]">
                      <span className="font-semibold">Quick Presets:</span>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <button
                          type="button"
                          onClick={() => setFormPermissions({ ...DEFAULT_OPERATIONS_PERMISSIONS['Developer/CEO'] })}
                          className="px-2.5 py-1 rounded-md bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] border border-[var(--border-main)] text-[10px] text-[var(--text-main)] cursor-pointer"
                        >
                          Full Access
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setFormPermissions({
                              canViewInventory: true,
                              canEditInventory: false,
                              canDeleteInventory: false,
                              canViewICT: true,
                              canEditICT: true,
                              canDeleteICT: false,
                              canViewProjects: true,
                              canEditProjects: true,
                              canDeleteProjects: false,
                              canViewFinance: false,
                              canEditFinance: false,
                              canDeleteFinance: false,
                              canViewDailyWorks: true,
                              canEditDailyWorks: true,
                              canExportReports: true,
                            })
                          }
                          className="px-2.5 py-1 rounded-md bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] border border-[var(--border-main)] text-[10px] text-blue-400 cursor-pointer"
                        >
                          Field Eng
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setFormPermissions({
                              canViewInventory: true,
                              canEditInventory: true,
                              canDeleteInventory: false,
                              canViewICT: false,
                              canEditICT: false,
                              canDeleteICT: false,
                              canViewProjects: true,
                              canEditProjects: false,
                              canDeleteProjects: false,
                              canViewFinance: false,
                              canEditFinance: false,
                              canDeleteFinance: false,
                              canViewDailyWorks: true,
                              canEditDailyWorks: true,
                              canExportReports: true,
                            })
                          }
                          className="px-2.5 py-1 rounded-md bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] border border-[var(--border-main)] text-[10px] text-amber-400 cursor-pointer"
                        >
                          Warehouse
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setFormPermissions({
                              canViewInventory: true,
                              canEditInventory: false,
                              canDeleteInventory: false,
                              canViewICT: false,
                              canEditICT: false,
                              canDeleteICT: false,
                              canViewProjects: true,
                              canEditProjects: false,
                              canDeleteProjects: false,
                              canViewFinance: true,
                              canEditFinance: true,
                              canDeleteFinance: false,
                              canViewDailyWorks: false,
                              canEditDailyWorks: false,
                              canExportReports: true,
                            })
                          }
                          className="px-2.5 py-1 rounded-md bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] border border-[var(--border-main)] text-[10px] text-emerald-400 cursor-pointer"
                        >
                          Finance
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5 text-[11px]">
                      {[
                        { key: 'canViewInventory', label: 'View Inventory' },
                        { key: 'canEditInventory', label: 'Add/Edit Inventory' },
                        { key: 'canDeleteInventory', label: 'Delete Inventory', danger: true },
                        { key: 'canViewICT', label: 'View ICT Insights' },
                        { key: 'canEditICT', label: 'Add/Edit ICT Records' },
                        { key: 'canDeleteICT', label: 'Delete ICT Records', danger: true },
                        { key: 'canViewProjects', label: 'View Projects' },
                        { key: 'canEditProjects', label: 'Add/Edit Projects' },
                        { key: 'canDeleteProjects', label: 'Delete Projects', danger: true },
                        { key: 'canViewFinance', label: 'View Finance Ledger' },
                        { key: 'canEditFinance', label: 'Add/Edit Expenses' },
                        { key: 'canDeleteFinance', label: 'Delete Expenses', danger: true },
                        { key: 'canViewDailyWorks', label: 'View Daily Works' },
                        { key: 'canEditDailyWorks', label: 'Submit Daily Works' },
                        { key: 'canExportReports', label: 'Export QR Reports' },
                      ].map((item) => (
                        <label
                          key={item.key}
                          className="flex items-center justify-between px-3 py-2 rounded-lg bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] cursor-pointer select-none border border-[var(--border-main)]/60 transition"
                        >
                          <span className={`text-[10.5px] font-medium ${item.danger ? 'text-rose-400' : 'text-[var(--text-main)]'}`}>
                            {item.label}
                          </span>
                          <input
                            type="checkbox"
                            checked={formRole === 'Developer/CEO' ? true : !!formPermissions[item.key as keyof UserOperationsPermissions]}
                            disabled={formRole === 'Developer/CEO'}
                            onChange={() =>
                              setFormPermissions((prev) => ({
                                ...prev,
                                [item.key]: !prev[item.key as keyof UserOperationsPermissions],
                              }))
                            }
                            className="w-3.5 h-3.5 rounded text-blue-600 bg-[var(--bg-input)] border-[var(--border-main)]"
                          />
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* 4 Security Questions (Section 7) */}
              <div className="pt-2 border-t border-[var(--border-main)]">
                <div className="font-bold text-[11px] text-blue-400 mb-2 flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>Section 7: Mandatory 4 Security Questions for Password Recovery</span>
                </div>

                <div className="space-y-2.5">
                  <div>
                    <label className="block text-[10px] text-[var(--text-dim)]">1. What city were you born in?</label>
                    <input
                      type="text"
                      name="q1"
                      value={formQ1}
                      onChange={(e) => setFormQ1(e.target.value)}
                      placeholder="e.g. Lahore"
                      className="w-full px-2.5 py-1.5 rounded bg-[var(--bg-input)] border border-[var(--border-main)] text-[11px] text-[var(--text-main)]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-[var(--text-dim)]">2. What was the name of your first school?</label>
                    <input
                      type="text"
                      name="q2"
                      value={formQ2}
                      onChange={(e) => setFormQ2(e.target.value)}
                      placeholder="e.g. St. Marys"
                      className="w-full px-2.5 py-1.5 rounded bg-[var(--bg-input)] border border-[var(--border-main)] text-[11px] text-[var(--text-main)]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-[var(--text-dim)]">3. What was your childhood nickname?</label>
                    <input
                      type="text"
                      name="q3"
                      value={formQ3}
                      onChange={(e) => setFormQ3(e.target.value)}
                      placeholder="e.g. Billo"
                      className="w-full px-2.5 py-1.5 rounded bg-[var(--bg-input)] border border-[var(--border-main)] text-[11px] text-[var(--text-main)]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-[var(--text-dim)]">4. What was the make/model of your first vehicle?</label>
                    <input
                      type="text"
                      name="q4"
                      value={formQ4}
                      onChange={(e) => setFormQ4(e.target.value)}
                      placeholder="e.g. Toyota Corolla"
                      className="w-full px-2.5 py-1.5 rounded bg-[var(--bg-input)] border border-[var(--border-main)] text-[11px] text-[var(--text-main)]"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-between gap-2 border-t border-[var(--border-main)]">
                <p className="text-[10px] text-[var(--text-dim)]">
                  {editingUser ? `Editing profile ID: ${editingUser.id}` : 'All fields will be encrypted locally'}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsUserModalOpen(false)}
                    className="px-4 py-2 rounded-lg bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] text-[var(--text-main)] font-semibold transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    id="btn-save-user-account"
                    onClick={(e) => {
                      e.preventDefault();
                      handleSaveUser();
                    }}
                    className="px-5 py-2 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-bold transition shadow flex items-center gap-1.5 cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Account</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Password & PIN Reset Modal */}
      {isPasswordModalOpen && targetUserForPassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-sm bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-2xl shadow-2xl p-6 text-[var(--text-main)] overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-main)]">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-blue-400" />
                <h3 className="font-bold text-sm">Reset Credentials</h3>
              </div>
              <button
                onClick={() => {
                  setIsPasswordModalOpen(false);
                  setTargetUserForPassword(null);
                }}
                className="cursor-pointer"
              >
                <X className="w-4 h-4 text-[var(--text-dim)] hover:text-[var(--text-main)]" />
              </button>
            </div>

            <form onSubmit={handleSavePassword} className="mt-4 space-y-4 text-xs">
              <div className="p-2.5 rounded bg-[var(--bg-card)] border border-[var(--border-main)]">
                <div className="font-semibold text-[var(--text-main)]">{targetUserForPassword.fullName}</div>
                <div className="text-[10px] text-[var(--text-dim)]">
                  {targetUserForPassword.customRole || targetUserForPassword.role} • @{targetUserForPassword.username}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[var(--text-muted)] mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Leave blank to keep unchanged"
                  className="w-full px-3 py-2 rounded-lg bg-[var(--bg-input)] border border-[var(--border-main)] text-[var(--text-main)]"
                />
                <span className="text-[10px] text-[var(--text-dim)]">Minimum 6 characters</span>
              </div>

              <div>
                <label className="block font-semibold text-[var(--text-muted)] mb-1 flex items-center gap-1">
                  <KeyRound className="w-3.5 h-3.5 text-blue-400" />
                  <span>New Login PIN (4 digits)</span>
                </label>
                <input
                  type="text"
                  maxLength={4}
                  pattern="[0-9]*"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder={`Current: ${targetUserForPassword.pin || '4790'}`}
                  className="w-full px-3 py-2 rounded-lg bg-[var(--bg-input)] border border-[var(--border-main)] text-[var(--text-main)] font-mono font-bold tracking-widest"
                />
                <span className="text-[10px] text-[var(--text-dim)]">Must be exactly 4 digits for PIN login</span>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[var(--border-main)]">
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] text-[var(--text-main)] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-bold cursor-pointer"
                >
                  Update Credentials
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Deletion Modal (Fallback) */}
      <ConfirmDeleteModal
        isOpen={!!userToDelete}
        title="Delete User Account"
        entityName={userToDelete?.fullName || 'User'}
        entityType="User Account"
        warningMessage="This action will permanently revoke this user's access to TeleNest, invalidate credentials, and purge this user profile from the database."
        onConfirm={handleConfirmDeleteUser}
        onClose={() => setUserToDelete(null)}
        isLoading={isDeletingUser}
      />

      {/* User Activity & Work History Dossier Inspector Modal */}
      {selectedUserForDossier && (
        <UserDossierModal
          isOpen={!!selectedUserForDossier}
          onClose={() => setSelectedUserForDossier(null)}
          userId={selectedUserForDossier.id}
          isArchivedUser={false}
        />
      )}

      {/* User Offboarding & Archival Modal */}
      {userForArchivalModal && (
        <UserArchivalModal
          isOpen={!!userForArchivalModal}
          onClose={() => setUserForArchivalModal(null)}
          targetUser={userForArchivalModal}
          currentUser={currentUser}
          onSuccess={() => {
            showToast(
              `User account "${userForArchivalModal.fullName}" archived & removed. Complete offline backup safely preserved for Developer/CEO.`,
              'success'
            );
            reloadData();
            setUserForArchivalModal(null);
          }}
        />
      )}

      {/* Granular Operations Core RBAC Modal */}
      {userForPermissions && (
        <UserPermissionsModal
          isOpen={!!userForPermissions}
          user={userForPermissions}
          currentUserRole={currentUser?.role || 'Standard User'}
          isDevCEO={isDevCEO}
          isAdmin={isAdmin}
          onClose={() => setUserForPermissions(null)}
          onSave={handleSavePermissions}
        />
      )}
    </div>
  );
};
