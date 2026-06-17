"""Telegram command handlers for system inspection."""
import os
import logging

logger = logging.getLogger("AdminBot.cmds.inspect")


def register(bot, is_authorized):
    """Register inspection commands on the bot."""

    @bot.message_handler(commands=['health'])
    def handle_health(message):
        if not is_authorized(message):
            return
        from core.process_manager import get_all_status, detect_hanging
        status = get_all_status()
        hanging = detect_hanging()
        bot.reply_to(message, f"{status}\n\n{hanging}", parse_mode="Markdown")

    @bot.message_handler(commands=['disk'])
    def handle_disk(message):
        if not is_authorized(message):
            return
        try:
            import psutil
            disk = psutil.disk_usage("/")
            msg = (
                f"💾 **Disk Usage:**\n"
                f"• Total: {disk.total / (1024**3):.1f} GB\n"
                f"• Used: {disk.used / (1024**3):.1f} GB ({disk.percent}%)\n"
                f"• Free: {disk.free / (1024**3):.1f} GB"
            )
        except ImportError:
            msg = "❌ psutil not installed."
        bot.reply_to(message, msg, parse_mode="Markdown")

    @bot.message_handler(commands=['memory', 'ram'])
    def handle_memory(message):
        if not is_authorized(message):
            return
        try:
            import psutil
            mem = psutil.virtual_memory()
            msg = (
                f"🧠 **Memory Usage:**\n"
                f"• Total: {mem.total / (1024**3):.1f} GB\n"
                f"• Used: {mem.used / (1024**3):.1f} GB ({mem.percent}%)\n"
                f"• Available: {mem.available / (1024**3):.1f} GB"
            )
        except ImportError:
            msg = "❌ psutil not installed."
        bot.reply_to(message, msg, parse_mode="Markdown")

    @bot.message_handler(commands=['inspect'])
    def handle_inspect(message):
        """Full system inspection."""
        if not is_authorized(message):
            return
        lines = ["🔍 **Full System Inspection:**\n"]

        # Process status
        from core.process_manager import get_all_status, detect_hanging
        lines.append(get_all_status())
        lines.append(detect_hanging())

        # Resources
        try:
            import psutil
            mem = psutil.virtual_memory()
            disk = psutil.disk_usage("/")
            lines.append(
                f"\n💻 **Resources:**\n"
                f"• RAM: {mem.percent}% used ({mem.available / (1024**3):.1f} GB free)\n"
                f"• Disk: {disk.percent}% used ({disk.free / (1024**3):.1f} GB free)\n"
                f"• CPU: {psutil.cpu_percent(interval=0.5)}%"
            )
        except ImportError:
            lines.append("\n❌ psutil not available for resource metrics.")

        # Git status
        from core.git_manager import get_diff_summary
        lines.append(f"\n{get_diff_summary()}")

        result = "\n".join(lines)
        if len(result) > 4000:
            result = result[:4000] + "\n... (truncated)"
        bot.reply_to(message, result, parse_mode="Markdown")
