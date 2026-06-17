"""Telegram command handlers for log analysis."""
import logging
from telebot.types import InlineKeyboardMarkup, InlineKeyboardButton

logger = logging.getLogger("AdminBot.cmds.logs")


def register(bot, is_authorized):
    """Register log analysis commands on the bot."""

    @bot.message_handler(commands=['logs', 'tail'])
    def handle_logs(message):
        if not is_authorized(message):
            return
        parts = message.text.split()
        bot_name = parts[1] if len(parts) > 1 else None
        lines = int(parts[2]) if len(parts) > 2 and parts[2].isdigit() else 50

        if not bot_name:
            markup = InlineKeyboardMarkup()
            markup.add(
                InlineKeyboardButton("ATA Bot", callback_data="logs_antigravity"),
                InlineKeyboardButton("Business Bot", callback_data="logs_business"),
                InlineKeyboardButton("Admin Bot", callback_data="logs_admin"),
            )
            return bot.reply_to(message, "Which bot's logs?", reply_markup=markup)

        from core.log_analyzer import tail_log
        result = tail_log(bot_name, lines)
        # Telegram has 4096 char limit
        if len(result) > 4000:
            result = result[:4000] + "\n```\n... (truncated)"
        bot.reply_to(message, result, parse_mode="Markdown")

    @bot.message_handler(commands=['errors'])
    def handle_errors(message):
        if not is_authorized(message):
            return
        parts = message.text.split()
        bot_name = parts[1] if len(parts) > 1 else None

        if not bot_name:
            markup = InlineKeyboardMarkup()
            markup.add(
                InlineKeyboardButton("ATA Bot", callback_data="errors_antigravity"),
                InlineKeyboardButton("Business Bot", callback_data="errors_business"),
            )
            return bot.reply_to(message, "Which bot's errors?", reply_markup=markup)

        from core.log_analyzer import grep_errors
        result = grep_errors(bot_name)
        if len(result) > 4000:
            result = result[:4000] + "\n```\n... (truncated)"
        bot.reply_to(message, result, parse_mode="Markdown")

    @bot.message_handler(commands=['crashes'])
    def handle_crashes(message):
        if not is_authorized(message):
            return
        parts = message.text.split()
        bot_name = parts[1] if len(parts) > 1 else None

        if not bot_name:
            markup = InlineKeyboardMarkup()
            markup.add(
                InlineKeyboardButton("ATA Bot", callback_data="crashes_antigravity"),
                InlineKeyboardButton("Business Bot", callback_data="crashes_business"),
            )
            return bot.reply_to(message, "Which bot's crash stats?", reply_markup=markup)

        from core.log_analyzer import get_crash_frequency
        bot.reply_to(message, get_crash_frequency(bot_name), parse_mode="Markdown")
