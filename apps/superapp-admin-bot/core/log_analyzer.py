"""Log analysis: tail, grep errors, pattern detection, crash frequency."""
import os
import re
import json
import logging
import time
from pathlib import Path
from collections import Counter

logger = logging.getLogger("AdminBot.logs")

SETTINGS_PATH = Path(__file__).parent.parent / "config" / "settings.json"


def _load_settings() -> dict:
    try:
        return json.loads(SETTINGS_PATH.read_text(encoding="utf-8"))
    except Exception:
        return {}


def _get_monorepo_root() -> Path:
    root = os.environ.get("MONOREPO_ROOT_PATH", "")
    if root:
        return Path(root)
    return Path(__file__).resolve().parents[3]


def _find_log_file(bot_name: str) -> Path:
    """Find the primary log file for a bot."""
    settings = _load_settings()
    bot_cfg = settings.get("bots", {}).get(bot_name, {})
    root = _get_monorepo_root()
    bot_dir = root / bot_cfg.get("path", f"apps/{bot_name}")

    # Common log file names
    for name in ["agent_service.log", "bot.log", "service.log", "crash_log.txt"]:
        p = bot_dir / name
        if p.exists():
            return p
    return bot_dir / "agent_service.log"


def tail_log(bot_name: str, lines: int = 50) -> str:
    """Read the last N lines of a bot's log."""
    log_file = _find_log_file(bot_name)
    if not log_file.exists():
        return f"ℹ️ No log file found for '{bot_name}' at {log_file}"

    try:
        all_lines = log_file.read_text(encoding="utf-8", errors="replace").splitlines()
        tail = all_lines[-lines:]
        return f"📄 **{bot_name}** (last {len(tail)} lines):\n```\n" + "\n".join(tail) + "\n```"
    except Exception as e:
        return f"❌ Error reading log: {e}"


def grep_errors(bot_name: str) -> str:
    """Grep ERROR/CRITICAL/Traceback from a bot's log."""
    log_file = _find_log_file(bot_name)
    if not log_file.exists():
        return f"ℹ️ No log file found for '{bot_name}'."

    try:
        content = log_file.read_text(encoding="utf-8", errors="replace")
        pattern = re.compile(r".*(ERROR|CRITICAL|Traceback|Exception).*", re.IGNORECASE)
        matches = pattern.findall(content)

        error_lines = []
        for line in content.splitlines():
            if pattern.match(line):
                error_lines.append(line.strip())

        if not error_lines:
            return f"✅ No errors found in '{bot_name}' logs."

        # Last 20 errors
        recent = error_lines[-20:]
        return f"🚨 **{bot_name}** — {len(error_lines)} errors total (showing last {len(recent)}):\n```\n" + "\n".join(recent) + "\n```"
    except Exception as e:
        return f"❌ Error analyzing logs: {e}"


def detect_patterns(bot_name: str) -> dict:
    """Detect repeated error patterns. Returns dict with pattern info."""
    log_file = _find_log_file(bot_name)
    if not log_file.exists():
        return {"patterns": [], "alert": False}

    try:
        content = log_file.read_text(encoding="utf-8", errors="replace")
        error_lines = []
        for line in content.splitlines():
            if any(kw in line.upper() for kw in ["ERROR", "CRITICAL", "TRACEBACK"]):
                # Normalize: strip timestamps
                cleaned = re.sub(r"^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}[,.]?\d*\s*", "", line.strip())
                # Truncate for grouping
                cleaned = cleaned[:120]
                error_lines.append(cleaned)

        counter = Counter(error_lines)
        repeated = [(pattern, count) for pattern, count in counter.most_common(10) if count >= 3]
        alert = len(repeated) > 0

        return {
            "patterns": [{"pattern": p, "count": c} for p, c in repeated],
            "alert": alert,
        }
    except Exception:
        return {"patterns": [], "alert": False}


def get_crash_frequency(bot_name: str) -> str:
    """Count crash/restart occurrences from crash_log.txt."""
    settings = _load_settings()
    bot_cfg = settings.get("bots", {}).get(bot_name, {})
    root = _get_monorepo_root()
    bot_dir = root / bot_cfg.get("path", f"apps/{bot_name}")
    crash_log = bot_dir / "crash_log.txt"

    if not crash_log.exists():
        return f"ℹ️ No crash_log.txt for '{bot_name}'."

    try:
        lines = crash_log.read_text(encoding="utf-8", errors="replace").splitlines()
        starts = [l for l in lines if "Start #" in l]
        exits = [l for l in lines if "Exit code" in l]
        cooldowns = [l for l in lines if "COOLDOWN" in l]
        return (
            f"📊 **Crash stats for {bot_name}:**\n"
            f"• Total starts: {len(starts)}\n"
            f"• Total exits: {len(exits)}\n"
            f"• Cooldowns: {len(cooldowns)}\n"
            f"• Last 5 entries:\n```\n" + "\n".join(lines[-5:]) + "\n```"
        )
    except Exception as e:
        return f"❌ Error reading crash log: {e}"
