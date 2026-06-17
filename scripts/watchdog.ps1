#Requires -Version 5.1
<#
.SYNOPSIS
    Watchdog — monitors all Superapp bots, kills zombies, auto-restarts dead processes.
.DESCRIPTION
    Runs in a loop every 60 seconds. Checks:
    - ATA bot process alive (python main.py in antigravity-telegram-agent)
    - Business bot process alive (python main.py in superapp-business-bot)
    - Zombie Python processes running > 2 hours
    - RAM usage > 80% -> kill heaviest Python process
    Logs to watchdog.log in the scripts/ directory.
.USAGE
    powershell -ExecutionPolicy Bypass -File scripts\watchdog.ps1
#>

$ErrorActionPreference = "SilentlyContinue"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot = Split-Path -Parent $ScriptDir
$LogFile = Join-Path $ScriptDir "watchdog.log"
$CheckInterval = 60  # seconds

function Write-Log {
    param([string]$Message)
    $ts = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $line = "[$ts] $Message"
    Write-Host $line
    Add-Content -Path $LogFile -Value $line -Encoding UTF8
}

function Get-BotProcess {
    param([string]$BotFolder)
    Get-WmiObject Win32_Process -ErrorAction SilentlyContinue |
        Where-Object {
            $_.Name -like "*python*" -and
            $_.CommandLine -like "*$BotFolder*main.py*"
        }
}

function Test-PortOpen {
    param([int]$Port)
    try {
        $tcp = New-Object System.Net.Sockets.TcpClient
        $tcp.Connect("127.0.0.1", $Port)
        $tcp.Close()
        return $true
    } catch {
        return $false
    }
}

function Restart-Bot {
    param(
        [string]$BotDir,
        [string]$Label
    )
    $batFile = Join-Path $BotDir "run.bat"
    if (Test-Path $batFile) {
        Write-Log "[$Label] Starting via run.bat..."
        Start-Process -FilePath "cmd.exe" -ArgumentList "/c `"$batFile`"" -WindowStyle Hidden -WorkingDirectory $BotDir
        Write-Log "[$Label] Restart command issued."
    } else {
        Write-Log "[$Label] ERROR: run.bat not found at $batFile"
    }
}

function Kill-ZombieProcesses {
    $threshold = (Get-Date).AddHours(-2)
    $zombies = Get-Process python -ErrorAction SilentlyContinue |
        Where-Object { $_.StartTime -and $_.StartTime -lt $threshold }
    
    foreach ($z in $zombies) {
        Write-Log "[ZOMBIE] Killing PID $($z.Id) (started $($z.StartTime), running $([int]((Get-Date) - $z.StartTime).TotalMinutes) min)"
        Stop-Process -Id $z.Id -Force -ErrorAction SilentlyContinue
    }
    
    if ($zombies.Count -gt 0) {
        Write-Log "[ZOMBIE] Killed $($zombies.Count) zombie process(es)."
    }
}

function Check-MemoryPressure {
    $os = Get-WmiObject Win32_OperatingSystem
    $totalMB = [math]::Round($os.TotalVisibleMemorySize / 1024)
    $freeMB = [math]::Round($os.FreePhysicalMemory / 1024)
    $usedPct = [math]::Round((($totalMB - $freeMB) / $totalMB) * 100)
    
    if ($usedPct -gt 80) {
        Write-Log "[MEMORY] WARNING: RAM usage at ${usedPct}% ($freeMB MB free / $totalMB MB total)"
        # Kill the heaviest Python process (excluding our own)
        $heaviest = Get-Process python -ErrorAction SilentlyContinue |
            Where-Object { $_.Id -ne $PID } |
            Sort-Object WorkingSet64 -Descending |
            Select-Object -First 1
        
        if ($heaviest) {
            $memMB = [math]::Round($heaviest.WorkingSet64 / 1MB)
            Write-Log "[MEMORY] Killing heaviest Python PID $($heaviest.Id) using ${memMB} MB"
            Stop-Process -Id $heaviest.Id -Force -ErrorAction SilentlyContinue
        }
    }
}

# ── Main Loop ────────────────────────────────────────────────────────────────

Write-Log "=========================================="
Write-Log "Watchdog started. Monitoring every ${CheckInterval}s."
Write-Log "Repo root: $RepoRoot"
Write-Log "=========================================="

$AtaDir = Join-Path $RepoRoot "apps\antigravity-telegram-agent"
$BizDir = Join-Path $RepoRoot "apps\superapp-business-bot"

while ($true) {
    # Check ATA bot
    $ataProc = Get-BotProcess "antigravity-telegram-agent"
    if (-not $ataProc) {
        Write-Log "[ATA] Bot process NOT running. Attempting restart..."
        Restart-Bot -BotDir $AtaDir -Label "ATA"
    } else {
        Write-Log "[ATA] OK (PID $($ataProc.ProcessId))"
    }

    # Check Business bot
    $bizProc = Get-BotProcess "superapp-business-bot"
    if (-not $bizProc) {
        Write-Log "[BIZ] Bot process NOT running. Attempting restart..."
        Restart-Bot -BotDir $BizDir -Label "BIZ"
    } else {
        Write-Log "[BIZ] OK (PID $($bizProc.ProcessId))"
    }

    # Check WebSocket port 8765
    if (Test-PortOpen 8765) {
        Write-Log "[PORT] 8765 is listening."
    } else {
        Write-Log "[PORT] 8765 is NOT listening (WebSocket bridge may be down)."
    }

    # Kill zombie processes
    Kill-ZombieProcesses

    # Check memory pressure
    Check-MemoryPressure

    Start-Sleep -Seconds $CheckInterval
}
