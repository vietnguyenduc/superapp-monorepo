"""
budget_tracker.py
=================
Tracks AI token usage and cost per provider in a local SQLite DB.
Sends Telegram alerts when daily budget threshold is exceeded.
"""

import os
import sqlite3
import logging
import json
from pathlib import Path
from datetime import date, datetime

logger = logging.getLogger("ATA.budget_tracker")

DB_PATH = Path(__file__).parent.parent / "data" / "budget.db"

# Pricing per 1M tokens (USD)
PROVIDER_PRICING = {
    "ollama":   {"input": 0.0,    "output": 0.0},
    "deepseek": {"input": 0.14,   "output": 0.28},
    "gemini":   {"input": 0.0,    "output": 0.0},   # Pro plan — treat as $0
    "geminipro": {"input": 0.0,   "output": 0.0},   # Covered under user subscription
    "claude":   {"input": 3.00,   "output": 15.00}, # Claude 3.5 Sonnet
}

class BudgetTracker:
    def __init__(self):
        DB_PATH.parent.mkdir(parents=True, exist_ok=True)
        self._init_db()
        self.daily_limit = float(os.environ.get("DAILY_BUDGET_USD", "0.50"))

    def _get_conn(self):
        return sqlite3.connect(str(DB_PATH))

    def _init_db(self):
        with self._get_conn() as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS usage (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    ts TEXT NOT NULL,
                    date TEXT NOT NULL,
                    provider TEXT NOT NULL,
                    task_type TEXT,
                    input_tokens INTEGER DEFAULT 0,
                    output_tokens INTEGER DEFAULT 0,
                    cost_usd REAL DEFAULT 0.0
                )
            """)
            conn.commit()

    def record(self, provider: str, input_tokens: int, output_tokens: int, task_type: str = "medium"):
        """Record token usage and compute cost."""
        pricing = PROVIDER_PRICING.get(provider, {"input": 0.0, "output": 0.0})
        cost = (input_tokens / 1_000_000 * pricing["input"]) + \
               (output_tokens / 1_000_000 * pricing["output"])

        today = date.today().isoformat()
        ts = datetime.utcnow().isoformat()

        with self._get_conn() as conn:
            conn.execute(
                "INSERT INTO usage (ts, date, provider, task_type, input_tokens, output_tokens, cost_usd) VALUES (?,?,?,?,?,?,?)",
                (ts, today, provider, task_type, input_tokens, output_tokens, cost)
            )
            conn.commit()

        logger.debug(f"[Budget] {provider}: +{input_tokens}in/{output_tokens}out tokens, ${cost:.5f}")
        return cost

    def get_today_summary(self) -> dict:
        today = date.today().isoformat()
        with self._get_conn() as conn:
            rows = conn.execute(
                "SELECT provider, SUM(input_tokens), SUM(output_tokens), SUM(cost_usd) "
                "FROM usage WHERE date=? GROUP BY provider",
                (today,)
            ).fetchall()
            totals = conn.execute(
                "SELECT SUM(input_tokens), SUM(output_tokens), SUM(cost_usd) FROM usage WHERE date=?",
                (today,)
            ).fetchone()

        providers = {}
        for row in rows:
            providers[row[0]] = {
                "input_tokens": row[1] or 0,
                "output_tokens": row[2] or 0,
                "cost_usd": round(row[3] or 0, 5),
            }

        return {
            "date": today,
            "providers": providers,
            "total_input_tokens": totals[0] or 0,
            "total_output_tokens": totals[1] or 0,
            "total_cost_usd": round(totals[2] or 0, 5),
            "daily_limit_usd": self.daily_limit,
            "budget_pct": round((totals[2] or 0) / self.daily_limit * 100, 1) if self.daily_limit > 0 else 0,
        }

    def is_over_budget(self) -> bool:
        if self.daily_limit <= 0:
            return False
        summary = self.get_today_summary()
        return summary["total_cost_usd"] >= self.daily_limit

    def format_status_message(self) -> str:
        s = self.get_today_summary()
        lines = [f"💰 *Budget Today* ({s['date']})"]

        provider_icons = {"ollama": "🏠", "deepseek": "🌐", "gemini": "☁️"}
        for pname, pdata in s["providers"].items():
            icon = provider_icons.get(pname, "🤖")
            cost_str = f"${pdata['cost_usd']:.4f}" if pdata['cost_usd'] > 0 else "FREE"
            lines.append(
                f"  {icon} {pname}: {pdata['input_tokens']:,}in / {pdata['output_tokens']:,}out → {cost_str}"
            )

        total_cost = s["total_cost_usd"]
        limit = s["daily_limit_usd"]
        pct = s["budget_pct"]
        bar = "█" * int(pct / 10) + "░" * (10 - int(pct / 10))
        lines.append(f"\n[{bar}] {pct}% of ${limit:.2f}/day limit")
        lines.append(f"Total: ${total_cost:.4f} today")

        return "\n".join(lines)

    def get_week_cost(self) -> float:
        with self._get_conn() as conn:
            row = conn.execute(
                "SELECT SUM(cost_usd) FROM usage WHERE date >= date('now', '-7 days')"
            ).fetchone()
        return round(row[0] or 0, 4)


# Module-level singleton
_tracker = None

def get_tracker() -> BudgetTracker:
    global _tracker
    if _tracker is None:
        _tracker = BudgetTracker()
    return _tracker
