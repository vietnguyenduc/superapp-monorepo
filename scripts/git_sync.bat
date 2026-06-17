@echo off
REM ============================================================
REM git_sync.bat — Sync local repo with remote branch "viet"
REM Usage: Double-click or run from cmd in the monorepo root
REM ============================================================
cd /d "C:\Vibecoding\superapp-monorepo"

echo [GIT-SYNC] ========================================
echo [GIT-SYNC] Superapp Monorepo — Branch Sync Tool
echo [GIT-SYNC] ========================================

echo [GIT-SYNC] Fetching all remotes...
git fetch --all --prune
if %ERRORLEVEL% NEQ 0 (
    echo [GIT-SYNC] ERROR: git fetch failed. Is git installed and repo initialized?
    pause
    exit /b 1
)

echo.
echo [GIT-SYNC] Current branch:
for /f "tokens=*" %%b in ('git branch --show-current') do set CURRENT_BRANCH=%%b
echo   %CURRENT_BRANCH%

echo.
echo [GIT-SYNC] Checking for uncommitted changes...
git status -s
if %ERRORLEVEL% NEQ 0 (
    echo [GIT-SYNC] ERROR: Git not available
    pause
    exit /b 1
)

REM Stash any local changes
echo [GIT-SYNC] Stashing local changes (if any)...
git stash --include-untracked -m "auto-stash before sync %date% %time%"

REM Checkout viet branch if not already on it
if /i NOT "%CURRENT_BRANCH%"=="viet" (
    echo [GIT-SYNC] Switching to branch viet...
    git checkout viet
    if %ERRORLEVEL% NEQ 0 (
        echo [GIT-SYNC] ERROR: Could not checkout viet. Restoring stash...
        git stash pop 2>nul
        pause
        exit /b 1
    )
)

REM Pull latest with rebase
echo [GIT-SYNC] Pulling latest from origin/viet with rebase...
git pull origin viet --rebase
if %ERRORLEVEL% NEQ 0 (
    echo [GIT-SYNC] WARNING: Rebase conflict detected!
    echo [GIT-SYNC] Aborting rebase and falling back to merge...
    git rebase --abort 2>nul
    git pull origin viet
    if %ERRORLEVEL% NEQ 0 (
        echo [GIT-SYNC] ERROR: Merge also failed. Manual intervention required.
        echo [GIT-SYNC] Your stashed changes are safe. Run: git stash pop
        pause
        exit /b 1
    )
)

REM Pop stash if there was one
echo [GIT-SYNC] Restoring stashed changes...
git stash pop 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [GIT-SYNC] NOTE: No stash to restore, or stash pop had conflicts.
    echo [GIT-SYNC] Run 'git stash list' to check pending stashes.
)

echo.
echo [GIT-SYNC] ========================================
echo [GIT-SYNC] Done. Branch viet is up to date.
echo [GIT-SYNC] ========================================
echo.
pause
