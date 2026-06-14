# Analysis Report: Auto-Kaizen System Integration

## Executive Summary
This report analyzes the integration of the Auto-Kaizen system within the `antigravity-telegram-agent` codebase. We propose a non-intrusive architecture to support both on-demand `/kaizen_now` invocation and scheduled daily execution of a self-reflection & visual audit agentic loop.

---

## 1. Current System Overview

### Chat Turn Execution Context
The telegram bot in `main.py` uses `execute_chat_turn(message, user_text, force_provider=None)` to run the agentic loop. For scheduled or programmatically-triggered tasks, the bot constructs a `MockMessage` object to pass down to `execute_chat_turn`.

### Scheduler Integration
The `scheduler.py` module exposes `setup_scheduler(bot, chat_id, report_time_str)` which schedules the daily report cron job using the `apscheduler` package. 
To avoid circular imports (since `main.py` imports `scheduler` and `execute_chat_turn` is defined in `main.py`), the daily Kaizen cron job should receive a callback function `kaizen_callback` from `main.py` at setup time.

---

## 2. Designed Kaizen Prompt

The exact system prompt that will be passed into the `/goal` autonomous execution loop is designed as follows:

```markdown
[KAIZEN_AUTO_AUDIT]
Nhiệm vụ tự trị bảo trì và tối ưu hóa hệ thống (Daily Self-Reflection & QA Audit):
1. Đọc tệp tin nhật ký hoạt động gần đây tại: `c:/Vibecoding/superapp-monorepo/apps/antigravity-telegram-agent/agent_service.log`. Trích xuất chính xác 3 bài học kinh nghiệm mới (learnings), lỗi lặp lại (repeating bugs) hoặc quy tắc cấu trúc hữu ích từ log của 24h qua.
2. Ghi/thêm (append) 3 bài học kinh nghiệm này vào phần `## Daily Learnings` trong tệp tin `c:/Vibecoding/superapp-monorepo/vaults/lessons_learned.md` với định dạng `- **[YYYY-MM-DD]**: <nội dung bài học>`.
3. Xác định dự án hiện tại đang hoạt động (active project) bằng cách đọc `c:/Vibecoding/superapp-monorepo/apps/antigravity-telegram-agent/active_project.json`. Tra cứu cổng (port) và công nghệ tương ứng của dự án đó trong `c:/Vibecoding/superapp-monorepo/apps/antigravity-telegram-agent/config/settings.json`.
4. Kiểm tra xem cổng cục bộ (port) đó đã có dịch vụ chạy chưa. Nếu chưa hoặc hoạt động không phản hồi, hãy thực hiện dọn dẹp port cũ (dùng `manage_port` hoặc kill port) và tự động khởi động lại (auto-restart) máy chủ phát triển (dev server) dưới dạng tiến trình ngầm (dùng `Start-Process` ẩn cửa sổ với lệnh phù hợp, ví dụ Vite: `npx vite --port <port> --host` hoặc Next.js: `npx next dev -p <port>`).
5. Khi máy chủ phát triển đã sẵn sàng tại `http://localhost:<port>`, hãy chạy công cụ native `run_visual_audit` với URL `http://localhost:<port>` để thực hiện kiểm thử tự động giao diện (UI/UX integrity audit) trên các thiết bị.
6. Báo cáo chi tiết kết quả thực hiện các bước trên bao gồm: 3 bài học đã trích xuất, trạng thái cổng/dev server, và kết quả phân tích UI/UX từ `run_visual_audit`.
```

### Rationale:
- **`[KAIZEN_AUTO_AUDIT]` Header**: Tags the turn so the agent can classify it as an system-triggered optimization task.
- **Reading `agent_service.log`**: Triggers the agent to use `read_file_lines` or `read_file` to read the log file, extracting recent error patterns or developer interventions.
- **Updating `lessons_learned.md`**: Directs the agent to append the findings to the centralized `vaults/lessons_learned.md` file in the monorepo root.
- **Port Lookup and Auto-Restart**: Guides the agent to inspect the current active workspace, find the port and command from `settings.json`, check the status, and use `-WindowStyle Hidden` with PowerShell `Start-Process` to run it as a background process (resolving zombie ports if needed).
- **Executing `run_visual_audit`**: Proactively calls the native UI testing framework, ensuring that the app UI is audited across multiple viewports via Gemini Vision.

---

## 3. Proposed Code Changes

### Proposed Changes for `apps/antigravity-telegram-agent/scheduler.py`
We will update `setup_scheduler` to accept `kaizen_time_str` and a `kaizen_callback` function.

```python
# Before (Line 79-109):
def setup_scheduler(bot, chat_id, report_time_str: str = "21:00") -> BackgroundScheduler:
    """Sets up standard background tasks, e.g. daily compiled report to Telegram."""
    scheduler = BackgroundScheduler()
    
    # Parse report time HH:MM
    try:
        hour, minute = map(int, report_time_str.split(":"))
    except ValueError:
        hour, minute = 21, 0 # Default to 9:00 PM
        
    def send_daily_report_job():
        logger.info("Executing scheduled daily report job...")
        try:
            report_msg = compile_daily_report()
            bot.send_message(chat_id, report_msg, parse_mode="Markdown")
        except Exception as e:
            logger.error(f"Error sending scheduled report: {e}")

    # Add cron daily job
    scheduler.add_job(
        send_daily_report_job,
        'cron',
        hour=hour,
        minute=minute,
        id='daily_report_job'
    )
    
    scheduler.start()
    logger.info(f"Daily report job scheduled for {report_time_str} everyday.")
    return scheduler

# After:
def setup_scheduler(bot, chat_id, report_time_str: str = "21:00", kaizen_time_str: str = "23:00", kaizen_callback=None) -> BackgroundScheduler:
    """Sets up standard background tasks, e.g. daily compiled report & daily Kaizen reflection."""
    scheduler = BackgroundScheduler()
    
    # Parse report time HH:MM
    try:
        hour, minute = map(int, report_time_str.split(":"))
    except ValueError:
        hour, minute = 21, 0 # Default to 9:00 PM

    # Parse Kaizen time HH:MM
    try:
        khour, kminute = map(int, kaizen_time_str.split(":"))
    except ValueError:
        khour, kminute = 23, 0 # Default to 11:00 PM
        
    def send_daily_report_job():
        logger.info("Executing scheduled daily report job...")
        try:
            report_msg = compile_daily_report()
            bot.send_message(chat_id, report_msg, parse_mode="Markdown")
        except Exception as e:
            logger.error(f"Error sending scheduled report: {e}")

    def run_daily_kaizen_job():
        logger.info("Executing scheduled daily Kaizen job...")
        if kaizen_callback:
            try:
                kaizen_callback(chat_id)
            except Exception as e:
                logger.error(f"Error executing daily Kaizen job: {e}")

    # Add cron daily job for report
    scheduler.add_job(
        send_daily_report_job,
        'cron',
        hour=hour,
        minute=minute,
        id='daily_report_job'
    )

    # Add cron daily job for Kaizen
    if kaizen_callback:
        scheduler.add_job(
            run_daily_kaizen_job,
            'cron',
            hour=khour,
            minute=kminute,
            id='daily_kaizen_job'
        )
        logger.info(f"Daily Kaizen job scheduled for {kaizen_time_str} everyday.")
    
    scheduler.start()
    logger.info(f"Daily report job scheduled for {report_time_str} everyday.")
    return scheduler
```

### Proposed Changes for `apps/antigravity-telegram-agent/main.py`
We will:
1. Define the `/kaizen_now` message handler.
2. Define the `trigger_kaizen_turn(chat_id)` and `get_kaizen_prompt()` utility functions.
3. Define the scheduling management function `apply_daily_kaizen_schedule()`.
4. Integrate settings editing support for `daily_kaizen_time` and reschedule jobs when settings change.
5. Provide the callback to the scheduler inside the `if __name__ == "__main__":` block.

#### 1. Command Registration (Insert around Line 1817):
```python
# Before (Line 1816-1820):
    execute_chat_turn(message, f"/teamwork {user_text}")


@bot.message_handler(commands=['schedule'])

# After:
    execute_chat_turn(message, f"/teamwork {user_text}")


@bot.message_handler(commands=['kaizen_now'])
def handle_kaizen_now(message):
    """Triggers the Kaizen reflection and audit loop immediately."""
    user_id = message.from_user.id
    if get_user_role(user_id) not in ["admin", "admin_master", "admin_company"]:
        bot.reply_to(message, "⛔ Access Denied.")
        return
    trigger_kaizen_turn(message.chat.id)


@bot.message_handler(commands=['schedule'])
```

#### 2. Helper functions and trigger (Insert around Line 2116):
```python
# Before (Line 2115-2117):
            logger.error(f"Autopilot tick failed: {e}")

def apply_daily_report_schedule():

# After:
            logger.error(f"Autopilot tick failed: {e}")


def get_kaizen_prompt() -> str:
    return (
        "[KAIZEN_AUTO_AUDIT]\n"
        "Nhiệm vụ tự trị bảo trì và tối ưu hóa hệ thống (Daily Self-Reflection & QA Audit):\n"
        "1. Đọc tệp tin nhật ký hoạt động gần đây tại: `c:/Vibecoding/superapp-monorepo/apps/antigravity-telegram-agent/agent_service.log`. Trích xuất chính xác 3 bài học kinh nghiệm mới (learnings), lỗi lặp lại (repeating bugs) hoặc quy tắc cấu trúc hữu ích từ log của 24h qua.\n"
        "2. Ghi/thêm (append) 3 bài học kinh nghiệm này vào phần `## Daily Learnings` trong tệp tin `c:/Vibecoding/superapp-monorepo/vaults/lessons_learned.md` với định dạng `- **[YYYY-MM-DD]**: <nội dung bài học>`.\n"
        "3. Xác định dự án hiện tại đang hoạt động (active project) bằng cách đọc `c:/Vibecoding/superapp-monorepo/apps/antigravity-telegram-agent/active_project.json`. Tra cứu cổng (port) và công nghệ tương ứng của dự án đó trong `c:/Vibecoding/superapp-monorepo/apps/antigravity-telegram-agent/config/settings.json`.\n"
        "4. Kiểm tra xem cổng cục bộ (port) đó đã có dịch vụ chạy chưa. Nếu chưa hoặc hoạt động không phản hồi, hãy thực hiện dọn dẹp port cũ (dùng `manage_port` hoặc kill port) và tự động khởi động lại (auto-restart) máy chủ phát triển (dev server) dưới dạng tiến trình ngầm (dùng `Start-Process` ẩn cửa sổ với lệnh phù hợp, ví dụ Vite: `npx vite --port <port> --host` hoặc Next.js: `npx next dev -p <port>`).\n"
        "5. Khi máy chủ phát triển đã sẵn sàng tại `http://localhost:<port>`, hãy chạy công cụ native `run_visual_audit` với URL `http://localhost:<port>` để thực hiện kiểm thử tự động giao diện (UI/UX integrity audit) trên các thiết bị.\n"
        "6. Báo cáo chi tiết kết quả thực hiện các bước trên bao gồm: 3 bài học đã trích xuất, trạng thái cổng/dev server, và kết quả phân tích UI/UX từ `run_visual_audit`."
    )


def trigger_kaizen_turn(chat_id):
    # Mock message setup
    class MockChat:
        def __init__(self, id):
            self.id = id
    class MockMessage:
        def __init__(self, chat_id, text):
            self.chat = MockChat(chat_id)
            self.text = text
            self.message_id = 0
            self.from_user = type('obj', (object,), {'id': chat_id})
            
    prompt = get_kaizen_prompt()
    mock_msg = MockMessage(chat_id, f"/goal {prompt}")
    
    try:
        bot.send_message(
            chat_id, 
            "🤖 *Kaizen Daily Reflection & Audit Kích Hoạt* - Đang tiến hành tự động đọc logs, cập nhật lessons_learned.md, và kiểm tra dev server & UI/UX...", 
            parse_mode="Markdown"
        )
        execute_chat_turn(mock_msg, mock_msg.text)
    except Exception as e:
        logger.error(f"Failed to trigger Kaizen turn: {e}")


def apply_daily_kaizen_schedule():
    s = settings.load_settings()
    kaizen_time_str = s.get("daily_kaizen_time", "23:00")
    try:
        hour, minute = map(int, kaizen_time_str.split(":"))
    except ValueError:
        hour, minute = 23, 0
    
    try:
        bg_scheduler_instance.reschedule_job('daily_kaizen_job', trigger='cron', hour=hour, minute=minute)
        logger.info(f"Daily Kaizen rescheduled to {kaizen_time_str}")
    except Exception as e:
        logger.error(f"Failed to reschedule daily Kaizen: {e}")


def apply_daily_report_schedule():
```

#### 3. Main block modification (Insert around Line 2335):
```python
# Before (Line 2331-2339):
    # Setup scheduler for daily report at 18:00
    bg_scheduler = None
    if ALLOWED_USER_ID is not None:
        primary_id = str(ALLOWED_USER_ID).split(",")[0].strip()
        bg_scheduler = scheduler.setup_scheduler(bot, primary_id, "18:00")
        bg_scheduler_instance = bg_scheduler
        apply_autopilot_schedule()
        logger.info("Daily report scheduler setup successfully.")

# After:
    # Setup scheduler for daily report and Kaizen reflection
    bg_scheduler = None
    if ALLOWED_USER_ID is not None:
        primary_id = str(ALLOWED_USER_ID).split(",")[0].strip()
        s = settings.load_settings()
        report_time = s.get("daily_report_time", "18:00")
        kaizen_time = s.get("daily_kaizen_time", "23:00")
        
        # Define the Kaizen trigger callback
        def trigger_kaizen_callback(cid):
            trigger_kaizen_turn(cid)
            
        bg_scheduler = scheduler.setup_scheduler(
            bot, 
            primary_id, 
            report_time_str=report_time, 
            kaizen_time_str=kaizen_time,
            kaizen_callback=trigger_kaizen_callback
        )
        bg_scheduler_instance = bg_scheduler
        apply_autopilot_schedule()
        logger.info("Daily scheduler setup successfully.")
```

---

## 4. Verification Plan

The implementer can verify the correctness of the changes through the following verification workflow:

1. **Verify `/kaizen_now` Command**:
   - Send `/kaizen_now` to the Telegram bot as an authorized admin user.
   - Verify that the bot acknowledges with `🤖 Kaizen Daily Reflection & Audit Kích Hoạt...`.
   - Monitor the bot progress updates to ensure the agent:
     - Accesses and reads `agent_service.log`.
     - Appends 3 new items under `## Daily Learnings` in `vaults/lessons_learned.md`.
     - Identifies the active project (e.g. `accounting` on port `3001`).
     - Restarts/verifies the dev server on port `3001`.
     - Successfully runs `run_visual_audit` tool and replies with the visual audit report.

2. **Verify Scheduled Daily Job**:
   - In `/settings`, update `daily_kaizen_time` (or manually configure in settings.json to a time 2 minutes into the future).
   - Check the console logs of the `antigravity-telegram-agent` service to ensure the cron job fires exactly at the scheduled time.
   - Verify that the bot sends the trigger message and proceeds with execution.
