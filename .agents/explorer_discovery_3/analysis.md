# Auto-Kaizen Integration Analysis & Implementation Plan

This document details the exploration of the codebase at `apps/antigravity-telegram-agent` and details the implementation plan for Milestone 1: Discovery & Exploration of the Auto-Kaizen System Integration.

---

## 1. Project Context & Objectives

Based on the project scope document `PROJECT.md`, the Auto-Kaizen integration involves:
*   A scheduled daily background maintenance task (cron job).
*   A manual command `/kaizen_now` registered with the Telegram bot.
*   A reflection prompt payload that triggers:
    1. Reading `agent_service.log` for the past 24 hours.
    2. Extracting and appending 3 key learnings to `lessons_learned.md`.
    3. Running the native `run_visual_audit` tool to check UI/UX integrity.
    4. Auto-restarting background servers if needed.
*   Agent execution via `execute_chat_turn` using a mock message object.

---

## 2. Findings & Codebase Analysis

### File Structure & Dependencies
*   `main.py`: The entry point script that configures logging, initializes the TeleBot (`bot`) and `AntigravityAgent` (`agent`), maps command handlers, and handles the catch-all agentic loop.
*   `scheduler.py`: Contains system telemetry collection functions, monorepo git checks, daily report compilation, and sets up the background scheduler (`BackgroundScheduler` from `apscheduler`).
*   `agent.py`: Outlines tools, sets up prompt context and hiến pháp (constitution), and runs the agent turn (`run_agent_turn`).
*   `tools.py`: Defines helper tools, including the visual audit and command execution modules.

### Key Observation: Avoiding Circular Imports
In `main.py`, `scheduler.py` is imported. In order for the scheduled cron job to run the agentic turn, it needs to access `execute_chat_turn` (which relies on `bot`, `agent`, and various global handlers in `main.py`). 
Directly importing `main` inside `scheduler.py` would create a circular import conflict.
**Resolution**: We will pass the reflection handler `run_kaizen_reflection` as a callback parameter `kaizen_job_fn` to `scheduler.setup_scheduler` during initialization inside `main.py`.

---

## 3. Step-by-Step Implementation Plan

### Step 3.1: Update `scheduler.py`
We will modify `setup_scheduler` to accept the `kaizen_job_fn` callback and schedule the job at `02:00` daily.

**Target File**: `apps/antigravity-telegram-agent/scheduler.py`
**Target Lines**: Inside `setup_scheduler` (lines 79–108).

```python
# scheduler.py - Proposed Change
def setup_scheduler(bot, chat_id, report_time_str: str = "21:00", kaizen_job_fn=None) -> BackgroundScheduler:
    """Sets up standard background tasks, e.g. daily compiled report to Telegram and Auto-Kaizen."""
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
    
    # Add daily Auto-Kaizen job if callback is provided
    if kaizen_job_fn:
        scheduler.add_job(
            kaizen_job_fn,
            'cron',
            hour=2,
            minute=0,
            id='daily_kaizen_job'
        )
        logger.info("Daily Auto-Kaizen job scheduled for 02:00 everyday.")
    
    scheduler.start()
    logger.info(f"Daily report job scheduled for {report_time_str} everyday.")
    return scheduler
```

### Step 3.2: Update `main.py`
We will:
1. Define the `run_kaizen_reflection()` method that prepares paths dynamically, formats the system prompt, builds a `MockMessage` object, and invokes `execute_chat_turn`.
2. Register the `/kaizen_now` handler command.
3. Pass `run_kaizen_reflection` as `kaizen_job_fn` to the scheduler configuration block.

**Target File**: `apps/antigravity-telegram-agent/main.py`
**Target Lines**: 
*   Define the new function and register the command handler before `handle_agent_chat` (around line 2300).
*   Pass callback in the `__main__` entry block (around line 2335).

```python
# main.py - Proposed Changes

# 1. Define run_kaizen_reflection and handle_kaizen_now (above line 2300)
def run_kaizen_reflection():
    """Triggers the scheduled Auto-Kaizen reflection turn for the primary admin user."""
    if not ALLOWED_USER_ID:
        logger.warning("No ALLOWED_USER_ID configured. Skipping scheduled Kaizen job.")
        return
    primary_id = str(ALLOWED_USER_ID).split(',')[0].strip()
    
    # Create MockMessage
    class MockChat:
        def __init__(self, id):
            self.id = id
    class MockMessage:
        def __init__(self, chat_id, text):
            self.chat = MockChat(chat_id)
            self.text = text
            self.message_id = 0
            
    agent_dir = Path(__file__).parent.resolve()
    log_path = (agent_dir / "agent_service.log").as_posix()
    lessons_path = (agent_dir / "lessons_learned.md").as_posix()
    
    prompt = (
        f"[SYSTEM KAIZEN] Hãy thực hiện quy trình tự phản hồi và kiểm tra hệ thống (Auto-Kaizen):\n"
        f"1. Đọc tệp nhật ký `{log_path}` trong vòng 24 giờ qua.\n"
        f"2. Trích xuất ít nhất 3 bài học kinh nghiệm quan trọng (key learnings) và ghi thêm (append) vào `{lessons_path}`.\n"
        f"3. Chạy công cụ native `run_visual_audit` để đánh giá tính toàn vẹn UI/UX.\n"
        f"4. Tự động khởi động lại background servers (ví dụ: npm run dev, npx vite) nếu cần thiết.\n"
        f"5. Báo cáo chi tiết quá trình và kết quả thực hiện."
    )
    
    mock_msg = MockMessage(primary_id, prompt)
    try:
        bot.send_message(primary_id, "🤖 [SCHEDULER] Kích hoạt quy trình Auto-Kaizen định kỳ hàng ngày...", parse_mode="Markdown")
        execute_chat_turn(mock_msg, prompt)
    except Exception as e:
        logger.error(f"Scheduled Kaizen job failed: {e}")


@bot.message_handler(commands=['kaizen_now'])
def handle_kaizen_now(message):
    """Command to trigger Auto-Kaizen reflection immediately."""
    user_id = message.from_user.id
    role = get_user_role(user_id)
    if role not in ["admin", "admin_master", "admin_company"]:
        bot.reply_to(message, "⛔ Access Denied.")
        return
        
    bot.reply_to(message, "🔄 *Kích hoạt quy trình Auto-Kaizen thủ công...*", parse_mode="Markdown")
    
    agent_dir = Path(__file__).parent.resolve()
    log_path = (agent_dir / "agent_service.log").as_posix()
    lessons_path = (agent_dir / "lessons_learned.md").as_posix()
    
    prompt = (
        f"[SYSTEM KAIZEN] Hãy thực hiện quy trình tự phản hồi và kiểm tra hệ thống (Auto-Kaizen):\n"
        f"1. Đọc tệp nhật ký `{log_path}` trong vòng 24 giờ qua.\n"
        f"2. Trích xuất ít nhất 3 bài học kinh nghiệm quan trọng (key learnings) và ghi thêm (append) vào `{lessons_path}`.\n"
        f"3. Chạy công cụ native `run_visual_audit` để đánh giá tính toàn vẹn UI/UX.\n"
        f"4. Tự động khởi động lại background servers (ví dụ: npm run dev, npx vite) nếu cần thiết.\n"
        f"5. Báo cáo chi tiết quá trình và kết quả thực hiện."
    )
    
    execute_chat_turn(message, prompt)
```

```python
# 2. Modify scheduler initialization inside if __name__ == "__main__":
# Locate line 2335:
# bg_scheduler = scheduler.setup_scheduler(bot, primary_id, "18:00")
# Replace with:
bg_scheduler = scheduler.setup_scheduler(
    bot, 
    primary_id, 
    "18:00", 
    kaizen_job_fn=run_kaizen_reflection
)
```

---

## 4. Verification & Testing Strategy

### 4.1 Automated/Manual Test Command
To verify the cron job logic without waiting for `02:00` AM:
1. We can write a temporary helper command `/kaizen_test` or invoke `run_kaizen_reflection` directly from python:
   ```powershell
   python -c "from main import run_kaizen_reflection; run_kaizen_reflection()"
   ```
2. Trigger the manual command `/kaizen_now` directly in the Telegram chat with the bot.

### 4.2 Verified Outputs
During testing, verify that:
*   The bot sends the initial progress messages.
*   The agent successfully calls `read_file` to parse `agent_service.log`.
*   The agent calls `write_file`/`patch_file` to append key lessons to `lessons_learned.md`.
*   The `lessons_learned.md` contains 3 new entries.
*   The agent triggers the `run_visual_audit` tool call.
*   The agent returns a summary message indicating success.
