@echo off
title Antigravity Autonomous Telegram Agent (ATA)
cd /d "%~dp0"

:loop
echo ==========================================================
echo Starting Antigravity Autonomous Telegram Service (ATA)...
echo ==========================================================
python main.py

echo.
echo ----------------------------------------------------------
echo Antigravity service stopped or exited.
echo Rebooting in 5 seconds to load modifications/upgrades...
echo Press Ctrl+C to terminate this run loop completely.
echo ----------------------------------------------------------
timeout /t 5
goto loop
