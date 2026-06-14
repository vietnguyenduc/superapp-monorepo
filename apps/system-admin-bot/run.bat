@echo off
title Admin Bot — Developer Agent
cd /d "%~dp0"

:loop
echo [ADMIN] Checking for stale bot instances...
:: Kill only python processes that are running main.py in this folder (not all python)
for /f "tokens=1" %%i in ('wmic process where "name like '%%python%%' and commandline like '%%system-admin-bot%%main.py%%'" get processid ^| findstr /r "[0-9]"') do (
    echo [ADMIN] Killing stale PID %%i
    taskkill /F /PID %%i >nul 2>&1
)
timeout /t 2 /nobreak >nul

echo [ADMIN] Starting bot (PID will be saved)...
python main.py

echo.
echo [ADMIN] Bot exited. Restarting in 3s... (Ctrl+C to stop)
timeout /t 3 /nobreak >nul
goto loop
