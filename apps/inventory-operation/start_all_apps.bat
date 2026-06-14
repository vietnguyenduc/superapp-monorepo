@echo off
echo Starting all 6 apps for UI/UX testing...

:: Kill any existing processes on our ports
for %%p in (5176 5177 5178 5179 5180 5181) do (
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :%%p') do (
        taskkill /F /PID %%a 2>nul
    )
)

:: Start each app on its own port
start "sales-operation" cmd /c "cd /d C:\Vibecoding\superapp-monorepo\apps\sales-operation && npx vite --port 5176 --host"
start "cashflow" cmd /c "cd /d C:\Vibecoding\superapp-monorepo\apps\cashflow && npx vite --port 5177 --host"
start "accounting" cmd /c "cd /d C:\Vibecoding\superapp-monorepo\apps\accounting && npx vite --port 5178 --host"
start "operations-portal" cmd /c "cd /d C:\Vibecoding\superapp-monorepo\apps\operations-portal && npx vite --port 5179 --host"
start "hr-operation" cmd /c "cd /d C:\Vibecoding\superapp-monorepo\apps\hr-operation && npx vite --port 5180 --host"
start "admin-portal" cmd /c "cd /d C:\Vibecoding\superapp-monorepo\apps\admin-portal && npx vite --port 5181 --host"

echo All apps started. Waiting for servers to be ready...
timeout /t 10 /nobreak >nul
echo Done.
