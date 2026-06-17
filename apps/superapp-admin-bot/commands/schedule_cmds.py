"""Telegram command handlers for scheduled tasks management."""
import json
import logging
from pathlib import Path

logger = logging.getLogger("AdminBot.cmds.schedule")

SETTINGS_PATH = Path(__file__).parent.parent / "config" / "settings.json"


def register(bot, is_authorized):
    """Register schedule management commands on the bot."""

    @bot.message_handler(commands=['schedule_list'])
    def handle_schedule_list(message):
        if not is_authorized(message):
            return
        try:
            settings = json.loads(SETTINGS_PATH.read_text(encoding="utf-8"))
            sched = settings.get("scheduler", {})
            lines = ["⏰ **Scheduled Tasks:**\n"]
            lines.append(f"• Health check: every {sched.get('health_check_minutes', 30)} min")
            lines.append(f"• Auto-commit WIP: every {sched.get('auto_commit_hours', 2)} hours")
            lines.append(f"• Backup: every {sched.get('backup_hours', 6)} hours")
            lines.append(f"• Daily inspect: {sched.get('daily_inspect_time', '06:00')}")
            lines.append(f"• Error summary: {sched.get('daily_error_summary_time', '18:00')}")
            bot.reply_to(message, "\n".join(lines), parse_mode="Markdown")
        except Exception as e:
            bot.reply_to(message, f"❌ Error reading schedule: {e}")

    @bot.message_handler(commands=['schedule_update'])
    def handle_schedule_update(message):
        """Update a schedule parameter. Usage: /schedule_update <key> <value>"""
        if not is_authorized(message):
            return
        parts = message.text.split(maxsplit=2)
        if len(parts) < 3:
            return bot.reply_to(
                message,
                "Usage: `/schedule_update <key> <value>`\n"
                "Keys: health_check_minutes, auto_commit_hours, backup_hours, daily_inspect_time, daily_error_summary_time",
                parse_mode="Markdown"
            )

        key = parts[1].strip()
        value = parts[2].strip()

        try:
            settings = json.loads(SETTINGS_PATH.read_text(encoding="utf-8"))
            if key not in settings.get("scheduler", {}):
                return bot.reply_to(message, f"❌ Unknown schedule key: `{key}`", parse_mode="Markdown")

            # Parse numeric values
            if key in ("health_check_minutes", "auto_commit_hours", "backup_hours"):
                value = int(value)
            settings["scheduler"][key] = value
            SETTINGS_PATH.write_text(json.dumps(settings, indent=4, ensure_ascii=False), encoding="utf-8")
            bot.reply_to(message, f"✅ Updated `{key}` = `{value}`", parse_mode="Markdown")
        except Exception as e:
            bot.reply_to(message, f"❌ Error: {e}")
