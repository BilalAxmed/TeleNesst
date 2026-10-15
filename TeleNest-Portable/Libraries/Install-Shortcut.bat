@echo off
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
if not exist "!ICON_FILE!" set "ICON_FILE=!SCRIPT_DIR!config\TeleNest-Logo.ico"
if not exist "!ICON_FILE!" set "ICON_FILE=!TARGET_EXE!"

:: Ensure Safe Work Directory exists and copy database snapshot
set "SAFE_DIR=C:\Database safe work files"
if not exist "!SAFE_DIR!" mkdir "!SAFE_DIR!" >nul 2>&1
if exist "!SCRIPT_DIR!Database safe work files\TeleNest_Database_Master.json" (
    copy /y "!SCRIPT_DIR!Database safe work files\TeleNest_Database_Master.json" "!SAFE_DIR!\TeleNest_Database_Master.json" >nul 2>&1
)

echo [*] Target Launcher: "!TARGET_EXE!"
echo [*] Working Directory: "!SCRIPT_DIR!"
echo [*] Application Icon:  "!ICON_FILE!"
echo [*] Creating Desktop & Start Menu Shortcuts...
echo.

:: 1. Create standard Windows Desktop Shortcut (.url format - 100% clean, native Windows)
set "DESKTOP_DIR=%USERPROFILE%\Desktop"
set "START_DIR=%APPDATA%\Microsoft\Windows\Start Menu\Programs\TeleNest"
if not exist "!START_DIR!" mkdir "!START_DIR!" >nul 2>&1

(
echo [InternetShortcut]
echo URL=file:///!TARGET_EXE:\=/!
echo IconFile=!ICON_FILE!
echo IconIndex=0
) > "!DESKTOP_DIR!\TeleNest ICT Enterprise.url"

:: 2. Create Start Menu Shortcut (.url format)
(
echo [InternetShortcut]
echo URL=file:///!TARGET_EXE:\=/!
echo IconFile=!ICON_FILE!
echo IconIndex=0
) > "!START_DIR!\TeleNest ICT Enterprise.url"

echo [SUCCESS] Windows Desktop Shortcut 'TeleNest ICT Enterprise' created with official logo!
echo [SUCCESS] Start Menu shortcut created under 'TeleNest'.
echo.
echo Would you like to launch TeleNest right now? (Y/N)
set /p CHOICE="Press Y to launch now, or any other key to exit: "
if /i "!CHOICE!"=="Y" (
    start "" "!TARGET_EXE!"
)
exit /b 0
