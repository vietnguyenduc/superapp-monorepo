"""Telegram command handlers for Devin integration."""
import logging
from telebot.types import InlineKeyboardMarkup, InlineKeyboardButton

logger = logging.getLogger("AdminBot.cmds.devin")


def register(bot, is_authorized):
    """Register Devin integration commands on the bot."""

    @bot.message_handler(commands=['devin_fix'])
    def handle_devin_fix(message):
        if not is_authorized(message):
            return
        parts = message.text.split(maxsplit=1)
        if len(parts) < 2:
            return bot.reply_to(message, "Usage: `/devin_fix <bot_name>`\nWill auto-analyze errors and create a Devin fix session.", parse_mode="Markdown")

        bot_name = parts[1].strip()
        bot.reply_to(message, f"🔍 Analyzing errors for '{bot_name}'...")

        from core.log_analyzer import grep_errors
        errors = grep_errors(bot_name)
        if "No errors" in errors:
            return bot.send_message(message.chat.id, f"✅ No errors found for '{bot_name}'. Nothing to fix.")

        from core.devin_bridge import auto_fix_from_error
        result = auto_fix_from_error(errors, bot_name)
        bot.send_message(message.chat.id, result, parse_mode="Markdown")

    @bot.message_handler(commands=['devin_improve'])
    def handle_devin_improve(message):
        if not is_authorized(message):
            return
        parts = message.text.split(maxsplit=1)
        prompt = parts[1].strip() if len(parts) > 1 else "Review the superapp-monorepo codebase. Find TODO/FIXME comments and suggest improvements."

        bot.reply_to(message, "🧠 Creating Devin improvement session...")
        from core.devin_bridge import trigger_devin_session
        result = trigger_devin_session(
            prompt=prompt,
            context="Repository: vietnguyenduc/superapp-monorepo (branch: viet)"
        )
        bot.send_message(message.chat.id, result, parse_mode="Markdown")

    @bot.message_handler(commands=['devin_status'])
    def handle_devin_status(message):
        if not is_authorized(message):
            return
        parts = message.text.split(maxsplit=1)
        if len(parts) < 2:
            return bot.reply_to(message, "Usage: `/devin_status <session_id>`", parse_mode="Markdown")

        session_id = parts[1].strip()
        from core.devin_bridge import check_devin_status
        bot.reply_to(message, check_devin_status(session_id), parse_mode="Markdown")

    @bot.message_handler(commands=['devin_msg'])
    def handle_devin_msg(message):
        if not is_authorized(message):
            return
        parts = message.text.split(maxsplit=2)
        if len(parts) < 3:
            return bot.reply_to(message, "Usage: `/devin_msg <session_id> <message>`", parse_mode="Markdown")

        session_id = parts[1].strip()
        msg_text = parts[2].strip()
        from core.devin_bridge import send_devin_message
        bot.reply_to(message, send_devin_message(session_id, msg_text), parse_mode="Markdown")
