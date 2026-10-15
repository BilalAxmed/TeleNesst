@echo off
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

set "SAFE_DIR=C:\Database safe work files"
if not exist "!SAFE_DIR!" mkdir "!SAFE_DIR!" >nul 2>&1

echo [*] Target Safe Folder: !SAFE_DIR!
echo [*] Backing up and synchronizing daily work records...

set "TIMESTAMP=%date:~10,4%%date:~4,2%%date:~7,2%_%time:~0,2%%time:~3,2%%time:~6,2%"
set "TIMESTAMP=%TIMESTAMP: =0%"

if exist "!SAFE_DIR!\TeleNest_Database_Master.json" (
    copy /y "!SAFE_DIR!\TeleNest_Database_Master.json" "!SAFE_DIR!\TeleNest_Database_Master_!TIMESTAMP!.bak" >nul 2>&1
    echo [OK] Timestamped master backup created: TeleNest_Database_Master_!TIMESTAMP!.bak
)

if exist "%SCRIPT_DIR%Database safe work files\TeleNest_Database_Master.json" (
    copy /y "%SCRIPT_DIR%Database safe work files\TeleNest_Database_Master.json" "!SAFE_DIR!\TeleNest_Database_Master.json" >nul 2>&1
    echo [OK] Master Database synchronized to C:\Database safe work files
)

if exist "%SCRIPT_DIR%Database safe work files\TeleNest_DailyWork_Report.json" (
    copy /y "%SCRIPT_DIR%Database safe work files\TeleNest_DailyWork_Report.json" "!SAFE_DIR!\TeleNest_DailyWork_Report.json" >nul 2>&1
    echo [OK] Daily Work Log synchronized to C:\Database safe work files
)

echo.
echo ===============================================================================
echo [SUCCESS] Daily Work & Master Database auto-sync complete on Windows 11 / 10!
echo ===============================================================================
echo.
pause
