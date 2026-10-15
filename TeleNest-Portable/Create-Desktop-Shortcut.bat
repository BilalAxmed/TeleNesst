@echo off
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
if not exist "!APP_FILE!" set "APP_FILE=!SCRIPT_DIR!Resources\TeleNest.html"
if not exist "!APP_FILE!" set "APP_FILE=!SCRIPT_DIR!TeleNest-Offline-SingleFile.html"

set "ICON_FILE=!SCRIPT_DIR!Assets\TeleNest.ico"
if not exist "!ICON_FILE!" set "ICON_FILE=!SCRIPT_DIR!TeleNest.ico"

set "DESKTOP_DIR=%USERPROFILE%\Desktop"

:: Create standard Windows URL shortcut on Desktop (100% clean, native Windows format)
(
echo [InternetShortcut]
echo URL=file:///!APP_FILE:\=/!
echo IconFile=!ICON_FILE!
echo IconIndex=0
) > "!DESKTOP_DIR!\TeleNest ICT Enterprise.url"

echo [SUCCESS] Desktop Shortcut 'TeleNest ICT Enterprise' created on your Windows Desktop!
echo [SUCCESS] Target: !APP_FILE!
echo.
echo Launch TeleNest now? (Y/N)
set /p CHOICE="Press Y to start software, or any other key to exit: "
if /i "!CHOICE!"=="Y" (
    start "" "!APP_FILE!"
)
exit /b 0
