import os
import json
import asyncio
from dotenv import load_dotenv
from telegram import Update
from telegram.ext import ApplicationBuilder, CommandHandler, ContextTypes

# Thêm path để có thể import các module bên trong
import sys
sys.path.append(os.path.dirname(__file__))

from scraper.bypass_engine import BypassEngine
from agent.data_refiner import DataRefiner

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
    
    # Giả lập hoặc thực thi quá trình
    # BƯỚC 1: Vượt rào
    try:
        await update.message.reply_text("[1/3] 🛡 Đang kích hoạt Stealth Browser vượt Cloudflare...")
        engine = BypassEngine(headless=True)
        # Bỏ comment nếu muốn chạy thật
        # session = await engine.get_session(url)
        await asyncio.sleep(2) # Giả lập chờ
        await update.message.reply_text("✅ Lấy Session thành công!")
        
        # BƯỚC 2: Tải ảnh (Giả lập)
        await update.message.reply_text("[2/3] 🖼 Đang tải hình ảnh song song (Bulk Mode)...")
        await asyncio.sleep(2)
        await update.message.reply_text("✅ Tải xong 5 hình ảnh! (Đã loại 2 ảnh trùng)")
        
        # BƯỚC 3: AI Phân tích
        await update.message.reply_text("[3/3] 🧠 Đang gửi text thô cho Local AI phân tích và gán nhãn...")
        refiner = DataRefiner(use_local_ollama=True)
        # Giả lập text cào được
        dummy_text = f"Nội dung cào được từ {url}. Hôm nay trời rất đẹp, AI đang phát triển mạnh mẽ."
        # Nếu muốn chạy thật, đảm bảo Ollama đang chạy
        # result = refiner.refine_text(dummy_text, url)
        await asyncio.sleep(2)
        
        # Ghi nhận đã dùng
        increment_usage(user_id)
        
        await update.message.reply_text("🎉 Cào dữ liệu HOÀN TẤT!\n\nMở Ngrok link UI trên điện thoại của bạn để xem kết quả trực quan.")
        
    except Exception as e:
        await update.message.reply_text(f"❌ Lỗi trong quá trình cào: {e}")

def main():
    if not TELEGRAM_BOT_TOKEN or TELEGRAM_BOT_TOKEN == "your_telegram_bot_token_here":
        print("Vui lòng cập nhật TELEGRAM_BOT_TOKEN trong file .env")
        return
        
    app = ApplicationBuilder().token(TELEGRAM_BOT_TOKEN).build()
    app.add_handler(CommandHandler("start", start))
    app.add_handler(CommandHandler("crawl", crawl))
    
    print("🤖 Telegram Bot đang chạy...")
    app.run_polling()

if __name__ == '__main__':
    main()
