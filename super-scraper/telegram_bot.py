import os
import json
import asyncio
from dotenv import load_dotenv
from telegram import Update
from telegram.ext import ApplicationBuilder, CommandHandler, ContextTypes

# Thêm path để có thể import các module bên trong
import sys
sys.path.append(os.path.dirname(__file__))

from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import ApplicationBuilder, CommandHandler, MessageHandler, filters, ContextTypes
import requests

API_BASE_URL = "http://localhost:8000/api"

def get_dynamic_ngrok_url():
    # Thử lấy từ biến môi trường trước
    env_url = os.getenv("WEB_APP_URL")
    if env_url and env_url != "https://your-ngrok-url.ngrok-free.app":
        return env_url
        
    # Thử gọi ngrok local API để lấy URL tự động
    try:
        response = requests.get("http://127.0.0.1:4040/api/tunnels", timeout=2)
        if response.status_code == 200:
            tunnels = response.json().get("tunnels", [])
            for t in tunnels:
                if t.get("proto") == "https":
                    return t.get("public_url")
    except Exception:
        pass
        
    return "https://chua-co-link-ngrok.ngrok-free.app"

load_dotenv()

TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
LIMIT_FILE = os.path.join(os.path.dirname(__file__), 'storage', 'trial_usage.json')
MAX_CRAWLS = 3

def get_usage(user_id: str) -> int:
    if not os.path.exists(LIMIT_FILE):
        return 0
    with open(LIMIT_FILE, 'r') as f:
        try:
            data = json.load(f)
            return data.get(str(user_id), 0)
        except:
            return 0

def increment_usage(user_id: str):
    data = {}
    if os.path.exists(LIMIT_FILE):
        with open(LIMIT_FILE, 'r') as f:
            try:
                data = json.load(f)
            except:
                pass
    current = data.get(str(user_id), 0)
    data[str(user_id)] = current + 1
    os.makedirs(os.path.dirname(LIMIT_FILE), exist_ok=True)
    with open(LIMIT_FILE, 'w') as f:
        json.dump(data, f)

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text("👋 Chào mừng tới Super Scraper Bot!\nGõ /crawl <URL> để bắt đầu cào dữ liệu.")

async def crawl(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = str(update.effective_user.id)
    
    if len(context.args) == 0:
        await update.message.reply_text("Vui lòng cung cấp URL. VD: /crawl https://example.com")
        return
        
    url = context.args[0]
    
    # Ở phiên bản độc lập này, giả định admin id là một số cụ thể hoặc luôn kiểm tra
    is_admin = False # Gắn logic check role nếu cần
    
    # Kiểm tra giới hạn dùng thử
    if not is_admin:
        usage = get_usage(user_id)
        if usage >= MAX_CRAWLS:
            await update.message.reply_text(f"🚫 Bạn đã đạt giới hạn dùng thử ({MAX_CRAWLS}/{MAX_CRAWLS} lần). Vui lòng nâng cấp tài khoản để tiếp tục.")
            return
            
        await update.message.reply_text(f"🚀 Bắt đầu cào dữ liệu từ: {url}\n(Lượt dùng: {usage+1}/{MAX_CRAWLS})")
    else:
        await update.message.reply_text(f"🚀 Bắt đầu cào dữ liệu từ: {url}\n(Đặc quyền: Không giới hạn / Admin)")
    
    # Gọi qua API
    try:
        payload = {
            "url": url,
            "user_id": user_id,
            "is_admin": is_admin
        }
        res = requests.post(f"{API_BASE_URL}/crawl", json=payload, timeout=5)
        if res.status_code == 200:
            await update.message.reply_text("✅ Tác vụ cào đã được gửi lên Server Core thành công. Hệ thống đang chạy ngầm...")
        else:
            await update.message.reply_text(f"❌ Server Core trả về lỗi: {res.text}")
    except Exception as e:
        await update.message.reply_text(f"❌ Không thể kết nối tới Server Core. Hãy chắc chắn super-scraper API đang chạy.\nLỗi: {e}")

async def ask(update: Update, context: ContextTypes.DEFAULT_TYPE):
    question = " ".join(context.args)
    if not question:
        await update.message.reply_text("Vui lòng nhập câu hỏi. VD: /ask Cho tôi xem hình ảnh về xe hơi")
        return
        
    await update.message.reply_text("🧠 Đang tìm kiếm trong kho dữ liệu (6 tháng)...")
    try:
        res = requests.post(f"{API_BASE_URL}/ask", json={"question": question}, timeout=60)
        if res.status_code == 200:
            data = res.json().get("data", {})
            answer = data.get("answer", "")
            
            # Gửi câu trả lời text
            if answer:
                await update.message.reply_text(answer, parse_mode="Markdown")
            
            # Gửi ảnh preview nếu có
            images = data.get("images", [])
            for img in images:
                try:
                    await update.message.reply_photo(img.get("url"), caption=img.get("title"))
                except:
                    pass
        else:
            await update.message.reply_text(f"❌ Lỗi từ server: {res.text}")
    except Exception as e:
        await update.message.reply_text(f"❌ Lỗi kết nối tới Server Core: {e}")

async def apps_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    dynamic_url = get_dynamic_ngrok_url()
    keyboard = [
        [InlineKeyboardButton("Mở Web App", url=dynamic_url)]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    await update.message.reply_text("🖥️ Nhấn vào nút bên dưới để mở giao diện Web App cao cấp:", reply_markup=reply_markup)

def main():
    if not TELEGRAM_BOT_TOKEN or TELEGRAM_BOT_TOKEN == "your_telegram_bot_token_here":
        print("Vui lòng cập nhật TELEGRAM_BOT_TOKEN trong file .env")
        return
        
    app = ApplicationBuilder().token(TELEGRAM_BOT_TOKEN).build()
    app.add_handler(CommandHandler("start", start))
    app.add_handler(CommandHandler("crawl", crawl))
    app.add_handler(CommandHandler("ask", ask))
    app.add_handler(CommandHandler("apps", apps_command))
    
    print("🤖 Telegram Bot đang chạy...")
    app.run_polling()

if __name__ == '__main__':
    main()
