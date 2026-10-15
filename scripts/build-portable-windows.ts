/**
 * Comprehensive Automated Build Script for TeleNest Windows Portable Software Package
 * Generates an end-to-end, zero-dependency, 100% offline portable software distribution
 * for Windows 11, Windows 10, Windows 8, and Windows 7 PC.
 *
 * Developer: Bilal Ahmed (bilalaxmed.47@gmail.com)
 */
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import XLSX from 'xlsx';

// Initialize mock localStorage for headless Node environment
const memoryStore: Record<string, string> = {};
(globalThis as any).localStorage = {
  getItem: (key: string) => memoryStore[key] ?? null,
  setItem: (key: string, value: string) => { memoryStore[key] = String(value); },
  removeItem: (key: string) => { delete memoryStore[key]; },
  clear: () => { Object.keys(memoryStore).forEach(k => delete memoryStore[k]); }
};

async function runBuild() {
  console.log('================================================================');
  console.log('  TELENEST PORTABLE SOFTWARE PACKAGE EXPORT FOR WINDOWS PC');
  console.log('  Developer & Systems Architect: Bilal Ahmed');
  console.log('================================================================\n');

  const ROOT_DIR = process.cwd();
  const DIST_DIR = path.join(ROOT_DIR, 'dist');
  const PORTABLE_DIR = path.join(ROOT_DIR, 'TeleNest-Portable');
  const DATA_DIR = path.join(PORTABLE_DIR, 'Data');
  const ASSETS_DIR = path.join(PORTABLE_DIR, 'Assets');
  const RESOURCES_DIR = path.join(PORTABLE_DIR, 'Resources');
  const LIBRARIES_DIR = path.join(PORTABLE_DIR, 'Libraries');
  const APP_SUBDIR = path.join(RESOURCES_DIR, 'app');
  const BACKUPS_DIR = path.join(DATA_DIR, 'backups');
  const PROFILE_DIR = path.join(DATA_DIR, 'Profile');
  const PUBLIC_DOWNLOADS_DIR = path.join(ROOT_DIR, 'public', 'downloads');
  const ZIP_OUTPUT_PATH = path.join(ROOT_DIR, 'TeleNest-Portable.zip');
  const PUBLIC_ZIP_OUTPUT_PATH = path.join(PUBLIC_DOWNLOADS_DIR, 'TeleNest-Portable.zip');

  // STEP 1: Compile the frontend with Vite
  console.log('[STEP 1/8] Compiling frontend application with Vite...');
  execSync('npm run build', { stdio: 'inherit', env: { ...process.env, VITE_PORTABLE_BUILD: 'true' } });

  // STEP 2: Import database storage service to retrieve the complete data snapshot
  console.log('\n[STEP 2/8] Extracting full master database snapshot and demo records...');
  const { storage } = await import('../src/services/storage');
  const { PortablePackageService } = await import('../src/services/portablePackageService');

  const backupJsonStr = storage.exportFullBackup();
  const backupData = JSON.parse(backupJsonStr);

  console.log(`- SKUs Tracked: ${backupData.data?.inventory?.length ?? 0}`);
  console.log(`- Movements Logged: ${backupData.data?.movements?.length ?? 0}`);
  console.log(`- FTTH Deployments: ${backupData.data?.ftth?.length ?? 0}`);
  console.log(`- Turnkey Projects: ${backupData.data?.projects?.length ?? 0}`);
  console.log(`- Operating Expenses: ${backupData.data?.expenses?.length ?? 0}`);
  console.log(`- Daily Work Logs: ${backupData.data?.dailyWorks?.length ?? 0}`);

  // Clean and prepare directory structure
  console.log('\n[STEP 3/8] Preparing directory hierarchy in TeleNest-Portable...');
  if (fs.existsSync(PORTABLE_DIR)) {
    fs.rmSync(PORTABLE_DIR, { recursive: true, force: true });
  }
  fs.mkdirSync(PORTABLE_DIR, { recursive: true });
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.mkdirSync(ASSETS_DIR, { recursive: true });
  fs.mkdirSync(RESOURCES_DIR, { recursive: true });
  fs.mkdirSync(LIBRARIES_DIR, { recursive: true });
  fs.mkdirSync(BACKUPS_DIR, { recursive: true });
  fs.mkdirSync(PROFILE_DIR, { recursive: true });
  fs.mkdirSync(APP_SUBDIR, { recursive: true });
  fs.mkdirSync(PUBLIC_DOWNLOADS_DIR, { recursive: true });

  // STEP 4: Copy dist files to Resources/app/
  console.log('\n[STEP 4/8] Copying production assets to portable Resources/app/ directory...');
  fs.cpSync(DIST_DIR, APP_SUBDIR, { recursive: true });
  if (fs.existsSync(path.join(APP_SUBDIR, 'downloads'))) {
    fs.rmSync(path.join(APP_SUBDIR, 'downloads'), { recursive: true, force: true });
  }

  // Read bundled assets for standalone single file
  const originalHtml = fs.readFileSync(path.join(DIST_DIR, 'index.html'), 'utf-8');
  const assetsDir = path.join(DIST_DIR, 'assets');
  let jsContent = '';
  let cssContent = '';

  if (fs.existsSync(assetsDir)) {
    const assetFiles = fs.readdirSync(assetsDir);
    for (const file of assetFiles) {
      const filePath = path.join(assetsDir, file);
      if (file.endsWith('.js') && !file.includes('legacy')) {
        jsContent += fs.readFileSync(filePath, 'utf-8') + '\n';
      } else if (file.endsWith('.css')) {
        cssContent += fs.readFileSync(filePath, 'utf-8') + '\n';
      }
    }
  }

  // Pre-seed script that ensures localStorage is fully loaded on ANY machine without internet
  const seedScript = `
<script id="telenest-offline-seeder">
(function() {
  try {
    var MASTER_SNAPSHOT = ${JSON.stringify(backupData)};
    var k = {
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
      CUSTOM_CATEGORIES: 'telenest_custom_categories_v1'
    };

    function seedIfMissing(key, data) {
      if (!localStorage.getItem(key) && data) {
        localStorage.setItem(key, typeof data === 'string' ? data : JSON.stringify(data));
      }
    }

    if (MASTER_SNAPSHOT && MASTER_SNAPSHOT.data) {
      var d = MASTER_SNAPSHOT.data;
      seedIfMissing(k.USERS, d.users);
      seedIfMissing(k.INVENTORY, d.inventory);
      seedIfMissing(k.MOVEMENTS, d.movements);
      seedIfMissing(k.FTTH, d.ftth);
      seedIfMissing(k.FTTB, d.fttb);
      seedIfMissing(k.FTTM, d.fttm);
      seedIfMissing(k.EXPENSES, d.expenses);
      seedIfMissing(k.PROJECTS, d.projects);
      seedIfMissing(k.DAILY_WORKS, d.dailyWorks);
      seedIfMissing(k.AUDIT_LOGS, d.auditLogs);
      seedIfMissing(k.EXCHANGE_RATES, d.exchangeRates);
      seedIfMissing(k.COMPANY_CONFIG, d.companyConfig);
      seedIfMissing(k.GLOBAL_THEME, d.globalTheme || 'theme-obsidian');
      seedIfMissing(k.CUSTOM_CATEGORIES, d.customCategories);

      if (!localStorage.getItem(k.CURRENT_USER) && d.users && d.users.length > 0) {
        localStorage.setItem(k.CURRENT_USER, JSON.stringify(d.users[0]));
      }
    }
  } catch(e) {
    console.warn('TeleNest offline seeder warning:', e);
  }
})();
</script>
`;

  // Inject seeder into app/index.html so server.ps1 serves pre-seeded app
  const appIndexHtmlPath = path.join(APP_SUBDIR, 'index.html');
  let appIndexHtml = fs.readFileSync(appIndexHtmlPath, 'utf-8');
  appIndexHtml = appIndexHtml.replace('</head>', `${seedScript}\n</head>`);
  fs.writeFileSync(appIndexHtmlPath, appIndexHtml, 'utf-8');

  // Build TeleNest-Offline-SingleFile.html
  console.log('\n[STEP 5/8] Generating fully inlined TeleNest-Offline-SingleFile.html...');
  let standaloneHtml = originalHtml
    .replace(/<link rel="stylesheet"[^>]*>/gi, '')
    .replace(/<script type="module"[^>]*><\/script>/gi, '');

  const safeJs = jsContent.replace(/<\/script/gi, '<\\/script').replace(/<!--/g, '<\\!--');
  const inlineStyleBlock = `<style id="telenest-portable-styles">\n${cssContent}\n</style>`;
  const inlineScriptBlock = `<script type="module" id="telenest-portable-app">\n${safeJs}\n</script>`;

  if (standaloneHtml.includes('</head>')) {
    standaloneHtml = standaloneHtml.replace('</head>', () => `${inlineStyleBlock}\n${seedScript}\n</head>`);
  } else {
    standaloneHtml = `${inlineStyleBlock}\n${seedScript}\n` + standaloneHtml;
  }

  if (standaloneHtml.includes('</body>')) {
    standaloneHtml = standaloneHtml.replace('</body>', () => `${inlineScriptBlock}\n</body>`);
  } else {
    standaloneHtml += `\n${inlineScriptBlock}`;
  }

  // Save Standalone Offline HTML into Resources/ and root
  fs.writeFileSync(path.join(RESOURCES_DIR, 'TeleNest.html'), standaloneHtml, 'utf-8');
  fs.writeFileSync(path.join(RESOURCES_DIR, 'TeleNest-Offline-SingleFile.html'), standaloneHtml, 'utf-8');
  fs.writeFileSync(path.join(RESOURCES_DIR, 'app.html'), standaloneHtml, 'utf-8');
  fs.writeFileSync(path.join(PORTABLE_DIR, 'TeleNest-Offline-SingleFile.html'), standaloneHtml, 'utf-8');
  fs.writeFileSync(path.join(PORTABLE_DIR, 'TeleNest.html'), standaloneHtml, 'utf-8');

  // STEP 6: Generate Master Data Files (Excel, JSON, CSV, SQL)
  console.log('\n[STEP 6/8] Generating data files and master spreadsheets in Data/...');
  // 1. JSON Master Database
  fs.writeFileSync(path.join(DATA_DIR, 'TeleNest_Database_Master.json'), JSON.stringify(backupData, null, 2), 'utf-8');

  // 2. Daily Work Report JSON
  const dailyWorkJson = PortablePackageService.generateDailyWorkReportJson(backupData);
  fs.writeFileSync(path.join(DATA_DIR, 'TeleNest_DailyWork_Report.json'), dailyWorkJson, 'utf-8');

  // 3. Multi-Sheet Master Excel Workbook (.xlsx)
  const excelBuffer = PortablePackageService.generateExcelWorkbook(backupData);
  fs.writeFileSync(path.join(DATA_DIR, 'TeleNest_Inventory_Report.xlsx'), Buffer.from(excelBuffer));

  // 4. Fleet Cash CSV
  const fleetCsv = PortablePackageService.generateFleetCashCsv(backupData);
  fs.writeFileSync(path.join(DATA_DIR, 'TeleNest_Fleet_Cash.csv'), fleetCsv, 'utf-8');

  // 5. Schema Dump SQL
  const schemaSql = PortablePackageService.generateSchemaDumpSql(backupData);
  fs.writeFileSync(path.join(DATA_DIR, 'TeleNest_Schema_Dump.sql'), schemaSql, 'utf-8');

  // 6. Config files inside Data/
  fs.writeFileSync(path.join(DATA_DIR, 'settings.json'), JSON.stringify({
    app: 'TeleNest',
    version: '1.0.0',
    edition: 'Windows Portable Enterprise',
    developer: 'Bilal Ahmed',
    homeCurrency: 'USD',
    defaultPort: 3000,
    offlineMode: true,
    autoSaveEnabled: true
  }, null, 2), 'utf-8');

  fs.writeFileSync(path.join(DATA_DIR, 'depot_config.ini'), `[Depot]
Name=TeleNest Central ICT Logistics
Location=Building 4B, ICT Industrial Technology Park
LeadEngineer=Bilal Ahmed
SystemMode=WindowsPortableStandalone
LocalPort=3000
BackupIntervalMinutes=30
`, 'utf-8');

  // 7. Data README.txt
  fs.writeFileSync(path.join(DATA_DIR, 'README.txt'), `TeleNest Master Data Repository
=================================================================
This folder contains the complete offline master database for TeleNest:
- TeleNest_Database_Master.json: Complete JSON database snapshot
- TeleNest_Inventory_Report.xlsx: 5-Sheet Executive Excel Workbook
- TeleNest_DailyWork_Report.json: Field Operations & Splicing log
- TeleNest_Fleet_Cash.csv: Fleet Fuel & Site Travel Ledger
- TeleNest_Schema_Dump.sql: Relational SQL Tables & Insert Scripts
- settings.json: Application persistence preferences
- depot_config.ini: Depot & Logistics configuration
- backups/: Automatic timestamped snapshots created during server runs
- Profile/: 100% portable browser cache and local database directory
`, 'utf-8');

  // STEP 7: Generate Configuration & Launchers
  console.log('\n[STEP 7/8] Generating native Windows launchers, C# source, and micro-server...');

  // Icons and assets
  if (fs.existsSync(path.join(ROOT_DIR, 'TeleNest.ico'))) {
    fs.copyFileSync(path.join(ROOT_DIR, 'TeleNest.ico'), path.join(PORTABLE_DIR, 'TeleNest.ico'));
    fs.copyFileSync(path.join(ROOT_DIR, 'TeleNest.ico'), path.join(ASSETS_DIR, 'TeleNest.ico'));
    fs.copyFileSync(path.join(ROOT_DIR, 'TeleNest.ico'), path.join(PUBLIC_DOWNLOADS_DIR, 'TeleNest.ico'));
  }

  // Native Win32 Executable Compilation with embedded icon and Windows Manifest
  console.log('\n[STEP 7.1] Compiling genuine native Windows executable (TeleNest.exe) with embedded icon & manifest...');
  const launcherDir = path.join(ROOT_DIR, 'scripts', 'launcher');
  try {
    if (fs.existsSync(path.join(launcherDir, 'main.c'))) {
      execSync('cd scripts/launcher && x86_64-w64-mingw32-windres app.rc -O coff -o app-x64.res && x86_64-w64-mingw32-gcc -O2 -mwindows -Wl,--dynamicbase -Wl,--nxcompat -Wl,--high-entropy-va main.c app-x64.res -o TeleNest.exe', { stdio: 'inherit' });
      
      fs.copyFileSync(path.join(launcherDir, 'TeleNest.exe'), path.join(PORTABLE_DIR, 'TeleNest.exe'));
      fs.copyFileSync(path.join(launcherDir, 'TeleNest.exe'), path.join(ROOT_DIR, 'TeleNest.exe'));
      fs.copyFileSync(path.join(launcherDir, 'TeleNest.exe'), path.join(PUBLIC_DOWNLOADS_DIR, 'TeleNest.exe'));
      console.log(' [SUCCESS] TeleNest.exe (x64) compiled cleanly with embedded manifest and official icon!');
    }
  } catch (compErr) {
    console.warn(' [WARNING] Native compiler error:', compErr);
  }

  const logoSvg = PortablePackageService.getTeleNestLogoSvg();
  fs.writeFileSync(path.join(ASSETS_DIR, 'TeleNest-Logo.svg'), logoSvg, 'utf-8');

  // C# Source for Native EXE compilation placed in Libraries/
  const csharpSource = PortablePackageService.generateCSharpSource();
  fs.writeFileSync(path.join(LIBRARIES_DIR, 'TeleNestLauncher.cs'), csharpSource, 'utf-8');
  fs.writeFileSync(path.join(PORTABLE_DIR, 'TeleNestLauncher.cs'), csharpSource, 'utf-8');

  // 1. server.ps1 - Pure PowerShell micro-server with local REST API and auto-launcher
  const serverPs1 = `# ===============================================================================
# TeleNest Zero-Dependency Windows Local Micro-Server & REST API
# Compatible with: Windows 11, Windows 10, Windows 8.1, Windows 7 SP1
# Architect: Bilal Ahmed (bilalaxmed.47@gmail.com)
# ===============================================================================

$ErrorActionPreference = "SilentlyContinue"
$Port = 3000
$RootPath = Join-Path $PSScriptRoot "app"
if (-not (Test-Path $RootPath)) {
    $RootPath = $PSScriptRoot
}
$DataPath = Join-Path $PSScriptRoot "data"
$DbFile = Join-Path $DataPath "TeleNest_Database_Master.json"
$BackupsPath = Join-Path $DataPath "backups"
if (-not (Test-Path $BackupsPath)) {
    New-Item -ItemType Directory -Path $BackupsPath -Force | Out-Null
}

# Test if port is available; fallback to 3001 or 8080 if needed
$listener = New-Object System.Net.HttpListener
$prefixes = @("http://localhost:$Port/", "http://127.0.0.1:$Port/")
$bound = $false

foreach ($prefix in $prefixes) {
    try {
        $listener.Prefixes.Clear()
        $listener.Prefixes.Add($prefix)
        $listener.Start()
        $bound = $true
        break
    } catch {
        # Try next
    }
}

if (-not $bound) {
    $Port = 3001
    $listener.Prefixes.Clear()
    $listener.Prefixes.Add("http://localhost:$Port/")
    try {
        $listener.Start()
        $bound = $true
    } catch {
        $Port = 8080
        $listener.Prefixes.Clear()
        $listener.Prefixes.Add("http://localhost:$Port/")
        $listener.Start()
    }
}

$url = "http://localhost:$Port/"

Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host "  TeleNest ICT & Warehouse System - Windows Portable Engine" -ForegroundColor White
Write-Host "  Developer: Bilal Ahmed (bilalaxmed.47@gmail.com)" -ForegroundColor Gray
Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host " [*] Local Server Active: $url" -ForegroundColor Green
Write-Host " [*] Serving Directory:   $RootPath" -ForegroundColor DarkGray
Write-Host " [*] Press Ctrl+C in this window to stop the server." -ForegroundColor Yellow
Write-Host ""

# Launch browser in Native App Mode (--app)
$edgePath = "\${env:ProgramFiles(x86)}\\Microsoft\\Edge\\Application\\msedge.exe"
if (-not (Test-Path $edgePath)) {
    $edgePath = "$env:ProgramFiles\\Microsoft\\Edge\\Application\\msedge.exe"
}
$chromePath = "$env:ProgramFiles\\Google\\Chrome\\Application\\chrome.exe"
if (-not (Test-Path $chromePath)) {
    $chromePath = "\${env:ProgramFiles(x86)}\\Google\\Chrome\\Application\\chrome.exe"
}

if ($bound) {
    # Warm up HTTP listener socket before launching browser to avoid connection reset
    Start-Sleep -Milliseconds 800
    if (Test-Path $edgePath) {
        Start-Process $edgePath -ArgumentList "--app=$url", "--window-size=1440,900", "--window-position=50,30"
    } elseif (Test-Path $chromePath) {
        Start-Process $chromePath -ArgumentList "--app=$url", "--window-size=1440,900", "--window-position=50,30"
    } else {
        Start-Process $url
    }
} else {
    Write-Host " [!] HTTP Listener restricted by Windows permissions. Falling back to Standalone App..." -ForegroundColor Yellow
    $singleFile = Join-Path $PSScriptRoot "TeleNest-Offline-SingleFile.html"
    if (Test-Path $singleFile) {
        $fileUrl = "file:///" + $singleFile.Replace('\\', '/')
        if (Test-Path $edgePath) {
            Start-Process $edgePath -ArgumentList "--app=$fileUrl", "--window-size=1440,900"
        } elseif (Test-Path $chromePath) {
            Start-Process $chromePath -ArgumentList "--app=$fileUrl", "--window-size=1440,900"
        } else {
            Start-Process $singleFile
        }
    }
}

$mimeTypes = @{
    ".html"  = "text/html; charset=utf-8"
    ".htm"   = "text/html; charset=utf-8"
    ".js"    = "application/javascript; charset=utf-8"
    ".mjs"   = "application/javascript; charset=utf-8"
    ".css"   = "text/css; charset=utf-8"
    ".json"  = "application/json; charset=utf-8"
    ".svg"   = "image/svg+xml"
    ".png"   = "image/png"
    ".jpg"   = "image/jpeg"
    ".jpeg"  = "image/jpeg"
    ".gif"   = "image/gif"
    ".webp"  = "image/webp"
    ".ico"   = "image/x-icon"
    ".woff"  = "font/woff"
    ".woff2" = "font/woff2"
    ".ttf"   = "font/ttf"
    ".txt"   = "text/plain; charset=utf-8"
    ".csv"   = "text/csv; charset=utf-8"
    ".xlsx"  = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
}

try {
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response
        $response.AddHeader("Access-Control-Allow-Origin", "*")
        $response.AddHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        $response.AddHeader("Access-Control-Allow-Headers", "Content-Type")

        if ($request.HttpMethod -eq "OPTIONS") {
            $response.StatusCode = 200
            $response.Close()
            continue
        }

        $rawUrl = $request.Url.LocalPath

        # REST API Endpoints for Local Persistence
        if ($rawUrl -eq "/api/health") {
            $json = '{"status":"ok","mode":"windows-portable","app":"TeleNest","developer":"Bilal Ahmed"}'
            $bytes = [System.Text.Encoding]::UTF8.GetBytes($json)
            $response.ContentType = "application/json; charset=utf-8"
            $response.ContentLength64 = $bytes.Length
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
            $response.Close()
            continue
        }

        if ($rawUrl -eq "/api/data") {
            if ($request.HttpMethod -eq "GET") {
                if (Test-Path $DbFile) {
                    $bytes = [System.IO.File]::ReadAllBytes($DbFile)
                    $response.ContentType = "application/json; charset=utf-8"
                    $response.ContentLength64 = $bytes.Length
                    $response.OutputStream.Write($bytes, 0, $bytes.Length)
                } else {
                    $response.StatusCode = 404
                }
                $response.Close()
                continue
            } elseif ($request.HttpMethod -eq "POST") {
                $reader = New-Object System.IO.StreamReader($request.InputStream, [System.Text.Encoding]::UTF8)
                $body = $reader.ReadToEnd()
                [System.IO.File]::WriteAllText($DbFile, $body, [System.Text.Encoding]::UTF8)
                
                # Timestamped backup
                $ts = (Get-Date).ToString("yyyyMMdd_HHmmss")
                $bak = Join-Path $BackupsPath "TeleNest_Database_$ts.json"
                [System.IO.File]::WriteAllText($bak, $body, [System.Text.Encoding]::UTF8)
                
                $ack = '{"status":"saved","timestamp":"' + $ts + '"}'
                $bytes = [System.Text.Encoding]::UTF8.GetBytes($ack)
                $response.ContentType = "application/json; charset=utf-8"
                $response.ContentLength64 = $bytes.Length
                $response.OutputStream.Write($bytes, 0, $bytes.Length)
                $response.Close()
                continue
            }
        }

        # Static File Serving
        if ($rawUrl -eq "/" -or $rawUrl -eq "") {
            $rawUrl = "/index.html"
        }

        $cleanPath = $rawUrl.TrimStart('/').Replace('/', [System.IO.Path]::DirectorySeparatorChar)
        $filePath = Join-Path $RootPath $cleanPath

        if (Test-Path $filePath -PathType Leaf) {
            $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
            $contentType = $mimeTypes[$ext]
            if (-not $contentType) { $contentType = "application/octet-stream" }

            $response.ContentType = $contentType
            $response.AddHeader("Cache-Control", "no-cache")

            $bytes = [System.IO.File]::ReadAllBytes($filePath)
            $response.ContentLength64 = $bytes.Length
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
        } else {
            # SPA Fallback to index.html
            $fallback = Join-Path $RootPath "index.html"
            if (Test-Path $fallback) {
                $response.ContentType = "text/html; charset=utf-8"
                $bytes = [System.IO.File]::ReadAllBytes($fallback)
                $response.ContentLength64 = $bytes.Length
                $response.OutputStream.Write($bytes, 0, $bytes.Length)
            } else {
                $response.StatusCode = 404
            }
        }
        $response.Close()
    }
} finally {
    $listener.Stop()
    $listener.Close()
}
`;
  fs.writeFileSync(path.join(LIBRARIES_DIR, 'server.ps1'), serverPs1, 'utf-8');
  fs.writeFileSync(path.join(PORTABLE_DIR, 'server.ps1'), serverPs1, 'utf-8');

  // 2. TeleNest.bat - Primary 1-Click Interactive Launcher
  const teleNestBat = `@echo off
setlocal enabledelayedexpansion
title TeleNest ICT & Warehouse Management System - Portable Edition
chcp 65001 >nul 2>&1
color 0B
cls

echo ===============================================================================
echo     ######## ######## ##       ######## ##    ## ########  ######  ######## 
echo        ##    ##       ##       ##       ###   ## ##       ##    ##    ##    
echo        ##    ##       ##       ##       ####  ## ##       ##          ##    
echo        ##    ######   ##       ######   ## ## ## ######    ######     ##    
echo        ##    ##       ##       ##       ##  #### ##             ##    ##    
echo        ##    ##       ##       ##       ##   ### ##       ##    ##    ##    
echo        ##    ######## ######## ######## ##    ## ########  ######     ##    
echo ===============================================================================
echo            PORTABLE SOFTWARE PACKAGE FOR WINDOWS 11 / 10 / 8 / 7
echo              TeleNest ICT Logistics & Operations Architecture
echo                           Developer: Bilal Ahmed
echo ===============================================================================
echo.

set "SCRIPT_DIR=%~dp0"
cd /d "!SCRIPT_DIR!"

:: If native TeleNest.exe already exists, launch it directly!
if exist "!SCRIPT_DIR!TeleNest.exe" (
    echo [*] Found compiled native TeleNest.exe! Launching standalone executable...
    start "" "!SCRIPT_DIR!TeleNest.exe"
    exit /b 0
)

:: Check if Microsoft .NET C# compiler (csc.exe) is available to auto-compile TeleNest.exe
set "CSC_EXE="
if exist "%SystemRoot%\\Microsoft.NET\\Framework64\\v4.0.30319\\csc.exe" (
    set "CSC_EXE=%SystemRoot%\\Microsoft.NET\\Framework64\\v4.0.30319\\csc.exe"
) else if exist "%SystemRoot%\\Microsoft.NET\\Framework\\v4.0.30319\\csc.exe" (
    set "CSC_EXE=%SystemRoot%\\Microsoft.NET\\Framework\\v4.0.30319\\csc.exe"
)

if defined CSC_EXE if exist "!SCRIPT_DIR!Libraries\\TeleNestLauncher.cs" (
    echo [*] Windows .NET C# compiler located. Auto-compiling native TeleNest.exe...
    set "ICON_ARG="
    if exist "!SCRIPT_DIR!Assets\\TeleNest.ico" set "ICON_ARG=/win32icon:\\"!SCRIPT_DIR!Assets\\TeleNest.ico\\""
    "!CSC_EXE!" /target:winexe /optimize+ !ICON_ARG! /r:System.dll /r:System.Windows.Forms.dll /r:System.Drawing.dll /out:"!SCRIPT_DIR!TeleNest.exe" "!SCRIPT_DIR!Libraries\\TeleNestLauncher.cs" >nul 2>&1
    if exist "!SCRIPT_DIR!TeleNest.exe" (
        echo [SUCCESS] TeleNest.exe compiled! Launching native executable...
        start "" "!SCRIPT_DIR!TeleNest.exe"
        exit /b 0
    )
)

:: Fallback: Start zero-dependency local PowerShell micro-server
echo [1/2] Initializing zero-dependency local portable server...
if exist "!SCRIPT_DIR!Libraries\\server.ps1" (
    powershell -NoProfile -ExecutionPolicy Bypass -File "!SCRIPT_DIR!Libraries\\server.ps1"
) else if exist "!SCRIPT_DIR!server.ps1" (
    powershell -NoProfile -ExecutionPolicy Bypass -File "!SCRIPT_DIR!server.ps1"
)

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [NOTICE] PowerShell server was interrupted or restricted by Windows policy.
    echo Opening Standalone Single-File Offline Edition directly in default browser...
    if exist "!SCRIPT_DIR!Resources\\TeleNest.html" (
        start "" "!SCRIPT_DIR!Resources\\TeleNest.html"
    ) else (
        start "" "!SCRIPT_DIR!TeleNest-Offline-SingleFile.html"
    )
)
pause
`;
  fs.writeFileSync(path.join(PORTABLE_DIR, 'TeleNest.bat'), teleNestBat, 'utf-8');
  fs.writeFileSync(path.join(PORTABLE_DIR, 'TeleNest.cmd'), teleNestBat, 'utf-8');
  fs.writeFileSync(path.join(LIBRARIES_DIR, 'TeleNest.bat'), teleNestBat, 'utf-8');

  // 3. Build-Native-EXE.bat - 1-Click Native C# Compiler
  const buildNativeExeBat = PortablePackageService.generateBuildNativeExeBat();
  fs.writeFileSync(path.join(LIBRARIES_DIR, 'Build-Native-EXE.bat'), buildNativeExeBat, 'utf-8');
  fs.writeFileSync(path.join(PORTABLE_DIR, 'Build-Native-EXE.bat'), buildNativeExeBat, 'utf-8');

  // 4. Setup-And-Start-Exe.bat
  const setupAndStartBat = PortablePackageService.generateSetupAndStartBat();
  fs.writeFileSync(path.join(LIBRARIES_DIR, 'Setup-And-Start-Exe.bat'), setupAndStartBat, 'utf-8');
  fs.writeFileSync(path.join(PORTABLE_DIR, 'Setup-And-Start-Exe.bat'), setupAndStartBat, 'utf-8');

  // 5. TeleNest-App-Mode.bat
  const appModeBat = `@echo off
title TeleNest Portable Desktop App Mode
cd /d "%~dp0"
echo Starting TeleNest in Native Desktop Window Mode...
if exist "%~dp0Libraries\\server.ps1" (
    powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0Libraries\\server.ps1"
) else (
    powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0server.ps1"
)
`;
  fs.writeFileSync(path.join(LIBRARIES_DIR, 'TeleNest-App-Mode.bat'), appModeBat, 'utf-8');
  fs.writeFileSync(path.join(PORTABLE_DIR, 'TeleNest-App-Mode.bat'), appModeBat, 'utf-8');

  // 6. Create-Desktop-Shortcut.bat & Install-Shortcut.bat
  const createShortcutBat = `@echo off
setlocal enabledelayedexpansion
title TeleNest - Create Desktop Shortcut
chcp 65001 >nul 2>&1
color 0B
cls

echo ===============================================================================
echo     TeleNest - Creating Windows Desktop Shortcut
echo ===============================================================================
echo.

set "SCRIPT_DIR=%~dp0"
cd /d "!SCRIPT_DIR!"

set "APP_FILE=!SCRIPT_DIR!TeleNest.exe"
if not exist "!APP_FILE!" set "APP_FILE=!SCRIPT_DIR!Resources\\TeleNest.html"
if not exist "!APP_FILE!" set "APP_FILE=!SCRIPT_DIR!TeleNest-Offline-SingleFile.html"

set "ICON_FILE=!SCRIPT_DIR!Assets\\TeleNest.ico"
if not exist "!ICON_FILE!" set "ICON_FILE=!SCRIPT_DIR!TeleNest.ico"

set "DESKTOP_DIR=%USERPROFILE%\\Desktop"

:: Create standard Windows URL shortcut on Desktop (100% clean, native Windows format)
(
echo [InternetShortcut]
echo URL=file:///!APP_FILE:\\=/!
echo IconFile=!ICON_FILE!
echo IconIndex=0
) > "!DESKTOP_DIR!\\TeleNest ICT Enterprise.url"

echo [SUCCESS] Desktop Shortcut 'TeleNest ICT Enterprise' created on your Windows Desktop!
echo [SUCCESS] Target: !APP_FILE!
echo.
echo Launch TeleNest now? (Y/N)
set /p CHOICE="Press Y to start software, or any other key to exit: "
if /i "!CHOICE!"=="Y" (
    start "" "!APP_FILE!"
)
exit /b 0
`;
  fs.writeFileSync(path.join(LIBRARIES_DIR, 'Create-Desktop-Shortcut.bat'), createShortcutBat, 'utf-8');
  fs.writeFileSync(path.join(PORTABLE_DIR, 'Create-Desktop-Shortcut.bat'), createShortcutBat, 'utf-8');

  const installShortcutBat = PortablePackageService.generateInstallShortcutBat();
  fs.writeFileSync(path.join(LIBRARIES_DIR, 'Install-Shortcut.bat'), installShortcutBat, 'utf-8');

  // 7. TeleNest-AutoSave-Sync.bat
  const autoSaveSyncBat = PortablePackageService.generateAutoSaveSyncBat();
  fs.writeFileSync(path.join(LIBRARIES_DIR, 'TeleNest-AutoSave-Sync.bat'), autoSaveSyncBat, 'utf-8');

  // 8. Run-Local-Server.bat
  const runLocalServerBat = PortablePackageService.generateRunLocalServerBat();
  fs.writeFileSync(path.join(LIBRARIES_DIR, 'Run-Local-Server.bat'), runLocalServerBat, 'utf-8');

  // 9. Start-TeleNest-Win11.ps1
  const startPs1 = PortablePackageService.generatePowerShellRunner();
  fs.writeFileSync(path.join(LIBRARIES_DIR, 'Start-TeleNest-Win11.ps1'), startPs1, 'utf-8');

  // 10. Open-Offline-Browser.bat
  const openOfflineBat = `@echo off
title TeleNest Offline Direct Browser Launch
cd /d "%~dp0"
echo Opening TeleNest Standalone Single-File Edition in default browser...
if exist "%~dp0Resources\\TeleNest.html" (
    start "" "%~dp0Resources\\TeleNest.html"
) else (
    start "" "%~dp0TeleNest-Offline-SingleFile.html"
)
`;
  fs.writeFileSync(path.join(LIBRARIES_DIR, 'Open-Offline-Browser.bat'), openOfflineBat, 'utf-8');

  // 11. TeleNest.url (Standard Windows Internet Shortcut)
  fs.writeFileSync(path.join(PORTABLE_DIR, 'TeleNest.url'), PortablePackageService.generateInternetShortcut(), 'utf-8');

  // 12. Windows11-Deployment-Guide.html
  const guideHtml = PortablePackageService.generateWindows11DeploymentGuideHtml(backupData);
  fs.writeFileSync(path.join(LIBRARIES_DIR, 'Windows11-Deployment-Guide.html'), guideHtml, 'utf-8');
  fs.writeFileSync(path.join(PORTABLE_DIR, 'Windows11-Deployment-Guide.html'), guideHtml, 'utf-8');

  // 15. Documentation files
  const howToRunTxt = `================================================================================
           TELENEST - WAREHOUSE & ICT INVENTORY SYSTEM (PORTABLE EDITION)
                             Developed by Bilal Ahmed
================================================================================

This package is a 100% COMPLETE PORTABLE SOFTWARE PACKAGE for Windows PC.
You do NOT need to install Node.js, npm, Python, or administrator software.
You can run this directly from any folder, Desktop, or a USB Flash Drive!

--------------------------------------------------------------------------------
HOW TO RUN ON WINDOWS PC:
--------------------------------------------------------------------------------

PRIMARY METHOD: (NATIVE STANDALONE EXECUTABLE)
  - Double-click "TeleNest.exe" in this folder!
  - It runs instantly without any installation or administrator rights.
  - Automatically initializes local Data/Profile storage.
  - Uses strictly relative paths so you can copy this folder to any Windows PC.

ALTERNATIVE METHOD 1: (1-CLICK BATCH LAUNCHER)
  - Double-click "TeleNest.bat" (or "TeleNest.cmd")
  - Launches TeleNest.exe or starts the local portable engine.

ALTERNATIVE METHOD 2: (CREATE DESKTOP SHORTCUT)
  - Double-click "Create-Desktop-Shortcut.bat" (or inside Libraries/)
  - Creates a desktop shortcut named "TeleNest ICT Enterprise".

ALTERNATIVE METHOD 3: (DIRECT OFFLINE HTML BROWSER)
  - Double-click "TeleNest-Offline-SingleFile.html" or "Resources/TeleNest.html"
  - Opens instantly in your web browser with complete offline database.

--------------------------------------------------------------------------------
FOLDER STRUCTURE:
--------------------------------------------------------------------------------
TeleNest-Portable/
├── TeleNest.exe                 <- Native Windows standalone executable
├── TeleNest.bat                 <- Windows command launcher
├── TeleNest.url                 <- Windows shortcut
├── TeleNest-Offline-SingleFile.html <- Standalone inlined offline app
├── HOW-TO-RUN.txt               <- Quick-start instructions
├── README.txt                   <- Complete system documentation
├── PORTABLE-INFO.md             <- Technical architecture overview
├── Data/                        <- Local database, reports, settings, and profile
│   ├── TeleNest_Database_Master.json
│   ├── TeleNest_Inventory_Report.xlsx
│   ├── TeleNest_DailyWork_Report.json
│   ├── TeleNest_Fleet_Cash.csv
│   ├── TeleNest_Schema_Dump.sql
│   ├── settings.json
│   ├── depot_config.ini
│   ├── backups/
│   └── Profile/                 <- Isolated portable browser storage
├── Assets/                      <- Application icons, logos, and visual assets
│   ├── TeleNest.ico
│   └── TeleNest-Logo.svg
├── Resources/                   <- Offline HTML applications & production assets
│   ├── TeleNest.html
│   ├── TeleNest-Offline-SingleFile.html
│   ├── app.html
│   └── app/                     <- Production web client files
└── Libraries/                   <- Auxiliary tools, micro-server & compiler scripts
    ├── server.ps1
    ├── TeleNestLauncher.cs
    ├── Build-Native-EXE.bat
    ├── Run-Local-Server.bat
    ├── Create-Desktop-Shortcut.bat
    └── Windows11-Deployment-Guide.html

--------------------------------------------------------------------------------
SYSTEM REQUIREMENTS:
--------------------------------------------------------------------------------
- OS: Windows 11, Windows 10, Windows 8.1, or Windows 7 SP1.
- Architecture: x64, x86, or ARM64.
- RAM: 512 MB minimum.
- Disk Space: ~15 MB.
- Internet Connection: Not required (100% Offline-Ready).

================================================================================
`;
  fs.writeFileSync(path.join(PORTABLE_DIR, 'HOW-TO-RUN.txt'), howToRunTxt, 'utf-8');
  fs.writeFileSync(path.join(PORTABLE_DIR, 'README.txt'), howToRunTxt, 'utf-8');

  const portableInfoMd = `# TeleNest ICT & Warehouse Inventory System - Windows Portable Edition

**Developed by:** Bilal Ahmed (bilalaxmed.47@gmail.com)  
**Platform:** Windows 11 / Windows 10 / Windows 8 / Windows 7 (x64 / x86 / ARM64)  
**Deployment Type:** Complete Portable Software Package (Zero-Install)  

## Key Features of the Portable Version

1. **Zero External Dependencies**:
   - Native standalone \`TeleNest.exe\` included.
   - No Node.js required.
   - No npm, python, or runtime installation required.
   - No administrative privileges or registry entries needed.
   - Runs directly off USB flash drives, network shares, or local folders.

2. **Self-Contained Portable Architecture**:
   - All user data and sessions stored inside \`Data/\`.
   - All assets stored inside \`Assets/\`.
   - All web resources stored inside \`Resources/\`.
   - All auxiliary server and build scripts stored inside \`Libraries/\`.
   - Uses relative paths exclusively: works seamlessly when copied to any location or computer.

3. **Complete Functional Suite**:
   - Master Inventory Tracking across 15 telecom & ICT categories
   - Stock Movements (IN, OUT, DISPATCH, TRANSFER, ADJUSTMENT)
   - FTTH/FTTB/FTTM fiber rollouts with optical power calculations
   - Turnkey project milestone tracking
   - Operating expenses and fleet logistics ledger
   - Daily work reporting and technician logs
   - Material Gate Pass PDF generation with digital signature blocks
   - QR code generation and live barcode scanning
   - Multi-tab Executive Excel (.xlsx) workbook export
   - Relational SQL schema dump export
`;
  fs.writeFileSync(path.join(PORTABLE_DIR, 'PORTABLE-INFO.md'), portableInfoMd, 'utf-8');

  // STEP 8: Create ZIP Archive
  console.log('\n[STEP 8/8] Packaging TeleNest-Portable into ZIP archive...');
  if (fs.existsSync(ZIP_OUTPUT_PATH)) {
    fs.unlinkSync(ZIP_OUTPUT_PATH);
  }

  execSync(`python3 -m zipfile -c "${ZIP_OUTPUT_PATH}" "TeleNest-Portable"`, { stdio: 'inherit' });
  fs.copyFileSync(ZIP_OUTPUT_PATH, PUBLIC_ZIP_OUTPUT_PATH);

  // Also ensure dist/downloads gets copies if dist exists
  if (fs.existsSync(path.join(ROOT_DIR, 'dist', 'downloads'))) {
    fs.copyFileSync(ZIP_OUTPUT_PATH, path.join(ROOT_DIR, 'dist', 'downloads', 'TeleNest-Portable.zip'));
    if (fs.existsSync(path.join(PORTABLE_DIR, 'TeleNest.exe'))) {
      fs.copyFileSync(path.join(PORTABLE_DIR, 'TeleNest.exe'), path.join(ROOT_DIR, 'dist', 'downloads', 'TeleNest.exe'));
    }
  }

  const zipStats = fs.statSync(ZIP_OUTPUT_PATH);
  console.log('\n================================================================');
  console.log('  PORTABLE SOFTWARE PACKAGE EXPORT COMPLETED SUCCESSFULLY!');
  console.log('================================================================');
  console.log(`- Folder:   ${PORTABLE_DIR}`);
  console.log(`- Root ZIP: ${ZIP_OUTPUT_PATH} (${(zipStats.size / 1024 / 1024).toFixed(2)} MB)`);
  console.log(`- Web ZIP:  ${PUBLIC_ZIP_OUTPUT_PATH}`);
  console.log('================================================================\n');
}

runBuild().catch((err) => {
  console.error('Portable build failed:', err);
  process.exit(1);
});
