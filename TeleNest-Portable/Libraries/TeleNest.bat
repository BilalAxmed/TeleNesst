@echo off
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
if exist "%SystemRoot%\Microsoft.NET\Framework64\v4.0.30319\csc.exe" (
    set "CSC_EXE=%SystemRoot%\Microsoft.NET\Framework64\v4.0.30319\csc.exe"
) else if exist "%SystemRoot%\Microsoft.NET\Framework\v4.0.30319\csc.exe" (
    set "CSC_EXE=%SystemRoot%\Microsoft.NET\Framework\v4.0.30319\csc.exe"
)

if defined CSC_EXE if exist "!SCRIPT_DIR!Libraries\TeleNestLauncher.cs" (
    echo [*] Windows .NET C# compiler located. Auto-compiling native TeleNest.exe...
    set "ICON_ARG="
    if exist "!SCRIPT_DIR!Assets\TeleNest.ico" set "ICON_ARG=/win32icon:\"!SCRIPT_DIR!Assets\TeleNest.ico\""
    "!CSC_EXE!" /target:winexe /optimize+ !ICON_ARG! /r:System.dll /r:System.Windows.Forms.dll /r:System.Drawing.dll /out:"!SCRIPT_DIR!TeleNest.exe" "!SCRIPT_DIR!Libraries\TeleNestLauncher.cs" >nul 2>&1
    if exist "!SCRIPT_DIR!TeleNest.exe" (
        echo [SUCCESS] TeleNest.exe compiled! Launching native executable...
        start "" "!SCRIPT_DIR!TeleNest.exe"
        exit /b 0
    )
)

:: Fallback: Start zero-dependency local PowerShell micro-server
echo [1/2] Initializing zero-dependency local portable server...
if exist "!SCRIPT_DIR!Libraries\server.ps1" (
    powershell -NoProfile -ExecutionPolicy Bypass -File "!SCRIPT_DIR!Libraries\server.ps1"
) else if exist "!SCRIPT_DIR!server.ps1" (
    powershell -NoProfile -ExecutionPolicy Bypass -File "!SCRIPT_DIR!server.ps1"
)

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [NOTICE] PowerShell server was interrupted or restricted by Windows policy.
    echo Opening Standalone Single-File Offline Edition directly in default browser...
    if exist "!SCRIPT_DIR!Resources\TeleNest.html" (
        start "" "!SCRIPT_DIR!Resources\TeleNest.html"
    ) else (
        start "" "!SCRIPT_DIR!TeleNest-Offline-SingleFile.html"
    )
)
pause
