"""
session_manager.py
==================
Hierarchical Context Compression (HCC) — Phase 1 & 2 implementation.

Solves the context budget overflow problem by:
  1. Proactively monitoring context budget (not reactive)
  2. Compressing old conversation history before it overflows
  3. Creating "session handoff" summaries for seamless continuation
  4. Emergency escape hatch when already at >95% budget

Thresholds:
  60% → WARN: inject budget advice, prefer token-efficient tools
  80% → COMPRESS: AI summarizes old turns → replace with compact summary
  95% → EMERGENCY: only handoff summary injected, no raw history
"""

import json
import logging
import time
from pathlib import Path
from datetime import datetime
from typing import List, Dict, Optional, Tuple

logger = logging.getLogger("ATA.session_manager")

# ─── Token budget constants ───────────────────────────────────────────────────
CONTEXT_LIMIT_TOKENS = 128_000       # DeepSeek V3/R1 context window is 128k, Gemini is 1M+
CHARS_PER_TOKEN = 4                 # Rough estimate

THRESHOLD_WARN      = 0.60          # Start advising token-efficient tools
THRESHOLD_COMPRESS  = 0.80          # Auto-compress old history turns
THRESHOLD_EMERGENCY = 0.95          # Emergency: only use handoff summary

# How many recent turns to ALWAYS keep verbatim (never compress)
KEEP_RECENT_TURNS = 4

# Max chars stored per session summary (cold archive)
MAX_SUMMARY_CHARS = 6000

# ─── Session metadata file ────────────────────────────────────────────────────
# Stored alongside history.json per project


def _session_meta_path(history_file: Path) -> Path:
    """Returns path to session_meta.json next to history.json."""
    return history_file.parent / "session_meta.json"


class SessionMeta:
    """
    Persisted metadata about the current conversation session.
    Tracks compression events, handoff summaries, and budget history.
    """

    def __init__(self, history_file: Path):
        self.path = _session_meta_path(history_file)
        self._data = self._load()

    def _load(self) -> dict:
        if self.path.exists():
            try:
                return json.loads(self.path.read_text(encoding="utf-8"))
            except Exception as e:
                logger.warning(f"[SessionMeta] Load failed: {e}")
        return self._empty()

    def _empty(self) -> dict:
        return {
            "session_id": datetime.now().strftime("%Y%m%d_%H%M%S"),
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat(),
            "compression_count": 0,
            "last_compression_at": None,
            "handoff_summary": "",          # Latest compressed summary
            "handoff_summary_turns": 0,     # How many turns are represented in it
            "peak_budget_pct": 0,
            "compression_log": [],          # History of compression events
        }

    def save(self):
        try:
            self._data["updated_at"] = datetime.now().isoformat()
            self.path.write_text(
                json.dumps(self._data, ensure_ascii=False, indent=2),
                encoding="utf-8"
            )
        except Exception as e:
            logger.error(f"[SessionMeta] Save failed: {e}")

    @property
    def handoff_summary(self) -> str:
        return self._data.get("handoff_summary", "")

    @handoff_summary.setter
    def handoff_summary(self, value: str):
        self._data["handoff_summary"] = value[:MAX_SUMMARY_CHARS]

    @property
    def handoff_summary_turns(self) -> int:
        return self._data.get("handoff_summary_turns", 0)

    @handoff_summary_turns.setter
    def handoff_summary_turns(self, value: int):
        self._data["handoff_summary_turns"] = value

    def record_compression(self, turns_compressed: int, summary_chars: int):
        self._data["compression_count"] = self._data.get("compression_count", 0) + 1
        self._data["last_compression_at"] = datetime.now().isoformat()
        event = {
            "at": datetime.now().isoformat(),
            "turns_compressed": turns_compressed,
            "summary_chars": summary_chars,
        }
        log = self._data.get("compression_log", [])
        log.append(event)
        self._data["compression_log"] = log[-10:]  # keep last 10 events
        self.save()

    def update_peak(self, pct: int):
        current_peak = self._data.get("peak_budget_pct", 0)
        if pct > current_peak:
            self._data["peak_budget_pct"] = pct

    def get_status_text(self) -> str:
        """Human-readable status for /session command."""
        d = self._data
        lines = [
            f"📊 *Session Stats*",
            f"  🆔 ID: `{d.get('session_id', 'unknown')}`",
            f"  📅 Bắt đầu: {d.get('created_at', '?')[:16]}",
            f"  🗜️ Đã nén: {d.get('compression_count', 0)} lần",
            f"  📈 Peak budget: {d.get('peak_budget_pct', 0)}%",
        ]
        if d.get("handoff_summary"):
            turns = d.get("handoff_summary_turns", 0)
            chars = len(d["handoff_summary"])
            lines.append(f"  💾 Summary hiện tại: {turns} turns → {chars} chars")
        if d.get("last_compression_at"):
            lines.append(f"  ⏰ Nén lần cuối: {d['last_compression_at'][:16]}")
        return "\n".join(lines)


# ─── Budget estimation ────────────────────────────────────────────────────────

def estimate_budget(
    system_instruction: str,
    vault_context: str,
    memories_context: str,
    continuation_context: str,
    workspace_cwd_note: str,
    history: List[Dict],
    user_message: str,
    handoff_summary: str = "",
) -> Tuple[int, int, int]:
    """
    Returns (tokens_used_est, tokens_remaining, pct_used).
    pct_used is an integer 0–200+ (can exceed 100 if overflow).
    """
    chars = (
        len(system_instruction)
        + len(vault_context)
        + len(memories_context)
        + len(continuation_context)
        + len(workspace_cwd_note)
        + len(handoff_summary)
        + sum(len(str(t.get("content", ""))) for t in history)
        + len(user_message)
        # Reserve headroom for tool schemas (~2000 tokens)
        + 8_000
    )
    tokens_used = chars // CHARS_PER_TOKEN
    tokens_remaining = max(0, CONTEXT_LIMIT_TOKENS - tokens_used)
    pct_used = int(tokens_used / CONTEXT_LIMIT_TOKENS * 100)
    return tokens_used, tokens_remaining, pct_used


# ─── Compression engine ───────────────────────────────────────────────────────

COMPRESSION_PROMPT = """You are a session summarizer for an AI coding assistant called Antigravity.

Your job: Compress the given conversation turns into a compact, dense summary that preserves ALL important information the AI needs to continue working effectively.

The summary MUST include:
1. **Goals & Tasks**: What the user asked for, what's been accomplished, what's pending
2. **Key Decisions**: Architecture choices, file paths chosen, approaches selected
3. **Code Changes Made**: Which files were modified and what was changed (list briefly)
4. **Errors Encountered**: Any bugs or failures found and how they were resolved
5. **Current State**: What is the system's state RIGHT NOW (e.g., "server running on port 3001", "migration pending")
6. **Next Steps**: What still needs to be done, in order

Format as a dense markdown document. Be extremely concise — every word must carry value.
Do NOT include pleasantries, repetition, or filler text.
Output in Vietnamese for user-facing sections, English for technical details.

IMPORTANT: This summary will be injected as context for the NEXT conversation session. The AI reading it must be able to continue work seamlessly without any other context.

---

CONVERSATION TURNS TO COMPRESS:
{turns_text}
"""


def compress_history(
    history: List[Dict],
    turns_to_compress: int,
    existing_summary: str = "",
    project_id: str = "default",
) -> Optional[str]:
    """
    Uses AI to summarize `turns_to_compress` oldest turns from history.
    Returns compressed summary string, or None if compression failed.
    """
    if not history or turns_to_compress <= 0:
        return None

    turns = history[:turns_to_compress]

    # Build text representation of turns
    turns_text_parts = []
    if existing_summary:
        turns_text_parts.append(
            f"=== EXISTING SUMMARY (from previous compressions) ===\n{existing_summary}\n\n"
            f"=== NEW TURNS TO ADD TO SUMMARY ==="
        )

    for i, turn in enumerate(turns, 1):
        role = "👤 USER" if turn.get("role") in ["user"] else "🤖 ASSISTANT"
        content = str(turn.get("content", ""))[:2000]  # cap per turn
        if len(str(turn.get("content", ""))) > 2000:
            content += f"\n...(+{len(str(turn.get('content', ''))) - 2000} chars truncated)"
        turns_text_parts.append(f"\n--- Turn {i} ({role}) ---\n{content}")

    turns_text = "\n".join(turns_text_parts)

    prompt = COMPRESSION_PROMPT.format(turns_text=turns_text)

    # Try to compress using available AI provider (lightweight, no tools needed)
    try:
        from core.ai_router import smart_generate
        summary, _ = smart_generate(
            prompt=prompt,
            system=(
                "You are a concise technical summarizer. "
                "Output only the summary document, no preamble or meta-commentary."
            ),
            task_type="medium",
        )
        return summary.strip()
    except Exception as e:
        logger.error(f"[SessionManager] Compression AI call failed: {e}")
        # Fallback: simple text truncation summary
        return _fallback_compress(turns, existing_summary)


def _fallback_compress(turns: List[Dict], existing_summary: str) -> str:
    """Simple non-AI fallback compression when AI call fails."""
    lines = []
    if existing_summary:
        lines.append(f"## Previous Summary\n{existing_summary[:1000]}\n")
    lines.append("## Compressed Turns (Fallback — AI unavailable)")
    for i, turn in enumerate(turns, 1):
        role = "USER" if turn.get("role") == "user" else "ASSISTANT"
        content = str(turn.get("content", ""))[:300]
        lines.append(f"- Turn {i} [{role}]: {content}")
    return "\n".join(lines)


# ─── Main SessionManager ──────────────────────────────────────────────────────

class SessionManager:
    """
    Central orchestrator for context session management.
    Called once per conversation turn in agent.run_agent_turn().
    """

    def __init__(self, history_file: Path, project_id: str = "default"):
        self.history_file = history_file
        self.project_id = project_id
        self.meta = SessionMeta(history_file)

    def get_effective_history(
        self,
        raw_history: List[Dict],
        system_instruction: str,
        vault_context: str,
        memories_context: str,
        workspace_cwd_note: str,
        user_message: str,
        continuation_context: str = "",
    ) -> Tuple[List[Dict], str, str, int]:
        """
        Analyzes budget and returns the optimal history + metadata.

        Returns:
            (effective_history, budget_advice, mode, pct_used)
            mode: "normal" | "warn" | "compress" | "emergency"
        """
        # First estimate with full raw history
        _, _, pct_used = estimate_budget(
            system_instruction=system_instruction,
            vault_context=vault_context,
            memories_context=memories_context,
            continuation_context=continuation_context,
            workspace_cwd_note=workspace_cwd_note,
            history=raw_history,
            user_message=user_message,
            handoff_summary=self.meta.handoff_summary,
        )

        self.meta.update_peak(pct_used)

        # ── EMERGENCY: >95% — use only handoff summary, no raw history ────────
        if pct_used >= int(THRESHOLD_EMERGENCY * 100):
            logger.warning(f"[SessionManager] EMERGENCY mode: {pct_used}% budget used")
            budget_advice = (
                "🚨 EMERGENCY: Context budget critically full. "
                "Using compressed session summary only. "
                "Use ONLY grep_code and get_file_outline — do NOT use read_file."
            )
            # Trigger compression in background for future turns
            self._trigger_async_compress(raw_history)
            return [], budget_advice, "emergency", pct_used

        # ── COMPRESS: 80–95% — compress old turns ────────────────────────────
        if pct_used >= int(THRESHOLD_COMPRESS * 100):
            logger.info(f"[SessionManager] COMPRESS mode: {pct_used}% budget used. Compressing history...")
            effective_history = self._compress_and_reduce(raw_history)
            # Re-estimate with reduced history
            _, _, new_pct = estimate_budget(
                system_instruction=system_instruction,
                vault_context=vault_context,
                memories_context=memories_context,
                continuation_context=continuation_context,
                workspace_cwd_note=workspace_cwd_note,
                history=effective_history,
                user_message=user_message,
                handoff_summary=self.meta.handoff_summary,
            )
            budget_advice = (
                f"⚠️ Context đã được nén tự động ({pct_used}% → {new_pct}%). "
                "PREFER grep_code và get_file_outline over read_file."
            )
            return effective_history, budget_advice, "compress", pct_used

        # ── WARN: 60–80% — still full raw history, but advise ────────────────
        if pct_used >= int(THRESHOLD_WARN * 100):
            budget_advice = (
                f"⚠️ Context budget đang cao ({pct_used}%). "
                "Ưu tiên grep_code và get_file_outline để tiết kiệm context."
            )
            return raw_history, budget_advice, "warn", pct_used

        # ── NORMAL: <60% ─────────────────────────────────────────────────────
        budget_advice = f"✅ Context healthy ({pct_used}%)."
        return raw_history, budget_advice, "normal", pct_used

    def _compress_and_reduce(self, history: List[Dict]) -> List[Dict]:
        """
        Compress old turns into handoff_summary, keep recent turns verbatim.
        Modifies self.meta in-place, saves to disk.
        Returns reduced history (only recent KEEP_RECENT_TURNS turns).
        """
        if len(history) <= KEEP_RECENT_TURNS:
            # Too few turns to compress
            return history

        turns_to_compress = len(history) - KEEP_RECENT_TURNS
        recent_turns = history[-KEEP_RECENT_TURNS:]

        logger.info(f"[SessionManager] Compressing {turns_to_compress} turns (keeping {KEEP_RECENT_TURNS} recent)")

        summary = compress_history(
            history=history,
            turns_to_compress=turns_to_compress,
            existing_summary=self.meta.handoff_summary,
            project_id=self.project_id,
        )

        if summary:
            # Update meta with new summary
            old_turns = self.meta.handoff_summary_turns
            self.meta.handoff_summary = summary
            self.meta.handoff_summary_turns = old_turns + turns_to_compress
            self.meta.record_compression(turns_to_compress, len(summary))
            logger.info(
                f"[SessionManager] Compressed {turns_to_compress} turns → {len(summary)} chars summary. "
                f"Total turns in summary: {self.meta.handoff_summary_turns}"
            )
        else:
            logger.warning("[SessionManager] Compression returned None — using recent turns only")

        return recent_turns

    def _trigger_async_compress(self, history: List[Dict]):
        """Trigger compression in a background thread for emergency recovery."""
        import threading

        def _compress():
            try:
                self._compress_and_reduce(history)
                logger.info("[SessionManager] Background emergency compression complete")
            except Exception as e:
                logger.error(f"[SessionManager] Background compression failed: {e}")

        t = threading.Thread(target=_compress, daemon=True)
        t.start()

    def build_handoff_context(self) -> str:
        """
        Returns the handoff summary formatted for injection into the system prompt.
        Used in COMPRESS and EMERGENCY modes.
        """
        if not self.meta.handoff_summary:
            return ""

        return (
            "\n"
            "=" * 60 + "\n"
            "📋 SESSION HANDOFF SUMMARY\n"
            f"(Represents {self.meta.handoff_summary_turns} compressed conversation turns)\n"
            "=" * 60 + "\n"
            + self.meta.handoff_summary
            + "\n" + "=" * 60 + "\n"
        )

    def manual_compress(self, history: List[Dict]) -> str:
        """
        Manually triggered compression (via /compress command).
        Returns a user-facing summary of what was compressed.
        """
        if not history:
            return "⚠️ Không có history để nén."

        count_before = len(history)
        self._compress_and_reduce(history)

        return (
            f"✅ *Đã nén session context thành công!*\n\n"
            f"  • Số turns đã compress: {count_before - KEEP_RECENT_TURNS}\n"
            f"  • Số turns giữ lại: {min(KEEP_RECENT_TURNS, count_before)}\n"
            f"  • Tổng turns trong summary: {self.meta.handoff_summary_turns}\n"
            f"  • Summary size: {len(self.meta.handoff_summary)} chars\n\n"
            f"Context đã được giải phóng và sẵn sàng cho phiên tiếp theo. 🎉"
        )

    def get_status_text(self, current_pct: int) -> str:
        """Returns full status string for /session command."""
        mode_map = {
            (0, 60): ("🟢 NORMAL", "Context budget khỏe mạnh"),
            (60, 80): ("🟡 WARN", "Context đang cao, ưu tiên tool hiệu quả"),
            (80, 95): ("🟠 COMPRESS", "Đang/cần nén context"),
            (95, 999): ("🔴 EMERGENCY", "Context nguy hiểm, chỉ dùng summary"),
        }
        mode_label, mode_desc = "❓ UNKNOWN", ""
        for (lo, hi), (label, desc) in mode_map.items():
            if lo <= current_pct < hi:
                mode_label, mode_desc = label, desc
                break

        bar_filled = min(current_pct, 100) // 10
        bar = "█" * bar_filled + "░" * (10 - bar_filled)
        overflow = f" (+{current_pct - 100}% OVERFLOW)" if current_pct > 100 else ""

        lines = [
            f"🧠 *Context Session Status*",
            f"  [{bar}] {current_pct}%{overflow}",
            f"  Mode: {mode_label} — {mode_desc}",
            "",
            self.meta.get_status_text(),
        ]
        return "\n".join(lines)


# ─── Module-level factory ─────────────────────────────────────────────────────
_managers: Dict[str, SessionManager] = {}


def get_session_manager(history_file: Path, project_id: str = "default") -> SessionManager:
    """Get or create a SessionManager for the given project."""
    key = str(history_file)
    if key not in _managers:
        _managers[key] = SessionManager(history_file, project_id)
    return _managers[key]


def invalidate_session_manager(history_file: Path):
    """Force re-create a SessionManager (e.g. after manual /compress)."""
    key = str(history_file)
    if key in _managers:
        del _managers[key]
