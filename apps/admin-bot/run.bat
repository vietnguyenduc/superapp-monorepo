@echo off
title Admin Bot — DevOps Controller (with Health Check)
cd /d "%~dp0"
set MAX_RESTART=10
set RESTART_COUNT=0

:loop
set /a RESTART_COUNT+=1
if %RESTART_COUNT% GTR %MAX_RESTART% (
    echo [ADMIN] Max restart limit reached (%MAX_RESTART%). Stopping.
    echo [ADMIN] %date% %time% - MAX RESTART REACHED >> crash_log.txt
    exit /b 1
)

echo [ADMIN] Starting Admin Bot (attempt %RESTART_COUNT%)...
echo [ADMIN] %date% %time% - Start attempt %RESTART_COUNT% >> crash_log.txt
python main.py

echo [ADMIN] Bot exited with code %ERRORLEVEL%.
echo [ADMIN] %date% %time% - Exit code %ERRORLEVEL% >> crash_log.txt

if %ERRORLEVEL% EQU 0 (
    echo [ADMIN] Clean exit. Restarting in 3s...
    set RESTART_COUNT=0
    timeout /t 3 /nobreak >nul
) else (
    echo [ADMIN] Crash detected. Restarting in 10s...
    timeout /t 10 /nobreak >nul
)
goto loop
