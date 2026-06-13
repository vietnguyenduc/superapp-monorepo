# Task Objective
The objective was to determine if the system could split long messages into multiple smaller messages when necessary.

# Strategy Used
The existing codebase already implements a `safe_send` function designed to handle this. The strategy involved leveraging this `safe_send` function, which includes:
1.  **Message Splitting:** Automatically splitting messages exceeding 4000 characters.
2.  **Parse Mode Fallback:** Gracefully handling `parse_mode` entity errors by falling back to a safer mode.
3.  **Part Numbering:** Adding "Part X/Y" prefixes to indicate the sequence of split messages.

# Code Snippets (Skills)
**Problematic Code (identified in `handle_crawl` -> `fetch_and_ask`, around line 130):**
```python
# Dòng ~130 - VẪN CÒN LỖI!
msg = bot.send_message(
    message.chat.id, 
    f"{schema}\n\n👉 **Mục đích & Số lượng cào của bạn là gì?...",
    parse_mode="Markdown"  # <-- parse_mode="Markdown" gây lỗi entities!
)
```

**Proposed Fix:**
```python
msg = safe_send(
    bot, 
    message.chat.id, 
    f"{schema}\n\n👉 **Mục đích & Số lượng cào của bạn là gì?...",
    parse_mode=None  # an toàn, không parse Markdown
)
```

# Lessons Learned
*   **Succeeded:** The core functionality for splitting long messages and handling `parse_mode` fallbacks via `safe_send` is robust and correctly implemented.
*   **Failed:** A specific instance of `bot.send_message` was found that bypassed the `safe_send` wrapper, leading to potential `parse_mode="Markdown"` entity errors. This highlights the importance of consistent use of helper functions.
*   **How errors were healed:** The error can be healed by replacing the direct `bot.send_message` call with the `safe_send` function and explicitly setting `parse_mode=None` for safer message delivery in that context. This ensures all messages benefit from the splitting and error-handling logic.