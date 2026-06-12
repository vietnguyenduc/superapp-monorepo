"""
telegram_utils.py
=================
Utilities for safe, resilient Telegram message sending.
Handles message splitting, file attachments for large data, and pagination.
"""

import io
import json
import logging
from typing import Union

logger = logging.getLogger("ATA.telegram_utils")

TELEGRAM_MAX_LEN = 4000  # Telegram hard limit is 4096, leave buffer for formatting


def safe_split(text: str, max_len: int = TELEGRAM_MAX_LEN) -> list[str]:
    """
    Split long text into Telegram-safe chunks.
    Tries to split on newlines first to avoid cutting mid-sentence.
    """
    if len(text) <= max_len:
        return [text]

    chunks = []
    while text:
        if len(text) <= max_len:
            chunks.append(text)
            break

        # Try to split on a newline within the limit
        split_at = text.rfind("\n", 0, max_len)
        if split_at == -1 or split_at < max_len // 2:
            split_at = max_len

        chunks.append(text[:split_at])
        text = text[split_at:].lstrip("\n")

    return chunks


def safe_send(bot, chat_id: int, text: str, parse_mode: str = "Markdown", **kwargs):
    """
    Send a message safely, automatically splitting if over Telegram's limit.
    Falls back to plain text if Markdown parse fails.
    """
    if not text or not text.strip():
        text = "_(empty response)_"

    chunks = safe_split(text)
    sent = []

    for i, chunk in enumerate(chunks):
        prefix = f"📄 *Part {i+1}/{len(chunks)}*\n" if len(chunks) > 1 else ""
        try:
            msg = bot.send_message(
                chat_id,
                prefix + chunk,
                parse_mode=parse_mode,
                **kwargs,
            )
            sent.append(msg)
        except Exception as e:
            if "parse" in str(e).lower() or "markdown" in str(e).lower():
                # Retry without parse mode
                try:
                    msg = bot.send_message(chat_id, prefix + chunk, **kwargs)
                    sent.append(msg)
                except Exception as e2:
                    logger.error(f"safe_send failed even without parse_mode: {e2}")
            else:
                logger.error(f"safe_send failed: {e}")

    return sent


def send_as_file(bot, chat_id: int, content: Union[str, dict, list], filename: str, caption: str = None):
    """
    Send large data as a file attachment instead of a message.
    Accepts string, dict, or list (auto-converts to JSON).
    """
    if isinstance(content, (dict, list)):
        text = json.dumps(content, indent=2, ensure_ascii=False)
    else:
        text = str(content)

    file_obj = io.BytesIO(text.encode("utf-8"))
    file_obj.name = filename

    try:
        bot.send_document(
            chat_id,
            document=file_obj,
            caption=caption or f"📎 {filename}",
        )
    except Exception as e:
        logger.error(f"send_as_file failed: {e}")
        # Fallback: send first 3000 chars as message
        safe_send(bot, chat_id, f"📎 *{filename}* (truncated):\n```\n{text[:3000]}\n```")


def send_json_result(bot, chat_id: int, data: Union[dict, list], title: str = "Result", max_inline: int = 800):
    """
    Smart JSON sender: inline if small, file attachment if large.
    """
    json_str = json.dumps(data, indent=2, ensure_ascii=False)

    if len(json_str) <= max_inline:
        safe_send(bot, chat_id, f"*{title}*\n```json\n{json_str}\n```")
    else:
        # Send summary + file
        if isinstance(data, list):
            summary = f"📊 *{title}*: {len(data)} items"
        elif isinstance(data, dict):
            keys = list(data.keys())[:5]
            summary = f"📊 *{title}*: {len(data)} keys — {', '.join(keys)}{'...' if len(data) > 5 else ''}"
        else:
            summary = f"📊 *{title}*"

        safe_send(bot, chat_id, summary)
        send_as_file(bot, chat_id, data, filename="result.json", caption=f"Full data: {title}")


def truncate_with_ellipsis(text: str, max_len: int = TELEGRAM_MAX_LEN) -> str:
    """Simple truncation with ellipsis notice."""
    if len(text) <= max_len:
        return text
    return text[:max_len - 80] + f"\n\n_... [truncated {len(text) - max_len + 80} chars]_"
