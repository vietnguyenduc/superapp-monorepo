"""Telegram command handlers for process management."""
import logging
from telebot.types import InlineKeyboardMarkup, InlineKeyboardButton

logger = logging.getLogger("AdminBot.cmds.process")


def register(bot, is_authorized):
    """Register process management commands on the bot."""

    @bot.message_handler(commands=['status'])
    def handle_status(message):
        if not is_authorized(message):
            return
        from core.process_manager import get_all_status
        bot.reply_to(message, get_all_status(), parse_mode="Markdown")

    @bot.message_handler(commands=['kill'])
    def handle_kill(message):
        if not is_authorized(message):
            return
        parts = message.text.split(maxsplit=1)
        if len(parts) < 2:
            markup = InlineKeyboardMarkup()
            markup.add(
                InlineKeyboardButton("ATA Bot", callback_data="kill_antigravity"),
                InlineKeyboardButton("Business Bot", callback_data="kill_business"),
            )
            return bot.reply_to(message, "Which bot to kill?", reply_markup=markup)
        from core.process_manager import kill_bot
        bot.reply_to(message, kill_bot(parts[1].strip()))

    @bot.message_handler(commands=['restart'])
    def handle_restart(message):
        if not is_authorized(message):
            return
        parts = message.text.split(maxsplit=1)
        if len(parts) < 2:
            markup = InlineKeyboardMarkup()
            markup.add(
                InlineKeyboardButton("ATA Bot", callback_data="restart_antigravity"),
                InlineKeyboardButton("Business Bot", callback_data="restart_business"),
                InlineKeyboardButton("All Bots", callback_data="restart_all"),
            )
            return bot.reply_to(message, "Which bot to restart?", reply_markup=markup)
        from core.process_manager import restart_bot
        bot.reply_to(message, restart_bot(parts[1].strip()))

    @bot.message_handler(commands=['zombie'])
    def handle_zombie(message):
        if not is_authorized(message):
            return
        from core.process_manager import kill_zombies
        bot.reply_to(message, kill_zombies())

    @bot.message_handler(commands=['hanging'])
    def handle_hanging(message):
        if not is_authorized(message):
            return
        from core.process_manager import detect_hanging
        bot.reply_to(message, detect_hanging(), parse_mode="Markdown")
