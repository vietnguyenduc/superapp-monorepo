# Task Objective
Vẫn crawl2 lỗi 

❌ Lỗi trích xuất đề xuất: A request to the Telegram API was unsuccessful. Error code: 400. Description: Bad Request: message is too long

# Strategy Used
Direct self-healing command execution.

# Code Snippets (Skills)
🌐 _[DeepSeek]_

## ✅ Đã đọc rules + incidents — Phát hiện vấn đề

Tôi thấy rõ lỗi ngay lập tức. **Rule #1 và #2 từ vault đã bị vi phạm:**

### 🔍 Nguyên nhân gốc rễ

**Dòng ~155** trong `handle_crawl2`:
```python
bot.send_message(
    message.chat.id, 
    f"{schema}\n\n👉 **Mục đích & Số lượng cào của bạn là gì?**...",
    parse_mode="Markdown"  # ❌ Vi phạm Rule #1 + #2
)
```

**Dòng ~165** trong `fetch_and_ask`:
```python
bot.send_message(message.chat.id, f"❌ Lỗi trích xuất đề xuất: {e}")  # ❌ V

# Lessons Learned
Execution completed with success=True and complexity=medium.