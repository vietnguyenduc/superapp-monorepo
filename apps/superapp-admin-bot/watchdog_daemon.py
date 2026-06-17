"""Standalone watchdog daemon — runs independently as a background process.

Can be started separately from the admin bot. Monitors all bots' heartbeat files,
checks system resources, and auto-restarts dead bots.

Usage:
    python watchdog_daemon.py
    OR
    Start-Process python -ArgumentList "watchdog_daemon.py" -WindowStyle Hidden
"""
import os
import sys

if sys.platform.startswith('win'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

import json
import time
import logging
import subprocess
from pathlib import Path
from datetime import datetime
from dotenv import load_dotenv

LOG_FILE = Path(__file__).parent / "watchdog.log"
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler(LOG_FILE, encoding="utf-8"),
    ],
)
logger = logging.getLogger("Watchdog")

ENV_PATH = Path(__file__).parent / ".env"
if ENV_PATH.exists():
    load_dotenv(dotenv_path=ENV_PATH)

SETTINGS_PATH = Path(__file__).parent / "config" / "settings.json"
CHECK_INTERVAL = 30


def load_settings() -> dict:
    try:
        return json.loads(SETTINGS_PATH.read_text(encoding="utf-8"))
    except Exception:
        return {}


def get_monorepo_root() -> Path:
    root = os.environ.get("MONOREPO_ROOT_PATH", "")
    if root:
        return Path(root)
    return Path(__file__).resolve().parents[2]


def find_pids(pattern: str) -> list:
    pids = []
    try:
        cmd = f'wmic process where "name like \'%python%\' and commandline like \'%{pattern}%\'" get processid'
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=10)
        for line in result.stdout.strip().split("\n"):
            line = line.strip()
            if line.isdigit():
                pids.append(int(line))
    except Exception:
        pass
    return pids


def restart_bot(bot_cfg: dict):
    root = get_monorepo_root()
    bat_path = root / bot_cfg["path"] / bot_cfg.get("bat_file", "run.bat")
    if bat_path.exists():
        try:
            subprocess.Popen(
                f'start "" /D "{bat_path.parent}" "{bat_path}"',
                shell=True,
            )
            logger.info(f"Restarted via {bat_path}")
        except Exception as e:
            logger.error(f"Restart failed: {e}")


def check_heartbeats():
    settings = load_settings()
    root = get_monorepo_root()
    timeout = settings.get("watchdog", {}).get("heartbeat_timeout_seconds", 60)

    for name, cfg in settings.get("bots", {}).items():
        hb_file = root / cfg["path"] / cfg.get("heartbeat_file", "heartbeat.txt")
        if not hb_file.exists():
            pids = find_pids(cfg.get("process_pattern", name))
            if pids:
                logger.warning(f"{name}: running (PIDs {pids}) but no heartbeat file")
            continue

        try:
            ts = float(hb_file.read_text().strip())
            age = time.time() - ts
            if age > timeout:
                logger.warning(f"{name}: heartbeat stale ({age:.0f}s). Auto-restarting...")
                # Kill existing
                for pid in find_pids(cfg.get("process_pattern", name)):
                    try:
                        subprocess.run(f"taskkill /F /PID {pid}", shell=True, capture_output=True, timeout=5)
                    except Exception:
                        pass
                time.sleep(2)
                restart_bot(cfg)
        except Exception as e:
            logger.error(f"Error checking heartbeat for {name}: {e}")


def check_resources():
    settings = load_settings()
    wdog = settings.get("watchdog", {})
    ram_pct = wdog.get("ram_alert_percent", 80)
    disk_mb = wdog.get("disk_alert_mb", 500)

    try:
        import psutil
        ram = psutil.virtual_memory()
        if ram.percent > ram_pct:
            logger.warning(f"RAM alert: {ram.percent}% used (threshold: {ram_pct}%)")
            # Kill heaviest python process
            heaviest = None
            for proc in psutil.process_iter(['pid', 'name', 'memory_info']):
                try:
                    if 'python' in (proc.info.get('name') or '').lower():
                        mem = proc.info['memory_info'].rss
                        if heaviest is None or mem > heaviest[1]:
                            heaviest = (proc, mem)
                except (psutil.NoSuchProcess, psutil.AccessDenied):
                    continue
            if heaviest and heaviest[1] > 1024 * 1024 * 1024:  # > 1GB
                logger.warning(f"Killing heaviest process PID {heaviest[0].pid} ({heaviest[1] / (1024**2):.0f}MB)")
                heaviest[0].kill()

        disk = psutil.disk_usage("/")
        free_mb = disk.free / (1024 * 1024)
        if free_mb < disk_mb:
            logger.warning(f"Disk alert: {free_mb:.0f}MB free (threshold: {disk_mb}MB)")
    except ImportError:
        pass


def main():
    logger.info("Watchdog daemon started.")
    # Write own heartbeat
    own_hb = Path(__file__).parent / "watchdog_heartbeat.txt"

    while True:
        try:
            own_hb.write_text(str(time.time()))
            check_heartbeats()
            check_resources()
        except Exception as e:
            logger.error(f"Watchdog loop error: {e}")
        time.sleep(CHECK_INTERVAL)


if __name__ == "__main__":
    main()
