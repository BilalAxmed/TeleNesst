@echo off
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

set "CS_FILE=!SCRIPT_DIR!config\Launcher.cs"
if not exist "!CS_FILE!" set "CS_FILE=!SCRIPT_DIR!TeleNestLauncher.cs"
set "ICON_FILE=!SCRIPT_DIR!config\TeleNest-Logo.ico"
if not exist "!ICON_FILE!" set "ICON_FILE=!SCRIPT_DIR!TeleNest-Logo.ico"
set "OUT_EXE=!SCRIPT_DIR!TeleNest.exe"

if not exist "!CS_FILE!" (
    echo [ERROR] C# source file '!CS_FILE!' was not found.
    pause
    exit /b 1
)

echo [*] Locating Windows built-in Microsoft .NET C# compiler (csc.exe)...

set "CSC_EXE="
if exist "%SystemRoot%\Microsoft.NET\Framework64\v4.0.30319\csc.exe" (
    set "CSC_EXE=%SystemRoot%\Microsoft.NET\Framework64\v4.0.30319\csc.exe"
) else if exist "%SystemRoot%\Microsoft.NET\Framework\v4.0.30319\csc.exe" (
    set "CSC_EXE=%SystemRoot%\Microsoft.NET\Framework\v4.0.30319\csc.exe"
) else if exist "%SystemRoot%\Microsoft.NET\Framework64\v3.5\csc.exe" (
    set "CSC_EXE=%SystemRoot%\Microsoft.NET\Framework64\v3.5\csc.exe"
) else if exist "%SystemRoot%\Microsoft.NET\Framework\v3.5\csc.exe" (
    set "CSC_EXE=%SystemRoot%\Microsoft.NET\Framework\v3.5\csc.exe"
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
    set "ICON_ARG=/win32icon:\"!ICON_FILE!\""
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
