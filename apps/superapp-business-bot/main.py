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
from pathlib import Path
from dotenv import load_dotenv
from storage_manager import init_storage
from config import ALLOWED_USER_ID

# For routing models per-user
USER_DEFAULT_PROVIDERS = {}

# In-memory state for user's selected app and data entry flow
# { user_id: { "selected_app": "inventory-operation", "step": "awaiting_data", "data_type": "..." } }
USER_APP_STATE = {}

# Data entry guidance per app
APP_DATA_ENTRY_GUIDE = {
    "inventory-operation": {
        "types": ["📦 Nhập tồn kho", "📥 Nhập hàng", "📤 Xuất hàng"],
        "format": "Excel/CSV hoặc paste từ Google Sheets",
        "fields": "Ngày, Mã sản phẩm, Số lượng, Tồn thực tế, Ghi chú",
    },
    "cashflow": {
        "types": ["💰 Thu tiền", "💸 Chi tiền", "🔄 Chuyển khoản nội bộ"],
        "format": "Excel/CSV hoặc paste từ Google Sheets",
        "fields": "Ngày, Loại giao dịch, Số tiền, Đối tác, Ghi chú",
    },
    "accounting": {
        "types": ["📄 Hóa đơn đầu vào", "📄 Hóa đơn đầu ra", "📋 Bút toán điều chỉnh"],
        "format": "Excel/CSV hoặc paste từ Google Sheets",
        "fields": "Ngày, Số hóa đơn, Đối tác, Số tiền, Thuế VAT, Ghi chú",
    },
    "hr-operation": {
        "types": ["👤 Thông tin nhân viên", "📅 Chấm công", "🏖️ Nghỉ phép"],
        "format": "Excel/CSV hoặc paste từ Google Sheets",
        "fields": "Mã NV, Họ tên, Ngày, Giờ vào, Giờ ra, Ghi chú",
    },
    "sales-operation": {
        "types": ["🛒 Đơn hàng mới", "📦 Cập nhật trạng thái đơn", "🔄 Trả hàng"],
        "format": "Excel/CSV hoặc paste từ Google Sheets",
        "fields": "Mã đơn, SĐT khách, Mã SP, Số lượng, Đơn giá, Ghi chú",
    },
}

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

# --- Super Scraper & RAG AI Commands ---

@bot.message_handler(commands=['ask'])
def handle_ask(message):
    try:
        question = message.text.split(' ', 1)[1]
    except IndexError:
        bot.reply_to(message, "Vui lòng đặt câu hỏi. VD: /ask Hà Nội có món gì ngon?")
        return
        
    bot.reply_to(message, "🔍 Đang tìm kiếm trong cơ sở dữ liệu đã cào...")
    
    def run_ask():
        try:
            answer = ask_rag_engine(question)
            bot.send_message(message.chat.id, answer, parse_mode="Markdown")
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


@bot.message_handler(commands=['export_vault'])
def handle_export_vault(message):
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

import core.auth_manager as auth_manager

# UAT simulation dictionary
UAT_ROLES = {}

# Active authentication state memory (temporary cache for OTP flows)
# Keys: chat_id, values: { "step": "email_pending" | "otp_pending", "email": str }
AUTH_STATE = {}

def get_user_role(telegram_id: int):
    """Retrieves the user's role from UAT override, user_mapping.json, or developer override."""
    # 1. Check UAT override
    if telegram_id in UAT_ROLES:
        return UAT_ROLES[telegram_id]
        
    # 2. Check primary dev override
    if ALLOWED_USER_ID and str(telegram_id) == str(ALLOWED_USER_ID):
        return "admin"
        
    # 3. Check user mapping JSON
    mapping = auth_manager.load_user_mapping()
    user_info = mapping.get(str(telegram_id))
    if user_info and user_info.get("status") == "verified":
        return user_info.get("role")
        
    # 4. Fallback check Supabase database
    user = db.get_user_by_telegram_id(str(telegram_id))
    if user:
        return user.get("role", "staff")
    return None

def check_rbac_permission(message, required_module: str) -> bool:
    """RBAC validation interceptor with Permission Guard."""
    user_id = message.from_user.id
    role = get_user_role(user_id)
    
    if not role:
        # Prompt corporate email activation flow
        welcome_text = (
            f"🔒 **YÊU CẦU LIÊN KẾT DOANH NGHIỆP (2-STEP OTP)**\n\n"
            f"Tài khoản Telegram của bạn chưa được liên kết với hồ sơ SuperApp.\n\n"
            f"Vui lòng nhập **Email doanh nghiệp** của bạn để nhận mã xác thực OTP:\n"
            f"*(Cú pháp: Gõ trực tiếp email của bạn, ví dụ: `director@superapp.com`)*"
        )
        bot.reply_to(message, welcome_text, parse_mode="Markdown")
        AUTH_STATE[user_id] = {"step": "email_pending"}
        return False
        
    # Standard security mapping check
    mapping = auth_manager.load_user_mapping()
    user_info = mapping.get(str(user_id))
    if user_info:
        allowed_modules = user_info.get("permissions", [])
    else:
        allowed_modules = ROLE_PERMISSIONS.get(role, [])
        
    if required_module not in allowed_modules:
        denied_text = (
            f"⛔ **QUYỀN TRUY CẬP BỊ TỪ CHỐI**\n\n"
            f"Tài khoản của bạn (Vai trò: **{role}**) không được cấp quyền truy cập phân hệ `{required_module.upper()}`.\n\n"
            f"Vui lòng liên hệ Admin để cập nhật cấu trúc phân quyền trên Admin Portal."
        )
        bot.reply_to(message, denied_text, parse_mode="Markdown")
        return False
        
    return True


# --- 1. Welcome and Help Commands ---

@bot.message_handler(commands=['start', 'help'])
def send_welcome(message):
    user_id = message.from_user.id
    role = get_user_role(user_id)
    
    if not role:
        welcome_text = (
            f"🔒 **XÁC THỰC TÀI KHOẢN TRỢ LÝ SỐ**\n\n"
            f"Chào mừng bạn đến với **SuperApp Trợ Lý Số**!\n"
            f"Tài khoản Telegram của bạn chưa được liên kết với hệ thống.\n\n"
            f"Vui lòng chọn phương thức đăng nhập bên dưới:\n"
            f"1️⃣ Nhập trực tiếp **Email doanh nghiệp** của bạn (ví dụ: `director@superapp.com`)\n"
            f"2️⃣ Nhấp vào nút bàn phím phía dưới để **Đăng ký Trải nghiệm (Trial Mode)** nhanh chóng bằng Số điện thoại của bạn."
        )
        markup = telebot.types.ReplyKeyboardMarkup(one_time_keyboard=True, resize_keyboard=True)
        button = telebot.types.KeyboardButton(text="📱 Đăng ký Trải nghiệm bằng Số Điện Thoại", request_contact=True)
        markup.add(button)
        
        bot.send_message(message.chat.id, welcome_text, reply_markup=markup, parse_mode="Markdown")
        AUTH_STATE[user_id] = {"step": "email_pending"}
        return


    welcome_text = (
        f"🤖 **Superapp Business Assistant Online 24/7**\n"
        f"Vai trò của bạn: **{role.upper()}**\n\n"
        f"**Các lệnh khả dụng dành cho bạn**:\n"
    )
    
    modules = ROLE_PERMISSIONS.get(role, [])
    
    if "accounting" in modules:
        welcome_text += (
            "📊 **Kế toán & Dòng tiền**:\n"
            "- `/chi <số_tiền> <nội_dung> [ngày]` - Ghi nhận khoản chi\n"
            "- `/thu <số_tiền> <nguồn_thu> <lý_do>` - Ghi nhận khoản thu\n"
            "- `/accounting_report` - Báo cáo & Tải bảng kê chi tiết (Excel/PDF)\n"
            "- `/cashflow_report` - Báo cáo dự báo dòng tiền hàng tuần\n"
            "- `/invoice_list` - Xem danh sách hóa đơn gần đây\n\n"
        )
        
    if "hr" in modules:
        welcome_text += (
            "👥 **Nhân sự (HR)**:\n"
            "- `/xin_nghỉ <số_ngày> <ngày_bắt_đầu> <lý_do>` - Đăng ký nghỉ phép năm\n"
            "- `/chấm_công_bù <ngày> <giờ> <checkin/checkout> <lý_do>` - Bổ sung chấm công\n"
            "- `/hr_report` - Báo cáo nhân sự & Tải bảng công (Excel)\n"
            "- `/leave_balance` - Tra cứu ngày phép năm còn lại\n"
            "- `/leave_list` - Tra cứu danh sách nghỉ phép hôm nay\n\n"
        )
        
    if "sales" in modules:
        welcome_text += (
            "🛍️ **Bán hàng (Sales)**:\n"
            "- `/tạo_đơn <sđt_khách> <mã_sp> <số_lượng> [chiết_khấu]` - Lên đơn hàng nhanh\n"
            "- `/đơn_trạng_thái <mã_đơn> <trạng_thái>` - Cập nhật đơn hàng\n"
            "- `/sales_report` - Xem doanh thu & Tải chi tiết đơn hàng (Excel)\n"
            "- `/order_list` - Danh sách đơn hàng gần đây\n\n"
        )
        
    if "inventory" in modules:
        welcome_text += (
            "📦 **Quản lý Kho**:\n"
            "- `/nhập_kho <mã_sp> <số_lượng> <vị_trí_kệ>` - Ghi nhận nhập kho\n"
            "- `/xuất_kho <mã_sp> <số_lượng> <lý_do>` - Ghi nhận xuất kho\n"
            "- `/inventory_report` - Báo cáo kho & Tải tồn kho chi tiết (Excel)\n"
            "- `/stock <mã_sp>` - Tra cứu nhanh sản phẩm trong kho\n"
            "- `/low_stock` - Danh sách mặt hàng sắp hết\n\n"
        )
        
    if "admin" in modules:
        welcome_text += (
            "🛡️ **Quản trị hệ thống**:\n"
            "- `/approve_user <telegram_id> <role>` - Cấp quyền liên kết người dùng\n"
            "- `/user_list` - Xem danh sách người dùng đã liên kết\n"
            "- `/apps` - Switchboard thay đổi tiêu điểm và tunnel phát triển\n\n"
            "🕵️‍♂️ **Cào dữ liệu & Tìm kiếm AI (Super Scraper)**:\n"
            "- `/crawl <URL>` - Cào đơn thuần bằng Python (0 TOKENS, cực nhanh)\n"
            "- `/crawl2 <URL>` - Cào nâng cao có AI phân tích, lọc ảnh & RAG\n"
            "- `/ask <câu_hỏi>` - Truy vấn RAG AI tìm kiếm thông tin trong cơ sở dữ liệu đã cào\n\n"
            "🧠 **Cấu hình AI**:\n"
            "- `/model <name>`, `/nvidia`, `/deepseek` - Chuyển đổi mô hình AI (Nvidia, Deepseek, Gemini, v.v.)\n\n"
        )

    welcome_text += (
        "⚙️ **Hệ thống**:\n"
        "- `/hướng_dẫn` - Hướng dẫn sử dụng chi tiết từ A-Z\n"
        "- `/logout` hoặc `/dang_xuat` - Đăng xuất tài khoản hiện tại\n"
    )

    markup = telebot.types.InlineKeyboardMarkup(row_width=1)
    markup.add(
        telebot.types.InlineKeyboardButton("📱 Chọn App cụ thể", callback_data="action:select_app"),
        telebot.types.InlineKeyboardButton("📋 Nhập liệu", callback_data="action:data_entry"),
        telebot.types.InlineKeyboardButton("📊 Xem báo cáo", callback_data="action:report"),
        telebot.types.InlineKeyboardButton("⏰ Tạo job tự động", callback_data="action:schedule"),
    )
    bot.send_message(message.chat.id, welcome_text, reply_markup=markup, parse_mode="Markdown")

@bot.message_handler(commands=['model', 'provider'])
def handle_model_switch(message):
    user_id = message.from_user.id
    role = get_user_role(user_id)
    if role not in ["admin", "admin_master", "admin_company"]:
        bot.reply_to(message, "⛔ Access Denied. Lệnh này chỉ dành cho Admin.")
        return
        
    parts = message.text.split(' ', 1)
    if len(parts) < 2:
        current = USER_DEFAULT_PROVIDERS.get(user_id, "default (gemini/deepseek)")
        bot.reply_to(
            message, 
            f"🤖 *MÔ HÌNH HIỆN TẠI:* `{current.upper().replace('_', '-')}`\n\n"
            f"👉 Cú pháp đổi mô hình mặc định:\n"
            f"• `/model deepseek` — Sử dụng DeepSeek\n"
            f"• `/model nvidia` — Sử dụng Nvidia AI\n"
            f"• `/model gemini` — Sử dụng Gemini\n"
            f"• `/model default` — Quay lại hệ thống tự động",
            parse_mode="Markdown"
        )
        return
        
    choice = parts[1].strip().lower()
    if choice in ["deepseek", "nvidia", "gemini", "default"]:
        if choice == "default":
            USER_DEFAULT_PROVIDERS.pop(user_id, None)
            bot.reply_to(message, "✅ Đã quay về định tuyến AI tự động.")
        else:
            USER_DEFAULT_PROVIDERS[user_id] = choice
            bot.reply_to(message, f"✅ Đã đổi mô hình sang: *{choice.upper()}*", parse_mode="Markdown")
    else:
        bot.reply_to(message, "❌ Mô hình không hợp lệ. Chọn: `deepseek`, `nvidia`, `gemini`, hoặc `default`.")

@bot.message_handler(commands=['nvidia', 'deepseek'])
def handle_quick_model_switch(message):
    user_id = message.from_user.id
    role = get_user_role(user_id)
    if role not in ["admin", "admin_master", "admin_company"]:
        bot.reply_to(message, "⛔ Access Denied.")
        return
        
    cmd = message.text.split()[0].replace('/', '').lower()
    USER_DEFAULT_PROVIDERS[user_id] = cmd
    bot.reply_to(message, f"✅ Đã đổi mô hình sang: *{cmd.upper()}*", parse_mode="Markdown")

@bot.message_handler(commands=['logout', 'dang_xuat'])
def handle_logout(message):
    """Logs out the user and clears their mapping and database link."""
    user_id = message.from_user.id
    
    # 1. Clear from UAT override
    if user_id in UAT_ROLES:
        UAT_ROLES.pop(user_id, None)
        
    # 2. Clear from temporary state cache
    if user_id in AUTH_STATE:
        AUTH_STATE.pop(user_id, None)
        
    # 3. Clear from user_mapping.json
    mapping = auth_manager.load_user_mapping()
    has_mapping = str(user_id) in mapping
    user_info = mapping.pop(str(user_id), None)
    if has_mapping:
        auth_manager.save_user_mapping(mapping)
        
    # 4. Unlink from Supabase database
    db.unlink_telegram_id(str(user_id))
    
    logout_msg = "🔒 **ĐÃ ĐĂNG XUẤT THÀNH CÔNG!**\n\n"
    if user_info:
        if user_info.get("type") == "trial":
            logout_msg += f"Tài khoản dùng thử của số điện thoại `{user_info.get('phone')}` đã được huỷ liên kết khỏi thiết bị này.\n\n"
        else:
            logout_msg += f"Tài khoản doanh nghiệp `{user_info.get('email')}` đã được huỷ liên kết khỏi thiết bị này.\n\n"
    else:
        logout_msg += "Tài khoản của bạn đã được huỷ liên kết khỏi hệ thống.\n\n"
        
    logout_msg += "Bạn có thể gõ lệnh `/start` bất kỳ lúc nào để liên kết/đăng nhập lại dưới một tài khoản khác."
    
    bot.send_message(
        message.chat.id, 
        logout_msg, 
        parse_mode="Markdown", 
        reply_markup=telebot.types.ReplyKeyboardRemove()
    )


@bot.message_handler(commands=['uat_test'])
def handle_uat_test(message):
    """Simulates testing the bot under different roles (UAT)."""
    user_id = message.from_user.id
    
    # Verify the user is an admin or the primary developer before allowing them to run UAT tests
    original_role = None
    if ALLOWED_USER_ID and str(user_id) == str(ALLOWED_USER_ID):
        original_role = "admin"
    else:
        user = db.get_user_by_telegram_id(str(user_id))
        if user:
            original_role = user.get("role")
            
    if original_role not in ["admin", "admin_master", "admin_company"]:
        bot.reply_to(message, "⛔ Chỉ có Quản trị viên (Admin) mới có quyền sử dụng tính năng giả lập UAT.")
        return
        
    args = message.text.split(maxsplit=1)
    if len(args) < 2:
        bot.reply_to(
            message, 
            "⚠️ Sử dụng: `/uat_test <role>`\n"
            "Các vai trò giả lập khả dụng:\n"
            "- `accountant` (Kế toán)\n"
            "- `hr_manager` (Quản lý Nhân sự)\n"
            "- `sales_agent` (Nhân viên Bán hàng)\n"
            "- `warehouse_keeper` (Thủ kho)\n"
            "- `reset` (Trở lại vai trò Admin ban đầu)", 
            parse_mode="Markdown"
        )
        return
        
    target_role = args[1].strip().lower()
    if target_role == "reset":
        UAT_ROLES.pop(user_id, None)
        bot.reply_to(message, "🔄 Đã reset giả lập. Bạn quay trở lại quyền **Quản trị viên (Admin)** thực tế của mình.")
    elif target_role in ROLE_PERMISSIONS:
        UAT_ROLES[user_id] = target_role
        bot.reply_to(
            message, 
            f"🧪 **[UAT Mode Enabled]**\n"
            f"Bạn đã chuyển sang vai trò giả lập: **{target_role.upper()}**.\n\n"
            f"Từ bây giờ, tất cả các lệnh bạn gõ sẽ bị kiểm soát bởi ma trận phân quyền của vai trò này.\n"
            f"Gõ `/help` để xem menu được phân quyền mới hoặc gõ `/uat_test reset` để kết thúc."
        )
    else:
        bot.reply_to(message, f"❌ Vai trò '{target_role}' không tồn tại trong hệ thống phân quyền.")

@bot.message_handler(commands=['hướng_dẫn'])
def handle_guide(message):
    guide_text = (
        "📖 **HƯỚNG DẪN SỬ DỤNG TRỢ LÝ SUPERAPP A-Z**\n\n"
        "Chào mừng bạn đến với kênh tương tác vận hành Superapp! Dưới đây là hướng dẫn chi tiết dành cho bạn:\n\n"
        "🔹 **BƯỚC 1: Liên kết tài khoản (Chỉ thực hiện 1 lần duy nhất)**\n"
        "1. Khi bạn nhắn `/start`, Bot sẽ gửi cho bạn một mã số **Telegram ID**.\n"
        "2. Hãy sao chép mã số này và gửi cho Quản lý / Admin của bạn.\n"
        "3. Admin sẽ nhập mã này vào trang hồ sơ của bạn trên **Admin Portal** để kết nối hệ thống phân quyền.\n\n"
        "🔹 **BƯỚC 2: Kiểm tra Menu tính năng**\n"
        "• Gõ `/help` bất kỳ lúc nào để hiển thị danh sách câu lệnh nghiệp vụ thuộc phòng ban của bạn.\n\n"
        "🔹 **BƯỚC 3: Cách thức Nhập liệu bằng Lệnh**\n"
        "• **Kế toán:** Gõ `/chi 500000 mua_bút` hoặc `/thu 10000000 anh_hải_cọc` để ghi sổ nhanh.\n"
        "• **Nhân sự:** Gõ `/xin_nghỉ 2 05/06 nghỉ_hè` để gửi đơn trực tiếp lên hệ thống phê duyệt.\n"
        "• **Bán hàng:** Lên đơn nhanh bằng `/tạo_đơn 0901234567 SP-101 2`.\n"
        "• **Kho:** `/nhập_kho SP-102 50 Ke_B3` hoặc `/xuất_kho SP-102 10 bán_lẻ`.\n\n"
        "🔹 **BƯỚC 4: Nhận Báo cáo dạng Excel/PDF**\n"
        "• Bạn gõ `/accounting_report`, `/sales_report`, `/inventory_report` hoặc `/hr_report` để nhận file bảng kê, bảng công Excel tải về ngay lập tức.\n\n"
        "🔹 **BƯỚC 5: Gửi ảnh Hóa đơn đầu vào (OCR)**\n"
        "• Không cần gõ lệnh, chỉ cần kéo thả file ảnh hóa đơn mua hàng vào chat, Bot sẽ tự động trích xuất thông tin kế toán và hỏi xác nhận duyệt chi phí.\n\n"
        "🔹 **BƯỚC 6: Sử dụng các Phân hệ Đồ họa & Trợ lý Cào Dữ Liệu AI**\n"
        "• **Chuyển đổi Phân hệ:** Gõ `/apps` để mở cổng kết nối ngầm (tunnel) hoặc liên kết nhanh đến các ứng dụng đồ họa chuyên dụng như **operations-portal** hay **super-scraper**.\n"
        "• **Cào dữ liệu (Scraper):** Gõ `/crawl <URL>` (ví dụ: `/crawl https://vietnamnet.vn`) để AI tự động trích xuất cấu trúc dữ liệu mong muốn từ website.\n"
        "• **Tìm kiếm AI thông minh (RAG):** Gõ `/ask <câu hỏi>` để tìm kiếm và trả lời dựa trên các dữ liệu website mà bạn đã cào."
    )
    bot.reply_to(message, guide_text, parse_mode="Markdown")

# --- 2. Kế Toán & Dòng Tiền Commands ---

@bot.message_handler(commands=['chi'])
def create_expense(message):
    if not check_rbac_permission(message, "accounting"):
        return
    
    args = message.text.split(maxsplit=3)
    if len(args) < 3:
        bot.reply_to(message, "⚠️ Sử dụng: `/chi <số_tiền> <nội_dung> [ngày]`\nVí dụ: `/chi 1200000 mua_bút_sách 28/05`", parse_mode="Markdown")
        return
        
    try:
        amount = float(args[1])
        description = args[2]
        date = args[3] if len(args) > 3 else time.strftime("%Y-%m-%d")
        
        # Save to database
        res = db.create_accounting_invoice(amount, "Nhà cung cấp tự do", date, "paid")
        if res:
            bot.reply_to(
                message,
                f"✅ **Đã ghi nhận Khoản chi thành công!**\n\n"
                f"- **Số tiền:** `{amount:,.0f}đ`\n"
                f"- **Nội dung:** `{description}`\n"
                f"- **Ngày phát sinh:** `{date}`\n"
                f"- **Trạng thái:** Đã ghi sổ",
                parse_mode="Markdown"
            )
        else:
            bot.reply_to(message, "❌ Có lỗi xảy ra khi lưu vào database.")
    except ValueError:
        bot.reply_to(message, "⚠️ Số tiền phải là một con số.")

@bot.message_handler(commands=['thu'])
def create_income(message):
    if not check_rbac_permission(message, "accounting"):
        return
        
    args = message.text.split(maxsplit=3)
    if len(args) < 4:
        bot.reply_to(message, "⚠️ Sử dụng: `/thu <số_tiền> <nguồn_thu> <lý_do>`\nVí dụ: `/thu 30000000 anh_nam cọc_hợp_đồng`", parse_mode="Markdown")
        return
        
    try:
        amount = float(args[1])
        source = args[2]
        reason = args[3]
        
        # Save as invoice record
        res = db.create_accounting_invoice(amount, source, time.strftime("%Y-%m-%d"), "paid")
        if res:
            bot.reply_to(
                message,
                f"✅ **Đã ghi nhận Khoản thu thành công!**\n\n"
                f"- **Số tiền:** `{amount:,.0f}đ`\n"
                f"- **Nguồn thu:** `{source}`\n"
                f"- **Lý do:** `{reason}`\n"
                f"- **Trạng thái:** Đã ghi sổ",
                parse_mode="Markdown"
            )
        else:
            bot.reply_to(message, "❌ Có lỗi xảy ra khi lưu vào database.")
    except ValueError:
        bot.reply_to(message, "⚠️ Số tiền phải là một con số.")

@bot.message_handler(commands=['accounting_report'])
def send_accounting_report(message):
    if not check_rbac_permission(message, "accounting"):
        return
        
    bot.reply_to(message, "📊 **Đang tạo báo cáo Kế toán và trích xuất bảng kê chi tiết...**")
    bot.send_chat_action(message.chat.id, 'upload_document')
    
    # Generate Mock Excel File for the user
    import tempfile
    with tempfile.NamedTemporaryFile(suffix=".xlsx", delete=False) as tmp:
        tmp.write(b"Bao cao Ke toan chi tiet - Superapp Accounting Report")
        tmp_name = tmp.name
        
    with open(tmp_name, 'rb') as f:
        bot.send_document(
            message.chat.id,
            f,
            visible_file_name="Bao_Cao_Ke_Toan_Chi_Tiet.xlsx",
            caption="📊 Gửi bạn file bảng kê chi tiết Kế toán & Thu chi!"
        )
    os.remove(tmp_name)

@bot.message_handler(commands=['cashflow_report'])
def send_cashflow_report(message):
    if not check_rbac_permission(message, "cashflow"):
        return
        
    bot.reply_to(message, "💸 **Đang xuất dự báo Dòng tiền và báo cáo số dư tài khoản...**")
    bot.send_chat_action(message.chat.id, 'upload_document')
    
    import tempfile
    with tempfile.NamedTemporaryFile(suffix=".xlsx", delete=False) as tmp:
        tmp.write(b"Bao cao Dong tien & Cashflow - Superapp Cashflow Report")
        tmp_name = tmp.name
        
    with open(tmp_name, 'rb') as f:
        bot.send_document(
            message.chat.id,
            f,
            visible_file_name="Bao_Cao_Dong_Tien.xlsx",
            caption="💸 Gửi bạn báo cáo quỹ và dự báo Dòng tiền 30 ngày tới!"
        )
    os.remove(tmp_name)

# --- 3. Nhân Sự Commands ---

@bot.message_handler(commands=['xin_nghỉ'])
def register_leave(message):
    if not check_rbac_permission(message, "hr"):
        return
        
    args = message.text.split(maxsplit=3)
    if len(args) < 4:
        bot.reply_to(message, "⚠️ Sử dụng: `/xin_nghỉ <số_ngày> <ngày_bắt_đầu> <lý_do>`\nVí dụ: `/xin_nghỉ 1 02/06 đi_khám_bệnh`", parse_mode="Markdown")
        return
        
    try:
        days = float(args[1])
        start_date = args[2]
        reason = args[3]
        
        res = db.create_leave_request(str(message.from_user.id), days, start_date, reason)
        if res:
            bot.reply_to(
                message,
                f"✅ **Gửi đơn xin nghỉ phép thành công!**\n\n"
                f"- **Số ngày nghỉ:** `{days}`\n"
                f"- **Ngày bắt đầu:** `{start_date}`\n"
                f"- **Lý do nghỉ:** `{reason}`\n"
                f"- **Trạng thái:** Đang chờ duyệt",
                parse_mode="Markdown"
            )
        else:
            bot.reply_to(message, "❌ Có lỗi xảy ra khi gửi đơn nghỉ phép. Vui lòng thử lại sau.")
    except Exception as e:
        bot.reply_to(message, f"❌ Có lỗi xảy ra: {str(e)}")

@bot.message_handler(commands=['hr_report'])
def send_hr_report(message):
    if not check_rbac_permission(message, "hr"):
        return
        
    bot.reply_to(message, "👥 **Đang tổng hợp báo cáo Nhân sự & Bảng công chi tiết...**")
    bot.send_chat_action(message.chat.id, 'upload_document')
    
    import tempfile
    with tempfile.NamedTemporaryFile(suffix=".xlsx", delete=False) as tmp:
        tmp.write(b"Bao cao Nhan su & Bang cong - Superapp HR Report")
        tmp_name = tmp.name
        
    with open(tmp_name, 'rb') as f:
        bot.send_document(
            message.chat.id,
            f,
            visible_file_name="Bang_Cong_Chi_Tiet.xlsx",
            caption="👥 Gửi bạn file bảng công tổng hợp nhân sự tháng này!"
        )
    os.remove(tmp_name)

# --- 4. Bán Hàng Commands ---

@bot.message_handler(commands=['tạo_đơn'])
def create_sales_order_cmd(message):
    if not check_rbac_permission(message, "sales"):
        return
        
    args = message.text.split(maxsplit=4)
    if len(args) < 4:
        bot.reply_to(message, "⚠️ Sử dụng: `/tạo_đơn <sđt_khách> <mã_sp> <số_lượng> [chiết_khấu]`\nVí dụ: `/tạo_đơn 0901234567 SP-102 3 10%`", parse_mode="Markdown")
        return
        
    try:
        phone = args[1]
        sku = args[2]
        qty = int(args[3])
        discount = args[4] if len(args) > 4 else "0%"
        
        res = db.create_sales_order(phone, sku, qty, discount)
        if res:
            bot.reply_to(
                message,
                f"🎉 **Đã tạo đơn hàng thành công!**\n\n"
                f"- **Khách hàng:** `{phone}`\n"
                f"- **Sản phẩm:** `{sku}`\n"
                f"- **Số lượng:** `{qty}`\n"
                f"- **Chiết khấu:** `{discount}`\n"
                f"- **Trạng thái:** Đơn hàng nháp",
                parse_mode="Markdown"
            )
        else:
            bot.reply_to(message, "❌ Không thể tạo đơn hàng trên database.")
    except ValueError:
        bot.reply_to(message, "⚠️ Số lượng phải là một con số nguyên.")

@bot.message_handler(commands=['sales_report'])
def send_sales_report(message):
    if not check_rbac_permission(message, "sales"):
        return
        
    bot.reply_to(message, "🛍️ **Đang tạo báo cáo doanh số & trích xuất bảng đơn hàng...**")
    bot.send_chat_action(message.chat.id, 'upload_document')
    
    import tempfile
    with tempfile.NamedTemporaryFile(suffix=".xlsx", delete=False) as tmp:
        tmp.write(b"Bao cao Doanh so ban hang - Superapp Sales Report")
        tmp_name = tmp.name
        
    with open(tmp_name, 'rb') as f:
        bot.send_document(
            message.chat.id,
            f,
            visible_file_name="Bao_Cao_Doanh_So_Ban_Hang.xlsx",
            caption="🛍️ Gửi bạn file bảng đơn hàng chi tiết!"
        )
    os.remove(tmp_name)

# --- 5. Quản Lý Kho Commands ---

@bot.message_handler(commands=['nhập_kho'])
def stock_in_cmd(message):
    if not check_rbac_permission(message, "inventory"):
        return
        
    args = message.text.split(maxsplit=3)
    if len(args) < 4:
        bot.reply_to(message, "⚠️ Sử dụng: `/nhập_kho <mã_sp> <số_lượng> <vị_trí_kệ>`\nVí dụ: `/nhập_kho SP-201 100 Ke_A3`", parse_mode="Markdown")
        return
        
    try:
        sku = args[1]
        qty = int(args[2])
        loc = args[3]
        
        res = db.create_inventory_record(sku, qty, loc, "inbound")
        if res:
            bot.reply_to(
                message,
                f"📥 **Ghi nhận NHẬP KHO thành công!**\n\n"
                f"- **Mã sản phẩm:** `{sku}`\n"
                f"- **Số lượng:** `{qty}`\n"
                f"- **Vị trí kệ:** `{loc}`\n"
                f"- **Trạng thái:** Hoàn tất",
                parse_mode="Markdown"
            )
        else:
            bot.reply_to(message, "❌ Có lỗi xảy ra khi lưu vào database.")
    except ValueError:
        bot.reply_to(message, "⚠️ Số lượng phải là một con số nguyên.")

@bot.message_handler(commands=['xuất_kho'])
def stock_out_cmd(message):
    if not check_rbac_permission(message, "inventory"):
        return
        
    args = message.text.split(maxsplit=3)
    if len(args) < 3:
        bot.reply_to(message, "⚠️ Sử dụng: `/xuất_kho <mã_sp> <số_lượng> <lý_do>`\nVí dụ: `/xuất_kho SP-102 20 don_DH-105`", parse_mode="Markdown")
        return
        
    try:
        sku = args[1]
        qty = int(args[2])
        reason = args[3] if len(args) > 3 else "Xuất kho bán lẻ"
        
        res = db.create_inventory_record(sku, qty, reason, "outbound")
        if res:
            bot.reply_to(
                message,
                f"📤 **Ghi nhận XUẤT KHO thành công!**\n\n"
                f"- **Mã sản phẩm:** `{sku}`\n"
                f"- **Số lượng:** `{qty}`\n"
                f"- **Lý do xuất:** `{reason}`\n"
                f"- **Trạng thái:** Hoàn tất",
                parse_mode="Markdown"
            )
        else:
            bot.reply_to(message, "❌ Có lỗi xảy ra khi lưu vào database.")
    except ValueError:
        bot.reply_to(message, "⚠️ Số lượng phải là một con số nguyên.")

@bot.message_handler(commands=['inventory_report'])
def send_inventory_report(message):
    if not check_rbac_permission(message, "inventory"):
        return
        
    bot.reply_to(message, "📦 **Đang kết xuất báo cáo kho và số lượng tồn kho thực tế...**")
    bot.send_chat_action(message.chat.id, 'upload_document')
    
    import tempfile
    with tempfile.NamedTemporaryFile(suffix=".xlsx", delete=False) as tmp:
        tmp.write(b"Bao cao Ton kho chi tiet - Superapp Inventory Report")
        tmp_name = tmp.name
        
    with open(tmp_name, 'rb') as f:
        bot.send_document(
            message.chat.id,
            f,
            visible_file_name="Bao_Cao_Ton_Kho_Chi_Tiet.xlsx",
            caption="📦 Gửi bạn file bảng báo cáo tồn kho chi tiết!"
        )
    os.remove(tmp_name)

# --- 6. Quản Trị Hệ Thống Commands ---

@bot.message_handler(commands=['approve_user'])
def approve_user_cmd(message):
    if not check_rbac_permission(message, "admin"):
        return
        
    args = message.text.split(maxsplit=2)
    if len(args) < 3:
        bot.reply_to(message, "⚠️ Sử dụng: `/approve_user <telegram_id> <role>`\nVí dụ: `/approve_user 687239281 accountant`", parse_mode="Markdown")
        return
        
    tid = args[1]
    role = args[2]
    
    # We query to see if there is a staff email to link, let's look up users to match
    url = f"{db.SUPABASE_URL}/rest/v1/users?telegram_id=is.null&limit=1"
    try:
        res = requests.get(url, headers=db.get_headers(), timeout=10)
        users = res.json()
        if users:
            target_email = users[0].get("email")
            success = db.link_telegram_id(target_email, tid)
            if success:
                # Update role
                requests.patch(
                    f"{db.SUPABASE_URL}/rest/v1/users?email=eq.{target_email}", 
                    json={"role": role}, 
                    headers=db.get_headers(), 
                    timeout=10
                )
                bot.reply_to(message, f"✅ **Cấp quyền thành công!**\nTài khoản email `{target_email}` đã được liên kết với Telegram ID `{tid}` dưới quyền `{role.upper()}`.")
                return
    except Exception:
        pass
        
    bot.reply_to(message, "❌ Không tìm thấy hồ sơ người dùng trống trong database để tự động liên kết.")

@bot.message_handler(commands=['user_list'])
def list_users_cmd(message):
    if not check_rbac_permission(message, "admin"):
        return
        
    users = db.get_users_list()
    if not users:
        bot.reply_to(message, "📁 Hiện chưa có tài khoản nào được liên kết.")
        return
        
    text = "🛡️ **Danh sách tài khoản liên kết sử dụng Bot**:\n\n"
    for u in users:
        text += f"- **{u.get('full_name') or 'N/A'}** ({u.get('email')})\n  - Telegram ID: `{u.get('telegram_id')}`\n  - Quyền: `{u.get('role', 'N/A').upper()}`\n"
        
    bot.reply_to(message, text, parse_mode="Markdown")

# --- Enterprise App Switcher (Vercel Subdomain Routing) ---

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
        bot.reply_to(message, "❌ Không tìm thấy danh sách phân hệ trong cài đặt.")
        return
        
    markup = telebot.types.InlineKeyboardMarkup(row_width=2)
    buttons = []
    for app in apps:
        name = app.get("name")
        tech = app.get("tech", "React")
        label = f"🌐 {name} ({tech})"
        buttons.append(telebot.types.InlineKeyboardButton(label, callback_data=f"switch_app:{name}"))
        
    markup.add(*buttons)
    bot.reply_to(
        message, 
        f"🏢 **Cổng liên kết phân hệ Superapp (Vercel Cloud Linkage)**\n\n"
        f"Chọn phân hệ bạn muốn truy cập bên dưới để lấy liên kết truy cập trực tiếp trên Cloud:",
        reply_markup=markup,
        parse_mode="Markdown"
    )

@bot.callback_query_handler(func=lambda call: call.data.startswith("switch_app:"))
def handle_switch_app_callback(call):
    # Check permissions
    role = get_user_role(call.from_user.id)
    if role not in ["admin", "admin_master", "admin_company"]:
        bot.answer_callback_query(call.id, "⛔ Bạn không có quyền truy cập.")
        return
            
    target_app = call.data.split(":", 1)[1]
    bot.answer_callback_query(call.id, f"🔗 Trích xuất URL: {target_app}...")
    
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
    
    bot.edit_message_text(
        chat_id=call.message.chat.id,
        message_id=call.message.message_id,
        text=f"✨ **Liên Kết Phân Hệ Doanh Nghiệp Thành Công!**\n\n"
             f"- **Ứng dụng**: `{target_app.upper()}` ({tech})\n"
             f"- **Môi trường**: Production Cloud (Vercel)\n"
             f"- **Đường dẫn truy cập**: [Mở Ứng Dụng Đồ Họa]({production_url})\n\n"
             f"*Bạn có thể nhấp vào nút liên kết phía trên để sử dụng trực tiếp trên di động hoặc máy tính cá nhân ở bất kỳ đâu!*",
        parse_mode="Markdown"
    )

@bot.callback_query_handler(func=lambda call: call.data == "action:select_app")
def handle_select_app_action(call):
    """Displays available apps as inline buttons based on user permissions."""
    bot.answer_callback_query(call.id)
    user_id = call.from_user.id
    role = get_user_role(user_id)
    if not role:
        bot.send_message(call.message.chat.id, "⛔ Bạn chưa xác thực. Gõ /start để bắt đầu.")
        return

    settings_file = Path(__file__).parent / "config" / "settings.json"
    apps = []
    if settings_file.exists():
        try:
            config = json.loads(settings_file.read_text(encoding="utf-8"))
            apps = config.get("apps", [])
        except Exception:
            pass

    # Filter apps user has permission to access
    user_modules = ROLE_PERMISSIONS.get(role, [])
    is_admin = role in ["admin", "admin_master", "admin_company"]

    markup = telebot.types.InlineKeyboardMarkup(row_width=2)
    for app in apps:
        app_name = app.get("name", "")
        production_url = app.get("production_url", "")
        # Skip monorepo-root and super-scraper for non-admins
        if app_name in ["monorepo-root", "super-scraper"] and not is_admin:
            continue
        # Check module-level permission (simplified mapping)
        module_map = {
            "accounting": "accounting", "cashflow": "accounting",
            "hr-operation": "hr", "inventory-operation": "inventory",
            "sales-operation": "sales", "admin-portal": "admin",
            "operations-portal": "admin", "web": "admin",
        }
        required_module = module_map.get(app_name)
        if required_module and not is_admin and required_module not in user_modules:
            continue

        btn_select = telebot.types.InlineKeyboardButton(
            f"✅ Chọn: {app_name}", callback_data=f"select_app:{app_name}"
        )
        btn_web = telebot.types.InlineKeyboardButton(
            "🌐 Mở Web", url=production_url if production_url else "https://superapp.vercel.app"
        )
        markup.row(btn_select, btn_web)

    markup.add(telebot.types.InlineKeyboardButton("🏠 Quay về", callback_data="action:back_home"))
    bot.send_message(
        call.message.chat.id,
        "📱 **CHỌN ỨNG DỤNG**\n\nChọn app bạn muốn làm việc:",
        reply_markup=markup,
        parse_mode="Markdown"
    )


@bot.callback_query_handler(func=lambda call: call.data.startswith("select_app:"))
def handle_select_app_confirm(call):
    """Saves selected app to USER_APP_STATE and shows confirmation with action buttons."""
    bot.answer_callback_query(call.id)
    user_id = call.from_user.id
    app_name = call.data.split(":", 1)[1]

    # Save to state
    if user_id not in USER_APP_STATE:
        USER_APP_STATE[user_id] = {}
    USER_APP_STATE[user_id]["selected_app"] = app_name
    USER_APP_STATE[user_id].pop("step", None)
    USER_APP_STATE[user_id].pop("data_type", None)

    # Get app description from settings
    settings_file = Path(__file__).parent / "config" / "settings.json"
    production_url = ""
    tech = ""
    if settings_file.exists():
        try:
            config = json.loads(settings_file.read_text(encoding="utf-8"))
            app_meta = next((a for a in config.get("apps", []) if a.get("name") == app_name), None)
            if app_meta:
                production_url = app_meta.get("production_url", "")
                tech = app_meta.get("tech", "")
        except Exception:
            pass

    confirm_text = (
        f"✅ **Đã chọn: {app_name.upper()}**\n\n"
        f"- **Công nghệ:** {tech}\n"
        f"- **URL:** {production_url}\n\n"
        f"Bạn muốn làm gì tiếp?"
    )

    markup = telebot.types.InlineKeyboardMarkup(row_width=2)
    markup.add(
        telebot.types.InlineKeyboardButton("📋 Nhập liệu", callback_data="action:data_entry"),
        telebot.types.InlineKeyboardButton("📊 Xem báo cáo", callback_data="action:report"),
    )
    markup.add(
        telebot.types.InlineKeyboardButton("🔄 Đổi app", callback_data="action:select_app"),
        telebot.types.InlineKeyboardButton(
            "🌐 Mở Web", url=production_url if production_url else "https://superapp.vercel.app"
        ),
    )
    markup.add(telebot.types.InlineKeyboardButton("🏠 Quay về", callback_data="action:back_home"))

    bot.send_message(call.message.chat.id, confirm_text, reply_markup=markup, parse_mode="Markdown")


@bot.callback_query_handler(func=lambda call: call.data == "action:data_entry")
def handle_data_entry_action(call):
    """Shows data entry options for user's selected app."""
    bot.answer_callback_query(call.id)
    user_id = call.from_user.id
    role = get_user_role(user_id)
    if not role:
        bot.send_message(call.message.chat.id, "⛔ Bạn chưa xác thực. Gõ /start để bắt đầu.")
        return

    state = USER_APP_STATE.get(user_id, {})
    selected_app = state.get("selected_app")

    if not selected_app:
        # No app selected yet — redirect to select_app
        handle_select_app_action(call)
        return

    guide = APP_DATA_ENTRY_GUIDE.get(selected_app)
    if not guide:
        bot.send_message(
            call.message.chat.id,
            f"⚠️ App `{selected_app}` chưa có hướng dẫn nhập liệu. Vui lòng chọn app khác.",
            parse_mode="Markdown"
        )
        return

    text = (
        f"📋 **NHẬP LIỆU — {selected_app.upper()}**\n\n"
        f"📁 **Định dạng hỗ trợ:** {guide['format']}\n"
        f"📝 **Các trường cần nhập:** {guide['fields']}\n\n"
        f"Chọn loại dữ liệu bạn muốn nhập:"
    )

    markup = telebot.types.InlineKeyboardMarkup(row_width=1)
    for dtype in guide["types"]:
        markup.add(telebot.types.InlineKeyboardButton(
            dtype, callback_data=f"data_type:{selected_app}:{dtype}"
        ))
    markup.add(
        telebot.types.InlineKeyboardButton("🔄 Đổi app", callback_data="action:select_app"),
        telebot.types.InlineKeyboardButton("🏠 Quay về", callback_data="action:back_home"),
    )

    bot.send_message(call.message.chat.id, text, reply_markup=markup, parse_mode="Markdown")


@bot.callback_query_handler(func=lambda call: call.data.startswith("data_type:"))
def handle_data_type_selection(call):
    """Handles data type selection and sets up next-step handler for data input."""
    bot.answer_callback_query(call.id)
    user_id = call.from_user.id

    parts = call.data.split(":", 2)
    if len(parts) < 3:
        return
    app_name = parts[1]
    data_type = parts[2]

    # Save state
    if user_id not in USER_APP_STATE:
        USER_APP_STATE[user_id] = {}
    USER_APP_STATE[user_id]["selected_app"] = app_name
    USER_APP_STATE[user_id]["data_type"] = data_type
    USER_APP_STATE[user_id]["step"] = "awaiting_data"

    guide = APP_DATA_ENTRY_GUIDE.get(app_name, {})

    # Get production_url
    settings_file = Path(__file__).parent / "config" / "settings.json"
    production_url = ""
    if settings_file.exists():
        try:
            config = json.loads(settings_file.read_text(encoding="utf-8"))
            app_meta = next((a for a in config.get("apps", []) if a.get("name") == app_name), None)
            if app_meta:
                production_url = app_meta.get("production_url", "")
        except Exception:
            pass

    text = (
        f"📝 **HƯỚNG DẪN NHẬP: {data_type}**\n"
        f"📱 App: `{app_name}`\n\n"
        f"📁 **Định dạng:** {guide.get('format', 'Excel/CSV')}\n"
        f"📝 **Các trường:** {guide.get('fields', 'N/A')}\n\n"
        f"**Cách gửi dữ liệu:**\n"
        f"1️⃣ Gửi file Excel/CSV trực tiếp\n"
        f"2️⃣ Hoặc paste text (mỗi dòng = 1 bản ghi, cách nhau bởi dấu phẩy hoặc tab)\n\n"
        f"👇 Gửi dữ liệu ngay bên dưới:"
    )

    markup = telebot.types.InlineKeyboardMarkup()
    if production_url:
        markup.add(telebot.types.InlineKeyboardButton(
            "🌐 Mở Web App để nhập", url=production_url
        ))
    markup.add(telebot.types.InlineKeyboardButton("🏠 Quay về", callback_data="action:back_home"))

    msg = bot.send_message(call.message.chat.id, text, reply_markup=markup, parse_mode="Markdown")
    bot.register_next_step_handler(msg, process_data_entry_input, app_name, data_type)


@bot.callback_query_handler(func=lambda call: call.data == "action:report")
def handle_report_action(call):
    """Placeholder for report viewing."""
    bot.answer_callback_query(call.id)
    user_id = call.from_user.id
    state = USER_APP_STATE.get(user_id, {})
    selected_app = state.get("selected_app", "chưa chọn")

    markup = telebot.types.InlineKeyboardMarkup()
    markup.add(telebot.types.InlineKeyboardButton("🏠 Quay về", callback_data="action:back_home"))
    bot.send_message(
        call.message.chat.id,
        f"📊 **XEM BÁO CÁO**\n\nApp hiện tại: `{selected_app}`\n\n"
        f"Sử dụng các lệnh báo cáo tương ứng:\n"
        f"- `/accounting_report` — Báo cáo kế toán\n"
        f"- `/cashflow_report` — Báo cáo dòng tiền\n"
        f"- `/hr_report` — Báo cáo nhân sự\n"
        f"- `/sales_report` — Báo cáo bán hàng\n"
        f"- `/inventory_report` — Báo cáo kho\n",
        reply_markup=markup,
        parse_mode="Markdown"
    )


@bot.callback_query_handler(func=lambda call: call.data == "action:schedule")
def handle_schedule_action(call):
    """Placeholder for schedule job creation."""
    bot.answer_callback_query(call.id)
    markup = telebot.types.InlineKeyboardMarkup()
    markup.add(telebot.types.InlineKeyboardButton("🏠 Quay về", callback_data="action:back_home"))
    bot.send_message(
        call.message.chat.id,
        "⏰ **TẠO JOB TỰ ĐỘNG**\n\n"
        "Tính năng tạo job tự động đang được phát triển.\n"
        "Hiện tại, báo cáo tự động được gửi lúc 18:00 hàng ngày cho Admin.",
        reply_markup=markup,
        parse_mode="Markdown"
    )


@bot.callback_query_handler(func=lambda call: call.data == "action:back_home")
def handle_back_home_action(call):
    """Returns user to the welcome/home screen."""
    bot.answer_callback_query(call.id)
    user_id = call.from_user.id
    role = get_user_role(user_id)
    chat_id = call.message.chat.id

    if not role:
        bot.send_message(chat_id, "Gõ /start để bắt đầu.")
        return

    welcome_text = (
        f"🤖 **Superapp Business Assistant Online 24/7**\n"
        f"Vai trò của bạn: **{role.upper()}**\n\n"
        f"Chọn chức năng bên dưới hoặc gõ /help để xem danh sách lệnh đầy đủ."
    )

    markup = telebot.types.InlineKeyboardMarkup(row_width=1)
    markup.add(
        telebot.types.InlineKeyboardButton("📱 Chọn App cụ thể", callback_data="action:select_app"),
        telebot.types.InlineKeyboardButton("📋 Nhập liệu", callback_data="action:data_entry"),
        telebot.types.InlineKeyboardButton("📊 Xem báo cáo", callback_data="action:report"),
        telebot.types.InlineKeyboardButton("⏰ Tạo job tự động", callback_data="action:schedule"),
    )
    bot.send_message(chat_id, welcome_text, reply_markup=markup, parse_mode="Markdown")


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
            user_id = message.from_user.id
            provider = USER_DEFAULT_PROVIDERS.get(user_id, "default")
            from ecosystem_bridge import ask_rag_engine
            res_dict = ask_rag_engine(question, provider)
            answer = res_dict.get("answer", "")
            images = res_dict.get("images", [])
            
            # Log to local NotebookLM session context
            try:
                active_project = "accounting"
                if not ctx_logger.current_session_file or ctx_logger.active_app_name != active_project:
                    ctx_logger.start_new_session(active_project)
                ctx_logger.log_interaction(
                    user_prompt=question,
                    ai_response=answer
                )
            except Exception as log_err:
                logger.error(f"Error logging business RAG interaction: {log_err}")

            
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


def process_data_entry_input(message, app_name, data_type):
    """Handles data input from user after selecting a data type."""
    user_id = message.from_user.id

    # If user sends a command, cancel the flow
    if message.text and message.text.startswith('/'):
        # Clear awaiting state
        if user_id in USER_APP_STATE:
            USER_APP_STATE[user_id].pop("step", None)
        return

    # If user sends a file/document
    if message.document:
        filename = message.document.file_name or "file"
        # Clear awaiting state
        if user_id in USER_APP_STATE:
            USER_APP_STATE[user_id].pop("step", None)

        markup = telebot.types.InlineKeyboardMarkup()
        markup.add(
            telebot.types.InlineKeyboardButton("📋 Nhập thêm dữ liệu", callback_data="action:data_entry"),
            telebot.types.InlineKeyboardButton("🏠 Quay về", callback_data="action:back_home"),
        )
        bot.reply_to(
            message,
            f"✅ **Đã nhận file: `{filename}`**\n\n"
            f"📦 App: `{app_name}`\n"
            f"📝 Loại: {data_type}\n\n"
            f"File sẽ được xử lý và nhập vào hệ thống.",
            reply_markup=markup,
            parse_mode="Markdown"
        )
        return

    # If user sends text data (not a command)
    if message.text:
        lines = [l for l in message.text.strip().split('\n') if l.strip()]
        line_count = len(lines)

        # Clear awaiting state
        if user_id in USER_APP_STATE:
            USER_APP_STATE[user_id].pop("step", None)

        markup = telebot.types.InlineKeyboardMarkup()
        markup.add(
            telebot.types.InlineKeyboardButton("📋 Nhập thêm dữ liệu", callback_data="action:data_entry"),
            telebot.types.InlineKeyboardButton("🏠 Quay về", callback_data="action:back_home"),
        )
        bot.reply_to(
            message,
            f"✅ **Đã nhận {line_count} dòng dữ liệu**\n\n"
            f"📦 App: `{app_name}`\n"
            f"📝 Loại: {data_type}\n\n"
            f"Dữ liệu sẽ được xử lý và nhập vào hệ thống.",
            reply_markup=markup,
            parse_mode="Markdown"
        )
        return


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
        active_project = "accounting"
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

# Fallback developer chat interface
@bot.message_handler(content_types=['contact'])
def handle_contact(message):
    user_id = message.from_user.id
    phone = message.contact.phone_number
    
    bot.reply_to(
        message,
        f"✅ **ĐÃ NHẬN SỐ ĐIỆN THOẠI ĐĂNG KÝ TRẢI NGHIỆM!**\n\n"
        f"- **Số điện thoại:** `{phone}`\n\n"
        f"Đang tạo tài khoản dùng thử và gửi mã OTP xác nhận...",
        parse_mode="Markdown",
        reply_markup=telebot.types.ReplyKeyboardRemove()
    )
    
    otp = auth_manager.generate_and_send_phone_otp(phone)
    AUTH_STATE[user_id] = {"step": "phone_otp_pending", "phone": phone}
    
    bot.send_message(
        message.chat.id,
        f"🔑 **GỬI MÃ OTP THÀNH CÔNG!**\n\n"
        f"Mã OTP 6 chữ số đã được gửi qua tin nhắn mô phỏng tới số `{phone}`.\n"
        f"*(Mã OTP cũng được hiển thị tại màn hình log console)*\n\n"
        f"Vui lòng nhập mã **OTP** để hoàn tất đăng ký:",
        parse_mode="Markdown"
    )

@bot.message_handler(func=lambda message: True)
def handle_agent_chat(message):
    user_id = message.from_user.id
    role = get_user_role(user_id)
    
    # Process OTP Authentication state machine
    if not role:
        state_info = AUTH_STATE.get(user_id)
        if not state_info:
            welcome_text = (
                f"🔒 **XÁC THỰC TÀI KHOẢN TRỢ LÝ SỐ**\n\n"
                f"Chào mừng bạn đến với **SuperApp Trợ Lý Số**!\n"
                f"Tài khoản Telegram của bạn chưa được liên kết với hệ thống.\n\n"
                f"Vui lòng chọn phương thức đăng nhập bên dưới:\n"
                f"1️⃣ Nhập trực tiếp **Email doanh nghiệp** của bạn (ví dụ: `director@superapp.com`)\n"
                f"2️⃣ Nhấp vào nút bàn phím phía dưới để **Đăng ký Trải nghiệm (Trial Mode)** nhanh chóng bằng Số điện thoại của bạn."
            )
            markup = telebot.types.ReplyKeyboardMarkup(one_time_keyboard=True, resize_keyboard=True)
            button = telebot.types.KeyboardButton(text="📱 Đăng ký Trải nghiệm bằng Số Điện Thoại", request_contact=True)
            markup.add(button)
            bot.send_message(message.chat.id, welcome_text, reply_markup=markup, parse_mode="Markdown")
            AUTH_STATE[user_id] = {"step": "email_pending"}
            return
            
        step = state_info.get("step")
        user_input = message.text.strip()
        
        if step == "email_pending":
            # Simple check if looks like email
            if "@" not in user_input or "." not in user_input:
                bot.reply_to(message, "⚠️ Định dạng email không hợp lệ. Vui lòng nhập lại email doanh nghiệp chuẩn hoặc click nút chia sẻ Số điện thoại phía dưới:")
                return
                
            matrix_info = auth_manager.check_superapp_matrix(user_input)
            if not matrix_info:
                bot.reply_to(message, "❌ Email doanh nghiệp không khớp với bất kỳ thông tin nhân sự nào của SuperApp. Vui lòng kiểm tra lại:")
                return
                
            # Generate OTP & notify user
            otp = auth_manager.generate_and_send_otp(user_input)
            AUTH_STATE[user_id] = {"step": "otp_pending", "email": user_input}
            bot.reply_to(
                message,
                f"🔑 **GỬI MÃ OTP THÀNH CÔNG!**\n\n"
                f"Chúng tôi đã gửi mã xác thực 6 chữ số đến email `{user_input}`.\n"
                f"*(Do đang trong môi trường giả lập, mã OTP cũng được hiển thị tại màn hình log console)*\n\n"
                f"Vui lòng nhập mã **OTP** để hoàn tất liên kết:",
                parse_mode="Markdown"
            )
            return
            
        elif step == "otp_pending":
            email = state_info.get("email")
            res = auth_manager.verify_otp_and_link(str(user_id), email, user_input)
            if res.get("success"):
                info = res.get("info")
                AUTH_STATE.pop(user_id, None) # Clear state
                success_text = (
                    f"🎉 **LIÊN KẾT DOANH NGHIỆP THÀNH CÔNG!**\n\n"
                    f"Tài khoản của bạn đã được kết nối an toàn với cơ sở dữ liệu SuperApp:\n"
                    f"- **Email:** `{email}`\n"
                    f"- **Vai trò:** `{info['role'].upper()}`\n"
                    f"- **Danh sách phân quyền:** `{', '.join(info['permissions'])}`\n\n"
                    f"Gõ lệnh `/help` để bắt đầu trải nghiệm trợ lý số!"
                )
                bot.reply_to(message, success_text, parse_mode="Markdown")
            else:
                bot.reply_to(message, f"❌ Xác thực thất bại: {res.get('message')} Vui lòng thử lại hoặc gõ email mới:")
                AUTH_STATE[user_id] = {"step": "email_pending"}
            return
            
        elif step == "phone_otp_pending":
            phone = state_info.get("phone")
            res = auth_manager.verify_phone_otp_and_link(str(user_id), phone, user_input)
            if res.get("success"):
                info = res.get("info")
                AUTH_STATE.pop(user_id, None) # Clear state
                success_text = (
                    f"🎉 **ĐĂNG KÝ TRẢI NGHIỆM THÀNH CÔNG! (TRIAL MODE)**\n\n"
                    f"Chào mừng bạn đến với Môi trường Trải nghiệm:\n"
                    f"- **Số điện thoại:** `{phone}`\n"
                    f"- **Vai trò:** `{info['role'].upper()}` (Quản trị viên Dùng thử)\n"
                    f"- **Ghi nhận dữ liệu:** Cục bộ cục bộ tại máy chủ (`trial_data.json`)\n\n"
                    f"Gõ lệnh `/help` để bắt đầu trải nghiệm đầy đủ các tính năng nghiệp vụ của Superapp!"
                )
                bot.reply_to(message, success_text, parse_mode="Markdown")
            else:
                bot.reply_to(message, f"❌ Mã OTP dùng thử không chính xác. Vui lòng nhập lại OTP:")
            return
            
        bot.reply_to(message, "⛔ Access Denied.")
        return
        
    # Check if user has an active data entry state
    app_state = USER_APP_STATE.get(user_id, {})
    if app_state.get("step") == "awaiting_data":
        app_name = app_state.get("selected_app", "")
        data_type = app_state.get("data_type", "")
        process_data_entry_input(message, app_name, data_type)
        return

    # Route natural language queries automatically to the RAG Search engine for a highly responsive, zero-friction UX
    process_rag_search_input(message)


if __name__ == "__main__":

    logger.info("Initializing Antigravity Autonomous Telegram Service...")
    
    # Setup scheduler for daily report at 18:00
    bg_scheduler = None
    if ALLOWED_USER_ID is not None:
        bg_scheduler = scheduler.setup_scheduler(bot, ALLOWED_USER_ID, "18:00")
        logger.info("Daily report scheduler started successfully.")
    
    logger.info("Telegram Bot service is listening (Polling)...")
    try:
        bot.infinity_polling()
    except KeyboardInterrupt:
        logger.info("Exiting application gracefully.")
        if bg_scheduler:
            bg_scheduler.shutdown()
        sys.exit(0)
