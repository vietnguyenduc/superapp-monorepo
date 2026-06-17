"""Cron-style scheduled tasks for the admin bot."""
import json
import logging
import threading
import time
from datetime import datetime
from pathlib import Path

logger = logging.getLogger("AdminBot.scheduler")

SETTINGS_PATH = Path(__file__).parent.parent / "config" / "settings.json"


def _load_settings() -> dict:
    try:
        return json.loads(SETTINGS_PATH.read_text(encoding="utf-8"))
    except Exception:
        return {}


class TaskScheduler:
    def __init__(self, bot=None, admin_chat_id=None):
        self.bot = bot
        self.admin_chat_id = admin_chat_id
        self._running = False
        self._thread = None
        self._last_run = {}

    def start(self):
        if self._running:
            return
        self._running = True
        self._thread = threading.Thread(target=self._loop, daemon=True)
        self._thread.start()
        logger.info("Task scheduler started.")

    def stop(self):
        self._running = False

    def _notify(self, message: str):
        if self.bot and self.admin_chat_id:
            try:
                self.bot.send_message(self.admin_chat_id, message, parse_mode="Markdown")
            except Exception as e:
                logger.error(f"Scheduler notify error: {e}")

    def _should_run(self, task_name: str, interval_minutes: int) -> bool:
        last = self._last_run.get(task_name, 0)
        if time.time() - last >= interval_minutes * 60:
            self._last_run[task_name] = time.time()
            return True
        return False

    def _is_time(self, time_str: str) -> bool:
        """Check if current time matches HH:MM (within 1 minute window)."""
        try:
            now = datetime.now().strftime("%H:%M")
            return now == time_str
        except Exception:
            return False

    def _loop(self):
        settings = _load_settings()
        sched_cfg = settings.get("scheduler", {})

        while self._running:
            try:
                # Health check every 30 min
                if self._should_run("health_check", sched_cfg.get("health_check_minutes", 30)):
                    self._run_health_check()

                # Auto-commit WIP every 2 hours
                if self._should_run("auto_commit", sched_cfg.get("auto_commit_hours", 2) * 60):
                    self._run_auto_commit()

                # Backup every 6 hours
                if self._should_run("backup", sched_cfg.get("backup_hours", 6) * 60):
                    self._run_backup()

                # Daily inspect at configured time
                inspect_time = sched_cfg.get("daily_inspect_time", "06:00")
                if self._is_time(inspect_time) and self._should_run("daily_inspect", 23 * 60):
                    self._run_daily_inspect()

                # Daily error summary at configured time
                summary_time = sched_cfg.get("daily_error_summary_time", "18:00")
                if self._is_time(summary_time) and self._should_run("daily_summary", 23 * 60):
                    self._run_error_summary()

            except Exception as e:
                logger.error(f"Scheduler loop error: {e}")

            time.sleep(30)

    def _run_health_check(self):
        try:
            from core.process_manager import get_all_status, kill_zombies
            status = get_all_status()
            zombie_result = kill_zombies()
            logger.info(f"Scheduled health check:\n{status}\n{zombie_result}")
        except Exception as e:
            logger.error(f"Health check failed: {e}")

    def _run_auto_commit(self):
        try:
            from core.git_manager import safe_push
            result = safe_push()
            if "Nothing to commit" not in result:
                logger.info(f"Auto-commit: {result}")
                self._notify(f"🔄 **Auto-commit WIP:**\n{result}")
        except Exception as e:
            logger.error(f"Auto-commit failed: {e}")

    def _run_backup(self):
        try:
            from core.git_manager import backup_local
            result = backup_local()
            logger.info(f"Scheduled backup: {result}")
            self._notify(f"💾 **Scheduled backup:**\n{result}")
        except Exception as e:
            logger.error(f"Backup failed: {e}")

    def _run_daily_inspect(self):
        try:
            from core.devin_bridge import trigger_devin_session
            result = trigger_devin_session(
                prompt="Review the superapp-monorepo codebase. Check for TODO/FIXME comments, potential bugs, and suggest improvements. Send a concise report.",
                context="Daily automated code inspection"
            )
            self._notify(f"🔍 **Daily Devin Inspection:**\n{result}")
        except Exception as e:
            logger.error(f"Daily inspect failed: {e}")

    def _run_error_summary(self):
        try:
            from core.log_analyzer import grep_errors
            settings = _load_settings()
            lines = ["📋 **Daily Error Summary:**\n"]
            for name in settings.get("bots", {}):
                errors = grep_errors(name)
                if "No errors" not in errors:
                    lines.append(f"\n**{name}:**\n{errors[:500]}")
            if len(lines) > 1:
                self._notify("\n".join(lines))
            else:
                self._notify("✅ **Daily Summary:** No errors across all bots today.")
        except Exception as e:
            logger.error(f"Error summary failed: {e}")
