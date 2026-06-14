import os
import sys
import time
import logging
import threading
import subprocess
from pathlib import Path
from dotenv import load_dotenv
import telebot

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(name)s: %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger("AdminBot")

# Load environment variables
load_dotenv()
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
ALLOWED_USER_ID = os.getenv("ALLOWED_TELEGRAM_USER_ID")

if not TELEGRAM_BOT_TOKEN:
    logger.error("TELEGRAM_BOT_TOKEN not found in .env")
    sys.exit(1)

# Initialize bot
bot = telebot.TeleBot(TELEGRAM_BOT_TOKEN)

# Import and start Watchdog
try:
    from core.watchdog import SystemWatchdog
    admin_id = str(ALLOWED_USER_ID).split(",")[0].strip() if ALLOWED_USER_ID else None
    watchdog = SystemWatchdog(bot_instance=bot, admin_chat_id=admin_id, interval_sec=600)
    watchdog.start()
    logger.info("SystemWatchdog started successfully.")
except Exception as e:
    logger.error(f"Failed to start SystemWatchdog: {e}")
    watchdog = None

# Middleware to check auth
def is_authorized(message):
    user_id = str(message.from_user.id)
    if ALLOWED_USER_ID and user_id not in ALLOWED_USER_ID.split(","):
        logger.warning(f"Unauthorized access attempt by {user_id}")
        return False
    return True

@bot.message_handler(commands=['start', 'help'], func=is_authorized)
def send_welcome(message):
    help_text = (
        "👑 **SYSTEM ADMIN BOT (Kẻ Phán Xử)** 👑\n\n"
        "Tôi là bot đứng ngoài vòng lặp AI, giám sát toàn bộ máy chủ và dọn rác.\n\n"
        "🛠 **Lệnh quản trị:**\n"
        "`/ping` - Kiểm tra sinh tồn\n"
        "`/botstat` - Xem thống kê RAM/CPU máy chủ\n"
        "`/ports` - Liệt kê các Port đang mở (Vite/Node)\n"
        "`/killnode` - Tiêu diệt toàn bộ Node.js (Vite/Next) bị treo\n"
        "`/rebootall` - Tát chết toàn bộ Python để khởi động lại hệ thống AI\n"
        "`/logs_dev` - Xem 50 dòng log cuối của Dev Bot\n"
        "`/logs_biz` - Xem 50 dòng log cuối của Business Bot\n"
    )
    bot.reply_to(message, help_text, parse_mode="Markdown")

@bot.message_handler(commands=['ports'], func=is_authorized)
def list_ports(message):
    import psutil
    bot.send_chat_action(message.chat.id, 'typing')
    open_ports = []
    
    for conn in psutil.net_connections(kind='inet'):
        if conn.status == 'LISTEN':
            try:
                proc = psutil.Process(conn.pid)
                if proc.name().lower() in ['node.exe', 'python.exe']:
                    open_ports.append(f"- **Port {conn.laddr.port}** | `{proc.name()}` (PID: {conn.pid})")
            except (psutil.NoSuchProcess, psutil.AccessDenied):
                pass
                
    if not open_ports:
        bot.reply_to(message, "🔌 Không có Port nào của Node.js hay Python đang mở.")
        return
        
    ports_msg = "🔌 **Các Port đang mở trên máy chủ:**\n" + "\n".join(sorted(list(set(open_ports))))
    bot.reply_to(message, ports_msg, parse_mode="Markdown")

@bot.message_handler(commands=['ping'], func=is_authorized)
def ping(message):
    bot.reply_to(message, "✅ System Admin Bot is alive and monitoring!")

@bot.message_handler(commands=['botstat'], func=is_authorized)
def botstat(message):
    try:
        import psutil
        import time
        import requests
        from datetime import datetime
        
        mem = psutil.virtual_memory()
        cpu = psutil.cpu_percent(interval=1)
        disk = psutil.disk_usage('/')
        
        # Ngrok status
        ngrok_tunnels = []
        try:
            resp = requests.get("http://127.0.0.1:4040/api/tunnels", timeout=2)
            if resp.status_code == 200:
                for t in resp.json().get("tunnels", []):
                    ngrok_tunnels.append(t.get("public_url"))
        except Exception:
            pass
        ngrok_status = ", ".join(ngrok_tunnels) if ngrok_tunnels else "Không có tunnel nào"

        # Ports status
        open_ports = []
        for conn in psutil.net_connections(kind='inet'):
            if conn.status == 'LISTEN':
                try:
                    proc = psutil.Process(conn.pid)
                    if proc.name().lower() in ['node.exe', 'python.exe', 'python3.11.exe']:
                        open_ports.append(str(conn.laddr.port))
                except (psutil.NoSuchProcess, psutil.AccessDenied):
                    pass
        ports_status = ", ".join(sorted(list(set(open_ports)))) if open_ports else "Không có"
        
        # Lấy thông tin Watchdog
        wd_status = "🔴 Dừng hoạt động"
        wd_backup = "Chưa chạy"
        wd_clean = "Chưa chạy"
        lint_status = "🔴 Tắt"
        
        global watchdog
        if watchdog and watchdog.is_running:
            wd_status = "🟢 Đang chạy ngầm (Chu kỳ 10 phút)"
            if getattr(watchdog, '_lint_observer', None) is not None:
                lint_status = "🟢 Đang giám sát (Active)"
            
            if hasattr(watchdog, '_last_git_backup_time') and watchdog._last_git_backup_time > 0:
                wd_backup = datetime.fromtimestamp(watchdog._last_git_backup_time).strftime('%H:%M:%S %d/%m')
            if hasattr(watchdog, '_last_disk_clean_time') and watchdog._last_disk_clean_time > 0:
                wd_clean = datetime.fromtimestamp(watchdog._last_disk_clean_time).strftime('%H:%M:%S %d/%m')
                
        stat_msg = (
            f"📊 <b>System Status</b>\n"
            f"CPU: <code>{cpu}%</code>\n"
            f"RAM: <code>{mem.percent}%</code> ({mem.used // (1024**2)}MB / {mem.total // (1024**2)}MB)\n"
            f"Disk: <code>{disk.percent}%</code> ({disk.free // (1024**3)}GB Free)\n\n"
            f"🌐 <b>Network & Ports</b>\n"
            f"Ngrok Tunnels: <code>{ngrok_status}</code>\n"
            f"Active Ports (Node/Py): <code>{ports_status}</code>\n\n"
            f"🛡 <b>Watchdog & DevOps Agent</b>\n"
            f"Trạng thái: {wd_status}\n"
            f"Lint Error Watcher: {lint_status}\n"
            f"Lần Backup Git cuối: <code>{wd_backup}</code>\n"
            f"Lần Dọn Rác cuối: <code>{wd_clean}</code>"
        )
        bot.reply_to(message, stat_msg, parse_mode="HTML")
    except Exception as e:
        bot.reply_to(message, f"❌ Lỗi nội bộ trong botstat:\n{str(e)}")

@bot.message_handler(commands=['killnode'], func=is_authorized)
def killnode(message):
    bot.reply_to(message, "⚔️ Executing Order 66 on Node.js processes...")
    subprocess.run(["powershell", "-Command", "Stop-Process -Name 'node' -Force -ErrorAction SilentlyContinue"])
    bot.reply_to(message, "✅ Đã trảm toàn bộ Node.js zombies!")

@bot.message_handler(commands=['rebootall'], func=is_authorized)
def rebootall(message):
    bot.reply_to(message, "💥 Đang chém bay màu toàn bộ Python (Rebooting AI Bots)...")
    # Tự sát cũng nằm trong danh sách này nếu tên tiến trình là python, 
    # Nhưng nếu ta dùng python, ta sẽ bị giết. run.bat sẽ khởi động lại ta.
    subprocess.run(["powershell", "-Command", "Stop-Process -Name 'python' -Force -ErrorAction SilentlyContinue; Stop-Process -Name 'python3.11' -Force -ErrorAction SilentlyContinue"])

@bot.message_handler(commands=['logs_dev'], func=is_authorized)
def logs_dev(message):
    log_path = Path("c:/Vibecoding/superapp-monorepo/apps/antigravity-telegram-agent/.system_generated/logs/transcript.jsonl")
    if log_path.exists():
        try:
            res = subprocess.run(["powershell", "-Command", f"Get-Content '{log_path}' -Tail 20"], capture_output=True, text=True)
            bot.reply_to(message, f"📜 **Dev Bot Logs:**\n```text\n{res.stdout[-3000:]}\n```", parse_mode="Markdown")
        except Exception as e:
            bot.reply_to(message, f"Lỗi đọc log: {e}")
    else:
        bot.reply_to(message, "Không tìm thấy file log Dev Bot.")

@bot.message_handler(commands=['logs_biz'], func=is_authorized)
def logs_biz(message):
    log_path = Path("c:/Vibecoding/superapp-monorepo/apps/superapp-business-bot/.system_generated/logs/transcript.jsonl")
    if log_path.exists():
        try:
            res = subprocess.run(["powershell", "-Command", f"Get-Content '{log_path}' -Tail 20"], capture_output=True, text=True)
            bot.reply_to(message, f"📜 **Business Bot Logs:**\n```text\n{res.stdout[-3000:]}\n```", parse_mode="Markdown")
        except Exception as e:
            bot.reply_to(message, f"Lỗi đọc log: {e}")
    else:
        bot.reply_to(message, "Không tìm thấy file log Business Bot.")

if __name__ == "__main__":
    logger.info("System Admin Bot is listening...")
    try:
        bot.infinity_polling()
    except KeyboardInterrupt:
        if watchdog:
            watchdog.stop()
        sys.exit(0)
