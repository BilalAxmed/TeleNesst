#!/usr/bin/env bash
# TeleNest Enterprise Desktop Launcher for Linux & macOS
# Developed by Bilal Ahmed

set -e

echo "==================================================="
echo "    TeleNest - Warehouse & ICT Inventory System"
echo "                Developed by Bilal Ahmed"
echo "==================================================="
echo ""

if ! command -v node &> /dev/null; then
    echo "[ERROR] Node.js is not installed or not in PATH."
    echo "Please install Node.js (v18+) from https://nodejs.org/"
    exit 1
fi

if [ ! -d "node_modules" ]; then
    echo "[INFO] Installing application dependencies..."
    npm install
fi

echo "[INFO] Launching TeleNest..."
# Try to open default browser
if command -v xdg-open &> /dev/null; then
    (sleep 2 && xdg-open http://localhost:3000) &
elif command -v open &> /dev/null; then
    (sleep 2 && open http://localhost:3000) &
fi

npm run dev
