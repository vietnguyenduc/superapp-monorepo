import asyncio
from scraper.bypass_engine import BypassEngine
from scraper.media_processor import MediaProcessor
from agent.data_refiner import DataRefiner
import json

async def main():
    print("=== TEST ENGINE (MILESTONE 1, 2 & 3) ===")
    
    # [Milestone 1] - Nếu chưa có config/session.json thì bạn uncomment để chạy
    # engine = BypassEngine(headless=True)
    # test_url = "https://nowsecure.nl/" 
    # await engine.get_session(test_url)
    
    # [Milestone 2] - Chạy downloader (Comment lại để test M3)
    # print("\n--- Test Chế độ Số Lượng Lớn (Bulk Mode - Nén ảnh) ---")
    # bulk_processor = MediaProcessor(bulk_mode=True, max_concurrent=5)
    # test_urls = [ "https://picsum.photos/id/237/1500/1000", "https://picsum.photos/id/238/1500/1000" ]
    # await bulk_processor.download_all(test_urls)
    
    # [Milestone 3] - Test Data Refiner
    print("\n--- Test Data Refiner (Phân tích bằng AI) ---")
    
    # Đang set use_local_ollama=True để chạy Local. Nếu bạn chưa bật Ollama trên máy, nó sẽ báo lỗi Connection.
    refiner = DataRefiner(use_local_ollama=True)
    
    # Văn bản cào được giả lập (rất rác và chưa có cấu trúc)
    raw_scraped_text = """
    Welcome to our tech blog! Today we're looking at the new Python 3.12 release. 
    It's super fast, and they finally improved the error messages. 
    A lot of memory optimization has been done.
    By John Doe - Oct 25.
    Click here to subscribe! Ad: Buy cheap domain names.
    """
    
    result = refiner.refine_text(raw_text=raw_scraped_text, source_url="https://tech-blog-example.com/python-3-12")
    
    if result:
        print("\n[+] JSON Kết Quả Trả Về:")
        print(json.dumps(result, indent=2, ensure_ascii=False))

if __name__ == "__main__":
    asyncio.run(main())
