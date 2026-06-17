@echo off
title Business Bot — Superapp (with Health Check)
cd /d "%~dp0"
set MAX_RESTART=10
set RESTART_COUNT=0

:loop
set /a RESTART_COUNT+=1
if %RESTART_COUNT% GTR %MAX_RESTART% (
    echo [BIZ] Max restart limit reached (%MAX_RESTART%). Stopping.
    echo [BIZ] %date% %time% - MAX RESTART REACHED >> crash_log.txt
    exit /b 1
)

echo [BIZ] Checking for stale bot instances...
for /f "tokens=1" %%i in ('wmic process where "name like '%%python%%' and commandline like '%%superapp-business-bot%%main.py%%'" get processid ^| findstr /r "[0-9]"') do (
    echo [BIZ] Killing stale PID %%i
    taskkill /F /PID %%i >nul 2>&1
)

REM Kill zombie node processes older than 30 minutes
powershell -NoProfile -Command "Get-Process node -ErrorAction SilentlyContinue | Where-Object {$_.StartTime -lt (Get-Date).AddMinutes(-30)} | Stop-Process -Force" 2>nul

timeout /t 2 /nobreak >nul

echo [BIZ] Starting bot (attempt %RESTART_COUNT%)...
echo [BIZ] %date% %time% - Start attempt %RESTART_COUNT% >> crash_log.txt
python main.py

echo [BIZ] Bot exited with code %ERRORLEVEL%. Logged.
echo [BIZ] %date% %time% - Exit code %ERRORLEVEL% >> crash_log.txt

if %ERRORLEVEL% EQU 0 (
    echo [BIZ] Clean exit. Restarting in 3s...
    set RESTART_COUNT=0
    timeout /t 3 /nobreak >nul
) else (
    echo [BIZ] Crash detected. Restarting in 10s...
    timeout /t 10 /nobreak >nul
)
goto loop
