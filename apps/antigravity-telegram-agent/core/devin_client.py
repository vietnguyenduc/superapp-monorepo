"""
devin_client.py — Thin wrapper around the Devin API.

Lets the Telegram agent delegate complex / long-running tasks to a cloud Devin
session and stream the result back to the chat. All network access is guarded so
a missing API key or transient error never crashes the bot.

Env vars:
    DEVIN_API_KEY       — required to talk to the API.
    DEVIN_API_BASE_URL  — optional override for the API base URL.
"""

import os
import time
import logging

import requests

logger = logging.getLogger("ATA.devin_client")

DEVIN_API_KEY = os.getenv("DEVIN_API_KEY", "")
BASE_URL = os.getenv("DEVIN_API_BASE_URL", "https://api.cognition.ai/v1")

# Terminal session states reported by the API.
_TERMINAL_STATES = {"blocked", "stopped", "finished", "expired", "completed", "suspended"}

_TIMEOUT = 30  # seconds per HTTP request


class DevinError(RuntimeError):
    """Raised when the Devin API cannot be reached or returns an error."""


def _headers() -> dict:
    if not DEVIN_API_KEY:
        raise DevinError(
            "DEVIN_API_KEY chưa được cấu hình. Thêm DEVIN_API_KEY vào .env để dùng tính năng Devin."
        )
    return {
        "Authorization": f"Bearer {DEVIN_API_KEY}",
        "Content-Type": "application/json",
    }


def _request(method: str, path: str, **kwargs) -> dict:
    url = f"{BASE_URL.rstrip('/')}/{path.lstrip('/')}"
    try:
        resp = requests.request(method, url, headers=_headers(), timeout=_TIMEOUT, **kwargs)
        resp.raise_for_status()
    except requests.RequestException as e:
        logger.error(f"[Devin] {method} {url} failed: {e}")
        raise DevinError(f"Devin API request failed: {e}") from e
    if not resp.content:
        return {}
    try:
        return resp.json()
    except ValueError:
        return {"raw": resp.text}


def create_session(prompt: str, repo_url: str = None) -> dict:
    """Tạo Devin session, trả về {session_id, url, status}."""
    payload = {"prompt": prompt}
    if repo_url:
        payload["repo_url"] = repo_url
    data = _request("POST", "/sessions", json=payload)
    return {
        "session_id": data.get("session_id", ""),
        "url": data.get("url", ""),
        "status": data.get("status_enum") or data.get("status", "running"),
    }


def send_message(session_id: str, message: str) -> dict:
    """Gửi message vào session đang chạy."""
    return _request("POST", f"/session/{session_id}/message", json={"message": message})


def get_session_status(session_id: str) -> dict:
    """Poll session status: {status, output, structured_output}."""
    data = _request("GET", f"/session/{session_id}")
    return {
        "status": data.get("status_enum") or data.get("status", "unknown"),
        "output": data.get("output", ""),
        "structured_output": data.get("structured_output", {}),
    }


def wait_for_completion(session_id: str, timeout: int = 3600, poll_interval: int = 30) -> str:
    """Block và poll cho đến khi session xong, trả về output text."""
    deadline = time.time() + timeout
    last_status = "unknown"
    while time.time() < deadline:
        info = get_session_status(session_id)
        last_status = str(info.get("status", "unknown")).lower()
        if last_status in _TERMINAL_STATES:
            output = info.get("output") or ""
            structured = info.get("structured_output") or {}
            if not output and structured:
                output = str(structured)
            return output or f"Session {session_id} kết thúc với trạng thái: {last_status}"
        time.sleep(poll_interval)
    return f"⏰ Hết thời gian chờ ({timeout}s). Trạng thái cuối: {last_status}. Xem: {BASE_URL}"


def list_sessions(limit: int = 10) -> list:
    """Liệt kê các sessions gần đây."""
    data = _request("GET", "/sessions", params={"limit": limit})
    if isinstance(data, list):
        return data
    return data.get("sessions", [])
