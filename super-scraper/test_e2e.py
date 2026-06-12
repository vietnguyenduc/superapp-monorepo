import requests
import time

URL = "https://vnexpress.net/the-thao"

print("1. Sending CRAWL request to API Server...")
try:
    res = requests.post("http://localhost:8000/api/crawl", json={"url": URL}, timeout=10)
    print(f"Response CRAWL: {res.json()}")
except Exception as e:
    print(f"Lỗi khi gọi API: {e}")
    exit(1)

print("\n2. Waiting 20 seconds for BypassEngine and AI to process data...")
for i in range(20, 0, -1):
    print(f"Remaining {i} seconds...")
    time.sleep(1)

print("\n3. Sending ASK request to API Server...")
try:
    res_ask = requests.post("http://localhost:8000/api/ask", json={"question": "Có tin tức thể thao nào đáng chú ý trên VNExpress không?"}, timeout=30)
    print("Response ASK saved to result.txt")
    with open("result.txt", "w", encoding="utf-8") as f:
        f.write(str(res_ask.json().get("data", res_ask.text)))
except Exception as e:
    print(f"Lỗi khi gọi API Ask: {e}")
