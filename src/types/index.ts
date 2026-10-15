export type UserRole = 'Developer/CEO' | 'Admin' | 'Standard User';

export interface SecurityAnswers {
  q1_city: string;
  q2_school: string;
  q3_nickname: string;
  q4_vehicle: string;
}

export interface UserOperationsPermissions {
  // Warehouse & Inventory Stock Master
  canAccessInventory?: boolean;
  canViewInventory?: boolean;
  canEditInventory: boolean;
  canDeleteInventory: boolean;

  // Projects & Operations
  canAccessProjects?: boolean;
  canViewProjects?: boolean;
  canEditProjects: boolean;
  canDeleteProjects: boolean;

  // Daily Field Works Log
  canAccessDailyWorks?: boolean;
  canViewDailyWorks?: boolean;
  canEditDailyWorks: boolean;
  canDeleteDailyWorks?: boolean;

  // ICT Infrastructure (FTTH/FTTB/FTTM)
  canAccessICT?: boolean;
  canViewICT?: boolean;
  canEditICT: boolean;
  canDeleteICT: boolean;

  // Finance & Expense Ledger
  canAccessFinance?: boolean;
  canViewFinance?: boolean;
  canEditFinance: boolean;
  canDeleteFinance: boolean;

  // Reports, Letterhead & Analytics
  canAccessAnalytics?: boolean;
  canExportReports: boolean;
  canPrintLetterhead?: boolean;

  // Options & System Settings
  canAccessSettings?: boolean;
}

export const DEFAULT_OPERATIONS_PERMISSIONS: Record<UserRole, UserOperationsPermissions> = {
  'Developer/CEO': {
    canAccessInventory: true,
    canEditInventory: true,
    canDeleteInventory: true,
    canAccessProjects: true,
    canEditProjects: true,
    canDeleteProjects: true,
    canAccessDailyWorks: true,
    canEditDailyWorks: true,
    canDeleteDailyWorks: true,
    canAccessICT: true,
    canEditICT: true,
    canDeleteICT: true,
    canAccessFinance: true,
    canEditFinance: true,
    canDeleteFinance: true,
    canAccessAnalytics: true,
    canExportReports: true,
    canPrintLetterhead: true,
    canAccessSettings: true,
  },
  'Admin': {
    canAccessInventory: true,
    canEditInventory: true,
    canDeleteInventory: true,
    canAccessProjects: true,
    canEditProjects: true,
    canDeleteProjects: true,
    canAccessDailyWorks: true,
    canEditDailyWorks: true,
    canDeleteDailyWorks: true,
    canAccessICT: true,
    canEditICT: true,
    canDeleteICT: true,
    canAccessFinance: true,
    canEditFinance: true,
    canDeleteFinance: true,
    canAccessAnalytics: true,
    canExportReports: true,
    canPrintLetterhead: true,
    canAccessSettings: true,
  },
  'Standard User': {
    canAccessInventory: true,
    canEditInventory: false,
    canDeleteInventory: false,
    canAccessProjects: true,
    canEditProjects: false,
    canDeleteProjects: false,
    canAccessDailyWorks: true,
    canEditDailyWorks: true,
    canDeleteDailyWorks: false,
    canAccessICT: true,
    canEditICT: false,
    canDeleteICT: false,
    canAccessFinance: false,
    canEditFinance: false,
    canDeleteFinance: false,
    canAccessAnalytics: true,
    canExportReports: false,
    canPrintLetterhead: false,
    canAccessSettings: false,
  },
};

export interface User {
  id: string;
  username: string;
  fullName: string;
  email: string;
  phone?: string;
  googleId?: string;
  role: UserRole;
  customRole?: string; // Custom Role assigned by Developer/CEO
  department: string;
  avatar: string;
  passwordHash: string; // Stored securely
  pin?: string; // 4-6 digit numeric PIN code for rapid kiosk/desktop entry
  securityAnswers: SecurityAnswers;
  recoveryEmail: string;
  isLocked: boolean;
  isDefault?: boolean;
  canEditInventory: boolean;
  canEditFinance: boolean;
  canEditICT: boolean;
  canAccessSystemSettings: boolean;
  operationsPermissions?: UserOperationsPermissions;
  themePreference: string;
  createdAt: string;
  lastLogin?: string;
}

export type MovementType = 'IN' | 'OUT';

export type InventoryCategory =
  | 'Fiber Optics'
  | 'Splicing & Testing'
  | 'ODF & Cabinets'
  | 'Active Gear'
  | 'Patch Cords & Pigtails'
  | 'Splitters & Couplers'
  | 'Closure & FAT Boxes'
  | 'Civil, Ducts & Trays'
  | 'Power, UPS & Batteries'
  | 'Tools & Consumables'
  | 'Hardware, Clamps & Fasteners'
  | 'Wireless & Microwave'
  | 'Copper, LAN & Structured Cabling'
  | 'Safety Gear & PPE'
  | 'Miscellaneous & Spares'
  | string;

export interface InventoryItem {
  id: string;
  itemCode: string;
  name: string;
  category: InventoryCategory;
  unit: 'Meters' | 'Pcs' | 'Drums' | 'Rolls' | 'Boxes' | 'Kits' | string;
  currentStock: number;
  totalIn: number;
  totalOut: number;
  minThreshold: number;
  unitPrice: number;
  currency: string;
  location: string;
  supplier: string;
  description: string;
  lastUpdated: string;
  createdByUserId?: string;
  createdByUserName?: string;
  lastUpdatedByUserId?: string;
  lastUpdatedByUserName?: string;
}

export interface StockMovement {
  id: string;
  itemId: string;
  itemCode: string;
  itemName: string;
  type: MovementType;
  quantity: number;
  previousBalance: number;
  newBalance: number;
  referenceNo: string;
  projectOrRecipient: string;
  vendorOrSupplier: string;
  date: string;
  unitCost: number;
  currency: string;
  notes: string;
  createdByUserId: string;
  createdByUserName: string;
}

export type ICTType = 'FTTH' | 'FTTB' | 'FTTM';

export interface AttachmentMetadata {
  id: string;
  name: string;
  fileType: 'pdf' | 'xlsx' | 'image' | 'cad_dwg' | 'txt' | 'other';
  sizeFormatted: string;
  uploadDate: string;
  uploadedBy: string;
  dataUrl?: string;
  previewUrl?: string;
  notes?: string;
}

export interface FTTHRecord {
  id: string;
  clusterId: string;
  zone: string;
  clientOperator: string;
  homesPassed: number;
  fatsInstalled: number;
  splitterRatio: '1:8' | '1:16' | '1:32' | '1:64';
  dropCableMeters: number;
  opticalPowerDbm: number; // e.g., -18.5 dBm
  testingStatus: 'Passed' | 'Pending' | 'Attenuation Fault';
  implementationDate: string;
  supervisor: string;
  costEstimate: number;
  currency: string;
  attachments: AttachmentMetadata[];
  notes: string;
  isWorkDone?: boolean; // Work Done tick-mark indicator
  createdByUserId?: string;
  createdByUserName?: string;
  lastUpdatedByUserId?: string;
  lastUpdatedByUserName?: string;
}

export interface FTTBRecord {
  id: string;
  buildingName: string;
  buildingId: string;
  risersCount: number;
  floorsCount: number;
  mduBoxType: string;
  distributionFibers: number;
  opticalPowerDbm: number;
  activeCustomerPorts: number;
  status: 'Surveyed' | 'Cable Pulled' | 'Spliced' | 'Commissioned';
  handoverDate: string;
  supervisor: string;
  costEstimate: number;
  currency: string;
  attachments: AttachmentMetadata[];
  notes: string;
  isWorkDone?: boolean; // Work Done tick-mark indicator
  createdByUserId?: string;
  createdByUserName?: string;
  lastUpdatedByUserId?: string;
  lastUpdatedByUserName?: string;
}

export interface FTTMRecord {
  siteId: string;
  towerName: string;
  metroSector: string;
  backhaulBandwidth: string; // e.g. "10 Gbps Metro Ring"
  btsNodeId: string;
  sfpTransceivers: string; // e.g. "10G BiDi SFP+ 40km"
  otdrDistanceKm: number; // Optical Time Domain Reflectometer distance
  attenuationDb: number; // Total link loss dB
  status: 'Feasibility' | 'Civil Works' | 'Fiber Blown' | 'Spliced & Tested' | 'Live on Air';
  activationDate: string;
  leadEngineer: string;
  costEstimate: number;
  currency: string;
  attachments: AttachmentMetadata[];
  notes: string;
  isWorkDone?: boolean; // Work Done tick-mark indicator
  createdByUserId?: string;
  createdByUserName?: string;
  lastUpdatedByUserId?: string;
  lastUpdatedByUserName?: string;
  id: string;
}

export type ExpenseType = 'Maintenance' | 'Ongoing' | 'MAINTENANCE' | 'ONGOING';

export interface ExpenseRecord {
  id: string;
  title: string;
  type: ExpenseType;
  category: string;
  amount: number;
  currency: string;
  date: string;
  linkedProjectId?: string;
  linkedProjectName?: string;
  linkedItemId?: string;
  vendor?: string;
  invoiceRef?: string;
  paymentMethod?: string;
  approvedBy?: string;
  notes?: string;
  createdAt?: string;

  // Rich multi-currency & billing attributes
  originalAmount?: number;
  originalCurrency?: string;
  convertedHomeAmount?: number;
  paidTo?: string;
  chargedTo?: string;
  paymentStatus?: 'Paid' | 'Pending' | 'Overdue';
  billingCycle?: 'Monthly' | 'Quarterly' | 'Annual' | 'One-Time';
  dueDate?: string;
  receiptAttachment?: string;
  description?: string;
  createdByUserId?: string;
  createdByUserName?: string;
  lastUpdatedByUserId?: string;
  lastUpdatedByUserName?: string;
}

export interface ProjectRecord {
  id: string;
  code: string;
  title: string;
  client: string;
  category: ICTType | 'Warehouse Infrastructure' | 'Core Transport';
  status: 'Planned' | 'In Progress' | 'Testing' | 'Completed' | 'On Hold';
  startDate: string;
  targetEndDate: string;
  completionDate?: string;
  assignedTeam: string;
  projectManager: string;
  progressPercent: number;
  budget: number;
  currency: string;
  finalReportSummary?: string;
  notes: string;
  tags: string[];
  createdByUserId?: string;
  createdByUserName?: string;
  lastUpdatedByUserId?: string;
  lastUpdatedByUserName?: string;
}

export interface DailyWorkPhoto {
  id: string;
  name?: string;
  url: string;
  caption?: string;
  uploadedAt: string;
  fileSize?: string;
}

export interface DailyWork {
  id: string;
  date: string;
  completionDateTime?: string;
  siteId?: string;
  siteName?: string;
  projectCode: string;
  projectName: string;
  workType: 'FTTH' | 'FTTB' | 'FTTM' | 'Warehouse Logistics' | 'Emergency Splicing' | 'Civil Ducting' | 'FAT Installation';
  teamLead: string;
  techniciansCount: number;
  tasksCompleted: string;
  metersInstalled: number;
  issuesEncountered: string;
  status: 'Draft' | 'Submitted' | 'Verified' | 'Flagged' | 'Completed';
  weatherCondition: string;
  safetyIncidentReported: boolean;
  photos?: DailyWorkPhoto[];
  notes: string;
  rowNumber?: number;
  isRowChecked?: boolean;
  createdByUserId?: string;
  createdByUserName?: string;
  lastUpdatedByUserId?: string;
  lastUpdatedByUserName?: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'BACKUP_EXPORT' | 'BACKUP_IMPORT' | 'PASSWORD_CHANGE' | 'SETTINGS_CHANGE';
  module: 'Inventory' | 'ICT_Work' | 'Finance' | 'Projects' | 'DailyWorks' | 'Users' | 'System';
  targetId: string;
  description: string;
  details?: Record<string, any>;
}

export interface ExchangeRates {
  baseCurrency: string; // e.g. "USD"
  rates: Record<string, number>; // e.g. { "USD": 1, "EUR": 0.92, "GBP": 0.78, "SAR": 3.75, "PKR": 279.5, "AED": 3.67, "INR": 86.2, "QAR": 3.64, "CAD": 1.38, "AUD": 1.54 }
  lastUpdated: string;
}

// Aliases for unified module compatibility
export type ActivityLog = AuditLogEntry;
export type Expense = ExpenseRecord;
export type Project = ProjectRecord;

export interface SummaryKPI {
  label: string;
  value: string;
  subtext?: string;
}

export interface CompanyLetterheadConfig {
  softwareName?: string;
  companyName: string;
  tagline: string;
  developedBy: string;
  logoUrl: string;
  addressLine1: string;
  addressLine2: string;
  phone: string;
  email: string;
  website?: string;
  licenseNumber: string;
  taxRegistration: string;
  homeCurrency: string;
}

export type ThemeId = 'theme-obsidian' | 'theme-blue' | 'theme-green' | 'theme-monochrome' | 'theme-orange' | 'theme-custom';

export interface CustomThemePalette {
  name: string;
  isDark: boolean;
  bgMain: string;
  bgSurface: string;
  bgCard: string;
  bgInput: string;
  bgHover: string;
  textMain: string;
  textMuted: string;
  textDim: string;
  borderMain: string;
  borderLight: string;
  accent: string;
  accentHover: string;
  accentGlow: string;
}

export interface ThemeOption {
  id: ThemeId;
  name: string;
  description: string;
  isDark: boolean;
  accentColor: string;
  previewBg: string;
  previewCard: string;
  previewText: string;
}

export interface CloudUserProfile {
  cloudId: string;
  email: string;
  name: string;
  avatarUrl?: string;
  provider: 'google' | 'cloud_id';
  authenticatedAt: string;
  lastSyncAt: string | null;
  accountRole?: string;
}

export interface SyncConflictItem {
  id: string;
  entityType: string;
  entityId: string;
  itemName?: string;
  localTime: string;
  remoteTime: string;
  resolution: 'LOCAL_PRESERVED' | 'REMOTE_APPLIED' | 'MERGED';
  details: string;
}

export interface CloudSyncState {
  isOnline: boolean;
  isAuthenticated: boolean;
  user: CloudUserProfile | null;
  pendingChangesCount: number;
  lastSyncTime: string | null;
  status: 'idle' | 'syncing' | 'synced' | 'error' | 'offline';
  errorMessage?: string;
  autoSync: boolean;
  conflicts: SyncConflictItem[];
}

// User Activity & Historical Data Tracking Interfaces
export interface UserActivityDossier {
  user: User;
  generatedAt: string;
  stats: {
    totalActivities: number;
    dailyWorksCount: number;
    stockMovementsCount: number;
    inventoryItemsAuthoredCount: number;
    projectsManagedCount: number;
    expensesLoggedCount: number;
    ftthCount: number;
    fttbCount: number;
    fttmCount: number;
    lastActiveTimestamp?: string;
  };
  activityLogs: AuditLogEntry[];
  dailyWorks: DailyWork[];
  stockMovements: StockMovement[];
  inventoryItems: InventoryItem[];
  projects: ProjectRecord[];
  expenses: ExpenseRecord[];
  fiberDeployments: {
    ftth: FTTHRecord[];
    fttb: FTTBRecord[];
    fttm: FTTMRecord[];
  };
}

export interface ArchivedUserBackup {
  id: string; // Unique archive ID e.g. "usr_archive_..."
  archivedAt: string;
  archivedByUserId: string;
  archivedByUserName: string;
  user: User; // Snapshot of the removed user profile
  recordsRetainedInLiveDb: boolean; // Whether live records were retained or permanently deleted from active database
  dossier: UserActivityDossier;
  rawJsonSnapshot: string;
  archiveSizeBytes: number;
}

export interface NetworkStorageConfig {
  enabled: boolean;
  syncMode: 'auto' | 'manual' | 'scheduled';
  directoryPath: string; // e.g. "D:\TeleNest_Sync_Depot" or "\\192.168.1.100\Shared_Storage\TeleNest"
  deviceLabel: string; // e.g. "SanDisk 1TB Portable SSD" or "Regional NAS Drive"
  lastSyncedAt: string | null;
  autoSyncIntervalMinutes: number; // e.g. 15, 30, 60
  includeAuditLogs: boolean;
  includeDailyWorkPhotos: boolean;
  includeArchivedUsers: boolean;
  // External Directory Sync extensions
  externalDirectoryPath?: string;
  storageLabel?: string;
  autoSyncFrequency?: 'manual' | 'on_change' | 'hourly' | 'daily';
  lastSyncTimestamp?: string;
  lastSyncStatus?: 'success' | 'failed' | 'idle';
  includeAttachments?: boolean;
}
