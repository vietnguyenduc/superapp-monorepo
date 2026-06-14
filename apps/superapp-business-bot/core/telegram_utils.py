"""
telegram_utils.py
=================
Utilities for safe, resilient Telegram message sending.
Handles message splitting, file attachments for large data, and pagination.
"""

import io
import json
import logging
import re
from typing import Union

logger = logging.getLogger("ATA.telegram_utils")

TELEGRAM_MAX_LEN = 4000  # Telegram hard limit is 4096, leave buffer for formatting


def format_markdown_tables(text: str) -> str:
    """Xử lý bảng Markdown thành định dạng monospace hiển thị đẹp trên Telegram."""
    # Tìm các dòng liên tiếp có chứa ký tự '|' (ít nhất 3 dòng)
    table_pattern = re.compile(r'(?:^.*\|.*$\n?){3,}', re.MULTILINE)
    
    def format_table_match(match):
        table_text = match.group(0).strip()
        try:
            from tabulate import tabulate
            lines = table_text.split('\n')
            
            # Kiểm tra xem có dòng divider không (chứa -, |, :, khoảng trắng)
            has_divider = False
            for line in lines:
                if re.match(r'^[\s\-|:]+$', line) and '-' in line:
                    has_divider = True
                    break
                    
            if not has_divider:
                return match.group(0) # Không phải là bảng hợp lệ
                
            # Làm sạch pipe ở đầu và cuối mỗi dòng
            cleaned_lines = []
            for line in lines:
                l = line.strip()
                if l.startswith('|'): l = l[1:]
                if l.endswith('|'): l = l[:-1]
                cleaned_lines.append(l)
                
            headers = [col.strip() for col in cleaned_lines[0].split('|')]
            data = []
            for line in cleaned_lines[2:]:
                cols = [col.strip() for col in line.split('|')]
                data.append(cols)
                
            pretty_table = tabulate(data, headers=headers, tablefmt="presto")
            return f"\n```text\n{pretty_table}\n```\n"
        except Exception:
            pass
        # Fallback
        return f"\n```text\n{table_text}\n```\n"
        
    return table_pattern.sub(format_table_match, text)

def process_markdown_extras(bot, chat_id: int, text: str) -> str:
    """
    Tiền xử lý text để trích xuất hình ảnh (gửi dạng photo) và format lại bảng Markdown
    để hiển thị đẹp trên Telegram (bọc trong ```text).
    """
    # 1. Trích xuất và gửi ảnh: ![alt](url)
    img_pattern = re.compile(r'!\[([^\]]*)\]\((https?://[^)]+)\)')
    
    def send_img_match(match):
        alt_text = match.group(1)
        url = match.group(2)
        try:
            bot.send_photo(chat_id, url, caption=alt_text[:1024] if alt_text else None)
            return f"🖼️ `[Đã hiển thị ảnh: {alt_text}]`"
        except Exception as e:
            logger.error(f"Failed to send image {url}: {e}")
            return match.group(0) # Trả lại nguyên gốc nếu lỗi
            
    text = img_pattern.sub(send_img_match, text)
    
    # 1.5. Trích xuất và gửi file đính kèm: [FILE: alt](absolute_path)
    file_pattern = re.compile(r'\[FILE:\s*([^\]]*)\]\(([^)]+)\)')
    
    def send_file_match(match):
        alt_text = match.group(1)
        path = match.group(2)
        try:
            with open(path, "rb") as f:
                bot.send_document(chat_id, f, caption=alt_text[:1024] if alt_text else None)
            return f"📎 `[Đã đính kèm file: {alt_text}]`"
        except Exception as e:
            logger.error(f"Failed to send document {path}: {e}")
            return match.group(0) # Trả lại nguyên gốc nếu lỗi
            
    text = file_pattern.sub(send_file_match, text)
    
    # 2. Xử lý bảng Markdown
    text = format_markdown_tables(text)
    return text


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

    text = process_markdown_extras(bot, chat_id, text)

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
