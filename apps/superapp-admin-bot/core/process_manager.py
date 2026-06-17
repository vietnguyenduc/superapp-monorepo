"""Process management: kill, restart, status, zombie detection."""
import os
import sys
import json
import time
import logging
import subprocess
from pathlib import Path

logger = logging.getLogger("AdminBot.process")

SETTINGS_PATH = Path(__file__).parent.parent / "config" / "settings.json"


def _load_settings() -> dict:
    try:
        return json.loads(SETTINGS_PATH.read_text(encoding="utf-8"))
    except Exception:
        return {}


def _get_monorepo_root() -> Path:
    root = os.environ.get("MONOREPO_ROOT_PATH", "")
    if root:
        return Path(root)
    return Path(__file__).resolve().parents[3]


def _find_pids_by_pattern(pattern: str) -> list:
    """Find PIDs whose command line matches a pattern (Windows)."""
    pids = []
    try:
        cmd = f'wmic process where "name like \'%python%\' and commandline like \'%{pattern}%\'" get processid'
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=10)
        for line in result.stdout.strip().split("\n"):
            line = line.strip()
            if line.isdigit():
                pids.append(int(line))
    except Exception as e:
        logger.error(f"Error finding PIDs for {pattern}: {e}")
    return pids


def kill_bot(bot_name: str) -> str:
    """Kill a bot by its config name. Returns status message."""
    settings = _load_settings()
    bot_cfg = settings.get("bots", {}).get(bot_name)
    if not bot_cfg:
        return f"Bot '{bot_name}' not found in config."

    pattern = bot_cfg.get("process_pattern", bot_name)
    pids = _find_pids_by_pattern(pattern)
    if not pids:
        return f"No running process found for '{bot_name}'."

    killed = []
    for pid in pids:
        try:
            subprocess.run(f"taskkill /F /PID {pid}", shell=True, capture_output=True, timeout=5)
            killed.append(pid)
        except Exception as e:
            logger.error(f"Failed to kill PID {pid}: {e}")
    return f"Killed {len(killed)} process(es) for '{bot_name}': PIDs {killed}"


def restart_bot(bot_name: str) -> str:
    """Kill then restart a bot via its bat file."""
    settings = _load_settings()
    bot_cfg = settings.get("bots", {}).get(bot_name)
    if not bot_cfg:
        return f"Bot '{bot_name}' not found in config."

    kill_msg = kill_bot(bot_name)
    time.sleep(2)

    root = _get_monorepo_root()
    bat_path = root / bot_cfg["path"] / bot_cfg.get("bat_file", "run.bat")
    if not bat_path.exists():
        return f"{kill_msg}\nBat file not found: {bat_path}"

    try:
        subprocess.Popen(
            f'start "" /D "{bat_path.parent}" "{bat_path}"',
            shell=True,
        )
        return f"{kill_msg}\nStarted '{bot_name}' via {bat_path.name}."
    except Exception as e:
        return f"{kill_msg}\nFailed to start: {e}"


def get_all_status() -> str:
    """List all python/node processes related to the monorepo."""
    lines = ["📊 **Process Status:**\n"]
    settings = _load_settings()
    for name, cfg in settings.get("bots", {}).items():
        pattern = cfg.get("process_pattern", name)
        pids = _find_pids_by_pattern(pattern)
        status = f"🟢 Running (PIDs: {pids})" if pids else "🔴 Stopped"
        lines.append(f"• **{cfg.get('name', name)}**: {status}")

        # Check heartbeat
        root = _get_monorepo_root()
        hb_file = root / cfg["path"] / cfg.get("heartbeat_file", "heartbeat.txt")
        if hb_file.exists():
            try:
                ts = float(hb_file.read_text().strip())
                age = time.time() - ts
                if age < 60:
                    lines.append(f"  💓 Heartbeat: {age:.0f}s ago")
                else:
                    lines.append(f"  ⚠️ Heartbeat stale: {age:.0f}s ago")
            except Exception:
                lines.append("  ⚠️ Heartbeat file unreadable")
    return "\n".join(lines)


def kill_zombies() -> str:
    """Kill python processes running > 2 hours or > 500MB RAM."""
    settings = _load_settings()
    wdog = settings.get("watchdog", {})
    max_hours = wdog.get("zombie_max_hours", 2)
    max_ram_mb = wdog.get("zombie_max_ram_mb", 500)
    killed = []

    try:
        import psutil
        now = time.time()
        for proc in psutil.process_iter(['pid', 'name', 'create_time', 'memory_info', 'cmdline']):
            try:
                info = proc.info
                if 'python' not in (info.get('name') or '').lower():
                    continue
                age_hours = (now - (info.get('create_time') or now)) / 3600
                ram_mb = (info.get('memory_info') or proc.memory_info()).rss / (1024 * 1024)
                if age_hours > max_hours or ram_mb > max_ram_mb:
                    proc.kill()
                    killed.append(f"PID {info['pid']} (age={age_hours:.1f}h, RAM={ram_mb:.0f}MB)")
            except (psutil.NoSuchProcess, psutil.AccessDenied):
                continue
    except ImportError:
        return "psutil not installed — cannot detect zombies."

    if killed:
        return f"🧟 Killed {len(killed)} zombie(s):\n" + "\n".join(killed)
    return "✅ No zombie processes found."


def detect_hanging() -> str:
    """Check heartbeat files; report bots that are not responding."""
    settings = _load_settings()
    root = _get_monorepo_root()
    timeout = settings.get("watchdog", {}).get("heartbeat_timeout_seconds", 60)
    hanging = []

    for name, cfg in settings.get("bots", {}).items():
        hb_file = root / cfg["path"] / cfg.get("heartbeat_file", "heartbeat.txt")
        if not hb_file.exists():
            pids = _find_pids_by_pattern(cfg.get("process_pattern", name))
            if pids:
                hanging.append(f"{name}: running but no heartbeat file")
            continue
        try:
            ts = float(hb_file.read_text().strip())
            if time.time() - ts > timeout:
                hanging.append(f"{name}: heartbeat stale ({time.time() - ts:.0f}s)")
        except Exception:
            hanging.append(f"{name}: heartbeat unreadable")

    if hanging:
        return "⚠️ **Hanging bots:**\n" + "\n".join(f"• {h}" for h in hanging)
    return "✅ All bots responding normally."
