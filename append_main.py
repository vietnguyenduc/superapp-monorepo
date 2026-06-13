import os

with open("apps/antigravity-telegram-agent/main.py", "a", encoding="utf-8") as f:
    f.write("""

# ─── AUTOPILOT & SETTINGS ────────────────────────────────────────────────────────

def autopilot_tick():
    logger.info("Executing autopilot tick...")
    if ALLOWED_USER_ID:
        primary_id = str(ALLOWED_USER_ID).split(',')[0].strip()
        from types import SimpleNamespace
        # Create a mock message
        class MockChat:
            def __init__(self, id):
                self.id = id
        class MockMessage:
            def __init__(self, chat_id, text):
                self.chat = MockChat(chat_id)
                self.text = text
                self.message_id = 0
                
        mock_msg = MockMessage(primary_id, "/goal [AUTOPILOT] Hãy tự động chạy kiểm tra hệ thống, quét các thay đổi git (git status), kiểm tra lỗi và fix lỗi nếu có, sau đó tự push lên nhánh hiện tại và báo cáo kết quả.")
        try:
            bot.send_message(primary_id, "🤖 *Autopilot Kích Hoạt* - Đang tiến hành quét và bảo trì hệ thống ngầm...", parse_mode="Markdown")
            execute_chat_turn(mock_msg, mock_msg.text)
        except Exception as e:
            logger.error(f"Autopilot tick failed: {e}")

def apply_autopilot_schedule():
    global bg_scheduler_instance
    if not bg_scheduler_instance:
        return
        
    s = settings.load_settings()
    job_id = "autopilot_job"
    
    # Remove existing job if any
    try:
        bg_scheduler_instance.remove_job(job_id)
    except Exception:
        pass
        
    if s.get("autopilot_enabled"):
        interval_hours = s.get("autopilot_interval_hours", 6)
        bg_scheduler_instance.add_job(
            autopilot_tick,
            'interval',
            hours=interval_hours,
            id=job_id,
            replace_existing=True
        )
        logger.info(f"Autopilot job scheduled every {interval_hours} hours.")

def get_settings_markup():
    s = settings.load_settings()
    markup = telebot.types.InlineKeyboardMarkup(row_width=2)
    
    # Toggle Autopilot
    status = "🟢 BẬT" if s.get("autopilot_enabled") else "🔴 TẮT"
    markup.add(telebot.types.InlineKeyboardButton(f"Trạng thái Autopilot: {status}", callback_data="settings_toggle_autopilot"))
    
    # Interval options
    current_interval = s.get("autopilot_interval_hours", 6)
    btn_1h = telebot.types.InlineKeyboardButton(f"{'✅ ' if current_interval == 1 else ''}1 Giờ", callback_data="settings_interval_1")
    btn_6h = telebot.types.InlineKeyboardButton(f"{'✅ ' if current_interval == 6 else ''}6 Giờ", callback_data="settings_interval_6")
    btn_12h = telebot.types.InlineKeyboardButton(f"{'✅ ' if current_interval == 12 else ''}12 Giờ", callback_data="settings_interval_12")
    btn_24h = telebot.types.InlineKeyboardButton(f"{'✅ ' if current_interval == 24 else ''}24 Giờ", callback_data="settings_interval_24")
    
    markup.add(btn_1h, btn_6h)
    markup.add(btn_12h, btn_24h)
    
    return markup

@bot.message_handler(commands=['settings'])
@require_auth
def handle_settings(message):
    bot.reply_to(message, "⚙️ **TRUNG TÂM CÀI ĐẶT (SETTINGS)**\n\nBạn có thể điều chỉnh các thiết lập hệ thống ở đây:", parse_mode="Markdown", reply_markup=get_settings_markup())

@bot.callback_query_handler(func=lambda call: call.data.startswith('settings_'))
def handle_settings_callback(call):
    s = settings.load_settings()
    data = call.data
    
    if data == "settings_toggle_autopilot":
        s["autopilot_enabled"] = not s.get("autopilot_enabled", False)
    elif data.startswith("settings_interval_"):
        hours = int(data.split("_")[-1])
        s["autopilot_interval_hours"] = hours
        
    settings.save_settings(s)
    apply_autopilot_schedule()
    
    try:
        bot.edit_message_reply_markup(chat_id=call.message.chat.id, message_id=call.message.message_id, reply_markup=get_settings_markup())
        bot.answer_callback_query(call.id, "Đã cập nhật cài đặt!")
    except Exception as e:
        bot.answer_callback_query(call.id, "Lỗi khi cập nhật!")

""")
