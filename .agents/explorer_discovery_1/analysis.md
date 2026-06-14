# Milestone 1: Discovery & Exploration Analysis

## 1. Background & Project Context
The Auto-Kaizen system aims to automate self-reflection, bug harvesting, and visual audits for the `antigravity-telegram-agent`. According to the project scope in `PROJECT.md`, it requires integrating:
- A scheduled daily background maintenance task (via `scheduler.py`).
- A manual Telegram command `/kaizen_now` (via `main.py`).

Both triggers should run an autonomous reflection loop where the agent:
1. Reads the last 24 hours of `agent_service.log`.
2. Extracts exactly 3 key daily learnings and appends them to `vaults/lessons_learned.md`.
3. Verifies the Vite dev server (on port 5175) for the active project `inventory-operation`, auto-restarting it if necessary.
4. Executes the native visual audit tool `run_visual_audit` to check the UI.
5. Sends a consolidated summary report back to the admin.

---

## 2. Analysis of the Existing Scheduling Mechanism (`scheduler.py`)
- **Job Registration**: 
  Scheduled jobs are registered within the `setup_scheduler` function in `scheduler.py` (lines 79–108). It initializes an `APScheduler` `BackgroundScheduler` instance.
- **Access to `bot` and `chat_id`**:
  `setup_scheduler(bot, chat_id, report_time_str)` receives `bot` (the TeleBot instance) and `chat_id` (the admin's Telegram chat ID) as parameters from `main.py` during service startup.
  The scheduler wraps the job function `send_daily_report_job()` which captures `bot` and `chat_id` via lexical closures to send the compiled daily report:
  ```python
  def send_daily_report_job():
      logger.info("Executing scheduled daily report job...")
      try:
          report_msg = compile_daily_report()
          bot.send_message(chat_id, report_msg, parse_mode="Markdown")
      except Exception as e:
          logger.error(f"Error sending scheduled report: {e}")
  ```
  The job is added via:
  ```python
  scheduler.add_job(
      send_daily_report_job,
      'cron',
      hour=hour,
      minute=minute,
      id='daily_report_job'
  )
  ```

---

## 3. Analysis of Command & Chat Turn Routing (`main.py`)
- **Command Registration**:
  Telegram commands (e.g. `/pro`, `/plan`, `/goal`, `/settings`) are defined as message handlers using telebot decorators:
  ```python
  @bot.message_handler(commands=['plan'])
  def handle_plan_command(message):
      ...
  ```
- **Chat Turn Execution**:
  All agent interactions are routed through `execute_chat_turn(message, user_text, force_provider=None)` in `main.py` (lines 1418–1669). 
  `execute_chat_turn` operates as follows:
  1. Spawns a background thread to process the response, avoiding blocking the main Telegram polling thread.
  2. Sends an initial progress message with an inline "Hủy tác vụ" (Cancel task) button.
  3. Spawns a heartbeat thread that updates the Telegram progress message every 15 seconds.
  4. Calls `agent.run_agent_turn(...)` inside a `TelegramTypingIndicator` context.
  5. Once the agent completes its tool-execution loop and returns a final text response, `execute_chat_turn` saves the interaction to the memory vault (NotebookLM context) and logs, appends the turns to chat history, and sends the final reply back to the Telegram chat.

---

## 4. Proposed Solution Design

### Reusing `execute_chat_turn`
We can completely reuse `execute_chat_turn` to handle the agent turn for both scheduled jobs and manual commands.
- For the `/kaizen_now` command, we can pass the real `message` object from the Telegram API directly.
- For the scheduled daily cron job, since it runs in the background without user interaction, we must pass a mock `message` object.

### Constructing the Mock `message` Object
The mock `message` object needs to mimic the structural requirements of `execute_chat_turn`. The implementation can follow the pattern already established in `main.py` for `/schedule` and `autopilot_tick()`:
```python
class MockChat:
    def __init__(self, chat_id):
        self.id = chat_id

class MockMessage:
    def __init__(self, chat_id, text):
        self.chat = MockChat(chat_id)
        self.text = text
        self.message_id = 0
        self.from_user = type('obj', (object,), {'id': chat_id})
```

### Avoiding Circular Imports
Since `main.py` imports `scheduler`, `scheduler.py` cannot import `execute_chat_turn` from `main.py` without causing a circular import. 
We propose two options to resolve this cleanly:
- **Option A (Recommended)**: Register the Kaizen job within `main.py` directly using the global `bg_scheduler_instance`, similar to how `apply_autopilot_schedule()` is implemented.
- **Option B**: Pass `execute_chat_turn` as a callback parameter (`run_kaizen_callback`) to `setup_scheduler` during startup.

---

## 5. "Self-Reflection & Audit" System Prompt
Because the reflection loop needs to run autonomously, we prefix the prompt with `/goal` to trigger **Autonomous Goal Mode** in `agent.py`. This ensures the agent works iteratively using tools and self-corrects without prompting the user for approval.

Below is the exact system prompt string:

```
/goal [SYSTEM DIRECTIVE: SELF-REFLECTION & AUDIT]
Nhiệm vụ của bạn là thực hiện quy trình Tự Phản Chiếu & Kiểm Thử Hệ Thống (Self-Reflection & Audit) định kỳ cho monorepo:

1. ĐĂNG NHẬP & PHÂN TÍCH NHẬT KÝ HOẠT ĐỘNG (LOGS):
   - Đường dẫn file nhật ký: `apps/antigravity-telegram-agent/agent_service.log` (đối chiếu từ gốc monorepo).
   - Hãy trích xuất 24 giờ hoạt động gần nhất một cách an toàn. VÌ DUNG LƯỢNG FILE LOG RẤT LỚN (trên 20MB), bạn TUYỆT ĐỐI KHÔNG DÙNG `read_file` trực tiếp. Thay vào đó, hãy dùng `execute_command` để chạy lệnh trích xuất 1000 dòng cuối cùng (ví dụ sử dụng lệnh PowerShell: `Get-Content -Path "apps/antigravity-telegram-agent/agent_service.log" -Tail 1000` hoặc chạy một script Python nhỏ trích xuất log 24 giờ qua).
   - Phân tích các lỗi (Error), cảnh báo (Warning), sự cố crash, hoặc các hành vi bất thường của agent.

2. GHI NHẬN 3 BÀI HỌC KINH NGHIỆM:
   - Dựa trên phân tích log trên, rút ra chính xác 3 bài học kinh nghiệm kỹ thuật cốt lõi (ví dụ: cách xử lý lỗi API, xử lý file, tối ưu hóa câu lệnh, hoặc cách tránh lỗi cú pháp).
   - Đọc file bài học hiện tại: `vaults/lessons_learned.md` (tương đối từ gốc monorepo).
   - Dùng `patch_file` hoặc viết để chèn thêm 3 bài học này dưới mục `## Daily Learnings` tương ứng với ngày hôm nay (định dạng: `- **[YYYY-MM-DD]**: <tóm tắt ngắn gọn bài học và giải pháp khắc phục>`).

3. KIỂM THỬ GIAO DIỆN (VISUAL AUDIT) & TỰ PHỤC HỒI SERVER:
   - Xác định xem ứng dụng Frontend của dự án hoạt động (`inventory-operation`) có đang chạy trên cổng `5175` hay không (sử dụng lệnh `netstat -ano | findstr 5175` hoặc tương tự qua `execute_command`).
   - Nếu cổng `5175` CHƯA hoạt động:
     a. Tìm và tiêu diệt bất kỳ tiến trình zombie nào đang chiếm dụng cổng này (ví dụ sử dụng PowerShell để kết thúc PID owning 5175).
     b. Khởi chạy lại máy chủ phát triển Vite dưới dạng chạy ngầm (background) trong thư mục `apps/inventory-operation` bằng lệnh:
        `Start-Process cmd -ArgumentList "/c npm run dev" -WindowStyle Hidden`
     c. Chờ 5 giây để server khởi động hoàn chỉnh.
   - Khi server đã hoạt động, gọi TRỰC TIẾP công cụ native `run_visual_audit` với tham số `urls=["http://localhost:5175/"]` để tiến hành chụp ảnh màn hình tự động và phân tích UI bằng Gemini Vision.
   - Thẩm định kết quả trả về từ `run_visual_audit` để phát hiện lỗi giao diện, lệch CSS hoặc lỗi console.

4. BÁO CÁO KẾT QUẢ:
   - Tổng hợp một báo cáo Markdown chi tiết gửi lại cho User qua Telegram, trình bày rõ: trạng thái log 24h qua, 3 bài học đã được ghi nhận vào `vaults/lessons_learned.md`, kết quả kiểm tra server cổng 5175 và báo cáo Visual Audit chi tiết.
```

---

## 6. Proposed Code Changes

### Proposing Changes in `main.py`
We will add the new command `/kaizen_now`, define `run_daily_kaizen_job`, and schedule the daily Kaizen job.

```python
# 1. Define the Kaizen Prompt and MockMessage helper
KAIZEN_PROMPT = """/goal [SYSTEM DIRECTIVE: SELF-REFLECTION & AUDIT]
... (prompt text as defined above) ..."""

# 2. Add the /kaizen_now command handler
@bot.message_handler(commands=['kaizen_now'])
def handle_kaizen_now(message):
    user_id = message.from_user.id
    if get_user_role(user_id) not in ["admin", "admin_master", "admin_company"]:
        bot.reply_to(message, "⛔ Access Denied.")
        return
    bot.reply_to(message, "🤖 *Kích hoạt Self-Reflection & Audit* - Đang chạy quy trình tự phân tích & kiểm thử hệ thống...", parse_mode="Markdown")
    execute_chat_turn(message, KAIZEN_PROMPT)

# 3. Add the background job function
def run_daily_kaizen_job():
    logger.info("Executing scheduled Self-Reflection & Audit job...")
    if ALLOWED_USER_ID:
        primary_id = str(ALLOWED_USER_ID).split(',')[0].strip()
        class MockChat:
            def __init__(self, id):
                self.id = id
        class MockMessage:
            def __init__(self, chat_id, text):
                self.chat = MockChat(chat_id)
                self.text = text
                self.message_id = 0
                self.from_user = type('obj', (object,), {'id': chat_id})
        
        mock_msg = MockMessage(primary_id, KAIZEN_PROMPT)
        try:
            bot.send_message(primary_id, "⏰ *Lịch biểu Auto-Kaizen*: Đang tự động kích hoạt Self-Reflection & Audit...", parse_mode="Markdown")
            execute_chat_turn(mock_msg, KAIZEN_PROMPT)
        except Exception as e:
            logger.error(f"Scheduled Kaizen job failed: {e}")
```

And in `main.py` inside the startup block (where scheduler is run):
```python
        # Setup scheduler for daily report
        primary_id = str(ALLOWED_USER_ID).split(",")[0].strip()
        bg_scheduler = scheduler.setup_scheduler(bot, primary_id, "18:00")
        bg_scheduler_instance = bg_scheduler
        apply_autopilot_schedule()
        
        # Register the daily Kaizen reflection job at 02:00 AM
        bg_scheduler.add_job(
            run_daily_kaizen_job,
            'cron',
            hour=2,
            minute=0,
            id='daily_kaizen_job'
        )
        logger.info("Daily Kaizen reflection job scheduled for 02:00 everyday.")
```

This design guarantees clean separation of concerns, high consistency with existing scheduler patterns, and robust execution of autonomous agent turns.
