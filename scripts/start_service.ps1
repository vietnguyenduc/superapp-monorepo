<#
.SYNOPSIS
    Chuan hoa cach start service (Flask, ngrok, bot) - KHONG bi timeout 120s.
    Dung cho tat ca app trong monorepo.

.DESCRIPTION
    Van de: Start-Process voi -NoNewWindow block thread -> tool execute_command timeout 120s.
    Fix: Dung -WindowStyle Hidden + Start-Sleep + kiem tra port bang netstat.

    Van de: curl trong PowerShell bi alias thanh Invoke-WebRequest.
    Fix: Dung curl.exe (full path) hoac Invoke-WebRequest voi cu phap dung.

.PARAMETER Action
    "start" | "stop" | "restart" | "status"

.PARAMETER Service
    "flask" | "ngrok" | "bot" | "all"

.PARAMETER Port
    Port number (default: 3008 for Flask, 4040 for ngrok dashboard)

.PARAMETER ScriptPath
    Path to Python script (for flask/bot)

.PARAMETER NgrokUrl
    Local URL for ngrok to tunnel (e.g. http://localhost:3008)
#>

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("start", "stop", "restart", "status")]
    [string]$Action,

    [Parameter(Mandatory=$true)]
    [ValidateSet("flask", "ngrok", "bot", "all")]
    [string]$Service,

    [int]$Port = 3008,

    [string]$ScriptPath = "",

    [string]$NgrokUrl = "http://localhost:3008"
)

# --- Helper: Kiem tra port ---
function Test-PortListening($port) {
    $result = netstat -ano | Select-String ":$port\s"
    return ($result -ne $null)
}

# --- Helper: Kill process theo port ---
function Stop-ProcessByPort($port) {
    $result = netstat -ano | Select-String ":$port\s"
    if ($result) {
        foreach ($line in $result) {
            $parts = $line -split '\s+'
            $procId = $parts[-1]
            if ($procId -match '^\d+$') {
                try {
                    Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
                    Write-Host "  [OK] Killed PID $procId (port $port)"
                } catch {
                    Write-Host "  [WARN] Could not kill PID $procId"
                }
            }
        }
    }
}

# --- Helper: Start Flask ---
function Start-FlaskService {
    param([string]$scriptPath, [int]$port)

    if (-not $scriptPath -or -not (Test-Path $scriptPath)) {
        Write-Host "  [FAIL] Script not found: $scriptPath"
        return $false
    }

    # Kill process cu tren port
    Stop-ProcessByPort -port $port
    Start-Sleep -Seconds 1

    # Start voi WindowStyle Hidden - KHONG block thread
    $pythonPath = (Get-Command python).Source
    $logFile = Join-Path (Split-Path $scriptPath -Parent) "server_$port.log"

    Write-Host "  [INFO] Starting Flask on port $port..."
    Write-Host "         Script: $scriptPath"
    Write-Host "         Log:    $logFile"

    $process = Start-Process -FilePath $pythonPath `
        -ArgumentList $scriptPath `
        -WorkingDirectory (Split-Path $scriptPath -Parent) `
        -WindowStyle Hidden `
        -RedirectStandardOutput $logFile `
        -RedirectStandardError $logFile `
        -PassThru

    Start-Sleep -Seconds 3

    # Kiem tra port da LISTEN chua
    if (Test-PortListening -port $port) {
        Write-Host "  [OK] Flask started on port $port (PID: $($process.Id))"
        return $true
    } else {
        Write-Host "  [WARN] Flask may not be ready yet. Checking log..."
        if (Test-Path $logFile) {
            Get-Content $logFile -Tail 5
        }
        return $false
    }
}

# --- Helper: Start ngrok ---
function Start-NgrokService {
    param([string]$url)

    # Kill ngrok cu
    $ngrokProcesses = Get-Process -Name "ngrok" -ErrorAction SilentlyContinue
    if ($ngrokProcesses) {
        $ngrokProcesses | Stop-Process -Force
        Write-Host "  [OK] Killed old ngrok processes"
        Start-Sleep -Seconds 1
    }

    Write-Host "  [INFO] Starting ngrok tunnel to $url..."

    $process = Start-Process -FilePath "ngrok" `
        -ArgumentList "http", $url `
        -WindowStyle Hidden `
        -PassThru

    Start-Sleep -Seconds 3

    # Kiem tra ngrok dashboard
    try {
        $response = Invoke-WebRequest -Uri "http://127.0.0.1:4040/api/tunnels" -UseBasicParsing -TimeoutSec 5
        if ($response.StatusCode -eq 200) {
            $tunnels = ($response.Content | ConvertFrom-Json).tunnels
            foreach ($t in $tunnels) {
                if ($t.proto -eq "https") {
                    Write-Host "  [OK] ngrok tunnel ready: $($t.public_url)"
                }
            }
            return $true
        }
    } catch {
        Write-Host "  [WARN] ngrok dashboard not ready yet. Waiting..."
        Start-Sleep -Seconds 3
        try {
            $response = Invoke-WebRequest -Uri "http://127.0.0.1:4040/api/tunnels" -UseBasicParsing -TimeoutSec 5
            if ($response.StatusCode -eq 200) {
                $tunnels = ($response.Content | ConvertFrom-Json).tunnels
                foreach ($t in $tunnels) {
                    if ($t.proto -eq "https") {
                        Write-Host "  [OK] ngrok tunnel ready: $($t.public_url)"
                    }
                }
                return $true
            }
        } catch {
            Write-Host "  [FAIL] ngrok dashboard still not responding. PID: $($process.Id)"
            return $false
        }
    }
}

# --- Helper: Status ---
function Get-ServiceStatus {
    Write-Host "`n[SERVICE STATUS]"
    Write-Host "---------------------"

    # Flask
    if (Test-PortListening -port $Port) {
        $result = netstat -ano | Select-String ":$Port\s"
        $procId = ($result[0] -split '\s+')[-1]
        Write-Host "  Flask (port $Port): RUNNING (PID: $procId)"
    } else {
        Write-Host "  Flask (port $Port): STOPPED"
    }

    # ngrok
    $ngrok = Get-Process -Name "ngrok" -ErrorAction SilentlyContinue
    if ($ngrok) {
        Write-Host "  ngrok: RUNNING (PID: $($ngrok.Id))"
        try {
            $response = Invoke-WebRequest -Uri "http://127.0.0.1:4040/api/tunnels" -UseBasicParsing -TimeoutSec 3
            if ($response.StatusCode -eq 200) {
                $tunnels = ($response.Content | ConvertFrom-Json).tunnels
                foreach ($t in $tunnels) {
                    if ($t.proto -eq "https") {
                        Write-Host "     URL: $($t.public_url)"
                    }
                }
            }
        } catch {
            Write-Host "     (dashboard not responding)"
        }
    } else {
        Write-Host "  ngrok: STOPPED"
    }
}

# --- MAIN ---
Write-Host "`n========================================"
Write-Host "  Service Manager (No-Timeout)"
Write-Host "========================================"
Write-Host "Action: $Action | Service: $Service | Port: $Port"

switch ($Action) {
    "start" {
        switch ($Service) {
            "flask" { Start-FlaskService -scriptPath $ScriptPath -port $Port }
            "ngrok" { Start-NgrokService -url $NgrokUrl }
            "bot" {
                if (-not $ScriptPath) {
                    Write-Host "  [FAIL] ScriptPath required for bot service"
                    return
                }
                Start-FlaskService -scriptPath $ScriptPath -port $Port
            }
            "all" {
                Start-FlaskService -scriptPath $ScriptPath -port $Port
                Start-NgrokService -url $NgrokUrl
            }
        }
    }
    "stop" {
        switch ($Service) {
            "flask" { Stop-ProcessByPort -port $Port }
            "ngrok" {
                $ngrok = Get-Process -Name "ngrok" -ErrorAction SilentlyContinue
                if ($ngrok) { $ngrok | Stop-Process -Force; Write-Host "  [OK] ngrok stopped" }
            }
            "bot" { Stop-ProcessByPort -port $Port }
            "all" {
                Stop-ProcessByPort -port $Port
                $ngrok = Get-Process -Name "ngrok" -ErrorAction SilentlyContinue
                if ($ngrok) { $ngrok | Stop-Process -Force }
                Write-Host "  [OK] All services stopped"
            }
        }
    }
    "restart" {
        switch ($Service) {
            "flask" { Stop-ProcessByPort -port $Port; Start-Sleep 1; Start-FlaskService -scriptPath $ScriptPath -port $Port }
            "ngrok" {
                $ngrok = Get-Process -Name "ngrok" -ErrorAction SilentlyContinue
                if ($ngrok) { $ngrok | Stop-Process -Force }
                Start-Sleep 1
                Start-NgrokService -url $NgrokUrl
            }
            "all" {
                Stop-ProcessByPort -port $Port
                $ngrok = Get-Process -Name "ngrok" -ErrorAction SilentlyContinue
                if ($ngrok) { $ngrok | Stop-Process -Force }
                Start-Sleep 1
                Start-FlaskService -scriptPath $ScriptPath -port $Port
                Start-NgrokService -url $NgrokUrl
            }
        }
    }
    "status" {
        Get-ServiceStatus
    }
}
