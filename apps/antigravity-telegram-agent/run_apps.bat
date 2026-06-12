@echo off
title Superapp Dev — All Apps + Ngrok
cd /d "%~dp0\.."

echo [1/2] Starting all Vite dev servers in background...
start "Admin 5173"     cmd /c "cd apps\admin-portal && npm run dev"
start "Cashflow 5174"  cmd /c "cd apps\cashflow && npm run dev"
start "Inventory 5175" cmd /c "cd apps\inventory-operation && npm run dev"
start "Sales 5176"     cmd /c "cd apps\sales-operation && npm run dev"
start "HR 5177"        cmd /c "cd apps\hr-operation && npm run dev"
start "Accounting 5178" cmd /c "cd apps\accounting && npm run dev"

echo [*] Waiting 5s for dev servers to boot...
timeout /t 5 /nobreak >nul

echo [2/2] Starting ngrok tunnels (all apps)...
echo       Tunnels will appear at ngrok dashboard: https://dashboard.ngrok.com
echo       Press Ctrl+C to stop all tunnels.
echo.
ngrok start --all

echo.
echo [!] Ngrok stopped. Dev servers still running in background.
echo     Close their windows manually if needed.
pause
