================================================================================
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
