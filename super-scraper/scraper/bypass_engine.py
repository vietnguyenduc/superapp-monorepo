import asyncio
import json
import os
import aiofiles
from playwright.async_api import async_playwright
from playwright_stealth import stealth_async
import aiohttp
from PIL import Image
import imagehash
from io import BytesIO
import uuid

async def download_image_async(url: str, session: aiohttp.ClientSession, save_dir: str) -> dict:
    """Download image, compute pHash, and save if valid."""
    try:
        async with session.get(url, timeout=10) as resp:
            if resp.status == 200:
                data = await resp.read()
                try:
                    img = Image.open(BytesIO(data))
                    # Compute perceptual hash
                    phash = str(imagehash.phash(img))
                    
                    # Determine extension
                    ext = img.format.lower() if img.format else "jpg"
                    if ext == "jpeg": ext = "jpg"
                    
                    file_name = f"{uuid.uuid4().hex}.{ext}"
                    os.makedirs(save_dir, exist_ok=True)
                    file_path = os.path.join(save_dir, file_name)
                    
                    # Save locally
                    img.save(file_path)
                    
                    return {
                        "status": "success",
                        "hash": phash,
                        "file_path": file_path,
                        "url": url
                    }
                except Exception as e:
                    return {"status": "error", "message": f"Invalid image data: {e}", "url": url}
            else:
                return {"status": "error", "message": f"HTTP {resp.status}", "url": url}
    except Exception as e:
        return {"status": "error", "message": str(e), "url": url}

class BypassEngine:
    def __init__(self, headless: bool = False):
        """
        Khởi tạo BypassEngine sử dụng Playwright và Stealth.
        Mặc định headless = False để dễ dàng vượt Cloudflare ở lần chạy đầu.
        """
        self.headless = headless
        self.session_file = os.path.join(os.path.dirname(__file__), '..', 'config', 'session.json')

    async def get_session(self, url: str):
        """
        Truy cập URL, đợi Cloudflare check, sau đó lấy Cookie và User-Agent lưu lại.
        """
        print(f"[*] Khởi động Stealth Browser đi tới: {url}")
        async with async_playwright() as p:
            # Khởi tạo trình duyệt Chromium (không khuyến khích Firefox/Webkit cho Cloudflare)
            browser = await p.chromium.launch(headless=self.headless, args=[
                "--disable-blink-features=AutomationControlled",
                "--start-maximized"
            ])
            
            # Khởi tạo context với viewport chuẩn giống người dùng thật
            context = await browser.new_context(
                no_viewport=True,
                user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            )
            
            page = await context.new_page()
            
            # Kích hoạt plugin Stealth để giấu thân phận automation
            await stealth_async(page)
            
            # Truy cập trang đích
            await page.goto(url)
            
            print("[*] Đợi 5 giây để Cloudflare challenge xử lý (nếu có)...")
            await asyncio.sleep(5)
            
            # Bạn có thể thêm logic chờ thẻ HTML cụ thể nếu cần
            # await page.wait_for_selector("body", state="visible")
            
            # Sau khi qua được challenge, tiến hành trích xuất dữ liệu
            cookies = await context.cookies()
            user_agent = await page.evaluate("navigator.userAgent")
            
            session_data = {
                "user_agent": user_agent,
                "cookies": cookies
            }
            
            # Đảm bảo thư mục config tồn tại
            os.makedirs(os.path.dirname(self.session_file), exist_ok=True)
            
            # Lưu session vào file
            async with aiofiles.open(self.session_file, mode='w', encoding='utf-8') as f:
                await f.write(json.dumps(session_data, indent=4))
                
            print(f"[+] Lấy Session thành công! Đã lưu {len(cookies)} cookies vào {self.session_file}")
            
            await browser.close()
            return session_data
