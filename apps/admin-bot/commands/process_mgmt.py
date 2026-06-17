"""Process management commands: /kill_ata, /kill_business, /restart_all"""

import os
import subprocess
import logging
from pathlib import Path

logger = logging.getLogger("AdminBot.process")


def _kill_bot(pattern: str, label: str) -> str:
    """Kill Python processes matching a command-line pattern. Returns log text."""
    try:
        cmd = (
            f"Get-WmiObject Win32_Process "
            f"| Where-Object {{ $_.Name -like '*python*' -and $_.CommandLine -like '*{pattern}*main.py*' }} "
            f"| ForEach-Object {{ Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue; "
            f"Write-Host ('Killed PID: ' + $_.ProcessId) }}; "
            f"Write-Host 'Done'"
        )
        result = subprocess.run(
            ["powershell", "-NoProfile", "-Command", cmd],
            capture_output=True, text=True, timeout=15,
        )
        return result.stdout.strip() or f"No {label} processes found."
    except Exception as e:
        return f"Error: {e}"


def register(bot, admin_only, repo_root: Path):

    @bot.message_handler(commands=["kill_ata"])
    @admin_only
    def handle_kill_ata(message):
        bot.reply_to(message, "🔫 Killing ATA bot processes...")
        result = _kill_bot("antigravity-telegram-agent", "ATA")
        bot.send_message(message.chat.id, f"```\n{result}\n```", parse_mode="Markdown")

    @bot.message_handler(commands=["kill_business"])
    @admin_only
    def handle_kill_business(message):
        bot.reply_to(message, "🔫 Killing Business bot processes...")
        result = _kill_bot("superapp-business-bot", "Business")
        bot.send_message(message.chat.id, f"```\n{result}\n```", parse_mode="Markdown")

    @bot.message_handler(commands=["restart_all"])
    @admin_only
    def handle_restart_all(message):
        bot.reply_to(message, "🔄 Restarting all bots...")

        ata_dir = repo_root / "apps" / "antigravity-telegram-agent"
        biz_dir = repo_root / "apps" / "superapp-business-bot"
        results = []

        # Kill existing
        results.append("ATA kill: " + _kill_bot("antigravity-telegram-agent", "ATA"))
        results.append("BIZ kill: " + _kill_bot("superapp-business-bot", "Business"))

        # Restart via run.bat
        for label, bot_dir in [("ATA", ata_dir), ("BIZ", biz_dir)]:
            bat = bot_dir / "run.bat"
            if bat.exists():
                try:
                    subprocess.Popen(
                        ["cmd.exe", "/c", str(bat)],
                        cwd=str(bot_dir),
                        creationflags=subprocess.CREATE_NEW_CONSOLE,
                    )
                    results.append(f"{label}: restart issued via run.bat")
                except Exception as e:
                    results.append(f"{label}: restart failed — {e}")
            else:
                results.append(f"{label}: run.bat not found at {bat}")

        bot.send_message(message.chat.id, "\n".join(results))
