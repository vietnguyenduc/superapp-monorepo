"""Devin API integration: create sessions, check status, auto-fix from errors."""
import os
import json
import logging
import time
import requests

logger = logging.getLogger("AdminBot.devin")

DEVIN_API_BASE = "https://api.devin.ai/v1"


def _get_api_key() -> str:
    return os.environ.get("DEVIN_API_KEY", "")


def _headers() -> dict:
    key = _get_api_key()
    return {
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
    }


def trigger_devin_session(prompt: str, context: str = "") -> str:
    """Create a new Devin session with the given prompt and context."""
    key = _get_api_key()
    if not key:
        return "❌ DEVIN_API_KEY not configured."

    full_prompt = prompt
    if context:
        full_prompt = f"Context: {context}\n\n{prompt}"

    try:
        resp = requests.post(
            f"{DEVIN_API_BASE}/sessions",
            headers=_headers(),
            json={"prompt": full_prompt},
            timeout=30,
        )
        if resp.status_code in (200, 201):
            data = resp.json()
            session_id = data.get("session_id", "unknown")
            url = data.get("url", f"https://app.devin.ai/sessions/{session_id}")
            return f"✅ Devin session created: `{session_id}`\n🔗 {url}"
        return f"❌ Devin API error ({resp.status_code}): {resp.text[:500]}"
    except Exception as e:
        return f"❌ Failed to create Devin session: {e}"


def check_devin_status(session_id: str) -> str:
    """Poll the status of a Devin session."""
    key = _get_api_key()
    if not key:
        return "❌ DEVIN_API_KEY not configured."

    try:
        resp = requests.get(
            f"{DEVIN_API_BASE}/session/{session_id}",
            headers=_headers(),
            timeout=15,
        )
        if resp.status_code == 200:
            data = resp.json()
            status = data.get("status_enum", "unknown")
            title = data.get("title", "")
            return f"📊 Session `{session_id}`:\n• Status: **{status}**\n• Title: {title}"
        return f"❌ API error ({resp.status_code}): {resp.text[:300]}"
    except Exception as e:
        return f"❌ Failed to check status: {e}"


def auto_fix_from_error(error_log: str, bot_name: str = "") -> str:
    """Parse error log, create a Devin session to fix it."""
    # Extract the most relevant error lines
    lines = error_log.strip().split("\n")
    relevant = [l for l in lines if any(kw in l.upper() for kw in ["ERROR", "TRACEBACK", "EXCEPTION"])]
    error_summary = "\n".join(relevant[-10:]) if relevant else error_log[-500:]

    prompt = (
        f"Fix the following error in the superapp-monorepo (bot: {bot_name or 'unknown'}).\n"
        f"Repository: vietnguyenduc/superapp-monorepo (branch: viet)\n\n"
        f"Error log:\n```\n{error_summary}\n```\n\n"
        f"Analyze the error, find the root cause, and create a fix. Push to branch viet."
    )
    return trigger_devin_session(prompt, context=f"Auto-fix triggered for {bot_name}")


def send_devin_message(session_id: str, message: str) -> str:
    """Send a follow-up message to an existing Devin session."""
    key = _get_api_key()
    if not key:
        return "❌ DEVIN_API_KEY not configured."

    try:
        resp = requests.post(
            f"{DEVIN_API_BASE}/session/{session_id}/message",
            headers=_headers(),
            json={"message": message},
            timeout=15,
        )
        if resp.status_code in (200, 201):
            return f"✅ Message sent to session `{session_id}`."
        return f"❌ API error ({resp.status_code}): {resp.text[:300]}"
    except Exception as e:
        return f"❌ Failed to send message: {e}"
