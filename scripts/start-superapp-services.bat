@echo off
REM ============================================================
REM start-superapp-services.bat
REM Khởi động toàn bộ Superapp local services khi Windows boot
REM Đặt tại: C:\Vibecoding\superapp-monorepo\scripts\
REM Đăng ký Task Scheduler: chạy as Administrator
REM ============================================================

echo ======================================
echo   Superapp Services Startup
echo   %DATE% %TIME%
echo ======================================

REM 1. Đảm bảo Docker Desktop đang chạy (wait up to 60s)
echo [1/3] Waiting for Docker...
set DOCKER_READY=0
for /L %%i in (1,1,12) do (
    docker info >nul 2>&1 && set DOCKER_READY=1 && goto :DOCKER_OK
    timeout /t 5 /nobreak >nul
)
:DOCKER_OK
if "%DOCKER_READY%"=="0" (
    echo ERROR: Docker is not running after 60s. Aborting.
    exit /b 1
)
echo [1/3] Docker OK

REM 2. Start API server inside WSL2
echo [2/3] Starting API server in WSL2...
wsl -d Ubuntu bash /home/dev/start-api.sh
echo [2/3] API server started

REM 3. Verify tunnel is running
echo [3/3] Checking Cloudflare tunnel...
docker inspect superapp-tunnel --format "Status: {{.State.Status}}" 2>nul
echo [3/3] Done

echo ======================================
echo   All services started successfully!
echo   API: http://localhost:3001
echo   DB:  localhost:5432 (insforge)
echo ======================================
