# ===============================================================================
# TeleNest Zero-Dependency Windows Local Micro-Server & REST API
# Compatible with: Windows 11, Windows 10, Windows 8.1, Windows 7 SP1
# Architect: Bilal Ahmed (bilalaxmed.47@gmail.com)
# ===============================================================================

$ErrorActionPreference = "SilentlyContinue"
$Port = 3000
$RootPath = Join-Path $PSScriptRoot "app"
if (-not (Test-Path $RootPath)) {
    $RootPath = $PSScriptRoot
}
$DataPath = Join-Path $PSScriptRoot "data"
$DbFile = Join-Path $DataPath "TeleNest_Database_Master.json"
$BackupsPath = Join-Path $DataPath "backups"
if (-not (Test-Path $BackupsPath)) {
    New-Item -ItemType Directory -Path $BackupsPath -Force | Out-Null
}

# Test if port is available; fallback to 3001 or 8080 if needed
$listener = New-Object System.Net.HttpListener
$prefixes = @("http://localhost:$Port/", "http://127.0.0.1:$Port/")
$bound = $false

foreach ($prefix in $prefixes) {
    try {
        $listener.Prefixes.Clear()
        $listener.Prefixes.Add($prefix)
        $listener.Start()
        $bound = $true
        break
    } catch {
        # Try next
    }
}

if (-not $bound) {
    $Port = 3001
    $listener.Prefixes.Clear()
    $listener.Prefixes.Add("http://localhost:$Port/")
    try {
        $listener.Start()
        $bound = $true
    } catch {
        $Port = 8080
        $listener.Prefixes.Clear()
        $listener.Prefixes.Add("http://localhost:$Port/")
        $listener.Start()
    }
}

$url = "http://localhost:$Port/"

Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host "  TeleNest ICT & Warehouse System - Windows Portable Engine" -ForegroundColor White
Write-Host "  Developer: Bilal Ahmed (bilalaxmed.47@gmail.com)" -ForegroundColor Gray
Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host " [*] Local Server Active: $url" -ForegroundColor Green
Write-Host " [*] Serving Directory:   $RootPath" -ForegroundColor DarkGray
Write-Host " [*] Press Ctrl+C in this window to stop the server." -ForegroundColor Yellow
Write-Host ""

# Launch browser in Native App Mode (--app)
$edgePath = "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe"
if (-not (Test-Path $edgePath)) {
    $edgePath = "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe"
}
$chromePath = "$env:ProgramFiles\Google\Chrome\Application\chrome.exe"
if (-not (Test-Path $chromePath)) {
    $chromePath = "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe"
}

if ($bound) {
    # Warm up HTTP listener socket before launching browser to avoid connection reset
    Start-Sleep -Milliseconds 800
    if (Test-Path $edgePath) {
        Start-Process $edgePath -ArgumentList "--app=$url", "--window-size=1440,900", "--window-position=50,30"
    } elseif (Test-Path $chromePath) {
        Start-Process $chromePath -ArgumentList "--app=$url", "--window-size=1440,900", "--window-position=50,30"
    } else {
        Start-Process $url
    }
} else {
    Write-Host " [!] HTTP Listener restricted by Windows permissions. Falling back to Standalone App..." -ForegroundColor Yellow
    $singleFile = Join-Path $PSScriptRoot "TeleNest-Offline-SingleFile.html"
    if (Test-Path $singleFile) {
        $fileUrl = "file:///" + $singleFile.Replace('\', '/')
        if (Test-Path $edgePath) {
            Start-Process $edgePath -ArgumentList "--app=$fileUrl", "--window-size=1440,900"
        } elseif (Test-Path $chromePath) {
            Start-Process $chromePath -ArgumentList "--app=$fileUrl", "--window-size=1440,900"
        } else {
            Start-Process $singleFile
        }
    }
}

$mimeTypes = @{
    ".html"  = "text/html; charset=utf-8"
    ".htm"   = "text/html; charset=utf-8"
    ".js"    = "application/javascript; charset=utf-8"
    ".mjs"   = "application/javascript; charset=utf-8"
    ".css"   = "text/css; charset=utf-8"
    ".json"  = "application/json; charset=utf-8"
    ".svg"   = "image/svg+xml"
    ".png"   = "image/png"
    ".jpg"   = "image/jpeg"
    ".jpeg"  = "image/jpeg"
    ".gif"   = "image/gif"
    ".webp"  = "image/webp"
    ".ico"   = "image/x-icon"
    ".woff"  = "font/woff"
    ".woff2" = "font/woff2"
    ".ttf"   = "font/ttf"
    ".txt"   = "text/plain; charset=utf-8"
    ".csv"   = "text/csv; charset=utf-8"
    ".xlsx"  = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
}

try {
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response
        $response.AddHeader("Access-Control-Allow-Origin", "*")
        $response.AddHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        $response.AddHeader("Access-Control-Allow-Headers", "Content-Type")

        if ($request.HttpMethod -eq "OPTIONS") {
            $response.StatusCode = 200
            $response.Close()
            continue
        }

        $rawUrl = $request.Url.LocalPath

        # REST API Endpoints for Local Persistence
        if ($rawUrl -eq "/api/health") {
            $json = '{"status":"ok","mode":"windows-portable","app":"TeleNest","developer":"Bilal Ahmed"}'
            $bytes = [System.Text.Encoding]::UTF8.GetBytes($json)
            $response.ContentType = "application/json; charset=utf-8"
            $response.ContentLength64 = $bytes.Length
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
            $response.Close()
            continue
        }

        if ($rawUrl -eq "/api/data") {
            if ($request.HttpMethod -eq "GET") {
                if (Test-Path $DbFile) {
                    $bytes = [System.IO.File]::ReadAllBytes($DbFile)
                    $response.ContentType = "application/json; charset=utf-8"
                    $response.ContentLength64 = $bytes.Length
                    $response.OutputStream.Write($bytes, 0, $bytes.Length)
                } else {
                    $response.StatusCode = 404
                }
                $response.Close()
                continue
            } elseif ($request.HttpMethod -eq "POST") {
                $reader = New-Object System.IO.StreamReader($request.InputStream, [System.Text.Encoding]::UTF8)
                $body = $reader.ReadToEnd()
                [System.IO.File]::WriteAllText($DbFile, $body, [System.Text.Encoding]::UTF8)
                
                # Timestamped backup
                $ts = (Get-Date).ToString("yyyyMMdd_HHmmss")
                $bak = Join-Path $BackupsPath "TeleNest_Database_$ts.json"
                [System.IO.File]::WriteAllText($bak, $body, [System.Text.Encoding]::UTF8)
                
                $ack = '{"status":"saved","timestamp":"' + $ts + '"}'
                $bytes = [System.Text.Encoding]::UTF8.GetBytes($ack)
                $response.ContentType = "application/json; charset=utf-8"
                $response.ContentLength64 = $bytes.Length
                $response.OutputStream.Write($bytes, 0, $bytes.Length)
                $response.Close()
                continue
            }
        }

        # Static File Serving
        if ($rawUrl -eq "/" -or $rawUrl -eq "") {
            $rawUrl = "/index.html"
        }

        $cleanPath = $rawUrl.TrimStart('/').Replace('/', [System.IO.Path]::DirectorySeparatorChar)
        $filePath = Join-Path $RootPath $cleanPath

        if (Test-Path $filePath -PathType Leaf) {
            $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
            $contentType = $mimeTypes[$ext]
            if (-not $contentType) { $contentType = "application/octet-stream" }

            $response.ContentType = $contentType
            $response.AddHeader("Cache-Control", "no-cache")

            $bytes = [System.IO.File]::ReadAllBytes($filePath)
            $response.ContentLength64 = $bytes.Length
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
        } else {
            # SPA Fallback to index.html
            $fallback = Join-Path $RootPath "index.html"
            if (Test-Path $fallback) {
                $response.ContentType = "text/html; charset=utf-8"
                $bytes = [System.IO.File]::ReadAllBytes($fallback)
                $response.ContentLength64 = $bytes.Length
                $response.OutputStream.Write($bytes, 0, $bytes.Length)
            } else {
                $response.StatusCode = 404
            }
        }
        $response.Close()
    }
} finally {
    $listener.Stop()
    $listener.Close()
}
