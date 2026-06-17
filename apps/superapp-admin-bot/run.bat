@echo off
title SuperApp Admin Bot — DevOps Butler
cd /d "%~dp0"
set MAX_RESTART=20
set RESTART_COUNT=0

:: Start watchdog daemon as detached process
echo [ADMIN] Starting watchdog daemon...
start "" /B python watchdog_daemon.py

:loop
set /a RESTART_COUNT+=1
if %RESTART_COUNT% GTR %MAX_RESTART% (
    echo [ADMIN] Max restart reached. Cooling down 5 minutes...
    echo [ADMIN] %date% %time% - COOLDOWN >> crash_log.txt
    timeout /t 300 /nobreak >nul
    set RESTART_COUNT=0
)

:: Kill stale admin bot instances
for /f "tokens=1" %%i in ('wmic process where "name like '%%python%%' and commandline like '%%superapp-admin-bot%%main.py%%'" get processid ^| findstr /r "[0-9]"') do (
    echo [ADMIN] Killing stale PID %%i
    taskkill /F /PID %%i >nul 2>&1
)

timeout /t 2 /nobreak >nul
echo [ADMIN] Starting admin bot (attempt %RESTART_COUNT%)...
echo [ADMIN] %date% %time% - Start #%RESTART_COUNT% >> crash_log.txt

python main.py

set EXIT_CODE=%ERRORLEVEL%
echo [ADMIN] %date% %time% - Exit code %EXIT_CODE% >> crash_log.txt

if %EXIT_CODE% EQU 0 (set RESTART_COUNT=0 & timeout /t 3 /nobreak >nul) else (timeout /t 10 /nobreak >nul)
goto loop
