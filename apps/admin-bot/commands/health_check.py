"""Health check commands: /health, /zombie, /status_all + background watchdog."""

import os
import subprocess
import logging
import time
from pathlib import Path

logger = logging.getLogger("AdminBot.health")


def _check_port(port: int) -> bool:
    import socket
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.settimeout(2)
        s.connect(("127.0.0.1", port))
        s.close()
        return True
    except Exception:
        return False


def _get_system_stats() -> dict:
    try:
        result = subprocess.run(
            [
                "powershell", "-NoProfile", "-Command",
                "$os = Get-WmiObject Win32_OperatingSystem; "
                "$cpu = (Get-WmiObject Win32_Processor).LoadPercentage; "
                "$totalMB = [math]::Round($os.TotalVisibleMemorySize / 1024); "
                "$freeMB = [math]::Round($os.FreePhysicalMemory / 1024); "
                "$disk = Get-WmiObject Win32_LogicalDisk -Filter 'DeviceID=\"C:\"'; "
                "$diskFreeMB = [math]::Round($disk.FreeSpace / 1MB); "
                "$diskTotalMB = [math]::Round($disk.Size / 1MB); "
                "Write-Host \"$totalMB|$freeMB|$cpu|$diskFreeMB|$diskTotalMB\""
            ],
            capture_output=True, text=True, timeout=15,
        )
        parts = result.stdout.strip().split("|")
        return {
            "ram_total_mb": int(parts[0]),
            "ram_free_mb": int(parts[1]),
            "cpu_pct": int(parts[2]) if parts[2] else 0,
            "disk_free_mb": int(parts[3]),
            "disk_total_mb": int(parts[4]),
        }
    except Exception as e:
        logger.error(f"Error getting system stats: {e}")
        return {}


def _find_zombies() -> list:
    """Find Python processes running > 2 hours."""
    try:
        result = subprocess.run(
            [
                "powershell", "-NoProfile", "-Command",
                "Get-Process python -ErrorAction SilentlyContinue "
                "| Where-Object { $_.StartTime -lt (Get-Date).AddHours(-2) } "
                "| Select-Object Id, StartTime, WorkingSet64 "
                "| ForEach-Object { Write-Host \"$($_.Id)|$($_.StartTime)|$([math]::Round($_.WorkingSet64 / 1MB))MB\" }"
            ],
            capture_output=True, text=True, timeout=10,
        )
        lines = [l.strip() for l in result.stdout.strip().splitlines() if l.strip()]
        return lines
    except Exception:
        return []


def _kill_zombies() -> str:
    try:
        result = subprocess.run(
            [
                "powershell", "-NoProfile", "-Command",
                "$killed = 0; "
                "Get-Process python -ErrorAction SilentlyContinue "
                "| Where-Object { $_.StartTime -lt (Get-Date).AddHours(-2) } "
                "| ForEach-Object { $killed++; Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue; "
                "Write-Host ('Killed PID: ' + $_.Id) }; "
                "Write-Host ('Total killed: ' + $killed)"
            ],
            capture_output=True, text=True, timeout=10,
        )
        return result.stdout.strip() or "No zombies found."
    except Exception as e:
        return f"Error: {e}"


def register(bot, admin_only, repo_root: Path):

    @bot.message_handler(commands=["health"])
    @admin_only
    def handle_health(message):
        stats = _get_system_stats()
        if not stats:
            bot.reply_to(message, "❌ Could not retrieve system stats.")
            return

        ram_used = stats["ram_total_mb"] - stats["ram_free_mb"]
        ram_pct = round(ram_used / stats["ram_total_mb"] * 100) if stats["ram_total_mb"] else 0
        disk_pct = round((stats["disk_total_mb"] - stats["disk_free_mb"]) / stats["disk_total_mb"] * 100) if stats["disk_total_mb"] else 0

        port_8765 = _check_port(8765)

        lines = [
            "🏥 **SYSTEM HEALTH**\n",
            f"**CPU**: {stats['cpu_pct']}%",
            f"**RAM**: {ram_used} / {stats['ram_total_mb']} MB ({ram_pct}%)",
            f"**Disk C:**: {stats['disk_free_mb']} MB free / {stats['disk_total_mb']} MB ({disk_pct}% used)",
            f"**Port 8765 (WS Bridge)**: {'🟢 Open' if port_8765 else '🔴 Closed'}",
        ]

        # Check bot processes
        for label, pattern in [("ATA", "antigravity-telegram-agent"), ("Business", "superapp-business-bot")]:
            try:
                ps = subprocess.run(
                    ["powershell", "-NoProfile", "-Command",
                     f"Get-WmiObject Win32_Process | Where-Object {{ $_.Name -like '*python*' -and $_.CommandLine -like '*{pattern}*main.py*' }} | Select-Object ProcessId | Format-Table -HideTableHeaders"],
                    capture_output=True, text=True, timeout=10,
                )
                pids = [p.strip() for p in ps.stdout.strip().splitlines() if p.strip()]
                status = f"🟢 Running (PID: {', '.join(pids)})" if pids else "🔴 NOT running"
            except Exception:
                status = "❓ Check failed"
            lines.append(f"**{label} Bot**: {status}")

        bot.send_message(message.chat.id, "\n".join(lines), parse_mode="Markdown")

    @bot.message_handler(commands=["zombie"])
    @admin_only
    def handle_zombie(message):
        zombies = _find_zombies()
        if not zombies:
            bot.reply_to(message, "✅ No zombie processes found (running > 2h).")
            return

        bot.reply_to(message, f"🧟 Found {len(zombies)} zombie(s). Killing...")
        result = _kill_zombies()
        bot.send_message(message.chat.id, f"```\n{result}\n```", parse_mode="Markdown")


def watchdog_loop(bot, admin_ids: list, repo_root: Path):
    """Background loop that checks health every 5 minutes and alerts admins."""
    CHECK_INTERVAL = 300  # 5 minutes

    # Track repeated errors for Devin auto-session
    error_counts = {}  # pattern -> [timestamps]

    while True:
        time.sleep(CHECK_INTERVAL)
        try:
            stats = _get_system_stats()
            if not stats:
                continue

            ram_used = stats["ram_total_mb"] - stats["ram_free_mb"]
            ram_pct = round(ram_used / stats["ram_total_mb"] * 100) if stats["ram_total_mb"] else 0

            alerts = []

            # RAM alert
            if ram_pct > 85:
                alerts.append(f"⚠️ RAM usage critical: {ram_pct}% ({ram_used}/{stats['ram_total_mb']} MB)")

            # Bot process alerts
            for label, pattern in [("ATA", "antigravity-telegram-agent"), ("Business", "superapp-business-bot")]:
                try:
                    ps = subprocess.run(
                        ["powershell", "-NoProfile", "-Command",
                         f"(Get-WmiObject Win32_Process | Where-Object {{ $_.Name -like '*python*' -and $_.CommandLine -like '*{pattern}*main.py*' }}).Count"],
                        capture_output=True, text=True, timeout=10,
                    )
                    count = int(ps.stdout.strip() or "0")
                    if count == 0:
                        alerts.append(f"🔴 {label} bot is DOWN!")
                except Exception:
                    pass

            # Check for repeated errors in log files
            for bot_name, log_rel in [("ATA", "apps/antigravity-telegram-agent/agent_service.log"),
                                       ("BIZ", "apps/superapp-business-bot/agent_service.log")]:
                log_path = repo_root / log_rel
                if log_path.exists():
                    try:
                        lines = log_path.read_text(encoding="utf-8", errors="replace").splitlines()[-100:]
                        recent_errors = [l for l in lines if "ERROR" in l or "CRITICAL" in l]
                        # Simple pattern detection: if same error > 3 times in recent lines
                        for err in recent_errors[-10:]:
                            key = err[:80]
                            if key not in error_counts:
                                error_counts[key] = []
                            error_counts[key].append(time.time())
                            # Keep only last 10 minutes
                            error_counts[key] = [t for t in error_counts[key] if time.time() - t < 600]
                            if len(error_counts[key]) > 3:
                                alerts.append(f"🔁 {bot_name} repeated error (>{len(error_counts[key])}x in 10min): `{key[:60]}...`")
                                _try_create_devin_session(key, bot_name)
                                error_counts[key] = []  # reset after alerting
                    except Exception:
                        pass

            if alerts:
                alert_text = "🚨 **WATCHDOG ALERT**\n\n" + "\n".join(alerts)
                for admin_id in admin_ids:
                    try:
                        bot.send_message(int(admin_id), alert_text, parse_mode="Markdown")
                    except Exception as e:
                        logger.error(f"Error sending watchdog alert to {admin_id}: {e}")

        except Exception as e:
            logger.error(f"Watchdog loop error: {e}", exc_info=True)


def _try_create_devin_session(error_pattern: str, bot_name: str):
    """If DEVIN_API_KEY is set, auto-create a Devin session to investigate repeated errors."""
    api_key = os.environ.get("DEVIN_API_KEY")
    if not api_key:
        return

    try:
        import requests
        resp = requests.post(
            "https://api.devin.ai/v1/sessions",
            headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
            json={
                "prompt": (
                    f"Investigate and fix a repeated error in {bot_name} bot of superapp-monorepo.\n"
                    f"Error pattern: {error_pattern[:200]}\n\n"
                    f"Check the bot's log file and source code, identify the root cause, and create a fix."
                ),
            },
            timeout=30,
        )
        if resp.status_code in [200, 201]:
            data = resp.json()
            logger.info(f"Auto-created Devin session: {data.get('url', data.get('session_id', '?'))}")
        else:
            logger.warning(f"Devin session creation failed: {resp.status_code}")
    except Exception as e:
        logger.error(f"Error creating Devin session: {e}")
