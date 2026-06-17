"""
admin-bot — DevOps-focused Telegram bot for process management, log reading,
health checks, and git operations across the superapp-monorepo.

Env vars:
    TELEGRAM_BOT_TOKEN       — Bot token (can share with business bot or use a separate one)
    ALLOWED_TELEGRAM_USER_ID — Comma-separated admin Telegram IDs
    DEVIN_API_KEY            — (Optional) For auto-creating Devin sessions on repeated errors
    MONOREPO_ROOT_PATH       — (Optional) Override monorepo root detection
"""

import os
import sys
import logging
import threading
from pathlib import Path
from dotenv import load_dotenv

if sys.platform.startswith("win"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

ENV_PATH = Path(__file__).parent / ".env"
if ENV_PATH.exists():
    load_dotenv(dotenv_path=ENV_PATH)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler(Path(__file__).parent / "admin_bot.log", encoding="utf-8"),
    ],
)
logger = logging.getLogger("AdminBot")

import telebot

BOT_TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN")
ALLOWED_IDS = [
    uid.strip()
    for uid in (os.environ.get("ALLOWED_TELEGRAM_USER_ID") or "").split(",")
    if uid.strip()
]
REPO_ROOT = Path(os.environ.get("MONOREPO_ROOT_PATH", "")) if os.environ.get("MONOREPO_ROOT_PATH") else Path(__file__).parent.parent.parent

if not BOT_TOKEN:
    logger.critical("TELEGRAM_BOT_TOKEN is missing.")
    sys.exit(1)

bot = telebot.TeleBot(BOT_TOKEN)


def is_admin(user_id: int) -> bool:
    return str(user_id) in ALLOWED_IDS


def admin_only(func):
    """Decorator that blocks non-admin users."""
    def wrapper(message):
        if not is_admin(message.from_user.id):
            bot.reply_to(message, "⛔ Access Denied.")
            return
        return func(message)
    wrapper.__name__ = func.__name__
    return wrapper


# ── Import command modules ────────────────────────────────────────────────────
from commands import process_mgmt, log_reader, health_check, git_ops

process_mgmt.register(bot, admin_only, REPO_ROOT)
log_reader.register(bot, admin_only, REPO_ROOT)
health_check.register(bot, admin_only, REPO_ROOT)
git_ops.register(bot, admin_only, REPO_ROOT)


# ── /start handler ───────────────────────────────────────────────────────────

@bot.message_handler(commands=["start", "help"])
@admin_only
def handle_start(message):
    bot.reply_to(
        message,
        "🛠️ **ADMIN BOT — DevOps Control Panel**\n\n"
        "**Process Management:**\n"
        "  /kill_ata — Kill ATA bot\n"
        "  /kill_business — Kill Business bot\n"
        "  /restart_all — Restart all bots\n\n"
        "**Logs:**\n"
        "  /logs <ata|business> [lines] — Read log tail\n"
        "  /errors <ata|business> — Grep ERROR/CRITICAL\n\n"
        "**Health:**\n"
        "  /health — System health check\n"
        "  /zombie — Find & kill zombie processes\n\n"
        "**Git:**\n"
        "  /sync — Pull origin viet for monorepo\n"
        "  /git_status — Show branch and status\n",
        parse_mode="Markdown",
    )


# ── Watchdog background thread ───────────────────────────────────────────────
from commands.health_check import watchdog_loop

_watchdog_thread = None


def start_watchdog():
    global _watchdog_thread
    _watchdog_thread = threading.Thread(
        target=watchdog_loop,
        args=(bot, ALLOWED_IDS, REPO_ROOT),
        daemon=True,
    )
    _watchdog_thread.start()
    logger.info("Background watchdog started.")


# ── Entry point ──────────────────────────────────────────────────────────────

if __name__ == "__main__":
    logger.info("Admin Bot starting...")
    start_watchdog()
    logger.info("Admin Bot polling...")
    try:
        bot.infinity_polling()
    except KeyboardInterrupt:
        logger.info("Admin Bot stopped.")
        sys.exit(0)
