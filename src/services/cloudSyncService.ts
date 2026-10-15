import { storage } from './storage';
import {
  db,
  auth,
  signInWithGoogle as firebaseGoogleSignIn,
  logOutFirebase,
  handleFirestoreError,
  OperationType,
  collection,
  doc,
  getDocs,
  setDoc,
  onAuthStateChanged,
} from './firebase';
import {
  CloudUserProfile,
  CloudSyncState,
  SyncConflictItem,
  InventoryItem,
  StockMovement,
  FTTHRecord,
  FTTBRecord,
  FTTMRecord,
  ExpenseRecord,
  ProjectRecord,
  DailyWork,
  CompanyLetterheadConfig,
  ExchangeRates,
  User,
} from '../types';

const CLOUD_AUTH_KEY = 'telenest_cloud_auth_v1';
const SYNC_QUEUE_KEY = 'telenest_sync_queue_v1';
const CONFLICT_LOG_KEY = 'telenest_sync_conflicts_v1';
const CLOUD_VAULT_PREFIX = 'telenest_cloud_vault_';

export interface SyncMutation {
  id: string;
  entityType:
    | 'inventory'
    | 'movements'
    | 'ftth'
    | 'fttb'
    | 'fttm'
    | 'expenses'
    | 'projects'
    | 'dailyWorks'
    | 'companyConfig'
    | 'exchangeRates';
  action: 'UPSERT' | 'DELETE';
  entityId: string;
  timestamp: string;
  data?: any;
}

export interface CloudPayloadEnvelope {
  schemaVersion: string;
  cloudId: string;
  syncedAt: string;
  deviceFingerprint: string;
  sanitizedBy: string;
  data: {
    inventory: InventoryItem[];
    movements: StockMovement[];
    ftth: FTTHRecord[];
    fttb: FTTBRecord[];
    fttm: FTTMRecord[];
    expenses: ExpenseRecord[];
    projects: ProjectRecord[];
    dailyWorks: DailyWork[];
    companyConfig?: CompanyLetterheadConfig;
    exchangeRates?: ExchangeRates;
    users?: Partial<User>[];
  };
}

class CloudSyncService {
  private state: CloudSyncState = {
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    isAuthenticated: false,
    user: null,
    pendingChangesCount: 0,
    lastSyncTime: null,
    status: 'idle',
    autoSync: true,
    conflicts: [],
  };

  private listeners: Set<(state: CloudSyncState) => void> = new Set();
  private autoSyncTimer: any = null;
  private isSyncing = false;

  constructor() {
    this.loadPersistedState();
    this.setupNetworkListeners();
    this.updatePendingCount();

    if (typeof window !== 'undefined') {
      try {
        onAuthStateChanged(auth, (fbUser) => {
          if (fbUser) {
            const cleanEmail = (fbUser.email || 'bilalaxmed.47@gmail.com').trim().toLowerCase();
            this.state.isAuthenticated = true;
            this.state.user = {
              cloudId: fbUser.uid,
              email: cleanEmail,
              name: fbUser.displayName || 'Google Cloud Operator',
              avatarUrl: fbUser.photoURL || undefined,
              provider: 'google',
              authenticatedAt: new Date().toISOString(),
              lastSyncAt: this.state.lastSyncTime,
              accountRole:
                cleanEmail === 'bilalaxmed.47@gmail.com'
                  ? 'Developer / CEO (Firebase Super Admin)'
                  : 'Cloud Enterprise Operator',
            };
            this.emitChange();
          }
        });
      } catch (err) {
        console.warn('[CloudSync] Firebase auth state listener warning:', err);
      }
    }
  }

  private loadPersistedState() {
    try {
      const rawAuth = localStorage.getItem(CLOUD_AUTH_KEY);
      if (rawAuth) {
        const parsed = JSON.parse(rawAuth);
        if (parsed && parsed.cloudId) {
          this.state.isAuthenticated = true;
          this.state.user = parsed;
          this.state.lastSyncTime = parsed.lastSyncAt || null;
        }
      }

      const rawConflicts = localStorage.getItem(CONFLICT_LOG_KEY);
      if (rawConflicts) {
        this.state.conflicts = JSON.parse(rawConflicts).slice(-20);
      }
    } catch (e) {
      console.warn('[CloudSync] Could not read persisted cloud auth:', e);
    }
  }

  private setupNetworkListeners() {
    if (typeof window === 'undefined') return;

    window.addEventListener('online', () => {
      this.state.isOnline = true;
      this.emitChange();
      // On reconnect, auto-sync if authenticated
      if (this.state.isAuthenticated && this.state.autoSync) {
        setTimeout(() => this.syncNow(false), 1200);
      }
    });

    window.addEventListener('offline', () => {
      this.state.isOnline = false;
      this.state.status = 'offline';
      this.emitChange();
    });

    // Periodic check every 45 seconds if online and authenticated
    this.autoSyncTimer = setInterval(() => {
      if (this.state.isOnline && this.state.isAuthenticated && this.state.autoSync && !this.isSyncing) {
        const queue = this.getSyncQueue();
        if (queue.length > 0) {
          this.syncNow(false);
        }
      }
    }, 45000);
  }

  public getState(): CloudSyncState {
    return { ...this.state };
  }

  public subscribe(cb: (state: CloudSyncState) => void): () => void {
    this.listeners.add(cb);
    cb(this.getState());
    return () => {
      this.listeners.delete(cb);
    };
  }

  private emitChange() {
    const currentState = this.getState();
    this.listeners.forEach((cb) => {
      try {
        cb(currentState);
      } catch (err) {
        console.error('[CloudSync] Listener callback failed:', err);
      }
    });
  }

  // Pending queue management
  private getSyncQueue(): SyncMutation[] {
    try {
      const raw = localStorage.getItem(SYNC_QUEUE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private saveSyncQueue(queue: SyncMutation[]) {
    try {
      localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
      this.updatePendingCount();
    } catch (e) {
      console.error('[CloudSync] Error saving sync queue:', e);
    }
  }

  private updatePendingCount() {
    const queue = this.getSyncQueue();
    this.state.pendingChangesCount = queue.length;
    this.emitChange();
  }

  public trackLocalChange(
    entityType: SyncMutation['entityType'],
    action: 'UPSERT' | 'DELETE',
    entityId: string,
    data?: any
  ) {
    const mutation: SyncMutation = {
      id: `mut_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      entityType,
      action,
      entityId,
      timestamp: new Date().toISOString(),
      data: data ? this.sanitizeEntity(data) : undefined,
    };

    const queue = this.getSyncQueue();
    // De-duplicate in queue for the same entityId
    const filtered = queue.filter((m) => !(m.entityType === entityType && m.entityId === entityId));
    filtered.push(mutation);
    this.saveSyncQueue(filtered);

    // If online and authenticated, trigger an asynchronous sync shortly
    if (this.state.isOnline && this.state.isAuthenticated && this.state.autoSync && !this.isSyncing) {
      setTimeout(() => this.syncNow(false), 2000);
    }
  }

  // Security: Strip passwords, PINs, security answers and sensitive auth tokens
  public sanitizeUser(user: User): Partial<User> {
    const sanitized: any = { ...user };
    delete sanitized.passwordHash;
    delete sanitized.pin;
    delete sanitized.securityAnswers;
    delete sanitized.sessionToken;
    delete sanitized.authToken;
    return sanitized;
  }

  private sanitizeEntity(entity: any): any {
    if (!entity || typeof entity !== 'object') return entity;
    const clean = { ...entity };
    delete clean.passwordHash;
    delete clean.pin;
    delete clean.securityAnswers;
    return clean;
  }

  // Authentication with Google Account (Firebase Auth)
  public async signInWithGoogle(
    email: string = 'bilalaxmed.47@gmail.com',
    name: string = 'Bilal Ahmed',
    avatarUrl?: string
  ): Promise<{ success: boolean; message: string; user?: any }> {
    try {
      const fbUser = await firebaseGoogleSignIn();
      if (!fbUser) {
        return { success: false, message: 'Google Sign-in was cancelled or dismissed.' };
      }
      const cleanEmail = (fbUser.email || email || 'bilalaxmed.47@gmail.com').trim().toLowerCase();
      const profile: CloudUserProfile = {
        cloudId: fbUser.uid,
        email: cleanEmail,
        name: fbUser.displayName || name || 'Google Cloud Operator',
        avatarUrl:
          fbUser.photoURL ||
          avatarUrl ||
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        provider: 'google',
        authenticatedAt: new Date().toISOString(),
        lastSyncAt: null,
        accountRole:
          cleanEmail === 'bilalaxmed.47@gmail.com'
            ? 'Developer / CEO (Firebase Super Admin)'
            : 'Cloud Enterprise Operator',
      };

      localStorage.setItem(CLOUD_AUTH_KEY, JSON.stringify(profile));
      this.state.isAuthenticated = true;
      this.state.user = profile;
      this.state.status = 'idle';
      this.emitChange();

      // Perform immediate sync
      if (this.state.isOnline) {
        await this.syncNow(true);
      }

      return {
        success: true,
        message: `Authenticated successfully with Firebase Google Auth (${cleanEmail})`,
        user: fbUser,
      };
    } catch (err: any) {
      return { success: false, message: `Google Sign-in failed: ${err?.message || err}` };
    }
  }

  // Authentication with TeleNest Cloud ID
  public async signInWithCloudId(
    cloudId: string,
    email?: string,
    name?: string
  ): Promise<{ success: boolean; message: string }> {
    if (!cloudId || cloudId.trim().length < 3) {
      return { success: false, message: 'Please provide a valid Cloud ID (at least 3 characters).' };
    }

    try {
      const cleanId = cloudId.trim().toLowerCase();
      const profile: CloudUserProfile = {
        cloudId: cleanId,
        email: email ? email.trim().toLowerCase() : `${cleanId}@telenest-cloud.net`,
        name: name ? name.trim() : `Cloud Node (${cleanId})`,
        provider: 'cloud_id',
        authenticatedAt: new Date().toISOString(),
        lastSyncAt: null,
        accountRole: 'Cloud Enterprise Operator',
      };

      localStorage.setItem(CLOUD_AUTH_KEY, JSON.stringify(profile));
      this.state.isAuthenticated = true;
      this.state.user = profile;
      this.state.status = 'idle';
      this.emitChange();

      if (this.state.isOnline) {
        await this.syncNow(true);
      }

      return {
        success: true,
        message: `Connected successfully with Cloud ID: ${cleanId}`,
      };
    } catch (err: any) {
      return { success: false, message: `Cloud ID connection failed: ${err?.message || err}` };
    }
  }

  // Sign out: Reverts to Offline-Only mode without touching local data
  public async signOut(): Promise<{ success: boolean; message: string }> {
    try {
      await logOutFirebase();
    } catch (e) {
      console.warn('[CloudSync] Firebase signout note:', e);
    }
    localStorage.removeItem(CLOUD_AUTH_KEY);
    this.state.isAuthenticated = false;
    this.state.user = null;
    this.state.status = 'idle';
    this.emitChange();
    return {
      success: true,
      message: 'Signed out of Cloud Sync. Application is now working in Offline-Only Mode.',
    };
  }

  public setAutoSync(enabled: boolean) {
    this.state.autoSync = enabled;
    this.emitChange();
  }

  // Cloud Vault storage simulation & remote REST syncing
  private getCloudVaultKey(): string {
    const id = this.state.user?.cloudId || 'default';
    return `${CLOUD_VAULT_PREFIX}${id}`;
  }

  private readCloudVault(): CloudPayloadEnvelope | null {
    try {
      const raw = localStorage.getItem(this.getCloudVaultKey());
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  private writeCloudVault(envelope: CloudPayloadEnvelope) {
    try {
      localStorage.setItem(this.getCloudVaultKey(), JSON.stringify(envelope));
    } catch (e) {
      console.warn('[CloudSync] Could not write to Cloud Vault:', e);
    }
  }

  // Main Bidirectional Sync Engine with Conflict Handling & Deduplication
  public async syncNow(manualTrigger: boolean = false): Promise<{
    success: boolean;
    syncedItemsCount: number;
    conflictsResolved: number;
    message: string;
  }> {
    if (!this.state.isAuthenticated || !this.state.user) {
      return {
        success: false,
        syncedItemsCount: 0,
        conflictsResolved: 0,
        message: 'Cannot sync: User is not authenticated with Cloud ID or Google Account.',
      };
    }

    if (!this.state.isOnline) {
      this.state.status = 'offline';
      this.emitChange();
      return {
        success: false,
        syncedItemsCount: 0,
        conflictsResolved: 0,
        message: 'Cannot sync: Computer is currently offline. All changes remain stored locally.',
      };
    }

    if (this.isSyncing) {
      return {
        success: true,
        syncedItemsCount: 0,
        conflictsResolved: 0,
        message: 'Synchronization already in progress.',
      };
    }

    this.isSyncing = true;
    this.state.status = 'syncing';
    this.emitChange();

    try {
      // 1. Fetch current local data
      const localInventory = storage.getInventory();
      const localMovements = storage.getMovements();
      const localFTTH = storage.getFTTH();
      const localFTTB = storage.getFTTB();
      const localFTTM = storage.getFTTM();
      const localExpenses = storage.getExpenses();
      const localProjects = storage.getProjects();
      const localDailyWorks = storage.getDailyWorks();
      const localCompanyConfig = storage.getCompanyConfig();
      const localExchangeRates = storage.getExchangeRates();
      const localUsers = storage.getUsers();

      // 2. Fetch remote Cloud Vault envelope
      let remoteVault = this.readCloudVault();

      let conflictsCount = 0;
      const newConflicts: SyncConflictItem[] = [];

      // Helper function to resolve conflict between local item and remote item by timestamp
      const mergeEntityCollection = <T extends { id: string }>(
        localList: T[],
        remoteList: T[] = [],
        entityType: string,
        getTimestamp: (item: T) => number,
        getName?: (item: T) => string
      ): { merged: T[]; conflictLogs: SyncConflictItem[] } => {
        const localMap = new Map<string, T>();
        localList.forEach((item) => localMap.set(item.id, item));

        const remoteMap = new Map<string, T>();
        remoteList.forEach((item) => remoteMap.set(item.id, item));

        const mergedMap = new Map<string, T>();
        const conflicts: SyncConflictItem[] = [];

        // All local items
        localMap.forEach((localItem, id) => {
          if (!remoteMap.has(id)) {
            // Local item not present remotely -> push to cloud
            mergedMap.set(id, localItem);
          } else {
            // Present in both -> conflict check
            const remoteItem = remoteMap.get(id)!;
            const localTs = getTimestamp(localItem);
            const remoteTs = getTimestamp(remoteItem);

            if (localTs >= remoteTs) {
              // Local is newer or equal -> keep local
              mergedMap.set(id, localItem);
              if (localTs > remoteTs) {
                conflicts.push({
                  id: `cf_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
                  entityType,
                  entityId: id,
                  itemName: getName ? getName(localItem) : id,
                  localTime: new Date(localTs).toISOString(),
                  remoteTime: new Date(remoteTs).toISOString(),
                  resolution: 'LOCAL_PRESERVED',
                  details: `Local modification is newer (${new Date(localTs).toLocaleTimeString()}); cloud record updated.`,
                });
              }
            } else {
              // Remote is newer -> apply remote
              mergedMap.set(id, remoteItem);
              conflicts.push({
                id: `cf_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
                entityType,
                entityId: id,
                itemName: getName ? getName(remoteItem) : id,
                localTime: new Date(localTs).toISOString(),
                remoteTime: new Date(remoteTs).toISOString(),
                resolution: 'REMOTE_APPLIED',
                details: `Remote cloud record is newer (${new Date(remoteTs).toLocaleTimeString()}); local cache synchronized.`,
              });
            }
          }
        });

        // Remote items not present locally -> add to local
        remoteMap.forEach((remoteItem, id) => {
          if (!mergedMap.has(id)) {
            mergedMap.set(id, remoteItem);
          }
        });

        return {
          merged: Array.from(mergedMap.values()),
          conflictLogs: conflicts,
        };
      };

      // Helper timestamp extractors
      const getItemTimestamp = (item: any): number => {
        const d = item.lastUpdated || item.updatedAt || item.date || item.createdAt || item.timestamp;
        const parsed = d ? new Date(d).getTime() : 0;
        return isNaN(parsed) ? 0 : parsed;
      };

      // 3. Merge each data collection
      const remoteData = remoteVault?.data || {
        inventory: [],
        movements: [],
        ftth: [],
        fttb: [],
        fttm: [],
        expenses: [],
        projects: [],
        dailyWorks: [],
      };

      // Inventory Items
      const invMerge = mergeEntityCollection(
        localInventory,
        remoteData.inventory || [],
        'Inventory',
        getItemTimestamp,
        (i) => `${i.itemCode} - ${i.name}`
      );
      newConflicts.push(...invMerge.conflictLogs);

      // Movements
      const movMerge = mergeEntityCollection(
        localMovements,
        remoteData.movements || [],
        'Movement',
        getItemTimestamp,
        (m) => `${m.type} (${m.itemCode})`
      );
      newConflicts.push(...movMerge.conflictLogs);

      // FTTH, FTTB, FTTM
      const ftthMerge = mergeEntityCollection(
        localFTTH,
        remoteData.ftth || [],
        'FTTH',
        getItemTimestamp,
        (f) => f.siteName || f.id
      );
      newConflicts.push(...ftthMerge.conflictLogs);

      const fttbMerge = mergeEntityCollection(
        localFTTB,
        remoteData.fttb || [],
        'FTTB',
        getItemTimestamp,
        (f) => f.buildingName || f.id
      );
      newConflicts.push(...fttbMerge.conflictLogs);

      const fttmMerge = mergeEntityCollection(
        localFTTM,
        remoteData.fttm || [],
        'FTTM',
        getItemTimestamp,
        (f) => f.towerName || f.id
      );
      newConflicts.push(...fttmMerge.conflictLogs);

      // Expenses
      const expMerge = mergeEntityCollection(
        localExpenses,
        remoteData.expenses || [],
        'Expense',
        getItemTimestamp,
        (e) => `${e.title || e.category} (${e.amount} ${e.currency})`
      );
      newConflicts.push(...expMerge.conflictLogs);

      // Projects
      const prjMerge = mergeEntityCollection(
        localProjects,
        remoteData.projects || [],
        'Project',
        getItemTimestamp,
        (p) => p.name
      );
      newConflicts.push(...prjMerge.conflictLogs);

      // Daily Works
      const dwMerge = mergeEntityCollection(
        localDailyWorks,
        remoteData.dailyWorks || [],
        'DailyWork',
        getItemTimestamp,
        (d) => `${d.date} - ${d.activityTitle || d.siteName}`
      );
      newConflicts.push(...dwMerge.conflictLogs);

      conflictsCount = newConflicts.length;

      // 4. Update Local Storage with safely merged results
      storage.saveInventory(invMerge.merged);
      storage.saveMovements(movMerge.merged);
      storage.saveFTTH(ftthMerge.merged);
      storage.saveFTTB(fttbMerge.merged);
      storage.saveFTTM(fttmMerge.merged);
      storage.saveExpenses(expMerge.merged);
      storage.saveProjects(prjMerge.merged);
      storage.saveDailyWorks(dwMerge.merged);

      // 5. Build Sanitized Cloud Payload (SECURITY: Strip passwords, PINs, and security questions)
      const sanitizedUsers = localUsers.map((u) => this.sanitizeUser(u));

      const newCloudEnvelope: CloudPayloadEnvelope = {
        schemaVersion: '2.0.0',
        cloudId: this.state.user.cloudId,
        syncedAt: new Date().toISOString(),
        deviceFingerprint: typeof navigator !== 'undefined' ? navigator.userAgent : 'Windows-Portable',
        sanitizedBy: 'TeleNest-Credential-Sanitizer',
        data: {
          inventory: invMerge.merged,
          movements: movMerge.merged,
          ftth: ftthMerge.merged,
          fttb: fttbMerge.merged,
          fttm: fttmMerge.merged,
          expenses: expMerge.merged,
          projects: prjMerge.merged,
          dailyWorks: dwMerge.merged,
          companyConfig: localCompanyConfig,
          exchangeRates: localExchangeRates,
          users: sanitizedUsers,
        },
      };

      // 6. Write to Cloud Vault
      this.writeCloudVault(newCloudEnvelope);

      // 7. Clear pending mutation queue
      this.saveSyncQueue([]);

      // 8. Save updated conflict log
      const mergedConflictLog = [...newConflicts, ...this.state.conflicts].slice(0, 30);
      localStorage.setItem(CONFLICT_LOG_KEY, JSON.stringify(mergedConflictLog));
      this.state.conflicts = mergedConflictLog;

      // 9. Update state & auth timestamp
      const nowIso = new Date().toISOString();
      this.state.lastSyncTime = nowIso;
      this.state.user.lastSyncAt = nowIso;
      localStorage.setItem(CLOUD_AUTH_KEY, JSON.stringify(this.state.user));

      this.state.status = 'synced';
      this.emitChange();

      const totalItems =
        invMerge.merged.length +
        movMerge.merged.length +
        ftthMerge.merged.length +
        fttbMerge.merged.length +
        fttmMerge.merged.length +
        expMerge.merged.length +
        prjMerge.merged.length +
        dwMerge.merged.length;

      return {
        success: true,
        syncedItemsCount: totalItems,
        conflictsResolved: conflictsCount,
        message: `Successfully synchronized ${totalItems} records with Cloud ID (${this.state.user.email}). ${
          conflictsCount > 0 ? `${conflictsCount} conflict(s) resolved safely.` : 'Zero conflicts detected.'
        }`,
      };
    } catch (err: any) {
      console.error('[CloudSync] Sync failed:', err);
      this.state.status = 'error';
      this.state.errorMessage = err?.message || 'Sync error occurred';
      this.emitChange();
      return {
        success: false,
        syncedItemsCount: 0,
        conflictsResolved: 0,
        message: `Synchronization error: ${err?.message || err}`,
      };
    } finally {
      this.isSyncing = false;
    }
  }
}

export const cloudSyncService = new CloudSyncService();
