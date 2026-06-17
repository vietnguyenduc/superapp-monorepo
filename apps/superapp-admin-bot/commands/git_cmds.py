"""Telegram command handlers for git operations."""
import logging
from telebot.types import InlineKeyboardMarkup, InlineKeyboardButton

logger = logging.getLogger("AdminBot.cmds.git")


def register(bot, is_authorized):
    """Register git commands on the bot."""

    @bot.message_handler(commands=['sync', 'pull'])
    def handle_sync(message):
        if not is_authorized(message):
            return
        bot.reply_to(message, "🔄 Syncing branch viet...")
        from core.git_manager import sync_branch_viet
        bot.send_message(message.chat.id, sync_branch_viet(), parse_mode="Markdown")

    @bot.message_handler(commands=['push'])
    def handle_push(message):
        if not is_authorized(message):
            return
        parts = message.text.split(maxsplit=1)
        commit_msg = parts[1].strip() if len(parts) > 1 else None
        from core.git_manager import safe_push
        bot.reply_to(message, safe_push(commit_msg), parse_mode="Markdown")

    @bot.message_handler(commands=['diff'])
    def handle_diff(message):
        if not is_authorized(message):
            return
        from core.git_manager import get_diff_summary
        bot.reply_to(message, get_diff_summary(), parse_mode="Markdown")

    @bot.message_handler(commands=['backup'])
    def handle_backup(message):
        if not is_authorized(message):
            return
        bot.reply_to(message, "💾 Creating backup...")
        from core.git_manager import backup_local
        bot.send_message(message.chat.id, backup_local(), parse_mode="Markdown")

    @bot.message_handler(commands=['conflicts'])
    def handle_conflicts(message):
        if not is_authorized(message):
            return
        from core.git_manager import resolve_conflicts_auto
        bot.reply_to(message, resolve_conflicts_auto(), parse_mode="Markdown")

    @bot.message_handler(commands=['gitlog'])
    def handle_gitlog(message):
        if not is_authorized(message):
            return
        parts = message.text.split(maxsplit=1)
        count = 10
        if len(parts) > 1 and parts[1].strip().isdigit():
            count = int(parts[1].strip())
        from core.git_manager import get_log_summary
        bot.reply_to(message, get_log_summary(count), parse_mode="Markdown")

    @bot.message_handler(commands=['merge_to_main'])
    def handle_merge(message):
        if not is_authorized(message):
            return
        markup = InlineKeyboardMarkup()
        markup.add(
            InlineKeyboardButton("✅ Confirm merge viet → main", callback_data="confirm_merge_main"),
            InlineKeyboardButton("❌ Cancel", callback_data="cancel_merge"),
        )
        bot.reply_to(message, "⚠️ **Merge viet → main?** This is irreversible.", reply_markup=markup, parse_mode="Markdown")
