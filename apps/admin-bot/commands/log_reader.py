"""Log reading commands: /logs, /errors"""

import logging
from pathlib import Path

logger = logging.getLogger("AdminBot.logs")

BOT_LOG_FILES = {
    "ata": "apps/antigravity-telegram-agent/agent_service.log",
    "business": "apps/superapp-business-bot/agent_service.log",
    "admin": "apps/admin-bot/admin_bot.log",
}

BOT_CRASH_FILES = {
    "ata": "apps/antigravity-telegram-agent/crash_log.txt",
    "business": "apps/superapp-business-bot/crash_log.txt",
}


def _read_tail(filepath: Path, lines: int = 50) -> str:
    if not filepath.exists():
        return f"File not found: {filepath}"
    try:
        all_lines = filepath.read_text(encoding="utf-8", errors="replace").splitlines()
        tail = all_lines[-lines:]
        return "\n".join(tail) or "(empty)"
    except Exception as e:
        return f"Error reading file: {e}"


def _grep_errors(filepath: Path, max_lines: int = 30) -> str:
    if not filepath.exists():
        return f"File not found: {filepath}"
    try:
        all_lines = filepath.read_text(encoding="utf-8", errors="replace").splitlines()
        errors = [l for l in all_lines if "ERROR" in l or "CRITICAL" in l or "Traceback" in l]
        tail = errors[-max_lines:]
        return "\n".join(tail) or "No ERROR/CRITICAL lines found."
    except Exception as e:
        return f"Error reading file: {e}"


def register(bot, admin_only, repo_root: Path):

    @bot.message_handler(commands=["logs"])
    @admin_only
    def handle_logs(message):
        """Usage: /logs <ata|business> [lines]"""
        parts = message.text.split()
        if len(parts) < 2:
            bot.reply_to(message, "👉 Cú pháp: `/logs <ata|business> [lines]`", parse_mode="Markdown")
            return

        bot_name = parts[1].strip().lower()
        lines = 50
        if len(parts) >= 3:
            try:
                lines = int(parts[2])
            except ValueError:
                pass

        rel_path = BOT_LOG_FILES.get(bot_name)
        if not rel_path:
            bot.reply_to(message, f"❌ Unknown bot: `{bot_name}`. Use: ata, business, admin", parse_mode="Markdown")
            return

        filepath = repo_root / rel_path
        content = _read_tail(filepath, lines)
        # Truncate for Telegram message limit
        if len(content) > 3500:
            content = content[-3500:]
        bot.send_message(message.chat.id, f"📄 **{bot_name.upper()} logs** (last {lines} lines):\n```\n{content}\n```", parse_mode="Markdown")

    @bot.message_handler(commands=["errors"])
    @admin_only
    def handle_errors(message):
        """Usage: /errors <ata|business>"""
        parts = message.text.split()
        if len(parts) < 2:
            bot.reply_to(message, "👉 Cú pháp: `/errors <ata|business>`", parse_mode="Markdown")
            return

        bot_name = parts[1].strip().lower()
        rel_path = BOT_LOG_FILES.get(bot_name)
        if not rel_path:
            bot.reply_to(message, f"❌ Unknown bot: `{bot_name}`.", parse_mode="Markdown")
            return

        filepath = repo_root / rel_path
        content = _grep_errors(filepath)
        if len(content) > 3500:
            content = content[-3500:]
        bot.send_message(message.chat.id, f"🔴 **{bot_name.upper()} errors**:\n```\n{content}\n```", parse_mode="Markdown")
