<#
.SYNOPSIS
    TeleNest Windows 11 Native PowerShell Runner
    Author: Bilal Ahmed (bilalaxmed.47@gmail.com)
.DESCRIPTION
    Launches TeleNest ICT Warehouse System in native modern App Window Mode
#>

$ErrorActionPreference = "SilentlyContinue"
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

$appHtml = Join-Path $scriptDir "TeleNest.html"
if (-not (Test-Path $appHtml)) { $appHtml = Join-Path $scriptDir "app.html" }
$logoIco = Join-Path $scriptDir "TeleNest-Logo.ico"

Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host " TeleNest Windows 11 Native Enterprise Launcher" -ForegroundColor White
Write-Host " TeleNest ICT Warehouse & Operations System" -ForegroundColor Gray
Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host ""

if (-not (Test-Path $appHtml)) {
    Write-Host "[ERROR] Neither 'TeleNest.html' nor 'app.html' found in $scriptDir" -ForegroundColor Red
    Pause
    Exit 1
}

# Look for Microsoft Edge (installed natively on every Windows 11)
$edgePaths = @(
    "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe",
    "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe",
    "$env:LocalAppData\Microsoft\Edge\Application\msedge.exe"
)

$edgeExe = $null
foreach ($path in $edgePaths) {
    if (Test-Path $path) {
        $edgeExe = $path
        break
    }
}

if ($edgeExe) {
    Write-Host "[*] Launching Microsoft Edge Native App-Window Mode..." -ForegroundColor Green
    Start-Process $edgeExe -ArgumentList "--app=`"$appHtml`"", "--allow-file-access-from-files", "--test-type", "--window-size=1440,900"
    Write-Host "[SUCCESS] TeleNest window started!" -ForegroundColor Cyan
} else {
    Write-Host "[*] Launching default Windows browser..." -ForegroundColor Yellow
    Start-Process "$appHtml"
}
