@echo off
title TeleNest Offline Direct Browser Launch
cd /d "%~dp0"
echo Opening TeleNest Standalone Single-File Edition in default browser...
if exist "%~dp0Resources\TeleNest.html" (
    start "" "%~dp0Resources\TeleNest.html"
) else (
    start "" "%~dp0TeleNest-Offline-SingleFile.html"
)
