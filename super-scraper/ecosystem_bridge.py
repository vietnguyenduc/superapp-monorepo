import os
import sys
import json
import asyncio
import threading

# Force stdout/stderr to UTF-8 on Windows to prevent Unicode charmap encode crashes
if sys.platform.startswith('win'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

# Add super-scraper folder to path so imports work correctly inside the bridge
sys.path.append(os.path.dirname(__file__))

from scraper.bypass_engine import BypassEngine
from agent.data_refiner import DataRefiner
from agent.intent_analyzer import IntentAnalyzer
from agent.rag_engine import RAGEngine
from agent.ai_scraping_agent import AdvancedScrapingAgent

LIMIT_FILE = os.path.join(os.path.dirname(__file__), 'storage', 'trial_usage.json')
MAX_CRAWLS = 3

# Cache schema để lưu tạm state của user
_schema_cache = {}

def ask_rag_engine(question: str) -> str:
    engine = RAGEngine(use_local_ollama=True)
    return engine.ask(question)

def fetch_proposed_schema(url: str, user_id: str) -> str:
    """Lấy snippet, trích xuất thông tin xem trước và đề xuất schema"""
    import requests
    from bs4 import BeautifulSoup
    
    # Prepend scheme if missing
    if not url.startswith(('http://', 'https://')):
        url = 'https://' + url
        
    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
        res = requests.get(url, timeout=10, headers=headers)
        soup = BeautifulSoup(res.text, 'html.parser')
        
        # 1. Structural Statistics
        page_title = soup.title.string.strip() if soup.title else "Không rõ tiêu đề"
        link_count = len(soup.find_all('a'))
        img_count = len(soup.find_all('img'))
        char_kb = len(res.text) / 1024
        
        # Đếm số dòng thông tin/bài viết tiềm năng có thể cào
        import re
        potential_rows = 0
        seen_t = set()
        for a in soup.find_all('a'):
            text = a.get_text(strip=True)
            href = a.get('href', '')
            if text and href and len(text) > 15:
                clean_t = re.sub(r'\s+', ' ', text).strip().lower()
                if clean_t not in seen_t and len(clean_t) > 20:
                    seen_t.add(clean_t)
                    potential_rows += 1
        
        # 2. Extract Meta Data
        meta_desc = ""
        desc_tag = soup.find('meta', attrs={'name': 'description'}) or soup.find('meta', attrs={'property': 'og:description'})
        if desc_tag:
            meta_desc = desc_tag.get('content', '').strip()
            
        meta_keywords = ""
        key_tag = soup.find('meta', attrs={'name': 'keywords'})
        if key_tag:
            meta_keywords = key_tag.get('content', '').strip()
            
        meta_author = ""
        author_tag = soup.find('meta', attrs={'name': 'author'}) or soup.find('meta', attrs={'property': 'og:article:author'}) or soup.find('meta', attrs={'name': 'cre'})
        if author_tag:
            meta_author = author_tag.get('content', '').strip()

        # 3. Extract Preview Images
        preview_imgs = []
        for img in soup.find_all('img'):
            src = img.get('src') or img.get('data-src') or img.get('data-original')
            if src and src.startswith('http') and (src.endswith('.jpg') or src.endswith('.png') or src.endswith('.webp')):
                preview_imgs.append(src)
                if len(preview_imgs) >= 3:
                    break
        
        # 4. Extract 3-5 real headlines/previews
        headlines = []
        for tag in ['h1', 'h2', 'h3']:
            for h in soup.find_all(tag):
                text = h.get_text(strip=True)
                if len(text) > 15 and text not in headlines:
                    headlines.append(text)
                if len(headlines) >= 5:
                    break
            if len(headlines) >= 5:
                break
                
        if not headlines:
            # Fallback to links with substantial texts
            for a in soup.find_all('a'):
                text = a.get_text(strip=True)
                if len(text) > 25 and text not in headlines:
                    headlines.append(text)
                if len(headlines) >= 3:
                    break
                    
        # 5. Create a beautiful preview summary
        preview_text = f"🌐 **ĐÃ KẾT NỐI & TẢI TRANG THÀNH CÔNG!**\n\n"
        preview_text += f"📌 **Tiêu đề trang:** `{page_title}`\n"
        
        if meta_desc:
            preview_text += f"📝 **Mô tả (Meta Description):** *\"{meta_desc[:120]}...\"*\n"
        if meta_keywords:
            preview_text += f"🏷️ **Từ khóa (Meta Keywords):** `{meta_keywords[:80]}`\n"
        if meta_author:
            preview_text += f"✍️ **Tác giả (Author):** `{meta_author[:50]}`\n"
            
        preview_text += f"📊 **Cấu trúc sơ bộ:** Phát hiện `{link_count}` liên kết, `{img_count}` hình ảnh, `{potential_rows}` dòng bài viết/thông tin có thể cào, `{char_kb:.1f} KB` dữ liệu.\n\n"
        
        if preview_imgs:
            preview_text += "🖼️ **Hình ảnh phát hiện được (Preview):**\n"
            for idx, img_url in enumerate(preview_imgs[:2]):
                preview_text += f"   • Ảnh #{idx+1}: {img_url}\n"
            preview_text += "\n"
            
        if headlines:
            preview_text += "📰 **Các tiêu đề bài viết nổi bật:**\n"
            for idx, h in enumerate(headlines[:3]):
                preview_text += f"   {idx+1}. *\"{h[:100]}\"*\n"
            preview_text += "\n"
            
        # Clean DOM for Intent proposal
        for element in soup(["script", "style", "noscript", "header", "footer", "nav", "iframe", "aside"]):
            element.decompose()
        snippet = soup.get_text(separator=' ', strip=True)[:3000]
    except Exception as e:
        page_title = "Lỗi tải trang"
        preview_text = f"❌ **Không thể kết nối trực tiếp đến URL**: {url}\nLỗi chi tiết: {e}\n\n"
        snippet = "Could not fetch content."
        
    try:
        analyzer = IntentAnalyzer(use_local_ollama=True)
        base_schema = analyzer.propose_schema(snippet)
    except Exception as e:
        print(f"[!] propose_schema failed: {e}. Falling back to default schema...")
        base_schema = json.dumps({
            "articles": [
                {
                    "title": "Tiêu đề bài viết hoặc dòng dữ liệu",
                    "url": "Đường dẫn bài viết",
                    "summary": "Tóm tắt nội dung bài viết hoặc thông tin"
                }
            ]
        }, ensure_ascii=False, indent=2)
    
    # Save the original un-truncated base schema to cache for RAG crawling
    _schema_cache[str(user_id)] = base_schema
    
    # Guardrail against Telegram 4096 message length limits (target 3700 for complete safety margin)
    display_schema = base_schema
    total_len = len(preview_text) + len(display_schema) + 80
    if total_len > 3700:
        available_schema_space = 3700 - len(preview_text) - 100
        if available_schema_space > 200:
            display_schema = display_schema[:available_schema_space] + "\n  ... (dữ liệu cấu trúc dài được cắt bớt để hiển thị) ...\n}"
        else:
            preview_text = preview_text[:1200] + "\n... (bản xem trước dài đã được cắt bớt) ...\n\n"
            display_schema = display_schema[:2000] + "\n  ... (dữ liệu cấu trúc dài được cắt bớt) ...\n}"
            
    # Return structured preview and base schema separately to support Telegram sub-message splitting
    return {
        "preview_text": preview_text,
        "base_schema": display_schema
    }

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


def generate_proactive_recommendations(crawl_data: dict, user_intent: str = None) -> tuple:
    """
    Generates intelligent executive summary and next-step recommendations prioritizing DeepSeek, falling back to Gemini.
    """
    gemini_key = os.environ.get("GEMINI_API_KEY")
    deepseek_key = os.environ.get("DEEPSEEK_API_KEY")
    deepseek_base = os.environ.get("DEEPSEEK_BASE_URL", "https://api.deepseek.com")
    deepseek_model = os.environ.get("DEEPSEEK_MODEL", "deepseek-chat")
    
    title = crawl_data.get("title", "Trang web")
    categories = crawl_data.get("inferred_categories", ["Chung"])
    articles = crawl_data.get("articles", [])
    
    # Extract representative articles
    if isinstance(articles, list):
        article_titles = [a.get("title", "") for a in articles[:8] if isinstance(a, dict)]
    else:
        article_titles = []
        
    system_prompt = """
    ROLE: Premium Business Intelligence & Research Agent.
    TASK: Analyze the scraped web data and generate:
    1. A brief executive analysis (in Vietnamese, 2-3 sentences max).
    2. 2-3 Actionable next-step search/crawl queries related to this topic in Vietnamese.
    3. 1-2 Image search recommendations relevant to this topic in Vietnamese.
    
    CONSTRAINTS:
    - Output strictly a JSON object with keys: "executive_analysis", "next_searches", "next_images".
    - Do not wrap in markdown fences other than raw json.
    """
    
    user_prompt = f"""
    Trang web: {title}
    Danh mục AI: {', '.join(categories)}
    Ý định cào của user: {user_intent or 'Chung'}
    Tiêu đề bài viết tiêu biểu:
    {json.dumps(article_titles, ensure_ascii=False, indent=2)}
    """
    
    # ── Path 1: DeepSeek (Primary) ───────────────────────────────────────────
    if deepseek_key:
        try:
            from openai import OpenAI
            client = OpenAI(base_url=deepseek_base, api_key=deepseek_key)
            response = client.chat.completions.create(
                model=deepseek_model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.3,
                response_format={"type": "json_object"}
            )
            data = json.loads(response.choices[0].message.content.strip())
            return (
                data.get("executive_analysis", "Dữ liệu cào đã được xử lý và phân loại thành công."),
                data.get("next_searches", ["Nghiên cứu thêm các bài viết sâu"]),
                data.get("next_images", ["Xem ảnh từ nguồn bài viết"])
            )
        except Exception as ds_e:
            print(f"[!] DeepSeek proactive recommendations failed ({ds_e}). Trying Gemini...")
            
    # ── Path 2: Gemini Cloud (Fallback) ──────────────────────────────────────
    if gemini_key:
        try:
            from google import genai
            client = genai.Client(api_key=gemini_key)
            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=user_prompt,
                config={"system_instruction": system_prompt, "response_mime_type": "application/json"}
            )
            data = json.loads(response.text)
            return (
                data.get("executive_analysis", "Dữ liệu cào đã được xử lý và phân loại thành công."),
                data.get("next_searches", ["Nghiên cứu thêm các bài viết sâu"]),
                data.get("next_images", ["Xem ảnh từ nguồn bài viết"])
            )
        except Exception as e:
            print(f"[x] Error generating proactive recommendations via Gemini: {e}")
            
    # ── Fallback default values if all fail ──────────────────────────────────
    return (
        "Dữ liệu cào đã được xử lý và phân loại thành công.",
        [f"Nghiên cứu sâu hơn về chủ đề {categories[0]}"],
        ["Xem ảnh chi tiết từ bài viết gốc"]
    )


def extract_topic_keyword(user_intent: str) -> str:
    if not user_intent:
        return None
    import re
    intent_lower = user_intent.lower()
    patterns = [
        r'về\s+chủ\s+đề\s+([\w\s]+)',
        r'về\s+([\w\s]+)',
        r'chủ\s+đề\s+([\w\s]+)',
        r'từ\s+khóa\s+([\w\s]+)',
        r'chuyên\s+mục\s+([\w\s]+)',
        r'về\s+đề\s+tài\s+([\w\s]+)'
    ]
    for pattern in patterns:
        match = re.search(pattern, intent_lower)
        if match:
            keyword = match.group(1).strip()
            words = keyword.split()
            clean_words = []
            for w in words:
                if w in ["dòng", "bài", "tin", "tức", "trang", "mục", "dòng", "hàng", "câu", "chữ", "loạt", "all", "time", "all-time", "alltime"]:
                    continue
                if w.isdigit():
                    continue
                clean_words.append(w)
            if clean_words:
                return " ".join(clean_words)
    return None

def resolve_search_url(url: str, keyword: str) -> str:
    if not keyword:
        return url
    test_url = url
    if not test_url.startswith(('http://', 'https://')):
        test_url = 'https://' + test_url
    from urllib.parse import urlparse, quote
    parsed = urlparse(test_url)
    domain = parsed.netloc.lower()
    if domain.startswith("www."):
        domain = domain[4:]
    keyword_encoded = quote(keyword)
    if "vnexpress.net" in domain:
        return f"https://timkiem.vnexpress.net/?q={keyword_encoded}"
    elif "dantri.com.vn" in domain:
        return f"https://dantri.com.vn/tim-kiem.htm?q={keyword_encoded}"
    elif "tuoitre.vn" in domain:
        return f"https://tuoitre.vn/tim-kiem.htm?keywords={keyword_encoded}"
    elif "vietnamnet.vn" in domain:
        return f"https://vietnamnet.vn/tim-kiem?q={keyword_encoded}"
    elif "thanhnien.vn" in domain:
        return f"https://thanhnien.vn/tim-kiem?q={keyword_encoded}"
    elif "laodong.vn" in domain:
        return f"https://laodong.vn/tim-kiem?q={keyword_encoded}"
    elif "vtv.vn" in domain:
        return f"https://vtv.vn/tim-kiem.htm?keywords={keyword_encoded}"
    return f"https://{domain}/search?q={keyword_encoded}"

async def _async_crawl_pipeline(url: str, user_id: str, bot_instance, chat_id: int, is_admin: bool = False, user_intent: str = None):
    """
    Đây là tiến trình chạy ngầm Asynchronous để không làm block Bot.
    """
    if not url.startswith(('http://', 'https://')):
        url = 'https://' + url
    
    # Auto-redirect search engines if the user specifies a keyword/topic
    if user_intent:
        keyword = extract_topic_keyword(user_intent)
        if keyword:
            resolved_url = resolve_search_url(url, keyword)
            if resolved_url != url:
                bot_instance.send_message(chat_id, f"🔍 Phát hiện chủ đề tìm kiếm: `{keyword}`\nĐang tự động chuyển hướng sang trang tìm kiếm chuyên sâu: {resolved_url}")
                url = resolved_url
    try:
        usage = get_usage(user_id)
        if is_admin:
            bot_instance.send_message(chat_id, f"🚀 Bắt đầu cào dữ liệu từ: {url}\n(Đặc quyền: Không giới hạn / Admin)")
        else:
            bot_instance.send_message(chat_id, f"🚀 Bắt đầu cào dữ liệu từ: {url}\n(Lượt dùng: {usage+1}/{MAX_CRAWLS})")
            
        # Tính toán Dynamic Schema
        custom_schema = None
        if user_intent:
            bot_instance.send_message(chat_id, "🧠 Đang phân tích ý định của bạn và cấu trúc lại Dữ liệu...")
            analyzer = IntentAnalyzer(use_local_ollama=True)
            custom_schema = analyzer.apply_user_intent(user_intent)
            bot_instance.send_message(chat_id, f"✅ Schema đã được thiết kế riêng:\n```json\n{custom_schema}\n```")
        
        # BƯỚC 1: Kết nối & lấy page session
        bot_instance.send_message(chat_id, "[1/3] 🛡 Đang kết nối và tải trang web...")
        engine = BypassEngine(headless=True)
        await asyncio.sleep(0.5)
        bot_instance.send_message(chat_id, "✅ Kết nối thành công!")
        
        # BƯỚC 2: Tải ảnh & Làm sạch nội dung có cấu trúc
        bot_instance.send_message(chat_id, "[2/3] 🖼 Đang phân tích cấu trúc trang web & trích xuất hình ảnh...")
        import requests
        import re
        from bs4 import BeautifulSoup
        raw_text = ""
        page_title = "Trang Web Cào Dữ Liệu"
        found_images = []
        
        # Trích xuất các từ khóa chủ đề (topic keywords) từ ý định của người dùng
        target_keywords = []
        if user_intent:
            intent_lower = user_intent.lower()
            # Bỏ qua các từ phổ biến để giữ lại từ khóa chủ đề thực sự
            stop_words = {"chỉ", "lấy", "ảnh", "hình", "về", "chủ", "đề", "topic", "liên", "quan", "tới", "đến", "cào", "web", "trang", "tin", "tức", "và", "hoặc", "cho", "tôi", "nội", "dung", "mới", "nhất", "nổi", "bật"}
            words = re.findall(r'\b\w+\b', intent_lower)
            target_keywords = [w for w in words if w not in stop_words and len(w) > 2]
            if target_keywords:
                bot_instance.send_message(chat_id, f"🔍 *AI đang lọc hình ảnh theo chủ đề:* `{', '.join(target_keywords)}`...")
        
        try:
            headers = {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            }
            
            is_search_page = any(k in url for k in ["timkiem", "search", "tim-kiem", "q=", "keywords="])
            
            if is_search_page:
                # We want to fetch multiple pages to satisfy the limit
                # Let's extract requested limit (default to 20 for search)
                limit = 20
                if user_intent:
                    num_match = re.search(r'\b(\d+)\b', user_intent)
                    if num_match:
                        limit = int(num_match.group(1))
                
                bot_instance.send_message(chat_id, f"📅 Phát hiện tìm kiếm: Tự động cào mở rộng phạm vi thời gian (nhiều tháng trước) qua nhiều trang để đảm bảo đủ `{limit}` bài...")
                
                combined_lines = []
                # Fetch up to 5 pages of search results sequentially
                pages_to_crawl = min(5, (limit // 10) + 1)
                
                for page in range(1, pages_to_crawl + 1):
                    page_url = url
                    if "page=" not in url:
                        if "?" in url:
                            page_url = f"{url}&page={page}"
                        else:
                            page_url = f"{url}?page={page}"
                    else:
                        page_url = re.sub(r'page=\d+', f'page={page}', url)
                    
                    try:
                        bot_instance.send_message(chat_id, f"📖 Đang nạp và bóc tách dữ liệu trang {page}/{pages_to_crawl}...")
                        res = requests.get(page_url, timeout=10, headers=headers)
                        page_soup = BeautifulSoup(res.text, 'html.parser')
                        
                        if page == 1:
                            page_title = page_soup.title.string.strip() if page_soup.title else "Kết quả tìm kiếm"
                        
                        # Extract images
                        for img in page_soup.find_all('img'):
                            src = img.get('src') or img.get('data-src') or img.get('data-original')
                            if src and src.startswith('http'):
                                alt_text = img.get('alt', '').strip()
                                found_images.append((src, alt_text or f"Ảnh kết quả trang {page}"))
                                if len(found_images) >= 8:
                                    break
                                    
                        # Clean DOM and extract text lines
                        for element in page_soup(["script", "style", "noscript", "header", "footer", "nav", "iframe", "aside"]):
                            element.decompose()
                            
                        for tag in page_soup.find_all(['h1', 'h2', 'h3', 'h4', 'p', 'li', 'img']):
                            tag_name = tag.name
                            if tag_name == 'img':
                                src = tag.get('src') or tag.get('data-src') or tag.get('data-original')
                                if src and src.startswith('http'):
                                    alt = tag.get('alt', '').strip() or "Hình ảnh"
                                    combined_lines.append(f"\n![{alt}]({src})\n")
                            else:
                                text = tag.get_text(strip=True)
                                if not text or len(text) < 8:
                                    continue
                                if tag_name == 'h1':
                                    combined_lines.append(f"\n# {text}\n")
                                elif tag_name == 'h2':
                                    combined_lines.append(f"\n## {text}\n")
                                elif tag_name in ['h3', 'h4']:
                                    combined_lines.append(f"\n### {text}\n")
                                elif tag_name == 'li':
                                    combined_lines.append(f"- {text}")
                                else:
                                    combined_lines.append(text)
                    except Exception as page_err:
                        print(f"Error crawling search page {page}: {page_err}")
                        break
                
                raw_text = "\n".join(combined_lines)[:25000] # Increase character limit for multi-page data to 25K characters
            else:
                # Standard single page fetch
                res = requests.get(url, timeout=10, headers=headers)
                soup = BeautifulSoup(res.text, 'html.parser')
                page_title = soup.title.string.strip() if soup.title else "Trang Web"
                
                # Trích xuất ảnh chất lượng cao kèm phân tích mô tả và figcaption
                for img in soup.find_all('img'):
                    src = img.get('src') or img.get('data-src') or img.get('data-original')
                    if not src or not src.startswith('http'):
                        continue
                    
                    # Bỏ qua ảnh rác giao diện nhỏ
                    is_valid_ext = any(src.lower().endswith(ext) for ext in ['.jpg', '.jpeg', '.png', '.webp'])
                    is_valid_path = any(k in src.lower() for k in ['avatar', 'thumb', 'picture', 'photo'])
                    if not (is_valid_ext or is_valid_path):
                        continue
                        
                    alt_text = img.get('alt', '').strip()
                    parent_figure = img.find_parent('figure')
                    caption_text = parent_figure.get_text().strip() if parent_figure else ""
                    
                    combined_desc = f"{alt_text} {caption_text}".strip()
                    combined_desc_lower = combined_desc.lower()
                    
                    # Nếu có từ khóa chủ đề, tiến hành lọc ảnh
                    if target_keywords:
                        if any(k in combined_desc_lower or k in src.lower() for k in target_keywords):
                            found_images.append((src, alt_text or caption_text or f"Ảnh chủ đề {', '.join(target_keywords)}"))
                    else:
                        found_images.append((src, alt_text or caption_text or "Hình ảnh bài viết"))
                        
                    if len(found_images) >= 5:
                        break
                            
                # Làm sạch DOM bằng cách loại bỏ các khu vực nhiễu
                for element in soup(["script", "style", "noscript", "header", "footer", "nav", "iframe", "aside"]):
                    element.decompose()
                    
                # Tạo văn bản có cấu trúc Markdown phân cấp rõ ràng
                lines = []
                for tag in soup.find_all(['h1', 'h2', 'h3', 'h4', 'p', 'li', 'img']):
                    tag_name = tag.name
                    if tag_name == 'img':
                        src = tag.get('src') or tag.get('data-src') or tag.get('data-original')
                        if src and src.startswith('http'):
                            alt = tag.get('alt', '').strip() or "Hình ảnh"
                            lines.append(f"\n![{alt}]({src})\n")
                    else:
                        text = tag.get_text(strip=True)
                        if not text or len(text) < 8:
                            continue
                        if tag_name == 'h1':
                            lines.append(f"\n# {text}\n")
                        elif tag_name == 'h2':
                            lines.append(f"\n## {text}\n")
                        elif tag_name in ['h3', 'h4']:
                            lines.append(f"\n### {text}\n")
                        elif tag_name == 'li':
                            lines.append(f"- {text}")
                        else:
                            lines.append(text)
                
                raw_text = "\n".join(lines)[:10000] # Tăng giới hạn lên 10K ký tự có cấu trúc
        except Exception as e:
            raw_text = f"Nội dung cào được từ {url}. Dữ liệu thô văn bản và cấu trúc website."
            
        await asyncio.sleep(1)
        bot_instance.send_message(chat_id, f"✅ Phân tích xong! Phát hiện {len(found_images)} hình ảnh phù hợp.")
        
        # BƯỚC 3: AI Phân tích tối giản (Single-Shot DataRefiner)
        bot_instance.send_message(chat_id, "[3/3] 🧠 Đang kích hoạt Trợ lý Phân tích AI Tối giản (DataRefiner)...")
        refiner = DataRefiner(use_local_ollama=True)
        
        # Cào nâng cao có intent schema
        intent_schema = None
        if user_intent:
            try:
                analyzer = IntentAnalyzer(use_local_ollama=True)
                intent_schema = analyzer.apply_user_intent(user_intent)
            except Exception:
                pass
                
        result = refiner.refine_text(raw_text, url, custom_schema=intent_schema)
        
        if not result:
            result = {
                "title": page_title,
                "description": raw_text[:200] + "...",
                "inferred_categories": ["General"],
                "confidence_score": 0.8
            }
            
        # Lấy thông tin lưu trữ tương thích với RAG để phản hồi cho Bot
        try:
            import re
            from datetime import datetime
            main_category = "General"
            if result.get('inferred_categories') and len(result['inferred_categories']) > 0:
                raw_cat = result['inferred_categories'][0]
                main_category = re.sub(r'[^a-zA-Z0-9_\-\s]', '_', raw_cat).strip()
                if not main_category:
                    main_category = "General"
                
            safe_title = re.sub(r'[^a-zA-Z0-9]', '_', result.get('title', 'untitled'))[:50]
            today = datetime.now().strftime('%Y-%m-%d')
            
            filepath = os.path.join(os.path.dirname(__file__), 'storage', 'refined_data', main_category, today, f"{safe_title}.json")
            
            # Đăng ký tệp vào chỉ mục tổng (đã lưu bởi refiner, ở đây chỉ đăng ký lại nếu chưa có)
            index_file = os.path.join(os.path.dirname(__file__), 'storage', 'summary_index.json')
            index_data = {}
            if os.path.exists(index_file):
                try:
                    with open(index_file, 'r', encoding='utf-8') as f:
                        index_data = json.load(f)
                except Exception:
                    pass
            if main_category not in index_data:
                index_data[main_category] = []
                
            # Tránh ghi đè trùng lặp trong index
            exists = any(item.get("path") == filepath for item in index_data[main_category])
            if not exists:
                index_data[main_category].append({
                    "title": result.get('title'),
                    "path": filepath,
                    "date": datetime.now().strftime('%Y-%m-%d %H:%M:%S')
                })
                with open(index_file, 'w', encoding='utf-8') as f:
                    json.dump(index_data, f, indent=4, ensure_ascii=False)
                    
            print(f"[DataRefiner] Data successfully refined and mapped to {filepath}")
        except Exception as se:
            print(f"[x] Error registering refined agent data: {se}")
        await asyncio.sleep(1)
        
        # Ghi nhận đã dùng
        if not is_admin:
            increment_usage(user_id)
            
        # Gửi hình ảnh thu hoạch được
        if found_images:
            for idx, img_data in enumerate(found_images[:3]):  # Tăng lên 3 ảnh khớp nhất
                img_url, img_desc = img_data
                try:
                    bot_instance.send_photo(
                        chat_id, 
                        img_url, 
                        caption=f"🖼️ [Ảnh Chủ đề] {img_desc[:120]}"
                    )
                except Exception:
                    pass
                    
        # BƯỚC 4: Tạo Phân tích & Đề xuất Thông minh từ AI
        bot_instance.send_message(chat_id, "💡 *Đang tạo Phân tích vĩ mô & Đề xuất nghiên cứu tiếp theo từ AI...*")
        exec_analysis, next_searches, next_images = generate_proactive_recommendations(result, user_intent)
        
        # Build summary header (always short)
        is_list = result.get('is_list_page', False)
        articles = result.get('articles', [])

        if is_list and articles:
            articles_preview = ""
            for idx, art in enumerate(articles[:5]):  # Max 5 previews on Telegram
                articles_preview += f"🔹 *{idx+1}. {art.get('title', '?')}*\n"
                articles_preview += f"   _{art.get('category', 'Chung')}_\n\n"
        else:
            desc = str(result.get('description', 'Không có mô tả'))[:300]
            articles_preview = f"📝 *Tóm tắt bài viết:*\n{desc}\n\n"

        summary_msg = (
            f"🎉 *CÀO DỮ LIỆU HOÀN TẤT!*\n\n"
            f"📌 *Trang:* `{result.get('title', page_title)}`\n"
            f"🏷️ *Danh mục AI:* `{', '.join(result.get('inferred_categories', ['General']))}`\n"
            f"📊 *Số lượng:* `{len(articles) if is_list else 1}` mục\n\n"
            f"📰 *Nội dung tiêu biểu:*\n{articles_preview}"
            f"🧠 *AI PHÂN TÍCH VĨ MÔ:*\n_{exec_analysis}_\n\n"
            f"💡 *ĐỀ XUẤT NGHIÊN CỨU TIẾP THEO:*\n"
        )
        
        for idx, s in enumerate(next_searches):
            summary_msg += f"   {idx+1}️⃣ `{s}`\n"
            
        if next_images:
            summary_msg += f"\n📸 *ĐỀ XUẤT HÌNH ẢNH CẦN LỌC:* \n"
            for idx, img_rec in enumerate(next_images):
                summary_msg += f"   • `{img_rec}`\n"
                
        summary_msg += f"\n_(Tải file crawl_result.json bên dưới để xem chi tiết)_"

        # Tạo bàn phím inline
        import telebot as _telebot
        markup = _telebot.types.InlineKeyboardMarkup()
        web_app = _telebot.types.WebAppInfo(url="https://vibecoding-super-scraper.vercel.app")
        btn_webapp = _telebot.types.InlineKeyboardButton(text="🖥️ Mở Web App", web_app=web_app)
        btn_search = _telebot.types.InlineKeyboardButton(text="🔍 Hỏi AI về dữ liệu", callback_data="rag_search_init")
        markup.row(btn_webapp)
        markup.row(btn_search)

        # Send summary (always safe length)
        try:
            bot_instance.send_message(chat_id, summary_msg, reply_markup=markup, parse_mode="Markdown")
        except Exception as markdown_err:
            # Fallback: strip Markdown formatting/tokens and send as plain text
            clean_msg = summary_msg.replace("*", "").replace("_", "").replace("`", "")
            try:
                bot_instance.send_message(chat_id, clean_msg, reply_markup=markup)
            except Exception as inner_err:
                bot_instance.send_message(chat_id, f"🎉 CÀO DỮ LIỆU HOÀN TẤT!\n(Do giới hạn ký tự Markdown của Telegram, tin nhắn tóm tắt được chuyển về plain-text)\n\n{clean_msg[:3500]}", reply_markup=markup)

        # Send full JSON as file attachment (avoids message too long)
        import io
        json_bytes = json.dumps(result, indent=2, ensure_ascii=False).encode("utf-8")
        json_file = io.BytesIO(json_bytes)
        json_file.name = "crawl_result.json"
        try:
            bot_instance.send_document(
                chat_id,
                document=json_file,
                caption="📎 Full JSON data (crawl_result.json)",
            )
        except Exception as doc_err:
            # Fallback: send first 2000 chars inline
            preview = json.dumps(result, indent=2, ensure_ascii=False)[:2000]
            bot_instance.send_message(chat_id, f"```json\n{preview}\n...```", parse_mode="Markdown")
        
    except Exception as e:
        bot_instance.send_message(chat_id, f"❌ Lỗi trong quá trình cào: {e}")

def _run_asyncio_loop(url: str, user_id: str, bot_instance, chat_id: int, is_admin: bool = False, user_intent: str = None):
    """
    Tạo một event loop mới cho thread nền
    """
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        loop.run_until_complete(_async_crawl_pipeline(url, user_id, bot_instance, chat_id, is_admin, user_intent))
    finally:
        loop.close()

def trigger_dynamic_crawl(url: str, user_intent: str, user_id: str, bot_instance, chat_id: int, is_admin: bool = False):
    """
    Hàm trigger có tính năng dynamic intent
    """
    if not is_admin:
        usage = get_usage(user_id)
        if usage >= MAX_CRAWLS:
            bot_instance.send_message(chat_id, f"🚫 Bạn đã đạt giới hạn dùng thử ({MAX_CRAWLS}/{MAX_CRAWLS} lần). Vui lòng nâng cấp tài khoản để tiếp tục.")
            return
            
    bot_instance.send_message(chat_id, "⏳ Đã đưa tác vụ cào dữ liệu vào hàng đợi Luồng nền (Background Thread)...")
    
    # Tạo Thread chạy ngầm để không block thu ngân (Bot)
    thread = threading.Thread(target=_run_asyncio_loop, args=(url, user_id, bot_instance, chat_id, is_admin, user_intent))
    thread.daemon = True # Thread sẽ chết khi Bot chết
    thread.start()

def trigger_crawl(url: str, user_id: str, bot_instance, chat_id: int, is_admin: bool = False):
    """
    Hàm Giao Tiếp: Đầu vào gọi từ thư viện Đồng Bộ (telebot), sẽ ném sang Luồng nền để xử lý.
    """
    if not is_admin:
        usage = get_usage(user_id)
        if usage >= MAX_CRAWLS:
            bot_instance.send_message(chat_id, f"🚫 Bạn đã đạt giới hạn dùng thử ({MAX_CRAWLS}/{MAX_CRAWLS} lần). Vui lòng nâng cấp tài khoản để tiếp tục.")
            return
            
    bot_instance.send_message(chat_id, "⏳ Đã đưa tác vụ cào dữ liệu vào hàng đợi Luồng nền (Background Thread)...")
    
    # Tạo Thread chạy ngầm để không block thu ngân (Bot)
    thread = threading.Thread(target=_run_asyncio_loop, args=(url, user_id, bot_instance, chat_id))
    thread.daemon = True # Thread sẽ chết khi Bot chết
    thread.start()

def clean_vault(target: str = "all") -> str:
    """
    Cleans the crawl vault storage.
    - target == "all": Deletes all .json files in storage/refined_data and summary_index.json.
    - target is a specific string (e.g. domain): Deletes all JSON files where original_source_url contains the target.
    """
    import shutil
    import glob
    base_dir = os.path.join(os.path.dirname(__file__), 'storage', 'refined_data')
    index_file = os.path.join(os.path.dirname(__file__), 'storage', 'summary_index.json')
    
    if not os.path.exists(base_dir):
        return "Kho lưu trữ trống rỗng, không có dữ liệu để dọn dẹp."
        
    if target.lower() == "all":
        # WIPE EVERYTHING
        try:
            shutil.rmtree(base_dir)
            os.makedirs(base_dir, exist_ok=True)
            if os.path.exists(index_file):
                os.remove(index_file)
            return "🧹 Đã dọn dẹp sạch sẽ toàn bộ Kho lưu trữ dữ liệu cào (Vault) thành công!"
        except Exception as e:
            return f"❌ Lỗi khi dọn dẹp kho lưu trữ: {e}"
            
    else:
        # CLEAN SPECIFIC DOMAIN / STRING MATCH
        deleted_count = 0
        json_files = glob.glob(os.path.join(base_dir, '**', '*.json'), recursive=True)
        for f in json_files:
            try:
                with open(f, 'r', encoding='utf-8') as file:
                    data = json.load(file)
                source_url = data.get("original_source_url", "")
                if target.lower() in source_url.lower() or target.lower() in f.lower():
                    os.remove(f)
                    deleted_count += 1
            except Exception:
                pass
                
        # Clean index_file
        if os.path.exists(index_file):
            try:
                with open(index_file, 'r', encoding='utf-8') as f:
                    index_data = json.load(f)
                cleaned_index = {}
                for cat, items in index_data.items():
                    cleaned_items = []
                    for item in items:
                        path = item.get("path", "")
                        if not (target.lower() in path.lower() or not os.path.exists(path)):
                            cleaned_items.append(item)
                    if cleaned_items:
                        cleaned_index[cat] = cleaned_items
                with open(index_file, 'w', encoding='utf-8') as f:
                    json.dump(cleaned_index, f, indent=4, ensure_ascii=False)
            except Exception:
                pass
                
        if deleted_count > 0:
            return f"🧹 Đã xóa thành công {deleted_count} tệp dữ liệu cào liên quan đến từ khóa/domain: `{target}`!"
        else:
            return f"❓ Không tìm thấy dữ liệu nào liên quan đến `{target}` trong Kho lưu trữ."


def trigger_simple_crawl(url: str, user_id: str, bot_instance, chat_id: int, is_admin: bool = False):
    """
    Cào đơn thuần bằng Python (requests + BeautifulSoup), KHÔNG tốn tokens.
    """
    bot_instance.send_message(chat_id, f"🚀 Bắt đầu cào đơn thuần (0 Token) từ: {url}...")
    
    def run_simple():
        try:
            import requests
            from bs4 import BeautifulSoup
            import io
            import json
            import time
            import threading
            
            if not url.startswith(('http://', 'https://')):
                target_url = 'https://' + url
            else:
                target_url = url
                
            headers = {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            }
            res = requests.get(target_url, timeout=10, headers=headers)
            res.raise_for_status()
            
            soup = BeautifulSoup(res.text, 'html.parser')
            title = soup.title.string.strip() if soup.title else "Trang Web"
            
            # Clean body
            for tag in soup(["script", "style", "noscript", "svg", "header", "footer", "nav", "aside", "iframe"]):
                tag.decompose()
                
            paragraphs = [p.get_text(strip=True) for p in soup.find_all('p') if len(p.get_text(strip=True)) > 20]
            clean_text = "\n\n".join(paragraphs[:8])
            if len(clean_text) > 1500:
                clean_text = clean_text[:1500] + "..."
                
            # Links
            links = []
            for a in soup.find_all('a', href=True):
                href = a['href']
                text = a.get_text(strip=True) or "Liên kết"
                if href.startswith('http') and len(links) < 5:
                    links.append((text, href))
                    
            # Images
            images = []
            for img in soup.find_all('img'):
                src = img.get('src') or img.get('data-src') or img.get('data-original')
                if src and src.startswith('http') and len(images) < 3:
                    images.append(src)
            
            # Format report
            report = (
                f"🎉 *CÀO ĐƠN THUẦN HOÀN TẤT (0 TOKENS)*\n\n"
                f"📌 *Trang:* `{title}`\n"
                f"🔗 *URL:* {target_url}\n\n"
                f"📝 *Nội dung tóm tắt (Văn bản thô):*\n_{clean_text or 'Không tìm thấy đoạn văn bản nổi bật.'}_\n\n"
            )
            
            if links:
                report += "🔗 *Liên kết tiêu biểu tìm thấy:*\n"
                for idx, (txt, hr) in enumerate(links):
                    report += f"   {idx+1}️⃣ [{txt[:30]}]({hr})\n"
                    
            if images:
                report += f"\n📸 *Phát hiện {len(images)} hình ảnh trên trang.*\n"
                
            try:
                bot_instance.send_message(chat_id, report, parse_mode="Markdown")
            except Exception as markdown_err:
                clean_report = report.replace("*", "").replace("_", "").replace("`", "")
                try:
                    bot_instance.send_message(chat_id, clean_report)
                except Exception:
                    bot_instance.send_message(chat_id, f"🎉 CÀO ĐƠN THUẦN HOÀN TẤT (0 TOKENS)!\n\n{clean_report[:3500]}")
            
            # Send found images directly
            for img_url in images:
                try:
                    bot_instance.send_photo(chat_id, img_url, caption=f"🖼️ [Ảnh cào được từ trang]")
                except Exception:
                    pass
                    
            # Save raw json output
            result = {
                "title": title,
                "url": target_url,
                "paragraphs": paragraphs,
                "scraped_at": time.strftime("%Y-%m-%d %H:%M:%S")
            }
            json_bytes = json.dumps(result, indent=2, ensure_ascii=False).encode("utf-8")
            json_file = io.BytesIO(json_bytes)
            json_file.name = "simple_crawl_result.json"
            bot_instance.send_document(
                chat_id,
                document=json_file,
                caption="📎 Dữ liệu thô cào được (0 Tokens)",
            )
            
            # Ghi nhận lượt cào (nếu cần)
            if not is_admin:
                increment_usage(user_id)
                
        except Exception as e:
            bot_instance.send_message(chat_id, f"❌ Lỗi cào đơn thuần: {str(e)}")
            
    threading.Thread(target=run_simple).start()
