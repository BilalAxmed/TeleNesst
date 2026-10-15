@echo off
title TeleNest Portable Desktop App Mode
cd /d "%~dp0"
echo Starting TeleNest in Native Desktop Window Mode...
if exist "%~dp0Libraries\server.ps1" (
    powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0Libraries\server.ps1"
) else (
    powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0server.ps1"
)
