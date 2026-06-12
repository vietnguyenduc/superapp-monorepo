"""
task_state.py
=============
Persistent Task State Manager for the Antigravity Telegram Agent.

Problem solved:
  When the AI hits the 10-step limit mid-task, the conversation history only stores
  the final message exchange — NOT the intermediate tool call results. When the user
  sends "ok/tiếp tục" to continue, the bot starts from scratch and repeats itself.

Solution:
  Save a "task journal" to disk per active project. This journal records:
    - The original task description
    - Every tool call executed and its result (truncated for token efficiency)
    - Outstanding next steps the AI identified
    - Whether the task is complete or still in progress

  On continuation, this journal is injected into the system prompt, giving the AI
  full awareness of everything done so far without repeating previous steps.
"""

import json
import logging
from pathlib import Path
from datetime import datetime
from typing import Optional, List, Dict, Any

logger = logging.getLogger("ATA.task_state")

# Max chars to store per tool result to avoid bloated state files
MAX_RESULT_CHARS = 2000
MAX_JOURNAL_ENTRIES = 50


class TaskState:
    """Manages persisted task journal for a single project."""

    def __init__(self, project_dir: Path):
        self.state_file = project_dir / "task_journal.json"
        self._state = self._load()

    def _load(self) -> dict:
        if self.state_file.exists():
            try:
                return json.loads(self.state_file.read_text(encoding="utf-8"))
            except Exception as e:
                logger.warning(f"[TaskState] Could not load state: {e}")
        return self._empty_state()

    def _empty_state(self) -> dict:
        return {
            "active": False,
            "task_description": "",
            "started_at": None,
            "updated_at": None,
            "completed": False,
            "steps": [],           # List of executed steps with results
            "pending_steps": [],   # Steps AI said it still needs to do
            "summary": "",         # Latest summary of progress
        }

    def _save(self):
        try:
            self.state_file.write_text(
                json.dumps(self._state, ensure_ascii=False, indent=2),
                encoding="utf-8"
            )
        except Exception as e:
            logger.error(f"[TaskState] Could not save state: {e}")

    def start_task(self, task_description: str):
        """Start tracking a new task, replacing any previous incomplete state."""
        self._state = self._empty_state()
        self._state["active"] = True
        self._state["task_description"] = task_description
        self._state["started_at"] = datetime.now().isoformat()
        self._state["updated_at"] = datetime.now().isoformat()
        self._save()
        logger.info(f"[TaskState] Started tracking task: {task_description[:80]}...")

    def add_step(self, tool_name: str, args: dict, result: str):
        """Record a completed tool call step."""
        if not self._state["active"]:
            return

        # Truncate long results to keep state file lean
        result_truncated = result[:MAX_RESULT_CHARS]
        if len(result) > MAX_RESULT_CHARS:
            result_truncated += f"\n...(truncated {len(result) - MAX_RESULT_CHARS} chars)"

        step = {
            "step": len(self._state["steps"]) + 1,
            "tool": tool_name,
            "args_summary": str(list(args.keys())),
            "result_preview": result_truncated,
            "timestamp": datetime.now().isoformat(),
        }
        self._state["steps"].append(step)

        # Keep journal from growing unbounded
        if len(self._state["steps"]) > MAX_JOURNAL_ENTRIES:
            self._state["steps"] = self._state["steps"][-MAX_JOURNAL_ENTRIES:]

        self._state["updated_at"] = datetime.now().isoformat()
        self._save()

    def update_progress(self, summary: str, pending_steps: List[str] = None):
        """Update the AI's latest summary and any pending next steps."""
        if not self._state["active"]:
            return
        self._state["summary"] = summary[:3000]
        if pending_steps is not None:
            self._state["pending_steps"] = pending_steps
        self._state["updated_at"] = datetime.now().isoformat()
        self._save()

    def complete_task(self):
        """Mark the current task as fully completed and clear active state."""
        self._state["active"] = False
        self._state["completed"] = True
        self._state["updated_at"] = datetime.now().isoformat()
        self._save()
        logger.info("[TaskState] Task marked as completed.")

    def clear(self):
        """Reset all state — call when user starts a fresh unrelated task."""
        self._state = self._empty_state()
        self._save()
        logger.info("[TaskState] Task state cleared.")

    def is_active(self) -> bool:
        return self._state.get("active", False)

    def get_context_for_continuation(self) -> str:
        """
        Returns a formatted string summarizing what was done so far,
        to be injected into the prompt when user sends a continuation trigger.
        """
        if not self._state.get("active") or not self._state.get("steps"):
            return ""

        lines = [
            "=" * 60,
            "⚠️  TASK RESUMPTION CONTEXT — READ CAREFULLY BEFORE ACTING",
            "=" * 60,
            f"📋 Original Task: {self._state['task_description'][:500]}",
            f"⏰ Started: {self._state.get('started_at', 'unknown')}",
            f"🔄 Last Updated: {self._state.get('updated_at', 'unknown')}",
            "",
            f"✅ Steps Already Completed ({len(self._state['steps'])} steps):",
        ]

        for step in self._state["steps"]:
            lines.append(
                f"  Step {step['step']}: [{step['tool']}]({step['args_summary']})"
                f" → {step['result_preview'][:300].strip()}"
            )

        if self._state.get("summary"):
            lines.append("")
            lines.append("📊 Progress Summary So Far:")
            lines.append(self._state["summary"])

        if self._state.get("pending_steps"):
            lines.append("")
            lines.append("❌ Pending Steps Still To Do:")
            for i, step in enumerate(self._state["pending_steps"], 1):
                lines.append(f"  {i}. {step}")

        lines.extend([
            "",
            "🚨 CRITICAL INSTRUCTIONS FOR CONTINUATION:",
            "  1. DO NOT repeat any step already listed above — they are DONE.",
            "  2. Continue directly from the FIRST pending step listed.",
            "  3. If no pending steps listed, ask the user what to do next.",
            "  4. Do NOT re-read files or re-run commands already executed above.",
            "=" * 60,
        ])

        return "\n".join(lines)

    def get_state_summary(self) -> str:
        """Returns a human-readable one-line status."""
        if not self._state.get("active"):
            return "No active task"
        steps = len(self._state.get("steps", []))
        pending = len(self._state.get("pending_steps", []))
        task = self._state.get("task_description", "")[:60]
        return f"Task in progress: '{task}...' | {steps} steps done | {pending} pending"


# ──────────────────────────────────────────────────────────────
# Global registry: one TaskState per project_id
# ──────────────────────────────────────────────────────────────
_task_states: Dict[str, TaskState] = {}


def get_task_state(project_id: str, project_dir: Path) -> TaskState:
    """Get or create the TaskState for a project."""
    if project_id not in _task_states:
        _task_states[project_id] = TaskState(project_dir)
    return _task_states[project_id]


def extract_pending_steps_from_reply(reply_text: str) -> List[str]:
    """
    Heuristically parse the AI's final reply to extract any "next steps" or
    "chưa hoàn thành" items it listed. Used to seed the pending_steps list.
    """
    pending = []
    lines = reply_text.split("\n")
    in_pending_section = False

    for line in lines:
        line_stripped = line.strip()
        # Detect common section headers
        if any(keyword in line_stripped.lower() for keyword in [
            "chưa hoàn thành", "pending", "next step", "bước tiếp", "still need",
            "❌ chưa", "todo", "cần làm", "cần tiếp", "bước tiếp theo"
        ]):
            in_pending_section = True
            continue

        if in_pending_section:
            # Stop if we hit a new section
            if line_stripped.startswith("##") or line_stripped.startswith("==="):
                in_pending_section = False
                continue
            # Collect numbered/bulleted items
            if line_stripped and (
                line_stripped[0].isdigit() or
                line_stripped.startswith("-") or
                line_stripped.startswith("•") or
                line_stripped.startswith("|")
            ):
                # Clean up common list markers
                clean = line_stripped.lstrip("0123456789.-•|# ").strip()
                if clean and len(clean) > 5:
                    pending.append(clean)

    return pending[:10]  # Cap at 10 pending items
