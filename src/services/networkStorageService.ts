import { storage } from './storage';
import { User } from '../types';

export type NetworkLocationType = 'portable_usb' | 'network_share' | 'mapped_drive' | 'custom_folder' | 'internal';

export interface NetworkStorageConfig {
  isActive: boolean;
  locationType: NetworkLocationType;
  folderName: string;
  networkPathAlias: string;
  storeOnlyOnNetwork: boolean; // "Do not store duplicate or separate data locally unless explicitly configured"
  enableLocalMirror: boolean;  // Explicit user opt-in
  lastSyncTimestamp: string | null;
  lastReadTimestamp: string | null;
  lastWriteTimestamp: string | null;
  status: 'connected' | 'disconnected' | 'checking' | 'idle' | 'error';
  lastErrorMessage: string | null;
}

export interface NetworkStorageState extends NetworkStorageConfig {
  isSupported: boolean;
  hasStoredHandle: boolean;
  pendingChangesCount: number;
}

type NetworkStorageListener = (state: NetworkStorageState) => void;

const DB_NAME = 'telenest_network_storage_db';
const STORE_NAME = 'handles';
const HANDLE_KEY = 'primary_network_directory_handle';
const CONFIG_KEY = 'telenest_network_storage_config_v1';
const MASTER_FILE_NAME = 'TeleNest_Enterprise_Database_Master.json';
const HEARTBEAT_LOCK_FILE = 'telenest_storage_heartbeat.lock';

// IndexedDB Helper for FileSystemDirectoryHandle persistence
async function openHandleDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE_NAME)) {
        req.result.createObjectStore(STORE_NAME);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function saveHandleToDb(handle: any): Promise<void> {
  try {
    const db = await openHandleDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(handle, HANDLE_KEY);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Could not save directory handle to IndexedDB:', err);
  }
}

async function getHandleFromDb(): Promise<any | null> {
  try {
    const db = await openHandleDb();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(HANDLE_KEY);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

async function clearHandleFromDb(): Promise<void> {
  try {
    const db = await openHandleDb();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(HANDLE_KEY);
      req.onsuccess = () => resolve();
      req.onerror = () => resolve();
    });
  } catch {
    // ignore
  }
}

class NetworkStorageService {
  private directoryHandle: any = null;
  private listeners: Set<NetworkStorageListener> = new Set();
  private heartbeatInterval: any = null;
  private writeDebounceTimer: any = null;
  private pendingChanges: boolean = false;
  private pendingWritesCount: number = 0;
  private isWriting: boolean = false;

  private config: NetworkStorageConfig = {
    isActive: false,
    locationType: 'internal',
    folderName: '',
    networkPathAlias: '',
    storeOnlyOnNetwork: true, // Default: strictly follow user requirement (do not duplicate locally)
    enableLocalMirror: false,
    lastSyncTimestamp: null,
    lastReadTimestamp: null,
    lastWriteTimestamp: null,
    status: 'idle',
    lastErrorMessage: null,
  };

  constructor() {
    this.loadPersistedConfig();
    this.initStoredHandle();
  }

  private loadPersistedConfig() {
    try {
      const saved = localStorage.getItem(CONFIG_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        this.config = { ...this.config, ...parsed };
      }
    } catch (e) {
      console.warn('Could not load network storage config:', e);
    }
  }

  private persistConfig() {
    try {
      localStorage.setItem(CONFIG_KEY, JSON.stringify(this.config));
    } catch (e) {
      console.warn('Could not persist network storage config:', e);
    }
  }

  private async initStoredHandle() {
    if (!this.config.isActive) return;

    try {
      const storedHandle = await getHandleFromDb();
      if (storedHandle) {
        this.directoryHandle = storedHandle;
        this.config.status = 'checking';
        this.notifyListeners();

        // Check if browser permission is still granted
        if ('queryPermission' in storedHandle) {
          const perm = await storedHandle.queryPermission({ mode: 'readwrite' });
          if (perm === 'granted') {
            await this.testAndConnect();
          } else {
            this.config.status = 'disconnected';
            this.config.lastErrorMessage =
              'Network storage permission required. Click "Reconnect Storage" to grant access.';
            this.notifyListeners();
          }
        } else {
          await this.testAndConnect();
        }
      } else {
        this.config.status = 'disconnected';
        this.config.lastErrorMessage =
          'Stored network drive handle not found. Please re-select the storage location.';
        this.notifyListeners();
      }
    } catch (err: any) {
      this.config.status = 'disconnected';
      this.config.lastErrorMessage = `Failed to access network storage: ${err?.message || err}`;
      this.notifyListeners();
    }
  }

  public subscribe(listener: NetworkStorageListener): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners() {
    const state = this.getState();
    this.listeners.forEach((fn) => {
      try {
        fn(state);
      } catch (err) {
        console.error('Error in network storage listener:', err);
      }
    });
  }

  public getState(): NetworkStorageState {
    const isSupported = typeof window !== 'undefined' && 'showDirectoryPicker' in window;
    return {
      ...this.config,
      isSupported,
      hasStoredHandle: !!this.directoryHandle,
      pendingChangesCount: this.pendingWritesCount,
    };
  }

  public isNetworkStorageActive(): boolean {
    return this.config.isActive && this.config.status === 'connected' && !!this.directoryHandle;
  }

  public shouldStoreOnlyOnNetwork(): boolean {
    return this.config.isActive && this.config.storeOnlyOnNetwork && !this.config.enableLocalMirror;
  }

  /**
   * Prompts user to select portable device or office network folder
   */
  public async selectStorageLocation(
    customAlias?: string,
    locationType: NetworkLocationType = 'network_share'
  ): Promise<{ success: boolean; message: string }> {
    if (!('showDirectoryPicker' in window)) {
      return {
        success: false,
        message:
          'The File System Access API is not supported in this browser. Please use Chrome, Edge, or an updated Chromium browser.',
      };
    }

    try {
      const handle = await (window as any).showDirectoryPicker({
        mode: 'readwrite',
      });

      this.directoryHandle = handle;
      const folderName = handle.name || 'Office_Network_Storage';

      this.config = {
        ...this.config,
        isActive: true,
        locationType,
        folderName,
        networkPathAlias: customAlias || folderName,
        status: 'checking',
        lastErrorMessage: null,
      };

      await saveHandleToDb(handle);
      this.persistConfig();
      this.notifyListeners();

      // Test directory access and sync master database
      const testResult = await this.testAndConnect();
      if (!testResult.success) {
        return testResult;
      }

      // Start periodic heartbeat monitor
      this.startHeartbeatMonitor();

      return {
        success: true,
        message: `Successfully connected to portable/network storage at "${this.config.networkPathAlias || folderName}". Application data will now read and save directly from this location.`,
      };
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        return { success: false, message: 'Storage location selection cancelled.' };
      }
      this.config.status = 'error';
      this.config.lastErrorMessage = err?.message || String(err);
      this.persistConfig();
      this.notifyListeners();
      return { success: false, message: `Could not connect to storage location: ${err?.message || err}` };
    }
  }

  /**
   * Reconnects to previously authorized storage location
   */
  public async reconnect(): Promise<{ success: boolean; message: string }> {
    if (!this.directoryHandle) {
      const storedHandle = await getHandleFromDb();
      if (storedHandle) {
        this.directoryHandle = storedHandle;
      } else {
        return {
          success: false,
          message: 'No saved storage location found. Please select a storage location first.',
        };
      }
    }

    try {
      // Re-verify permission
      if ('requestPermission' in this.directoryHandle) {
        const perm = await this.directoryHandle.requestPermission({ mode: 'readwrite' });
        if (perm !== 'granted') {
          this.config.status = 'disconnected';
          this.config.lastErrorMessage = 'Write permission was not granted by user.';
          this.notifyListeners();
          return { success: false, message: 'Storage write permission was denied.' };
        }
      }

      return await this.testAndConnect();
    } catch (err: any) {
      this.config.status = 'disconnected';
      this.config.lastErrorMessage = `Reconnection failed: ${err?.message || err}`;
      this.persistConfig();
      this.notifyListeners();
      return { success: false, message: `Failed to reconnect: ${err?.message || err}` };
    }
  }

  /**
   * Test connection, verify read/write, and initialize or read master database
   */
  private async testAndConnect(): Promise<{ success: boolean; message: string }> {
    if (!this.directoryHandle) {
      this.config.status = 'disconnected';
      this.notifyListeners();
      return { success: false, message: 'No directory handle available.' };
    }

    try {
      // 1. Write heartbeat test file to confirm write access
      const lockHandle = await this.directoryHandle.getFileHandle(HEARTBEAT_LOCK_FILE, { create: true });
      const writable = await lockHandle.createWritable();
      const heartbeatPayload = JSON.stringify({
        app: storage.getSoftwareName(),
        connectedAt: new Date().toISOString(),
        locationAlias: this.config.networkPathAlias,
      });
      await writable.write(heartbeatPayload);
      await writable.close();

      // 2. Check if master database exists on network storage
      let hasMasterFile = false;
      try {
        await this.directoryHandle.getFileHandle(MASTER_FILE_NAME);
        hasMasterFile = true;
      } catch {
        hasMasterFile = false;
      }

      if (hasMasterFile) {
        // Read directly from network storage
        await this.readFromNetworkStorage();
      } else {
        // First-time setup in this folder: write existing master dataset to network drive
        const fullBackup = storage.exportFullBackup();
        await this.writeMasterFileDirectly(fullBackup);
      }

      this.config.status = 'connected';
      this.config.lastErrorMessage = null;
      this.config.lastSyncTimestamp = new Date().toISOString();
      this.persistConfig();
      this.notifyListeners();

      // Start heartbeat
      this.startHeartbeatMonitor();

      // Flush any pending changes
      if (this.pendingChanges) {
        this.saveNow();
      }

      return {
        success: true,
        message: `Connected to "${this.config.folderName}". Data is synchronized with network storage.`,
      };
    } catch (err: any) {
      this.config.status = 'disconnected';
      this.config.lastErrorMessage = `Network storage unavailable: ${err?.message || err}`;
      this.persistConfig();
      this.notifyListeners();
      return {
        success: false,
        message: `Network or portable storage device is unavailable: ${err?.message || err}. Please ensure the drive is plugged in or the network share is accessible.`,
      };
    }
  }

  /**
   * Reads data directly from TeleNest_Enterprise_Database_Master.json on the network storage
   */
  public async readFromNetworkStorage(): Promise<{ success: boolean; message: string }> {
    if (!this.directoryHandle) {
      return { success: false, message: 'Storage location not connected.' };
    }

    try {
      const fileHandle = await this.directoryHandle.getFileHandle(MASTER_FILE_NAME);
      const file = await fileHandle.getFile();
      const text = await file.text();

      if (!text || text.trim().length === 0) {
        throw new Error('Master data file on network storage is empty.');
      }

      const parsed = JSON.parse(text);
      const swName = storage.getSoftwareName();
      if (!parsed.data || (parsed.app !== 'TeleNest' && parsed.app !== swName && !parsed.softwareName)) {
        throw new Error(`File on network storage does not match ${swName} data structure.`);
      }

      // Load master data into TeleNest runtime
      const currentUser = storage.getCurrentUser() || ({ id: 'sys', fullName: 'Network Storage', role: 'Developer/CEO' } as User);
      const success = storage.importFullBackup(text, currentUser);

      if (success) {
        this.config.lastReadTimestamp = new Date().toISOString();
        this.config.lastSyncTimestamp = new Date().toISOString();
        this.config.status = 'connected';
        this.config.lastErrorMessage = null;
        this.persistConfig();
        this.notifyListeners();

        // Enforce: do not store duplicate data locally unless configured
        if (this.shouldStoreOnlyOnNetwork()) {
          this.purgeDuplicateLocalStorage();
        }

        return {
          success: true,
          message: `${swName} data successfully read and loaded directly from network storage.`,
        };
      } else {
        throw new Error('Failed to parse database records from network storage file.');
      }
    } catch (err: any) {
      this.config.status = 'disconnected';
      this.config.lastErrorMessage = `Read failed: ${err?.message || err}`;
      this.notifyListeners();
      return {
        success: false,
        message: `Unable to read data from network storage device: ${err?.message || err}`,
      };
    }
  }

  /**
   * Internal direct file write with atomic swap
   */
  private async writeMasterFileDirectly(jsonContent: string): Promise<boolean> {
    if (!this.directoryHandle) return false;
    this.isWriting = true;
    try {
      const fileHandle = await this.directoryHandle.getFileHandle(MASTER_FILE_NAME, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(jsonContent);
      await writable.close();

      this.config.lastWriteTimestamp = new Date().toISOString();
      this.config.lastSyncTimestamp = new Date().toISOString();
      this.config.status = 'connected';
      this.config.lastErrorMessage = null;
      this.pendingChanges = false;
      this.pendingWritesCount = 0;
      this.persistConfig();
      this.notifyListeners();

      // Enforce: clean local duplicate data if configured
      if (this.shouldStoreOnlyOnNetwork()) {
        this.purgeDuplicateLocalStorage();
      }

      return true;
    } catch (err: any) {
      console.warn('Failed to write master file to network storage:', err);
      this.config.status = 'disconnected';
      this.config.lastErrorMessage = `Network storage disconnected: ${err?.message || err}. Data held safely in memory.`;
      this.pendingChanges = true;
      this.pendingWritesCount += 1;
      this.persistConfig();
      this.notifyListeners();
      return false;
    } finally {
      this.isWriting = false;
    }
  }

  /**
   * Called by storage service whenever any data changes in TeleNest
   */
  public onStorageChanged(): void {
    if (!this.config.isActive) return;

    this.pendingChanges = true;
    this.pendingWritesCount += 1;
    this.notifyListeners();

    // Debounce writes to prevent disk thrashing
    if (this.writeDebounceTimer) {
      clearTimeout(this.writeDebounceTimer);
    }

    this.writeDebounceTimer = setTimeout(() => {
      this.saveNow();
    }, 350);
  }

  /**
   * Immediate synchronous save trigger
   */
  public async saveNow(): Promise<boolean> {
    if (!this.config.isActive) return false;
    if (this.isWriting) return false;

    if (!this.directoryHandle) {
      this.config.status = 'disconnected';
      this.config.lastErrorMessage = 'Storage device disconnected. Cannot write data.';
      this.notifyListeners();
      return false;
    }

    const masterJson = storage.exportFullBackup();
    return await this.writeMasterFileDirectly(masterJson);
  }

  /**
   * Explicit save action with formatted result message
   */
  public async saveToNetworkStorage(): Promise<{ success: boolean; message: string }> {
    if (!this.directoryHandle || !this.config.isActive) {
      return { success: false, message: 'Portable or office network storage location is not connected.' };
    }
    const success = await this.saveNow();
    if (success) {
      return {
        success: true,
        message: `${storage.getSoftwareName()} data saved directly to "${this.config.folderName}" (${this.config.networkPathAlias || 'Network Storage'}).`,
      };
    } else {
      return {
        success: false,
        message: this.config.lastErrorMessage || 'Failed to save data directly to network storage device.',
      };
    }
  }

  /**
   * Purges duplicate local copy to comply with:
   * "Do not store duplicate or separate data locally unless explicitly configured by the user."
   */
  public purgeDuplicateLocalStorage() {
    // Only execute if strictly configured to store only on network
    if (!this.shouldStoreOnlyOnNetwork()) return;

    try {
      // Keep only authentication, network storage configuration, and session keys
      // The master operational database is solely maintained on the portable/network storage device!
      const duplicateKeys = [
        'telenest_inventory_v1',
        'telenest_movements_v1',
        'telenest_ftth_v1',
        'telenest_fttb_v1',
        'telenest_fttm_v1',
        'telenest_expenses_v1',
        'telenest_projects_v1',
        'telenest_dailyworks_v1',
        'telenest_audit_logs_v1',
      ];
      duplicateKeys.forEach((k) => localStorage.removeItem(k));
      localStorage.setItem('telenest_network_storage_exclusive_active', 'true');
    } catch (e) {
      console.warn('Error purging duplicate local storage:', e);
    }
  }

  /**
   * Periodic health-check to detect disconnection immediately
   */
  private startHeartbeatMonitor() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    this.heartbeatInterval = setInterval(async () => {
      if (!this.config.isActive || !this.directoryHandle) return;

      try {
        // Quick file access test
        await this.directoryHandle.getFileHandle(HEARTBEAT_LOCK_FILE, { create: false });
        if (this.config.status !== 'connected') {
          this.config.status = 'connected';
          this.config.lastErrorMessage = null;
          this.notifyListeners();
          if (this.pendingChanges) {
            this.saveNow();
          }
        }
      } catch (err: any) {
        // Disconnected (unplugged or network offline)
        if (this.config.status !== 'disconnected') {
          this.config.status = 'disconnected';
          this.config.lastErrorMessage = `Network or portable storage device disconnected. Path "${this.config.networkPathAlias || this.config.folderName}" is unreachable.`;
          this.notifyListeners();
        }
      }
    }, 8000);
  }

  public stopHeartbeatMonitor() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Disconnects network storage and restores internal browser storage mode
   */
  public async disconnect(userConfirmed = true): Promise<void> {
    if (!userConfirmed) return;

    this.stopHeartbeatMonitor();
    this.directoryHandle = null;
    await clearHandleFromDb();

    this.config = {
      ...this.config,
      isActive: false,
      status: 'idle',
      lastErrorMessage: null,
    };

    this.persistConfig();
    this.notifyListeners();
  }

  public updateConfig(partial: Partial<NetworkStorageConfig>) {
    this.config = { ...this.config, ...partial };
    this.persistConfig();
    this.notifyListeners();
  }
}

export const networkStorageService = new NetworkStorageService();

// Subscribe to storage changes so updates are automatically written directly to network storage
storage.onStorageChange((key: string) => {
  if (
    !key.startsWith('telenest_network_storage') &&
    !key.startsWith('telenest_last_autosave') &&
    !key.startsWith('telenest_autosave_logs')
  ) {
    networkStorageService.onStorageChanged();
  }
});
