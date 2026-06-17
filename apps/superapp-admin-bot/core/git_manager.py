"""Git operations: sync, push, backup, diff, conflict resolution."""
import os
import json
import logging
import subprocess
import shutil
import time
from pathlib import Path
from datetime import datetime

logger = logging.getLogger("AdminBot.git")

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


def _run_git(args: list, cwd: str = None) -> tuple:
    """Run a git command and return (success, output)."""
    if cwd is None:
        cwd = str(_get_monorepo_root())
    try:
        result = subprocess.run(
            ["git"] + args,
            cwd=cwd,
            capture_output=True,
            text=True,
            timeout=60,
            encoding="utf-8",
            errors="replace",
        )
        output = (result.stdout + result.stderr).strip()
        return result.returncode == 0, output
    except Exception as e:
        return False, str(e)


def sync_branch_viet() -> str:
    """Fetch all, checkout viet, pull --rebase, handle conflicts."""
    settings = _load_settings()
    branch = settings.get("git", {}).get("default_branch", "viet")
    remote = settings.get("git", {}).get("remote", "origin")

    ok, out = _run_git(["fetch", "--all"])
    if not ok:
        return f"❌ Fetch failed:\n```\n{out}\n```"

    ok, out = _run_git(["checkout", branch])
    if not ok:
        return f"❌ Checkout {branch} failed:\n```\n{out}\n```"

    ok, out = _run_git(["pull", "--rebase", remote, branch])
    if not ok:
        if "CONFLICT" in out:
            return f"⚠️ Pull had conflicts:\n```\n{out}\n```\nUse /conflicts to inspect."
        return f"❌ Pull failed:\n```\n{out}\n```"

    return f"✅ Branch `{branch}` synced successfully.\n```\n{out[:1000]}\n```"


def safe_push(message: str = None) -> str:
    """Add all changes, commit with message, push to origin viet."""
    settings = _load_settings()
    branch = settings.get("git", {}).get("default_branch", "viet")
    remote = settings.get("git", {}).get("remote", "origin")

    if not message:
        message = f"WIP auto-commit {datetime.now().strftime('%Y-%m-%d %H:%M')}"

    ok, out = _run_git(["add", "-A"])
    if not ok:
        return f"❌ git add failed:\n```\n{out}\n```"

    ok, out = _run_git(["commit", "-m", message])
    if not ok:
        if "nothing to commit" in out:
            return "ℹ️ Nothing to commit."
        return f"❌ Commit failed:\n```\n{out}\n```"

    ok, out = _run_git(["push", remote, branch])
    if not ok:
        return f"❌ Push failed:\n```\n{out}\n```"

    return f"✅ Pushed to {remote}/{branch}.\n```\n{out[:1000]}\n```"


def backup_local() -> str:
    """Create a zip backup of the monorepo."""
    root = _get_monorepo_root()
    backup_dir = root / "backups"
    backup_dir.mkdir(exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_name = f"backup_{timestamp}"
    backup_path = backup_dir / backup_name

    try:
        # Exclude heavy dirs
        exclude_dirs = {"node_modules", ".git", "__pycache__", "backups", ".next", "dist"}

        def ignore_fn(directory, contents):
            return [c for c in contents if c in exclude_dirs]

        shutil.copytree(str(root), str(backup_path), ignore=ignore_fn, dirs_exist_ok=False)
        shutil.make_archive(str(backup_path), "zip", str(backup_path))
        shutil.rmtree(str(backup_path))
        return f"✅ Backup created: `{backup_name}.zip`"
    except Exception as e:
        return f"❌ Backup failed: {e}"


def resolve_conflicts_auto() -> str:
    """Attempt to auto-resolve simple conflicts (accept ours). Notify on complex ones."""
    ok, out = _run_git(["diff", "--name-only", "--diff-filter=U"])
    if not ok:
        return "ℹ️ No conflicts detected."

    conflict_files = [f.strip() for f in out.split("\n") if f.strip()]
    if not conflict_files:
        return "✅ No conflicts to resolve."

    resolved = []
    complex_conflicts = []
    for f in conflict_files:
        # Simple: accept ours for lock files and auto-generated
        if f.endswith((".lock", ".json")) and "package" in f:
            _run_git(["checkout", "--ours", f])
            _run_git(["add", f])
            resolved.append(f)
        else:
            complex_conflicts.append(f)

    msg = ""
    if resolved:
        msg += f"✅ Auto-resolved ({len(resolved)}):\n" + "\n".join(f"• `{f}`" for f in resolved) + "\n"
    if complex_conflicts:
        msg += f"⚠️ **Need manual resolution ({len(complex_conflicts)}):**\n" + "\n".join(f"• `{f}`" for f in complex_conflicts)
    return msg or "✅ All clear."


def get_diff_summary() -> str:
    """Return git diff --stat for quick review."""
    ok, out = _run_git(["diff", "--stat"])
    if not ok or not out:
        ok2, out2 = _run_git(["diff", "--staged", "--stat"])
        if out2:
            return f"📊 **Staged changes:**\n```\n{out2[:2000]}\n```"
        return "ℹ️ No uncommitted changes."
    return f"📊 **Uncommitted changes:**\n```\n{out[:2000]}\n```"


def merge_viet_to_main() -> str:
    """Merge viet into main. ONLY when user confirms."""
    settings = _load_settings()
    branch = settings.get("git", {}).get("default_branch", "viet")
    remote = settings.get("git", {}).get("remote", "origin")

    ok, out = _run_git(["checkout", "main"])
    if not ok:
        return f"❌ Checkout main failed:\n```\n{out}\n```"

    ok, out = _run_git(["pull", remote, "main"])
    ok, out = _run_git(["merge", branch])
    if not ok:
        _run_git(["merge", "--abort"])
        _run_git(["checkout", branch])
        return f"❌ Merge failed (aborted):\n```\n{out}\n```"

    ok, out = _run_git(["push", remote, "main"])
    _run_git(["checkout", branch])

    if not ok:
        return f"❌ Push main failed:\n```\n{out}\n```"
    return f"✅ Merged `{branch}` → `main` and pushed."


def get_log_summary(count: int = 10) -> str:
    """Return recent git log."""
    ok, out = _run_git(["log", f"--oneline", f"-{count}"])
    if not ok:
        return "❌ Could not read git log."
    return f"📜 **Recent {count} commits:**\n```\n{out}\n```"
