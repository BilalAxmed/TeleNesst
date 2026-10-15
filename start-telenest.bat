@echo off
REM TeleNest Enterprise Desktop Launcher for Windows
REM Developed by Bilal Ahmed
echo ===================================================
echo     TeleNest - Warehouse & ICT Inventory System
echo                 Developed by Bilal Ahmed
echo ===================================================
echo.

WHERE node >nul 2>nul
IF %ERRORLEVEL% NEQ 0 (
    echo [INFO] Node.js not detected on system PATH.
    echo [INFO] Switching to zero-dependency TeleNest Portable Launcher...
    IF EXIST "TeleNest-Portable\TeleNest.bat" (
        cd TeleNest-Portable
        call TeleNest.bat
        exit /b 0
    )
    IF EXIST "TeleNest-Windows-Portable\TeleNest.bat" (
        cd TeleNest-Windows-Portable
        call TeleNest.bat
        exit /b 0
    )
    IF EXIST "TeleNest.exe" (
        echo [INFO] Launching TeleNest native executable...
        start "" "TeleNest.exe"
        exit /b 0
    )
    IF EXIST "TeleNest-Portable\TeleNest.exe" (
        echo [INFO] Launching TeleNest Portable executable...
        start "" "TeleNest-Portable\TeleNest.exe"
        exit /b 0
    )
    IF EXIST "TeleNest-Standalone-Offline.html" (
        echo [INFO] Launching TeleNest Standalone Offline Edition...
        start "" "TeleNest-Standalone-Offline.html"
        exit /b 0
    )
    IF EXIST "TeleNest-Portable\TeleNest.html" (
        echo [INFO] Launching TeleNest Standalone Offline Edition...
        start "" "TeleNest-Portable\TeleNest.html"
        exit /b 0
    )
    echo [ERROR] Please install Node.js from https://nodejs.org/ or run TeleNest-Portable\TeleNest.bat
    pause
    exit /b 1
)

IF NOT EXIST "node_modules" (
    echo [INFO] Installing required dependencies...
    call npm install
)

echo [INFO] Starting TeleNest local server...
start /b "" cmd /c "timeout /t 3 /nobreak >nul 2>&1 && start http://localhost:3000"
call npm run dev
pause
