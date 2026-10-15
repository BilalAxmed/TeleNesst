@echo off
setlocal enabledelayedexpansion
title TeleNest Enterprise - Local Server Mode
echo ===============================================================================
echo      TeleNest ICT Enterprise - Local Offline Server Launcher
echo          TeleNest ICT Logistics ^& Operations Architecture
echo                     Developer: Bilal Ahmed
echo ===============================================================================
echo.
cd /d "%~dp0"
set "PORT=8080"
echo [*] Initializing local server on port %PORT%...
echo [*] Launching standalone local application at http://127.0.0.1:%PORT%/TeleNest.html
echo [*] Powered by non-admin socket micro-server (zero installation)...
echo.
start "" powershell -NoProfile -ExecutionPolicy Bypass -Command "$port = %PORT%; $dir = (Get-Location).Path; try { $tcp = New-Object System.Net.Sockets.TcpListener([System.Net.IPAddress]::Loopback, $port); $tcp.Start(); } catch { $port = 8088; $tcp = New-Object System.Net.Sockets.TcpListener([System.Net.IPAddress]::Loopback, $port); $tcp.Start(); }; Write-Host "[*] TeleNest Local Server active at http://127.0.0.1:$port/"; Start-Process 'msedge.exe' -ArgumentList "--app=http://127.0.0.1:$port/TeleNest.html --window-size=1440,900" -ErrorAction SilentlyContinue; while ($true) { try { $client = $tcp.AcceptTcpClient(); $stream = $client.GetStream(); $reader = New-Object System.IO.StreamReader($stream); $line = $reader.ReadLine(); if ($line) { $tokens = $line.Split(' '); if ($tokens.Length -ge 2) { $raw = $tokens[1].TrimStart('/').Split('?')[0]; if ([string]::IsNullOrEmpty($raw)) { $raw = 'TeleNest.html' }; $target = Join-Path $dir $raw; if (Test-Path $target -PathType Leaf) { $bytes = [System.IO.File]::ReadAllBytes($target); $ct = 'text/plain'; if ($target.EndsWith('.html')) { $ct = 'text/html; charset=utf-8' } elseif ($target.EndsWith('.js')) { $ct = 'application/javascript; charset=utf-8' } elseif ($target.EndsWith('.css')) { $ct = 'text/css; charset=utf-8' } elseif ($target.EndsWith('.json')) { $ct = 'application/json; charset=utf-8' } elseif ($target.EndsWith('.ico')) { $ct = 'image/x-icon' } elseif ($target.EndsWith('.svg')) { $ct = 'image/svg+xml' }; $hdr = "HTTP/1.1 200 OK`r`nContent-Type: $ct`r`nContent-Length: " + $bytes.Length + "`r`nAccess-Control-Allow-Origin: *`r`nConnection: close`r`n`r`n"; $hB = [System.Text.Encoding]::UTF8.GetBytes($hdr); $stream.Write($hB, 0, $hB.Length); $stream.Write($bytes, 0, $bytes.Length); } else { $nf = [System.Text.Encoding]::UTF8.GetBytes("HTTP/1.1 404 Not Found`r`nConnection: close`r`n`r`n"); $stream.Write($nf, 0, $nf.Length); } } } $client.Close(); } catch {} }"
exit /b 0
