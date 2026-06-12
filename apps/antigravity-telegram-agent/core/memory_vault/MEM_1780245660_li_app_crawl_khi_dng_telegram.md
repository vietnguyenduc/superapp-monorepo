# Task Objective
The objective was to diagnose and propose a fix for a "message is too long" error (Telegram API Error 400: Bad Request) occurring in a Telegram bot's crawl application when attempting to extract and send proposed schemas.

# Strategy Used
The strategy involved:
1.  **Analyzing the error:** Pinpointing the "message is too long" error description from the Telegram API response.
2.  **Locating the source:** Identifying the specific file (`main.py` in `antigravity-telegram-agent`) and function (`fetch_and_ask` within the `/crawl` handler) where the error originated.
3.  **Inspecting the problematic code:** Observing that `bot.send_message()` was being used directly to send the `schema` content.
4.  **Discovering existing solutions:** Identifying that a `safe_send()` function, designed to automatically split long messages, already existed in `core/telegram_utils.py`.
5.  **Proposing a fix:** Recommending the replacement of direct `bot.send_message()` calls with the `safe_send()` utility function.
6.  **Identifying other affected areas:** Locating other instances (`handle_ask` function) where a similar fix would be beneficial.

# Code Snippets (Skills)
**Files Edited/Referenced:**
*   `main.py`
*   `core/telegram_utils.py`

**Key Code Changes Proposed:**

**Original (in `main.py`, line ~130):**
```python
bot.send_message(message.chat.id, f"{schema}\n\n👉 **Mục đích & Số lượng cào của bạn là gì?...")
```

**Proposed Fix (in `main.py`, line ~130):**
```python
safe_send(bot, message.chat.id, f"{schema}\n\n👉 **Mục đích & Số lượng cào của bạn là gì?...")
```

**Original (in `main.py`, line ~100):**
```python
bot.reply_to(message, answer)
```

**Proposed Fix (in `main.py`, line ~100):**
```python
safe_send(bot, message.chat.id, answer)
```

# Lessons Learned
*   **Succeeded:** Successfully identified the root cause of the Telegram API "message is too long" error. Discovered an existing, pre-implemented utility function (`safe_send`) that directly addressed the problem. Proposed a straightforward and effective solution by integrating the existing utility. Identified multiple locations within the codebase where this fix should be applied for consistency and robustness.
*   **Failed:** The initial implementation in `main.py` did not account for Telegram's message length limitations, leading to the API error. There was a missed opportunity to leverage an already available utility function (`safe_send`) in the relevant parts of `main.py`.
*   **How errors were healed:** The error was healed by a thorough code review that revealed the discrepancy between the problem (long messages) and the existing solution (`safe_send`). The proposed fix involves a simple substitution of the direct `send_message` call with the `safe_send` utility, effectively preventing future "message too long" errors by automatically segmenting messages.