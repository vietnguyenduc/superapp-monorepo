"""Background health monitor loop for all managed bots."""
import os
import json
import time
import logging
import threading
from pathlib import Path

logger = logging.getLogger("AdminBot.watchdog")

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


class Watchdog:
    def __init__(self, alert_callback=None):
        """
        alert_callback: callable(message: str) to send alerts (e.g., Telegram message).
        """
        self.alert_callback = alert_callback
        self._running = False
        self._thread = None

    def start(self):
        if self._running:
            return
        self._running = True
        self._thread = threading.Thread(target=self._loop, daemon=True)
        self._thread.start()
        logger.info("Watchdog started.")

    def stop(self):
        self._running = False
        logger.info("Watchdog stopped.")

    def _loop(self):
        settings = _load_settings()
        interval = settings.get("watchdog", {}).get("check_interval_seconds", 30)

        while self._running:
            try:
                self._check_heartbeats()
                self._check_resources()
            except Exception as e:
                logger.error(f"Watchdog loop error: {e}")
            time.sleep(interval)

    def _check_heartbeats(self):
        settings = _load_settings()
        root = _get_monorepo_root()
        timeout = settings.get("watchdog", {}).get("heartbeat_timeout_seconds", 60)

        for name, cfg in settings.get("bots", {}).items():
            if name == "admin":
                continue  # Don't watchdog ourselves
            hb_file = root / cfg["path"] / cfg.get("heartbeat_file", "heartbeat.txt")
            if not hb_file.exists():
                continue

            try:
                ts = float(hb_file.read_text().strip())
                age = time.time() - ts
                if age > timeout:
                    msg = f"⚠️ Watchdog: '{name}' heartbeat stale ({age:.0f}s). Attempting restart..."
                    logger.warning(msg)
                    self._alert(msg)
                    self._auto_restart(name)
            except Exception:
                pass

    def _check_resources(self):
        settings = _load_settings()
        wdog = settings.get("watchdog", {})
        ram_alert_pct = wdog.get("ram_alert_percent", 80)
        disk_alert_mb = wdog.get("disk_alert_mb", 500)

        try:
            import psutil
            ram = psutil.virtual_memory()
            if ram.percent > ram_alert_pct:
                self._alert(f"⚠️ RAM usage: {ram.percent}% (threshold: {ram_alert_pct}%)")

            disk = psutil.disk_usage("/")
            free_mb = disk.free / (1024 * 1024)
            if free_mb < disk_alert_mb:
                self._alert(f"⚠️ Disk space low: {free_mb:.0f}MB free (threshold: {disk_alert_mb}MB)")
        except ImportError:
            pass

    def _auto_restart(self, bot_name: str):
        try:
            from core.process_manager import restart_bot
            result = restart_bot(bot_name)
            logger.info(f"Auto-restart {bot_name}: {result}")
            self._alert(f"🔄 Auto-restarted '{bot_name}':\n{result}")
        except Exception as e:
            logger.error(f"Auto-restart failed for {bot_name}: {e}")
            self._alert(f"❌ Auto-restart failed for '{bot_name}': {e}")

    def _alert(self, message: str):
        logger.info(f"Alert: {message}")
        if self.alert_callback:
            try:
                self.alert_callback(message)
            except Exception as e:
                logger.error(f"Alert callback error: {e}")
