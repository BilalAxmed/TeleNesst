import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const ROOT_DIR = process.cwd();
const DIST_DIR = path.join(ROOT_DIR, 'dist');
const PORTABLE_DIR = path.join(ROOT_DIR, 'TeleNest-Windows-Portable');
const PUBLIC_DOWNLOADS_DIR = path.join(ROOT_DIR, 'public', 'downloads');
const ZIP_OUTPUT_PATH = path.join(ROOT_DIR, 'TeleNest-Windows-Portable.zip');
const PUBLIC_ZIP_OUTPUT_PATH = path.join(PUBLIC_DOWNLOADS_DIR, 'TeleNest-Windows-Portable.zip');

console.log('=== Step 1: Building latest production web app ===');
execSync('npm run build', { stdio: 'inherit' });

if (!fs.existsSync(DIST_DIR)) {
  console.error('Error: dist directory does not exist!');
  process.exit(1);
}

const htmlPath = path.join(DIST_DIR, 'index.html');
const assetsDir = path.join(DIST_DIR, 'assets');
const assetFiles = fs.readdirSync(assetsDir);

let cssContent = '';
let jsContent = '';

for (const file of assetFiles) {
  const filePath = path.join(assetsDir, file);
  if (file.endsWith('.css')) {
    cssContent += fs.readFileSync(filePath, 'utf-8') + '\n';
  } else if (file.endsWith('.js')) {
    jsContent += fs.readFileSync(filePath, 'utf-8') + '\n';
  }
}

console.log(`Found CSS: ${(cssContent.length / 1024).toFixed(1)} KB, JS: ${(jsContent.length / 1024).toFixed(1)} KB`);

console.log('=== Step 2: Creating Standalone Offline Single-File HTML ===');
let originalHtml = fs.readFileSync(htmlPath, 'utf-8');

// Strip out external stylesheet and script links
let standaloneHtml = originalHtml
  .replace(/<link rel="stylesheet"[^>]*>/gi, '')
  .replace(/<script type="module"[^>]*><\/script>/gi, '');

// Inject inlined styles and bundled script
const inlineStyleBlock = `<style id="telenest-portable-styles">\n${cssContent}\n</style>`;
const inlineScriptBlock = `<script type="module" id="telenest-portable-app">\n${jsContent}\n</script>`;

standaloneHtml = standaloneHtml.replace('</head>', `${inlineStyleBlock}\n</head>`);
standaloneHtml = standaloneHtml.replace('</body>', `${inlineScriptBlock}\n</body>`);

console.log('=== Step 3: Preparing TeleNest-Windows-Portable folder structure ===');
if (fs.existsSync(PORTABLE_DIR)) {
  fs.rmSync(PORTABLE_DIR, { recursive: true, force: true });
}
fs.mkdirSync(PORTABLE_DIR, { recursive: true });

const portableAppDir = path.join(PORTABLE_DIR, 'app');
fs.mkdirSync(portableAppDir, { recursive: true });

const standaloneHtmlPath = path.join(PORTABLE_DIR, 'TeleNest-Offline-SingleFile.html');
fs.writeFileSync(standaloneHtmlPath, standaloneHtml, 'utf-8');
console.log(`Generated standalone single-file HTML: ${standaloneHtmlPath} (${(fs.statSync(standaloneHtmlPath).size / 1024 / 1024).toFixed(2)} MB)`);

// Copy dist contents into portable/app (excluding any nested zips or downloads)
function copyRecursiveSync(src, dest) {
  const stats = fs.statSync(src);
  if (stats.isDirectory()) {
    const baseName = path.basename(src);
    if (baseName === 'downloads') return;
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    for (const child of fs.readdirSync(src)) {
      if (child.endsWith('.zip')) continue;
      copyRecursiveSync(path.join(src, child), path.join(dest, child));
    }
  } else {
    if (!src.endsWith('.zip')) {
      fs.copyFileSync(src, dest);
    }
  }
}
copyRecursiveSync(DIST_DIR, portableAppDir);

// Also copy the Standalone Offline Single-File HTML to public downloads for convenience
if (!fs.existsSync(PUBLIC_DOWNLOADS_DIR)) {
  fs.mkdirSync(PUBLIC_DOWNLOADS_DIR, { recursive: true });
}
fs.copyFileSync(standaloneHtmlPath, path.join(PUBLIC_DOWNLOADS_DIR, 'TeleNest-Offline-SingleFile.html'));

// Create sample data folder for exports
const portableDataDir = path.join(PORTABLE_DIR, 'data');
fs.mkdirSync(portableDataDir, { recursive: true });
fs.writeFileSync(
  path.join(portableDataDir, 'README.txt'),
  'This folder can be used to store exported Excel inventory spreadsheets (.xlsx), database JSON backups, and batch QR code archives.\n'
);

console.log('=== Step 4: Generating Windows Portable Launchers & Server ===');

// 1. server.ps1 - Native Zero-Dependency PowerShell Web Server & App Launcher
const serverPs1 = `# TeleNest Enterprise Portable Windows HTTP Server & App Launcher
# Zero dependencies required. Works on any Windows 7, 8.1, 10, or 11 system.
param([int]$Port = 3000)

$RootPath = Join-Path $PSScriptRoot "app"
if (-not (Test-Path $RootPath)) {
    $RootPath = $PSScriptRoot
}

$listener = New-Object System.Net.HttpListener
$url = "http://localhost:$Port/"

try {
    $listener.Prefixes.Add($url)
    $listener.Start()
} catch {
    # If default port 3000 is occupied, pick 3001
    $Port = 3001
    $url = "http://localhost:$Port/"
    $listener = New-Object System.Net.HttpListener
    $listener.Prefixes.Add($url)
    $listener.Start()
}

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  TeleNest ICT & Warehouse Inventory System - Portable   " -ForegroundColor Green
Write-Host "  Developed by Bilal Ahmed                                " -ForegroundColor White
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " [STATUS] Local portable server running at: $url" -ForegroundColor Yellow
Write-Host " [INFO]   Zero dependencies required (No Node.js or admin needed)" -ForegroundColor Gray
Write-Host " [INFO]   Press Ctrl+C in this console to stop the server." -ForegroundColor Gray
Write-Host "==========================================================" -ForegroundColor Cyan

# Locate Microsoft Edge or Google Chrome to run in native App Mode
$edgePath = "\${env:ProgramFiles(x86)}\\Microsoft\\Edge\\Application\\msedge.exe"
if (-not (Test-Path $edgePath)) {
    $edgePath = "$env:ProgramFiles\\Microsoft\\Edge\\Application\\msedge.exe"
}
$chromePath = "$env:ProgramFiles\\Google\\Chrome\\Application\\chrome.exe"
if (-not (Test-Path $chromePath)) {
    $chromePath = "\${env:ProgramFiles(x86)}\\Google\\Chrome\\Application\\chrome.exe"
}

if (Test-Path $edgePath) {
    Start-Process $edgePath -ArgumentList "--app=$url", "--window-size=1366,850", "--window-position=100,50"
} elseif (Test-Path $chromePath) {
    Start-Process $chromePath -ArgumentList "--app=$url", "--window-size=1366,850", "--window-position=100,50"
} else {
    Start-Process $url
}

$mimeTypes = @{
    ".html" = "text/html; charset=utf-8"
    ".htm"  = "text/html; charset=utf-8"
    ".js"   = "application/javascript; charset=utf-8"
    ".mjs"  = "application/javascript; charset=utf-8"
    ".css"  = "text/css; charset=utf-8"
    ".json" = "application/json; charset=utf-8"
    ".svg"  = "image/svg+xml"
    ".png"  = "image/png"
    ".jpg"  = "image/jpeg"
    ".jpeg" = "image/jpeg"
    ".gif"  = "image/gif"
    ".webp" = "image/webp"
    ".ico"  = "image/x-icon"
    ".woff" = "font/woff"
    ".woff2"= "font/woff2"
    ".ttf"  = "font/ttf"
}

try {
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response

        $rawUrl = $request.Url.LocalPath
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
            $response.AddHeader("Access-Control-Allow-Origin", "*")

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
fs.writeFileSync(path.join(PORTABLE_DIR, 'server.ps1'), serverPs1, 'utf-8');

// 2. TeleNest.bat - Primary 1-Click Windows Launcher
const teleNestBat = `@echo off
title TeleNest ICT & Warehouse Management System - Portable
cd /d "%~dp0"

echo ===========================================================
echo    TeleNest - Warehouse & ICT Activity Inventory System
echo                  Portable Windows Edition
echo                  Developed by Bilal Ahmed
echo ===========================================================
echo.
echo [1/2] Starting zero-dependency portable engine...

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0server.ps1"

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [NOTICE] PowerShell server interrupted or restricted.
    echo Opening Standalone Single-File Offline Edition directly in browser...
    start "" "%~dp0TeleNest-Offline-SingleFile.html"
)
pause
`;
fs.writeFileSync(path.join(PORTABLE_DIR, 'TeleNest.bat'), teleNestBat, 'utf-8');

// 3. TeleNest-App-Mode.bat - Windows Native App Mode (Borderless desktop window)
const appModeBat = `@echo off
title TeleNest Portable Desktop App
cd /d "%~dp0"
echo Starting TeleNest in Native Desktop Window Mode...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0server.ps1"
`;
fs.writeFileSync(path.join(PORTABLE_DIR, 'TeleNest-App-Mode.bat'), appModeBat, 'utf-8');

// 4. TeleNest-Silent.vbs - Silent background launcher (no command prompt window)
const silentVbs = `' TeleNest Enterprise Windows Silent Desktop Launcher
Set WshShell = CreateObject("WScript.Shell")
currentDir = Replace(WScript.ScriptFullName, WScript.ScriptName, "")
WshShell.Run "powershell -NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File """ & currentDir & "server.ps1""", 0, False
`;
fs.writeFileSync(path.join(PORTABLE_DIR, 'TeleNest-Silent.vbs'), silentVbs, 'utf-8');

// Copy TeleNest.ico into portable directory and public downloads
if (fs.existsSync(path.join(ROOT_DIR, 'TeleNest.ico'))) {
  fs.copyFileSync(path.join(ROOT_DIR, 'TeleNest.ico'), path.join(PORTABLE_DIR, 'TeleNest.ico'));
  fs.copyFileSync(path.join(ROOT_DIR, 'TeleNest.ico'), path.join(PUBLIC_DOWNLOADS_DIR, 'TeleNest.ico'));
}

// 5. Open-Offline-Browser.bat - Direct browser launch for offline single file
const openOfflineBat = `@echo off
title TeleNest Offline Direct Browser Launch
cd /d "%~dp0"
echo Opening TeleNest Standalone Single-File Edition...
start "" "%~dp0TeleNest-Offline-SingleFile.html"
`;
fs.writeFileSync(path.join(PORTABLE_DIR, 'Open-Offline-Browser.bat'), openOfflineBat, 'utf-8');

// 6. Create-Desktop-Shortcut.bat - 1-Click Windows Desktop Shortcut creator
const createShortcutBat = `@echo off
title Create TeleNest Desktop Shortcut
cd /d "%~dp0"
echo =========================================================
echo    TeleNest - Creating Windows Desktop Shortcut
echo =========================================================
echo.
powershell -NoProfile -ExecutionPolicy Bypass -Command "$ws = New-Object -ComObject WScript.Shell; $desktop = [Environment]::GetFolderPath('Desktop'); $shortcut = $ws.CreateShortcut((Join-Path $desktop 'TeleNest Inventory.lnk')); $shortcut.TargetPath = (Join-Path $PSScriptRoot 'TeleNest.bat'); $shortcut.WorkingDirectory = $PSScriptRoot; if (Test-Path (Join-Path $PSScriptRoot 'TeleNest.ico')) { $shortcut.IconLocation = (Join-Path $PSScriptRoot 'TeleNest.ico') + ',0' }; $shortcut.Description = 'TeleNest - Warehouse & ICT Inventory Management System'; $shortcut.Save(); Write-Host ' [SUCCESS] Desktop Shortcut created successfully on your Windows Desktop!' -ForegroundColor Green"
echo.
echo You can now launch TeleNest directly from your Windows Desktop!
echo.
pause
`;
fs.writeFileSync(path.join(PORTABLE_DIR, 'Create-Desktop-Shortcut.bat'), createShortcutBat, 'utf-8');

// 7. TeleNest.hta - Native Windows HTML Application launcher
const teleNestHta = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>TeleNest - Warehouse & ICT Inventory Management System</title>
<HTA:APPLICATION 
  ID="TeleNestApp"
  APPLICATIONNAME="TeleNest"
  BORDER="thin"
  BORDERSTYLE="normal"
  CAPTION="yes"
  ICON="TeleNest.ico"
  MAXIMIZEBUTTON="yes"
  MINIMIZEBUTTON="yes"
  SHOWINTASKBAR="yes"
  SINGLEINSTANCE="yes"
  SYSMENU="yes"
  WINDOWSTATE="normal"
  NAVIGABLE="yes"
/>
<script language="javascript">
  var shell = new ActiveXObject("WScript.Shell");
  var fso = new ActiveXObject("Scripting.FileSystemObject");
  var currentDir = fso.GetParentFolderName(location.pathname.replace(/^file:\\/\\/\\/?/, '').replace(/\\//g, '\\\\'));
  shell.Run('powershell -NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File "' + currentDir + '\\\\server.ps1"', 0, false);
  setTimeout(function() { window.close(); }, 1200);
</script>
</head>
<body style="font-family:Segoe UI,sans-serif; background:#0f172a; color:#f8fafc; display:flex; align-items:center; justify-content:center; height:100vh; margin:0;">
  <div style="text-align:center;">
    <h2 style="margin:0 0 8px 0; color:#38bdf8;">TeleNest ICT & Warehouse System</h2>
    <p style="margin:0; color:#94a3b8;">Launching native desktop application...</p>
  </div>
</body>
</html>
`;
fs.writeFileSync(path.join(PORTABLE_DIR, 'TeleNest.hta'), teleNestHta, 'utf-8');

// Also create TeleNest.cmd identical to TeleNest.bat for Windows command prompt users
fs.copyFileSync(path.join(PORTABLE_DIR, 'TeleNest.bat'), path.join(PORTABLE_DIR, 'TeleNest.cmd'));

// 6. HOW-TO-RUN.txt - Complete instructions for the end-user
const howToRunTxt = `================================================================================
           TELENEST - WAREHOUSE & ICT INVENTORY SYSTEM (PORTABLE EDITION)
                             Developed by Bilal Ahmed
================================================================================

This package is a 100% PORTABLE version for Windows PC.
You do NOT need to install Node.js, npm, Python, or administrator software.
You can run this directly from any folder, Desktop, or a USB Flash Drive!

--------------------------------------------------------------------------------
HOW TO RUN ON WINDOWS PC:
--------------------------------------------------------------------------------

OPTION 1: (RECOMMENDED - 1-CLICK NATIVE APP WINDOW)
  - Double-click "TeleNest.bat" (or "TeleNest.cmd" / "TeleNest-App-Mode.bat")
  - TeleNest starts its zero-dependency local engine and automatically launches
    in Microsoft Edge / Chrome in clean App Window mode (no browser address bar,
    clean native desktop feel).
  - To stop, close the application window or press Ctrl+C in the console.

OPTION 2: (DESKTOP SHORTCUT CREATION)
  - Double-click "Create-Desktop-Shortcut.bat"
  - Automatically creates a custom branded "TeleNest Inventory" shortcut directly
    on your Windows Desktop with the custom TeleNest.ico icon!

OPTION 3: (SILENT BACKGROUND LAUNCH / HTA LAUNCHER)
  - Double-click "TeleNest-Silent.vbs" or "TeleNest.hta"
  - TeleNest starts completely silently in the background without any black console window!

OPTION 4: (ZERO SERVER - DIRECT BROWSER OPEN)
  - Double-click "TeleNest-Offline-SingleFile.html" or "Open-Offline-Browser.bat"
  - Opens instantly in your default web browser (Edge, Chrome, Firefox, Brave, Opera).
  - Contains all styles, logic, PDF generators, and database engines in a single file.

--------------------------------------------------------------------------------
PORTABLE DATA PERSISTENCE & BACKUPS:
--------------------------------------------------------------------------------
- All your inventory records, transactions, audit logs, categories, suppliers,
  and company settings persist securely in your local browser storage.
- You can export full Database JSON Backups and Master Excel (.xlsx) reports at
  any time directly to the "data/" folder in this package.

--------------------------------------------------------------------------------
SYSTEM REQUIREMENTS:
--------------------------------------------------------------------------------
- OS: Windows 11, Windows 10, Windows 8.1, or Windows 7 SP1.
- RAM: 512 MB minimum.
- Disk Space: ~15 MB.
- Internet Connection: Not required (100% Offline-Ready).

================================================================================
`;
fs.writeFileSync(path.join(PORTABLE_DIR, 'HOW-TO-RUN.txt'), howToRunTxt, 'utf-8');

// 7. PORTABLE-INFO.md
const portableInfoMd = `# TeleNest ICT & Warehouse Inventory System - Windows Portable Edition

**Developed by:** Bilal Ahmed  
**Platform:** Windows 10 / Windows 11 (x64 / x86 / ARM64)  
**Deployment Type:** Portable Standalone Software (Zero-Install)  

## Key Features of the Portable Version

1. **Zero External Dependencies**:
   - No Node.js required.
   - No npm or build tools needed.
   - No administrative privileges or registry entries needed.
   - Runs directly off USB flash drives or external drives.

2. **Multiple Launch Modes**:
   - \`TeleNest.bat\`: Quick-start launcher with status telemetry.
   - \`TeleNest-App-Mode.bat\`: Launches in Microsoft Edge or Google Chrome App Mode (frameless standalone window).
   - \`TeleNest-Silent.vbs\`: Launches silently in the background without a command prompt window.
   - \`TeleNest-Offline-SingleFile.html\`: Completely standalone single-file offline edition.

3. **Complete Functional Suite**:
   - Master Inventory Tracking with real-time stock status
   - Inward Stock Receipts & Outward Material Gate Passes
   - Audit Logs, Supplier Directory, Project Allocation
   - Batch QR Code generation and scanning
   - PDF Material Gate Passes and official Letterhead Reports
   - Multi-tab Excel (.xlsx) Master Export
   - Software Logo Studio (Online Curated Gallery & PC Disk Upload)
`;
fs.writeFileSync(path.join(PORTABLE_DIR, 'PORTABLE-INFO.md'), portableInfoMd, 'utf-8');

console.log('=== Step 5: Packaging TeleNest-Windows-Portable into ZIP ===');
if (!fs.existsSync(PUBLIC_DOWNLOADS_DIR)) {
  fs.mkdirSync(PUBLIC_DOWNLOADS_DIR, { recursive: true });
}

// Use python3 to create high-compression zip
execSync(`python3 -m zipfile -c "${ZIP_OUTPUT_PATH}" "TeleNest-Windows-Portable"`, { stdio: 'inherit' });
fs.copyFileSync(ZIP_OUTPUT_PATH, PUBLIC_ZIP_OUTPUT_PATH);

const zipStats = fs.statSync(ZIP_OUTPUT_PATH);
console.log(`Successfully created Windows Portable ZIP:`);
console.log(`- Path 1: ${ZIP_OUTPUT_PATH} (${(zipStats.size / 1024 / 1024).toFixed(2)} MB)`);
console.log(`- Path 2: ${PUBLIC_ZIP_OUTPUT_PATH} (${(zipStats.size / 1024 / 1024).toFixed(2)} MB)`);
console.log('Portable export completed successfully!');
