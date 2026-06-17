@echo off
echo ========== LOCAL TEST ==========

echo [1/4] Checking Python syntax...
python -m py_compile apps\antigravity-telegram-agent\main.py
if %ERRORLEVEL% NEQ 0 (echo FAIL: antigravity bot syntax error & exit /b 1)

python -m py_compile apps\superapp-business-bot\main.py
if %ERRORLEVEL% NEQ 0 (echo FAIL: business bot syntax error & exit /b 1)

echo [2/4] Checking imports...
python -c "import sys; sys.path.insert(0,'apps/superapp-business-bot'); exec(open('apps/superapp-business-bot/main.py').read().split('if __name__')[0])" 2>nul
if %ERRORLEVEL% NEQ 0 (echo WARN: business bot import issue)

echo [3/4] Checking .env files exist...
if not exist "apps\antigravity-telegram-agent\.env" echo WARN: ATA .env missing
if not exist "apps\superapp-business-bot\.env" echo WARN: Business bot .env missing

echo [4/4] Checking git status...
git status -s

echo ========== TEST DONE ==========
