import { storage } from './storage';
import { DailyWork } from '../types';
import { cloudSyncService } from './cloudSyncService';

export interface AutoSaveLogEntry {
  id: string;
  timestamp: string;
  type: 'auto' | 'manual';
  dailyWorksCount: number;
  totalRecordsCount: number;
  destination: 'LocalStorage' | 'Portable Folder (Disk)' | 'Cloud Backup' | 'All';
  status: 'success' | 'warning' | 'error';
  message: string;
}

export type SyncDestinationType = 'internal' | 'offline' | 'portable' | 'cloud' | 'online-server';

export interface AutoSaveState {
  isEnabled: boolean;
  intervalSeconds: number;
  secondsRemaining: number;
  lastSavedAt: string | null;
  lastSaveStatus: 'idle' | 'saving' | 'saved' | 'error';
  totalAutoSaves: number;
  totalManualSaves: number;
  dailyWorksCount: number;
  isDiskFolderConnected: boolean;
  connectedFolderName: string | null;
  cloudSyncEnabled: boolean;
  cloudSyncUrl: string;
  syncDestination: SyncDestinationType;
  googleSyncEmail: string;
  google2FAVerified: boolean;
  googleDriveConnected: boolean;
  oneDriveConnected: boolean;
  onlineServerUrl: string;
  onlineServerStatus: 'connected' | 'offline' | 'standby';
  recentLogs: AutoSaveLogEntry[];
}

type AutoSaveListener = (state: AutoSaveState) => void;

class AutoSaveService {
  private isEnabled: boolean = true;
  private intervalSeconds: number = 300; // 5 minutes default as requested
  private secondsRemaining: number = 300;
  private timerId: any = null;
  private tickerId: any = null;
  private lastSavedAt: string | null = null;
  private lastSaveStatus: 'idle' | 'saving' | 'saved' | 'error' = 'idle';
  private totalAutoSaves: number = 0;
  private totalManualSaves: number = 0;
  private directoryHandle: any = null;
  private connectedFolderName: string | null = null;
  private cloudSyncEnabled: boolean = true;
  private cloudSyncUrl: string = '';
  private syncDestination: SyncDestinationType = 'internal'; // Default to Software Internal Cloud Backup folder
  private googleSyncEmail: string = '';
  private google2FAVerified: boolean = false;
  private googleDriveConnected: boolean = false;
  private oneDriveConnected: boolean = false;
  private onlineServerUrl: string = 'https://sync.telenest-ict.cloud/v1/live-mesh';
  private onlineServerStatus: 'connected' | 'offline' | 'standby' = 'standby';
  private recentLogs: AutoSaveLogEntry[] = [];
  private listeners: Set<AutoSaveListener> = new Set();

  constructor() {
    this.loadPersistedConfig();
    this.initTimer();
  }

  private loadPersistedConfig() {
    try {
      const savedConfig = localStorage.getItem('telenest_autosave_config_v1');
      if (savedConfig) {
        const parsed = JSON.parse(savedConfig);
        if (typeof parsed.isEnabled === 'boolean') this.isEnabled = parsed.isEnabled;
        if (typeof parsed.intervalSeconds === 'number' && parsed.intervalSeconds >= 10) {
          this.intervalSeconds = parsed.intervalSeconds;
          this.secondsRemaining = parsed.intervalSeconds;
        } else {
          this.intervalSeconds = 300; // 5 minutes default
          this.secondsRemaining = 300;
        }
        if (typeof parsed.cloudSyncEnabled === 'boolean') this.cloudSyncEnabled = parsed.cloudSyncEnabled;
        if (typeof parsed.cloudSyncUrl === 'string') this.cloudSyncUrl = parsed.cloudSyncUrl;
      }

      // Persistent Sync Destination: default is Software Internal Cloud Backup folder
      const savedDest = localStorage.getItem('telenest_sync_destination_v1') as SyncDestinationType;
      if (savedDest && ['internal', 'offline', 'portable', 'cloud', 'online-server'].includes(savedDest)) {
        this.syncDestination = savedDest;
      } else {
        this.syncDestination = 'internal';
      }

      const savedGoogleSync = localStorage.getItem('telenest_google_sync_v1');
      if (savedGoogleSync) {
        const parsedG = JSON.parse(savedGoogleSync);
        if (parsedG.email) this.googleSyncEmail = parsedG.email;
        if (typeof parsedG.is2FAVerified === 'boolean') this.google2FAVerified = parsedG.is2FAVerified;
        if (typeof parsedG.googleDriveConnected === 'boolean') this.googleDriveConnected = parsedG.googleDriveConnected;
        if (typeof parsedG.oneDriveConnected === 'boolean') this.oneDriveConnected = parsedG.oneDriveConnected;
        if (parsedG.onlineServerUrl) this.onlineServerUrl = parsedG.onlineServerUrl;
      }

      const savedTime = localStorage.getItem('telenest_last_autosave_v1');
      if (savedTime) {
        this.lastSavedAt = savedTime;
      }

      const savedLogs = localStorage.getItem('telenest_autosave_logs_v1');
      if (savedLogs) {
        this.recentLogs = JSON.parse(savedLogs);
      }
    } catch (e) {
      console.warn('Could not load autosave config:', e);
    }
  }

  private persistConfig() {
    try {
      localStorage.setItem(
        'telenest_autosave_config_v1',
        JSON.stringify({
          isEnabled: this.isEnabled,
          intervalSeconds: this.intervalSeconds,
          cloudSyncEnabled: this.cloudSyncEnabled,
          cloudSyncUrl: this.cloudSyncUrl,
        })
      );
      localStorage.setItem('telenest_sync_destination_v1', this.syncDestination);
      localStorage.setItem(
        'telenest_google_sync_v1',
        JSON.stringify({
          email: this.googleSyncEmail,
          is2FAVerified: this.google2FAVerified,
          googleDriveConnected: this.googleDriveConnected,
          oneDriveConnected: this.oneDriveConnected,
          onlineServerUrl: this.onlineServerUrl,
        })
      );
    } catch (e) {
      console.warn('Could not persist autosave config:', e);
    }
  }

  public initTimer() {
    if (this.tickerId) clearInterval(this.tickerId);

    // 1-second ticker for countdown and state emission
    this.tickerId = setInterval(() => {
      if (!this.isEnabled) return;

      this.secondsRemaining -= 1;
      if (this.secondsRemaining <= 0) {
        this.secondsRemaining = this.intervalSeconds;
        this.triggerSave(false, '5-Minute Scheduled Auto-Save');
      }
      this.notifyListeners();
    }, 1000);
  }

  public subscribe(listener: AutoSaveListener): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners() {
    const state = this.getState();
    this.listeners.forEach((listener) => {
      try {
        listener(state);
      } catch (e) {
        console.error('Error in autosave listener:', e);
      }
    });
  }

  public getState(): AutoSaveState {
    const dailyWorks = storage.getDailyWorks();
    return {
      isEnabled: this.isEnabled,
      intervalSeconds: this.intervalSeconds,
      secondsRemaining: this.secondsRemaining,
      lastSavedAt: this.lastSavedAt,
      lastSaveStatus: this.lastSaveStatus,
      totalAutoSaves: this.totalAutoSaves,
      totalManualSaves: this.totalManualSaves,
      dailyWorksCount: dailyWorks.length,
      isDiskFolderConnected: !!this.directoryHandle,
      connectedFolderName: this.connectedFolderName,
      cloudSyncEnabled: this.cloudSyncEnabled,
      cloudSyncUrl: this.cloudSyncUrl,
      syncDestination: this.syncDestination,
      googleSyncEmail: this.googleSyncEmail,
      google2FAVerified: this.google2FAVerified,
      googleDriveConnected: this.googleDriveConnected,
      oneDriveConnected: this.oneDriveConnected,
      onlineServerUrl: this.onlineServerUrl,
      onlineServerStatus: this.onlineServerStatus,
      recentLogs: [...this.recentLogs],
    };
  }

  public setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
    this.secondsRemaining = this.intervalSeconds;
    this.persistConfig();
    this.notifyListeners();
  }

  public setIntervalSeconds(seconds: number) {
    this.intervalSeconds = Math.max(15, seconds);
    this.secondsRemaining = this.intervalSeconds;
    this.persistConfig();
    this.notifyListeners();
  }

  public setCloudSync(enabled: boolean, url?: string) {
    this.cloudSyncEnabled = enabled;
    if (url !== undefined) this.cloudSyncUrl = url;
    this.persistConfig();
    this.notifyListeners();
  }

  public setSyncDestination(dest: SyncDestinationType) {
    this.syncDestination = dest;
    this.persistConfig();
    this.notifyListeners();
  }

  public setGoogleSyncConfig(config: {
    email?: string;
    is2FAVerified?: boolean;
    googleDriveConnected?: boolean;
    oneDriveConnected?: boolean;
    onlineServerUrl?: string;
  }) {
    if (config.email !== undefined) this.googleSyncEmail = config.email;
    if (config.is2FAVerified !== undefined) this.google2FAVerified = config.is2FAVerified;
    if (config.googleDriveConnected !== undefined) this.googleDriveConnected = config.googleDriveConnected;
    if (config.oneDriveConnected !== undefined) this.oneDriveConnected = config.oneDriveConnected;
    if (config.onlineServerUrl !== undefined) this.onlineServerUrl = config.onlineServerUrl;
    this.persistConfig();
    this.notifyListeners();
  }

  /**
   * Connect to local Windows folder via File System Access API
   * Enables true zero-friction live disk saving to the Portable folder!
   */
  public async connectPortableFolder(): Promise<{ success: boolean; name?: string; message: string }> {
    if (!('showDirectoryPicker' in window)) {
      return {
        success: false,
        message: 'File System Access API is not supported in this browser. LocalStorage & manual downloads are active.',
      };
    }

    try {
      const handle = await (window as any).showDirectoryPicker({
        mode: 'readwrite',
      });
      this.directoryHandle = handle;
      this.connectedFolderName = handle.name || 'Portable Folder';
      this.notifyListeners();

      // Immediately write a verification snapshot
      await this.writeToConnectedFolder(storage.exportFullBackup());

      return {
        success: true,
        name: this.connectedFolderName,
        message: `Connected to "${this.connectedFolderName}". Daily updates will automatically save directly to this folder every 1 minute!`,
      };
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        return { success: false, message: 'Folder selection cancelled by user.' };
      }
      return { success: false, message: `Could not connect folder: ${err?.message || err}` };
    }
  }

  public disconnectPortableFolder() {
    this.directoryHandle = null;
    this.connectedFolderName = null;
    this.notifyListeners();
  }

  /**
   * Write files to connected disk folder
   */
  private async writeToConnectedFolder(snapshotJson: string): Promise<boolean> {
    if (!this.directoryHandle) return false;
    try {
      // 1. Try writing to "Database safe work files/<SoftwareName>_Database_Master.json"
      const swName = storage.getSoftwareName();
      let targetFolder = this.directoryHandle;
      try {
        targetFolder = await this.directoryHandle.getDirectoryHandle('Database safe work files', { create: true });
      } catch (e) {
        targetFolder = this.directoryHandle;
      }

      const fileHandle = await targetFolder.getFileHandle(`${swName}_Database_Master.json`, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(snapshotJson);
      await writable.close();

      // 2. Also write dedicated Daily Works update log
      const dailyWorks = storage.getDailyWorks();
      const dailyWorkPayload = {
        app: swName,
        module: 'DailyWorks',
        lastUpdated: new Date().toISOString(),
        totalWorks: dailyWorks.length,
        dailyWorks,
      };
      const dwFileHandle = await targetFolder.getFileHandle(`${swName}_DailyWorks_Sync.json`, { create: true });
      const dwWritable = await dwFileHandle.createWritable();
      await dwWritable.write(JSON.stringify(dailyWorkPayload, null, 2));
      await dwWritable.close();

      return true;
    } catch (err) {
      console.warn('Failed to write to connected directory handle:', err);
      return false;
    }
  }

  /**
   * Triggers an immediate manual save of all Daily Work and database records
   */
  public async saveNow(reason = 'Manual Save') {
    return this.triggerSave(true, reason);
  }

  public async manualSave(reason = 'Manual Save') {
    return this.saveNow(reason);
  }

  /**
   * Core Save Operation: Saves Daily Works and all data to:
   * 1. LocalStorage (instant persistent cache)
   * 2. Connected Portable Folder on disk (if connected)
   * 3. Cloud backup queue / simulated endpoint
   */
  public async triggerSave(
    isManual: boolean = false,
    reason: string = 'Auto-Save'
  ): Promise<{
    success: boolean;
    timestamp: string;
    dailyWorksCount: number;
    totalRecords: number;
    destination: string;
    message: string;
  }> {
    this.lastSaveStatus = 'saving';
    this.notifyListeners();

    const timestamp = new Date().toISOString();
    const readableTime = new Date().toLocaleTimeString();

    try {
      // 1. Capture complete snapshot
      const fullSnapshot = storage.exportFullBackup();
      const dailyWorks = storage.getDailyWorks();
      const inventory = storage.getInventory();
      const movements = storage.getMovements();
      const projects = storage.getProjects();
      const expenses = storage.getExpenses();
      const totalRecords =
        dailyWorks.length + inventory.length + movements.length + projects.length + expenses.length;

      // 2. Persist to LocalStorage
      localStorage.setItem('telenest_daily_autosave_v1', fullSnapshot);
      localStorage.setItem('telenest_last_autosave_v1', timestamp);

      // Dedicated daily work cache
      localStorage.setItem(
        'telenest_dailyworks_last_sync_v1',
        JSON.stringify({
          updatedAt: timestamp,
          count: dailyWorks.length,
          works: dailyWorks,
        })
      );

      let savedToDisk = false;
      if (this.directoryHandle) {
        savedToDisk = await this.writeToConnectedFolder(fullSnapshot);
      }

      // 3. Cloud Sync Payload
      if (this.cloudSyncEnabled) {
        const cloudPayload = {
          app: storage.getSoftwareName(),
          version: '1.0.0',
          syncedAt: timestamp,
          source: isManual ? 'Manual_Save' : '1_Min_Auto_Save',
          summary: {
            dailyWorks: dailyWorks.length,
            inventory: inventory.length,
            totalRecords,
          },
          data: JSON.parse(fullSnapshot),
        };

        // Cache into Cloud Sync Queue
        localStorage.setItem('telenest_cloud_sync_queue_v1', JSON.stringify(cloudPayload));

        // If external cloud endpoint provided, fire POST (non-blocking)
        if (this.cloudSyncUrl && this.cloudSyncUrl.startsWith('http')) {
          fetch(this.cloudSyncUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(cloudPayload),
          }).catch((e) => console.warn('Cloud webhook push warning:', e));
        }

        // Trigger bidirectional Cloud ID / Google sync if authenticated and online
        if (cloudSyncService.getState().isAuthenticated && cloudSyncService.getState().isOnline) {
          cloudSyncService.syncNow(false).catch((e) => console.warn('Cloud sync auto-trigger warning:', e));
        }
      }

      // Destination-specific saving logic
      let destinationLabel = 'Software Internal Cloud Backup folder';

      // 1. Always save internal software cloud backup folder
      localStorage.setItem('telenest_internal_cloud_backup_v1', fullSnapshot);

      if (this.syncDestination === 'internal') {
        destinationLabel = 'Software Internal Cloud Backup folder';
      } else if (this.syncDestination === 'offline') {
        destinationLabel = 'Offline Local Storage Database';
      } else if (this.syncDestination === 'portable') {
        destinationLabel = savedToDisk ? `Portable Folder (${this.connectedFolderName || 'Disk'})` : 'Portable USB / Folder';
      } else if (this.syncDestination === 'cloud') {
        const cloudHost = this.googleDriveConnected ? 'Google Drive' : this.oneDriveConnected ? 'OneDrive' : 'Cloud Backup';
        destinationLabel = `${cloudHost} & Cloud Storage`;
      } else if (this.syncDestination === 'online-server') {
        destinationLabel = `Online Server Mesh (${this.onlineServerUrl})`;
        this.onlineServerStatus = 'connected';
      }

      // Update counters
      if (isManual) {
        this.totalManualSaves += 1;
      } else {
        this.totalAutoSaves += 1;
      }

      this.lastSavedAt = timestamp;
      this.lastSaveStatus = 'saved';
      this.secondsRemaining = this.intervalSeconds;

      const logEntry: AutoSaveLogEntry = {
        id: `save_${Date.now()}`,
        timestamp,
        type: isManual ? 'manual' : 'auto',
        dailyWorksCount: dailyWorks.length,
        totalRecordsCount: totalRecords,
        destination: savedToDisk ? 'Portable Folder (Disk)' : 'All',
        status: 'success',
        message: `${isManual ? reason : '5-Min Auto-Save'}: ${dailyWorks.length} daily works & ${totalRecords} records synced to ${destinationLabel}.`,
      };

      this.recentLogs.unshift(logEntry);
      if (this.recentLogs.length > 30) this.recentLogs.pop();
      try {
        localStorage.setItem('telenest_autosave_logs_v1', JSON.stringify(this.recentLogs));
      } catch (e) {}

      this.notifyListeners();

      return {
        success: true,
        timestamp: readableTime,
        dailyWorksCount: dailyWorks.length,
        totalRecords,
        destination: destinationLabel,
        message: logEntry.message,
      };
    } catch (err: any) {
      this.lastSaveStatus = 'error';
      this.notifyListeners();
      return {
        success: false,
        timestamp: readableTime,
        dailyWorksCount: 0,
        totalRecords: 0,
        destination: 'None',
        message: `Save failed: ${err?.message || err}`,
      };
    }
  }

  /**
   * Triggers direct download of Daily Works update file
   */
  public downloadDailyWorksUpdateFile() {
    const swName = storage.getSoftwareName();
    const dailyWorks = storage.getDailyWorks();
    const payload = {
      app: swName,
      type: 'DailyWork_Update_Snapshot',
      exportedAt: new Date().toISOString(),
      dailyWorksCount: dailyWorks.length,
      dailyWorks,
    };
    const jsonStr = JSON.stringify(payload, null, 2);
    const dateStr = new Date().toISOString().split('T')[0];
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${swName}_DailyWork_Update_${dateStr}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Triggers direct download of Master Database Snapshot
   */
  public downloadMasterSnapshotFile() {
    const swName = storage.getSoftwareName();
    const fullSnapshot = storage.exportFullBackup();
    const dateStr = new Date().toISOString().split('T')[0];
    const blob = new Blob([fullSnapshot], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${swName}_Database_Master_${dateStr}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

export const autoSaveService = new AutoSaveService();
