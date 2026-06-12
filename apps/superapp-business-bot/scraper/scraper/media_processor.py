import asyncio
import aiohttp
import aiofiles
import os
import json
import imagehash
from PIL import Image
from io import BytesIO
from datetime import datetime
from storage.db_manager import DBManager

class MediaProcessor:
    def __init__(self, bulk_mode: bool = True, max_concurrent: int = 10):
        """
        bulk_mode = True: Chế độ nén ảnh (lấy số lượng lớn)
        bulk_mode = False: Lấy ảnh gốc (chất lượng cao)
        """
        self.bulk_mode = bulk_mode
        self.semaphore = asyncio.Semaphore(max_concurrent)
        self.db = DBManager()
        self.session_file = os.path.join(os.path.dirname(__file__), '..', 'config', 'session.json')
        self.base_dir = os.path.join(os.path.dirname(__file__), '..', 'storage', 'raw_assets')
        os.makedirs(self.base_dir, exist_ok=True)
        
    def _get_headers_and_cookies(self):
        headers = {}
        cookies = {}
        if os.path.exists(self.session_file):
            with open(self.session_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
                if 'user_agent' in data:
                    headers['User-Agent'] = data['user_agent']
                for cookie in data.get('cookies', []):
                    cookies[cookie['name']] = cookie['value']
        
        # Fallback nếu không có file
        if not headers:
            headers['User-Agent'] = "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
        return headers, cookies

    def _process_and_hash_image(self, image_data: bytes) -> tuple:
        """
        Đọc ảnh từ byte, tính toán PHash, và nén ảnh nếu ở bulk_mode.
        Trả về (phash_str, processed_image_bytes, extension)
        """
        try:
            img = Image.open(BytesIO(image_data))
            # Nếu có Alpha channel (PNG) và muốn chuyển JPG thì bỏ qua hoặc xử lý
            if img.mode in ("RGBA", "P"):
                img = img.convert("RGB")
                
            # Tính toán perceptual hash (để phát hiện ảnh giống nhau)
            phash = str(imagehash.phash(img))
            
            output_io = BytesIO()
            if self.bulk_mode:
                # Chế độ số lượng lớn: resize nếu quá to và nén JPG
                img.thumbnail((1280, 1280), Image.Resampling.LANCZOS)
                img.save(output_io, format="JPEG", quality=75)
                ext = ".jpg"
            else:
                # Chế độ chất lượng cao: giữ nguyên
                img.save(output_io, format="PNG" if img.format == "PNG" else "JPEG", quality=100)
                ext = ".png" if img.format == "PNG" else ".jpg"
                
            return phash, output_io.getvalue(), ext
        except Exception as e:
            print(f"[!] Lỗi xử lý ảnh: {e}")
            return None, None, None

    async def download_image(self, session: aiohttp.ClientSession, url: str):
        async with self.semaphore:
            print(f"[*] Đang tải: {url}")
            try:
                # Tăng timeout lên 30s hoặc 60s để tránh lỗi kết nối chậm
                async with session.get(url, timeout=30) as response:
                    if response.status != 200:
                        print(f"[x] Lỗi HTTP {response.status} khi tải {url}")
                        return False
                        
                    raw_data = await response.read()
                    
                    # Xử lý ảnh và băm
                    phash, processed_data, ext = self._process_and_hash_image(raw_data)
                    
                    if not phash:
                        return False
                        
                    # Kiểm tra trùng lặp
                    if self.db.hash_exists(phash):
                        print(f"[-] Bỏ qua (Trùng lặp Hash: {phash}) -> {url}")
                        return False
                        
                    # Lưu file
                    today = datetime.now().strftime('%Y-%m-%d')
                    save_dir = os.path.join(self.base_dir, today)
                    os.makedirs(save_dir, exist_ok=True)
                    
                    filename = f"img_{phash}{ext}"
                    filepath = os.path.join(save_dir, filename)
                    
                    async with aiofiles.open(filepath, 'wb') as f:
                        await f.write(processed_data)
                        
                    # Lưu hash vào CSDL
                    self.db.save_hash(phash, filepath)
                    print(f"[+] Đã lưu ({len(processed_data)//1024} KB) -> {filename}")
                    return True
            except Exception as e:
                import traceback
                print(f"[x] Lỗi exception khi tải {url}: {repr(e)}")
                traceback.print_exc()
                return False

    async def download_all(self, urls: list):
        headers, cookies = self._get_headers_and_cookies()
        connector = aiohttp.TCPConnector(limit=50) # Tối đa kết nối
        
        async with aiohttp.ClientSession(headers=headers, cookies=cookies, connector=connector) as session:
            tasks = [self.download_image(session, url) for url in urls]
            results = await asyncio.gather(*tasks)
            
            success = sum(1 for r in results if r is True)
            print(f"\n=== TỔNG KẾT MILESTONE 2 ===")
            print(f"Tổng số link  : {len(urls)}")
            print(f"Tải thành công: {success}")
            print(f"Bỏ qua (trùng/lỗi): {len(urls) - success}")
