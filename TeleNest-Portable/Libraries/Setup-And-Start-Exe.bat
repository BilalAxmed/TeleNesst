@echo off
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
if not exist "!CS_FILE!" set "CS_FILE=!SCRIPT_DIR!configLauncher.cs"

set "OUT_EXE=!SCRIPT_DIR!TeleNest.exe"

set "ICO_FILE=!SCRIPT_DIR!TeleNest-Logo.ico"
if not exist "!ICO_FILE!" set "ICO_FILE=!SCRIPT_DIR!configTeleNest-Logo.ico"

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
if exist "%SystemRoot%\Microsoft.NET\Framework64\v4.0.30319\csc.exe" (
    set "CSC_EXE=%SystemRoot%\Microsoft.NET\Framework64\v4.0.30319\csc.exe"
) else if exist "%SystemRoot%\Microsoft.NET\Framework\v4.0.30319\csc.exe" (
    set "CSC_EXE=%SystemRoot%\Microsoft.NET\Framework\v4.0.30319\csc.exe"
)

if defined CSC_EXE (
    set "ICON_ARG="
    if exist "!ICO_FILE!" set "ICON_ARG=/win32icon:\"!ICO_FILE!\""
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
