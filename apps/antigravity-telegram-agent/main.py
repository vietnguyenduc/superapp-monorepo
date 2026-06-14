import os
import sys

# Force stdout/stderr to UTF-8 on Windows to prevent Unicode charmap encode crashes in print or loggers
if sys.platform.startswith('win'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

import json
import logging
import threading
import time
import smtplib
import random
from email.mime.text import MIMEText
from pathlib import Path
from dotenv import load_dotenv

# Initialize logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler(Path(__file__).parent / "agent_service.log", encoding="utf-8")
    ]
)
logger = logging.getLogger("ATA")

# Load environment configuration
ENV_PATH = Path(__file__).parent / ".env"
if ENV_PATH.exists():
    load_dotenv(dotenv_path=ENV_PATH)
    logger.info(f"Loaded environment config from {ENV_PATH}")
else:
    load_dotenv() # Fallback to standard search
    logger.info("Local .env file not found. Reading environment variables directly.")

import telebot
# Import the local agent immediately to prevent cache collision with super-scraper/agent
from agent import AntigravityAgent

# Import Super Scraper Bridge namespace-safely to avoid collision with local agent.py
orig_path = list(sys.path)
orig_agent_module = sys.modules.pop('agent', None)

# Temporarily remove current directory and empty strings from sys.path
sys_paths_to_clean = ['', '.', os.path.abspath(os.path.dirname(__file__)), os.path.dirname(os.path.abspath(__file__))]
for p in sys_paths_to_clean:
    while p in sys.path:
        sys.path.remove(p)

sys.path.insert(0, r'c:\Vibecoding\superapp-monorepo\super-scraper')

try:
    from ecosystem_bridge import trigger_dynamic_crawl, fetch_proposed_schema, ask_rag_engine, clean_vault, trigger_simple_crawl
except ImportError as e:
    print("Warning: Could not import Super Scraper Bridge:", e)
finally:
    # Restore original path and modules
    sys.path = orig_path
    if orig_agent_module:
        sys.modules['agent'] = orig_agent_module

# ─── Active cancellation events per chat_id ───────────────────────────────────
# Maps chat_id -> threading.Event (set = cancel requested)
_active_cancel_events: dict = {}
_cancel_events_lock = threading.Lock()


class TelegramTypingIndicator:
    def __init__(self, bot_instance, chat_id):
        self.bot = bot_instance
        self.chat_id = chat_id
        self.stop_event = threading.Event()
        self.thread = None

    def __enter__(self):
        def loop():
            while not self.stop_event.is_set():
                try:
                    self.bot.send_chat_action(self.chat_id, 'typing')
                except Exception:
                    pass
                time.sleep(4)
        self.thread = threading.Thread(target=loop, daemon=True)
        self.thread.start()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.stop_event.set()
        if self.thread:
            self.thread.join(timeout=1.0)


import scheduler
import tools
import core.ai_router as ai_router
import core.executor as executor
import core.tunnel as tunnel
import core.memory_vault as memory_vault
import core.context_manager as context_manager
import core.vercel_parser as vercel_parser
import core.evaluator as evaluator
import core.db as db
import core.socket_server as socket_server
import core.settings as settings

bg_scheduler_instance = None
from core.telegram_utils import safe_send, send_json_result, format_markdown_tables
from core.provider_registry import get_registry
from core.budget_tracker import get_tracker


# Retrieve keys and settings
BOT_TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN")
ALLOWED_USER_ID = os.environ.get("ALLOWED_TELEGRAM_USER_ID") # Primary developer override

if not BOT_TOKEN:
    logger.critical("Error: TELEGRAM_BOT_TOKEN environment variable is missing.")
    sys.exit(1)

# Initialize Bot & Agent
bot = telebot.TeleBot(BOT_TOKEN)
agent = AntigravityAgent()
ctx_logger = context_manager.LocalNotebookContext()

# --- Login & OTP Session Management ---
import secrets
PENDING_LOGINS = {}
LOGIN_ATTEMPTS = {}
SESSION_FILE = Path(__file__).parent / "telegram_sessions.json"

def get_valid_sessions() -> dict:
    if not SESSION_FILE.exists():
        return {}
    try:
        with open(SESSION_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
            # Filter expired sessions
            now = time.time()
            return {k: v for k, v in data.items() if v.get("expires_at", 0) > now}
    except Exception as e:
        logger.error(f"Error reading sessions: {e}")
        return {}

def save_session(telegram_id: str, email: str):
    sessions = get_valid_sessions()
    sessions[str(telegram_id)] = {
        "email": email,
        "expires_at": time.time() + (30 * 24 * 3600)  # 30 days
    }
    try:
        with open(SESSION_FILE, "w", encoding="utf-8") as f:
            json.dump(sessions, f, indent=4)
    except Exception as e:
        logger.error(f"Error saving session: {e}")

def send_otp_email(to_email: str, otp: str):
    smtp_email = os.environ.get("SMTP_EMAIL")
    smtp_pass = os.environ.get("SMTP_PASSWORD")
    if not smtp_email or not smtp_pass:
        logger.warning(f"Mocking email to {to_email}. OTP: {otp} (SMTP not configured in .env)")
        return True
    try:
        msg = MIMEText(f"Mã OTP đăng nhập Telegram Admin của bạn là: {otp}\nMã này sẽ hết hạn trong 5 phút.")
        msg['Subject'] = 'Mã xác nhận Telegram Bot Admin'
        msg['From'] = smtp_email
        msg['To'] = to_email

        server = smtplib.SMTP_SSL('smtp.gmail.com', 465)
        server.login(smtp_email, smtp_pass)
        server.send_message(msg)
        server.quit()
        return True
    except Exception as e:
        logger.error(f"Error sending email: {e}")
        return False

# --- Admin Onboarding Workflows ---

@bot.message_handler(commands=['login'])
def handle_login(message):
    try:
        email = message.text.split(' ', 1)[1].strip()
    except IndexError:
        return bot.reply_to(message, "👉 Cú pháp: `/login <email_trong_supabase>`")
        
    # Rate Limiting (chống Spam Email)
    user_id = message.from_user.id
    now = time.time()
    attempts = LOGIN_ATTEMPTS.get(user_id, [])
    # Xoá các log cũ hơn 1 giờ
    attempts = [t for t in attempts if now - t < 3600]
    if len(attempts) >= 5:
        return bot.reply_to(message, "⛔ Bạn đã yêu cầu OTP quá nhiều lần. Vui lòng thử lại sau 1 giờ.")
    attempts.append(now)
    LOGIN_ATTEMPTS[user_id] = attempts
    
    # Check if email is an admin
    user = db.get_user_by_email(email)
    if not user or user.get("role") not in ["admin", "admin_company", "admin_master"]:
        return bot.reply_to(message, "⛔ Email không tồn tại hoặc không có quyền truy cập.")
        
    otp = str(secrets.randbelow(900000) + 100000)
    PENDING_LOGINS[user_id] = {
        "email": email,
        "otp": otp,
        "expires_at": time.time() + 300 # 5 mins
    }
    
    bot.reply_to(message, "⏳ Đang gửi mã OTP qua email...")
    success = send_otp_email(email, otp)
    
    if success:
        bot.reply_to(message, f"✅ Đã gửi mã OTP 6 số đến `{email}`.\nVui lòng kiểm tra email và nhập lệnh:\n`/verify <mã_otp>` (mã hết hạn sau 5 phút)", parse_mode="Markdown")
    else:
        bot.reply_to(message, "❌ Lỗi gửi email. Vui lòng kiểm tra cấu hình SMTP.")

@bot.message_handler(commands=['verify'])
def handle_verify(message):
    try:
        otp = message.text.split(' ', 1)[1].strip()
    except IndexError:
        return bot.reply_to(message, "👉 Cú pháp: `/verify <mã_otp>`")
        
    telegram_id = message.from_user.id
    pending = PENDING_LOGINS.get(telegram_id)
    
    if not pending:
        return bot.reply_to(message, "⛔ Không tìm thấy yêu cầu đăng nhập. Vui lòng gõ /login lại.")
        
    if time.time() > pending["expires_at"]:
        del PENDING_LOGINS[telegram_id]
        return bot.reply_to(message, "⛔ Mã OTP đã hết hạn. Vui lòng /login lại.")
        
    if str(pending["otp"]) != str(otp):
        return bot.reply_to(message, "⛔ Mã OTP không chính xác.")
        
    email = pending["email"]
    
    # Notify Primary Admin
    primary_id = str(ALLOWED_USER_ID).split(",")[0].strip() if ALLOWED_USER_ID else None
    if not primary_id:
        return bot.reply_to(message, "⛔ Hệ thống chưa cấu hình Primary Admin để duyệt yêu cầu.")
        
    from telebot.types import InlineKeyboardMarkup, InlineKeyboardButton
    markup = InlineKeyboardMarkup()
    markup.add(
        InlineKeyboardButton("✅ Duyệt", callback_data=f"approve_{telegram_id}"),
        InlineKeyboardButton("❌ Từ chối", callback_data=f"reject_{telegram_id}")
    )
    
    try:
        bot.send_message(
            primary_id,
            f"🔔 **YÊU CẦU ĐĂNG NHẬP MỚI**\n\n- Telegram ID: `{telegram_id}`\n- Tên: `{message.from_user.first_name}`\n- Email: `{email}`\n\nBạn có đồng ý cấp quyền truy cập Telegram Bot không?",
            parse_mode="Markdown",
            reply_markup=markup
        )
        bot.reply_to(message, "✅ Xác thực email thành công! Đang chờ Admin chính phê duyệt...")
    except Exception as e:
        logger.error(f"Error notifying primary admin: {e}")
        bot.reply_to(message, "❌ Lỗi: Không thể gửi yêu cầu phê duyệt tới Admin chính.")

@bot.callback_query_handler(func=lambda call: call.data.startswith("approve_") or call.data.startswith("reject_"))
def handle_approval_callback(call):
    primary_id = str(ALLOWED_USER_ID).split(",")[0].strip() if ALLOWED_USER_ID else None
    if str(call.from_user.id) != primary_id:
        bot.answer_callback_query(call.id, "⛔ Bạn không có quyền duyệt!")
        return
        
    action, target_id = call.data.split("_", 1)
    target_id = int(target_id)
    pending = PENDING_LOGINS.get(target_id)
    
    if not pending:
        bot.edit_message_text("⛔ Yêu cầu này đã hết hạn hoặc không tồn tại.", call.message.chat.id, call.message.message_id)
        return
        
    if action == "approve":
        email = pending["email"]
        # Link in DB
        success = db.link_telegram_id(email, str(target_id))
        if success:
            save_session(str(target_id), email)
            bot.edit_message_text(f"✅ Đã DUYỆT cho `{email}` (`{target_id}`).", call.message.chat.id, call.message.message_id, parse_mode="Markdown")
            try:
                bot.send_message(target_id, "🎉 Chúc mừng! Yêu cầu của bạn đã được phê duyệt. Bạn đã có thể bắt đầu sử dụng Bot.\nSử dụng lệnh `/manual` để xem hướng dẫn.")
            except:
                pass
        else:
            bot.edit_message_text(f"❌ Lỗi khi cập nhật database cho `{email}`.", call.message.chat.id, call.message.message_id, parse_mode="Markdown")
    elif action == "reject":
        bot.edit_message_text(f"❌ Đã TỪ CHỐI yêu cầu của `{target_id}`.", call.message.chat.id, call.message.message_id, parse_mode="Markdown")
        try:
            bot.send_message(target_id, "⛔ Yêu cầu đăng nhập của bạn đã bị từ chối bởi Admin.")
        except:
            pass
            
    # Clean up
    del PENDING_LOGINS[target_id]

# --- Super Scraper & RAG AI Commands ---

@bot.message_handler(commands=['ask'])
def handle_ask(message):
    try:
        question = message.text.split(' ', 1)[1]
    except IndexError:
        bot.reply_to(message, "Vui lòng đặt câu hỏi. VD: /ask Hà Nội có món gì ngon?")
        return
        
    bot.reply_to(message, "🔍 Đang tìm kiếm trong cơ sở dữ liệu đã cào...")
    bot.send_chat_action(message.chat.id, 'typing')
    
    def run_ask():
        try:
            with TelegramTypingIndicator(bot, message.chat.id):
                answer = ask_rag_engine(question)
            safe_send(bot, message.chat.id, answer)
        except Exception as e:
            bot.send_message(message.chat.id, f"❌ Lỗi khi trả lời: {e}")
            
    import threading
    threading.Thread(target=run_ask).start()

@bot.message_handler(commands=['crawl'])
def handle_crawl(message):
    try:
        url = message.text.split(' ', 1)[1]
    except IndexError:
        bot.reply_to(message, "Vui lòng cung cấp URL. VD: /crawl https://example.com")
        return
        
    user_id = str(message.from_user.id)
    role = get_user_role(message.from_user.id)
    is_admin = (role == "admin" or role == "admin_master" or role == "admin_company")
    
    # Run the 100% token-free simple Python crawl
    trigger_simple_crawl(url, user_id, bot, message.chat.id, is_admin=is_admin)


@bot.message_handler(commands=['crawl2'])
def handle_crawl2(message):
    try:
        url = message.text.split(' ', 1)[1]
    except IndexError:
        bot.reply_to(message, "Vui lòng cung cấp URL. VD: /crawl2 https://example.com")
        return
        
    user_id = str(message.from_user.id)
    role = get_user_role(message.from_user.id)
    is_admin = (role == "admin" or role == "admin_master" or role == "admin_company")
    
    bot.reply_to(message, "🧠 Đang kết nối Trình duyệt ảo & Thiết kế Schema AI cho dữ liệu (sẽ mất khoảng 5-15s)...")
    bot.send_chat_action(message.chat.id, 'typing')
    
    def fetch_and_ask():
        try:
            with TelegramTypingIndicator(bot, message.chat.id):
                res = fetch_proposed_schema(url, user_id)
            # Send sub-message 1: Page structural preview statistics
            try:
                bot.send_message(message.chat.id, res["preview_text"], parse_mode="Markdown")
            except Exception:
                clean_preview = res["preview_text"].replace("*", "").replace("_", "").replace("`", "")
                bot.send_message(message.chat.id, clean_preview)
            # Send sub-message 2: Proposed schema blueprint + limit question
            blueprint_text = f"🧠 **AI ĐỀ XUẤT SCHEMA CẤU TRÚC (BLUEPRINT):**\n```json\n{res['base_schema']}\n```\n\n👉 **Mục đích & Số lượng cào của bạn là gì?**\n(Ví dụ: *'Lấy 15 bài nổi bật'*, *'Cào 5 dòng về giáo dục'*, hoặc gõ *'Mặc định'* để bỏ qua và cào toàn bộ)"
            try:
                msg = bot.send_message(message.chat.id, blueprint_text, parse_mode="Markdown")
            except Exception:
                clean_blueprint = blueprint_text.replace("*", "").replace("_", "").replace("`", "")
                msg = bot.send_message(message.chat.id, clean_blueprint)
            bot.register_next_step_handler(msg, process_crawl_intent, url, user_id, is_admin)
        except Exception as e:
            bot.send_message(message.chat.id, f"❌ Lỗi trích xuất đề xuất: {e}")
        
    import threading
    threading.Thread(target=fetch_and_ask).start()

def process_crawl_intent(message, url, user_id, is_admin):
    intent = message.text
    if intent.lower() in ["mặc định", "mac dinh", "default", "skip", "bỏ qua"]:
        intent = None
        
    try:
        trigger_dynamic_crawl(url, intent, user_id, bot, message.chat.id, is_admin=is_admin)
    except Exception as e:
        bot.reply_to(message, f"Lỗi khởi động Scraper: {e}")

@bot.message_handler(commands=['clean_vault'])
def handle_clean_vault(message):
    try:
        parts = message.text.split(' ', 1)
        target = parts[1].strip() if len(parts) > 1 else "all"
    except Exception:
        target = "all"
        
    bot.reply_to(message, "🧹 Đang tiến hành dọn dẹp Kho lưu trữ dữ liệu cào (Vault)...")
    
    try:
        result_msg = clean_vault(target)
        bot.send_message(message.chat.id, result_msg, parse_mode="Markdown")
    except Exception as e:
        bot.send_message(message.chat.id, f"❌ Lỗi dọn dẹp: {e}")

# Dynamic Access Control List / Roles mapping
ROLE_PERMISSIONS = {
    "admin": ["accounting", "cashflow", "hr", "sales", "inventory", "admin"],
    "admin_master": ["accounting", "cashflow", "hr", "sales", "inventory", "admin"],
    "admin_company": ["accounting", "cashflow", "hr", "sales", "inventory", "admin"],
    "accountant": ["accounting", "cashflow"],
    "hr_manager": ["hr"],
    "sales_agent": ["sales"],
    "warehouse_keeper": ["inventory"]
}

# UAT simulation dictionary
UAT_ROLES = {}

def get_user_role(telegram_id: int):
    """Retrieves the user's role from UAT override, Supabase, or developer override."""
    # 1. Check UAT override
    if telegram_id in UAT_ROLES:
        return UAT_ROLES[telegram_id]
        
    # 2. Check primary dev override (supports comma-separated list)
    if ALLOWED_USER_ID:
        allowed_ids = [uid.strip() for uid in str(ALLOWED_USER_ID).split(",")]
        if str(telegram_id) in allowed_ids:
            return "admin"
            
    # 3. Check 30-day session expiry for secondary admins
    sessions = get_valid_sessions()
    if str(telegram_id) not in sessions:
        return None # Session expired or not logged in
        
    # 4. Check Supabase database
    user = db.get_user_by_telegram_id(str(telegram_id))
    if user:
        return user.get("role", "staff")
    return None


def check_rbac_permission(message, required_module: str) -> bool:
    """RBAC validation interceptor."""
    user_id = message.from_user.id
    role = get_user_role(user_id)
    
    if not role:
        welcome_text = (
            f"🔒 **YÊU CẦU LIÊN KẾT TÀI KHOẢN**\n\n"
            f"Tài khoản Telegram này chưa được kích hoạt trên hệ thống Superapp.\n"
            f"- **Telegram ID của bạn:** `{user_id}`\n\n"
            f"Vui lòng gửi mã số này cho Quản trị viên của bạn để được liên kết tài khoản và cấp quyền trên Admin Portal."
        )
        bot.reply_to(message, welcome_text, parse_mode="Markdown")
        return False
        
    allowed_modules = ROLE_PERMISSIONS.get(role, [])
    if required_module not in allowed_modules:
        denied_text = (
            f"⛔ **QUYỀN TRUY CẬP BỊ TỪ CHỐI**\n\n"
            f"Tài khoản của bạn (Vai trò: **{role}**) không có quyền thực hiện hành động thuộc phân hệ `{required_module.upper()}`.\n\n"
            f"Nếu đây là một sự nhầm lẫn, vui lòng liên hệ Admin để cập nhật vai trò của bạn trên Admin Portal."
        )
        bot.reply_to(message, denied_text, parse_mode="Markdown")
        return False
        
    return True

# --- 1. Welcome and Help Commands ---

@bot.message_handler(commands=['start', 'help'])
def send_welcome(message):
    user_id = message.from_user.id
    role = get_user_role(user_id)
    
    if role not in ["admin", "admin_master", "admin_company"]:
        bot.reply_to(message, "🔒 **YÊU CẦU LIÊN KẾT TÀI KHOẢN DEVELOPER**\n\nTài khoản của bạn chưa được phân quyền Quản trị/Developer trên hệ thống Antigravity.")
        return

    active_project = agent.get_active_project() or "Chưa chọn"

    welcome_text = (
        f"🛸 **ANTIGRAVITY REMOTE DEVELOPER PORTAL** 🛸\n"
        f"Chào mừng Tech Lead & Architect quay trở lại! Bạn có toàn quyền điều khiển CLI và mã nguồn.\n\n"
        f"📂 **Tiêu điểm dự án**: `{active_project.upper()}`\n\n"
        f"🤖 **HƯỚNG DẪN VIBE CODING TỪ XA**:\n"
        f"- Bạn chỉ cần **nhắn tin trực tiếp bằng ngôn ngữ tự nhiên** để ra lệnh cho Agent. Ví dụ:\n"
        f"  * \"Hãy liệt kê cấu trúc thư mục hiện tại\"\n"
        f"  * \"Fix lỗi giao diện căn lề trong index.css\"\n"
        f"  * \"Push tất cả thay đổi hiện tại lên git với thông điệp refactor bot\"\n"
        f"  * \"Deploy phiên bản mới lên Vercel\"\n\n"
        f"⚙️ **CÁC LỆNH ĐIỀU KHIỂN & CLI**:\n"
        f"1️⃣ `/settings` - Bảng điều khiển trung tâm (Bật/Tắt Autopilot).\n"
        f"2️⃣ `/manual` (hoặc `/guide`) - Xem chi tiết hướng dẫn sử dụng toàn tập.\n"
        f"3️⃣ `/apps` - Thay đổi tiêu điểm ứng dụng trong monorepo.\n"
        f"4️⃣ `/model <name>`, `/pro`, `/claude`, `/nvidia` - Quản lý mô hình AI.\n"
        f"5️⃣ `/crawl <URL>`, `/crawl2 <URL>` - Cào dữ liệu web cơ bản & nâng cao.\n"
        f"6️⃣ `/ask <câu hỏi>`, `/clean_vault` - Truy vấn & quản lý kho RAG.\n"
        f"7️⃣ `/check-rules` - Xem System Rules & Context hiện tại của bot.\n"
        f"8️⃣ `/vault`, `/tunnel`, `/git`, `/deploy`, `/status` - Xem thông tin hệ thống (File/Network/Git/Cloud).\n"
        f"9️⃣ `/awake`, `/restart` - Quản lý Local Dev Server & Ngrok Tunnel.\n"
        f"🔟 `/task_status (ts)`, `/clear_task (ct)` - Quản lý Task Journal chạy dài.\n"
        f"1️⃣1️⃣ `/run <cmd>` - Chạy trực tiếp PowerShell command trên host.\n"
        f"1️⃣2️⃣ `/reboot`, `/botstat`, `/killbot` - Khởi động lại bot và quản lý Python process.\n"
        f"1️⃣3️⃣ `/session` - Xem trạng thái context budget và lịch sử nén session.\n"
        f"1️⃣4️⃣ `/compress` - 🗜️ Nén context thủ công (emergency escape khi budget > 80%).\n\n"
        f"🚀 **(MỚI) TÍNH NĂNG TỰ TRỊ (AGENTIC & ORCHESTRATION)**:\n"
        f"🔹 `/autopilot` - Quản lý trong `/settings`. Tự trị quét lỗi định kỳ.\n"
        f"🔹 `/goal <yêu cầu>` - Tự trị 100%: Chạy liên tục, tự fix lỗi đến khi đạt mục tiêu lớn (không ngắt quãng).\n"
        f"🔹 `/teamwork-preview <yêu cầu>` - Multi-agent: Kêu gọi các sub-agent chia việc và xử lý song song dự án lớn.\n"
        f"🔹 `/schedule <nhiệm vụ>` - Lên lịch hẹn giờ hoặc định kỳ (cron) thực hiện task.\n"
        f"🔹 `/browser <yêu cầu>` - Mở trình duyệt ẩn để search thông tin, đọc docs hoặc thao tác web tự động.\n"
        f"🔹 `/grill-me <chủ đề>` - Bật chế độ 'phỏng vấn', AI sẽ hỏi sâu để chốt design/plan trước khi code."
    )
    bot.reply_to(message, welcome_text, parse_mode="Markdown")


@bot.message_handler(commands=['manual', 'guide'])
def send_manual(message):
    user_id = message.from_user.id
    role = get_user_role(user_id)
    if role not in ["admin", "admin_master", "admin_company"]:
        bot.reply_to(message, "⛔ Access Denied.")
        return

    manual_text = (
        f"📖 **BÍ KÍP LÀM CHỦ ANTIGRAVITY AGENT (TINH HOA ĐIỀU PHỐI AI)**\n\n"
        f"Chào mừng bạn đến với Kỷ nguyên Tự trị (Agentic Era). Đây không phải là một con Chatbot trả lời câu hỏi, đây là một **Senior Software Engineer & Tech Lead** thực thụ đang ngồi trong server của bạn.\n\n"
        f"💡 **TƯ DUY CỐT LÕI (THE MINDSET)**\n"
        f"Đừng dùng bot như Google. Hãy **GIAO VIỆC** (Delegate). Hãy nói cho bot biết **MỤC TIÊU CUỐI CÙNG**, bot sẽ tự phân rã (Breakdown), tự code (Execute), tự kiểm tra (Test) và tự sửa lỗi (Self-heal).\n\n"
        
        f"🔥 **8 LỆNH QUYỀN NĂNG NHẤT BẠN PHẢI BIẾT:**\n\n"
        
        f"🎯 **1. `/goal` (Chế Độ Cắm Máy - Tự trị 100%)**\n"
        f"• **Tinh hoa**: Thay vì ra lệnh từng bước và phải gõ 'tiếp tục' 50 lần, `/goal` ép bot thề không dừng lại cho đến khi xong việc. Nó sẽ tự fix bug, tự tìm file, tự google nếu bí. Dành cho các Epic Task lớn.\n"
        f"• **Ví dụ**: `/goal Clone giao diện trang web apple.com bằng Tailwind và lưu vào thư mục frontend.`\n\n"
        
        f"🗣️ **2. `/grill-me` (Kiến Trúc Sư Phản Biện)**\n"
        f"• **Tinh hoa**: Đừng bao giờ code mù! Gõ lệnh này, bot sẽ đóng vai Tech Lead khó tính, vặn vẹo bạn bằng 3-5 câu hỏi hóc búa về quy mô, database, edge cases... Trả lời xong, bot sẽ tự ra `/plan` hoàn hảo.\n"
        f"• **Ví dụ**: `/grill-me Mình muốn xây dựng hệ thống thanh toán Subscription như Netflix.`\n\n"
        
        f"👥 **3. `/teamwork-preview` (Thuật Phân Thân - Multi-Agent)**\n"
        f"• **Tinh hoa**: Khi dự án quá lớn, 1 Agent dễ bị 'ngợp' Context. Lệnh này ép Agent chính lùi lại làm Project Manager, phân chia task cho các Sub-Agent (Frontend, Backend) làm song song.\n"
        f"• **Ví dụ**: `/teamwork-preview Xây tính năng đăng nhập SSO Google. Cần 1 API supabase và 1 nút React.`\n\n"
        
        f"🌐 **4. `/browser` (Đôi Mắt Trực Tuyến - Playwright E2E)**\n"
        f"• **Tinh hoa**: Bot có khả năng mở Google Chrome ẩn, đọc Docs mới nhất (vì data AI thường cũ) hoặc thao tác click vào UI để test lỗi giao diện thay vì đoán mò.\n"
        f"• **Ví dụ**: `/browser Truy cập docs của React 19 và tóm tắt những thay đổi về Hook mới nhất.`\n\n"
        
        f"⏰ **5. `/schedule` (Lập Lịch Định Kỳ - Cronjob)**\n"
        f"• **Tinh hoa**: Biến bot thành quản gia. Bạn có thể hẹn giờ để bot chạy test, kiểm tra log lỗi, hoặc cào dữ liệu định kỳ.\n"
        f"• **Ví dụ**: `/schedule 3600 (Hẹn sau 1 tiếng) Chạy test toàn bộ app và báo cáo lỗi nếu có.`\n\n"
        
        f"🗺️ **6. `/plan` (Chế độ Phác Thảo Cẩn Thận)**\n"
        f"• **Tinh hoa**: Bot sẽ không code mà chỉ dùng `read_file` để rà soát toàn bộ project, sau đó xuất ra file `implementation_plan.md` để bạn duyệt trước khi nó xuống tay.\n"
        f"• **Ví dụ**: `/plan Nghiên cứu codebase hiện tại và đề xuất cách tối ưu tốc độ load.`\n\n"
        
        f"🧠 **7. `/session` (Giám sát Não Bộ - Quản lý Context)**\n"
        f"• **Tinh hoa**: Cung cấp cái nhìn trực quan (Progress Bar) về bộ nhớ Token đang bị chiếm dụng. Biết được khi nào não bot sắp 'đầy' để chuẩn bị nén.\n"
        f"• **Ví dụ**: Gõ `/session` để xem bot đang tải bao nhiêu phần trăm ngân sách (Budget).\n\n"

        f"🗜️ **8. `/compress` (Giải Phóng Ký Ức - Khẩn Cấp)**\n"
        f"• **Tinh hoa**: Khi bot bắt đầu có dấu hiệu bị kẹt vòng lặp hoặc lặp lại câu trả lời (do context > 80%), lệnh này ép bot DỪNG LẠI, tóm tắt toàn bộ lịch sử thành 1 đoạn ngắn gọn và ném bỏ rác, giúp não bộ nhẹ nhàng và minh mẫn trở lại.\n"
        f"• **Ví dụ**: Gõ `/compress` ngay khi thấy bot nói nhảm.\n\n"

        f"⚠️ **MẸO VÀNG CHO NEWBIE:**\n"
        f"1. Dùng lệnh `/apps` để trỏ bot vào đúng dự án trước khi ra lệnh.\n"
        f"2. Nếu bot làm sai, đừng chửi nó. Hãy gõ: `Bạn đang bị lỗi X ở file Y, dùng /browser để tra cứu lại docs đi`.\n"
        f"3. Tận dụng tối đa `/grill-me` cho ý tưởng mới và `/goal` cho công việc nhàm chán!"
    )
    bot.reply_to(message, manual_text, parse_mode="Markdown")


@bot.message_handler(commands=['awake'])
def handle_awake(message):
    user_id = message.from_user.id
    role = get_user_role(user_id)
    if role not in ["admin", "admin_master", "admin_company"]:
        bot.reply_to(message, "⛔ Access Denied.")
        return
        
    active_project = agent.get_active_project() or "default"
    if active_project == "default":
        bot.reply_to(message, "⚠️ Vui lòng chọn ứng dụng trước bằng lệnh `/apps`.")
        return
        
    # Load configuration
    settings_file = Path(__file__).parent / "config" / "settings.json"
    apps = []
    if settings_file.exists():
        try:
            config = json.loads(settings_file.read_text(encoding="utf-8"))
            apps = config.get("apps", [])
        except Exception:
            pass
            
    app_meta = next((a for a in apps if a.get("name") == active_project), None)
    if not app_meta:
        bot.reply_to(message, f"❌ Không tìm thấy thông tin App '{active_project}' trong `settings.json`.")
        return
        
    port = app_meta.get("port", 3000)
    tech = app_meta.get("tech", "React")
    
    bot.reply_to(message, f"⚡ **Waking up {active_project.upper()} ({tech}) on port {port}...**\nKiểm tra và dọn dẹp port cũ...")
    
    # 1. Kill old process on port
    tools.kill_port(port)
    time.sleep(1.5)
    
    # 2. Start dev server in background forcing the correct port configured in settings.json
    if tech == "React":
        # Force Vite to run on the configured port
        cmd = f"npx vite --port {port} --host"
    elif tech == "Next.js":
        # Force Next.js to run on the configured port
        cmd = f"npx next dev -p {port}"
    elif tech == "Python/Playwright":
         cmd = "python main.py"
    else:
         cmd = f"npm run dev -- --port {port}"
         
    tools.run_background_server(cmd)
    
    # Wait a bit for server to boot up
    time.sleep(3.5)
    
    # 3. Recycle tunnel and start ngrok on port
    tunnel.disconnect_all_tunnels()
    time.sleep(1.5)
    public_url = tunnel.start_tunnel_for_port(port)
    
    # Get tailscale status
    ts_status = tunnel.get_tailscale_status()
    
    # Prepare inline button webview or link
    markup = telebot.types.InlineKeyboardMarkup()
    is_valid_url = isinstance(public_url, str) and (public_url.startswith("http://") or public_url.startswith("https://"))
    if is_valid_url:
        btn_link = telebot.types.InlineKeyboardButton("🌐 Mở Online (Ngrok)", url=public_url)
        btn_webview = telebot.types.InlineKeyboardButton("📱 Telegram Web App", web_app=telebot.types.WebAppInfo(url=public_url))
        markup.add(btn_link, btn_webview)
    
    welcome_text = (
        f"🚀 **ỨNG DỤNG ĐÃ THỨC TỈNH THÀNH CÔNG!**\n\n"
        f"- **Ứng dụng**: `{active_project.upper()}` ({tech})\n"
        f"- **Port cục bộ**: `{port}`\n"
        f"- **Ngrok Tunnel**: {public_url if is_valid_url else f'`{public_url}`'}\n"
        f"- **Trạng thái**: Đang chạy ngầm (`{cmd}`)\n\n"
        f"ℹ️ **Mạng nội bộ (Tailscale)**:\n`{ts_status}`\n\n"
        f"Bạn có thể mở ứng dụng ngay lập tức dưới dạng Web App trực tiếp trên Telegram hoặc nhấp vào link trình duyệt bên dưới!"
    )
    safe_send(bot, message.chat.id, welcome_text, reply_markup=markup, parse_mode="Markdown")


@bot.message_handler(commands=['restart'])
def handle_restart(message):
    user_id = message.from_user.id
    role = get_user_role(user_id)
    if role not in ["admin", "admin_master", "admin_company"]:
        bot.reply_to(message, "⛔ Access Denied.")
        return
        
    active_project = agent.get_active_project() or "default"
    if active_project == "default":
        bot.reply_to(message, "⚠️ Vui lòng chọn ứng dụng trước bằng lệnh `/apps`.")
        return
        
    settings_file = Path(__file__).parent / "config" / "settings.json"
    apps = []
    if settings_file.exists():
        try:
            config = json.loads(settings_file.read_text(encoding="utf-8"))
            apps = config.get("apps", [])
        except Exception:
            pass
            
    app_meta = next((a for a in apps if a.get("name") == active_project), None)
    if not app_meta:
        bot.reply_to(message, f"❌ Không tìm thấy thông tin App '{active_project}'.")
        return
        
    port = app_meta.get("port", 3000)
    tech = app_meta.get("tech", "React")
    
    bot.reply_to(message, f"🔄 **Recycling/Restarting {active_project.upper()} local server...**")
    
    # Kill the port process
    tools.kill_port(port)
    time.sleep(1.5)
    
    # Restart the background dev server
    cmd = "npm run dev"
    if tech == "Python/Playwright":
         cmd = "python main.py"
    tools.run_background_server(cmd)
    
    time.sleep(2.5)
    
    bot.reply_to(
        message, 
        f"✅ **Đã restart Local Dev Server cho `{active_project.upper()}`!**\n"
        f"Các thay đổi code mới nhất đã được apply thành công lên localhost:{port}.\n"
        f"Đường truyền Ngrok/Tailscale của bạn vẫn được giữ nguyên không thay đổi."
    )


@bot.message_handler(commands=['tunnel'])
def handle_tunnel_cmd(message):
    user_id = message.from_user.id
    role = get_user_role(user_id)
    if role not in ["admin", "admin_master", "admin_company"]:
        bot.reply_to(message, "⛔ Access Denied.")
        return
        
    bot.send_chat_action(message.chat.id, 'typing')
    url = tunnel.get_ngrok_url()
    ts_status = tunnel.get_tailscale_status()
    
    resp = (
        f"🌐 **TRẠNG THÁI ĐƯỜNG TRUYỀN REMOTE**\n\n"
        f"🟢 **Ngrok Tunnel URL**:\n{url}\n\n"
        f"🛜 **Tailscale Status**:\n`{ts_status}`\n\n"
        f"💡 *Mẹo: Sử dụng `/awake` để tự động tái tạo tunnel cho ứng dụng hiện tại.*"
    )
    bot.reply_to(message, resp, parse_mode="Markdown")


@bot.message_handler(commands=['vault'])
def handle_vault_cmd(message):
    user_id = message.from_user.id
    role = get_user_role(user_id)
    if role not in ["admin", "admin_master", "admin_company"]:
        bot.reply_to(message, "⛔ Access Denied.")
        return
        
    active_project = agent.get_active_project() or "default"
    vault_dir, _ = agent.get_project_paths(active_project)
    
    files = list(vault_dir.glob("*"))
    
    resp = (
        f"📁 **RESEARCH VAULT CONTEXT: {active_project.upper()}**\n"
        f"Thư mục: `{vault_dir.relative_to(Path(__file__).parent).as_posix()}`\n\n"
    )
    
    if not files:
        resp += "❌ Thư mục vault hiện đang trống.\n"
    else:
        resp += "**Danh sách tài liệu lập chỉ mục (NotebookLM Context)**:\n"
        for f in files:
            size_kb = f.stat().st_size / 1024
            resp += f"- `{f.name}` ({size_kb:.1f} KB)\n"
            
    bot.reply_to(message, resp, parse_mode="Markdown")


@bot.message_handler(commands=['export_vault'])
def handle_export_vault_cmd(message):
    user_id = message.from_user.id
    role = get_user_role(user_id)
    if role not in ["admin", "admin_master", "admin_company"]:
        bot.reply_to(message, "⛔ Access Denied.")
        return
        
    bot.reply_to(message, "🔄 Đang xuất toàn bộ tri thức & lịch sử chat để đồng bộ với Google NotebookLM...")
    
    def run_export():
        try:
            from core.memory_vault import export_notebooklm_knowledge_base
            compiled_file = export_notebooklm_knowledge_base()
            resp_msg = (
                f"✅ **ĐỒNG BỘ TRI THỨC HOÀN TẤT!**\n\n"
                f"Đã xuất dữ liệu tổng hợp tại:\n"
                f"`{compiled_file.resolve().as_posix()}`\n\n"
                f"💡 **Cách sử dụng với Google NotebookLM:**\n"
                f"1. Tải tệp tin này lên Notebook của bạn trên Google NotebookLM.\n"
                f"2. Hoặc cấu hình thư mục `notebooklm_sync` để tự động đồng bộ lên thư mục Google Drive của bạn (NotebookLM sẽ tự động nhận cập nhật)."
            )
            bot.send_message(message.chat.id, resp_msg, parse_mode="Markdown")
        except Exception as e:
            bot.send_message(message.chat.id, f"❌ Thất bại khi xuất tri thức: {e}")
            
    threading.Thread(target=run_export).start()



@bot.message_handler(commands=['check-rules', 'check_rules'])
def handle_check_rules(message):
    user_id = message.from_user.id
    role = get_user_role(user_id)
    if role not in ["admin", "admin_master", "admin_company"]:
        bot.reply_to(message, "⛔ Access Denied.")
        return
        
    resp = (
        f"🛡️ **PRE-FLIGHT INSPECTION & RULE PREVIEW**\n\n"
        f"**1. Active System Rules**:\n"
        f"- Mandatory 3-tier pipeline enforcement: `[System Rules] -> [Memories] -> [Global Vault]`\n"
        f"- Active Logging & Knowledge Extraction enabled (`vault/lessons_learned.md`)\n"
        f"- Global Registry Map awareness enabled\n\n"
        f"**2. Context & Memories**:\n"
        f"- You are communicating with the Core Governance AI Engine.\n\n"
        f"**3. Global Vault Data**:\n"
        f"- Tracks 11 Apps and 9 Shared Packages within `superapp-monorepo`.\n\n"
        f"✅ *Pipeline validated. Ready for execution.*"
    )
    bot.reply_to(message, resp, parse_mode="Markdown")


@bot.message_handler(commands=['git'])
def handle_git_cmd(message):
    user_id = message.from_user.id
    role = get_user_role(user_id)
    if role not in ["admin", "admin_master", "admin_company"]:
        bot.reply_to(message, "⛔ Access Denied.")
        return
        
    bot.send_chat_action(message.chat.id, 'typing')
    
    # Run git status and branch check
    status_out = tools.execute_command("git status -s")
    branch_out = tools.execute_command("git branch --show-current")
    
    resp = (
        f"🐙 **TRẠNG THÁI HỆ THỐNG GITHUB**\n\n"
        f"**Branch hiện tại**: `{branch_out.strip()}`\n\n"
        f"**Tệp tin thay đổi (git status)**:\n```\n{status_out.strip()}\n```\n\n"
        f"💡 *Để commit từ xa, bạn chỉ cần gõ lời nhắn chat tự nhiên yêu cầu Agent commit và push lên Git.*"
    )
    bot.reply_to(message, resp, parse_mode="Markdown")


@bot.message_handler(commands=['deploy'])
def handle_deploy_cmd(message):
    user_id = message.from_user.id
    role = get_user_role(user_id)
    if role not in ["admin", "admin_master", "admin_company"]:
        bot.reply_to(message, "⛔ Access Denied.")
        return
        
    active_project = agent.get_active_project() or "default"
    bot.reply_to(
        message,
        f"☁️ **VERCEL DEPLOYMENT STATUS**\n\n"
        f"- **Ứng dụng tiêu điểm**: `{active_project.upper()}`\n"
        f"- **Môi trường**: Production Cloud (Vercel)\n"
        f"- **Đường dẫn deploy**: `https://{active_project}.vercel.app`\n\n"
        f"💡 *Bạn có thể yêu cầu Agent deploy lên Vercel bằng cách chat tự nhiên.*"
    )


@bot.message_handler(commands=['run'])
def handle_run_cmd(message):
    user_id = message.from_user.id
    role = get_user_role(user_id)
    if role not in ["admin", "admin_master", "admin_company"]:
        bot.reply_to(message, "⛔ Access Denied.")
        return
        
    try:
        cmd = message.text.split(' ', 1)[1]
    except IndexError:
        bot.reply_to(message, "⚠️ Sử dụng: `/run <câu_lệnh_powershell>`\nVí dụ: `/run dir`", parse_mode="Markdown")
        return
        
    bot.reply_to(message, f"💻 **Đang chạy lệnh**: `{cmd}`...")
    bot.send_chat_action(message.chat.id, 'typing')
    
    out = tools.execute_command(cmd)
    safe_send(bot, message.chat.id, f"```\n{out}\n```")


@bot.message_handler(commands=['apps'])
def list_apps_switcher(message):
    if not check_rbac_permission(message, "admin"):
        return
        
    settings_file = Path(__file__).parent / "config" / "settings.json"
    apps = []
    if settings_file.exists():
        try:
            config = json.loads(settings_file.read_text(encoding="utf-8"))
            apps = config.get("apps", [])
        except Exception as e:
            logger.error(f"Error reading apps from settings: {e}")
            
    if not apps:
        bot.reply_to(message, "❌ No applications mapped in `settings.json` under `apps` array.")
        return
        
    active_project = agent.get_active_project() or "default"
    markup = telebot.types.InlineKeyboardMarkup(row_width=2)
    
    buttons = []
    for app in apps:
        name = app.get("name")
        tech = app.get("tech", "React")
        label = f"📁 {name} ({tech})"
        buttons.append(telebot.types.InlineKeyboardButton(label, callback_data=f"switch_app:{name}"))
        
    markup.add(*buttons)
    bot.reply_to(
        message, 
        f"🌐 **Vibe-Gate Switchboard**\n\n"
        f"Select an app below to switch project workspace focus and automatically recycle your Ngrok tunnel:",
        reply_markup=markup,
        parse_mode="Markdown"
    )

@bot.callback_query_handler(func=lambda call: call.data.startswith("switch_app:"))
def handle_switch_app_callback(call):
    """Processes app switching and Vercel URL extraction."""
    role = get_user_role(call.from_user.id)
    if role not in ["admin", "admin_master", "admin_company"]:
        bot.answer_callback_query(call.id, "⛔ Bạn không có quyền truy cập.")
        return
            
    target_app = call.data.split(":", 1)[1]
    bot.answer_callback_query(call.id, f"📁 Chuyển tiêu điểm: {target_app}...")
    
    settings_file = Path(__file__).parent / "config" / "settings.json"
    apps = []
    if settings_file.exists():
        try:
            config = json.loads(settings_file.read_text(encoding="utf-8"))
            apps = config.get("apps", [])
        except Exception:
            pass
            
    app_meta = next((a for a in apps if a.get("name") == target_app), None)
    if not app_meta:
        bot.answer_callback_query(call.id, f"❌ Không tìm thấy thông tin App '{target_app}'.")
        return
        
    production_url = app_meta.get("production_url", f"https://{target_app}.vercel.app")
    tech = app_meta.get("tech", "React")
    
    # Save the active project focus to state file
    state_file = Path(__file__).parent / "active_project.json"
    try:
        state_file.write_text(json.dumps({"active_project": target_app}), encoding="utf-8")
    except Exception as e:
        logger.error(f"Failed to save active project state: {e}")
        
    # Check current port activity and ngrok tunnel
    port = app_meta.get("port", 3000)
    port_active = tunnel.is_port_active(port)
    active_tunnel = tunnel.get_active_tunnel_for_port(port) if port_active else None
    
    # Prepare inline buttons and dynamic text
    markup = telebot.types.InlineKeyboardMarkup()
    btn_cloud = telebot.types.InlineKeyboardButton("☁️ Vercel Link", url=production_url) if production_url else None
    
    if port_active and active_tunnel:
        status_text = (
            f"🟢 **TRẠNG THÁI: ĐANG CHẠY & ONLINE!**\n"
            f"• Dev Server đang hoạt động tại port `{port}`.\n"
            f"• Ngrok Tunnel hoạt động: `{active_tunnel}`\n\n"
            f"👉 Ứng dụng đã chạy sẵn qua `run_apps.bat` hoặc tiến trình ngầm! Bạn có thể mở ngay dưới dạng Web App trực tiếp trên Telegram hoặc nhấp vào link trình duyệt bên dưới."
        )
        btn_link = telebot.types.InlineKeyboardButton("🌐 Mở Online (Ngrok)", url=active_tunnel)
        btn_webview = telebot.types.InlineKeyboardButton("📱 Telegram Web App", web_app=telebot.types.WebAppInfo(url=active_tunnel))
        markup.add(btn_link, btn_webview)
        if btn_cloud:
            markup.add(btn_cloud)
    elif port_active:
        status_text = (
            f"🟡 **TRẠNG THÁI: ĐANG CHẠY CỤC BỘ (CHƯA CÓ TUNNEL)**\n"
            f"• Dev Server đang hoạt động tại port `{port}` nhưng chưa được ánh xạ Ngrok Tunnel.\n\n"
            f"👉 Bạn có muốn **kết nối Remote Tunnel** ngay bây giờ để xem online không?"
        )
        btn_awake = telebot.types.InlineKeyboardButton("⚡ Kết nối Ngrok Tunnel", callback_data="awake_active_project")
        if btn_cloud:
            markup.add(btn_awake, btn_cloud)
        else:
            markup.add(btn_awake)
    else:
        status_text = (
            f"🔴 **TRẠNG THÁI: ĐANG TẮT**\n"
            f"• Dev Server tại port `{port}` đang tắt.\n\n"
            f"👉 Bạn có muốn **thức tỉnh (awake)** dự án này ngay lập tức để khởi chạy server cục bộ và liên kết Remote Tunnel không?"
        )
        btn_awake = telebot.types.InlineKeyboardButton("⚡ Awake Project (Khởi động Dev)", callback_data="awake_active_project")
        if btn_cloud:
            markup.add(btn_awake, btn_cloud)
        else:
            markup.add(btn_awake)
        
    bot.edit_message_text(
        chat_id=call.message.chat.id,
        message_id=call.message.message_id,
        text=f"✨ **ĐÃ CHUYỂN TIÊU ĐIỂM DỰ ÁN THÀNH CÔNG!**\n\n"
             f"- **Ứng dụng hiện tại**: `{target_app.upper()}` ({tech})\n"
             f"- **Môi trường**: Local & Production\n\n"
             f"{status_text}",
        reply_markup=markup,
        parse_mode="Markdown"
    )

@bot.callback_query_handler(func=lambda call: call.data == "awake_active_project")
def handle_awake_callback(call):
    bot.answer_callback_query(call.id, "⚡ Waking up active project...")
    # Safely reuse the genuine Message object with customized context fields
    msg = call.message
    msg.from_user = call.from_user
    msg.text = "/awake"
    handle_awake(msg)

@bot.callback_query_handler(func=lambda call: call.data == "rag_search_init")
def handle_rag_search_callback(call):
    bot.answer_callback_query(call.id)
    msg = bot.send_message(
        call.message.chat.id,
        "🔍 **TRUY VẤN AI TRÊN DỮ LIỆU ĐÃ CÀO**\n\n"
        "Hãy nhập câu hỏi hoặc chủ đề bạn muốn tìm kiếm (ví dụ: *'Tìm các món ăn tiêu biểu'*, *'Tóm tắt các bài viết chính'*):",
        parse_mode="Markdown"
    )
    bot.register_next_step_handler(msg, process_rag_search_input)

def process_rag_search_input(message):
    question = message.text
    if question.startswith('/'):
        bot.reply_to(message, "⚠️ Đã hủy truy vấn nhanh để thực hiện lệnh hệ thống mới.")
        return
        
    bot.reply_to(message, "🧠 AI đang truy vấn dữ liệu thô và suy luận câu trả lời...")
    
    def run_query():
        try:
            from ecosystem_bridge import ask_rag_engine
            res_dict = ask_rag_engine(question)
            answer = res_dict.get("answer", "")
            images = res_dict.get("images", [])
            
            # Send result text with "Ask again" button
            markup = telebot.types.InlineKeyboardMarkup()
            btn_again = telebot.types.InlineKeyboardButton(text="🔍 Tiếp tục hỏi AI câu khác", callback_data="rag_search_init")
            markup.add(btn_again)
            
            bot.send_message(message.chat.id, answer, reply_markup=markup, parse_mode="Markdown")
            
            if images:
                bot.send_message(message.chat.id, f"📸 **PHÁT HIỆN {len(images)} HÌNH ẢNH CHẤT LƯỢNG CAO PHÙ HỢP CHỦ ĐỀ:**")
                media_group = []
                for idx, img in enumerate(images[:10]):
                    caption = f"🖼️ {img['title']}\n🔗 Link: {img['source']}"
                    caption = caption[:1000]
                    media_group.append(telebot.types.InputMediaPhoto(img['url'], caption=caption))
                
                if media_group:
                    try:
                        bot.send_media_group(message.chat.id, media_group)
                    except Exception as media_err:
                        for img in images[:3]:
                            try:
                                bot.send_photo(message.chat.id, img['url'], caption=f"🖼️ {img['title']}\n🔗 Link: {img['source']}")
                            except Exception:
                                pass
        except Exception as e:
            bot.send_message(message.chat.id, f"❌ Lỗi truy vấn AI: {e}")
            
    import threading
    threading.Thread(target=run_query).start()


# --- Keep existing document uploads ---

@bot.message_handler(content_types=['document'])
def handle_document(message):
    user_id = message.from_user.id
    role = get_user_role(user_id)
    if not role:
        bot.reply_to(message, "⛔ Access Denied.")
        return
        
    try:
        file_info = bot.get_file(message.document.file_id)
        downloaded_file = bot.download_file(file_info.file_path)
        filename = message.document.file_name
        
        # Save to projects vault based on active configuration
        active_project = agent.get_active_project() or "default"
        path = agent.add_to_vault(filename, downloaded_file, active_project)
        
        bot.reply_to(
            message,
            f"✅ **Tài liệu đã nhận và tự động lập chỉ mục!**\n"
            f"Đã lưu vào thư mục `vault` của `{active_project}`.\n"
            f"Hệ thống sẽ tự động đối chiếu hóa đơn và phân tích dữ liệu dựa trên tệp tin này.",
            parse_mode="Markdown"
        )
    except Exception as e:
        logger.error(f"Error downloading document: {e}", exc_info=True)
        bot.reply_to(message, f"❌ Failed to process document: {str(e)}")

@bot.message_handler(commands=['task_status', 'ts'])
def handle_task_status(message):
    """Show the current persistent task journal state."""
    if not check_rbac_permission(message, "admin"):
        return
    try:
        from core.task_state import get_task_state
        active_project = agent.get_active_project() or "default"
        project_dir = Path(__file__).parent / "projects" / active_project
        ts = get_task_state(active_project, project_dir)
        if ts.is_active():
            summary = ts.get_state_summary()
            context = ts.get_context_for_continuation()
            safe_send(bot, message.chat.id, f"📋 *Task Journal — {active_project}*\n\n{summary}\n\n```\n{context[:2000]}\n```")
        else:
            bot.reply_to(message, f"✅ *No active task* in project `{active_project}`.\nTask journal is clear — bot is ready for new instructions.", parse_mode="Markdown")
    except Exception as e:
        bot.reply_to(message, f"❌ Error reading task state: {e}")


@bot.message_handler(commands=['clear_task', 'ct'])
def handle_clear_task(message):
    """Clear the persistent task journal to start fresh."""
    if not check_rbac_permission(message, "admin"):
        return
    try:
        from core.task_state import get_task_state
        active_project = agent.get_active_project() or "default"
        project_dir = Path(__file__).parent / "projects" / active_project
        ts = get_task_state(active_project, project_dir)
        ts.clear()
        bot.reply_to(message, f"🗑️ *Task journal cleared* for project `{active_project}`.\nBot will start fresh on next message — no previous step context will be injected.", parse_mode="Markdown")
    except Exception as e:
        bot.reply_to(message, f"❌ Error clearing task state: {e}")


@bot.message_handler(commands=['compress'])
def handle_compress(message):
    """Manually trigger context compression — emergency escape hatch."""
    if not check_rbac_permission(message, "admin"):
        return
    try:
        from core.session_manager import get_session_manager, invalidate_session_manager
        active_project = agent.get_active_project() or "default"
        _, history_file = agent.get_project_paths(active_project)

        # Load current history
        history = []
        if history_file.exists():
            try:
                history = json.loads(history_file.read_text(encoding="utf-8"))
            except Exception:
                pass

        if not history:
            bot.reply_to(message, "⚠️ Không có conversation history để nén.", parse_mode="Markdown")
            return

        bot.reply_to(message, f"🗜️ *Đang nén {len(history)} turns...* (có thể mất 15-30 giây)", parse_mode="Markdown")

        session_mgr = get_session_manager(history_file, active_project)
        result_text = session_mgr.manual_compress(history)

        # Save compressed history (only keep recent turns)
        from core.session_manager import KEEP_RECENT_TURNS
        compressed_history = history[-KEEP_RECENT_TURNS:] if len(history) > KEEP_RECENT_TURNS else history
        try:
            history_file.write_text(
                json.dumps(compressed_history, ensure_ascii=False, indent=2),
                encoding="utf-8"
            )
        except Exception as save_err:
            logger.error(f"Error saving compressed history: {save_err}")

        # Invalidate cached session manager so next turn gets fresh state
        invalidate_session_manager(history_file)

        safe_send(bot, message.chat.id, result_text)
    except Exception as e:
        logger.error(f"Error in /compress handler: {e}", exc_info=True)
        bot.reply_to(message, f"❌ Lỗi khi nén context: {e}")


@bot.message_handler(commands=['session'])
def handle_session_status(message):
    """Show current context session status and compression stats."""
    if not check_rbac_permission(message, "admin"):
        return
    try:
        from core.session_manager import get_session_manager, estimate_budget, CONTEXT_LIMIT_TOKENS
        active_project = agent.get_active_project() or "default"
        _, history_file = agent.get_project_paths(active_project)

        # Load current history
        history = []
        if history_file.exists():
            try:
                history = json.loads(history_file.read_text(encoding="utf-8"))
            except Exception:
                pass

        session_mgr = get_session_manager(history_file, active_project)

        # Rough estimate of current budget
        _, _, pct_used = estimate_budget(
            system_instruction="",
            vault_context="",
            memories_context="",
            continuation_context="",
            workspace_cwd_note="",
            history=history,
            user_message="",
            handoff_summary=session_mgr.meta.handoff_summary,
        )

        status_text = session_mgr.get_status_text(pct_used)
        history_info = (
            f"\n\n📜 *Conversation History*\n"
            f"  • Turns in memory: {len(history)}\n"
            f"  • Turns in compressed summary: {session_mgr.meta.handoff_summary_turns}\n"
            f"  • Total turns ever: {len(history) + session_mgr.meta.handoff_summary_turns}\n\n"
            f"💡 _Dùng /compress để nén thủ công nếu context quá cao._"
        )

        safe_send(bot, message.chat.id, status_text + history_info)
    except Exception as e:
        logger.error(f"Error in /session handler: {e}", exc_info=True)
        bot.reply_to(message, f"❌ Lỗi đọc session status: {e}")

@bot.message_handler(commands=['botstat'])
def handle_botstat(message):
    """Show all Python/bot processes currently running on the machine."""
    if not check_rbac_permission(message, "admin"):
        return

    import subprocess
    try:
        result = subprocess.run(
            [
                "powershell", "-NoProfile", "-Command",
                "Get-WmiObject Win32_Process "
                "| Where-Object { $_.Name -like '*python*' } "
                "| Select-Object ProcessId, Name, "
                "@{N='Started';E={$_.ConvertToDateTime($_.CreationDate).ToString('HH:mm:ss')}}, "
                "@{N='CMD';E={if($_.CommandLine.Length -gt 80){$_.CommandLine.Substring(0,80)+'...'}else{$_.CommandLine}}} "
                "| Format-List"
            ],
            capture_output=True, text=True, timeout=10
        )
        output = result.stdout.strip() or "Không có Python process nào đang chạy."
    except Exception as e:
        output = f"Lỗi: {e}"

    import os
    own_pid = os.getpid()
    safe_send(
        bot, message.chat.id,
        f"📊 *Python Processes trên máy host:*\n"
        f"_(PID hiện tại của bot: `{own_pid}`)_\n\n"
        f"```\n{output[:3000]}\n```",
        parse_mode="Markdown"
    )


@bot.message_handler(commands=['killbot'])
def handle_killbot(message):
    """Kill all stale bot instances EXCEPT the current one. Fixes 409 Conflict."""
    if not check_rbac_permission(message, "admin"):
        return

    import subprocess, os
    own_pid = os.getpid()
    bot.reply_to(
        message,
        f"🔫 *Đang kill tất cả bot instance cũ...*\n"
        f"_(Giữ lại instance hiện tại: PID `{own_pid}`)_",
        parse_mode="Markdown"
    )

    try:
        kill_cmd = (
            f"$killed = 0; "
            f"Get-WmiObject Win32_Process "
            f"| Where-Object {{ "
            f"  $_.Name -like '*python*' -and "
            f"  $_.CommandLine -like '*main.py*' -and "
            f"  $_.ProcessId -ne {own_pid} "
            f"}} "
            f"| ForEach-Object {{ "
            f"  $killed++; "
            f"  Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue; "
            f"  Write-Host ('Killed PID: ' + $_.ProcessId) "
            f"}}; "
            f"Write-Host ('Total killed: ' + $killed)"
        )
        result = subprocess.run(
            ["powershell", "-NoProfile", "-Command", kill_cmd],
            capture_output=True, text=True, timeout=10
        )
        output = result.stdout.strip() or "Không có instance nào cần kill."
    except Exception as e:
        output = f"Lỗi: {e}"

    safe_send(
        bot, message.chat.id,
        f"✅ *Kết quả:*\n```\n{output}\n```\n\n"
        f"Bot instance hiện tại (PID `{own_pid}`) vẫn đang chạy bình thường.",
        parse_mode="Markdown"
    )

@bot.message_handler(commands=['killnode'])
def handle_killnode(message):
    """Kill all stale Node.js/Vite instances to free up ports."""
    if not check_rbac_permission(message, "admin"):
        return

    import subprocess
    bot.reply_to(
        message,
        f"🔫 *Đang dọn dẹp tất cả các process Node.js bị treo...*",
        parse_mode="Markdown"
    )

    try:
        kill_cmd = (
            f"$killed = 0; "
            f"Get-WmiObject Win32_Process "
            f"| Where-Object {{ $_.Name -like '*node*' }} "
            f"| ForEach-Object {{ "
            f"  $killed++; "
            f"  Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue; "
            f"  Write-Host ('Killed Node PID: ' + $_.ProcessId) "
            f"}}; "
            f"Write-Host ('Total killed: ' + $killed)"
        )
        result = subprocess.run(
            ["powershell", "-NoProfile", "-Command", kill_cmd],
            capture_output=True, text=True, timeout=10
        )
        output = result.stdout.strip() or "Không có Node.js process nào đang treo."
    except Exception as e:
        output = f"Lỗi: {e}"

    safe_send(
        bot, message.chat.id,
        f"✅ *Kết quả dọn dẹp:*\n```\n{output}\n```\n\n"
        f"Các port Dev Server đã được giải phóng!",
        parse_mode="Markdown"
    )

@bot.message_handler(commands=['reboot'])
def handle_reboot_bot(message):
    """Exit the Python process. run.bat will automatically restart it."""
    if not check_rbac_permission(message, "admin"):
        return

    try:
        bot.reply_to(
            message,
            "🔄 *Bot đang khởi động lại (Soft Reboot)...*\n\n"
            "Tiến trình sẽ tự thoát. `run.bat` sẽ tự động khởi động lại bot trong cùng một cửa sổ sau ~3 giây 🚀",
            parse_mode="Markdown"
        )
    except Exception:
        pass

    def _do_soft_reboot():
        import time as _t
        _t.sleep(1.2)  # let Telegram deliver the message first
        logger.info("[Reboot] Self-exiting. run.bat will restart the process.")
        os._exit(0)

    threading.Thread(target=_do_soft_reboot, daemon=True).start()


@bot.message_handler(commands=['status'])
def handle_status(message):
    """Show AI provider health, budget usage, and vault summary."""
    if not check_rbac_permission(message, "admin"):
        return

    def build_status():
        try:
            registry = get_registry()
            tracker = get_tracker()
            status = registry.health_status()
            ollama_models = registry.ollama_models() if status["ollama"] else []

            lines = ["🛸 *ANTIGRAVITY SYSTEM STATUS*\n"]

            lines.append("*AI Providers:*")
            ollama_model_str = f" ({', '.join(ollama_models)})" if ollama_models else ""
            lines.append(f"  {'🟢' if status['ollama'] else '🔴'} Ollama Local{ollama_model_str}")
            lines.append(f"  {'🟢' if status['deepseek'] else '🔴'} DeepSeek API")
            lines.append(f"  {'🟢' if status['gemini'] else '🔴'} Gemini API")
            lines.append(f"  {'🟢' if status['claude'] else '🔴'} Claude API (Anthropic)")

            lines.append("")
            lines.append(tracker.format_status_message())

            lines.append("")
            lines.append(agent.get_vault_summary())

            active = agent.get_active_project() or "default"
            lines.append(f"\n📌 *Active Project*: `{active}`")

            safe_send(bot, message.chat.id, "\n".join(lines))
        except Exception as e:
            bot.reply_to(message, f"❌ Status error: {e}")

    threading.Thread(target=build_status).start()


def execute_chat_turn(message, user_text, force_provider=None):
    """Shared handler to execute a conversation turn, optionally forcing a specific AI provider."""
    # Show typing state immediately
    try:
        bot.send_chat_action(message.chat.id, 'typing')
    except Exception as e:
        logger.warning(f"Could not send typing action: {e}")
        
    chat_id = message.chat.id

    # ── Register a fresh cancellation event for this chat session ────────────
    cancel_event = threading.Event()
    with _cancel_events_lock:
        _active_cancel_events[chat_id] = cancel_event

    def process_agent_response():
        try:
            active_project = agent.get_active_project() or "default"
            history = []

            # Ensure local Notebook session is started
            try:
                if not ctx_logger.current_session_file or ctx_logger.active_app_name != active_project:
                    ctx_logger.start_new_session(active_project)
            except Exception as se:
                logger.error(f"Error starting session: {se}")

            # Retrieve last 10 conversational turns to feed context
            _, history_file = agent.get_project_paths(active_project)
            if history_file.exists():
                try:
                    history = json.loads(history_file.read_text(encoding="utf-8"))[-10:]
                except Exception:
                    pass

            # Track if workspace plans are modified
            plan_files_to_track = ["implementation_plan.md", "task.md", "walkthrough.md"]
            mtimes_before = {}
            workspace_path = None
            try:
                workspace_path = tools.get_active_workspace()
                for name in plan_files_to_track:
                    pf = workspace_path / name
                    mtimes_before[name] = pf.stat().st_mtime if pf.exists() else 0
            except Exception as e:
                logger.warning(f"Could not track workspace file mtimes: {e}")

            # ── Build cancel button markup ────────────────────────────────────
            cancel_markup = telebot.types.InlineKeyboardMarkup()
            cancel_markup.add(
                telebot.types.InlineKeyboardButton(
                    "🛑 Hủy tác vụ",
                    callback_data=f"cancel_task:{chat_id}"
                )
            )

            # Send initial progress message with cancel button
            provider_label = f"Mô hình *{force_provider.upper()}*" if force_provider else "Hệ thống"
            progress_msg = bot.send_message(
                chat_id,
                f"⚡ *Bắt đầu phân tích yêu cầu với {provider_label}...*\n"
                f"_(Đang khởi chạy luồng suy nghĩ & thực thi)_",
                parse_mode="Markdown",
                reply_markup=cancel_markup,
            )
            # ── Rate-limited on_progress with fallback send-new-message ───────
            _last_edit_time = [0.0]          # mutable list for closure mutation
            _current_msg_id = [progress_msg.message_id]
            _EDIT_DEBOUNCE_S = 2.0           # max 1 edit per 2 seconds
            latest_progress_text = [""]      # mutable list to capture steps for local NotebookLM

            # Keep track of the actual steps checklist and the heartbeat status separately
            last_steps_text = [""]
            heartbeat_status = [""]

            def update_telegram_message():
                if cancel_event.is_set():
                    return
                now = time.time()
                if now - _last_edit_time[0] < _EDIT_DEBOUNCE_S:
                    return
                _last_edit_time[0] = now

                # Combine the heartbeat header and the step checklist
                combined_parts = []
                if heartbeat_status[0]:
                    combined_parts.append(heartbeat_status[0])
                if last_steps_text[0]:
                    combined_parts.append(last_steps_text[0])
                
                combined_text = "\n\n".join(combined_parts)
                if not combined_text:
                    combined_text = f"_(Đang khởi chạy luồng suy nghĩ & thực thi)_"

                # Update the latest progress text for RAG/NotebookLM logging
                latest_progress_text[0] = combined_text
                
                # Format tables to look nice in Telegram
                formatted_combined = format_markdown_tables(combined_text)

                try:
                    bot.edit_message_text(
                        formatted_combined,
                        chat_id=chat_id,
                        message_id=_current_msg_id[0],
                        parse_mode="Markdown",
                        reply_markup=cancel_markup,
                    )
                except Exception as edit_err:
                    err_str = str(edit_err).lower()
                    if any(kw in err_str for kw in (
                        "message to edit not found",
                        "message can't be edited",
                        "message is too old",
                        "message_id_invalid",
                    )):
                        try:
                            new_msg = bot.send_message(
                                chat_id, formatted_combined,
                                parse_mode="Markdown",
                                reply_markup=cancel_markup,
                            )
                            _current_msg_id[0] = new_msg.message_id
                        except Exception:
                            pass

            def on_progress(text: str):
                # Update the step checklist
                last_steps_text[0] = text
                # Clear standard heartbeat status when a new step executes
                heartbeat_status[0] = ""
                update_telegram_message()

            # ── on_thinking callback — called while model is computing ────────
            def on_thinking(text: str):
                """Throttled update when model is in thinking state (not tool calling)."""
                if not text:
                    return
                # Extract header and steps if the router outputs a combined string
                if "\n\n" in text:
                    header, body = text.split("\n\n", 1)
                    heartbeat_status[0] = header
                    last_steps_text[0] = body
                else:
                    heartbeat_status[0] = text
                update_telegram_message()

            # ── Heartbeat thread — fires every 15s to show bot is alive ───────
            _done_event = threading.Event()
            _heartbeat_start = time.time()

            def _heartbeat_loop():
                tick = 0
                spinner = ["⠋", "⠙", "⠸", "⠴", "⠦", "⠇"]
                while not _done_event.wait(timeout=15):
                    if cancel_event.is_set():
                        break
                    elapsed = int(time.time() - _heartbeat_start)
                    spin = spinner[tick % len(spinner)]
                    tick += 1
                    
                    # Update ONLY the heartbeat header and preserve the step log
                    heartbeat_status[0] = f"{spin} *Model đang suy nghĩ / xử lý yêu cầu...* (Đã chạy {elapsed}s)"
                    update_telegram_message()

            heartbeat_thread = threading.Thread(target=_heartbeat_loop, daemon=True)
            heartbeat_thread.start()

            # ── Run the agent turn ────────────────────────────────────────────
            try:
                with TelegramTypingIndicator(bot, chat_id):
                    reply, provider_used = agent.run_agent_turn(
                        user_text,
                        history,
                        on_progress=on_progress,
                        on_thinking=on_thinking,
                        force_provider=force_provider,
                        cancellation_event=cancel_event,
                    )
            finally:
                # Stop heartbeat regardless of success/error/cancel
                _done_event.set()
                heartbeat_thread.join(timeout=2)

            # Check and send updated plan files
            if workspace_path:
                for name in plan_files_to_track:
                    pf = workspace_path / name
                    if pf.exists():
                        try:
                            mtime_after = pf.stat().st_mtime
                            if mtime_after > mtimes_before.get(name, 0):
                                logger.info(f"Detected updated workspace file: {name}. Sending to user.")
                                with open(pf, "rb") as doc_file:
                                    bot.send_document(
                                        chat_id, doc_file,
                                        visible_file_name=name,
                                        caption=f"📝 *Tệp tin {name} đã được cập nhật.*"
                                    )
                        except Exception as doc_err:
                            logger.error(f"Error sending document {name}: {doc_err}")

            # Remove cancel button from progress message
            try:
                bot.edit_message_reply_markup(
                    chat_id=chat_id,
                    message_id=_current_msg_id[0],
                    reply_markup=None,
                )
            except Exception:
                pass

            # Archiving memory dynamically inside the local Memory Vault (NotebookLM)
            try:
                from core.memory_vault import save_memory
                threading.Thread(
                    target=save_memory,
                    args=(user_text, reply, True, "medium")
                ).start()
            except Exception as mem_err:
                logger.error(f"Error starting save_memory thread: {mem_err}")

            # Log interaction to Local NotebookLM Context
            try:
                ctx_logger.log_interaction(
                    user_prompt=user_text,
                    ai_response=reply,
                    self_healing_logs=latest_progress_text[0]
                )
            except Exception as log_err:
                logger.error(f"Error logging interaction to Local NotebookLM: {log_err}")

            # Append new turns and persist history
            history.append({"role": "user", "content": user_text})
            history.append({"role": "model", "content": reply})

            try:
                history_file.write_text(json.dumps(history, ensure_ascii=False, indent=2), encoding="utf-8")
            except Exception:
                pass

            safe_send(bot, chat_id, reply)
        except Exception as e:
            logger.error(f"Error in execute_chat_turn process: {e}", exc_info=True)
            if getattr(message, 'message_id', 0) > 0:
                bot.reply_to(message, f"❌ **Lỗi Agent**: {str(e)[:300]}")
            else:
                bot.send_message(chat_id, f"❌ **Lỗi Agent**: {str(e)[:300]}")
        finally:
            # Always deregister the cancel event when done
            with _cancel_events_lock:
                _active_cancel_events.pop(chat_id, None)

    threading.Thread(target=process_agent_response).start()


@bot.callback_query_handler(func=lambda call: call.data.startswith("cancel_task:"))
def handle_cancel_task_callback(call):
    """Cancel the active agent task for the given chat_id."""
    try:
        chat_id = int(call.data.split(":", 1)[1])
    except (ValueError, IndexError):
        bot.answer_callback_query(call.id, "❌ Invalid cancel request.")
        return

    with _cancel_events_lock:
        event = _active_cancel_events.get(chat_id)

    if event and not event.is_set():
        event.set()
        bot.answer_callback_query(call.id, "🛑 Đang hủy tác vụ...")
        try:
            bot.edit_message_text(
                "🛑 *Đang hủy tác vụ...* Vui lòng chờ agent dừng an toàn.",
                chat_id=call.message.chat.id,
                message_id=call.message.message_id,
                parse_mode="Markdown",
                reply_markup=None,
            )
        except Exception:
            pass
    else:
        bot.answer_callback_query(call.id, "ℹ️ Không có tác vụ nào đang chạy.")


# Force Gemini Pro reasoning command
@bot.message_handler(commands=['pro', 'geminipro'])
def handle_pro_command(message):
    """Explicitly invokes Gemini 2.5 Pro provider for heavy reasoning tasks (included in user's Google Pro subscription)."""
    user_id = message.from_user.id
    role = get_user_role(user_id)
    if role not in ["admin", "admin_master", "admin_company"]:
        bot.reply_to(message, "⛔ Access Denied.")
        return
        
    try:
        user_text = message.text.split(' ', 1)[1].strip()
    except IndexError:
        bot.reply_to(
            message, 
            "👉 Vui lòng nhập yêu cầu kèm theo cho siêu mô hình Gemini Pro.\n*Ví dụ:* `/pro Hãy phân tích lỗi bảo mật của module accounting`", 
            parse_mode="Markdown"
        )
        return

    execute_chat_turn(message, user_text, force_provider="geminipro")


# Force Claude reasoning command
@bot.message_handler(commands=['claude'])
def handle_claude_command(message):
    """Explicitly invokes Claude provider for heavy reasoning tasks."""
    user_id = message.from_user.id
    role = get_user_role(user_id)
    if role not in ["admin", "admin_master", "admin_company"]:
        bot.reply_to(message, "⛔ Access Denied.")
        return
        
    try:
        user_text = message.text.split(' ', 1)[1].strip()
    except IndexError:
        bot.reply_to(
            message, 
            "👉 Vui lòng nhập yêu cầu kèm theo cho mô hình Claude.\n*Ví dụ:* `/claude Hãy refactor màn hình login`", 
            parse_mode="Markdown"
        )
        return

    execute_chat_turn(message, user_text, force_provider="claude")


# Force DeepSeek R1 reasoning command
@bot.message_handler(commands=['r1', 'deepseek-r1'])
def handle_r1_command(message):
    """Explicitly invokes DeepSeek R1 reasoning model."""
    user_id = message.from_user.id
    role = get_user_role(user_id)
    if role not in ["admin", "admin_master", "admin_company"]:
        bot.reply_to(message, "⛔ Access Denied.")
        return
        
    try:
        user_text = message.text.split(' ', 1)[1].strip()
    except IndexError:
        bot.reply_to(
            message, 
            "👉 Vui lòng nhập yêu cầu kèm theo cho mô hình DeepSeek-R1.\n*Ví dụ:* `/r1 Hãy thiết kế module accounting`", 
            parse_mode="Markdown"
        )
        return

    execute_chat_turn(message, user_text, force_provider="deepseek_r1")


# Force Planning Mode command
@bot.message_handler(commands=['plan'])
def handle_plan_command(message):
    """Explicitly triggers the Planning Mode for a complex task."""
    user_id = message.from_user.id
    role = get_user_role(user_id)
    if role not in ["admin", "admin_master", "admin_company"]:
        bot.reply_to(message, "⛔ Access Denied.")
        return
        
    try:
        user_text = message.text.split(' ', 1)[1].strip()
    except IndexError:
        bot.reply_to(
            message, 
            "👉 Vui lòng nhập yêu cầu kèm theo để lập kế hoạch.\n*Ví dụ:* `/plan Thiết kế cấu trúc database cho accounting`", 
            parse_mode="Markdown"
        )
        return

    # Pass the command with '/plan ' prefix so agent.py triggers the plan
    execute_chat_turn(message, f"/plan {user_text}")


@bot.message_handler(commands=['goal'])
def handle_goal_command(message):
    """Triggers autonomous infinite loop."""
    user_id = message.from_user.id
    if get_user_role(user_id) not in ["admin", "admin_master", "admin_company"]:
        return bot.reply_to(message, "⛔ Access Denied.")
    try:
        user_text = message.text.split(' ', 1)[1].strip()
    except IndexError:
        return bot.reply_to(message, "👉 Vui lòng nhập mục tiêu. VD: `/goal Migrate toàn bộ component sang Tailwind`", parse_mode="Markdown")
    execute_chat_turn(message, f"/goal {user_text}")


@bot.message_handler(commands=['teamwork-preview', 'teamwork_preview'])
def handle_teamwork_command(message):
    """Triggers multi-agent orchestration."""
    user_id = message.from_user.id
    if get_user_role(user_id) not in ["admin", "admin_master", "admin_company"]:
        return bot.reply_to(message, "⛔ Access Denied.")
    try:
        user_text = message.text.split(' ', 1)[1].strip()
    except IndexError:
        return bot.reply_to(message, "👉 Vui lòng nhập task. VD: `/teamwork-preview Xây dựng tính năng upload ảnh`", parse_mode="Markdown")
    execute_chat_turn(message, f"/teamwork {user_text}")


@bot.message_handler(commands=['schedule'])
def handle_schedule_command(message):
    """Schedules a task."""
    if not bg_scheduler_instance:
        return bot.reply_to(message, "⚠️ Hệ thống lập lịch chưa được kích hoạt (thiếu ALLOWED_TELEGRAM_USER_ID).")
    user_id = message.from_user.id
    if get_user_role(user_id) not in ["admin", "admin_master", "admin_company"]:
        return bot.reply_to(message, "⛔ Access Denied.")
    try:
        args = message.text.split(' ', 2)
        if len(args) < 3:
            raise IndexError
        delay_seconds = int(args[1])
        user_text = args[2].strip()
    except (IndexError, ValueError):
        return bot.reply_to(message, "👉 Cú pháp: `/schedule <số_giây> <nhiệm vụ>`. VD: `/schedule 60 Check build status`", parse_mode="Markdown")
        
    def delayed_execution(chat_id, text):
        bot.send_message(chat_id, f"🔔 *BÁO THỨC!* Đã đến giờ thực thi nhiệm vụ:\n_{text}_", parse_mode="Markdown")
        # Reuse execute_chat_turn
        # Create a mock message to pass to execute_chat_turn
        class MockMessage:
            def __init__(self, cid, txt):
                class MockChat:
                    def __init__(self, _id):
                        self.id = _id
                self.chat = MockChat(cid)
                self.text = txt
                self.message_id = 0
                self.from_user = type('obj', (object,), {'id': cid})
        execute_chat_turn(MockMessage(chat_id, f"/schedule {text}"), f"/schedule {text}")
        
    from datetime import datetime, timedelta
    run_date = datetime.now() + timedelta(seconds=delay_seconds)
    job = bg_scheduler_instance.add_job(
        delayed_execution,
        'date',
        run_date=run_date,
        args=[message.chat.id, user_text],
        name=f"Schedule: {user_text[:20]}..."
    )
    bot.reply_to(message, f"⏰ Đã lên lịch hẹn giờ ({delay_seconds}s) cho nhiệm vụ:\n_{user_text}_\nID: `{job.id}`", parse_mode="Markdown")

@bot.message_handler(commands=['unschedule'])
def handle_unschedule_command(message):
    if not bg_scheduler_instance:
        return bot.reply_to(message, "⚠️ Hệ thống lập lịch chưa được kích hoạt (thiếu ALLOWED_TELEGRAM_USER_ID).")
    user_id = message.from_user.id
    if get_user_role(user_id) not in ["admin", "admin_master", "admin_company"]:
        return bot.reply_to(message, "⛔ Access Denied.")
    try:
        job_id = message.text.split(' ', 1)[1].strip()
        bg_scheduler_instance.remove_job(job_id)
        bot.reply_to(message, f"✅ Đã hủy lịch hẹn: `{job_id}`", parse_mode="Markdown")
    except Exception as e:
        bot.reply_to(message, f"❌ Không tìm thấy hoặc không thể hủy lịch hẹn: `{message.text}`")
@bot.message_handler(commands=['browser'])
def handle_browser_command(message):
    """Forces browser automation task."""
    user_id = message.from_user.id
    if get_user_role(user_id) not in ["admin", "admin_master", "admin_company"]:
        return bot.reply_to(message, "⛔ Access Denied.")
    try:
        user_text = message.text.split(' ', 1)[1].strip()
    except IndexError:
        return bot.reply_to(message, "👉 Vui lòng nhập yêu cầu lướt web. VD: `/browser Vào google tìm thông tin React 19`", parse_mode="Markdown")
    execute_chat_turn(message, f"/browser {user_text}")


@bot.message_handler(commands=['grill-me', 'grill_me'])
def handle_grill_command(message):
    """Triggers interactive interview mode."""
    user_id = message.from_user.id
    if get_user_role(user_id) not in ["admin", "admin_master", "admin_company"]:
        return bot.reply_to(message, "⛔ Access Denied.")
    try:
        user_text = message.text.split(' ', 1)[1].strip()
    except IndexError:
        return bot.reply_to(message, "👉 Vui lòng nhập chủ đề bạn muốn bị 'quay'. VD: `/grill-me Mình muốn làm app hẹn hò`", parse_mode="Markdown")
    execute_chat_turn(message, f"/grill {user_text}")


@bot.message_handler(commands=['deploy_app', 'create_app'])
def handle_deploy_app_command(message):
    """Wraps Vercel CLI deployment automation."""
    user_id = message.from_user.id
    if get_user_role(user_id) not in ["admin", "admin_master", "admin_company"]:
        return bot.reply_to(message, "⛔ Access Denied.")
    try:
        app_name = message.text.split(' ', 1)[1].strip()
    except IndexError:
        return bot.reply_to(message, "👉 Vui lòng nhập tên thư mục app. VD: `/deploy_app web` hoặc `/create_app new-admin`", parse_mode="Markdown")
        
    prompt = (
        f"/goal Hãy thiết lập và deploy dự án trong thư mục `{app_name}` lên Vercel. "
        f"1. Kiểm tra xem thư mục có tồn tại chưa, nếu chưa thì dùng framework phù hợp (như Next.js/Vite) để tạo. "
        f"2. Mở terminal, dùng `npx vercel link --yes` và `npx vercel deploy --prod --yes` để đẩy code lên cloud. "
        f"3. Sau khi deploy xong, hãy cập nhật `apps/antigravity-telegram-agent/config/settings.json` để thêm app này vào danh sách menu của `/apps`."
    )
    bot.reply_to(message, f"🚀 **Đang kích hoạt quy trình Auto-Deploy cho `{app_name}`...**\nTôi sẽ tự động tạo project, link Vercel và khai báo vào hệ thống giúp bạn.", parse_mode="Markdown")
    execute_chat_turn(message, prompt)


USER_DEFAULT_PROVIDERS = {}

@bot.message_handler(commands=['model', 'provider'])
def handle_model_switch(message):
    user_id = message.from_user.id
    role = get_user_role(user_id)
    if role not in ["admin", "admin_master", "admin_company"]:
        bot.reply_to(message, "⛔ Access Denied.")
        return
        
    parts = message.text.split(' ', 1)
    if len(parts) < 2:
        current = USER_DEFAULT_PROVIDERS.get(user_id, "default (deepseek)")
        bot.reply_to(
            message, 
            f"🤖 *MÔ HÌNH HIỆN TẠI:* `{current.upper().replace('_', '-')}`\n\n"
            f"👉 Cú pháp đổi mô hình mặc định cho cuộc trò chuyện:\n"
            f"• `/model deepseek` — Sử dụng DeepSeek-V3 (Nhanh, cực rẻ)\n"
            f"• `/model nvidia` — Sử dụng Nvidia AI (Mô hình lớn, chạy cực nhanh)\n"
            f"• `/model r1` — Sử dụng DeepSeek-R1 (Suy luận sâu, không hỗ trợ tool-calling trực tiếp)\n"
            f"• `/model geminipro` — Sử dụng Gemini 2.5 Pro (Mạnh mẽ, hoàn toàn miễn phí)\n"
            f"• `/model claude` — Sử dụng Claude 3.5 Sonnet (Đặc biệt thông minh, tốn phí)\n"
            f"• `/model default` — Quay lại định tuyến tự động mặc định",
            parse_mode="Markdown"
        )
        return
        
    choice = parts[1].strip().lower()
    if choice == "r1":
        choice = "deepseek_r1"

    if choice in ["deepseek", "deepseek_r1", "nvidia", "gemini", "geminipro", "claude", "default"]:
        if choice == "default":
            USER_DEFAULT_PROVIDERS.pop(user_id, None)
            bot.reply_to(message, "✅ Đã xóa ghi đè. Hệ thống quay về định tuyến tự động mặc định (DeepSeek).")
        else:
            USER_DEFAULT_PROVIDERS[user_id] = choice
            bot.reply_to(message, f"✅ Đã đổi mô hình mặc định sang: *{choice.upper().replace('_', '-')}* cho các cuộc trò chuyện tiếp theo của bạn!", parse_mode="Markdown")
    else:
        bot.reply_to(message, "❌ Mô hình không hợp lệ. Vui lòng chọn: `deepseek`, `nvidia`, `r1`, `geminipro`, `claude`, hoặc `default`.")





@bot.message_handler(content_types=['photo'])
def handle_agent_photo(message):
    """Handles image uploads using the Gemini multimodal Vision API for screenshots, errors, or doc analysis."""
    user_id = message.from_user.id
    role = get_user_role(user_id)
    if role not in ["admin", "admin_master", "admin_company"]:
        bot.reply_to(message, "⛔ Access Denied.")
        return
        
    bot.send_chat_action(message.chat.id, 'typing')
    status_msg = bot.reply_to(message, "🧠 *AI đang tiếp nhận hình ảnh và tiến hành phân tích...*", parse_mode="Markdown")
    
    try:
        from core.provider_registry import get_registry
        registry = get_registry()
        
        # Verify Gemini is enabled
        if not registry.gemini.health_check():
            bot.edit_message_text(
                chat_id=message.chat.id,
                message_id=status_msg.message_id,
                text="❌ *Lỗi*: API Key của Gemini chưa được cấu hình hoặc không hợp lệ. Vui lòng kiểm tra `.env`."
            )
            return
            
        client = registry.gemini._get_client()
        if not client:
            raise ValueError("Could not initialize Gemini Client.")
            
        # Download image from Telegram (largest size)
        file_info = bot.get_file(message.photo[-1].file_id)
        downloaded_file = bot.download_file(file_info.file_path)
        
        from google.genai import types
        part = types.Part.from_bytes(data=downloaded_file, mime_type="image/jpeg")
        
        # Stage 1: Google Vision (Gemini 2.5 Flash perception)
        vision_prompt = (
            "Describe this image in detail. Extract any code blocks, terminal logs, tracebacks, "
            "UI visual layouts, and structural elements precisely. Perform full OCR on all text."
        )
        
        system_instruction = (
            "You are Google Vision OCR & Image Analyzer. "
            "Your job is to perform a detailed visual analysis and exact OCR text extraction. "
            "If this is a screenshot of code or an error, perform exact OCR to extract all logs, code, file paths, line numbers, and error messages. "
            "If this is a UI screenshot, describe layout elements, colors, and visual issues. "
            "Be precise, objective, and extract all text. Do not solve the problem or suggest fixes yet."
        )
        
        config = types.GenerateContentConfig(
            system_instruction=system_instruction,
            temperature=0.2,
        )
        
        # Try primary model first, fallback to stable and lite models on 503/429 errors
        vision_models = [registry.gemini.model, "gemini-2.5-flash", "gemini-2.0-flash", "gemini-2.5-flash-lite", "gemini-2.0-flash-lite", "gemini-flash-lite-latest"]
        # Remove duplicates while preserving order
        seen = set()
        vision_models = [x for x in vision_models if not (x in seen or seen.add(x))]
        
        response = None
        last_error = None
        
        for v_model in vision_models:
            try:
                logger.info(f"Attempting vision analysis with model: {v_model}")
                response = client.models.generate_content(
                    model=v_model,
                    contents=[part, vision_prompt],
                    config=config
                )
                if response and response.text:
                    logger.info(f"Vision analysis succeeded with model: {v_model}")
                    break
            except Exception as model_err:
                logger.warning(f"Vision analysis failed with model {v_model}: {model_err}")
                last_error = model_err
                time.sleep(1)  # wait 1s before retrying
                
        if not response or not response.text:
            if last_error:
                raise last_error
            else:
                raise ValueError("All vision models failed to return content.")

        
        vision_analysis = response.text or "No text or visual elements could be extracted from the image."
        
        # Stage 2: Coordinated Reasoning (Pass to DeepSeek / Claude agentic loop)
        caption_text = message.caption or ""
        coordinated_prompt = (
            f"🖼️ [Google Vision OCR & Analysis]\n"
            f"```text\n{vision_analysis}\n```\n\n"
            f"Yêu cầu của người dùng đối với hình ảnh trên: {caption_text or 'Hãy phân tích hình ảnh lỗi/mã nguồn trên, khoanh vùng nguyên nhân và tự động sửa đổi mã nguồn hoặc đề xuất giải pháp cụ thể.'}"
        )
        
        # Delete temporary status message
        try:
            bot.delete_message(message.chat.id, status_msg.message_id)
        except Exception:
            pass
            
        # Prefix answer is handled inside execute_chat_turn which runs agentic loop
        execute_chat_turn(message, coordinated_prompt)

        
    except Exception as e:
        logger.error(f"Error in handle_photo: {e}", exc_info=True)
        try:
            bot.edit_message_text(
                chat_id=message.chat.id,
                message_id=status_msg.message_id,
                text=f"❌ *Lỗi phân tích hình ảnh*: {str(e)[:300]}"
            )
        except Exception:
            pass


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
                
        s = settings.load_settings()
        git_push = s.get("auto_push_git", True)
        branch = s.get("git_branch", "viet")
        
        prompt = "[AUTOPILOT] Hãy tự động chạy kiểm tra hệ thống, kiểm tra lỗi và fix lỗi nếu có."
        if git_push:
            prompt += f" Sau khi fix xong, HÃY tự động commit và push code lên nhánh `{branch}`. Báo cáo kết quả."
        else:
            prompt += " KHÔNG được tự ý commit hay push code lên Git. Chỉ sửa file nội bộ rồi báo cáo."

        mock_msg = MockMessage(primary_id, f"/goal {prompt}")
        try:
            bot.send_message(primary_id, "🤖 *Autopilot Kích Hoạt* - Đang tiến hành quét và bảo trì hệ thống ngầm...", parse_mode="Markdown")
            execute_chat_turn(mock_msg, mock_msg.text)
        except Exception as e:
            logger.error(f"Autopilot tick failed: {e}")

def apply_daily_report_schedule():
    if not bg_scheduler_instance:
        return
    s = settings.load_settings()
    report_time_str = s.get("daily_report_time", "18:00")
    try:
        hour, minute = map(int, report_time_str.split(":"))
    except ValueError:
        hour, minute = 18, 0
    
    try:
        bg_scheduler_instance.reschedule_job('daily_report_job', trigger='cron', hour=hour, minute=minute)
        logger.info(f"Daily report rescheduled to {report_time_str}")
    except Exception as e:
        logger.error(f"Failed to reschedule daily report: {e}")

KAIZEN_PROMPT = """/goal [SYSTEM DIRECTIVE: SELF-REFLECTION & AUDIT]
Nhiệm vụ của bạn là thực hiện quy trình Tự Phản Chiếu & Kiểm Thử Hệ Thống (Self-Reflection & Audit) định kỳ cho monorepo:

1. STATIC MIGRATION LINTING & AUTO-HEALING:
   - Quét tất cả các tệp tin `supabase/migrations/*.sql` từ gốc monorepo.
   - Tìm lỗi "RLS Infinite Recursion" (ví dụ: tạo POLICY SELECT trên bảng A có chứa câu truy vấn SELECT trực tiếp hoặc gián tiếp trên chính bảng A trong phần USING hoặc WITH CHECK).
   - Nếu phát hiện lỗi này, hãy tự động sửa lỗi (self-heal) tệp tin migration bằng cách chuyển đổi sang sử dụng hàm `SECURITY DEFINER` (chạy với đặc quyền bypass RLS) hoặc sử dụng các thông tin xác thực JWT (`auth.jwt()`) thích hợp để tránh truy vấn đệ quy vô hạn.

2. ĐĂNG NHẬP & PHÂN TÍCH NHẬT KÝ HOẠT ĐỘNG (LOGS):
   - Đường dẫn file nhật ký: `c:/Vibecoding/superapp-monorepo/apps/antigravity-telegram-agent/agent_service.log`.
   - Hãy trích xuất 24 giờ hoạt động gần nhất một cách an toàn. VÌ DUNG LƯỢNG FILE LOG RẤT LỚN (trên 20MB), bạn TUYỆT ĐỐI KHÔNG DÙNG `read_file` trực tiếp. Thay vào đó, hãy dùng `execute_command` để chạy lệnh trích xuất 1000 dòng cuối cùng (sử dụng PowerShell: `Get-Content -Path "c:/Vibecoding/superapp-monorepo/apps/antigravity-telegram-agent/agent_service.log" -Tail 1000`).
   - Phân tích các lỗi (Error), cảnh báo (Warning), sự cố crash, hoặc các hành vi bất thường của agent.

3. GHI NHẬN 3 BÀI HỌC KINH NGHIỆM:
   - Dựa trên phân tích log trên, rút ra chính xác 3 bài học kinh nghiệm kỹ thuật cốt lõi.
   - Đọc file bài học hiện tại: `c:/Vibecoding/superapp-monorepo/vaults/lessons_learned.md`.
   - Dùng `patch_file` hoặc ghi đè để chèn thêm 3 bài học này dưới mục `## Daily Learnings` tương ứng với ngày hôm nay (định dạng: `- **[YYYY-MM-DD]**: <tóm tắt ngắn gọn bài học và giải pháp khắc phục>`).

4. KIỂM THỬ GIAO DIỆN (VISUAL AUDIT) & TỰ PHỤC HỒI SERVER:
   - Xác định dự án hiện tại đang hoạt động (active project) bằng cách đọc `c:/Vibecoding/superapp-monorepo/apps/antigravity-telegram-agent/active_project.json`. Tra cứu cổng (port) và công nghệ tương ứng của dự án đó trong `c:/Vibecoding/superapp-monorepo/apps/antigravity-telegram-agent/config/settings.json`.
   - Kiểm tra xem cổng cục bộ (port) đó đã có dịch vụ chạy chưa. Nếu chưa hoặc hoạt động không phản hồi, hãy thực hiện dọn dẹp port cũ (dùng `manage_port` hoặc kill port) và tự động khởi động lại (auto-restart) máy chủ phát triển (dev server) dưới dạng tiến trình ngầm (sử dụng PowerShell `Start-Process` để chạy tiến trình ngầm, ví dụ: `Start-Process cmd -ArgumentList "/c npm run dev" -WindowStyle Hidden` trong thư mục của dự án đó).
   - Khi máy chủ phát triển đã sẵn sàng tại `http://localhost:<port>`, hãy chạy công cụ native `run_visual_audit` với URL `http://localhost:<port>` để thực hiện kiểm thử tự động giao diện (UI/UX integrity audit) trên các thiết bị.

5. BÁO CÁO KẾT QUẢ:
   - Tổng hợp một báo cáo Markdown chi tiết gửi lại cho User qua Telegram, trình bày rõ: trạng thái log 24h qua, 3 bài học đã được ghi nhận vào `c:/Vibecoding/superapp-monorepo/vaults/lessons_learned.md`, kết quả kiểm tra server và báo cáo Visual Audit chi tiết.
"""

@bot.message_handler(commands=['kaizen_now'])
def handle_kaizen_now(message):
    user_id = message.from_user.id
    if get_user_role(user_id) not in ["admin", "admin_master", "admin_company"]:
        bot.reply_to(message, "⛔ Access Denied.")
        return
    # Inform the user and execute
    bot.reply_to(message, "🤖 *Kích hoạt Self-Reflection & Audit* - Đang chạy quy trình tự phân tích & kiểm thử hệ thống...", parse_mode="Markdown")
    execute_chat_turn(message, KAIZEN_PROMPT)

def run_kaizen_reflection(chat_id):
    class MockChat:
        def __init__(self, id):
            self.id = id
    class MockMessage:
        def __init__(self, chat_id, text):
            self.chat = MockChat(chat_id)
            self.text = text
            self.message_id = 0
            self.from_user = type('obj', (object,), {'id': chat_id})
    
    mock_msg = MockMessage(chat_id, KAIZEN_PROMPT)
    try:
        bot.send_message(chat_id, "⏰ *Lịch biểu Auto-Kaizen*: Đang tự động kích hoạt Self-Reflection & Audit...", parse_mode="Markdown")
        execute_chat_turn(mock_msg, KAIZEN_PROMPT)
    except Exception as e:
        logger.error(f"Scheduled Kaizen job failed: {e}")

def apply_daily_kaizen_schedule():
    global bg_scheduler_instance
    if not bg_scheduler_instance:
        return
    s = settings.load_settings()
    kaizen_time_str = s.get("daily_kaizen_time", "02:00")
    try:
        hour, minute = map(int, kaizen_time_str.split(":"))
    except ValueError:
        hour, minute = 2, 0
    try:
        bg_scheduler_instance.reschedule_job('daily_kaizen_job', trigger='cron', hour=hour, minute=minute)
        logger.info(f"Daily Kaizen rescheduled to {kaizen_time_str}")
    except Exception as e:
        logger.error(f"Failed to reschedule daily Kaizen: {e}")

@bot.message_handler(commands=['schedules'])
def handle_schedules_command(message):
    if not bg_scheduler_instance:
        return bot.reply_to(message, "⚠️ Hệ thống lập lịch chưa được kích hoạt (thiếu ALLOWED_TELEGRAM_USER_ID).")
    user_id = message.from_user.id
    if get_user_role(user_id) not in ["admin", "admin_master", "admin_company"]:
        bot.reply_to(message, "⛔ Access Denied.")
        return
    
    jobs = bg_scheduler_instance.get_jobs()
    if not jobs:
        bot.reply_to(message, "Không có lịch hẹn nào đang chạy.")
        return
        
    msg = "🕒 **DANH SÁCH LỊCH HẸN ĐANG CHỜ**:\n"
    for j in jobs:
        msg += f"- `{j.id}` | {j.name} | Tiếp theo: {j.next_run_time.strftime('%Y-%m-%d %H:%M:%S') if j.next_run_time else 'N/A'}\n"
        
    msg += "\n👉 Gõ `/unschedule <ID>` để hủy lịch."
    bot.reply_to(message, msg, parse_mode="Markdown")

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
    markup = telebot.types.InlineKeyboardMarkup(row_width=4)
    
    # 1. Model
    current_model = s.get("default_ai_model", "deepseek")
    models = ["deepseek", "gemini", "claude", "nvidia"]
    model_btns = [telebot.types.InlineKeyboardButton(f"{'✅ ' if current_model == m else ''}{m.capitalize()}", callback_data=f"settings_model_{m}") for m in models]
    markup.add(*model_btns)
    
    # 2. Daily Report
    current_report = s.get("daily_report_time", "18:00")
    times = ["08:00", "12:00", "18:00", "22:00"]
    time_btns = [telebot.types.InlineKeyboardButton(f"{'✅ ' if current_report == t else ''}{t}", callback_data=f"settings_report_{t}") for t in times]
    markup.add(*time_btns)
    
    # 3. Quota, Budget & Goal Limit
    b = s.get('daily_budget_limit', 1.0)
    q = s.get('daily_quota_limit', 1000)
    g = s.get('goal_max_requests', 100)
    markup.add(
        telebot.types.InlineKeyboardButton(f"Budget: ${b} ✏️", callback_data="settings_edit_budget"),
        telebot.types.InlineKeyboardButton(f"Quota: {q} ✏️", callback_data="settings_edit_quota"),
        telebot.types.InlineKeyboardButton(f"Goal Max: {g} ✏️", callback_data="settings_edit_goal")
    )
    
    # 4. Fallback priority
    fbo = s.get("fallback_order", ["deepseek", "gemini", "claude", "nvidia"])
    fbo_str = " ➡️ ".join([m[:2].upper() for m in fbo[:3]])
    markup.add(telebot.types.InlineKeyboardButton(f"Priority: {fbo_str} ✏️", callback_data="settings_edit_fallback"))

    # 5. Git & Schedules
    git_on = "🟢 BẬT" if s.get("auto_push_git", True) else "🔴 TẮT"
    branch = s.get("git_branch", "viet")
    markup.add(
        telebot.types.InlineKeyboardButton(f"Auto Git: {git_on}", callback_data="settings_toggle_git"),
        telebot.types.InlineKeyboardButton(f"Branch: [{branch}] ✏️", callback_data="settings_edit_branch")
    )
    markup.add(telebot.types.InlineKeyboardButton("Quản lý Lịch hẹn ⚙️", callback_data="settings_manage_schedules"))

    # 6. Autopilot
    ap_status = "🟢 BẬT" if s.get("autopilot_enabled") else "🔴 TẮT"
    markup.add(telebot.types.InlineKeyboardButton(f"Autopilot: {ap_status}", callback_data="settings_toggle_autopilot"))
    
    current_interval = s.get("autopilot_interval_hours", 6)
    intervals = [1, 6, 12, 24]
    int_btns = [telebot.types.InlineKeyboardButton(f"{'✅ ' if current_interval == i else ''}{i}h", callback_data=f"settings_interval_{i}") for i in intervals]
    markup.add(*int_btns)
    
    return markup

@bot.message_handler(commands=['settings'])
def handle_settings(message):
    user_id = message.from_user.id
    if get_user_role(user_id) not in ["admin", "admin_master", "admin_company"]:
        bot.reply_to(message, "⛔ Access Denied.")
        return
    bot.reply_to(message, "⚙️ **TRUNG TÂM CÀI ĐẶT (SETTINGS)**\n\nBạn có thể điều chỉnh các thiết lập hệ thống ở đây:", parse_mode="Markdown", reply_markup=get_settings_markup())

@bot.callback_query_handler(func=lambda call: call.data.startswith('settings_'))
def handle_settings_callback(call):
    user_id = call.from_user.id
    if get_user_role(user_id) not in ["admin", "admin_master", "admin_company"]:
        bot.answer_callback_query(call.id, "⛔ Access Denied.")
        return
        
    s = settings.load_settings()
    data = call.data
    
    if data == "settings_toggle_autopilot":
        s["autopilot_enabled"] = not s.get("autopilot_enabled", False)
    elif data.startswith("settings_interval_"):
        s["autopilot_interval_hours"] = int(data.split("_")[-1])
    elif data.startswith("settings_model_"):
        s["default_ai_model"] = data.replace("settings_model_", "")
    elif data.startswith("settings_report_"):
        s["daily_report_time"] = data.replace("settings_report_", "")
        # Call apply_daily_report_schedule() which we will define
    elif data == "settings_toggle_git":
        s["auto_push_git"] = not s.get("auto_push_git", True)
    elif data in ["settings_edit_budget", "settings_edit_quota", "settings_edit_fallback", "settings_edit_branch", "settings_edit_goal"]:
        bot.answer_callback_query(call.id, "Vui lòng nhập giá trị mới:")
        msg = bot.send_message(call.message.chat.id, f"Đang chờ cấu hình cho {data.split('_')[-1].upper()}... Nhập giá trị mới (nếu fallback thì nhập cách nhau dấu phẩy):")
        bot.register_next_step_handler(msg, process_settings_input, setting_key=data)
        return
    elif data == "settings_manage_schedules":
        bot.answer_callback_query(call.id)
        # Call handle_schedules_command logic directly
        handle_schedules_command(call.message)
        return
        
    settings.save_settings(s)
    if data.startswith("settings_interval_") or data == "settings_toggle_autopilot":
        apply_autopilot_schedule()
    elif data.startswith("settings_report_"):
        apply_daily_report_schedule()
    apply_daily_kaizen_schedule()
        
    try:
        bot.edit_message_reply_markup(chat_id=call.message.chat.id, message_id=call.message.message_id, reply_markup=get_settings_markup())
        bot.answer_callback_query(call.id, "Đã cập nhật cài đặt!")
    except Exception as e:
        bot.answer_callback_query(call.id, "Lỗi khi cập nhật!")

def process_settings_input(message, setting_key):
    val = message.text.strip()
    if val.startswith('/'):
        bot.reply_to(message, "⚠️ Nhập cấu hình bị hủy do phát hiện lệnh mới.")
        return
    s = settings.load_settings()
    try:
        if setting_key == "settings_edit_budget":
            s["daily_budget_limit"] = float(val)
        elif setting_key == "settings_edit_quota":
            s["daily_quota_limit"] = int(val)
        elif setting_key == "settings_edit_goal":
            s["goal_max_requests"] = int(val)
        elif setting_key == "settings_edit_branch":
            s["git_branch"] = val
        elif setting_key == "settings_edit_fallback":
            parts = [x.strip().lower() for x in val.split(',')]
            s["fallback_order"] = parts
        settings.save_settings(s)
        bot.reply_to(message, f"✅ Đã lưu cấu hình mới. Bấm /settings để xem lại.")
    except Exception as e:
        bot.reply_to(message, f"❌ Lỗi định dạng: {e}")



@bot.message_handler(func=lambda message: True)
def handle_agent_chat(message):
    user_id = message.from_user.id
    role = get_user_role(user_id)
    if role not in ["admin", "admin_master", "admin_company"]:
        bot.reply_to(message, "⛔ Access Denied.")
        return
        
    user_text = message.text
    if user_text.startswith('/'):
        return
        
    forced = USER_DEFAULT_PROVIDERS.get(user_id)
    if not forced:
        forced = settings.load_settings().get("default_ai_model", "deepseek")
        
    execute_chat_turn(message, user_text, force_provider=forced)



if __name__ == "__main__":

    logger.info("Initializing Antigravity Autonomous Telegram Service...")
    
    # 1. Start the secure WebSocket + Flask server on port 8765
    try:
        socket_server.start_server_bridge(port=8765)
        logger.info("Websocket Bridge Server initialized successfully on port 8765.")
    except Exception as server_err:
        logger.error(f"Could not start Websocket server: {server_err}", exc_info=True)
    
    # Setup scheduler for daily report and Auto-Kaizen
    bg_scheduler = None
    if ALLOWED_USER_ID is not None:
        primary_id = str(ALLOWED_USER_ID).split(",")[0].strip()
        s = settings.load_settings()
        report_time = s.get("daily_report_time", "18:00")
        kaizen_time = s.get("daily_kaizen_time", "02:00")
        bg_scheduler = scheduler.setup_scheduler(
            bot, 
            primary_id, 
            report_time_str=report_time, 
            kaizen_time_str=kaizen_time,
            kaizen_callback=run_kaizen_reflection
        )
        bg_scheduler_instance = bg_scheduler
        apply_autopilot_schedule()
        logger.info("Daily report and Auto-Kaizen scheduler setup successfully.")
        
    logger.info("Telegram Bot service is listening (Polling)...")
    try:
        bot.infinity_polling()
    except KeyboardInterrupt:
        logger.info("Exiting application gracefully.")
        if bg_scheduler:
            bg_scheduler.shutdown()
        sys.exit(0)


