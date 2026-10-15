import JSZip from 'jszip';
import * as XLSX from 'xlsx';
import { storage, INITIAL_COMPANY_CONFIG } from './storage';

export interface PortablePackageData {
  app: string;
  developer: string;
  version: string;
  exportedAt: string;
  data: {
    users: any[];
    inventory: any[];
    movements: any[];
    ftth: any[];
    fttb: any[];
    fttm: any[];
    expenses: any[];
    projects: any[];
    dailyWorks: any[];
    auditLogs: any[];
    exchangeRates: any;
    companyConfig: any;
    customCategories?: string[];
    globalTheme?: string;
    customPalette?: any;
    autoSaveConfig?: any;
    syncDestination?: string;
  };
}

export class PortablePackageService {
  private static _cachedBundle: { html: string; assets: Record<string, string> } | null = null;
  /**
   * Generates the SVG string of the official TeleNest Hexagonal Telecom Hub Logo
   */
  public static getTeleNestLogoSvg(): string {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="100%" height="100%">
  <defs>
    <linearGradient id="teleNestGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0284c7" />
      <stop offset="50%" stop-color="#2563eb" />
      <stop offset="100%" stop-color="#0f172a" />
    </linearGradient>
    <linearGradient id="nestAccent" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#38bdf8" />
      <stop offset="100%" stop-color="#818cf8" />
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="6" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>
  <rect width="200" height="200" rx="44" fill="#090d16" />
  <rect x="2" y="2" width="196" height="196" rx="42" fill="none" stroke="url(#teleNestGrad)" stroke-width="3" opacity="0.6" />
  
  <polygon points="100,28 162,64 162,136 100,172 38,136 38,64" 
           fill="url(#teleNestGrad)" stroke="url(#nestAccent)" stroke-width="4" filter="url(#glow)" />
  
  <circle cx="100" cy="100" r="48" fill="none" stroke="#38bdf8" stroke-width="2" stroke-dasharray="6,4" opacity="0.8" />
  
  <circle cx="100" cy="100" r="16" fill="#38bdf8" />
  <circle cx="100" cy="100" r="8" fill="#ffffff" />
  
  <line x1="100" y1="44" x2="100" y2="76" stroke="#ffffff" stroke-width="4" stroke-linecap="round" />
  <line x1="100" y1="124" x2="100" y2="156" stroke="#ffffff" stroke-width="4" stroke-linecap="round" />
  <line x1="52" y1="72" x2="80" y2="88" stroke="#ffffff" stroke-width="4" stroke-linecap="round" />
  <line x1="120" y1="112" x2="148" y2="128" stroke="#ffffff" stroke-width="4" stroke-linecap="round" />
  <line x1="148" y1="72" x2="120" y2="88" stroke="#ffffff" stroke-width="4" stroke-linecap="round" />
  <line x1="80" y1="112" x2="52" y2="128" stroke="#ffffff" stroke-width="4" stroke-linecap="round" />

  <circle cx="100" cy="38" r="4" fill="#38bdf8" />
  <circle cx="154" cy="70" r="4" fill="#38bdf8" />
  <circle cx="154" cy="130" r="4" fill="#38bdf8" />
  <circle cx="100" cy="162" r="4" fill="#38bdf8" />
  <circle cx="46" cy="130" r="4" fill="#38bdf8" />
  <circle cx="46" cy="70" r="4" fill="#38bdf8" />
</svg>`;
  }

  /**
   * Generates a valid Windows ICO file (PNG inside ICO container)
   */
  public static async getTeleNestLogoIcoBlob(): Promise<Blob> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      canvas.width = 128;
      canvas.height = 128;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(new Blob([this.getTeleNestLogoSvg()], { type: 'image/svg+xml' }));
        return;
      }

      const img = new Image();
      const svg = this.getTeleNestLogoSvg();
      const svgBlob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);

      img.onload = () => {
        ctx.drawImage(img, 0, 0, 128, 128);
        URL.revokeObjectURL(url);
        canvas.toBlob((pngBlob) => {
          if (!pngBlob) {
            resolve(new Blob([this.getTeleNestLogoSvg()], { type: 'image/x-icon' }));
            return;
          }
          pngBlob.arrayBuffer().then((buffer) => {
            const pngBytes = new Uint8Array(buffer);
            const icoHeader = new Uint8Array(22);
            // 0-1: Reserved (0)
            icoHeader[0] = 0;
            icoHeader[1] = 0;
            // 2-3: Type (1 = icon)
            icoHeader[2] = 1;
            icoHeader[3] = 0;
            // 4-5: Number of images (1)
            icoHeader[4] = 1;
            icoHeader[5] = 0;
            // Directory entry 1:
            icoHeader[6] = 128; // width
            icoHeader[7] = 128; // height
            icoHeader[8] = 0; // color palette
            icoHeader[9] = 0; // reserved
            icoHeader[10] = 1; // color planes
            icoHeader[11] = 0;
            icoHeader[12] = 32; // bpp
            icoHeader[13] = 0;
            // 14-17: Size of image data
            const size = pngBytes.length;
            icoHeader[14] = size & 0xff;
            icoHeader[15] = (size >> 8) & 0xff;
            icoHeader[16] = (size >> 16) & 0xff;
            icoHeader[17] = (size >> 24) & 0xff;
            // 18-21: Offset of image data (22)
            icoHeader[18] = 22;
            icoHeader[19] = 0;
            icoHeader[20] = 0;
            icoHeader[21] = 0;

            const fullIco = new Uint8Array(icoHeader.length + pngBytes.length);
            fullIco.set(icoHeader, 0);
            fullIco.set(pngBytes, icoHeader.length);
            resolve(new Blob([fullIco], { type: 'image/x-icon' }));
          });
        }, 'image/png');
      };
      img.src = url;
    });
  }

  /**
   * Method 1: Instant Standalone App Mode (Recommended)
   * Generates TeleNest.bat Windows Standalone App-Mode Launcher (Microsoft Edge / Chrome)
   */
  public static generateTeleNestBat(): string {
    return `@echo off
setlocal enabledelayedexpansion
title TeleNest ICT Enterprise - Windows 11 Desktop Launcher
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
echo        METHOD 1: INSTANT STANDALONE APP MODE (RECOMMENDED - EDGE / CHROME)
echo                 TeleNest ICT Logistics & Telecom Architecture
echo                    Developer & Architect: Bilal Ahmed
echo ===============================================================================
echo.

set "SCRIPT_DIR=%~dp0"
cd /d "%SCRIPT_DIR%"

set "APP_FILE=%SCRIPT_DIR%TeleNest.html"
if not exist "!APP_FILE!" set "APP_FILE=%SCRIPT_DIR%app.html"
if not exist "!APP_FILE!" set "APP_FILE=%SCRIPT_DIR%TeleNest-Offline-SingleFile.html"

set "SAFE_DIR=%SCRIPT_DIR%Database safe work files"
if not exist "!SAFE_DIR!" mkdir "!SAFE_DIR!" >nul 2>&1

:: Also maintain persistent user profile database backup in LocalAppData
set "USER_DB_DIR=%LOCALAPPDATA%\\TeleNest\\Database"
if not exist "!USER_DB_DIR!" mkdir "!USER_DB_DIR!" >nul 2>&1

if exist "%SCRIPT_DIR%Database safe work files\\TeleNest_Database_Master.json" (
    copy /y "%SCRIPT_DIR%Database safe work files\\TeleNest_Database_Master.json" "!SAFE_DIR!\\TeleNest_Database_Master.json" >nul 2>&1
    copy /y "%SCRIPT_DIR%Database safe work files\\TeleNest_Database_Master.json" "!USER_DB_DIR!\\TeleNest_Database_Master.json" >nul 2>&1
)
if exist "%SCRIPT_DIR%Database safe work files\\TeleNest_Inventory_Report.xlsx" (
    copy /y "%SCRIPT_DIR%Database safe work files\\TeleNest_Inventory_Report.xlsx" "!SAFE_DIR!\\TeleNest_Inventory_Report.xlsx" >nul 2>&1
)
if exist "%SCRIPT_DIR%Database safe work files\\TeleNest_Fleet_Cash.csv" (
    copy /y "%SCRIPT_DIR%Database safe work files\\TeleNest_Fleet_Cash.csv" "!SAFE_DIR!\\TeleNest_Fleet_Cash.csv" >nul 2>&1
)
if exist "%SCRIPT_DIR%Database safe work files\\TeleNest_Schema_Dump.sql" (
    copy /y "%SCRIPT_DIR%Database safe work files\\TeleNest_Schema_Dump.sql" "!SAFE_DIR!\\TeleNest_Schema_Dump.sql" >nul 2>&1
)

echo [*] Safe Work Database Directory: !SAFE_DIR!
echo [*] Offline Application File: !APP_FILE!
echo.

if not exist "!APP_FILE!" (
    echo [ERROR] Application file '!APP_FILE!' not found!
    echo Please verify package files are intact in this directory.
    pause
    exit /b 1
)

:: Detect Microsoft Edge (Installed natively on 100% of Windows 11 & 10 PCs)
set "EDGE_PATH="
if exist "%ProgramFiles(x86)%\\Microsoft\\Edge\\Application\\msedge.exe" (
    set "EDGE_PATH=%ProgramFiles(x86)%\\Microsoft\\Edge\\Application\\msedge.exe"
) else if exist "%ProgramFiles%\\Microsoft\\Edge\\Application\\msedge.exe" (
    set "EDGE_PATH=%ProgramFiles%\\Microsoft\\Edge\\Application\\msedge.exe"
) else if exist "%LOCALAPPDATA%\\Microsoft\\Edge\\Application\\msedge.exe" (
    set "EDGE_PATH=%LOCALAPPDATA%\\Microsoft\\Edge\\Application\\msedge.exe"
)

:: Detect Google Chrome
set "CHROME_PATH="
if exist "%ProgramFiles%\\Google\\Chrome\\Application\\chrome.exe" (
    set "CHROME_PATH=%ProgramFiles%\\Google\\Chrome\\Application\\chrome.exe"
) else if exist "%ProgramFiles(x86)%\\Google\\Chrome\\Application\\chrome.exe" (
    set "CHROME_PATH=%ProgramFiles(x86)%\\Google\\Chrome\\Application\\chrome.exe"
) else if exist "%LOCALAPPDATA%\\Google\\Chrome\\Application\\chrome.exe" (
    set "CHROME_PATH=%LOCALAPPDATA%\\Google\\Chrome\\Application\\chrome.exe"
)

:: Set persistent local profile directory (avoids %TEMP% purge issues on Windows 11)
set "DATA_DIR=%LOCALAPPDATA%\TeleNest\AppProfile"
if not exist "!DATA_DIR!" mkdir "!DATA_DIR!" >nul 2>&1

:: Convert Windows file path to compliant file URL
set "APP_URL=file:///!APP_FILE:\=/!"

:: Launch in True Standalone App Window Mode (Frameless Browser UI with local file permissions)
if defined EDGE_PATH (
    echo [OK] Microsoft Edge detected. Launching in Frameless App Window Mode...
    start "" "!EDGE_PATH!" --app="!APP_URL!" --user-data-dir="!DATA_DIR!" --allow-file-access-from-files --test-type --window-size=1440,900 --disable-extensions --disable-features=Translate
    timeout /t 2 >nul
    exit /b 0
)

if defined CHROME_PATH (
    echo [OK] Google Chrome detected. Launching in Frameless App Window Mode...
    start "" "!CHROME_PATH!" --app="!APP_URL!" --user-data-dir="!DATA_DIR!" --allow-file-access-from-files --test-type --window-size=1440,900 --disable-extensions
    timeout /t 2 >nul
    exit /b 0
)

:: Fallback to Native HTA if available
if exist "%SCRIPT_DIR%TeleNest.hta" (
    echo [OK] Launching via Windows Native mshta.exe...
    start "" mshta.exe "%SCRIPT_DIR%TeleNest.hta"
    timeout /t 2 >nul
    exit /b 0
)

:: Ultimate Fallback: System Default Web Browser
echo [INFO] Opening in default web browser...
start "" "!APP_FILE!"
timeout /t 2 >nul
exit /b 0
`;
  }

  public static generateTeleRolloutBat(): string {
    return this.generateTeleNestBat();
  }

  /**
   * Method 1 (Alternative): Start-TeleNest.cmd
   */
  public static generateStartCmd(): string {
    return `@echo off
set "SCRIPT_DIR=%~dp0"
call "%SCRIPT_DIR%TeleNest.bat"
`;
  }

  /**
   * Method 3: Silent Launcher
   * Generates Launch-TeleNest.vbs (Runs silently with zero console screen flash)
   */
  public static generateTeleNestVbs(): string {
    return `' ===============================================================================
' TeleNest ICT Enterprise - Silent Desktop Launcher (Method 3)
' Developed by: Bilal Ahmed (TeleNest ICT Logistics)
' Runs silently with zero console screen flash into Microsoft Edge App Mode
' ===============================================================================
Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
scriptDir = fso.GetParentFolderName(WScript.ScriptFullName)

batPath = scriptDir & "\\TeleNest.bat"
appPath = scriptDir & "\\TeleNest.html"
If Not fso.FileExists(appPath) Then appPath = scriptDir & "\\app.html"
If Not fso.FileExists(appPath) Then appPath = scriptDir & "\\TeleNest-Offline-SingleFile.html"

If fso.FileExists(batPath) Then
    ' Run batch file hidden (0 = hide window, False = do not wait)
    WshShell.Run """" & batPath & """", 0, False
ElseIf fso.FileExists(appPath) Then
    ' Direct open
    WshShell.Run "explorer.exe """ & appPath & """", 1, False
Else
    MsgBox "TeleNest application files not found in: " & vbCrLf & scriptDir, 16, "TeleNest Launch Error"
End If
`;
  }

  public static generateTeleRolloutVbs(): string {
    return this.generateTeleNestVbs();
  }

  /**
   * Generates TeleNest.hta (Microsoft HTML Application for native Windows 11 desktop window)
   */
  public static generateTeleNestHta(): string {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>TeleNest - ICT Operations</title>
  <HTA:APPLICATION 
    ID="TeleNestApp"
    APPLICATIONNAME="TeleNest ICT Enterprise"
    BORDER="thin"
    BORDERSTYLE="normal"
    CAPTION="yes"
    ICON="TeleNest-Logo.ico"
    MAXIMIZEBUTTON="yes"
    MINIMIZEBUTTON="yes"
    SHOWINTASKBAR="yes"
    SINGLEINSTANCE="yes"
    SYSMENU="yes"
    VERSION="1.0"
    WINDOWSTATE="normal"
    NAVIGABLE="yes"
  />
  <script language="VBScript">
    Sub Window_OnLoad
      On Error Resume Next
      Dim shell, fso, scriptDir, edgePath, chromePath, appFile, cmd
      Set shell = CreateObject("WScript.Shell")
      Set fso = CreateObject("Scripting.FileSystemObject")
      scriptDir = fso.GetParentFolderName(document.location.pathname)
      appFile = scriptDir & "\\TeleNest.html"
      If Not fso.FileExists(appFile) Then appFile = scriptDir & "\\app.html"
      If Not fso.FileExists(appFile) Then appFile = scriptDir & "\\TeleNest-Offline-SingleFile.html"

      edgePath = shell.ExpandEnvironmentStrings("%ProgramFiles(x86)%\\Microsoft\\Edge\\Application\\msedge.exe")
      If Not fso.FileExists(edgePath) Then edgePath = shell.ExpandEnvironmentStrings("%ProgramFiles%\\Microsoft\\Edge\\Application\\msedge.exe")

      chromePath = shell.ExpandEnvironmentStrings("%ProgramFiles%\\Google\\Chrome\\Application\\chrome.exe")
      If Not fso.FileExists(chromePath) Then chromePath = shell.ExpandEnvironmentStrings("%ProgramFiles(x86)%\\Google\\Chrome\\Application\\chrome.exe")

      If fso.FileExists(edgePath) Then
        cmd = """" & edgePath & """ --app=""" & appFile & """ --user-data-dir=""" & shell.ExpandEnvironmentStrings("%TEMP%\\TeleNest_Win11_App") & """ --allow-file-access-from-files --test-type --window-size=1440,900"
        shell.Run cmd, 1, False
        window.close
      ElseIf fso.FileExists(chromePath) Then
        cmd = """" & chromePath & """ --app=""" & appFile & """ --user-data-dir=""" & shell.ExpandEnvironmentStrings("%TEMP%\\TeleNest_Win11_App") & """ --allow-file-access-from-files --test-type --window-size=1440,900"
        shell.Run cmd, 1, False
        window.close
      Else
        shell.Run "explorer.exe """ & appFile & """", 1, False
        window.close
      End If
    End Sub
  </script>
</head>
<body style="background:#090d16; color:#38bdf8; font-family:'Segoe UI',sans-serif; display:flex; align-items:center; justify-content:center; height:100vh; margin:0; text-align:center;">
  <div>
    <h2 style="color:#ffffff; margin-bottom:8px;">Launching TeleNest ICT Desktop...</h2>
    <p style="color:#94a3b8; font-size:13px;">Opening TeleNest Enterprise in standalone app window mode...</p>
  </div>
</body>
</html>`;
  }

  public static generateTeleRolloutHta(): string {
    return this.generateTeleNestHta();
  }

  /**
   * Generates C# Standalone Launcher Source Code (TeleNestLauncher.cs)
   */
  public static generateCSharpSource(): string {
    return `// ===============================================================================
// TeleNest Native Windows Desktop Launcher
// Developed by: Bilal Ahmed (TeleNest ICT Logistics & Telecom Engineering)
// Certified for Windows 10 & Windows 11 Offline Environments
// ===============================================================================
using System;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.Reflection;
using System.Runtime.InteropServices;
using System.Windows.Forms;

[assembly: AssemblyTitle("TeleNest ICT Enterprise")]
[assembly: AssemblyDescription("Warehouse & ICT Activity Inventory Management System")]
[assembly: AssemblyCompany("TeleNest ICT Logistics")]
[assembly: AssemblyProduct("TeleNest")]
[assembly: AssemblyCopyright("Copyright © Bilal Ahmed")]
[assembly: AssemblyVersion("1.0.0.0")]
[assembly: AssemblyFileVersion("1.0.0.0")]

namespace TeleNest
{
    static class Program
    {
        [DllImport("user32.dll")]
        private static extern bool SetProcessDPIAware();

        [STAThread]
        static void Main(string[] args)
        {
            try
            {
                SetProcessDPIAware();
            }
            catch { }

            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);

            string currentDir = AppDomain.CurrentDomain.BaseDirectory;
            string appFile = Path.Combine(currentDir, "TeleNest.html");
            if (!File.Exists(appFile)) appFile = Path.Combine(currentDir, "app.html");
            if (!File.Exists(appFile)) appFile = Path.Combine(currentDir, "TeleNest-Offline-SingleFile.html");

            if (!File.Exists(appFile))
            {
                MessageBox.Show(
                    "Cannot locate application files in:\\n" + currentDir + "\\n\\nPlease ensure all files from TeleNest-Portable-Windows11 are kept together in this folder.",
                    "TeleNest - File Not Found",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Error
                );
                return;
            }

            // Prefer launching in Microsoft Edge App Mode (--app)
            string edgePath64 = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles), "Microsoft\\\\Edge\\\\Application\\\\msedge.exe");
            string edgePath86 = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86), "Microsoft\\\\Edge\\\\Application\\\\msedge.exe");
            string chromePath64 = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles), "Google\\\\Chrome\\\\Application\\\\chrome.exe");
            string chromePath86 = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86), "Google\\\\Chrome\\\\Application\\\\chrome.exe");

            string selectedBrowser = null;
            if (File.Exists(edgePath86)) selectedBrowser = edgePath86;
            else if (File.Exists(edgePath64)) selectedBrowser = edgePath64;
            else if (File.Exists(chromePath64)) selectedBrowser = chromePath64;
            else if (File.Exists(chromePath86)) selectedBrowser = chromePath86;

            string appProfile = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "TeleNest", "AppProfile");
            try { Directory.CreateDirectory(appProfile); } catch { }
            string appUri = new Uri(appFile).AbsoluteUri;

            try
            {
                if (selectedBrowser != null)
                {
                    ProcessStartInfo psi = new ProcessStartInfo
                    {
                        FileName = selectedBrowser,
                        Arguments = string.Format("--app=\"{0}\" --user-data-dir=\"{1}\" --allow-file-access-from-files --test-type --window-size=1440,900", appUri, appProfile),
                        UseShellExecute = false
                    };
                    Process.Start(psi);
                }
                else
                {
                    // Fallback to default browser
                    Process.Start(new ProcessStartInfo(appFile) { UseShellExecute = true });
                }
            }
            catch (Exception ex)
            {
                MessageBox.Show(
                    "Error launching TeleNest application:\\n" + ex.Message,
                    "TeleNest Launcher Exception",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Warning
                );
            }
        }
    }
}
`;
  }

  /**
   * Generates Install-Windows11-Shortcut.bat
   * Creates the desktop and start menu shortcut to launch TeleNest cleanly
   */
  public static generateInstallShortcutBat(): string {
    return `@echo off
setlocal enabledelayedexpansion
title TeleNest - Windows Desktop Shortcut Installer
chcp 65001 >nul 2>&1
color 0B
cls

echo ===============================================================================
echo     TeleNest Windows Desktop & Start Menu Shortcut Installer
echo          TeleNest ICT Logistics & Operations Architecture
echo                     Developer: Bilal Ahmed
echo ===============================================================================
echo.

set "SCRIPT_DIR=%~dp0"
cd /d "!SCRIPT_DIR!"

set "TARGET_EXE=!SCRIPT_DIR!TeleNest.exe"
if not exist "!TARGET_EXE!" if exist "!SCRIPT_DIR!TeleNest-x86.exe" set "TARGET_EXE=!SCRIPT_DIR!TeleNest-x86.exe"
if not exist "!TARGET_EXE!" set "TARGET_EXE=!SCRIPT_DIR!TeleNest.bat"

set "ICON_FILE=!SCRIPT_DIR!TeleNest.ico"
if not exist "!ICON_FILE!" set "ICON_FILE=!SCRIPT_DIR!TeleNest-Logo.ico"
if not exist "!ICON_FILE!" set "ICON_FILE=!SCRIPT_DIR!config\\TeleNest-Logo.ico"
if not exist "!ICON_FILE!" set "ICON_FILE=!TARGET_EXE!"

:: Ensure Safe Work Directory exists and copy database snapshot
set "SAFE_DIR=C:\\Database safe work files"
if not exist "!SAFE_DIR!" mkdir "!SAFE_DIR!" >nul 2>&1
if exist "!SCRIPT_DIR!Database safe work files\\TeleNest_Database_Master.json" (
    copy /y "!SCRIPT_DIR!Database safe work files\\TeleNest_Database_Master.json" "!SAFE_DIR!\\TeleNest_Database_Master.json" >nul 2>&1
)

echo [*] Target Launcher: "!TARGET_EXE!"
echo [*] Working Directory: "!SCRIPT_DIR!"
echo [*] Application Icon:  "!ICON_FILE!"
echo [*] Creating Desktop & Start Menu Shortcuts...
echo.

:: 1. Create standard Windows Desktop Shortcut (.url format - 100% clean, native Windows)
set "DESKTOP_DIR=%USERPROFILE%\\Desktop"
set "START_DIR=%APPDATA%\\Microsoft\\Windows\\Start Menu\\Programs\\TeleNest"
if not exist "!START_DIR!" mkdir "!START_DIR!" >nul 2>&1

(
echo [InternetShortcut]
echo URL=file:///!TARGET_EXE:\\=/!
echo IconFile=!ICON_FILE!
echo IconIndex=0
) > "!DESKTOP_DIR!\\TeleNest ICT Enterprise.url"

:: 2. Create Start Menu Shortcut (.url format)
(
echo [InternetShortcut]
echo URL=file:///!TARGET_EXE:\\=/!
echo IconFile=!ICON_FILE!
echo IconIndex=0
) > "!START_DIR!\\TeleNest ICT Enterprise.url"

echo [SUCCESS] Windows Desktop Shortcut 'TeleNest ICT Enterprise' created with official logo!
echo [SUCCESS] Start Menu shortcut created under 'TeleNest'.
echo.
echo Would you like to launch TeleNest right now? (Y/N)
set /p CHOICE="Press Y to launch now, or any other key to exit: "
if /i "!CHOICE!"=="Y" (
    start "" "!TARGET_EXE!"
)
exit /b 0
`;
  }

  /**
   * Generates TeleNest-AutoSave-Portable-Sync.bat
   * Offline synchronization script for Windows 11 & Windows 10
   */
  public static generateAutoSaveSyncBat(): string {
    return `@echo off
setlocal enabledelayedexpansion
title TeleNest - Daily Work Auto-Save Sync (Windows 11 / 10)
chcp 65001 >nul 2>&1
color 0A
cls

echo ===============================================================================
echo            TeleNest Daily Work Auto-Save Sync (Windows 11 / 10)
echo               TeleNest ICT Logistics & Operations Enterprise
echo                     Developer: Bilal Ahmed
echo ===============================================================================
echo.

set "SCRIPT_DIR=%~dp0"
cd /d "%SCRIPT_DIR%"

set "SAFE_DIR=C:\\Database safe work files"
if not exist "!SAFE_DIR!" mkdir "!SAFE_DIR!" >nul 2>&1

echo [*] Target Safe Folder: !SAFE_DIR!
echo [*] Backing up and synchronizing daily work records...

set "TIMESTAMP=%date:~10,4%%date:~4,2%%date:~7,2%_%time:~0,2%%time:~3,2%%time:~6,2%"
set "TIMESTAMP=%TIMESTAMP: =0%"

if exist "!SAFE_DIR!\\TeleNest_Database_Master.json" (
    copy /y "!SAFE_DIR!\\TeleNest_Database_Master.json" "!SAFE_DIR!\\TeleNest_Database_Master_!TIMESTAMP!.bak" >nul 2>&1
    echo [OK] Timestamped master backup created: TeleNest_Database_Master_!TIMESTAMP!.bak
)

if exist "%SCRIPT_DIR%Database safe work files\\TeleNest_Database_Master.json" (
    copy /y "%SCRIPT_DIR%Database safe work files\\TeleNest_Database_Master.json" "!SAFE_DIR!\\TeleNest_Database_Master.json" >nul 2>&1
    echo [OK] Master Database synchronized to C:\\Database safe work files
)

if exist "%SCRIPT_DIR%Database safe work files\\TeleNest_DailyWork_Report.json" (
    copy /y "%SCRIPT_DIR%Database safe work files\\TeleNest_DailyWork_Report.json" "!SAFE_DIR!\\TeleNest_DailyWork_Report.json" >nul 2>&1
    echo [OK] Daily Work Log synchronized to C:\\Database safe work files
)

echo.
echo ===============================================================================
echo [SUCCESS] Daily Work & Master Database auto-sync complete on Windows 11 / 10!
echo ===============================================================================
echo.
pause
`;
  }

  /**
   * Method 5: Run-Local-Server.bat
   * Zero external dependencies - Uses Windows 10/11 built-in PowerShell micro-server
   */
  public static generateRunLocalServerBat(): string {
    return `@echo off
setlocal enabledelayedexpansion
title TeleNest Enterprise - Local Server Mode
echo ===============================================================================
echo      TeleNest ICT Enterprise - Local Offline Server Launcher
echo          TeleNest ICT Logistics ^& Operations Architecture
echo                     Developer: Bilal Ahmed
echo ===============================================================================
echo.
cd /d "%~dp0"
set "PORT=8080"
echo [*] Initializing local server on port %PORT%...
echo [*] Launching standalone local application at http://127.0.0.1:%PORT%/TeleNest.html
echo [*] Powered by non-admin socket micro-server (zero installation)...
echo.
start "" powershell -NoProfile -ExecutionPolicy Bypass -Command "$port = %PORT%; $dir = (Get-Location).Path; try { $tcp = New-Object System.Net.Sockets.TcpListener([System.Net.IPAddress]::Loopback, $port); $tcp.Start(); } catch { $port = 8088; $tcp = New-Object System.Net.Sockets.TcpListener([System.Net.IPAddress]::Loopback, $port); $tcp.Start(); }; Write-Host \"[*] TeleNest Local Server active at http://127.0.0.1:$port/\"; Start-Process 'msedge.exe' -ArgumentList \"--app=http://127.0.0.1:$port/TeleNest.html --window-size=1440,900\" -ErrorAction SilentlyContinue; while ($true) { try { $client = $tcp.AcceptTcpClient(); $stream = $client.GetStream(); $reader = New-Object System.IO.StreamReader($stream); $line = $reader.ReadLine(); if ($line) { $tokens = $line.Split(' '); if ($tokens.Length -ge 2) { $raw = $tokens[1].TrimStart('/').Split('?')[0]; if ([string]::IsNullOrEmpty($raw)) { $raw = 'TeleNest.html' }; $target = Join-Path $dir $raw; if (Test-Path $target -PathType Leaf) { $bytes = [System.IO.File]::ReadAllBytes($target); $ct = 'text/plain'; if ($target.EndsWith('.html')) { $ct = 'text/html; charset=utf-8' } elseif ($target.EndsWith('.js')) { $ct = 'application/javascript; charset=utf-8' } elseif ($target.EndsWith('.css')) { $ct = 'text/css; charset=utf-8' } elseif ($target.EndsWith('.json')) { $ct = 'application/json; charset=utf-8' } elseif ($target.EndsWith('.ico')) { $ct = 'image/x-icon' } elseif ($target.EndsWith('.svg')) { $ct = 'image/svg+xml' }; $hdr = \"HTTP/1.1 200 OK\`r\`nContent-Type: $ct\`r\`nContent-Length: \" + $bytes.Length + \"\`r\`nAccess-Control-Allow-Origin: *\`r\`nConnection: close\`r\`n\`r\`n\"; $hB = [System.Text.Encoding]::UTF8.GetBytes($hdr); $stream.Write($hB, 0, $hB.Length); $stream.Write($bytes, 0, $bytes.Length); } else { $nf = [System.Text.Encoding]::UTF8.GetBytes(\"HTTP/1.1 404 Not Found\`r\`nConnection: close\`r\`n\`r\`n\"); $stream.Write($nf, 0, $nf.Length); } } } $client.Close(); } catch {} }"
exit /b 0
`;
  }

  /**
   * Generates Start-TeleNest-Win11.ps1 native PowerShell script
   */
  public static generatePowerShellRunner(): string {
    return `<#
.SYNOPSIS
    TeleNest Windows 11 Native PowerShell Runner
    Author: Bilal Ahmed (bilalaxmed.47@gmail.com)
.DESCRIPTION
    Launches TeleNest ICT Warehouse System in native modern App Window Mode
#>

$ErrorActionPreference = "SilentlyContinue"
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

$appHtml = Join-Path $scriptDir "TeleNest.html"
if (-not (Test-Path $appHtml)) { $appHtml = Join-Path $scriptDir "app.html" }
$logoIco = Join-Path $scriptDir "TeleNest-Logo.ico"

Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host " TeleNest Windows 11 Native Enterprise Launcher" -ForegroundColor White
Write-Host " TeleNest ICT Warehouse & Operations System" -ForegroundColor Gray
Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host ""

if (-not (Test-Path $appHtml)) {
    Write-Host "[ERROR] Neither 'TeleNest.html' nor 'app.html' found in $scriptDir" -ForegroundColor Red
    Pause
    Exit 1
}

# Look for Microsoft Edge (installed natively on every Windows 11)
$edgePaths = @(
    "\${env:ProgramFiles(x86)}\\Microsoft\\Edge\\Application\\msedge.exe",
    "\$env:ProgramFiles\\Microsoft\\Edge\\Application\\msedge.exe",
    "\$env:LocalAppData\\Microsoft\\Edge\\Application\\msedge.exe"
)

$edgeExe = $null
foreach ($path in $edgePaths) {
    if (Test-Path $path) {
        $edgeExe = $path
        break
    }
}

if ($edgeExe) {
    Write-Host "[*] Launching Microsoft Edge Native App-Window Mode..." -ForegroundColor Green
    Start-Process $edgeExe -ArgumentList "--app=\`"$appHtml\`"", "--allow-file-access-from-files", "--test-type", "--window-size=1440,900"
    Write-Host "[SUCCESS] TeleNest window started!" -ForegroundColor Cyan
} else {
    Write-Host "[*] Launching default Windows browser..." -ForegroundColor Yellow
    Start-Process "$appHtml"
}
`;
  }

  /**
   * Generates autorun.inf
   */
  public static generateAutorunInf(): string {
    return `[Autorun]
Open=TeleNest.bat
Icon=TeleNest-Logo.ico
Label=TeleNest Windows 11 Portable
Action=Launch TeleNest ICT Operations
`;
  }

  /**
   * Generates Windows11-Deployment-Guide.html
   */
  public static generateWindows11DeploymentGuideHtml(snapshot: PortablePackageData): string {
    const logoSvg = this.getTeleNestLogoSvg();
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>TeleNest - Windows 11 Certified Offline Package Guide</title>
  <style>
    :root {
      --bg: #0c101d;
      --card: #151b2e;
      --border: #273552;
      --accent: #0284c7;
      --text: #f8fafc;
      --muted: #94a3b8;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: "Segoe UI Variable Display", "Segoe UI", system-ui, sans-serif; }
    body { background: var(--bg); color: var(--text); padding: 32px 16px; line-height: 1.6; }
    .container { max-width: 900px; margin: 0 auto; }
    .header { display: flex; align-items: center; gap: 16px; margin-bottom: 32px; padding-bottom: 24px; border-bottom: 1px solid var(--border); }
    .logo { width: 56px; height: 56px; border-radius: 14px; background: #000; border: 1px solid var(--border); padding: 6px; }
    h1 { font-size: 26px; font-weight: 800; letter-spacing: -0.5px; }
    .badge { display: inline-block; padding: 3px 10px; border-radius: 9999px; background: rgba(16, 185, 129, 0.2); color: #34d399; font-size: 11px; font-weight: 700; border: 1px solid rgba(16, 185, 129, 0.3); }
    .card { background: var(--card); border: 1px solid var(--border); border-radius: 14px; padding: 24px; margin-bottom: 20px; }
    h2 { font-size: 17px; margin-bottom: 12px; color: #38bdf8; display: flex; align-items: center; gap: 8px; }
    p { color: var(--muted); font-size: 13px; margin-bottom: 12px; }
    ul { list-style: none; }
    li { font-size: 13px; margin-bottom: 8px; display: flex; align-items: flex-start; gap: 8px; color: var(--text); }
    code { background: #0b0f19; padding: 2px 6px; border-radius: 4px; border: 1px solid #1e293b; color: #38bdf8; font-family: Consolas, monospace; font-size: 12px; }
    .launch-btn { display: inline-block; background: #0284c7; color: #fff; text-decoration: none; padding: 10px 20px; border-radius: 8px; font-size: 13px; font-weight: 700; transition: background 0.2s; margin-top: 8px; }
    .launch-btn:hover { background: #0369a1; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">${logoSvg}</div>
      <div>
        <div style="display: flex; align-items: center; gap: 10px;">
          <h1>TeleNest Windows 11 Offline Package</h1>
          <span class="badge">Certified Complete</span>
        </div>
        <div style="font-size: 12px; color: var(--muted); margin-top: 4px;">
          TeleNest Warehouse & ICT Operations Software &bull; Systems Architecture by Bilal Ahmed
        </div>
      </div>
    </div>

    <div class="card">
      <h2>1. Instant One-Click Launch (Windows 11)</h2>
      <p>Choose any of the native launchers included in this folder to run the complete software offline:</p>
      <ul>
        <li><strong>TeleNest.bat:</strong> Recommended launcher. Automatically launches Microsoft Edge or Chrome in clean, frameless App Window mode.</li>
        <li><strong>Setup-And-Start-Exe.bat:</strong> Automates compiling <code>TeleNest.exe</code> with the TeleNest logo using Windows built-in C# compiler and immediately starts the executable.</li>
        <li><strong>Install-Windows11-Shortcut.bat:</strong> Instantly creates a desktop shortcut and Windows Start Menu entry with the TeleNest icon.</li>
        <li><strong>Start-TeleNest-Win11.ps1:</strong> Native Windows 11 PowerShell runner.</li>
        <li><strong>app.html:</strong> Direct offline HTML application containing all embedded database records and styles.</li>
      </ul>
      <a href="app.html" class="launch-btn" target="_blank">Open TeleNest App Now &rarr;</a>
    </div>

    <div class="card">
      <h2>2. Offline Security &amp; Local Persistence</h2>
      <p>This software operates 100% disconnected from the internet. All records, inventory transactions, FTTH/FTTB deployments, and project logs are safely persisted inside the local browser container and can be exported anytime as a full JSON backup.</p>
      <ul>
        <li>SKUs Tracked: <code>${snapshot.data.inventory.length} items</code></li>
        <li>Movement Logs: <code>${snapshot.data.movements.length} logged entries</code></li>
        <li>FTTH Fiber Clusters: <code>${snapshot.data.ftth.length} deployments</code></li>
        <li>Turnkey Projects: <code>${snapshot.data.projects.length} project records</code></li>
      </ul>
    </div>
  </div>
</body>
</html>`;
  }

  /**
   * Generates Compile-TeleNest-Exe.bat using native csc.exe shipped with every Windows 10/11 installation!
   */
  public static generateCompileBat(): string {
    return `@echo off
setlocal enabledelayedexpansion
title TeleNest C# Standalone Compiler
color 0A
cls

echo ===============================================================================
echo     TeleNest Native Windows C# Compiler (Zero External Tools Required)
echo        Designed by Bilal Ahmed - TeleNest ICT Logistics ^& Engineering
echo ===============================================================================
echo.

set "SCRIPT_DIR=%~dp0"
cd /d "!SCRIPT_DIR!"

set "CS_FILE=!SCRIPT_DIR!TeleNestLauncher.cs"
set "OUT_EXE=!SCRIPT_DIR!TeleNest.exe"
set "ICO_FILE=!SCRIPT_DIR!TeleNest-Logo.ico"

if not exist "!CS_FILE!" (
    echo [ERROR] Source file '!CS_FILE!' not found!
    pause
    exit /b 1
)

echo [*] Locating Windows Native Microsoft .NET C# Compiler (csc.exe)...

set "CSC_EXE="
if exist "%SystemRoot%\\Microsoft.NET\\Framework64\\v4.0.30319\\csc.exe" (
    set "CSC_EXE=%SystemRoot%\\Microsoft.NET\\Framework64\\v4.0.30319\\csc.exe"
) else if exist "%SystemRoot%\\Microsoft.NET\\Framework\\v4.0.30319\\csc.exe" (
    set "CSC_EXE=%SystemRoot%\\Microsoft.NET\\Framework\\v4.0.30319\\csc.exe"
)

if not defined CSC_EXE (
    echo [WARNING] Native csc.exe not found in standard .NET 4.0 directory.
    echo [*] Checking PowerShell Roslyn compiler...
    where csc >nul 2>&1
    if !errorlevel! equ 0 (
        set "CSC_EXE=csc"
    ) else (
        echo [ERROR] Could not locate C# compiler on this system.
        echo Please ensure .NET Framework 4.5+ is enabled in Windows Features.
        pause
        exit /b 1
    )
)

echo [OK] Compiler located: !CSC_EXE!
echo [*] Compiling !OUT_EXE! with TeleNest Logo icon...
echo.

set "ICON_ARG="
if exist "!ICO_FILE!" (
    set "ICON_ARG=/win32icon:\\"!ICO_FILE!\\""
    echo [*] Embedding TeleNest-Logo.ico into Windows executable resource table...
)

"!CSC_EXE!" /target:winexe /optimize+ !ICON_ARG! /r:System.dll /r:System.Windows.Forms.dll /r:System.Drawing.dll /out:"!OUT_EXE!" "!CS_FILE!"

if !errorlevel! neq 0 (
    echo.
    echo [ERROR] Compilation failed! Review compiler errors above.
    pause
    exit /b 1
)

echo.
echo ===============================================================================
echo [SUCCESS] Standalone Executable Successfully Compiled:
echo           !OUT_EXE!
echo ===============================================================================
echo.
echo You can now double-click 'TeleNest.exe' to run anywhere offline!
echo.
pause
`;
  }

  /**
   * Method 4: Compile Genuine Native TeleNest.exe on your Windows PC
   * Double-click "Build-Native-EXE.bat"
   * -> Automatically uses Windows's built-in Microsoft .NET C# compiler (csc.exe) to generate a genuine, certified, 100% native "TeleNest.exe" directly on your PC!
   */
  public static generateBuildNativeExeBat(): string {
    return `@echo off
setlocal enabledelayedexpansion
title TeleNest - 1-Click Native EXE Compiler (C# csc.exe)
chcp 65001 >nul 2>&1
color 0A
cls

echo ===============================================================================
echo        METHOD 4: COMPILE GENUINE NATIVE TELENEST.EXE ON YOUR PC
echo               TeleNest ICT Logistics & Telecom Architecture
echo                     Developer & Architect: Bilal Ahmed
echo ===============================================================================
echo.

set "SCRIPT_DIR=%~dp0"
cd /d "!SCRIPT_DIR!"

set "CS_FILE=!SCRIPT_DIR!config\\Launcher.cs"
if not exist "!CS_FILE!" set "CS_FILE=!SCRIPT_DIR!TeleNestLauncher.cs"
set "ICON_FILE=!SCRIPT_DIR!config\\TeleNest-Logo.ico"
if not exist "!ICON_FILE!" set "ICON_FILE=!SCRIPT_DIR!TeleNest-Logo.ico"
set "OUT_EXE=!SCRIPT_DIR!TeleNest.exe"

if not exist "!CS_FILE!" (
    echo [ERROR] C# source file '!CS_FILE!' was not found.
    pause
    exit /b 1
)

echo [*] Locating Windows built-in Microsoft .NET C# compiler (csc.exe)...

set "CSC_EXE="
if exist "%SystemRoot%\\Microsoft.NET\\Framework64\\v4.0.30319\\csc.exe" (
    set "CSC_EXE=%SystemRoot%\\Microsoft.NET\\Framework64\\v4.0.30319\\csc.exe"
) else if exist "%SystemRoot%\\Microsoft.NET\\Framework\\v4.0.30319\\csc.exe" (
    set "CSC_EXE=%SystemRoot%\\Microsoft.NET\\Framework\\v4.0.30319\\csc.exe"
) else if exist "%SystemRoot%\\Microsoft.NET\\Framework64\\v3.5\\csc.exe" (
    set "CSC_EXE=%SystemRoot%\\Microsoft.NET\\Framework64\\v3.5\\csc.exe"
) else if exist "%SystemRoot%\\Microsoft.NET\\Framework\\v3.5\\csc.exe" (
    set "CSC_EXE=%SystemRoot%\\Microsoft.NET\\Framework\\v3.5\\csc.exe"
) else (
    where csc.exe >nul 2>&1
    if !errorlevel! equ 0 set "CSC_EXE=csc.exe"
)

if not defined CSC_EXE (
    echo [ERROR] Microsoft .NET C# compiler (csc.exe) not found.
    echo Please use Method 1 (TeleNest.bat) to launch the software directly.
    pause
    exit /b 1
)

echo [OK] Compiler located: !CSC_EXE!
echo [*] Source file: !CS_FILE!
echo [*] Target executable: !OUT_EXE!
echo.
echo [*] Compiling 100%% Genuine Native TeleNest.exe with TeleNest Logo...
echo.

set "ICON_ARG="
if exist "!ICON_FILE!" (
    set "ICON_ARG=/win32icon:\\"!ICON_FILE!\\""
    echo [*] Embedding !ICON_FILE! into executable resource table...
)

"!CSC_EXE!" /target:winexe /optimize+ !ICON_ARG! /r:System.dll /r:System.Windows.Forms.dll /r:System.Drawing.dll /out:"!OUT_EXE!" "!CS_FILE!"

if !errorlevel! neq 0 (
    echo.
    echo [!] Retrying compilation without icon parameter...
    "!CSC_EXE!" /target:winexe /optimize+ /r:System.dll /r:System.Windows.Forms.dll /r:System.Drawing.dll /out:"!OUT_EXE!" "!CS_FILE!"
)

if exist "!OUT_EXE!" (
    echo.
    echo ===============================================================================
    echo [SUCCESS] 100%% Genuine Native TeleNest.exe compiled directly on your PC!
    echo Output Location: !OUT_EXE!
    echo ===============================================================================
    echo.
    echo Launching TeleNest.exe now...
    start "" "!OUT_EXE!"
) else (
    echo.
    echo [ERROR] Compilation failed. Review errors above.
    pause
)
`;
  }

  /**
   * Generates TeleNest.url Windows Internet Shortcut
   */
  public static generateInternetShortcut(): string {
    return `[InternetShortcut]
URL=file:///%CD%/app.html
IconIndex=0
IconFile=%CD%\\config\\TeleNest-Logo.ico
Comment=TeleNest ICT Enterprise - Windows 11 Desktop
`;
  }

  /**
   * Generates Setup-And-Start-Exe.bat:
   * Compiles TeleNest.exe with the TeleNest logo using the built-in C# compiler and immediately starts the executable!
   */
  public static generateSetupAndStartBat(): string {
    return `@echo off
setlocal enabledelayedexpansion
title TeleNest - Portable Software Exe Setup ^& Auto-Start
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
echo            PORTABLE SOFTWARE EXE SETUP ^& STANDALONE APPLICATION LAUNCHER
echo              TeleNest ICT Logistics ^& Operations Architecture
echo                           Developer: Bilal Ahmed
echo ===============================================================================
echo.

set "SCRIPT_DIR=%~dp0"
cd /d "!SCRIPT_DIR!"

set "APP_FILE=!SCRIPT_DIR!TeleNest.html"
if not exist "!APP_FILE!" set "APP_FILE=!SCRIPT_DIR!app.html"
if not exist "!APP_FILE!" set "APP_FILE=!SCRIPT_DIR!TeleNest-Offline-SingleFile.html"

set "CS_FILE=!SCRIPT_DIR!TeleNestLauncher.cs"
if not exist "!CS_FILE!" set "CS_FILE=!SCRIPT_DIR!config\Launcher.cs"

set "OUT_EXE=!SCRIPT_DIR!TeleNest.exe"

set "ICO_FILE=!SCRIPT_DIR!TeleNest-Logo.ico"
if not exist "!ICO_FILE!" set "ICO_FILE=!SCRIPT_DIR!config\TeleNest-Logo.ico"

echo [STEP 1/3] Checking environment and assets...
if not exist "!APP_FILE!" (
    echo [ERROR] Application HTML file is missing in this folder!
    pause
    exit /b 1
)

if exist "!ICO_FILE!" (
    echo [OK] TeleNest Logo icon found: !ICO_FILE!
) else (
    echo [!] TeleNest icon not found, will compile with default application resource.
)

echo [STEP 2/3] Building TeleNest.exe using Windows Native C# Compiler...
set "CSC_EXE="
if exist "%SystemRoot%\\Microsoft.NET\\Framework64\\v4.0.30319\\csc.exe" (
    set "CSC_EXE=%SystemRoot%\\Microsoft.NET\\Framework64\\v4.0.30319\\csc.exe"
) else if exist "%SystemRoot%\\Microsoft.NET\\Framework\\v4.0.30319\\csc.exe" (
    set "CSC_EXE=%SystemRoot%\\Microsoft.NET\\Framework\\v4.0.30319\\csc.exe"
)

if defined CSC_EXE (
    set "ICON_ARG="
    if exist "!ICO_FILE!" set "ICON_ARG=/win32icon:\\"!ICO_FILE!\\""
    "!CSC_EXE!" /target:winexe /optimize+ !ICON_ARG! /r:System.dll /r:System.Windows.Forms.dll /r:System.Drawing.dll /out:"!OUT_EXE!" "!CS_FILE!" >nul 2>&1
    if !errorlevel! equ 0 (
        echo [OK] TeleNest.exe compiled successfully!
    ) else (
        echo [!] Note: Using native batch launcher mode as direct fallback...
    )
) else (
    echo [!] Native csc.exe not detected; proceeding with direct App Launcher...
)

echo [STEP 3/3] Starting TeleNest Desktop Application...
echo.

if exist "!OUT_EXE!" (
    echo [*] Launching TeleNest.exe standalone binary...
    start "" "!OUT_EXE!"
    echo [SUCCESS] TeleNest.exe is now running!
) else (
    echo [*] Launching via TeleNest.bat...
    start "" "%SCRIPT_DIR%TeleNest.bat"
    echo [SUCCESS] TeleNest App Window is active!
)

timeout /t 3 >nul
exit /b 0
`;
  }

  /**
   * Generates Windows11-Setup-Guide.txt and README.txt
   * Matches the exact user specification
   */
  public static generateWindows11SetupGuideText(): string {
    return `===============================================================================
TeleNest ICT Enterprise - Certified Offline Package (Windows 11 & Windows 10)
Author & Systems Architecture: Bilal Ahmed (bilalaxmed.47@gmail.com)
===============================================================================

CONTINUOUS DAILY WORK AUTO-SAVE (1-MINUTE ENGINE):
  - TeleNest automatically auto-saves all daily work logs, fiber meter installations,
    technician activities, and inventory status every 1 minute.
  - Manual Save Option: Click "Save Daily Work Manually Now" in the application to 
    export an immediate snapshot to your Portable Folder or Cloud.
  - Run "TeleNest-AutoSave-Portable-Sync.bat" anytime to sync updates into "C:\\Database safe work files".

Method 1 (Instant Standalone App Mode - Recommended):
  Double-click "TeleNest.bat" or "Start-TeleNest.cmd".
  -> Launches the software in native Microsoft Edge/Chrome Standalone App Mode (clean desktop window with zero address bar).

Method 2 (Native Windows Desktop Window):
  Double-click "TeleNest.hta".
  -> Runs natively through Windows MSHTA subsystem as a Win32 application window on Windows 11 & Windows 10.

Method 3 (Silent Launcher):
  Double-click "Launch-TeleNest.vbs".
  -> Runs silently with zero console screen flash.

Method 4 (Compile Genuine Native TeleNest.exe on your Windows PC):
  Double-click "Build-Native-EXE.bat" or "Setup-And-Start-Exe.bat".
  -> Automatically uses Windows's built-in Microsoft .NET C# compiler (csc.exe) to generate a genuine, certified, 100% native "TeleNest.exe" directly on your PC!

Method 5 (Local Server Mode - Zero Installation):
  Double-click "Run-Local-Server.bat".
  -> Launches a local background server via built-in Windows PowerShell on port 8080 and opens TeleNest in standalone desktop window!

Desktop Shortcut Installation:
  Double-click "Install-Shortcut.bat".
  -> Instantly creates desktop and Start Menu shortcuts with the official TeleNest logo!

FOLDER CONTENTS (CLEAN PORTABLE STRUCTURE):
- TeleNest.bat                        : Primary 1-Click Launcher (Microsoft Edge Standalone App Mode).
- Start-TeleNest.cmd                  : Standard Windows Command Prompt launcher.
- Run-Local-Server.bat                : 1-Click Local Server Launcher (PowerShell micro-server).
- TeleNest.hta                        : Native Windows HTML Application Window (MSHTA).
- Launch-TeleNest.vbs                 : Silent Background Launcher (Zero console flash).
- Build-Native-EXE.bat                : 1-Click Genuine TeleNest.exe Compiler (uses built-in csc.exe).
- Install-Shortcut.bat                : 1-Click Desktop & Start Menu Shortcut Creator (Win 11 & 10).
- TeleNest-AutoSave-Sync.bat          : 1-Click Daily Work & Master Database Auto-Sync Utility.
- TeleNest.url                        : Windows Internet Desktop Shortcut.
- TeleNest.html                       : Complete Self-Contained Offline Web Application.
- app.html                            : Universal root runner alias.
- TeleNest-Logo.ico                   : Official TeleNest 128x128 high-res Windows application icon.
- README.txt                          : Quick Start & Architecture Reference Guide.
- assets/                             : Compiled offline application assets (JS, CSS, fonts).
- Database safe work files/           : Live database snapshots & reports (.json, .xlsx, .csv, .sql).
  ├── TeleNest_Database_Master.json   : Complete database snapshot.
  ├── TeleNest_DailyWork_Report.json  : Dedicated Daily Work and technician log snapshot.
  ├── TeleNest_Inventory_Report.xlsx  : Master Excel workbook with stock balances.
  ├── TeleNest_Fleet_Cash.csv         : Invoice and cash expense logs.
  └── TeleNest_Schema_Dump.sql        : SQL database schema & records dump.
- config/                             : System configuration & C# compilation sources.
  ├── settings.json                   : System parameters & company metadata.
  ├── depot_config.ini                : Depot & hardware peripheral configuration.
  ├── Launcher.cs                     : C# Standalone Desktop Launcher source.
  ├── TeleNest-Logo.svg               : Scalable vector icon.
  └── TeleNest-Logo.ico               : Windows application binary icon.

The software runs 100% self-contained and offline from this folder.

SAFE STORAGE DIRECTORY:
- The software stores all database records in: C:\\Database safe work files\\
- You can backup, export, and restore database snapshots anytime.

100% Offline Compatible • Zero-Cloud Architecture • Windows 11 & Windows 10 Certified
`;
  }

  public static generateReadmeText(): string {
    return this.generateWindows11SetupGuideText();
  }

  /**
   * Generates dedicated Daily Work Report JSON snapshot
   */
  public static generateDailyWorkReportJson(snapshot: PortablePackageData): string {
    const dailyWorksList = (snapshot as any).dailyWorks || snapshot.data?.dailyWorks || [];
    const payload = {
      app: 'TeleNest',
      report: 'Daily Work Field Operations Log',
      exportedAt: new Date().toISOString(),
      developer: 'Bilal Ahmed',
      statistics: {
        totalDailyWorks: dailyWorksList.length,
        totalMetersInstalled: dailyWorksList.reduce((acc: number, dw: any) => acc + (dw.metersInstalled || 0), 0),
      },
      dailyWorks: dailyWorksList,
    };
    return JSON.stringify(payload, null, 2);
  }

  /**
   * Fetches the real compiled production application bundle
   * Always fetches the fresh, latest compiled bundle without caching older versions.
   */
  public static async fetchOfflineAppBundle(forceFresh = true): Promise<{ html: string; assets: Record<string, string> }> {
    if (!forceFresh && this._cachedBundle && this._cachedBundle.html) {
      return this._cachedBundle;
    }

    // Always clear cached bundle to guarantee the latest compiled version is retrieved
    this._cachedBundle = null;

    const cacheBuster = `_t=${Date.now()}`;
    const fetchOptions: RequestInit = {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    };

    // 1. Direct fetch from bundle.json (fastest, atomic, guaranteed consistent with latest build)
    try {
      const bundleRes = await fetch(`/app-build/bundle.json?${cacheBuster}`, fetchOptions);
      if (bundleRes.ok) {
        const json = await bundleRes.json();
        if (json && json.html && json.assets) {
          this._cachedBundle = { html: json.html, assets: json.assets };
          return this._cachedBundle;
        }
      }
    } catch (err) {
      console.warn('Could not fetch /app-build/bundle.json, trying /api/offline-package-bundle', err);
    }

    // 2. Fetch from /api/offline-package-bundle (server-side direct read from dist)
    try {
      const res = await fetch(`/api/offline-package-bundle?${cacheBuster}`, fetchOptions);
      if (res.ok) {
        const json = await res.json();
        if (json && json.success && json.html && json.assets) {
          this._cachedBundle = { html: json.html, assets: json.assets };
          return this._cachedBundle;
        }
      }
    } catch (err) {
      console.warn('Could not fetch from /api/offline-package-bundle, attempting /app-build/ manifest fallback', err);
    }

    // 3. Fallback: fetch from /app-build/index.html & /app-build/manifest.json
    try {
      const htmlRes = await fetch(`/app-build/index.html?${cacheBuster}`, fetchOptions);
      const manifestRes = await fetch(`/app-build/manifest.json?${cacheBuster}`, fetchOptions);
      if (htmlRes.ok && manifestRes.ok) {
        const html = await htmlRes.text();
        const manifest = await manifestRes.json();
        const assets: Record<string, string> = {};
        for (const assetPath of manifest.assets) {
          const aRes = await fetch(`/app-build/${assetPath}?${cacheBuster}`, fetchOptions);
          if (aRes.ok) {
            assets[assetPath] = await aRes.text();
          }
        }
        this._cachedBundle = { html, assets };
        return this._cachedBundle;
      }
    } catch (e) {
      console.warn('Could not fetch from /app-build either', e);
    }

    // 4. Resilient Self-Healing Fallback: If network fetches fail, capture active DOM
    try {
      if (typeof document !== 'undefined' && document.documentElement) {
        return {
          html: document.documentElement.outerHTML,
          assets: {},
        };
      }
    } catch (e) {
      console.warn('DOM capture fallback notice:', e);
    }

    return {
      html: '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>TeleNest ICT Enterprise</title></head><body><div id="root"></div></body></html>',
      assets: {},
    };
  }

  /**
   * Injects offline localStorage seeding script into index.html so that the real
   * TeleNest React application boots on any PC with all user data already loaded.
   */
  public static injectOfflineBootstrap(html: string, snapshotStr: string): string {
    const seederScript = `
    <!-- TeleNest Live Storage Seeder for Standalone Offline Execution -->
    <script id="telenest-offline-bootstrap">
      (function() {
        try {
          var rawSnapshot = ${JSON.stringify(snapshotStr).replace(/<\/script/gi, '<\\/script')};
          if (!rawSnapshot) return;
          var parsed = rawSnapshot;
          for (var i = 0; i < 3; i++) {
            if (typeof parsed === 'string') {
              try { parsed = JSON.parse(parsed); } catch(e) { break; }
            }
          }
          if (!parsed) return;
          var d = parsed.data || parsed;
          var activeTheme = d.globalTheme || d.theme || 'theme-blue';
          var storageMap = {
            'telenest_users_v1': d.users,
            'telenest_current_user_v1': null,
            'telenest_inventory_v1': d.inventory,
            'telenest_movements_v1': d.movements,
            'telenest_ftth_v1': d.ftth,
            'telenest_fttb_v1': d.fttb,
            'telenest_fttm_v1': d.fttm,
            'telenest_expenses_v1': d.expenses,
            'telenest_projects_v1': d.projects,
            'telenest_dailyworks_v1': d.dailyWorks,
            'telenest_audit_logs_v1': d.auditLogs,
            'telenest_exchange_rates_v1': d.exchangeRates,
            'telenest_company_config_v1': d.companyConfig,
            'telenest_custom_categories_v1': d.customCategories,
            'telenest_global_theme_v1': activeTheme,
            'telenest_custom_palette_v1': d.customPalette,
            'telenest_autosave_config_v1': d.autoSaveConfig,
            'telenest_sync_destination_v1': d.syncDestination || 'internal',
            'telenest_archived_user_backups_v1': d.archivedUsers,
            'telenest_network_storage_config_v1': d.networkStorageConfig
          };
          for (var key in storageMap) {
            if (storageMap[key] !== undefined && storageMap[key] !== null) {
              try {
                if (typeof storageMap[key] === 'string') {
                  localStorage.setItem(key, storageMap[key]);
                } else {
                  localStorage.setItem(key, JSON.stringify(storageMap[key]));
                }
              } catch(err) {}
            }
          }
          // Immediately apply the saved theme attribute on <html> element
          if (activeTheme) {
            document.documentElement.setAttribute('data-theme', activeTheme);
          }
        } catch (e) {
          console.error('TeleNest offline seed error:', e);
        }
      })();
    </script>`;

    if (html.includes('<head>')) {
      return html.replace('<head>', () => `<head>\n${seederScript}`);
    }
    return seederScript + '\n' + html;
  }

  /**
   * Generates the Self-Contained 1-File Offline HTML application with all live data embedded.
   * Inlines the real compiled Tailwind CSS, real compiled React bundle, and seeds the live database.
   */
  public static generateSingleFileInlinedHtml(
    bundle: { html: string; assets: Record<string, string> },
    snapshotStr: string
  ): string {
    let html = bundle.html || '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>TeleNest ICT Enterprise</title></head><body><div id="root"></div></body></html>';

    // 1. Extract compiled CSS asset
    const cssEntry = Object.entries(bundle.assets || {}).find(([key]) => key.endsWith('.css'));
    const cssContent = cssEntry ? cssEntry[1] : '';

    // Remove existing link stylesheet tags
    html = html.replace(/<link\b[^>]*rel=["']stylesheet["'][^>]*\/?>/gi, '');
    html = html.replace(/<link\b[^>]*href=["'][^"']*\.css["'][^>]*\/?>/gi, '');

    // 2. Extract compiled main JS bundle asset
    const jsEntry = Object.entries(bundle.assets || {}).find(
      ([key]) => (key.startsWith('assets/index-') || key.includes('index-') || key.endsWith('.js')) && key.endsWith('.js')
    );
    const rawJs = jsEntry ? jsEntry[1] : '';
    const safeJs = rawJs.replace(/<\/script/gi, '<\\/script').replace(/<!--/g, '<\\!--');

    // Remove existing script tags pointing to external files
    html = html.replace(/<script\b[^>]*src=["'][^"']*["'][^>]*><\/script>/gi, '');
    html = html.replace(/<script\b[^>]*type=["']module["'][^>]*><\/script>/gi, '');

    // 3. Inject CSS styles into <head>
    if (cssContent) {
      const inlinedStyles = `<style id="telenest-inlined-styles">\n${cssContent}\n</style>`;
      if (html.includes('</head>')) {
        html = html.replace('</head>', () => `${inlinedStyles}\n</head>`);
      } else {
        html = inlinedStyles + '\n' + html;
      }
    }

    // 4. Inject offline local storage seeder at top of <head>
    html = this.injectOfflineBootstrap(html, snapshotStr);

    // 5. Ensure root container exists in <body>
    if (!html.includes('id="root"') && !html.includes("id='root'")) {
      if (html.includes('<body>')) {
        html = html.replace('<body>', () => '<body>\n<div id="root"></div>');
      } else {
        html += '\n<div id="root"></div>';
      }
    }

    // 6. Inject the real inlined JS bundle at the bottom of <body> so DOM is fully ready
    const inlinedAppScript = `<script type="module" id="telenest-inlined-app">\n${safeJs}\n</script>`;
    if (html.includes('</body>')) {
      html = html.replace('</body>', () => `${inlinedAppScript}\n</body>`);
    } else {
      html += `\n${inlinedAppScript}`;
    }

    return html;
  }

  /**
   * Generates app.html placed at the root of the portable ZIP package.
   * Fully inlines CSS & JS bundle and injects the live database auto-seeder
   * to guarantee zero CORS or relative path errors when opened via file://.
   */
  public static generateRootAppHtml(
    bundle: { html: string; assets: Record<string, string> },
    snapshotStr: string
  ): string {
    return this.generateSingleFileInlinedHtml(bundle, snapshotStr);
  }

  /**
   * Compatibility fallback for generating single file html
   */
  public static generateSingleFileHtml(snapshot: PortablePackageData): string {
    const logoSvg = this.getTeleNestLogoSvg();
    return `<!DOCTYPE html>
<html lang="en" data-theme="theme-blue">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>TeleNest - Warehouse & ICT Activity Inventory System</title>
  <style>
    body { background: #090d16; color: #f8fafc; font-family: system-ui, -apple-system, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
    .box { text-align: center; max-width: 500px; padding: 32px; background: #111827; border: 1px solid #1f2937; border-radius: 12px; }
    .logo { width: 56px; height: 56px; margin: 0 auto 16px; }
    h1 { font-size: 20px; font-weight: 700; margin-bottom: 8px; color: #38bdf8; }
    p { font-size: 13px; color: #94a3b8; line-height: 1.5; margin-bottom: 20px; }
    a.btn { display: inline-block; background: #0284c7; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 13px; }
  </style>
</head>
<body>
  <div class="box">
    <div class="logo">${logoSvg}</div>
    <h1>TeleNest Enterprise</h1>
    <p>Please open <strong>TeleNest.bat</strong> or <strong>app.html</strong> in this folder to launch the complete TeleNest application.</p>
    <a href="app.html" class="btn">Launch TeleNest Now</a>
  </div>
</body>
</html>`;
  }

  /**
   * Generates master Excel report with separate sheets for Inventory, Movements, Projects, Finance, and Personnel
   */
  public static generateExcelWorkbook(snapshot: PortablePackageData): Uint8Array {
    const wb = XLSX.utils.book_new();

    // 1. Inventory sheet
    const invData = (snapshot.data.inventory || []).map((item) => ({
      'Item ID': item.id,
      'Name': item.name,
      'Category': item.category,
      'Stock Level': item.quantity,
      'Min Threshold': item.minThreshold,
      'Unit': item.unit,
      'Warehouse Depot': item.depot,
      'Bin Location': item.location,
      'Unit Cost ($)': item.unitCost,
      'Total Value ($)': item.quantity * item.unitCost,
      'Status': item.quantity === 0 ? 'Out of Stock' : (item.quantity <= item.minThreshold ? 'Low Stock' : 'In Stock')
    }));
    const wsInv = XLSX.utils.json_to_sheet(invData);
    XLSX.utils.book_append_sheet(wb, wsInv, 'Inventory Stock');

    // 2. Stock Movements sheet
    const movData = (snapshot.data.movements || []).map((mov) => ({
      'Movement ID': mov.id,
      'Item ID': mov.itemId,
      'Item Name': mov.itemName,
      'Type': mov.type,
      'Quantity': mov.quantity,
      'From Depot': mov.fromDepot || 'N/A',
      'To Depot': mov.toDepot || 'N/A',
      'Technician / Driver': mov.assignedTo || 'N/A',
      'Reference': mov.reference || 'N/A',
      'Timestamp': mov.timestamp
    }));
    const wsMov = XLSX.utils.json_to_sheet(movData);
    XLSX.utils.book_append_sheet(wb, wsMov, 'Stock Movements');

    // 3. FTTH Deployments sheet
    const ftthData = (snapshot.data.ftth || []).map((f) => ({
      'Record ID': f.id,
      'Cluster ID': f.clusterId,
      'Zone': f.zone,
      'Client / Operator': f.clientOperator,
      'Homes Passed': f.homesPassed,
      'FATs Installed': f.fatsInstalled,
      'Splitter Ratio': f.splitterRatio,
      'Drop Cable (m)': f.dropCableMeters,
      'Optical Power (dBm)': f.opticalPowerDbm,
      'Testing Status': f.testingStatus,
      'Implementation Date': f.implementationDate,
      'Supervisor': f.supervisor,
      'Cost Estimate ($)': f.costEstimate,
      'Work Done': f.isWorkDone ? 'Yes' : 'No',
      'Notes': f.notes || ''
    }));
    const wsFtth = XLSX.utils.json_to_sheet(ftthData);
    XLSX.utils.book_append_sheet(wb, wsFtth, 'FTTH Deployments');

    // 4. FTTB Deployments sheet
    const fttbData = (snapshot.data.fttb || []).map((b) => ({
      'Record ID': b.id,
      'Building Name': b.buildingName,
      'Building ID': b.buildingId,
      'Risers Count': b.risersCount,
      'Floors Count': b.floorsCount,
      'MDU Box Type': b.mduBoxType,
      'Distribution Fibers': b.distributionFibers,
      'Optical Power (dBm)': b.opticalPowerDbm,
      'Active Customer Ports': b.activeCustomerPorts,
      'Commission Status': b.status,
      'Handover Date': b.handoverDate,
      'Supervisor': b.supervisor,
      'Cost Estimate ($)': b.costEstimate,
      'Work Done': b.isWorkDone ? 'Yes' : 'No',
      'Notes': b.notes || ''
    }));
    const wsFttb = XLSX.utils.json_to_sheet(fttbData);
    XLSX.utils.book_append_sheet(wb, wsFttb, 'FTTB Deployments');

    // 5. FTTM Deployments sheet
    const fttmData = (snapshot.data.fttm || []).map((m) => ({
      'Site ID': m.siteId || m.id,
      'Tower Name': m.towerName,
      'Metro Sector': m.metroSector,
      'Backhaul Bandwidth': m.backhaulBandwidth,
      'BTS Node ID': m.btsNodeId,
      'SFP Transceivers': m.sfpTransceivers,
      'OTDR Distance (km)': m.otdrDistanceKm,
      'Link Attenuation (dB)': m.attenuationDb,
      'Status': m.status,
      'Activation Date': m.activationDate,
      'Lead Engineer': m.leadEngineer,
      'Cost Estimate ($)': m.costEstimate,
      'Work Done': m.isWorkDone ? 'Yes' : 'No',
      'Notes': m.notes || ''
    }));
    const wsFttm = XLSX.utils.json_to_sheet(fttmData);
    XLSX.utils.book_append_sheet(wb, wsFttm, 'FTTM Deployments');

    // 6. Telecom Projects sheet
    const projData = (snapshot.data.projects || []).map((p) => ({
      'Project ID': p.id,
      'Code': p.code,
      'Name': p.name,
      'Type': p.type,
      'Zone': p.zone,
      'Status': p.status,
      'Budget ($)': p.budget,
      'Spent ($)': p.spent,
      'Lead Engineer': p.leadEngineer,
      'Start Date': p.startDate,
      'End Date': p.endDate
    }));
    const wsProj = XLSX.utils.json_to_sheet(projData);
    XLSX.utils.book_append_sheet(wb, wsProj, 'Rollout Projects');

    // 7. Expenses & Operational Cash sheet
    const finData = (snapshot.data.expenses || []).map((exp) => ({
      'Expense ID': exp.id,
      'Description': exp.description || exp.item || 'Logistics Expense',
      'Category': exp.category || 'Operations',
      'Project ID': exp.projectId || 'N/A',
      'Amount ($)': exp.amount,
      'Payment Method': exp.paymentMethod || 'Cash',
      'Date': exp.date,
      'Approved By': exp.approvedBy || 'Operations Lead'
    }));
    const wsFin = XLSX.utils.json_to_sheet(finData);
    XLSX.utils.book_append_sheet(wb, wsFin, 'Expenses & Operations');

    // 8. Field Daily Works sheet
    const dailyWorksData = ((snapshot.data as any).dailyWorks || []).map((w: any) => ({
      'Work ID': w.id,
      'Date': w.date,
      'Completion Time': w.completionDateTime || 'N/A',
      'Project Code': w.projectCode,
      'Project Name': w.projectName,
      'Work Type': w.workType,
      'Site ID': w.siteId || 'N/A',
      'Site Name': w.siteName || 'N/A',
      'Team Lead': w.teamLead,
      'Technicians Count': w.techniciansCount || 1,
      'Tasks Completed': w.tasksCompleted,
      'Fiber Cores Spliced': w.fiberSplicingDetails?.coresSpliced || 0,
      'Optical Reading (dBm)': w.opticalPowerReading || 'N/A',
      'Status': w.status
    }));
    const wsDailyWorks = XLSX.utils.json_to_sheet(dailyWorksData);
    XLSX.utils.book_append_sheet(wb, wsDailyWorks, 'Field Daily Works');

    // 9. Technicians & Users sheet
    const userData = (snapshot.data.users || []).map((u: any) => ({
      'User ID': u.id,
      'Full Name': u.fullName || u.name || u.username || 'N/A',
      'Role': u.role,
      'Depot': u.department || u.depot || 'Central Warehouse',
      'Phone': u.phone || 'N/A',
      'Email': u.email || 'N/A',
      'Status': u.isLocked ? 'Locked' : (u.status || 'Active')
    }));
    const wsUsers = XLSX.utils.json_to_sheet(userData);
    XLSX.utils.book_append_sheet(wb, wsUsers, 'Personnel & Users');

    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    return new Uint8Array(excelBuffer);
  }

  /**
   * Generates TeleNest_Fleet_Cash.csv
   */
  public static generateFleetCashCsv(snapshot: PortablePackageData): string {
    const headers = ['Record_Type', 'ID', 'Reference_Code', 'Entity_or_Description', 'Amount_USD', 'Category_or_Role', 'Date', 'Status'];
    const rows: string[] = [headers.join(',')];

    (snapshot.data.expenses || []).forEach(exp => {
      rows.push([
        'EXPENSE',
        `"${exp.id}"`,
        `"${exp.category || 'EXP'}"`,
        `"${(exp.description || exp.item || 'Logistics Expense').replace(/"/g, '""')}"`,
        exp.amount || 0,
        `"${exp.category || 'Operations'}"`,
        `"${exp.date || new Date().toISOString()}"`,
        `"RECORDED"`
      ].join(','));
    });

    (snapshot.data.movements || []).forEach(mov => {
      rows.push([
        'MOVEMENT',
        `"${mov.id}"`,
        `"${mov.type || 'TRANSFER'}"`,
        `"${(mov.itemName || 'Stock Item').replace(/"/g, '""')} (Qty: ${mov.quantity})"`,
        0,
        `"${mov.toDepot || 'Depot'}"`,
        `"${mov.timestamp || new Date().toISOString()}"`,
        `"COMPLETED"`
      ].join(','));
    });

    return rows.join('\r\n');
  }

  /**
   * Generates individual CSV for Inventory Stock
   */
  public static generateInventoryCsv(snapshot: PortablePackageData): string {
    const headers = ['Item_ID', 'Item_Name', 'Category', 'Stock_Quantity', 'Min_Threshold', 'Unit', 'Depot', 'Bin_Location', 'Unit_Cost_USD', 'Total_Value_USD', 'Status'];
    const rows = [headers.join(',')];
    (snapshot.data.inventory || []).forEach(item => {
      rows.push([
        `"${item.id}"`,
        `"${(item.name || '').replace(/"/g, '""')}"`,
        `"${(item.category || '').replace(/"/g, '""')}"`,
        item.quantity || 0,
        item.minThreshold || 0,
        `"${(item.unit || '').replace(/"/g, '""')}"`,
        `"${(item.depot || '').replace(/"/g, '""')}"`,
        `"${(item.location || '').replace(/"/g, '""')}"`,
        item.unitCost || 0,
        (item.quantity || 0) * (item.unitCost || 0),
        `"${item.quantity === 0 ? 'Out of Stock' : (item.quantity <= item.minThreshold ? 'Low Stock' : 'In Stock')}"`
      ].join(','));
    });
    return rows.join('\r\n');
  }

  /**
   * Generates individual CSV for Stock Movements
   */
  public static generateMovementsCsv(snapshot: PortablePackageData): string {
    const headers = ['Movement_ID', 'Item_ID', 'Item_Name', 'Type', 'Quantity', 'From_Depot', 'To_Depot', 'Assigned_To', 'Reference', 'Timestamp'];
    const rows = [headers.join(',')];
    (snapshot.data.movements || []).forEach(mov => {
      rows.push([
        `"${mov.id}"`,
        `"${mov.itemId}"`,
        `"${(mov.itemName || '').replace(/"/g, '""')}"`,
        `"${mov.type}"`,
        mov.quantity || 0,
        `"${(mov.fromDepot || 'N/A').replace(/"/g, '""')}"`,
        `"${(mov.toDepot || 'N/A').replace(/"/g, '""')}"`,
        `"${(mov.assignedTo || 'N/A').replace(/"/g, '""')}"`,
        `"${(mov.reference || 'N/A').replace(/"/g, '""')}"`,
        `"${mov.timestamp}"`
      ].join(','));
    });
    return rows.join('\r\n');
  }

  /**
   * Generates individual CSV for Fiber Deployments (FTTH, FTTB, FTTM)
   */
  public static generateFiberDeploymentsCsv(snapshot: PortablePackageData): string {
    const headers = ['Type', 'Record_ID', 'Identifier', 'Sub_Zone', 'Client_or_Operator', 'Metrics', 'Optical_dBm', 'Status', 'Date', 'Supervisor'];
    const rows = [headers.join(',')];
    (snapshot.data.ftth || []).forEach(f => {
      rows.push([
        'FTTH',
        `"${f.id}"`,
        `"${f.clusterId}"`,
        `"${f.zone}"`,
        `"${(f.clientOperator || '').replace(/"/g, '""')}"`,
        `"Passed: ${f.homesPassed} | FATs: ${f.fatsInstalled}"`,
        f.opticalPowerDbm || 0,
        `"${f.testingStatus}"`,
        `"${f.implementationDate}"`,
        `"${(f.supervisor || '').replace(/"/g, '""')}"`
      ].join(','));
    });
    (snapshot.data.fttb || []).forEach(b => {
      rows.push([
        'FTTB',
        `"${b.id}"`,
        `"${(b.buildingName || '').replace(/"/g, '""')}"`,
        `"ID: ${b.buildingId}"`,
        `"Ports: ${b.activeCustomerPorts}"`,
        `"Risers: ${b.risersCount} | Floors: ${b.floorsCount}"`,
        b.opticalPowerDbm || 0,
        `"${b.status}"`,
        `"${b.handoverDate}"`,
        `"${(b.supervisor || '').replace(/"/g, '""')}"`
      ].join(','));
    });
    (snapshot.data.fttm || []).forEach(m => {
      rows.push([
        'FTTM',
        `"${m.id || m.siteId}"`,
        `"${(m.towerName || '').replace(/"/g, '""')}"`,
        `"${m.metroSector}"`,
        `"${(m.backhaulBandwidth || '').replace(/"/g, '""')}"`,
        `"Dist: ${m.otdrDistanceKm}km | Loss: ${m.attenuationDb}dB"`,
        0,
        `"${m.status}"`,
        `"${m.activationDate}"`,
        `"${(m.leadEngineer || '').replace(/"/g, '""')}"`
      ].join(','));
    });
    return rows.join('\r\n');
  }

  /**
   * Generates individual CSV for Daily Works
   */
  public static generateDailyWorksCsv(snapshot: PortablePackageData): string {
    const headers = ['Work_ID', 'Date', 'Project_Code', 'Project_Name', 'Work_Type', 'Site_ID', 'Site_Name', 'Team_Lead', 'Technicians_Count', 'Fiber_Cores_Spliced', 'Optical_dBm', 'Status'];
    const rows = [headers.join(',')];
    ((snapshot.data as any).dailyWorks || []).forEach((w: any) => {
      rows.push([
        `"${w.id}"`,
        `"${w.date}"`,
        `"${w.projectCode}"`,
        `"${(w.projectName || '').replace(/"/g, '""')}"`,
        `"${w.workType}"`,
        `"${w.siteId || 'N/A'}"`,
        `"${(w.siteName || 'N/A').replace(/"/g, '""')}"`,
        `"${(w.teamLead || '').replace(/"/g, '""')}"`,
        w.techniciansCount || 1,
        w.fiberSplicingDetails?.coresSpliced || 0,
        `"${w.opticalPowerReading || 'N/A'}"`,
        `"${w.status}"`
      ].join(','));
    });
    return rows.join('\r\n');
  }

  /**
   * Generates individual CSV for Projects
   */
  public static generateProjectsCsv(snapshot: PortablePackageData): string {
    const headers = ['Project_ID', 'Code', 'Name', 'Type', 'Zone', 'Status', 'Budget_USD', 'Spent_USD', 'Lead_Engineer', 'Start_Date', 'End_Date'];
    const rows = [headers.join(',')];
    (snapshot.data.projects || []).forEach(p => {
      rows.push([
        `"${p.id}"`,
        `"${p.code}"`,
        `"${(p.name || '').replace(/"/g, '""')}"`,
        `"${p.type}"`,
        `"${p.zone || 'N/A'}"`,
        `"${p.status}"`,
        p.budget || 0,
        p.spent || 0,
        `"${(p.leadEngineer || 'N/A').replace(/"/g, '""')}"`,
        `"${p.startDate || 'N/A'}"`,
        `"${p.endDate || 'N/A'}"`
      ].join(','));
    });
    return rows.join('\r\n');
  }

  /**
   * Generates complete ANSI Relational SQL Database Schema and Live Data Dump (.SQL)
   */
  public static generateSchemaDumpSql(snapshot: PortablePackageData): string {
    const esc = (val: any) => {
      if (val === null || val === undefined) return 'NULL';
      return `'${String(val).replace(/'/g, "''")}'`;
    };
    const num = (val: any) => {
      const n = Number(val);
      return isNaN(n) ? 0 : n;
    };

    const lines: string[] = [
      `-- ===============================================================================`,
      `-- TeleNest ICT Enterprise - SQL Database Schema & Full Data Dump`,
      `-- Architecture: Bilal Ahmed (TeleNest ICT Logistics & Telecom Engineering)`,
      `-- Export Date : ${new Date().toISOString()}`,
      `-- Standard    : ANSI SQL Compatible (PostgreSQL, MySQL, SQLite, Microsoft SQL Server)`,
      `-- ===============================================================================\n`,
      `-- 1. INVENTORY ITEMS`,
      `CREATE TABLE IF NOT EXISTS inventory_items (`,
      `    id VARCHAR(64) PRIMARY KEY,`,
      `    name VARCHAR(255) NOT NULL,`,
      `    category VARCHAR(64) NOT NULL,`,
      `    quantity NUMERIC(12,2) NOT NULL DEFAULT 0,`,
      `    min_threshold NUMERIC(12,2) NOT NULL DEFAULT 10,`,
      `    unit VARCHAR(32) NOT NULL,`,
      `    depot VARCHAR(128) NOT NULL,`,
      `    location VARCHAR(128),`,
      `    unit_cost NUMERIC(12,2) DEFAULT 0.00`,
      `);\n`,
    ];

    const inv = snapshot.data.inventory || [];
    if (inv.length > 0) {
      lines.push(`-- Inserts for inventory_items (${inv.length} records)`);
      for (const item of inv) {
        lines.push(`INSERT INTO inventory_items (id, name, category, quantity, min_threshold, unit, depot, location, unit_cost) VALUES (${esc(item.id)}, ${esc(item.name)}, ${esc(item.category)}, ${num(item.quantity)}, ${num(item.minThreshold)}, ${esc(item.unit)}, ${esc(item.depot)}, ${esc(item.location)}, ${num(item.unitCost)});`);
      }
      lines.push('');
    }

    // 2. STOCK MOVEMENTS
    lines.push(`-- 2. STOCK MOVEMENTS`);
    lines.push(`CREATE TABLE IF NOT EXISTS stock_movements (`);
    lines.push(`    id VARCHAR(64) PRIMARY KEY,`);
    lines.push(`    item_id VARCHAR(64) NOT NULL,`);
    lines.push(`    item_name VARCHAR(255) NOT NULL,`);
    lines.push(`    movement_type VARCHAR(32) NOT NULL,`);
    lines.push(`    quantity NUMERIC(12,2) NOT NULL,`);
    lines.push(`    from_depot VARCHAR(128),`);
    lines.push(`    to_depot VARCHAR(128),`);
    lines.push(`    assigned_to VARCHAR(128),`);
    lines.push(`    reference VARCHAR(128),`);
    lines.push(`    timestamp VARCHAR(64) NOT NULL`);
    lines.push(`);\n`);

    const movements = snapshot.data.movements || [];
    if (movements.length > 0) {
      lines.push(`-- Inserts for stock_movements (${movements.length} records)`);
      for (const mov of movements) {
        lines.push(`INSERT INTO stock_movements (id, item_id, item_name, movement_type, quantity, from_depot, to_depot, assigned_to, reference, timestamp) VALUES (${esc(mov.id)}, ${esc(mov.itemId)}, ${esc(mov.itemName)}, ${esc(mov.type)}, ${num(mov.quantity)}, ${esc(mov.fromDepot)}, ${esc(mov.toDepot)}, ${esc(mov.assignedTo)}, ${esc(mov.reference)}, ${esc(mov.timestamp)});`);
      }
      lines.push('');
    }

    // 3. FTTH DEPLOYMENTS
    lines.push(`-- 3. FTTH DEPLOYMENTS`);
    lines.push(`CREATE TABLE IF NOT EXISTS ftth_deployments (`);
    lines.push(`    id VARCHAR(64) PRIMARY KEY,`);
    lines.push(`    cluster_id VARCHAR(64),`);
    lines.push(`    zone VARCHAR(128),`);
    lines.push(`    client_operator VARCHAR(128),`);
    lines.push(`    homes_passed NUMERIC(10,0) DEFAULT 0,`);
    lines.push(`    fats_installed NUMERIC(10,0) DEFAULT 0,`);
    lines.push(`    splitter_ratio VARCHAR(32),`);
    lines.push(`    drop_cable_meters NUMERIC(12,2) DEFAULT 0,`);
    lines.push(`    optical_power_dbm NUMERIC(8,2) DEFAULT 0,`);
    lines.push(`    testing_status VARCHAR(64),`);
    lines.push(`    implementation_date VARCHAR(64),`);
    lines.push(`    supervisor VARCHAR(128),`);
    lines.push(`    cost_estimate NUMERIC(12,2) DEFAULT 0,`);
    lines.push(`    currency VARCHAR(16) DEFAULT 'USD'`);
    lines.push(`);\n`);

    const ftth = snapshot.data.ftth || [];
    if (ftth.length > 0) {
      lines.push(`-- Inserts for ftth_deployments (${ftth.length} records)`);
      for (const f of ftth) {
        lines.push(`INSERT INTO ftth_deployments (id, cluster_id, zone, client_operator, homes_passed, fats_installed, splitter_ratio, drop_cable_meters, optical_power_dbm, testing_status, implementation_date, supervisor, cost_estimate, currency) VALUES (${esc(f.id)}, ${esc(f.clusterId)}, ${esc(f.zone)}, ${esc(f.clientOperator)}, ${num(f.homesPassed)}, ${num(f.fatsInstalled)}, ${esc(f.splitterRatio)}, ${num(f.dropCableMeters)}, ${num(f.opticalPowerDbm)}, ${esc(f.testingStatus)}, ${esc(f.implementationDate)}, ${esc(f.supervisor)}, ${num(f.costEstimate)}, ${esc(f.currency)});`);
      }
      lines.push('');
    }

    // 4. FTTB DEPLOYMENTS
    lines.push(`-- 4. FTTB DEPLOYMENTS`);
    lines.push(`CREATE TABLE IF NOT EXISTS fttb_deployments (`);
    lines.push(`    id VARCHAR(64) PRIMARY KEY,`);
    lines.push(`    building_name VARCHAR(255) NOT NULL,`);
    lines.push(`    building_id VARCHAR(64),`);
    lines.push(`    risers_count NUMERIC(10,0) DEFAULT 0,`);
    lines.push(`    floors_count NUMERIC(10,0) DEFAULT 0,`);
    lines.push(`    mdu_box_type VARCHAR(64),`);
    lines.push(`    distribution_fibers NUMERIC(10,0) DEFAULT 0,`);
    lines.push(`    optical_power_dbm NUMERIC(8,2) DEFAULT 0,`);
    lines.push(`    active_customer_ports NUMERIC(10,0) DEFAULT 0,`);
    lines.push(`    status VARCHAR(64),`);
    lines.push(`    handover_date VARCHAR(64),`);
    lines.push(`    supervisor VARCHAR(128),`);
    lines.push(`    cost_estimate NUMERIC(12,2) DEFAULT 0,`);
    lines.push(`    currency VARCHAR(16) DEFAULT 'USD'`);
    lines.push(`);\n`);

    const fttb = snapshot.data.fttb || [];
    if (fttb.length > 0) {
      lines.push(`-- Inserts for fttb_deployments (${fttb.length} records)`);
      for (const b of fttb) {
        lines.push(`INSERT INTO fttb_deployments (id, building_name, building_id, risers_count, floors_count, mdu_box_type, distribution_fibers, optical_power_dbm, active_customer_ports, status, handover_date, supervisor, cost_estimate, currency) VALUES (${esc(b.id)}, ${esc(b.buildingName)}, ${esc(b.buildingId)}, ${num(b.risersCount)}, ${num(b.floorsCount)}, ${esc(b.mduBoxType)}, ${num(b.distributionFibers)}, ${num(b.opticalPowerDbm)}, ${num(b.activeCustomerPorts)}, ${esc(b.status)}, ${esc(b.handoverDate)}, ${esc(b.supervisor)}, ${num(b.costEstimate)}, ${esc(b.currency)});`);
      }
      lines.push('');
    }

    // 5. FTTM DEPLOYMENTS
    lines.push(`-- 5. FTTM DEPLOYMENTS`);
    lines.push(`CREATE TABLE IF NOT EXISTS fttm_deployments (`);
    lines.push(`    id VARCHAR(64) PRIMARY KEY,`);
    lines.push(`    site_id VARCHAR(64),`);
    lines.push(`    tower_name VARCHAR(255) NOT NULL,`);
    lines.push(`    metro_sector VARCHAR(128),`);
    lines.push(`    backhaul_bandwidth VARCHAR(128),`);
    lines.push(`    bts_node_id VARCHAR(64),`);
    lines.push(`    sfp_transceivers VARCHAR(128),`);
    lines.push(`    otdr_distance_km NUMERIC(10,3) DEFAULT 0,`);
    lines.push(`    attenuation_db NUMERIC(8,2) DEFAULT 0,`);
    lines.push(`    status VARCHAR(64),`);
    lines.push(`    activation_date VARCHAR(64),`);
    lines.push(`    lead_engineer VARCHAR(128),`);
    lines.push(`    cost_estimate NUMERIC(12,2) DEFAULT 0,`);
    lines.push(`    currency VARCHAR(16) DEFAULT 'USD'`);
    lines.push(`);\n`);

    const fttm = snapshot.data.fttm || [];
    if (fttm.length > 0) {
      lines.push(`-- Inserts for fttm_deployments (${fttm.length} records)`);
      for (const m of fttm) {
        lines.push(`INSERT INTO fttm_deployments (id, site_id, tower_name, metro_sector, backhaul_bandwidth, bts_node_id, sfp_transceivers, otdr_distance_km, attenuation_db, status, activation_date, lead_engineer, cost_estimate, currency) VALUES (${esc(m.id || m.siteId)}, ${esc(m.siteId)}, ${esc(m.towerName)}, ${esc(m.metroSector)}, ${esc(m.backhaulBandwidth)}, ${esc(m.btsNodeId)}, ${esc(m.sfpTransceivers)}, ${num(m.otdrDistanceKm)}, ${num(m.attenuationDb)}, ${esc(m.status)}, ${esc(m.activationDate)}, ${esc(m.leadEngineer)}, ${num(m.costEstimate)}, ${esc(m.currency)});`);
      }
      lines.push('');
    }

    // 6. TELECOM PROJECTS
    lines.push(`-- 6. TELECOM PROJECTS`);
    lines.push(`CREATE TABLE IF NOT EXISTS telecom_projects (`);
    lines.push(`    id VARCHAR(64) PRIMARY KEY,`);
    lines.push(`    code VARCHAR(64) NOT NULL,`);
    lines.push(`    name VARCHAR(255) NOT NULL,`);
    lines.push(`    project_type VARCHAR(64) NOT NULL,`);
    lines.push(`    zone VARCHAR(128),`);
    lines.push(`    status VARCHAR(64) NOT NULL,`);
    lines.push(`    budget NUMERIC(12,2) DEFAULT 0.00,`);
    lines.push(`    spent NUMERIC(12,2) DEFAULT 0.00,`);
    lines.push(`    lead_engineer VARCHAR(128),`);
    lines.push(`    start_date VARCHAR(64),`);
    lines.push(`    end_date VARCHAR(64)`);
    lines.push(`);\n`);

    const projects = snapshot.data.projects || [];
    if (projects.length > 0) {
      lines.push(`-- Inserts for telecom_projects (${projects.length} records)`);
      for (const p of projects) {
        lines.push(`INSERT INTO telecom_projects (id, code, name, project_type, zone, status, budget, spent, lead_engineer, start_date, end_date) VALUES (${esc(p.id)}, ${esc(p.code)}, ${esc(p.name)}, ${esc(p.type)}, ${esc(p.zone)}, ${esc(p.status)}, ${num(p.budget)}, ${num(p.spent)}, ${esc(p.leadEngineer)}, ${esc(p.startDate)}, ${esc(p.endDate)});`);
      }
      lines.push('');
    }

    // 7. DAILY WORK LOGS
    lines.push(`-- 7. FIELD DAILY WORK OPERATIONS`);
    lines.push(`CREATE TABLE IF NOT EXISTS daily_work_logs (`);
    lines.push(`    id VARCHAR(64) PRIMARY KEY,`);
    lines.push(`    work_date VARCHAR(64) NOT NULL,`);
    lines.push(`    project_code VARCHAR(64),`);
    lines.push(`    project_name VARCHAR(255),`);
    lines.push(`    work_type VARCHAR(64),`);
    lines.push(`    team_lead VARCHAR(128),`);
    lines.push(`    technicians_count NUMERIC(10,0) DEFAULT 0,`);
    lines.push(`    tasks_completed TEXT,`);
    lines.push(`    site_id VARCHAR(64),`);
    lines.push(`    site_name VARCHAR(255),`);
    lines.push(`    status VARCHAR(64)`);
    lines.push(`);\n`);

    const dailyWorks = (snapshot.data as any).dailyWorks || [];
    if (dailyWorks.length > 0) {
      lines.push(`-- Inserts for daily_work_logs (${dailyWorks.length} records)`);
      for (const dw of dailyWorks) {
        lines.push(`INSERT INTO daily_work_logs (id, work_date, project_code, project_name, work_type, team_lead, technicians_count, tasks_completed, site_id, site_name, status) VALUES (${esc(dw.id)}, ${esc(dw.date)}, ${esc(dw.projectCode)}, ${esc(dw.projectName)}, ${esc(dw.workType)}, ${esc(dw.teamLead)}, ${num(dw.techniciansCount)}, ${esc(dw.tasksCompleted)}, ${esc(dw.siteId)}, ${esc(dw.siteName)}, ${esc(dw.status)});`);
      }
      lines.push('');
    }

    // 8. OPERATIONAL EXPENSES
    lines.push(`-- 8. OPERATIONAL EXPENSES`);
    lines.push(`CREATE TABLE IF NOT EXISTS operational_expenses (`);
    lines.push(`    id VARCHAR(64) PRIMARY KEY,`);
    lines.push(`    description VARCHAR(255) NOT NULL,`);
    lines.push(`    category VARCHAR(64) NOT NULL,`);
    lines.push(`    project_id VARCHAR(64),`);
    lines.push(`    amount NUMERIC(12,2) NOT NULL,`);
    lines.push(`    payment_method VARCHAR(64),`);
    lines.push(`    date VARCHAR(32) NOT NULL,`);
    lines.push(`    approved_by VARCHAR(128)`);
    lines.push(`);\n`);

    const expenses = snapshot.data.expenses || [];
    if (expenses.length > 0) {
      lines.push(`-- Inserts for operational_expenses (${expenses.length} records)`);
      for (const exp of expenses) {
        lines.push(`INSERT INTO operational_expenses (id, description, category, project_id, amount, payment_method, date, approved_by) VALUES (${esc(exp.id)}, ${esc(exp.description || exp.item)}, ${esc(exp.category)}, ${esc(exp.projectId)}, ${num(exp.amount)}, ${esc(exp.paymentMethod)}, ${esc(exp.date)}, ${esc(exp.approvedBy)});`);
      }
      lines.push('');
    }

    // 9. SYSTEM USERS
    lines.push(`-- 9. SYSTEM USERS & PERSONNEL`);
    lines.push(`CREATE TABLE IF NOT EXISTS system_users (`);
    lines.push(`    id VARCHAR(64) PRIMARY KEY,`);
    lines.push(`    full_name VARCHAR(255) NOT NULL,`);
    lines.push(`    role VARCHAR(64) NOT NULL,`);
    lines.push(`    department VARCHAR(128),`);
    lines.push(`    phone VARCHAR(64),`);
    lines.push(`    email VARCHAR(128),`);
    lines.push(`    status VARCHAR(32)`);
    lines.push(`);\n`);

    const users = snapshot.data.users || [];
    if (users.length > 0) {
      lines.push(`-- Inserts for system_users (${users.length} accounts)`);
      for (const u of users) {
        lines.push(`INSERT INTO system_users (id, full_name, role, department, phone, email, status) VALUES (${esc(u.id)}, ${esc(u.fullName || u.name || u.username)}, ${esc(u.role)}, ${esc(u.department || u.depot)}, ${esc(u.phone)}, ${esc(u.email)}, ${esc(u.isLocked ? 'Locked' : (u.status || 'Active'))});`);
      }
      lines.push('');
    }

    return lines.join('\n');
  }

  /**
   * Generates config/depot_config.ini
   */
  public static generateDepotConfigIni(): string {
    return `[DepotConfiguration]
EnterpriseName=TeleNest ICT Logistics & Telecom Engineering
SystemTitle=TeleNest Enterprise
OfflineMode=TRUE
CertifiedOS=Windows 11 / Windows 10
PrimarySafeDirectory=C:\\Database safe work files
BackupIntervalHours=4
MaxCacheMB=512

[DatabaseSettings]
MasterDatabaseFile=C:\\Database safe work files\\TeleNest_Database_Master.json
MasterReportFile=C:\\Database safe work files\\TeleNest_Inventory_Report.xlsx
FleetCashFile=C:\\Database safe work files\\TeleNest_Fleet_Cash.csv
SchemaDumpFile=C:\\Database safe work files\\TeleNest_Schema_Dump.sql
AutoSyncOnLaunch=TRUE
`;
  }

  /**
   * Generates config/settings.json
   */
  public static generateConfigSettingsJson(snapshot: PortablePackageData): string {
    const d = snapshot.data;
    return JSON.stringify(
      {
        system: 'TeleNest ICT Enterprise',
        architect: 'Bilal Ahmed (bilalaxmed.47@gmail.com)',
        version: '2.5.0-Win11Certified',
        safeStoragePath: 'C:\\Database safe work files',
        launchMethods: {
          method1: 'TeleNest.bat / Start-TeleNest.cmd (Microsoft Edge / Chrome Standalone App Mode)',
          method2: 'TeleNest.hta (Native Windows MSHTA subsystem Win32 window)',
          method3: 'Launch-TeleNest.vbs (Silent Background Launcher)',
          method4: 'Build-Native-EXE.bat (Built-in Windows C# csc.exe compiler)'
        },
        exportedAt: new Date().toISOString(),
        activeTheme: d.globalTheme || 'theme-blue',
        companyConfig: d.companyConfig,
        customCategories: d.customCategories || [],
        recordsCount: {
          inventory: d.inventory?.length || 0,
          movements: d.movements?.length || 0,
          projects: d.projects?.length || 0,
          expenses: d.expenses?.length || 0,
          dailyWorks: d.dailyWorks?.length || 0,
          ftth: d.ftth?.length || 0,
          fttb: d.fttb?.length || 0,
          fttm: d.fttm?.length || 0,
          auditLogs: d.auditLogs?.length || 0,
          users: d.users?.length || 0
        },
        systemPreferences: {
          autoSave: d.autoSaveConfig,
          syncDestination: d.syncDestination || 'internal',
          homeCurrency: d.companyConfig?.homeCurrency || 'USD'
        }
      },
      null,
      2
    );
  }

  /**
   * Generates app/manifest.json
   */
  public static generateManifestJson(): string {
    return JSON.stringify(
      {
        name: 'TeleNest ICT Enterprise',
        short_name: 'TeleNest',
        description: 'Warehouse & ICT Activity Inventory Management System - Certified Offline Windows 11',
        start_url: './index.html',
        display: 'standalone',
        background_color: '#0b0f19',
        theme_color: '#0284c7',
        icons: [
          {
            src: '../config/TeleNest-Logo.svg',
            sizes: '192x192 512x512',
            type: 'image/svg+xml'
          }
        ]
      },
      null,
      2
    );
  }

  /**
   * Helper to download raw text content
   */
  public static triggerDownload(filename: string, content: string, mimeType: string = 'text/plain') {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Helper to download binary content
   */
  public static triggerBinaryDownload(filename: string, data: Uint8Array, mimeType: string) {
    const blob = new Blob([data], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Generates and downloads the full certified ZIP folder structure:
   * TeleNest-Portable-Windows11/ (Certified Offline Package)
   * Exactly matching the user's directory and file specification:
   * - TeleNest.bat
   * - Start-TeleNest.cmd
   * - TeleNest.hta
   * - Launch-TeleNest.vbs
   * - Build-Native-EXE.bat
   * - TeleNest.url
   * - Database safe work files/
   *   ├── TeleNest_Database_Master.json
   *   ├── TeleNest_Inventory_Report.xlsx
   *   ├── TeleNest_Fleet_Cash.csv
   *   └── TeleNest_Schema_Dump.sql
   * - app/
   *   ├── index.html
   *   └── manifest.json
   * - config/
   *   ├── settings.json
   *   ├── depot_config.ini
   *   ├── Launcher.cs
   *   ├── TeleNest-Logo.ico
   *   └── TeleNest-Logo.svg
   * - Windows11-Setup-Guide.txt & README.txt
   */
  public static async exportFullZipPackage(onProgress?: (step: string) => void, includeExe: boolean = true): Promise<void> {
    onProgress?.('Capturing live database snapshot and latest configurations...');
    // Always clear cached bundle to guarantee the latest compiled version is used
    this._cachedBundle = null;
    const snapshotStr = storage.exportFullBackup();
    const snapshot: PortablePackageData = JSON.parse(snapshotStr);

    onProgress?.('Fetching latest compiled application bundle (zero cache)...');
    const bundle = await this.fetchOfflineAppBundle(true);

    const zip = new JSZip();
    const rootFolder = zip.folder('TeleNest-Portable');
    if (!rootFolder) throw new Error('Failed to initialize zip root folder');

    if (includeExe) {
      onProgress?.('Fetching compiled native standalone Windows executable (TeleNest.exe)...');
      try {
        const exeRes = await fetch(`/downloads/TeleNest.exe?_t=${Date.now()}`, { cache: 'no-store' });
        if (exeRes.ok) {
          const exeBlob = await exeRes.blob();
          const exeBuffer = await exeBlob.arrayBuffer();
          rootFolder.file('TeleNest.exe', exeBuffer);
        }
      } catch (e) {
        console.warn('Could not fetch precompiled TeleNest.exe from server:', e);
      }
    }

    onProgress?.('Generating Windows 11 / 10 launchers, shortcuts, and instructions...');
    // Root Launchers & Shortcuts (100% clean, native, zero false-positive)
    rootFolder.file('TeleNest.bat', this.generateTeleNestBat());
    rootFolder.file('TeleNest.url', this.generateInternetShortcut());
    rootFolder.file('HOW-TO-RUN.txt', this.generateWindows11SetupGuideText());
    rootFolder.file('README.txt', this.generateWindows11SetupGuideText());

    // Root standalone self-contained offline application
    const rootAppHtml = this.generateRootAppHtml(bundle, snapshotStr);
    rootFolder.file('TeleNest-Offline-SingleFile.html', rootAppHtml);
    rootFolder.file('app.html', rootAppHtml);

    // Resources Folder: Offline HTML apps & production web bundle
    onProgress?.('Preparing Resources/ folder with offline HTML and web assets...');
    const resourcesFolder = rootFolder.folder('Resources');
    if (resourcesFolder) {
      resourcesFolder.file('TeleNest.html', rootAppHtml);
      resourcesFolder.file('TeleNest-Offline-SingleFile.html', rootAppHtml);
      resourcesFolder.file('app.html', rootAppHtml);

      const appFolder = resourcesFolder.folder('app');
      if (appFolder) {
        appFolder.file('index.html', bundle.html || rootAppHtml);
        const appAssets = appFolder.folder('assets');
        if (appAssets && bundle.assets) {
          for (const [assetPath, assetContent] of Object.entries(bundle.assets)) {
            const fileName = assetPath.split('/').pop() || assetPath;
            appAssets.file(fileName, assetContent);
          }
        }
      }
    }

    // Data Folder: Master Database, Reports, Settings, and Profile
    onProgress?.('Generating master database files in Data/...');
    const dataFolder = rootFolder.folder('Data');
    if (dataFolder) {
      dataFolder.file('TeleNest_Database_Master.json', snapshotStr);
      dataFolder.file('TeleNest_DailyWork_Report.json', this.generateDailyWorkReportJson(snapshot));
      dataFolder.file('TeleNest_Inventory_Report.xlsx', this.generateExcelWorkbook(snapshot));
      dataFolder.file('TeleNest_Fleet_Cash.csv', this.generateFleetCashCsv(snapshot));
      dataFolder.file('TeleNest_Schema_Dump.sql', this.generateSchemaDumpSql(snapshot));
      dataFolder.file('settings.json', this.generateConfigSettingsJson(snapshot));
      dataFolder.file('depot_config.ini', this.generateDepotConfigIni());
      dataFolder.file('README.txt', `TeleNest Master Data Repository
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
- Profile/: Isolated portable browser cache & localStorage
`);
      // Initialize backups and Profile directories
      dataFolder.folder('backups');
      dataFolder.folder('Profile');
    }

    // Assets Folder: Icons, Logos, and Graphic Resources
    onProgress?.('Writing application icons & assets to Assets/...');
    const assetsFolder = rootFolder.folder('Assets');
    if (assetsFolder) {
      assetsFolder.file('TeleNest-Logo.svg', this.getTeleNestLogoSvg());
      try {
        const icoBlob = await this.getTeleNestLogoIcoBlob();
        const icoBuffer = await icoBlob.arrayBuffer();
        assetsFolder.file('TeleNest.ico', icoBuffer);
        rootFolder.file('TeleNest.ico', icoBuffer);
      } catch (e) {
        console.warn('Could not embed binary ICO; SVG icon supplied');
      }
    }

    // Libraries Folder: Auxiliary tools, micro-server, and compiler scripts
    onProgress?.('Adding micro-server and auxiliary utilities to Libraries/...');
    const librariesFolder = rootFolder.folder('Libraries');
    if (librariesFolder) {
      librariesFolder.file('TeleNestLauncher.cs', this.generateCSharpSource());
      librariesFolder.file('Build-Native-EXE.bat', this.generateBuildNativeExeBat());
      librariesFolder.file('Setup-And-Start-Exe.bat', this.generateSetupAndStartBat());
      librariesFolder.file('Run-Local-Server.bat', this.generateRunLocalServerBat());
      librariesFolder.file('Create-Desktop-Shortcut.bat', this.generateInstallShortcutBat());
      librariesFolder.file('TeleNest-AutoSave-Sync.bat', this.generateAutoSaveSyncBat());
      librariesFolder.file('Start-TeleNest-Win11.ps1', this.generatePowerShellRunner());
      librariesFolder.file('Windows11-Deployment-Guide.html', this.generateWindows11DeploymentGuideHtml(snapshot));
    }

    onProgress?.('Compressing TeleNest-Portable ZIP package...');
    const zipBlob = await zip.generateAsync({
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 9 },
    });

    onProgress?.('Downloading TeleNest-Portable.zip...');
    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `TeleNest-Portable.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Direct download for native compiled Windows Executable (TeleNest.exe)
   */
  public static async downloadNativeExe(): Promise<void> {
    try {
      const response = await fetch('/downloads/TeleNest.exe');
      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'TeleNest.exe';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        return;
      }
    } catch (e) {
      console.warn('Direct exe download error:', e);
    }
    // If server file not reached, trigger C# native compiler bat
    this.downloadBuildNativeExeBat();
  }

  /**
   * Direct download for Method 1: TeleNest.bat
   */
  public static downloadBatLauncher(): void {
    const batContent = this.generateTeleNestBat();
    this.triggerDownload('TeleNest.bat', batContent, 'application/x-bat');
  }

  /**
   * Direct download for Method 1 (Alternative): Start-TeleNest.cmd
   */
  public static downloadStartCmd(): void {
    const cmdContent = this.generateStartCmd();
    this.triggerDownload('Start-TeleNest.cmd', cmdContent, 'application/x-bat');
  }

  /**
   * Direct download for Method 2: TeleNest.hta
   */
  public static downloadTeleNestHta(): void {
    const htaContent = this.generateTeleNestHta();
    this.triggerDownload('TeleNest.hta', htaContent, 'application/hta');
  }

  public static downloadTeleRolloutHta(): void {
    this.downloadTeleNestHta();
  }

  /**
   * Direct download for Method 3: Launch-TeleNest.vbs
   */
  public static downloadLaunchVbs(): void {
    const vbsContent = this.generateTeleNestVbs();
    this.triggerDownload('Launch-TeleNest.vbs', vbsContent, 'application/x-vbs');
  }

  /**
   * Direct download for Method 4: Build-Native-EXE.bat
   */
  public static downloadBuildNativeExeBat(): void {
    const batContent = this.generateBuildNativeExeBat();
    this.triggerDownload('Build-Native-EXE.bat', batContent, 'application/x-bat');
  }

  /**
   * Direct download for 3: Single-File App (1-File Offline HTML)
   */
  public static async downloadSingleFileHtml(): Promise<void> {
    const snapshotStr = storage.exportFullBackup();
    const bundle = await this.fetchOfflineAppBundle();
    const htmlContent = this.generateSingleFileInlinedHtml(bundle, snapshotStr);
    this.triggerDownload('TeleNest-Offline-SingleFile.html', htmlContent, 'text/html');
  }

  /**
   * Direct download for Master Excel Report (.xlsx)
   */
  public static downloadExcelReport(): void {
    const snapshotStr = storage.exportFullBackup();
    const snapshot: PortablePackageData = JSON.parse(snapshotStr);
    const data = this.generateExcelWorkbook(snapshot);
    this.triggerBinaryDownload('TeleNest_Inventory_Report.xlsx', data, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  }

  /**
   * Direct download for Master Database JSON (.json)
   */
  public static downloadMasterDatabaseJson(): void {
    const snapshotStr = storage.exportFullBackup();
    this.triggerDownload('TeleNest_Database_Master.json', snapshotStr, 'application/json');
  }

  /**
   * Direct download for Fleet Cash CSV (.csv)
   */
  public static downloadFleetCashCsv(): void {
    const snapshotStr = storage.exportFullBackup();
    const snapshot: PortablePackageData = JSON.parse(snapshotStr);
    const csvContent = this.generateFleetCashCsv(snapshot);
    this.triggerDownload('TeleNest_Fleet_Cash.csv', csvContent, 'text/csv');
  }

  /**
   * Direct download for Schema Dump SQL (.sql)
   */
  public static downloadSchemaDumpSql(): void {
    const snapshotStr = storage.exportFullBackup();
    const snapshot: PortablePackageData = JSON.parse(snapshotStr);
    const sqlContent = this.generateSchemaDumpSql(snapshot);
    this.triggerDownload('TeleNest_Schema_Dump.sql', sqlContent, 'application/sql');
  }

  /**
   * Direct download for Setup-And-Start-Exe.bat
   */
  public static downloadSetupAndStartBat(): void {
    const batContent = this.generateSetupAndStartBat();
    this.triggerDownload('Setup-And-Start-Exe.bat', batContent, 'application/x-bat');
  }

  /**
   * Direct download for Windows 11 Desktop Shortcut Installer
   */
  public static downloadInstallShortcutBat(): void {
    const batContent = this.generateInstallShortcutBat();
    this.triggerDownload('Install-Windows11-Shortcut.bat', batContent, 'application/x-bat');
  }

  /**
   * Direct download for Windows 11 PowerShell Runner
   */
  public static downloadPowerShellRunner(): void {
    const psContent = this.generatePowerShellRunner();
    this.triggerDownload('Start-TeleNest-Win11.ps1', psContent, 'text/plain');
  }

  /**
   * Direct download for TeleNest-AutoSave-Portable-Sync.bat
   */
  public static downloadAutoSaveSyncBat(): void {
    const batContent = this.generateAutoSaveSyncBat();
    this.triggerDownload('TeleNest-AutoSave-Portable-Sync.bat', batContent, 'application/x-bat');
  }

  /**
   * Direct download for TeleNest_DailyWork_Report.json
   */
  public static downloadDailyWorkReportJson(): void {
    const snapshotStr = storage.exportFullBackup();
    const snapshot: PortablePackageData = JSON.parse(snapshotStr);
    const jsonContent = this.generateDailyWorkReportJson(snapshot);
    this.triggerDownload('TeleNest_DailyWork_Report.json', jsonContent, 'application/json');
  }

  /**
   * Direct download for Windows 11 Deployment Guide
   */
  public static downloadDeploymentGuide(): void {
    const snapshotStr = storage.exportFullBackup();
    const snapshot: PortablePackageData = JSON.parse(snapshotStr);
    const html = this.generateWindows11DeploymentGuideHtml(snapshot);
    this.triggerDownload('Windows11-10-Deployment-Guide.html', html, 'text/html');
  }

  /**
   * Generates full standalone HTML with the active database snapshot inlined
   */
  public static async generateFullStandaloneHtml(snapshotStr?: string): Promise<string> {
    const rawSnapshot = snapshotStr || storage.exportFullBackup();
    const bundle = await this.fetchOfflineAppBundle(true);
    return this.generateSingleFileInlinedHtml(bundle, rawSnapshot);
  }

  /**
   * Generates and triggers download of a complete Software Data Master Archive (.zip)
   * containing:
   * - TeleNest_Enterprise_Database_Master.json (Complete system restore snapshot)
   * - TeleNest_Executive_Inventory_Workbook.xlsx (5-Sheet Excel report)
   * - TeleNest_DailyWork_Report.json (Field operations & splicing logs)
   * - TeleNest_Fleet_Cash_Expenses.csv (Accounting & fleet ledger)
   * - TeleNest_Database_Schema_Dump.sql (Relational SQL tables & inserts)
   * - TeleNest_Settings_Config.json (Enterprise configurations & preferences)
   * - README_Data_Summary.txt (Repository manifest with exact record counts)
   */
  public static async exportSoftwareDataPackage(onProgress?: (step: string) => void): Promise<void> {
    onProgress?.('Extracting live enterprise database snapshot...');
    const snapshotStr = storage.exportFullBackup();
    const snapshot: PortablePackageData = JSON.parse(snapshotStr);
    const dateStr = new Date().toISOString().split('T')[0];

    const zip = new JSZip();
    const root = zip.folder(`TeleNest_Software_Data_${dateStr}`);
    if (!root) throw new Error('Failed to initialize software data archive');

    onProgress?.('Generating Enterprise Database Master JSON...');
    root.file('TeleNest_Enterprise_Database_Master.json', snapshotStr);

    onProgress?.('Generating 5-Sheet Executive Excel Workbook...');
    const excelBuffer = this.generateExcelWorkbook(snapshot);
    root.file('TeleNest_Executive_Inventory_Workbook.xlsx', excelBuffer);

    onProgress?.('Generating Field Operations & Daily Work JSON...');
    root.file('TeleNest_DailyWork_Report.json', this.generateDailyWorkReportJson(snapshot));

    onProgress?.('Generating Fleet Cash & Logistics CSV...');
    root.file('TeleNest_Fleet_Cash_Expenses.csv', this.generateFleetCashCsv(snapshot));

    onProgress?.('Generating Relational SQL Database Dump...');
    root.file('TeleNest_Database_Schema_Dump.sql', this.generateSchemaDumpSql(snapshot));

    onProgress?.('Generating System Settings & Configurations...');
    root.file('TeleNest_Settings_Config.json', this.generateConfigSettingsJson(snapshot));

    const totalInventory = (snapshot.data.inventory || []).length;
    const totalMovements = (snapshot.data.movements || []).length;
    const totalFTTH = (snapshot.data.ftth || []).length;
    const totalFTTB = (snapshot.data.fttb || []).length;
    const totalFTTM = (snapshot.data.fttm || []).length;
    const totalProjects = (snapshot.data.projects || []).length;
    const totalExpenses = (snapshot.data.expenses || []).length;
    const totalDailyWorks = (snapshot.data.dailyWorks || []).length;
    const totalUsers = (snapshot.data.users || []).length;

    const summaryText = `TeleNest ICT Logistics & Telecom Engineering
Complete Enterprise Software Data Master Archive
======================================================
Exported Date   : ${new Date().toLocaleString()}
Application     : TeleNest Enterprise v1.0.0
Engineer / Lead : ${snapshot.developer || 'Bilal Ahmed'}

DATA REPOSITORY MANIFEST & METRICS:
------------------------------------------------------
- Inventory Stock Items       : ${totalInventory} records
- Stock Transaction Movements : ${totalMovements} records
- Fiber FTTH Deployments      : ${totalFTTH} records
- Fiber FTTB Deployments      : ${totalFTTB} records
- Fiber FTTM Deployments      : ${totalFTTM} records
- Telecom Infrastructure Proj : ${totalProjects} records
- Operational Cash & Expenses : ${totalExpenses} records
- Daily Work Field Operations : ${totalDailyWorks} records
- Registered Personnel/Users  : ${totalUsers} accounts

INCLUDED ARTIFACTS:
------------------------------------------------------
1. TeleNest_Enterprise_Database_Master.json
   Complete encrypted snapshot ready to restore in TeleNest anytime via
   Options & Settings > Database & Backups > Restore Database.

2. TeleNest_Executive_Inventory_Workbook.xlsx
   5-Sheet Excel workbook containing formatted stock balances, unit values,
   movements ledger, projects, expenses, and users.

3. TeleNest_DailyWork_Report.json
   Field technician logs, fiber core splicing counts, optical power dBm.

4. TeleNest_Fleet_Cash_Expenses.csv
   Standard universal comma-separated ledger compatible with QuickBooks, SAP, Excel.

5. TeleNest_Database_Schema_Dump.sql
   ANSI SQL DDL & DML tables and inserts compatible with PostgreSQL, MySQL, and SQL Server.

6. TeleNest_Settings_Config.json
   Theme preferences, letterhead templates, custom currency exchange rates.
======================================================
`;
    root.file('README_Data_Summary.txt', summaryText);

    onProgress?.('Compressing software data archive (.zip)...');
    const zipBlob = await zip.generateAsync({
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    });

    onProgress?.('Initiating direct download...');
    const filename = `TeleNest_Software_Data_${dateStr}.zip`;
    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Resets all software export options, caches, and launcher configurations in TeleNest Portable (Win 11).
   * Restores certified factory defaults, clears stale bundle caches, re-verifies assets, and logs system audit.
   */
  public static async resetAllExportOptions(user?: any): Promise<{ success: boolean; message: string; timestamp: string }> {
    try {
      // 1. Reset stored portable export configs in localStorage
      localStorage.removeItem('telenest_portable_export_config_v1');
      localStorage.removeItem('telenest_custom_launcher_flags_v1');
      localStorage.removeItem('telenest_offline_bundle_cache_v1');

      // 2. Clear in-memory cached bundle so fetchOfflineAppBundle refreshes from latest build
      this._cachedBundle = null;

      // 3. Ensure company configuration is healthy
      const currentConfig = storage.getCompanyConfig();
      if (!currentConfig || !currentConfig.companyName) {
        storage.saveCompanyConfig(INITIAL_COMPANY_CONFIG);
      }

      // 4. Test fetch fresh bundle to verify integrity
      const bundle = await this.fetchOfflineAppBundle();
      const hasHtml = !!(bundle && bundle.html);
      const hasJs = Object.keys(bundle.assets || {}).some(k => k.endsWith('.js'));
      const hasCss = Object.keys(bundle.assets || {}).some(k => k.endsWith('.css'));

      // 5. Log activity
      storage.logActivity({
        userId: user?.id || 'sys_admin',
        userName: user?.fullName || 'Administrator',
        userRole: user?.role || 'Administrator',
        action: 'SETTINGS_CHANGE',
        module: 'System',
        targetId: 'reset_export_options',
        description: 'All Windows 11 / 10 software export options, launcher parameters, and offline bundles were successfully reset to certified factory defaults.',
      });

      return {
        success: true,
        message: `All Windows 11 software export options have been reset to certified factory defaults. Bundle integrity verified (${hasHtml ? 'HTML OK' : 'HTML warning'}, ${hasJs ? 'JS OK' : 'JS warning'}, ${hasCss ? 'CSS OK' : 'CSS warning'}).`,
        timestamp: new Date().toISOString(),
      };
    } catch (err: any) {
      console.error('Reset export options error:', err);
      return {
        success: false,
        message: `Export options reset encountered an error: ${err?.message || err}`,
        timestamp: new Date().toISOString(),
      };
    }
  }
}
