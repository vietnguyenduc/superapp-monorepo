"""Git operations: /sync, /git_status"""

import subprocess
import logging
from pathlib import Path

logger = logging.getLogger("AdminBot.git")


def _git_sync_viet(repo_root: Path) -> tuple:
    """Stash, checkout viet, pull --rebase, pop stash.
    Returns (success: bool, log_lines: list[str])."""
    log = []

    branch_result = subprocess.run(
        ["git", "branch", "--show-current"], cwd=repo_root, capture_output=True, text=True
    )
    current_branch = branch_result.stdout.strip()
    log.append(f"Current branch: {current_branch}")

    stash_result = subprocess.run(
        ["git", "stash", "--include-untracked", "-m", "auto-stash before sync"],
        cwd=repo_root, capture_output=True, text=True
    )
    had_stash = "No local changes" not in stash_result.stdout
    if had_stash:
        log.append("Stashed local changes.")

    if current_branch != "viet":
        co = subprocess.run(
            ["git", "checkout", "viet"], cwd=repo_root, capture_output=True, text=True
        )
        if co.returncode != 0:
            log.append(f"Checkout viet failed: {co.stderr.strip()}")
            if had_stash:
                subprocess.run(["git", "stash", "pop"], cwd=repo_root, capture_output=True, text=True)
            return False, log
        log.append("Switched to branch viet.")

    pull = subprocess.run(
        ["git", "pull", "origin", "viet", "--rebase"],
        cwd=repo_root, capture_output=True, text=True
    )
    if pull.returncode != 0:
        log.append(f"Rebase conflict: {pull.stderr.strip()[:500]}")
        subprocess.run(["git", "rebase", "--abort"], cwd=repo_root, capture_output=True, text=True)
        log.append("Aborted rebase. Trying merge...")
        pull2 = subprocess.run(
            ["git", "pull", "origin", "viet"],
            cwd=repo_root, capture_output=True, text=True
        )
        if pull2.returncode != 0:
            log.append(f"Merge also failed: {pull2.stderr.strip()[:500]}")
            if had_stash:
                subprocess.run(["git", "stash", "pop"], cwd=repo_root, capture_output=True, text=True)
            return False, log
        log.append("Merge pull succeeded.")
    else:
        log.append(f"Pull OK: {pull.stdout.strip()[:300]}")

    if had_stash:
        pop = subprocess.run(
            ["git", "stash", "pop"], cwd=repo_root, capture_output=True, text=True
        )
        if pop.returncode != 0:
            log.append(f"Stash pop conflict: {pop.stderr.strip()[:300]}")
        else:
            log.append("Restored stashed changes.")

    return True, log


def register(bot, admin_only, repo_root: Path):

    @bot.message_handler(commands=["sync"])
    @admin_only
    def handle_sync(message):
        bot.reply_to(message, "🔄 Syncing monorepo with branch `viet`...")
        bot.send_chat_action(message.chat.id, "typing")

        fetch = subprocess.run(
            ["git", "fetch", "--all", "--prune"], cwd=repo_root, capture_output=True, text=True
        )

        success, log = _git_sync_viet(repo_root)
        log.insert(0, f"Fetch: {fetch.stdout.strip()[:200]}")

        log_text = "\n".join(log)
        status_icon = "✅" if success else "❌"
        bot.send_message(
            message.chat.id,
            f"{status_icon} Sync {'OK' if success else 'FAILED'}\n```\n{log_text[:3000]}\n```",
            parse_mode="Markdown",
        )

    @bot.message_handler(commands=["git_status"])
    @admin_only
    def handle_git_status(message):
        try:
            branch = subprocess.run(
                ["git", "branch", "--show-current"], cwd=repo_root, capture_output=True, text=True
            )
            status = subprocess.run(
                ["git", "status", "-s"], cwd=repo_root, capture_output=True, text=True
            )
            log_out = subprocess.run(
                ["git", "log", "--oneline", "-5"], cwd=repo_root, capture_output=True, text=True
            )
            text = (
                f"🌿 **Branch**: `{branch.stdout.strip()}`\n\n"
                f"**Status**:\n```\n{status.stdout.strip() or '(clean)'}\n```\n\n"
                f"**Recent commits**:\n```\n{log_out.stdout.strip()}\n```"
            )
            bot.send_message(message.chat.id, text, parse_mode="Markdown")
        except Exception as e:
            bot.reply_to(message, f"❌ Error: {e}")
