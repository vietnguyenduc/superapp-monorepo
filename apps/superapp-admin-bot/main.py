"""SuperApp Admin Bot — Super DevOps Butler.

Manages processes, git, logs, watchdog, and Devin integration for the monorepo.
"""
import os
import sys

# Force stdout/stderr to UTF-8 on Windows
if sys.platform.startswith('win'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

import json
import logging
import time
import threading
from pathlib import Path
from dotenv import load_dotenv

# Logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler(Path(__file__).parent / "admin_bot.log", encoding="utf-8"),
    ],
)
logger = logging.getLogger("AdminBot")

# Load env
ENV_PATH = Path(__file__).parent / ".env"
if ENV_PATH.exists():
    load_dotenv(dotenv_path=ENV_PATH)
else:
    load_dotenv()

import telebot
from telebot.types import InlineKeyboardMarkup, InlineKeyboardButton

BOT_TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN_2", "")
ALLOWED_USER_ID = os.environ.get("ALLOWED_TELEGRAM_USER_ID", "")

if not BOT_TOKEN:
    logger.critical("TELEGRAM_BOT_TOKEN_2 not set! Admin bot cannot start.")
    sys.exit(1)

bot = telebot.TeleBot(BOT_TOKEN)


def is_authorized(message) -> bool:
    """Check if the message sender is in the allowed users list."""
    if not ALLOWED_USER_ID:
        return True
    allowed_ids = [uid.strip() for uid in str(ALLOWED_USER_ID).split(",")]
    if str(message.from_user.id) not in allowed_ids:
        bot.reply_to(message, "⛔ Unauthorized.")
        return False
    return True


# ── Register all command modules ──────────────────────────────────────────────
from commands import process_cmds, git_cmds, log_cmds, inspect_cmds, devin_cmds, schedule_cmds

process_cmds.register(bot, is_authorized)
git_cmds.register(bot, is_authorized)
log_cmds.register(bot, is_authorized)
inspect_cmds.register(bot, is_authorized)
devin_cmds.register(bot, is_authorized)
schedule_cmds.register(bot, is_authorized)


# ── Main Menu ─────────────────────────────────────────────────────────────────
@bot.message_handler(commands=['start', 'menu'])
def handle_menu(message):
    if not is_authorized(message):
        return
    markup = InlineKeyboardMarkup(row_width=3)
    markup.add(
        InlineKeyboardButton("📊 Status", callback_data="menu_status"),
        InlineKeyboardButton("🔄 Restart All", callback_data="restart_all"),
        InlineKeyboardButton("🔀 Git Sync", callback_data="menu_git"),
    )
    markup.add(
        InlineKeyboardButton("📋 Logs", callback_data="menu_logs"),
        InlineKeyboardButton("🧠 Devin", callback_data="menu_devin"),
        InlineKeyboardButton("🔍 Inspect", callback_data="menu_inspect"),
    )
    markup.add(
        InlineKeyboardButton("🧟 Kill Zombies", callback_data="run_zombie"),
        InlineKeyboardButton("⏰ Schedules", callback_data="menu_schedules"),
        InlineKeyboardButton("❓ Help", callback_data="menu_help"),
    )
    bot.send_message(
        message.chat.id,
        "🤖 **SuperApp Admin Bot — DevOps Butler**\n\nSelect an action:",
        reply_markup=markup,
        parse_mode="Markdown",
    )


@bot.message_handler(commands=['help'])
def handle_help(message):
    if not is_authorized(message):
        return
    help_text = (
        "🤖 **SuperApp Admin Bot Commands:**\n\n"
        "**Process Management:**\n"
        "/status — All bot statuses\n"
        "/kill <bot> — Kill a bot\n"
        "/restart <bot> — Restart a bot\n"
        "/zombie — Kill zombie processes\n"
        "/hanging — Check hanging bots\n\n"
        "**Git Operations:**\n"
        "/sync — Pull branch viet\n"
        "/push [msg] — Commit & push\n"
        "/diff — Show uncommitted changes\n"
        "/backup — Create backup zip\n"
        "/conflicts — Auto-resolve conflicts\n"
        "/gitlog [n] — Recent commits\n"
        "/merge_to_main — Merge viet to main\n\n"
        "**Log Analysis:**\n"
        "/logs <bot> [lines] — Tail logs\n"
        "/errors <bot> — Grep errors\n"
        "/crashes <bot> — Crash frequency\n\n"
        "**System Inspection:**\n"
        "/health — Full health check\n"
        "/disk — Disk usage\n"
        "/memory — RAM usage\n"
        "/inspect — Full system report\n\n"
        "**Devin Integration:**\n"
        "/devin_fix <bot> — Auto-fix errors\n"
        "/devin_improve [prompt] — Code review\n"
        "/devin_status <id> — Session status\n"
        "/devin_msg <id> <msg> — Send message\n\n"
        "**Schedules:**\n"
        "/schedule_list — Show schedules\n"
        "/schedule_update <key> <val> — Update\n\n"
        "/menu — Main menu"
    )
    bot.reply_to(message, help_text, parse_mode="Markdown")


# ── Callback Query Handler (InlineKeyboard) ──────────────────────────────────
@bot.callback_query_handler(func=lambda call: True)
def handle_callback(call):
    user_id = call.from_user.id
    allowed_ids = [uid.strip() for uid in str(ALLOWED_USER_ID).split(",")]
    if ALLOWED_USER_ID and str(user_id) not in allowed_ids:
        bot.answer_callback_query(call.id, "Unauthorized")
        return

    data = call.data
    chat_id = call.message.chat.id

    # Menu navigation
    if data == "menu_status":
        from core.process_manager import get_all_status
        markup = InlineKeyboardMarkup(row_width=2)
        markup.add(
            InlineKeyboardButton("ATA Bot", callback_data="status_antigravity"),
            InlineKeyboardButton("Business Bot", callback_data="status_business"),
            InlineKeyboardButton("🔙 Main Menu", callback_data="back_main"),
        )
        bot.send_message(chat_id, get_all_status(), reply_markup=markup, parse_mode="Markdown")

    elif data == "menu_git":
        markup = InlineKeyboardMarkup(row_width=3)
        markup.add(
            InlineKeyboardButton("⬇️ Pull", callback_data="git_pull"),
            InlineKeyboardButton("⬆️ Push", callback_data="git_push"),
            InlineKeyboardButton("📊 Diff", callback_data="git_diff"),
        )
        markup.add(
            InlineKeyboardButton("💾 Backup", callback_data="git_backup"),
            InlineKeyboardButton("🔀 Merge Main", callback_data="git_merge_confirm"),
            InlineKeyboardButton("🔙 Back", callback_data="back_main"),
        )
        bot.send_message(chat_id, "🔀 **Git Operations:**", reply_markup=markup, parse_mode="Markdown")

    elif data == "menu_logs":
        markup = InlineKeyboardMarkup(row_width=2)
        markup.add(
            InlineKeyboardButton("📄 ATA Logs", callback_data="logs_antigravity"),
            InlineKeyboardButton("📄 Biz Logs", callback_data="logs_business"),
            InlineKeyboardButton("🚨 ATA Errors", callback_data="errors_antigravity"),
            InlineKeyboardButton("🚨 Biz Errors", callback_data="errors_business"),
            InlineKeyboardButton("🔙 Back", callback_data="back_main"),
        )
        bot.send_message(chat_id, "📋 **Log Analysis:**", reply_markup=markup, parse_mode="Markdown")

    elif data == "menu_devin":
        markup = InlineKeyboardMarkup(row_width=2)
        markup.add(
            InlineKeyboardButton("🔧 Fix ATA", callback_data="devin_fix_antigravity"),
            InlineKeyboardButton("🔧 Fix Biz", callback_data="devin_fix_business"),
            InlineKeyboardButton("🧠 Improve", callback_data="devin_improve"),
            InlineKeyboardButton("🔙 Back", callback_data="back_main"),
        )
        bot.send_message(chat_id, "🧠 **Devin Integration:**", reply_markup=markup, parse_mode="Markdown")

    elif data == "menu_inspect":
        from core.process_manager import get_all_status, detect_hanging
        status = get_all_status()
        hanging = detect_hanging()
        bot.send_message(chat_id, f"{status}\n\n{hanging}", parse_mode="Markdown")

    elif data == "menu_schedules":
        try:
            from core.scheduler import _load_settings
            settings = _load_settings()
            sched = settings.get("scheduler", {})
            lines = ["⏰ **Scheduled Tasks:**\n"]
            lines.append(f"• Health check: every {sched.get('health_check_minutes', 30)} min")
            lines.append(f"• Auto-commit: every {sched.get('auto_commit_hours', 2)} hours")
            lines.append(f"• Backup: every {sched.get('backup_hours', 6)} hours")
            lines.append(f"• Daily inspect: {sched.get('daily_inspect_time', '06:00')}")
            lines.append(f"• Error summary: {sched.get('daily_error_summary_time', '18:00')}")
            bot.send_message(chat_id, "\n".join(lines), parse_mode="Markdown")
        except Exception as e:
            bot.send_message(chat_id, f"❌ {e}")

    elif data == "menu_help":
        bot.send_message(chat_id, "Type /help for full command reference.")

    elif data == "back_main":
        # Re-show main menu
        markup = InlineKeyboardMarkup(row_width=3)
        markup.add(
            InlineKeyboardButton("📊 Status", callback_data="menu_status"),
            InlineKeyboardButton("🔄 Restart All", callback_data="restart_all"),
            InlineKeyboardButton("🔀 Git Sync", callback_data="menu_git"),
        )
        markup.add(
            InlineKeyboardButton("📋 Logs", callback_data="menu_logs"),
            InlineKeyboardButton("🧠 Devin", callback_data="menu_devin"),
            InlineKeyboardButton("🔍 Inspect", callback_data="menu_inspect"),
        )
        bot.send_message(chat_id, "🤖 **Main Menu:**", reply_markup=markup, parse_mode="Markdown")

    # Process actions
    elif data.startswith("kill_"):
        bot_name = data.replace("kill_", "")
        from core.process_manager import kill_bot
        bot.send_message(chat_id, kill_bot(bot_name))

    elif data.startswith("restart_"):
        target = data.replace("restart_", "")
        from core.process_manager import restart_bot
        if target == "all":
            results = []
            for name in ["antigravity", "business"]:
                results.append(f"**{name}:** {restart_bot(name)}")
            bot.send_message(chat_id, "\n\n".join(results), parse_mode="Markdown")
        else:
            bot.send_message(chat_id, restart_bot(target))

    elif data == "run_zombie":
        from core.process_manager import kill_zombies
        bot.send_message(chat_id, kill_zombies())

    # Git actions
    elif data == "git_pull":
        bot.send_message(chat_id, "🔄 Syncing...")
        from core.git_manager import sync_branch_viet
        bot.send_message(chat_id, sync_branch_viet(), parse_mode="Markdown")

    elif data == "git_push":
        from core.git_manager import safe_push
        bot.send_message(chat_id, safe_push(), parse_mode="Markdown")

    elif data == "git_diff":
        from core.git_manager import get_diff_summary
        bot.send_message(chat_id, get_diff_summary(), parse_mode="Markdown")

    elif data == "git_backup":
        bot.send_message(chat_id, "💾 Creating backup...")
        from core.git_manager import backup_local
        bot.send_message(chat_id, backup_local(), parse_mode="Markdown")

    elif data == "git_merge_confirm":
        markup = InlineKeyboardMarkup()
        markup.add(
            InlineKeyboardButton("✅ Confirm", callback_data="confirm_merge_main"),
            InlineKeyboardButton("❌ Cancel", callback_data="back_main"),
        )
        bot.send_message(chat_id, "⚠️ **Merge viet → main?**", reply_markup=markup, parse_mode="Markdown")

    elif data == "confirm_merge_main":
        from core.git_manager import merge_viet_to_main
        bot.send_message(chat_id, merge_viet_to_main(), parse_mode="Markdown")

    # Log actions
    elif data.startswith("logs_"):
        bot_name = data.replace("logs_", "")
        from core.log_analyzer import tail_log
        result = tail_log(bot_name, 30)
        if len(result) > 4000:
            result = result[:4000] + "\n```\n... (truncated)"
        bot.send_message(chat_id, result, parse_mode="Markdown")

    elif data.startswith("errors_"):
        bot_name = data.replace("errors_", "")
        from core.log_analyzer import grep_errors
        result = grep_errors(bot_name)
        if len(result) > 4000:
            result = result[:4000] + "\n```\n... (truncated)"
        bot.send_message(chat_id, result, parse_mode="Markdown")

    elif data.startswith("crashes_"):
        bot_name = data.replace("crashes_", "")
        from core.log_analyzer import get_crash_frequency
        bot.send_message(chat_id, get_crash_frequency(bot_name), parse_mode="Markdown")

    # Devin actions
    elif data.startswith("devin_fix_"):
        bot_name = data.replace("devin_fix_", "")
        bot.send_message(chat_id, f"🔍 Analyzing errors for '{bot_name}'...")
        from core.log_analyzer import grep_errors
        errors = grep_errors(bot_name)
        if "No errors" in errors:
            bot.send_message(chat_id, f"✅ No errors for '{bot_name}'.")
        else:
            from core.devin_bridge import auto_fix_from_error
            bot.send_message(chat_id, auto_fix_from_error(errors, bot_name), parse_mode="Markdown")

    elif data == "devin_improve":
        bot.send_message(chat_id, "🧠 Creating Devin session...")
        from core.devin_bridge import trigger_devin_session
        result = trigger_devin_session(
            "Review superapp-monorepo. Find TODO/FIXME and suggest improvements.",
            "vietnguyenduc/superapp-monorepo (branch: viet)"
        )
        bot.send_message(chat_id, result, parse_mode="Markdown")

    bot.answer_callback_query(call.id)


# ── Watchdog Daemon & Scheduler ───────────────────────────────────────────────
if __name__ == "__main__":
    logger.info("Starting SuperApp Admin Bot...")

    # Heartbeat for self-monitoring
    def heartbeat_loop():
        hb_file = Path(__file__).parent / "heartbeat.txt"
        while True:
            try:
                hb_file.write_text(str(time.time()))
            except Exception:
                pass
            time.sleep(10)
    threading.Thread(target=heartbeat_loop, daemon=True).start()

    # Start watchdog
    try:
        from core.watchdog import Watchdog

        def watchdog_alert(msg):
            if ALLOWED_USER_ID:
                primary_id = str(ALLOWED_USER_ID).split(",")[0].strip()
                try:
                    bot.send_message(primary_id, msg, parse_mode="Markdown")
                except Exception as e:
                    logger.error(f"Watchdog alert send failed: {e}")

        watchdog = Watchdog(alert_callback=watchdog_alert)
        watchdog.start()
        logger.info("Watchdog started.")
    except Exception as e:
        logger.error(f"Failed to start watchdog: {e}")

    # Start scheduler
    try:
        from core.scheduler import TaskScheduler
        primary_id = str(ALLOWED_USER_ID).split(",")[0].strip() if ALLOWED_USER_ID else None
        task_scheduler = TaskScheduler(bot=bot, admin_chat_id=primary_id)
        task_scheduler.start()
        logger.info("Task scheduler started.")
    except Exception as e:
        logger.error(f"Failed to start scheduler: {e}")

    # Robust polling
    MAX_CONSECUTIVE_ERRORS = 10
    error_count = 0

    while True:
        try:
            logger.info("Starting infinity_polling...")
            bot.infinity_polling(
                timeout=60,
                long_polling_timeout=30,
                allowed_updates=["message", "callback_query"],
                logger_level=logging.WARNING,
            )
        except KeyboardInterrupt:
            logger.info("Graceful shutdown.")
            break
        except Exception as poll_err:
            error_count += 1
            logger.error(f"Polling crashed (attempt {error_count}): {poll_err}")
            if error_count >= MAX_CONSECUTIVE_ERRORS:
                logger.critical("Max errors reached. Exiting.")
                sys.exit(1)
            wait_time = min(5 * (2 ** (error_count - 1)), 120)
            logger.info(f"Reconnecting in {wait_time}s...")
            time.sleep(wait_time)
            try:
                bot = telebot.TeleBot(BOT_TOKEN)
                error_count = 0
            except Exception as reinit_err:
                logger.critical(f"Failed to reinitialize bot: {reinit_err}")
