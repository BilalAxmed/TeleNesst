import {
  User,
  UserRole,
  InventoryItem,
  StockMovement,
  FTTHRecord,
  FTTBRecord,
  FTTMRecord,
  ExpenseRecord,
  ProjectRecord,
  DailyWork,
  AuditLogEntry,
  ExchangeRates,
  CompanyLetterheadConfig,
  DEFAULT_OPERATIONS_PERMISSIONS,
  UserActivityDossier,
  ArchivedUserBackup,
  NetworkStorageConfig,
} from '../types';
import { DEFAULT_EXCHANGE_RATES } from './currency';

const STORAGE_KEYS = {
  USERS: 'telenest_users_v1',
  CURRENT_USER: 'telenest_current_user_v1',
  INVENTORY: 'telenest_inventory_v1',
  MOVEMENTS: 'telenest_movements_v1',
  FTTH: 'telenest_ftth_v1',
  FTTB: 'telenest_fttb_v1',
  FTTM: 'telenest_fttm_v1',
  EXPENSES: 'telenest_expenses_v1',
  PROJECTS: 'telenest_projects_v1',
  DAILY_WORKS: 'telenest_dailyworks_v1',
  AUDIT_LOGS: 'telenest_audit_logs_v1',
  EXCHANGE_RATES: 'telenest_exchange_rates_v1',
  COMPANY_CONFIG: 'telenest_company_config_v1',
  GLOBAL_THEME: 'telenest_global_theme_v1',
  CUSTOM_CATEGORIES: 'telenest_custom_categories_v1',
  ARCHIVED_USERS: 'telenest_archived_user_backups_v1',
};

export const DEFAULT_INVENTORY_CATEGORIES: string[] = [
  'Fiber Optics',
  'Splicing & Testing',
  'ODF & Cabinets',
  'Active Gear',
  'Patch Cords & Pigtails',
  'Splitters & Couplers',
  'Closure & FAT Boxes',
  'Civil, Ducts & Trays',
  'Power, UPS & Batteries',
  'Tools & Consumables',
  'Hardware, Clamps & Fasteners',
  'Wireless & Microwave',
  'Copper, LAN & Structured Cabling',
  'Safety Gear & PPE',
  'Miscellaneous & Spares',
];

export const INITIAL_COMPANY_CONFIG: CompanyLetterheadConfig = {
  companyName: 'TeleNest ICT Logistics & Telecom Engineering',
  tagline: 'Precision Fiber Deployment & High-Density Warehouse Operations',
  developedBy: 'Bilal Ahmed',
  logoUrl: '',
  addressLine1: 'Building 4B, ICT Industrial Technology Park, Sector I-9/3',
  addressLine2: 'Islamabad / Dubai / Riyadh Regional Hubs',
  phone: '+92 300 8472910 / +971 4 289 1100',
  email: 'bilalaxmed.47@gmail.com',
  licenseNumber: 'ICT-TELCO-2024-8849-B',
  taxRegistration: 'TRN-98421039-ICT',
  homeCurrency: 'USD',
};

// Seed Users
const SEED_USERS: User[] = [
  {
    id: 'usr_ceo_001',
    username: 'bilal',
    fullName: 'Bilal Ahmed',
    email: 'bilalaxmed.47@gmail.com',
    role: 'Developer/CEO',
    department: 'Executive Engineering & Architecture',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    passwordHash: 'admin123', // In demo app stored directly
    pin: '4790',
    securityAnswers: {
      q1_city: 'Lahore',
      q2_school: 'St. Marys',
      q3_nickname: 'Billo',
      q4_vehicle: 'Toyota Corolla',
    },
    recoveryEmail: 'bilalaxmed.47@gmail.com',
    isLocked: false,
    isDefault: true,
    canEditInventory: true,
    canEditFinance: true,
    canEditICT: true,
    canAccessSystemSettings: true,
    themePreference: 'theme-blue',
    createdAt: '2024-01-10T08:00:00.000Z',
    lastLogin: new Date().toISOString(),
  },
  {
    id: 'usr_admin_002',
    username: 'admin_usman',
    fullName: 'Usman Ghani',
    email: 'usman.ghani@telenest.io',
    role: 'Admin',
    department: 'Warehouse Operations & Field Logistics',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    passwordHash: 'admin',
    pin: '1122',
    securityAnswers: {
      q1_city: 'Islamabad',
      q2_school: 'Beaconhouse',
      q3_nickname: 'Mani',
      q4_vehicle: 'Honda Civic',
    },
    recoveryEmail: 'usman.ghani@telenest.io',
    isLocked: false,
    canEditInventory: true,
    canEditFinance: true,
    canEditICT: true,
    canAccessSystemSettings: true,
    themePreference: 'theme-blue',
    createdAt: '2024-02-15T09:30:00.000Z',
    lastLogin: '2024-09-08T07:15:00.000Z',
  },
  {
    id: 'usr_tech_003',
    username: 'hamza_tech',
    fullName: 'Hamza Tariq',
    email: 'hamza.tariq@telenest.io',
    role: 'Standard User',
    department: 'Optical Network Field Splicing',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    passwordHash: 'user123',
    pin: '3344',
    securityAnswers: {
      q1_city: 'Rawalpindi',
      q2_school: 'City School',
      q3_nickname: 'Hamzi',
      q4_vehicle: 'Suzuki Swift',
    },
    recoveryEmail: 'hamza.tariq@telenest.io',
    isLocked: false,
    canEditInventory: true,
    canEditFinance: false,
    canEditICT: true,
    canAccessSystemSettings: false,
    themePreference: 'theme-blue',
    createdAt: '2024-03-01T10:00:00.000Z',
    lastLogin: '2024-09-07T14:40:00.000Z',
  },
];

// Seed Inventory Items
const SEED_INVENTORY: InventoryItem[] = [
  {
    id: 'inv_001',
    itemCode: 'FIB-48C-G652D',
    name: '48-Core Single-Mode Armored Optical Cable',
    category: 'Fiber Optics',
    unit: 'Meters',
    currentStock: 14500,
    totalIn: 22000,
    totalOut: 7500,
    minThreshold: 3000,
    unitPrice: 1.45,
    currency: 'USD',
    location: 'Aisle 3, Rack A-12 (Warehouse North)',
    supplier: 'Corning Optical Communications',
    description: 'ITU-T G.652.D loose tube heavy outdoor direct burial armored cable',
    lastUpdated: '2024-09-05T12:00:00Z',
  },
  {
    id: 'inv_002',
    itemCode: 'FIB-96C-G657A2',
    name: '96-Core Microduct Blown Fiber Bundle',
    category: 'Fiber Optics',
    unit: 'Meters',
    currentStock: 8200,
    totalIn: 15000,
    totalOut: 6800,
    minThreshold: 2500,
    unitPrice: 2.10,
    currency: 'USD',
    location: 'Aisle 3, Drum Bay 4',
    supplier: 'Prysmian Group',
    description: 'Bend-insensitive micro-cable designed for air-blown microduct networks',
    lastUpdated: '2024-09-04T10:30:00Z',
  },
  {
    id: 'inv_003',
    itemCode: 'SPL-FUJ-90SP',
    name: 'Fujikura 90S+ Core-Alignment Fusion Splicer Kit',
    category: 'Splicing & Testing',
    unit: 'Kits',
    currentStock: 7,
    totalIn: 10,
    totalOut: 3,
    minThreshold: 2,
    unitPrice: 7850,
    currency: 'USD',
    location: 'Secure Tool Vault, Shelf B',
    supplier: 'Fujikura Ltd Japan',
    description: 'High precision core alignment optical fusion splicer with CT50 cleaver',
    lastUpdated: '2024-09-01T15:20:00Z',
  },
  {
    id: 'inv_004',
    itemCode: 'TST-EXFO-MAX730C',
    name: 'EXFO MaxTester 730C PON/Metro OTDR',
    category: 'Splicing & Testing',
    unit: 'Pcs',
    currentStock: 4,
    totalIn: 6,
    totalOut: 2,
    minThreshold: 2,
    unitPrice: 5400,
    currency: 'USD',
    location: 'Secure Tool Vault, Shelf C',
    supplier: 'EXFO Telecom Solutions',
    description: '1310/1550/1625 nm live fiber OTDR with iOLM automated analysis',
    lastUpdated: '2024-08-28T09:10:00Z',
  },
  {
    id: 'inv_005',
    itemCode: 'FAT-16P-IP68',
    name: '16-Port Outdoor Fiber Access Terminal (FAT) Box',
    category: 'ODF & Cabinets',
    unit: 'Pcs',
    currentStock: 240,
    totalIn: 500,
    totalOut: 260,
    minThreshold: 50,
    unitPrice: 38.5,
    currency: 'USD',
    location: 'Aisle 1, Bin 102',
    supplier: 'CommScope Inc.',
    description: 'IP68 waterproof pole/wall mount terminal with 1:16 cassette splitter slot',
    lastUpdated: '2024-09-06T11:45:00Z',
  },
  {
    id: 'inv_006',
    itemCode: 'CAS-SPL-1X16-APC',
    name: '1:16 PLC Cassette Optical Splitter SC/APC',
    category: 'Fiber Optics',
    unit: 'Pcs',
    currentStock: 185,
    totalIn: 400,
    totalOut: 215,
    minThreshold: 40,
    unitPrice: 14.8,
    currency: 'USD',
    location: 'Aisle 2, Bin 44',
    supplier: 'Huawei OptiX Access',
    description: 'Planar Lightwave Circuit cassette splitter insertion loss <= 13.8 dB',
    lastUpdated: '2024-09-02T14:15:00Z',
  },
  {
    id: 'inv_007',
    itemCode: 'SFP-10G-BIDI-40',
    name: '10G BiDi SFP+ Transceiver 1270/1330nm 40km LC',
    category: 'Active Gear',
    unit: 'Pcs',
    currentStock: 42,
    totalIn: 80,
    totalOut: 38,
    minThreshold: 15,
    unitPrice: 65.0,
    currency: 'USD',
    location: 'Electronics Cabinet 2',
    supplier: 'FS.COM Telecom',
    description: 'Single strand bidirectional optical SFP+ transceivers for metro tower backhaul',
    lastUpdated: '2024-09-07T16:00:00Z',
  },
  {
    id: 'inv_008',
    itemCode: 'ODF-144P-19IN',
    name: '144-Port Optical Distribution Frame (ODF) 3U',
    category: 'ODF & Cabinets',
    unit: 'Pcs',
    currentStock: 18,
    totalIn: 30,
    totalOut: 12,
    minThreshold: 5,
    unitPrice: 220.0,
    currency: 'USD',
    location: 'Aisle 4, Shelf 01',
    supplier: 'Hubbell Telecom',
    description: '19-inch rack-mount sliding tray ODF loaded with SC/APC duplex adapters',
    lastUpdated: '2024-08-30T10:00:00Z',
  },
];

// Seed Stock Movements
const SEED_MOVEMENTS: StockMovement[] = [
  {
    id: 'mov_001',
    itemId: 'inv_001',
    itemCode: 'FIB-48C-G652D',
    itemName: '48-Core Single-Mode Armored Optical Cable',
    type: 'IN',
    quantity: 10000,
    previousBalance: 12000,
    newBalance: 22000,
    referenceNo: 'PO-2024-8831',
    projectOrRecipient: 'Central Warehouse Stocking',
    vendorOrSupplier: 'Corning Optical Global',
    date: '2024-08-15',
    unitCost: 1.45,
    currency: 'USD',
    notes: 'Bulk container delivery arrived inspection cleared',
    createdByUserId: 'usr_ceo_001',
    createdByUserName: 'Bilal Ahmed',
  },
  {
    id: 'mov_002',
    itemId: 'inv_001',
    itemCode: 'FIB-48C-G652D',
    itemName: '48-Core Single-Mode Armored Optical Cable',
    type: 'OUT',
    quantity: 7500,
    previousBalance: 22000,
    newBalance: 14500,
    referenceNo: 'REQ-FTTH-G11-01',
    projectOrRecipient: 'Islamabad Sector G-11 FTTH Phase 2',
    vendorOrSupplier: 'Dispatched to Site Team A',
    date: '2024-08-28',
    unitCost: 1.45,
    currency: 'USD',
    notes: 'Issued 5 wooden drums of 1500m each',
    createdByUserId: 'usr_admin_002',
    createdByUserName: 'Usman Ghani',
  },
  {
    id: 'mov_003',
    itemId: 'inv_005',
    itemCode: 'FAT-16P-IP68',
    itemName: '16-Port Outdoor Fiber Access Terminal (FAT) Box',
    type: 'OUT',
    quantity: 80,
    previousBalance: 320,
    newBalance: 240,
    referenceNo: 'REQ-FTTH-FAT-99',
    projectOrRecipient: 'Bahria Springs Zone 3 Rollout',
    vendorOrSupplier: 'Dispatched to Splicing Crew 2',
    date: '2024-09-02',
    unitCost: 38.5,
    currency: 'USD',
    notes: 'FAT boxes with mounting hardware accessories',
    createdByUserId: 'usr_admin_002',
    createdByUserName: 'Usman Ghani',
  },
];

// Seed FTTH Records
// Seed FTTH Records - 5 Rows with precise work done tick marks
// Row 1: No tick (isWorkDone: false)
// Row 2: Tick mark (isWorkDone: true)
// Row 3: Tick mark (isWorkDone: true)
// Row 4: No tick (isWorkDone: false)
// Row 5: Tick mark (isWorkDone: true)
const SEED_FTTH: FTTHRecord[] = [
  {
    id: 'ftth_rec_01',
    clusterId: 'ISB-FTTH-G11-C4',
    zone: 'Sector G-11/3 North Block',
    clientOperator: 'PTCL / Nayatel Telecom',
    homesPassed: 512,
    fatsInstalled: 32,
    splitterRatio: '1:16',
    dropCableMeters: 6200,
    opticalPowerDbm: -18.6,
    testingStatus: 'Pending',
    implementationDate: '2024-08-25',
    supervisor: 'Hamza Tariq',
    costEstimate: 18500,
    currency: 'USD',
    isWorkDone: false, // 1: There is no tick-mark at Row No 1
    attachments: [
      {
        id: 'att_01',
        name: 'G11_Fiber_Route_AsBuilt.dwg',
        fileType: 'cad_dwg',
        sizeFormatted: '4.8 MB',
        uploadDate: '2024-08-26',
        uploadedBy: 'Hamza Tariq',
        notes: 'AutoCAD civil trenching and fiber route survey map',
      },
    ],
    notes: 'Awaiting civil trenching clearance for drop segment. No tick-mark.',
  },
  {
    id: 'ftth_rec_02',
    clusterId: 'BHR-FTTH-Z3-09',
    zone: 'Bahria Town Precinct 9',
    clientOperator: 'StormFiber Broadband',
    homesPassed: 280,
    fatsInstalled: 18,
    splitterRatio: '1:16',
    dropCableMeters: 3850,
    opticalPowerDbm: -19.4,
    testingStatus: 'Passed',
    implementationDate: '2024-09-02',
    supervisor: 'Usman Ghani',
    costEstimate: 11200,
    currency: 'USD',
    isWorkDone: true, // 2: There must be tick mark at Row No 2
    attachments: [
      {
        id: 'att_03',
        name: 'FAT_Splice_Matrix_P9.pdf',
        fileType: 'pdf',
        sizeFormatted: '1.2 MB',
        uploadDate: '2024-09-03',
        uploadedBy: 'Usman Ghani',
        notes: 'Final engineering approval signed off by client QA inspector',
      },
    ],
    notes: 'Work completed. All 18 FATs mounted and tested. Verified with tick mark.',
  },
  {
    id: 'ftth_rec_03',
    clusterId: 'DHA-FTTH-SEC2-14',
    zone: 'DHA Phase 2 Sector J',
    clientOperator: 'Transworld Home Fiber',
    homesPassed: 420,
    fatsInstalled: 26,
    splitterRatio: '1:16',
    dropCableMeters: 5100,
    opticalPowerDbm: -18.2,
    testingStatus: 'Passed',
    implementationDate: '2024-09-05',
    supervisor: 'Hamza Tariq',
    costEstimate: 15400,
    currency: 'USD',
    isWorkDone: true, // 3: There must be tick mark at Row No 3
    attachments: [],
    notes: 'Fiber loopback tested and commissioned. Verified with tick mark.',
  },
  {
    id: 'ftth_rec_04',
    clusterId: 'KHI-FTTH-CLF-08',
    zone: 'Clifton Block 5 Seaside Boulevard',
    clientOperator: 'Cybernet / StormFiber',
    homesPassed: 650,
    fatsInstalled: 40,
    splitterRatio: '1:32',
    dropCableMeters: 7800,
    opticalPowerDbm: -22.4,
    testingStatus: 'Attenuation Fault',
    implementationDate: '2024-09-08',
    supervisor: 'Bilal Ahmed',
    costEstimate: 24000,
    currency: 'USD',
    isWorkDone: false, // 4: There is no tick mark at Row No 4
    attachments: [],
    notes: 'Cable pulling underway. Splicing scheduled for next week. No tick-mark.',
  },
  {
    id: 'ftth_rec_05',
    clusterId: 'LHR-FTTH-GLB-02',
    zone: 'Gulberg III Main Boulevard',
    clientOperator: 'Wateen Telecom Network',
    homesPassed: 360,
    fatsInstalled: 22,
    splitterRatio: '1:16',
    dropCableMeters: 4400,
    opticalPowerDbm: -17.9,
    testingStatus: 'Passed',
    implementationDate: '2024-09-10',
    supervisor: 'Usman Ghani',
    costEstimate: 13800,
    currency: 'USD',
    isWorkDone: true, // 5: There must be tick mark at Row No 5
    attachments: [],
    notes: 'Full commissioning completed, optical power verified. Verified with tick mark.',
  },
];

// Seed FTTB Records - 5 Rows with precise work done tick marks
// Row 1: No tick (isWorkDone: false)
// Row 2: Tick mark (isWorkDone: true)
// Row 3: Tick mark (isWorkDone: true)
// Row 4: No tick (isWorkDone: false)
// Row 5: Tick mark (isWorkDone: true)
const SEED_FTTB: FTTBRecord[] = [
  {
    id: 'fttb_rec_01',
    buildingName: 'Centaurus Commercial Towers - Tower A',
    buildingId: 'BLD-CENT-TWA',
    risersCount: 4,
    floorsCount: 28,
    mduBoxType: 'Wall-Mount 64-Port High Density MDU',
    distributionFibers: 48,
    opticalPowerDbm: -17.8,
    activeCustomerPorts: 42,
    status: 'Cable Pulled',
    handoverDate: '2024-08-20',
    supervisor: 'Bilal Ahmed',
    costEstimate: 9400,
    currency: 'USD',
    isWorkDone: false, // 1: There is no tick-mark at Row No 1
    attachments: [
      {
        id: 'att_04',
        name: 'Riser_Shaft_Isometric_Wiring.dwg',
        fileType: 'cad_dwg',
        sizeFormatted: '6.2 MB',
        uploadDate: '2024-08-21',
        uploadedBy: 'Bilal Ahmed',
        notes: 'Vertical cable conduit paths and fire-stop riser sleeves',
      },
    ],
    notes: 'Vertical riser backbone cable pulled. Pending final splice box termination. No tick-mark.',
  },
  {
    id: 'fttb_rec_02',
    buildingName: 'ISE Towers Financial Center',
    buildingId: 'BLD-ISE-TWR',
    risersCount: 3,
    floorsCount: 22,
    mduBoxType: '19-Inch 48-Port Rackmount MDU',
    distributionFibers: 36,
    opticalPowerDbm: -18.1,
    activeCustomerPorts: 35,
    status: 'Commissioned',
    handoverDate: '2024-08-28',
    supervisor: 'Hamza Tariq',
    costEstimate: 8200,
    currency: 'USD',
    isWorkDone: true, // 2: There must be tick mark at Row No 2
    attachments: [],
    notes: 'Completed and commissioned. All riser distribution fibers spliced. Verified with tick mark.',
  },
  {
    id: 'fttb_rec_03',
    buildingName: 'Ufone Telecom Headquarters Tower',
    buildingId: 'BLD-UFONE-HQ',
    risersCount: 6,
    floorsCount: 32,
    mduBoxType: 'High-Density 96-Port Fiber Riser Panel',
    distributionFibers: 96,
    opticalPowerDbm: -16.9,
    activeCustomerPorts: 88,
    status: 'Commissioned',
    handoverDate: '2024-09-01',
    supervisor: 'Usman Ghani',
    costEstimate: 14500,
    currency: 'USD',
    isWorkDone: true, // 3: There must be tick mark at Row No 3
    attachments: [],
    notes: 'Corporate dedicated fiber MDU fully activated and verified. Verified with tick mark.',
  },
  {
    id: 'fttb_rec_04',
    buildingName: 'Silver Oaks Luxury Condominiums',
    buildingId: 'BLD-SO-CONDO',
    risersCount: 2,
    floorsCount: 16,
    mduBoxType: '32-Port Indoor Compact MDU',
    distributionFibers: 24,
    opticalPowerDbm: -19.5,
    activeCustomerPorts: 12,
    status: 'Surveyed',
    handoverDate: '2024-09-07',
    supervisor: 'Hamza Tariq',
    costEstimate: 6100,
    currency: 'USD',
    isWorkDone: false, // 4: There is no tick mark at Row No 4
    attachments: [],
    notes: 'Survey completed, conduit installation scheduled. No tick-mark.',
  },
  {
    id: 'fttb_rec_05',
    buildingName: 'World Trade Center Mall & Tech Hub',
    buildingId: 'BLD-WTC-HUB',
    risersCount: 5,
    floorsCount: 24,
    mduBoxType: 'Modular 72-Port Optical Hub',
    distributionFibers: 72,
    opticalPowerDbm: -17.4,
    activeCustomerPorts: 60,
    status: 'Commissioned',
    handoverDate: '2024-09-11',
    supervisor: 'Bilal Ahmed',
    costEstimate: 12800,
    currency: 'USD',
    isWorkDone: true, // 5: There must be tick mark at Row No 5
    attachments: [],
    notes: 'Handover complete, tenant live traffic enabled. Verified with tick mark.',
  },
];

// Seed FTTM Records (Fiber to the Mobile / Metro Tower Backhaul)
const SEED_FTTM: FTTMRecord[] = [
  {
    id: 'fttm_rec_01',
    siteId: 'BTS-982-ZONG-4G',
    towerName: 'F-7 Markaz Rooftop Telecom Monopole',
    metroSector: 'Islamabad Central Metro Ring Alpha',
    backhaulBandwidth: '10 Gbps Metro DWDM / Ring Node',
    btsNodeId: 'BTS-NODE-ISB-704',
    sfpTransceivers: '10G BiDi SFP+ 1270/1330nm 40km LC',
    otdrDistanceKm: 12.6,
    attenuationDb: 3.8,
    status: 'Live on Air',
    activationDate: '2024-08-30',
    leadEngineer: 'Bilal Ahmed',
    costEstimate: 8200,
    currency: 'USD',
    attachments: [
      {
        id: 'att_06',
        name: 'BTS_Site_Fiber_Entrance_Photo.png',
        fileType: 'image',
        sizeFormatted: '2.1 MB',
        uploadDate: '2024-08-31',
        uploadedBy: 'Bilal Ahmed',
        previewUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&auto=format&fit=crop&q=80',
        notes: 'Sealed outdoor IP67 enclosure entry with weatherproofing boots',
      },
      {
        id: 'att_07',
        name: 'OTDR_Trace_Backhaul_12.6km.pdf',
        fileType: 'pdf',
        sizeFormatted: '890 KB',
        uploadDate: '2024-08-31',
        uploadedBy: 'Bilal Ahmed',
        notes: 'Clean trace with no macrobends or high-loss fusion splices',
      },
    ],
    notes: 'Tower site live and carrying 5G ready multi-carrier backhaul traffic.',
  },
  {
    id: 'fttm_rec_02',
    siteId: 'BTS-441-JAZZ-5G',
    towerName: 'Blue Area Metro Station Tower Node',
    metroSector: 'Metro Expressway South Spur',
    backhaulBandwidth: '25 Gbps CPRI / eCPRI Fronthaul',
    btsNodeId: 'BTS-NODE-ISB-441',
    sfpTransceivers: '25G SFP28 LR 1310nm 10km',
    otdrDistanceKm: 8.4,
    attenuationDb: 2.7,
    status: 'Spliced & Tested',
    activationDate: '2024-09-06',
    leadEngineer: 'Hamza Tariq',
    costEstimate: 6900,
    currency: 'USD',
    attachments: [
      {
        id: 'att_08',
        name: 'Tower_Conduit_CAD_Plan.dxf',
        fileType: 'cad_dwg',
        sizeFormatted: '3.4 MB',
        uploadDate: '2024-09-06',
        uploadedBy: 'Hamza Tariq',
      },
    ],
    notes: 'Final acceptance test scheduled with network operations center (NOC).',
  },
];

// Seed Expenses
const SEED_EXPENSES: ExpenseRecord[] = [
  {
    id: 'exp_001',
    title: 'Fujikura 90S+ Electrodes Replacement & Optical Calibration',
    type: 'Maintenance',
    category: 'Fiber Splicer Calibration',
    amount: 1450,
    currency: 'USD',
    date: '2024-08-18',
    linkedItemId: 'inv_003',
    vendor: 'Fujikura Regional Service Center',
    invoiceRef: 'INV-FUJ-9921',
    paymentMethod: 'Bank Transfer',
    approvedBy: 'Bilal Ahmed',
    notes: 'Periodic maintenance after 5,000 arc discharges. Certified accuracy report provided.',
    createdAt: '2024-08-18T10:00:00Z',
  },
  {
    id: 'exp_002',
    title: 'Fleet Splicing Vans Monthly Fuel & Highway Toll Passes',
    type: 'Ongoing',
    category: 'Vehicle Fuel',
    amount: 2850,
    currency: 'AED',
    date: '2024-08-31',
    vendor: 'Shell / ADNOC Fleet Services',
    invoiceRef: 'FLT-FUEL-AUG24',
    paymentMethod: 'Company Card',
    approvedBy: 'Usman Ghani',
    notes: 'Fuel replenishment for 4 field deployment vans operating across sectors.',
    createdAt: '2024-08-31T18:00:00Z',
  },
  {
    id: 'exp_003',
    title: 'Industrial Warehouse Central Storage Lease (Monthly)',
    type: 'Ongoing',
    category: 'Warehouse Rent',
    amount: 650000,
    currency: 'PKR',
    date: '2024-09-01',
    vendor: 'Industrial Estate Logistics Properties Ltd',
    invoiceRef: 'RENT-SEP-2024',
    paymentMethod: 'Bank Transfer',
    approvedBy: 'Bilal Ahmed',
    notes: 'Monthly rental for 12,000 sq ft climate-controlled cable storage facility.',
    createdAt: '2024-09-01T09:00:00Z',
  },
  {
    id: 'exp_004',
    title: 'Diesel Generator Overhaul & Filter Service (Warehouse Backup)',
    type: 'Maintenance',
    category: 'Equipment Repair',
    amount: 4200,
    currency: 'SAR',
    date: '2024-09-04',
    vendor: 'CAT Power Systems Technical Support',
    invoiceRef: 'CAT-SRV-8321',
    paymentMethod: 'Company Card',
    approvedBy: 'Usman Ghani',
    notes: 'Oil filter, fuel water separator and battery banks replaced.',
    createdAt: '2024-09-04T14:30:00Z',
  },
  {
    id: 'exp_005',
    title: 'AutoCAD Civil 3D & GIS Fiber Planning Software Subscriptions',
    type: 'Ongoing',
    category: 'Software Licenses',
    amount: 1980,
    currency: 'USD',
    date: '2024-08-25',
    vendor: 'Autodesk Enterprise Services',
    invoiceRef: 'ADSK-LIC-2024',
    paymentMethod: 'Company Card',
    approvedBy: 'Bilal Ahmed',
    notes: '5 seats license renewal for fiber pathway GIS modeling.',
    createdAt: '2024-08-25T11:00:00Z',
  },
  {
    id: 'exp_006',
    title: 'Central Fiber Depot & Cable Yard Warehouse Lease (Monthly)',
    type: 'Ongoing',
    category: 'Rent',
    amount: 2200,
    currency: 'USD',
    date: '2024-06-01',
    vendor: 'Metropolitan Logistics Real Estate',
    invoiceRef: 'RENT-JUN-2024',
    paymentMethod: 'Bank Transfer',
    approvedBy: 'Bilal Ahmed',
    notes: 'Main depot warehouse facility lease payment for June 2024.',
    createdAt: '2024-06-01T08:00:00Z',
  },
  {
    id: 'exp_007',
    title: 'Operations Fleet Vans Diesel Fuel Card Billing',
    type: 'Ongoing',
    category: 'Vehicle Fuel',
    amount: 1150,
    currency: 'USD',
    date: '2024-06-28',
    vendor: 'Shell Commercial Fleet Fuel',
    invoiceRef: 'FUEL-JUN-449',
    paymentMethod: 'Company Card',
    approvedBy: 'Usman Ghani',
    notes: 'Fleet fuel allocation for field deployment teams.',
    createdAt: '2024-06-28T16:00:00Z',
  },
  {
    id: 'exp_008',
    title: 'EXFO FTB-1v2 OTDR Factory Recalibration & Optical Clean',
    type: 'Maintenance',
    category: 'Maintenance',
    amount: 980,
    currency: 'USD',
    date: '2024-06-15',
    vendor: 'EXFO Authorized Technical Laboratory',
    invoiceRef: 'CAL-EXFO-2024',
    paymentMethod: 'Bank Transfer',
    approvedBy: 'Bilal Ahmed',
    notes: 'Biannual optical calibration certificate renewal.',
    createdAt: '2024-06-15T11:00:00Z',
  },
  {
    id: 'exp_009',
    title: 'Central Fiber Depot & Cable Yard Warehouse Lease (Monthly)',
    type: 'Ongoing',
    category: 'Rent',
    amount: 2200,
    currency: 'USD',
    date: '2024-07-01',
    vendor: 'Metropolitan Logistics Real Estate',
    invoiceRef: 'RENT-JUL-2024',
    paymentMethod: 'Bank Transfer',
    approvedBy: 'Bilal Ahmed',
    notes: 'Main depot warehouse facility lease payment for July 2024.',
    createdAt: '2024-07-01T08:00:00Z',
  },
  {
    id: 'exp_010',
    title: 'Field Vans and Logistics Trucks Petrol & Diesel Refueling',
    type: 'Ongoing',
    category: 'Vehicle Fuel',
    amount: 1320,
    currency: 'USD',
    date: '2024-07-29',
    vendor: 'TotalEnergies Fleet Services',
    invoiceRef: 'FUEL-JUL-882',
    paymentMethod: 'Company Card',
    approvedBy: 'Usman Ghani',
    notes: 'Vehicle fuel for inter-city long haul fiber deployments.',
    createdAt: '2024-07-29T17:30:00Z',
  },
  {
    id: 'exp_011',
    title: 'Ditch Witch Micro-Trencher Hydraulic System Overhaul',
    type: 'Maintenance',
    category: 'Maintenance',
    amount: 1750,
    currency: 'USD',
    date: '2024-07-20',
    vendor: 'Ditch Witch Machinery Service',
    invoiceRef: 'SRV-DW-991',
    paymentMethod: 'Bank Transfer',
    approvedBy: 'Usman Ghani',
    notes: 'Replaced hydraulic lines, seals, and cutting wheel bits.',
    createdAt: '2024-07-20T14:00:00Z',
  },
  {
    id: 'exp_012',
    title: 'Central Fiber Depot & Cable Yard Warehouse Lease (Monthly)',
    type: 'Ongoing',
    category: 'Rent',
    amount: 2200,
    currency: 'USD',
    date: '2024-08-01',
    vendor: 'Metropolitan Logistics Real Estate',
    invoiceRef: 'RENT-AUG-2024',
    paymentMethod: 'Bank Transfer',
    approvedBy: 'Bilal Ahmed',
    notes: 'Main depot warehouse facility lease payment for August 2024.',
    createdAt: '2024-08-01T08:00:00Z',
  },
  {
    id: 'exp_013',
    title: 'Fleet Vehicles Fuel & Bulk Diesel Tank Filling',
    type: 'Ongoing',
    category: 'Vehicle Fuel',
    amount: 1420,
    currency: 'USD',
    date: '2024-09-27',
    vendor: 'Shell Commercial Fleet Fuel',
    invoiceRef: 'FUEL-SEP-109',
    paymentMethod: 'Company Card',
    approvedBy: 'Usman Ghani',
    notes: 'Monthly bulk fuel purchase for all project deployment units.',
    createdAt: '2024-09-27T15:00:00Z',
  },
  {
    id: 'exp_014',
    title: 'Central Fiber Depot & Cable Yard Warehouse Lease (Monthly)',
    type: 'Ongoing',
    category: 'Rent',
    amount: 2200,
    currency: 'USD',
    date: '2024-10-01',
    vendor: 'Metropolitan Logistics Real Estate',
    invoiceRef: 'RENT-OCT-2024',
    paymentMethod: 'Bank Transfer',
    approvedBy: 'Bilal Ahmed',
    notes: 'Main depot warehouse facility lease payment for October 2024.',
    createdAt: '2024-10-01T08:00:00Z',
  },
  {
    id: 'exp_015',
    title: 'Fleet Vehicles Fuel Card Settlement',
    type: 'Ongoing',
    category: 'Vehicle Fuel',
    amount: 1280,
    currency: 'USD',
    date: '2024-10-25',
    vendor: 'Shell Commercial Fleet Fuel',
    invoiceRef: 'FUEL-OCT-552',
    paymentMethod: 'Company Card',
    approvedBy: 'Usman Ghani',
    notes: 'Vehicle fuel for October fiber splicing teams.',
    createdAt: '2024-10-25T16:00:00Z',
  },
  {
    id: 'exp_016',
    title: 'Warehouse Climate Control HVAC & Generator Routine Servicing',
    type: 'Maintenance',
    category: 'Maintenance',
    amount: 850,
    currency: 'USD',
    date: '2024-10-12',
    vendor: 'Carrier Technical Air Services',
    invoiceRef: 'HVAC-SRV-1024',
    paymentMethod: 'Company Card',
    approvedBy: 'Bilal Ahmed',
    notes: 'Cleaned condenser coils, replaced intake filters in sensitive optical warehouse.',
    createdAt: '2024-10-12T10:00:00Z',
  },
];

// Seed Projects
const SEED_PROJECTS: ProjectRecord[] = [
  {
    id: 'prj_001',
    code: 'PRJ-FTTH-ISB-G11',
    title: 'Capital Smart Fiber City - Sector G-11 Rollout',
    client: 'National Telecommunication Consortium',
    category: 'FTTH',
    status: 'In Progress',
    startDate: '2024-07-15',
    targetEndDate: '2024-10-30',
    assignedTeam: 'Alpha Splicing & Civil Squad (14 Techs)',
    projectManager: 'Bilal Ahmed',
    progressPercent: 78,
    budget: 85000,
    currency: 'USD',
    notes: 'Phase 1 & 2 completed. Commencing customer drop splicing in Zone 4.',
    tags: ['FTTH', 'High-Density', 'Single-Mode G652D'],
  },
  {
    id: 'prj_002',
    code: 'PRJ-FTTM-METRO-5G',
    title: 'Metro 5G Cellular Tower Fiber Ring Backhaul Expansion',
    client: 'Jazz / VEON Global Infrastructure',
    category: 'FTTM',
    status: 'In Progress',
    startDate: '2024-08-01',
    targetEndDate: '2024-11-15',
    assignedTeam: 'Metro Optical Backbone Division',
    projectManager: 'Usman Ghani',
    progressPercent: 62,
    budget: 120000,
    currency: 'USD',
    notes: 'Interconnecting 18 macro cell sites across urban arterial expressway.',
    tags: ['FTTM', 'Metro Ring', '10G BiDi', 'DWDM'],
  },
  {
    id: 'prj_003',
    code: 'PRJ-FTTB-CENTAURUS',
    title: 'Centaurus Mall & Commercial Complex Gigabit FTTB',
    client: 'Centaurus Group Properties',
    category: 'FTTB',
    status: 'Completed',
    startDate: '2024-05-10',
    targetEndDate: '2024-08-20',
    completionDate: '2024-08-20',
    assignedTeam: 'Indoor Structured Cabling Specialists',
    projectManager: 'Bilal Ahmed',
    progressPercent: 100,
    budget: 45000,
    currency: 'USD',
    finalReportSummary: 'Successfully commissioned 4 riser shafts, 28 floors, and 64-port high-density MDUs. 100% optical loop tests passed with average loss <0.28 dB per splice. Client signed official handover certificate on August 20, 2024.',
    notes: 'Project completed on-time and 4% under allocated financial budget.',
    tags: ['FTTB', 'MDU', 'High-Rise', 'Completed'],
  },
  {
    id: 'prj_004',
    code: 'PRJ-WH-RFID-UPGRADE',
    title: 'Automated Barcode & RFID Stock Tracking in Central Depot',
    client: 'TeleNest Internal Engineering',
    category: 'Warehouse Infrastructure',
    status: 'Planned',
    startDate: '2024-10-01',
    targetEndDate: '2024-12-15',
    assignedTeam: 'Logistics Systems Unit',
    projectManager: 'Usman Ghani',
    progressPercent: 15,
    budget: 22000,
    currency: 'USD',
    notes: 'Procuring handheld Zebra scanners and RFID drum locator tags.',
    tags: ['Warehouse', 'Automation', 'Logistics'],
  },
];

// Seed Daily Works
const SEED_DAILY_WORKS: DailyWork[] = [
  {
    id: 'dw_001',
    rowNumber: 1,
    isRowChecked: true,
    siteId: 'SITE-FTTH-G11-C4',
    siteName: 'Sector G-11/3 North Distribution Sub-Exchange',
    date: '2024-09-08',
    completionDateTime: '2024-09-08 17:45:00',
    projectCode: 'PRJ-FTTH-ISB-G11',
    projectName: 'Capital Smart Fiber City - Sector G-11 Rollout',
    workType: 'FTTH',
    teamLead: 'Hamza Tariq',
    techniciansCount: 6,
    tasksCompleted: 'Spliced 4 FAT boxes (FAT-17 through FAT-20). Tested 64 customer drop points with EXFO optical power meter.',
    metersInstalled: 1420,
    issuesEncountered: 'Underground microduct obstruction near Street 45 resolved via pneumatic duct-rodder clearing.',
    status: 'Completed',
    weatherCondition: 'Clear 29°C',
    safetyIncidentReported: false,
    photos: [
      {
        id: 'p_001',
        name: 'FAT_Box_Splice_Verification.jpg',
        url: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&auto=format&fit=crop&q=80',
        caption: 'FAT-18 Outdoor pole-mounted optical termination with waterproof grommets',
        uploadedAt: '2024-09-08 16:30:00',
        fileSize: '1.8 MB',
      },
      {
        id: 'p_002',
        name: 'OTDR_Attenuation_Pass_Result.jpg',
        url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop&q=80',
        caption: 'EXFO power meter test reading -18.6 dBm at customer premise terminal',
        uploadedAt: '2024-09-08 17:15:00',
        fileSize: '1.2 MB',
      },
    ],
    notes: 'All technician PPE verified (safety boots, hard hats, eye protection for fiber handling). Site signoff obtained from client inspector.',
  },
  {
    id: 'dw_002',
    rowNumber: 2,
    isRowChecked: true,
    siteId: 'SITE-BTS-METRO-982',
    siteName: 'Blue Area Metro Station 5G Tower Node 982',
    date: '2024-09-07',
    completionDateTime: '2024-09-07 18:20:00',
    projectCode: 'PRJ-FTTM-METRO-5G',
    projectName: 'Metro 5G Cellular Tower Fiber Ring Backhaul Expansion',
    workType: 'FTTM',
    teamLead: 'Bilal Ahmed',
    techniciansCount: 4,
    tasksCompleted: 'Completed OTDR bidirectional testing on Tower Node BTS-982. Terminated 10G BiDi optical transceiver links into Huawei OLT.',
    metersInstalled: 680,
    issuesEncountered: 'Traffic diversion permit delayed by 40 minutes in morning hours.',
    status: 'Completed',
    weatherCondition: 'Sunny 31°C',
    safetyIncidentReported: false,
    photos: [
      {
        id: 'p_003',
        name: 'Tower_Base_ODF_Cabinet.jpg',
        url: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600&auto=format&fit=crop&q=80',
        caption: 'Weatherproof high-density fiber panel installed at tower base shelter',
        uploadedAt: '2024-09-07 17:50:00',
        fileSize: '2.4 MB',
      },
    ],
    notes: 'Direct backhaul line confirmed live with central NOC operations. All optical links certified zero error count.',
  },
  {
    id: 'dw_003',
    rowNumber: 3,
    isRowChecked: false,
    siteId: 'SITE-WH-CENTRAL-DEPOT',
    siteName: 'TeleNest Central Logistics Warehouse - Bay 4',
    date: '2024-09-06',
    completionDateTime: '2024-09-06 15:30:00',
    projectCode: 'PRJ-FTTH-ISB-G11',
    projectName: 'Capital Smart Fiber City - Sector G-11 Rollout',
    workType: 'Warehouse Logistics',
    teamLead: 'Usman Ghani',
    techniciansCount: 3,
    tasksCompleted: 'Sorted incoming batch of Corning loose tube fiber cables. Calibrated 2 Fujikura fusion splicers before field deployment.',
    metersInstalled: 0,
    issuesEncountered: 'None',
    status: 'Submitted',
    weatherCondition: 'Warehouse Indoors',
    safetyIncidentReported: false,
    photos: [],
    notes: 'Warehouse rack A-12 restocked and barcoded. Calibration certificates stored in equipment binders.',
  },
  {
    id: 'dw_004',
    rowNumber: 4,
    isRowChecked: true,
    siteId: 'SITE-FTTB-CENT-TWA',
    siteName: 'Centaurus Commercial Towers - Tower A Riser Shaft',
    date: '2024-09-05',
    completionDateTime: '2024-09-05 16:45:00',
    projectCode: 'PRJ-FTTB-CENTAURUS',
    projectName: 'Centaurus Mall & Commercial Complex Gigabit FTTB',
    workType: 'FTTB',
    teamLead: 'Bilal Ahmed',
    techniciansCount: 5,
    tasksCompleted: 'Terminated 48-Core riser fiber into 19-inch MDU panel on 14th floor. Connected corporate tenant lines with SC/APC pigtails.',
    metersInstalled: 950,
    issuesEncountered: 'Building management power shutdown between 13:00 - 14:00.',
    status: 'Completed',
    weatherCondition: 'Building Indoors',
    safetyIncidentReported: false,
    photos: [
      {
        id: 'p_004',
        name: 'MDU_Riser_Shaft_Cable_Management.jpg',
        url: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&auto=format&fit=crop&q=80',
        caption: 'Floor 14 MDU fiber box mounted inside fire-rated vertical riser shaft',
        uploadedAt: '2024-09-05 16:30:00',
        fileSize: '1.9 MB',
      },
    ],
    notes: 'Floor 14 and 15 tenant lines tested. Insertion loss under 0.25 dB per splice.',
  },
];

// Seed Audit Logs for Operations Activity Stream
const nowTime = Date.now();
const minutesAgo = (m: number) => new Date(nowTime - m * 60 * 1000).toISOString();
const hoursAgo = (h: number) => new Date(nowTime - h * 3600 * 1000).toISOString();
const daysAgo = (d: number) => new Date(nowTime - d * 86400 * 1000).toISOString();

export const SEED_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: 'aud_01',
    timestamp: minutesAgo(8),
    userId: 'usr_ceo_001',
    userName: 'Bilal Ahmed',
    userRole: 'Developer/CEO',
    action: 'CREATE',
    module: 'DailyWorks',
    targetId: 'dw_001',
    description: 'Verified Field Sheet: 1,450m fiber splicing & 8 FAT boxes verified in Sector G-11/3.',
    details: { workType: 'FTTH', metersInstalled: 1450, teamLead: 'Hamza Tariq', status: 'Verified' },
  },
  {
    id: 'aud_02',
    timestamp: minutesAgo(24),
    userId: 'usr_admin_002',
    userName: 'Usman Ghani',
    userRole: 'Admin',
    action: 'UPDATE',
    module: 'Inventory',
    targetId: 'inv_001',
    description: 'Stock Movement OUT: Dispatched 1,200m 48-Core Fiber to PRJ-2024-FTTH-01.',
    details: { itemCode: 'FIB-48C-G652D', quantity: 1200, balance: 14500, recipient: 'Metro Rollout Site' },
  },
  {
    id: 'aud_03',
    timestamp: minutesAgo(52),
    userId: 'usr_ceo_001',
    userName: 'Bilal Ahmed',
    userRole: 'Developer/CEO',
    action: 'UPDATE',
    module: 'ICT_Work',
    targetId: 'ftth_rec_01',
    description: 'Optical Acceptance Test Passed: FTTH Cluster CL-ISB-01 verified at -18.2 dBm.',
    details: { clusterId: 'CL-ISB-01', testingStatus: 'Passed', opticalPower: -18.2, operator: 'PTCL' },
  },
  {
    id: 'aud_04',
    timestamp: hoursAgo(1.8),
    userId: 'usr_admin_002',
    userName: 'Usman Ghani',
    userRole: 'Admin',
    action: 'CREATE',
    module: 'Finance',
    targetId: 'exp_001',
    description: 'Procurement Approval: Fujikura CT50 Cleaver maintenance overhaul ($1,250 USD).',
    details: { vendor: 'Fujikura Ltd', amount: 1250, currency: 'USD', type: 'Maintenance' },
  },
  {
    id: 'aud_05',
    timestamp: hoursAgo(3.2),
    userId: 'usr_ceo_001',
    userName: 'Bilal Ahmed',
    userRole: 'Developer/CEO',
    action: 'CREATE',
    module: 'ICT_Work',
    targetId: 'fttb_rec_01',
    description: 'Commissioned FTTB Building: Centaurus Tower A riser terminated with 24 customer ports.',
    details: { buildingName: 'Centaurus Tower A', ports: 24, status: 'Commissioned' },
  },
  {
    id: 'aud_06',
    timestamp: hoursAgo(5.5),
    userId: 'usr_admin_002',
    userName: 'Usman Ghani',
    userRole: 'Admin',
    action: 'CREATE',
    module: 'Inventory',
    targetId: 'inv_003',
    description: 'Stock Movement IN: Received 15,000m 48-Core G.652D armored cable from Prysmian Group.',
    details: { itemCode: 'FIB-48C-G652D', quantity: 15000, supplier: 'Prysmian Group' },
  },
  {
    id: 'aud_07',
    timestamp: hoursAgo(7.0),
    userId: 'usr_tech_003',
    userName: 'Hamza Tariq',
    userRole: 'Standard User',
    action: 'UPDATE',
    module: 'DailyWorks',
    targetId: 'dw_002',
    description: 'Submitted daily trenching safety checklist with zero incidents reported.',
    details: { teamLead: 'Hamza Tariq', safetyIncidentReported: false, status: 'Submitted' },
  },
  {
    id: 'aud_08',
    timestamp: hoursAgo(9.4),
    userId: 'usr_ceo_001',
    userName: 'Bilal Ahmed',
    userRole: 'Developer/CEO',
    action: 'UPDATE',
    module: 'Projects',
    targetId: 'prj_001',
    description: 'Milestone Progress Update: Metro FTTH Turnkey Rollout advanced to 75% completion.',
    details: { projectCode: 'PRJ-2024-FTTH-01', progressPercent: 75, client: 'PTCL' },
  },
  {
    id: 'aud_09',
    timestamp: hoursAgo(14.2),
    userId: 'usr_ceo_001',
    userName: 'Bilal Ahmed',
    userRole: 'Developer/CEO',
    action: 'CREATE',
    module: 'ICT_Work',
    targetId: 'fttm_rec_01',
    description: 'FTTM Cellular Site Activated: Tower Mobilink F-7 10 Gbps Metro Ring live on air.',
    details: { towerName: 'Tower Mobilink F-7', siteId: 'BTS-982-ZONG-4G', status: 'Live on Air' },
  },
  {
    id: 'aud_10',
    timestamp: daysAgo(1),
    userId: 'usr_admin_002',
    userName: 'Usman Ghani',
    userRole: 'Admin',
    action: 'BACKUP_EXPORT',
    module: 'System',
    targetId: 'sys_backup',
    description: 'Exported Master Inventory Report (.xlsx) with 5 multi-sheet operational tabs.',
    details: { format: 'XLSX', scope: 'Full Enterprise Warehouse & ICT' },
  },
  {
    id: 'aud_11',
    timestamp: daysAgo(1.5),
    userId: 'usr_ceo_001',
    userName: 'Bilal Ahmed',
    userRole: 'Developer/CEO',
    action: 'LOGIN',
    module: 'System',
    targetId: 'auth',
    description: 'Executive administrative terminal session authenticated with PIN/hash verification.',
    details: { terminal: 'Operations Console Workstation', role: 'Developer/CEO' },
  },
  {
    id: 'aud_12',
    timestamp: daysAgo(2),
    userId: 'usr_admin_002',
    userName: 'Usman Ghani',
    userRole: 'Admin',
    action: 'UPDATE',
    module: 'Finance',
    targetId: 'exp_002',
    description: 'Paid recurring warehouse operational lease and utilities for Islamabad North Depot.',
    details: { amount: 3200, currency: 'USD', type: 'Ongoing' },
  },
];

/**
 * Storage Service with IndexedDB integration + LocalStorage fallback
 */
class StorageService {
  private isInitialized = false;
  private changeListeners: Set<(key: string) => void> = new Set();
  private safetySnapshot: string | null = null;
  private inMemoryStorage: Map<string, string> = new Map();

  public onStorageChange(listener: (key: string) => void): () => void {
    this.changeListeners.add(listener);
    return () => {
      this.changeListeners.delete(listener);
    };
  }

  private notifyChange(key: string): void {
    this.changeListeners.forEach((fn) => {
      try {
        fn(key);
      } catch (e) {
        console.error('Storage change listener error:', e);
      }
    });
  }

  public async init(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Check if data exists; if not, initialize with default seeds
      if (!this.get(STORAGE_KEYS.USERS, null)) {
        this.save(STORAGE_KEYS.USERS, SEED_USERS);
      }
      if (!this.get(STORAGE_KEYS.CURRENT_USER, null)) {
        this.save(STORAGE_KEYS.CURRENT_USER, SEED_USERS[0]); // Default to Bilal Ahmed
      }
      if (!this.get(STORAGE_KEYS.INVENTORY, null)) {
        this.save(STORAGE_KEYS.INVENTORY, SEED_INVENTORY);
      }
      if (!this.get(STORAGE_KEYS.MOVEMENTS, null)) {
        this.save(STORAGE_KEYS.MOVEMENTS, SEED_MOVEMENTS);
      }
      if (!this.get(STORAGE_KEYS.FTTH, null)) {
        this.save(STORAGE_KEYS.FTTH, SEED_FTTH);
      }
      if (!this.get(STORAGE_KEYS.FTTB, null)) {
        this.save(STORAGE_KEYS.FTTB, SEED_FTTB);
      }
      if (!this.get(STORAGE_KEYS.FTTM, null)) {
        this.save(STORAGE_KEYS.FTTM, SEED_FTTM);
      }
      if (!this.get(STORAGE_KEYS.EXPENSES, null)) {
        this.save(STORAGE_KEYS.EXPENSES, SEED_EXPENSES);
      }
      if (!this.get(STORAGE_KEYS.PROJECTS, null)) {
        this.save(STORAGE_KEYS.PROJECTS, SEED_PROJECTS);
      }
      if (!this.get(STORAGE_KEYS.DAILY_WORKS, null)) {
        this.save(STORAGE_KEYS.DAILY_WORKS, SEED_DAILY_WORKS);
      }
      if (!this.get(STORAGE_KEYS.AUDIT_LOGS, null)) {
        this.save(STORAGE_KEYS.AUDIT_LOGS, SEED_AUDIT_LOGS);
      }
      if (!this.get(STORAGE_KEYS.EXCHANGE_RATES, null)) {
        this.save(STORAGE_KEYS.EXCHANGE_RATES, DEFAULT_EXCHANGE_RATES);
      }
      if (!this.get(STORAGE_KEYS.COMPANY_CONFIG, null)) {
        this.save(STORAGE_KEYS.COMPANY_CONFIG, INITIAL_COMPANY_CONFIG);
      }
      if (!this.get(STORAGE_KEYS.GLOBAL_THEME, null)) {
        this.save(STORAGE_KEYS.GLOBAL_THEME, 'theme-blue');
      }

      this.isInitialized = true;
    } catch (e) {
      console.warn('Storage initialization fallback active:', e);
      this.isInitialized = true;
    }
  }

  // Generic Save / Load with dual localStorage + in-memory resilience
  public save<T>(key: string, data: T): void {
    const serialized = JSON.stringify(data);
    this.inMemoryStorage.set(key, serialized);
    try {
      if (typeof window !== 'undefined' && 'localStorage' in window) {
        window.localStorage.setItem(key, serialized);
      }
    } catch (err) {
      // Gracefully silent on storage partitioning or disabled 3rd-party storage
    }
    this.notifyChange(key);
  }

  public get<T>(key: string, defaultValue: T): T {
    try {
      let raw: string | null = null;
      try {
        if (typeof window !== 'undefined' && 'localStorage' in window) {
          raw = window.localStorage.getItem(key);
        }
      } catch {
        // Fallback to in-memory store
      }
      if (!raw && this.inMemoryStorage.has(key)) {
        raw = this.inMemoryStorage.get(key) || null;
      }
      if (!raw || raw === 'null' || raw === 'undefined') return defaultValue;
      const parsed = JSON.parse(raw);
      if (parsed === null || parsed === undefined) return defaultValue;
      return parsed as T;
    } catch (err) {
      if (this.inMemoryStorage.has(key)) {
        try {
          return JSON.parse(this.inMemoryStorage.get(key)!) as T;
        } catch {}
      }
      return defaultValue;
    }
  }

  // Current User
  public getCurrentUser(): User | null {
    const user = this.get<User | null>(STORAGE_KEYS.CURRENT_USER, null);
    if (user && typeof user === 'object') {
      if (!user.operationsPermissions) {
        user.operationsPermissions =
          DEFAULT_OPERATIONS_PERMISSIONS[user.role] || DEFAULT_OPERATIONS_PERMISSIONS['Standard User'];
      }
      return user;
    }
    return null;
  }

  public setCurrentUser(user: User): void {
    this.save(STORAGE_KEYS.CURRENT_USER, user);
  }

  public clearCurrentUser(): void {
    this.save(STORAGE_KEYS.CURRENT_USER, null);
  }

  // Users CRUD
  public getUsers(): User[] {
    const rawList = this.get<User[]>(STORAGE_KEYS.USERS, SEED_USERS);
    const list = Array.isArray(rawList)
      ? rawList.filter((u) => u && typeof u === 'object' && u.username)
      : SEED_USERS;
    const hasBilal = list.some(
      (u) => (u.username || '').toLowerCase() === 'bilal' || u.role === 'Developer/CEO'
    );
    const combined = hasBilal ? list : [SEED_USERS[0], ...list];

    const seenUsernames = new Set<string>();
    const deduplicated: User[] = [];

    for (const u of combined) {
      if (!u || !u.username) continue;
      const key = (u.username || '').toLowerCase().trim();
      if (!seenUsernames.has(key)) {
        seenUsernames.add(key);
        const isCeo = key === 'bilal' || u.role === 'Developer/CEO';
        deduplicated.push({
          ...u,
          fullName: u.fullName || u.username || 'TeleNest User',
          role: u.role || 'Standard User',
          isDefault: isCeo ? true : Boolean(u.isDefault),
          pin: isCeo ? (u.pin && u.pin !== '7860' ? u.pin : '4790') : (u.pin || '1234'),
          operationsPermissions:
            u.operationsPermissions ||
            DEFAULT_OPERATIONS_PERMISSIONS[u.role] ||
            DEFAULT_OPERATIONS_PERMISSIONS['Standard User'],
        });
      }
    }
    return deduplicated.length > 0 ? deduplicated : SEED_USERS;
  }

  public saveUsers(users: User[]): void {
    // Enforce Rule 1 & 2 & 4:
    // Only ONE Developer/CEO account (Bilal Ahmed) can ever exist in the system.
    // Admin & Standard users cannot delete, modify role, deactivate, or tamper with the Developer/CEO account.
    const currentUsers = this.getUsers();
    const existingCeo =
      currentUsers.find((u) => u.role === 'Developer/CEO' || u.username.toLowerCase() === 'bilal') ||
      SEED_USERS[0];

    // Find if CEO is present in the incoming users list (by id, role, or matching username)
    const incomingCeo = users.find(
      (u) =>
        u.id === existingCeo.id ||
        u.role === 'Developer/CEO' ||
        u.username.toLowerCase() === existingCeo.username.toLowerCase() ||
        u.username.toLowerCase() === 'bilal'
    );

    // Keep CEO user immutable against unauthorized changes:
    // Retain Developer/CEO role, active status (isLocked: false), isDefault: true, and full permissions.
    // However, Developer/CEO username, fullName, PIN, email, and preferences can be updated by the CEO.
    const securedCeo: User = {
      ...(incomingCeo || existingCeo),
      role: 'Developer/CEO',
      isLocked: false,
      isDefault: true,
      canAccessSystemSettings: true,
      canEditInventory: true,
      canEditFinance: true,
      canEditICT: true,
      operationsPermissions: DEFAULT_OPERATIONS_PERMISSIONS['Developer/CEO'],
    };

    // Sanitize all other users: NO other user may have role 'Developer/CEO'
    const sanitizedUsers: User[] = [securedCeo];
    const seenUsernames = new Set<string>([securedCeo.username.toLowerCase()]);

    for (const u of users) {
      if (u.id === securedCeo.id || u.username.toLowerCase() === securedCeo.username.toLowerCase()) {
        continue;
      }
      const key = u.username.toLowerCase();
      if (seenUsernames.has(key)) continue;
      seenUsernames.add(key);

      // Prevent privilege escalation to Developer/CEO
      let safeRole: UserRole = u.role;
      if (safeRole === 'Developer/CEO') {
        safeRole = 'Admin';
      }

      sanitizedUsers.push({
        ...u,
        role: safeRole,
        isDefault: false,
        canAccessSystemSettings: false,
        operationsPermissions: u.operationsPermissions
          ? { ...u.operationsPermissions, canAccessSettings: false }
          : safeRole === 'Admin'
          ? { ...DEFAULT_OPERATIONS_PERMISSIONS['Admin'], canAccessSettings: false }
          : DEFAULT_OPERATIONS_PERMISSIONS['Standard User'],
      });
    }

    this.save(STORAGE_KEYS.USERS, sanitizedUsers);
  }

  // User Activity & Dossier Tracking
  public getArchivedUsers(): ArchivedUserBackup[] {
    return this.get<ArchivedUserBackup[]>(STORAGE_KEYS.ARCHIVED_USERS, []);
  }

  public saveArchivedUsers(backups: ArchivedUserBackup[]): void {
    this.save(STORAGE_KEYS.ARCHIVED_USERS, backups);
  }

  public getUserActivityDossier(userId: string): UserActivityDossier | null {
    const allUsers = this.getUsers();
    let targetUser = allUsers.find((u) => u.id === userId);

    if (!targetUser) {
      const archived = this.getArchivedUsers().find((b) => b.user.id === userId || b.id === userId);
      if (archived) {
        return archived.dossier;
      }
      return null;
    }

    const userNameLower = (targetUser.fullName || '').toLowerCase().trim();
    const userHandleLower = (targetUser.username || '').toLowerCase().trim();

    // 1. Audit Logs
    const allLogs = this.getAuditLogs();
    const userLogs = allLogs.filter((l) => {
      if (l.userId === targetUser.id) return true;
      const logName = (l.userName || '').toLowerCase().trim();
      return (
        logName === userNameLower ||
        logName === userHandleLower ||
        (userNameLower && logName.includes(userNameLower))
      );
    });

    // 2. Daily Works
    const allWorks = this.getDailyWorks();
    const userWorks = allWorks.filter((w) => {
      if (w.createdByUserId === targetUser.id) return true;
      if (w.createdByUserName && w.createdByUserName.toLowerCase().trim() === userNameLower) return true;
      const lead = (w.teamLead || '').toLowerCase().trim();
      return lead === userNameLower || (userNameLower && lead.includes(userNameLower));
    });

    // 3. Stock Movements
    const allMovements = this.getMovements();
    const userMovements = allMovements.filter((m) => {
      if (m.createdByUserId === targetUser.id) return true;
      if (m.createdByUserName && m.createdByUserName.toLowerCase().trim() === userNameLower) return true;
      const perf = (m.createdByUserName || '').toLowerCase().trim();
      return perf === userNameLower || (userNameLower && perf.includes(userNameLower));
    });

    // 4. Inventory Items authored or updated
    const allItems = this.getInventory();
    const userItems = allItems.filter((i) => {
      if (i.createdByUserId === targetUser.id || i.lastUpdatedByUserId === targetUser.id) return true;
      const created = (i.createdByUserName || '').toLowerCase().trim();
      const updated = (i.lastUpdatedByUserName || '').toLowerCase().trim();
      return (
        created === userNameLower ||
        updated === userNameLower ||
        (userNameLower && (created.includes(userNameLower) || updated.includes(userNameLower)))
      );
    });

    // 5. Projects
    const allProjects = this.getProjects();
    const userProjects = allProjects.filter((p) => {
      if (p.createdByUserId === targetUser.id) return true;
      if (p.createdByUserName && p.createdByUserName.toLowerCase().trim() === userNameLower) return true;
      const pm = (p.projectManager || '').toLowerCase().trim();
      const team = (p.assignedTeam || '').toLowerCase().trim();
      return (
        pm === userNameLower ||
        (userNameLower && pm.includes(userNameLower)) ||
        (userNameLower && team.includes(userNameLower))
      );
    });

    // 6. Expenses
    const allExpenses = this.getExpenses();
    const userExpenses = allExpenses.filter((e) => {
      if (e.createdByUserId === targetUser.id) return true;
      if (e.createdByUserName && e.createdByUserName.toLowerCase().trim() === userNameLower) return true;
      const appBy = (e.approvedBy || '').toLowerCase().trim();
      const paid = (e.paidTo || '').toLowerCase().trim();
      return (
        appBy === userNameLower ||
        paid === userNameLower ||
        (userNameLower && (appBy.includes(userNameLower) || paid.includes(userNameLower)))
      );
    });

    // 7. Fiber Deployments
    const allFtth = this.getFTTH();
    const userFtth = allFtth.filter((f) => {
      if (f.createdByUserId === targetUser.id) return true;
      if (f.createdByUserName && f.createdByUserName.toLowerCase().trim() === userNameLower) return true;
      const sup = (f.supervisor || '').toLowerCase().trim();
      return sup === userNameLower || (userNameLower && sup.includes(userNameLower));
    });

    const allFttb = this.getFTTB();
    const userFttb = allFttb.filter((b) => {
      if (b.createdByUserId === targetUser.id) return true;
      if (b.createdByUserName && b.createdByUserName.toLowerCase().trim() === userNameLower) return true;
      const sup = (b.supervisor || '').toLowerCase().trim();
      return sup === userNameLower || (userNameLower && sup.includes(userNameLower));
    });

    const allFttm = this.getFTTM();
    const userFttm = allFttm.filter((m) => {
      if (m.createdByUserId === targetUser.id) return true;
      if (m.createdByUserName && m.createdByUserName.toLowerCase().trim() === userNameLower) return true;
      const lead = (m.leadEngineer || '').toLowerCase().trim();
      return lead === userNameLower || (userNameLower && lead.includes(userNameLower));
    });

    // Calculate latest activity timestamp
    let lastActiveTimestamp = targetUser.lastLogin || targetUser.createdAt;
    userLogs.forEach((l) => {
      if (!lastActiveTimestamp || l.timestamp > lastActiveTimestamp) {
        lastActiveTimestamp = l.timestamp;
      }
    });

    return {
      user: targetUser,
      generatedAt: new Date().toISOString(),
      stats: {
        totalActivities: userLogs.length,
        dailyWorksCount: userWorks.length,
        stockMovementsCount: userMovements.length,
        inventoryItemsAuthoredCount: userItems.length,
        projectsManagedCount: userProjects.length,
        expensesLoggedCount: userExpenses.length,
        ftthCount: userFtth.length,
        fttbCount: userFttb.length,
        fttmCount: userFttm.length,
        lastActiveTimestamp,
      },
      activityLogs: userLogs,
      dailyWorks: userWorks,
      stockMovements: userMovements,
      inventoryItems: userItems,
      projects: userProjects,
      expenses: userExpenses,
      fiberDeployments: {
        ftth: userFtth,
        fttb: userFttb,
        fttm: userFttm,
      },
    };
  }

  public exportUserDossierJson(dossier: UserActivityDossier): string {
    const backup = {
      manifest: 'TeleNest User Complete Activity & Work History Dossier',
      developer: 'Bilal Ahmed (Developer/CEO)',
      exportedAt: new Date().toISOString(),
      appVersion: '2.5.0-Enterprise',
      targetUser: {
        id: dossier.user.id,
        username: dossier.user.username,
        fullName: dossier.user.fullName,
        email: dossier.user.email,
        role: dossier.user.role,
        department: dossier.user.department,
        accountCreatedAt: dossier.user.createdAt,
        lastLogin: dossier.user.lastLogin,
        isLocked: dossier.user.isLocked,
        operationsPermissions: dossier.user.operationsPermissions,
      },
      summaryStatistics: dossier.stats,
      dataRecords: {
        activityLogs: dossier.activityLogs,
        dailyWorks: dossier.dailyWorks,
        stockMovements: dossier.stockMovements,
        inventoryItems: dossier.inventoryItems,
        projects: dossier.projects,
        expenses: dossier.expenses,
        fiberDeployments: dossier.fiberDeployments,
      },
    };
    return JSON.stringify(backup, null, 2);
  }

  public archiveAndRemoveUser(
    targetUser: User,
    performedByUser: User,
    purgeFromActiveDb: boolean = false
  ): { archive: ArchivedUserBackup; jsonString: string } {
    // 1. Compile complete dossier
    const dossier = this.getUserActivityDossier(targetUser.id) || {
      user: targetUser,
      generatedAt: new Date().toISOString(),
      stats: {
        totalActivities: 0,
        dailyWorksCount: 0,
        stockMovementsCount: 0,
        inventoryItemsAuthoredCount: 0,
        projectsManagedCount: 0,
        expensesLoggedCount: 0,
        ftthCount: 0,
        fttbCount: 0,
        fttmCount: 0,
      },
      activityLogs: [],
      dailyWorks: [],
      stockMovements: [],
      inventoryItems: [],
      projects: [],
      expenses: [],
      fiberDeployments: { ftth: [], fttb: [], fttm: [] },
    };

    const jsonString = this.exportUserDossierJson(dossier);
    const archiveId = `usr_arch_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const archiveRecord: ArchivedUserBackup = {
      id: archiveId,
      archivedAt: new Date().toISOString(),
      archivedByUserId: performedByUser.id,
      archivedByUserName: performedByUser.fullName,
      user: { ...targetUser },
      recordsRetainedInLiveDb: !purgeFromActiveDb,
      dossier,
      rawJsonSnapshot: jsonString,
      archiveSizeBytes: new Blob([jsonString]).size,
    };

    // 2. Persist in permanent archived user backups collection
    const currentArchived = this.getArchivedUsers();
    // Prevent duplicate entries for same user id if re-archived
    const filteredArchived = currentArchived.filter((b) => b.user.id !== targetUser.id);
    this.saveArchivedUsers([archiveRecord, ...filteredArchived]);

    // 3. Handle live active database records
    const userNameLower = (targetUser.fullName || '').toLowerCase().trim();
    if (purgeFromActiveDb) {
      // Explicit permanent deletion of records created by this user
      const works = this.getDailyWorks().filter(
        (w) => w.createdByUserId !== targetUser.id && (w.teamLead || '').toLowerCase().trim() !== userNameLower
      );
      this.saveDailyWorks(works);

      const movs = this.getMovements().filter(
        (m) => m.createdByUserId !== targetUser.id && (m.createdByUserName || '').toLowerCase().trim() !== userNameLower
      );
      this.saveMovements(movs);

      const prjs = this.getProjects().filter(
        (p) => p.createdByUserId !== targetUser.id && (p.projectManager || '').toLowerCase().trim() !== userNameLower
      );
      this.saveProjects(prjs);

      const exps = this.getExpenses().filter(
        (e) => e.createdByUserId !== targetUser.id && (e.approvedBy || '').toLowerCase().trim() !== userNameLower
      );
      this.saveExpenses(exps);

      const ftth = this.getFTTH().filter(
        (f) => f.createdByUserId !== targetUser.id && (f.supervisor || '').toLowerCase().trim() !== userNameLower
      );
      this.saveFTTH(ftth);

      const fttb = this.getFTTB().filter(
        (b) => b.createdByUserId !== targetUser.id && (b.supervisor || '').toLowerCase().trim() !== userNameLower
      );
      this.saveFTTB(fttb);

      const fttm = this.getFTTM().filter(
        (m) => m.createdByUserId !== targetUser.id && (m.leadEngineer || '').toLowerCase().trim() !== userNameLower
      );
      this.saveFTTM(fttm);
    }

    // 4. Remove user from active users list
    const remainingUsers = this.getUsers().filter((u) => u.id !== targetUser.id);
    this.saveUsers(remainingUsers);

    // 5. Write audit log
    this.logActivity({
      userId: performedByUser.id,
      userName: performedByUser.fullName,
      userRole: performedByUser.role,
      action: 'DELETE',
      module: 'Users',
      targetId: targetUser.id,
      description: `User "${targetUser.fullName}" removed. Offline backup archived (${archiveRecord.archiveSizeBytes.toLocaleString()} bytes). Active DB records: ${
        purgeFromActiveDb ? 'PURGED (Explicit Developer/CEO choice)' : 'RETAINED in system'
      }.`,
      details: {
        archiveId: archiveRecord.id,
        recordsRetained: !purgeFromActiveDb,
        userRole: targetUser.role,
        department: targetUser.department,
        totalActivitiesArchived: dossier.stats.totalActivities,
      },
    });

    return { archive: archiveRecord, jsonString };
  }

  public restoreArchivedUser(archiveId: string, performedByUser: User): boolean {
    const archives = this.getArchivedUsers();
    const targetArchive = archives.find((b) => b.id === archiveId || b.user.id === archiveId);
    if (!targetArchive) return false;

    const currentUsers = this.getUsers();
    // Check if username already taken
    const exists = currentUsers.some(
      (u) => u.id === targetArchive.user.id || u.username.toLowerCase() === targetArchive.user.username.toLowerCase()
    );
    if (exists) return false;

    const restoredUser: User = {
      ...targetArchive.user,
      isLocked: false,
    };

    this.saveUsers([...currentUsers, restoredUser]);

    this.logActivity({
      userId: performedByUser.id,
      userName: performedByUser.fullName,
      userRole: performedByUser.role,
      action: 'CREATE',
      module: 'Users',
      targetId: restoredUser.id,
      description: `Restored user profile "${restoredUser.fullName}" (${restoredUser.username}) from offline archive ${targetArchive.id}`,
    });

    return true;
  }

  public deleteArchivedUserBackup(archiveId: string, performedByUser: User): boolean {
    const archives = this.getArchivedUsers();
    const updated = archives.filter((b) => b.id !== archiveId && b.user.id !== archiveId);
    this.saveArchivedUsers(updated);

    this.logActivity({
      userId: performedByUser.id,
      userName: performedByUser.fullName,
      userRole: performedByUser.role,
      action: 'DELETE',
      module: 'Users',
      targetId: archiveId,
      description: `Developer/CEO permanently purged offline user backup archive ${archiveId}`,
    });

    return true;
  }

  // Inventory CRUD
  public getInventory(): InventoryItem[] {
    const list = this.get<InventoryItem[]>(STORAGE_KEYS.INVENTORY, SEED_INVENTORY);
    return Array.isArray(list) ? list : SEED_INVENTORY;
  }

  public saveInventory(items: InventoryItem[]): void {
    this.save(STORAGE_KEYS.INVENTORY, items);
  }

  // Inventory Categories Management
  public getCustomCategories(): string[] {
    const cats = this.get<string[]>(STORAGE_KEYS.CUSTOM_CATEGORIES, []);
    return Array.isArray(cats) ? cats : [];
  }

  public saveCustomCategories(cats: string[]): void {
    this.save(STORAGE_KEYS.CUSTOM_CATEGORIES, cats);
  }

  public getAllInventoryCategories(): string[] {
    const custom = this.getCustomCategories();
    const inventory = this.getInventory();
    const fromInventory = Array.isArray(inventory)
      ? inventory.map((it) => it?.category).filter(Boolean)
      : [];

    const merged = new Set<string>();
    DEFAULT_INVENTORY_CATEGORIES.forEach((c) => merged.add(c));
    custom.forEach((c) => {
      if (c && c.trim()) merged.add(c.trim());
    });
    fromInventory.forEach((c) => {
      if (c && c.trim()) merged.add(c.trim());
    });

    return Array.from(merged);
  }

  public addInventoryCategory(name: string): string[] {
    const trimmed = name.trim();
    if (!trimmed) return this.getAllInventoryCategories();

    const existing = this.getAllInventoryCategories();
    const exists = existing.some((c) => c.toLowerCase() === trimmed.toLowerCase());
    if (!exists) {
      const custom = this.getCustomCategories();
      custom.push(trimmed);
      this.saveCustomCategories(custom);
    }
    return this.getAllInventoryCategories();
  }

  public deleteCustomCategory(name: string): string[] {
    const trimmed = name.trim();
    const custom = this.getCustomCategories().filter(
      (c) => c.toLowerCase() !== trimmed.toLowerCase()
    );
    this.saveCustomCategories(custom);
    return this.getAllInventoryCategories();
  }

  // Stock Movements CRUD
  public getMovements(): StockMovement[] {
    const list = this.get<StockMovement[]>(STORAGE_KEYS.MOVEMENTS, SEED_MOVEMENTS);
    return Array.isArray(list) ? list : SEED_MOVEMENTS;
  }

  public saveMovements(movements: StockMovement[]): void {
    this.save(STORAGE_KEYS.MOVEMENTS, movements);
  }

  // ICT Records
  public getFTTH(): FTTHRecord[] {
    const list = this.get<FTTHRecord[]>(STORAGE_KEYS.FTTH, SEED_FTTH);
    if (!Array.isArray(list)) {
      this.saveFTTH(SEED_FTTH);
      return SEED_FTTH;
    }
    return list.map((r) => ({
      ...r,
      isWorkDone: Boolean(r.isWorkDone),
      attachments: Array.isArray(r.attachments) ? r.attachments : [],
    }));
  }
  public saveFTTH(records: FTTHRecord[]): void {
    this.save(STORAGE_KEYS.FTTH, records);
  }

  public getFTTB(): FTTBRecord[] {
    const list = this.get<FTTBRecord[]>(STORAGE_KEYS.FTTB, SEED_FTTB);
    if (!Array.isArray(list)) {
      this.saveFTTB(SEED_FTTB);
      return SEED_FTTB;
    }
    return list.map((r) => ({
      ...r,
      isWorkDone: Boolean(r.isWorkDone),
      attachments: Array.isArray(r.attachments) ? r.attachments : [],
    }));
  }
  public saveFTTB(records: FTTBRecord[]): void {
    this.save(STORAGE_KEYS.FTTB, records);
  }

  public getFTTM(): FTTMRecord[] {
    const list = this.get<FTTMRecord[]>(STORAGE_KEYS.FTTM, SEED_FTTM);
    if (!Array.isArray(list)) {
      this.saveFTTM(SEED_FTTM);
      return SEED_FTTM;
    }
    return list.map((r) => ({
      ...r,
      attachments: Array.isArray(r.attachments) ? r.attachments : [],
    }));
  }
  public saveFTTM(records: FTTMRecord[]): void {
    this.save(STORAGE_KEYS.FTTM, records);
  }

  // Expenses
  public getExpenses(): ExpenseRecord[] {
    const list = this.get<ExpenseRecord[]>(STORAGE_KEYS.EXPENSES, SEED_EXPENSES);
    if (!Array.isArray(list)) {
      this.saveExpenses(SEED_EXPENSES);
      return SEED_EXPENSES;
    }
    // If the list has only the older seed records, enrich with the additional multi-month historical trends
    if (list.length > 0 && list.length <= 5 && SEED_EXPENSES.length > 5) {
      const existingIds = new Set(list.map((e) => e.id));
      const missingSeeds = SEED_EXPENSES.filter((e) => !existingIds.has(e.id));
      if (missingSeeds.length > 0) {
        const enriched = [...list, ...missingSeeds];
        this.saveExpenses(enriched);
        return enriched;
      }
    }
    return list;
  }
  public saveExpenses(expenses: ExpenseRecord[]): void {
    this.save(STORAGE_KEYS.EXPENSES, expenses);
  }

  // Projects
  public getProjects(): ProjectRecord[] {
    const list = this.get<ProjectRecord[]>(STORAGE_KEYS.PROJECTS, SEED_PROJECTS);
    if (!Array.isArray(list)) {
      this.saveProjects(SEED_PROJECTS);
      return SEED_PROJECTS;
    }
    return list;
  }
  public saveProjects(projects: ProjectRecord[]): void {
    this.save(STORAGE_KEYS.PROJECTS, projects);
  }

  // Daily Works
  public getDailyWorks(): DailyWork[] {
    const list = this.get<DailyWork[]>(STORAGE_KEYS.DAILY_WORKS, SEED_DAILY_WORKS);
    if (!Array.isArray(list)) {
      this.saveDailyWorks(SEED_DAILY_WORKS);
      return SEED_DAILY_WORKS;
    }
    return list;
  }
  public saveDailyWorks(works: DailyWork[]): void {
    this.save(STORAGE_KEYS.DAILY_WORKS, works);
  }

  // Audit Log
  public getAuditLogs(): AuditLogEntry[] {
    const logs = this.get<AuditLogEntry[]>(STORAGE_KEYS.AUDIT_LOGS, SEED_AUDIT_LOGS);
    if (!Array.isArray(logs)) {
      this.save(STORAGE_KEYS.AUDIT_LOGS, SEED_AUDIT_LOGS);
      return SEED_AUDIT_LOGS;
    }
    return logs;
  }
  public logActivity(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): void {
    const logs = this.getAuditLogs();
    const newEntry: AuditLogEntry = {
      ...entry,
      id: `aud_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
    };
    logs.unshift(newEntry);
    // Keep generous audit log history (up to 5000 logs)
    if (logs.length > 5000) logs.pop();
    this.save(STORAGE_KEYS.AUDIT_LOGS, logs);
  }

  // Exchange Rates
  public getExchangeRates(): ExchangeRates {
    const rates = this.get<ExchangeRates>(STORAGE_KEYS.EXCHANGE_RATES, DEFAULT_EXCHANGE_RATES);
    return rates && typeof rates === 'object' && rates.rates ? rates : DEFAULT_EXCHANGE_RATES;
  }
  public saveExchangeRates(rates: ExchangeRates): void {
    this.save(STORAGE_KEYS.EXCHANGE_RATES, rates);
  }

  // Software Name & Branding
  public getSoftwareName(): string {
    try {
      const saved = localStorage.getItem('telenest_software_name_v1');
      if (saved) return saved;
      const config = this.getCompanyConfig();
      if (config?.softwareName) return config.softwareName;
    } catch {}
    return 'TeleNest';
  }

  public setSoftwareName(name: string): void {
    try {
      const trimmed = (name || 'TeleNest').trim();
      localStorage.setItem('telenest_software_name_v1', trimmed);
      const config = this.getCompanyConfig();
      config.softwareName = trimmed;
      this.saveCompanyConfig(config);
    } catch (e) {
      console.error('Error saving software name:', e);
    }
  }

  public resetSoftwareName(): void {
    try {
      localStorage.removeItem('telenest_software_name_v1');
      const config = this.getCompanyConfig();
      config.softwareName = 'TeleNest';
      this.saveCompanyConfig(config);
    } catch (e) {
      console.error('Error resetting software name:', e);
    }
  }

  // Find user by username, email, phone, recoveryEmail or Google ID
  public findUserByIdentifier(identifier: string): User | undefined {
    if (!identifier) return undefined;
    const clean = identifier.trim().toLowerCase();
    const cleanPhone = clean.replace(/[\s\-\+]/g, '');
    const all = this.getUsers();
    return all.find(
      (u) =>
        u.id?.toLowerCase() === clean ||
        u.username?.toLowerCase() === clean ||
        u.email?.toLowerCase() === clean ||
        u.recoveryEmail?.toLowerCase() === clean ||
        (u.phone && u.phone.replace(/[\s\-\+]/g, '') === cleanPhone) ||
        (u.googleId && u.googleId.toLowerCase() === clean)
    );
  }

  // Company Config
  public getCompanyConfig(): CompanyLetterheadConfig {
    const config = this.get<CompanyLetterheadConfig>(STORAGE_KEYS.COMPANY_CONFIG, INITIAL_COMPANY_CONFIG);
    return config && typeof config === 'object' ? config : INITIAL_COMPANY_CONFIG;
  }
  public saveCompanyConfig(config: CompanyLetterheadConfig): void {
    this.save(STORAGE_KEYS.COMPANY_CONFIG, config);
  }

  // Global Theme & Preferences Persistence
  public getGlobalTheme(): string {
    try {
      return localStorage.getItem(STORAGE_KEYS.GLOBAL_THEME) || 'theme-blue';
    } catch {
      return 'theme-blue';
    }
  }

  public saveGlobalTheme(theme: string): void {
    try {
      localStorage.setItem(STORAGE_KEYS.GLOBAL_THEME, theme);
    } catch (e) {
      console.warn('Failed to save global theme:', e);
    }
  }

  public getCustomPalette(): any {
    try {
      const saved = localStorage.getItem('telenest_custom_palette_v1');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  }

  public saveCustomPalette(palette: any): void {
    try {
      if (palette) {
        localStorage.setItem(
          'telenest_custom_palette_v1',
          typeof palette === 'string' ? palette : JSON.stringify(palette)
        );
      }
    } catch (e) {
      console.warn('Failed to save custom palette:', e);
    }
  }

  public getAutoSaveConfig(): any {
    try {
      const saved = localStorage.getItem('telenest_autosave_config_v1');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  }

  public saveAutoSaveConfig(config: any): void {
    try {
      if (config) {
        localStorage.setItem(
          'telenest_autosave_config_v1',
          typeof config === 'string' ? config : JSON.stringify(config)
        );
      }
    } catch (e) {
      console.warn('Failed to save autosave config:', e);
    }
  }

  public getSyncDestination(): string {
    try {
      return localStorage.getItem('telenest_sync_destination_v1') || 'internal';
    } catch {
      return 'internal';
    }
  }

  public saveSyncDestination(dest: string): void {
    try {
      localStorage.setItem('telenest_sync_destination_v1', dest);
    } catch (e) {
      console.warn('Failed to save sync destination:', e);
    }
  }

  public getNetworkStorageConfig(): NetworkStorageConfig {
    const defaultConfig: NetworkStorageConfig = {
      enabled: false,
      syncMode: 'auto',
      directoryPath: 'D:\\TeleNest_Sync_Depot',
      deviceLabel: 'External Portable / Network Storage Drive',
      lastSyncedAt: null,
      autoSyncIntervalMinutes: 30,
      includeAuditLogs: true,
      includeDailyWorkPhotos: true,
      includeArchivedUsers: true,
      externalDirectoryPath: 'D:\\TeleNest_Sync_Depot',
      storageLabel: 'External Portable / Network Storage Drive',
      autoSyncFrequency: 'manual',
      lastSyncTimestamp: undefined,
      lastSyncStatus: 'idle',
      includeAttachments: true,
    };
    try {
      const raw = localStorage.getItem('telenest_network_storage_config_v1');
      if (!raw) return defaultConfig;
      const parsed = JSON.parse(raw);
      return {
        ...defaultConfig,
        ...parsed,
        externalDirectoryPath: parsed.externalDirectoryPath || parsed.directoryPath || defaultConfig.externalDirectoryPath,
        storageLabel: parsed.storageLabel || parsed.deviceLabel || defaultConfig.storageLabel,
        autoSyncFrequency: parsed.autoSyncFrequency || (parsed.syncMode === 'auto' ? 'on_change' : 'manual'),
        lastSyncStatus: parsed.lastSyncStatus || 'idle',
        includeAttachments: parsed.includeAttachments ?? true,
      };
    } catch {
      return defaultConfig;
    }
  }

  public saveNetworkStorageConfig(config: NetworkStorageConfig): void {
    try {
      localStorage.setItem('telenest_network_storage_config_v1', JSON.stringify(config));
    } catch (e) {
      console.warn('Failed to save network storage config:', e);
    }
  }

  // Backup & Restore - Preserves 100% of data, settings, configurations, and preferences
  public exportFullBackup(): string {
    const backup = {
      app: 'TeleNest',
      developer: 'Bilal Ahmed',
      exportedAt: new Date().toISOString(),
      version: '1.0.0',
      data: {
        users: this.getUsers(),
        inventory: this.getInventory(),
        movements: this.getMovements(),
        ftth: this.getFTTH(),
        fttb: this.getFTTB(),
        fttm: this.getFTTM(),
        expenses: this.getExpenses(),
        projects: this.getProjects(),
        dailyWorks: this.getDailyWorks(),
        auditLogs: this.getAuditLogs(),
        exchangeRates: this.getExchangeRates(),
        companyConfig: this.getCompanyConfig(),
        customCategories: this.getCustomCategories(),
        globalTheme: this.getGlobalTheme(),
        customPalette: this.getCustomPalette(),
        autoSaveConfig: this.getAutoSaveConfig(),
        syncDestination: this.getSyncDestination(),
        archivedUsers: this.getArchivedUsers(),
        networkStorageConfig: (() => {
          try {
            const raw = localStorage.getItem('telenest_network_storage_config_v1');
            return raw ? JSON.parse(raw) : null;
          } catch {
            return null;
          }
        })(),
      },
    };
    return JSON.stringify(backup, null, 2);
  }

  public importFullBackup(jsonContent: string, importedByUser: User): boolean {
    try {
      const parsed = JSON.parse(jsonContent);
      if (!parsed.data || parsed.app !== 'TeleNest') {
        throw new Error('Invalid backup format or incompatible system manifest.');
      }

      if (parsed.data.users) this.saveUsers(parsed.data.users);
      if (parsed.data.archivedUsers) this.saveArchivedUsers(parsed.data.archivedUsers);
      if (parsed.data.inventory) this.saveInventory(parsed.data.inventory);
      if (parsed.data.customCategories) this.saveCustomCategories(parsed.data.customCategories);
      if (parsed.data.movements) this.saveMovements(parsed.data.movements);
      if (parsed.data.ftth) this.saveFTTH(parsed.data.ftth);
      if (parsed.data.fttb) this.saveFTTB(parsed.data.fttb);
      if (parsed.data.fttm) this.saveFTTM(parsed.data.fttm);
      if (parsed.data.expenses) this.saveExpenses(parsed.data.expenses);
      if (parsed.data.projects) this.saveProjects(parsed.data.projects);
      if (parsed.data.dailyWorks) this.saveDailyWorks(parsed.data.dailyWorks);
      if (parsed.data.auditLogs) this.save(STORAGE_KEYS.AUDIT_LOGS, parsed.data.auditLogs);
      if (parsed.data.exchangeRates) this.saveExchangeRates(parsed.data.exchangeRates);
      if (parsed.data.companyConfig) this.saveCompanyConfig(parsed.data.companyConfig);
      if (parsed.data.globalTheme) this.saveGlobalTheme(parsed.data.globalTheme);
      if (parsed.data.customPalette) this.saveCustomPalette(parsed.data.customPalette);
      if (parsed.data.autoSaveConfig) this.saveAutoSaveConfig(parsed.data.autoSaveConfig);
      if (parsed.data.syncDestination) this.saveSyncDestination(parsed.data.syncDestination);
      if (parsed.data.networkStorageConfig) {
        try {
          localStorage.setItem('telenest_network_storage_config_v1', JSON.stringify(parsed.data.networkStorageConfig));
        } catch (e) {
          console.warn('Could not restore networkStorageConfig:', e);
        }
      }

      this.logActivity({
        userId: importedByUser.id,
        userName: importedByUser.fullName,
        userRole: importedByUser.role,
        action: 'BACKUP_IMPORT',
        module: 'System',
        targetId: 'backup',
        description: `Successfully restored database from backup file dated ${parsed.exportedAt || 'unknown'}.`,
      });

      return true;
    } catch (err) {
      console.error('Failed to import backup:', err);
      return false;
    }
  }

  public createSafetySnapshot(): string {
    this.safetySnapshot = this.exportFullBackup();
    return this.safetySnapshot;
  }

  public getSafetySnapshot(): string | null {
    return this.safetySnapshot;
  }

  public restoreSafetySnapshot(user: User): boolean {
    if (!this.safetySnapshot) return false;
    return this.importFullBackup(this.safetySnapshot, user);
  }

  public importDatabaseWithStrategy(
    jsonContent: string,
    importedByUser: User,
    strategy: 'replace' | 'merge' | 'append' = 'replace'
  ): { success: boolean; message: string; stats?: any } {
    try {
      const parsed = JSON.parse(jsonContent);
      if (!parsed.data || parsed.app !== 'TeleNest') {
        throw new Error('Invalid backup format or missing TeleNest system manifest.');
      }

      // Automatically create a safety snapshot before any replacement
      if (strategy === 'replace') {
        this.createSafetySnapshot();
      }

      const incoming = parsed.data;

      if (strategy === 'replace') {
        // Complete replacement
        this.importFullBackup(jsonContent, importedByUser);
        return {
          success: true,
          message: 'Database successfully restored with full replacement.',
          stats: {
            strategy,
            inventory: incoming.inventory?.length || 0,
            movements: incoming.movements?.length || 0,
            projects: incoming.projects?.length || 0,
            expenses: incoming.expenses?.length || 0,
            dailyWorks: incoming.dailyWorks?.length || 0,
          },
        };
      }

      // Merge or Append strategies:
      // Helper for merge/append array of items by unique key
      const applyListStrategy = <T extends { id: string }>(
        currentList: T[],
        incomingList: T[] = [],
        keyField: keyof T = 'id'
      ): T[] => {
        if (!incomingList || incomingList.length === 0) return currentList;
        const currentMap = new Map<string, T>();
        currentList.forEach((item) => currentMap.set(String(item[keyField]), item));

        incomingList.forEach((item) => {
          const key = String(item[keyField]);
          if (strategy === 'merge') {
            // Overwrite existing or add new
            currentMap.set(key, { ...(currentMap.get(key) || {}), ...item });
          } else if (strategy === 'append') {
            // Only add if not present
            if (!currentMap.has(key)) {
              currentMap.set(key, item);
            }
          }
        });

        return Array.from(currentMap.values());
      };

      // 1. Inventory Items (merge by id or itemCode)
      if (incoming.inventory) {
        const mergedInventory = applyListStrategy(this.getInventory(), incoming.inventory, 'id');
        this.saveInventory(mergedInventory);
      }

      // 2. Custom categories
      if (incoming.customCategories) {
        const currentCats = new Set(this.getCustomCategories());
        incoming.customCategories.forEach((c: string) => currentCats.add(c));
        this.saveCustomCategories(Array.from(currentCats));
      }

      // 3. Movements
      if (incoming.movements) {
        const mergedMovements = applyListStrategy(this.getMovements(), incoming.movements, 'id');
        this.saveMovements(mergedMovements);
      }

      // 4. FTTH / FTTB / FTTM
      if (incoming.ftth) this.saveFTTH(applyListStrategy(this.getFTTH(), incoming.ftth, 'id'));
      if (incoming.fttb) this.saveFTTB(applyListStrategy(this.getFTTB(), incoming.fttb, 'id'));
      if (incoming.fttm) this.saveFTTM(applyListStrategy(this.getFTTM(), incoming.fttm, 'id'));

      // 5. Projects & Daily Works
      if (incoming.projects) this.saveProjects(applyListStrategy(this.getProjects(), incoming.projects, 'id'));
      if (incoming.dailyWorks) this.saveDailyWorks(applyListStrategy(this.getDailyWorks(), incoming.dailyWorks, 'id'));

      // 6. Expenses
      if (incoming.expenses) this.saveExpenses(applyListStrategy(this.getExpenses(), incoming.expenses, 'id'));

      // 7. Users (preserve CEO)
      if (incoming.users) {
        const mergedUsers = applyListStrategy(this.getUsers(), incoming.users, 'id');
        this.saveUsers(mergedUsers);
      }

      this.logActivity({
        userId: importedByUser.id,
        userName: importedByUser.fullName,
        userRole: importedByUser.role,
        action: 'BACKUP_IMPORT',
        module: 'System',
        targetId: 'backup_strategy',
        description: `Imported dataset using ${strategy.toUpperCase()} strategy dated ${parsed.exportedAt || 'unknown'}.`,
      });

      // Dispatch global window event for UI re-render
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('telenest:data-imported', { detail: { strategy } }));
      }

      return {
        success: true,
        message: `Database successfully updated via ${strategy.toUpperCase()} strategy.`,
        stats: {
          strategy,
          inventory: incoming.inventory?.length || 0,
          movements: incoming.movements?.length || 0,
          projects: incoming.projects?.length || 0,
          expenses: incoming.expenses?.length || 0,
        },
      };
    } catch (err: any) {
      console.error('Failed to import backup with strategy:', err);
      return { success: false, message: err?.message || 'Import failed.' };
    }
  }

  public resetOptionsAndSystemConfig(user: User): void {
    this.saveCompanyConfig(INITIAL_COMPANY_CONFIG);
    this.saveExchangeRates(DEFAULT_EXCHANGE_RATES);
    localStorage.removeItem(STORAGE_KEYS.GLOBAL_THEME);
    localStorage.removeItem('telenest_custom_palette_v1');
    localStorage.removeItem('telenest_autosave_config_v1');
    this.logActivity({
      userId: user.id,
      userName: user.fullName,
      userRole: user.role,
      action: 'SETTINGS_CHANGE',
      module: 'System',
      targetId: 'options_reset',
      description: 'System options, visual themes, currency rates, and company letterhead were reset to factory defaults.',
    });
  }

  /**
   * Permanently erases all saved work data from every software category/module:
   * Inventory items, stock movements, FTTH/FTTB/FTTM telecom sites, projects,
   * daily field activities & photos, and expense ledgers.
   *
   * PRESERVES:
   * - Software settings (themes, appearance, letterhead/companyConfig, autosave configuration)
   * - User accounts, credentials, roles, and operation permissions
   * - The Developer/CEO root authority account
   * - System configuration (currency exchange rates, SKU categories)
   */
  public eraseAllWorkData(user: User): void {
    // 1. Warehouse & Inventory
    this.save(STORAGE_KEYS.INVENTORY, []);
    this.save(STORAGE_KEYS.MOVEMENTS, []);

    // 2. ICT & Telecom Sites
    this.save(STORAGE_KEYS.FTTH, []);
    this.save(STORAGE_KEYS.FTTB, []);
    this.save(STORAGE_KEYS.FTTM, []);

    // 3. Projects & Daily Operations
    this.save(STORAGE_KEYS.PROJECTS, []);
    this.save(STORAGE_KEYS.DAILY_WORKS, []);

    // 4. Finance & Expenses
    this.save(STORAGE_KEYS.EXPENSES, []);

    // 5. System Audit Trail entry
    this.logActivity({
      userId: user.id,
      userName: user.fullName,
      userRole: user.role,
      action: 'DELETE',
      module: 'System',
      targetId: 'erase_work_data',
      description: 'Permanently erased all saved operational work data across all categories (Inventory, Stock Movements, FTTH, FTTB, FTTM, Projects, Daily Works, Expenses). System settings, user accounts, roles, and configuration were preserved.',
    });
  }

  public resetToFactoryDefaults(user: User): void {
    localStorage.clear();
    this.isInitialized = false;
    this.init();
    this.logActivity({
      userId: user.id,
      userName: user.fullName,
      userRole: user.role,
      action: 'SETTINGS_CHANGE',
      module: 'System',
      targetId: 'factory_reset',
      description: 'System database restored to default seed state.',
    });
  }
}

export const storage = new StorageService();
storage.init();
