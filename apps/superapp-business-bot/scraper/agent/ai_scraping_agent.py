import os
import re
import sqlite3
import json
from datetime import datetime
from bs4 import BeautifulSoup
from openai import OpenAI
import requests
from dotenv import load_dotenv

def load_unified_env():
    load_dotenv()
    possible_paths = [
        os.path.join(os.path.dirname(__file__), "..", "..", "apps", "antigravity-telegram-agent", ".env"),
        os.path.join(os.path.dirname(__file__), "..", "..", "apps", "superapp-business-bot", ".env"),
        os.path.join(os.path.dirname(__file__), "..", ".env"),
    ]
    for path in possible_paths:
        if os.path.exists(path):
            load_dotenv(dotenv_path=path)

class InputEngineer:
    def __init__(self):
        self.url_to_token = {}
        self.token_to_url = {}
        self.token_counter = 0

    def clean_dom(self, html_content: str) -> str:
        """Strip non-display or boilerplate tags from DOM."""
        soup = BeautifulSoup(html_content, 'html.parser')
        for element in soup(["script", "style", "noscript", "svg", "head", "iframe", "footer", "nav", "aside"]):
            element.decompose()
        return str(soup)

    def mask_urls(self, html_content: str) -> str:
        """Replace long URLs with unique tokens [LINK_XX] and cache the map."""
        self.url_to_token.clear()
        self.token_to_url.clear()
        self.token_counter = 0

        # Pattern to match absolute and relative URLs
        url_pattern = re.compile(r'href=["\'](https?://[^"\']+|/[^"\']+)["\']')

        def replace_match(match):
            url = match.group(1)
            if url not in self.url_to_token:
                self.token_counter += 1
                token = f"[LINK_{self.token_counter:02d}]"
                self.url_to_token[url] = token
                self.token_to_url[token] = url
            else:
                token = self.url_to_token[url]
            return f'href="{token}"'

        masked_html = url_pattern.sub(replace_match, html_content)
        return masked_html

    def unmask_text(self, text: str) -> str:
        """Convert [LINK_XX] tokens back to original URLs."""
        if not text:
            return text
        for token, url in self.token_to_url.items():
            text = text.replace(token, url)
        return text

    def to_structured_markdown(self, html_content: str) -> str:
        """Convert a cleaned HTML DOM to compact structured Markdown."""
        soup = BeautifulSoup(html_content, 'html.parser')
        lines = []
        for tag in soup.find_all(['h1', 'h2', 'h3', 'h4', 'p', 'li', 'a']):
            tag_name = tag.name
            text = tag.get_text(strip=True)
            if not text or len(text) < 4:
                continue

            if tag_name == 'h1':
                lines.append(f"\n# {text}\n")
            elif tag_name == 'h2':
                lines.append(f"\n## {text}\n")
            elif tag_name in ['h3', 'h4']:
                lines.append(f"\n### {text}\n")
            elif tag_name == 'li':
                lines.append(f"- {text}")
            elif tag_name == 'a':
                href = tag.get('href', '')
                lines.append(f"[{text}]({href})")
            else:
                lines.append(text)
        return "\n".join(lines)

class JSONRepair:
    @staticmethod
    def clean_markdown_fences(json_str: str) -> str:
        """Remove markdown code blocks if the LLM wrapped the JSON."""
        json_str = json_str.strip()
        json_str = re.sub(r'^```json\s*', '', json_str)
        json_str = re.sub(r'^```\s*', '', json_str)
        json_str = re.sub(r'\s*```$', '', json_str)
        return json_str.strip()

    @classmethod
    def repair(cls, broken_json_str: str, client: OpenAI = None, model: str = "gemini-2.5-flash") -> dict:
        """Tries standard repairs, otherwise calls lightweight LLM to repair broken JSON."""
        cleaned = cls.clean_markdown_fences(broken_json_str)
        try:
            return json.loads(cleaned)
        except Exception:
            pass

        # Try regex balancing for missing brackets
        try:
            open_braces = cleaned.count('{')
            close_braces = cleaned.count('}')
            if open_braces > close_braces:
                cleaned += '}' * (open_braces - close_braces)
            elif close_braces > open_braces:
                cleaned = '{' * (close_braces - open_braces) + cleaned
            return json.loads(cleaned)
        except Exception:
            pass

        # Call AI Repair fallback if client is available
        if client:
            try:
                system_prompt = "You are a robust JSON recovery agent. Repair the broken JSON string below into a valid, parsing JSON object. Do not change any keys, values, or structure. Output ONLY the raw JSON string. No explanations, no markdown fences."
                response = client.chat.completions.create(
                    model=model,
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": f"Broken JSON:\n{broken_json_str}"}
                    ],
                    temperature=0.1
                )
                repaired_str = cls.clean_markdown_fences(response.choices[0].message.content.strip())
                return json.loads(repaired_str)
            except Exception as e:
                print(f"[x] JSON Repair AI pipeline failed: {e}")
        
        return None

class LayoutCacheManager:
    def __init__(self):
        self.db_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'storage', 'hashes.db')
        os.makedirs(os.path.dirname(self.db_path), exist_ok=True)
        self._init_db()

    def _init_db(self):
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS layout_cache (
                domain TEXT PRIMARY KEY,
                selectors TEXT,
                updated_at TEXT
            )
        """)
        conn.commit()
        conn.close()

    def get_layout(self, domain: str) -> dict:
        """Retrieve cached layout selectors for a domain."""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            cursor.execute("SELECT selectors FROM layout_cache WHERE domain = ?", (domain,))
            row = cursor.fetchone()
            conn.close()
            if row:
                return json.loads(row[0])
        except Exception as e:
            print(f"[x] Layout Cache read error: {e}")
        return None

    def save_layout(self, domain: str, selectors: dict):
        """Save discovered layout selectors to cache."""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            cursor.execute(
                "INSERT OR REPLACE INTO layout_cache (domain, selectors, updated_at) VALUES (?, ?, ?)",
                (domain, json.dumps(selectors), datetime.now().isoformat())
            )
            conn.commit()
            conn.close()
            print(f"[+] Discovered layout cached for domain: {domain}")
        except Exception as e:
            print(f"[x] Layout Cache save error: {e}")

class BasePromptLayer:
    def __init__(self, client: OpenAI = None, model: str = "gemini-2.5-flash"):
        self.client = client
        self.model = model

    def _call_llm(self, system_prompt: str, user_prompt: str, temperature: float = 0.1) -> str:
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=temperature
            )
            return response.choices[0].message.content.strip()
        except Exception as outer_e:
            gemini_key = os.environ.get("GEMINI_API_KEY")
            deepseek_key = os.environ.get("DEEPSEEK_API_KEY")
            deepseek_base = os.environ.get("DEEPSEEK_BASE_URL", "https://api.deepseek.com")
            deepseek_model = os.environ.get("DEEPSEEK_MODEL", "deepseek-chat")
            
            if self.model == "qwen2.5-coder" and (deepseek_key or gemini_key):
                if deepseek_key:
                    print(f"[!] Local Ollama model {self.model} failed ({outer_e}). Falling back to DeepSeek Cloud API...")
                    try:
                        fallback_client = OpenAI(
                            base_url=deepseek_base,
                            api_key=deepseek_key
                        )
                        response = fallback_client.chat.completions.create(
                            model=deepseek_model,
                            messages=[
                                {"role": "system", "content": system_prompt},
                                {"role": "user", "content": user_prompt}
                            ],
                            temperature=temperature
                        )
                        return response.choices[0].message.content.strip()
                    except Exception as ds_e:
                        print(f"[!] DeepSeek fallback also failed ({ds_e}). Trying Gemini...")
                
                if gemini_key:
                    print(f"[!] Falling back to Gemini Cloud API...")
                    fallback_client = OpenAI(
                        base_url="https://generativelanguage.googleapis.com/v1beta/openai/",
                        api_key=gemini_key
                    )
                    response = fallback_client.chat.completions.create(
                        model="gemini-2.5-flash",
                        messages=[
                            {"role": "system", "content": system_prompt},
                            {"role": "user", "content": user_prompt}
                        ],
                        temperature=temperature
                    )
                    return response.choices[0].message.content.strip()
            else:
                raise outer_e

class PageRouter(BasePromptLayer):
    """TẦNG 1: THE ROUTER - Phân loại trang web"""
    def route(self, url: str, structured_md: str) -> dict:
        system_prompt = """
        ROLE: Professional Web Directory Architect.
        CONTEXT: You are looking at a structured Markdown extract of a webpage.
        TASK: Determine the exact page type to activate the correct scraping pipeline.
        CONSTRAINTS: 
          - Output ONLY a valid JSON object. No conversational text. No markdown fences.
          - Choose page_type strictly from: "Homepage", "Category Hub", "Article Detail", "Product page", "Unknown".
        OUTPUT SCHEMA:
        {
          "page_type": "Homepage / Category Hub / Article Detail / Product page / Unknown",
          "rationale": "Brief reasoning explaining the choice."
        }
        """
        user_prompt = f"URL: {url}\n\nWebpage Extract (first 150 lines):\n" + "\n".join(structured_md.split("\n")[:150])
        raw_res = self._call_llm(system_prompt, user_prompt, temperature=0.1)
        return JSONRepair.repair(raw_res, self.client, self.model)

class StructuralArchitect(BasePromptLayer):
    """TẦNG 2: THE STRUCTURAL ARCHITECT - Giải mã cấu trúc Hub"""
    def analyze_layout(self, domain: str, structured_md: str) -> dict:
        system_prompt = """
        ROLE: Expert CSS Structural Architect and Scraper Design Pattern Specialist.
        CONTEXT: You are analyzing a structured Markdown layout of a portal/hub page (like a homepage or catalog) with URL tokens [LINK_XX].
        TASK: Identify CSS/Markdown wrappers and selectors where repetitive article blocks/items reside.
        CONSTRAINTS:
          - No explanation, output strictly a JSON object.
          - Incorporate grounding: Selectors must capture valid recurring [LINK_XX] targets.
        OUTPUT SCHEMA:
        {
          "wrapper_selector": "CSS class or structure hosting the primary list.",
          "article_block": "Selector template representing an individual card/item.",
          "title_selector": "Selector for the article title.",
          "link_token_pattern": "Regex or pattern matching the cached URL tokens like [LINK_XX]."
        }
        """
        user_prompt = f"Domain: {domain}\n\nStructured Layout:\n{structured_md[:8000]}"
        raw_res = self._call_llm(system_prompt, user_prompt, temperature=0.1)
        return JSONRepair.repair(raw_res, self.client, self.model)

class MacroSynthesizer(BasePromptLayer):
    """TẦNG 3: THE MACRO SYNTHESIZER - Phân tích vĩ mô danh sách"""
    def synthesize(self, article_items: list) -> dict:
        system_prompt = """
        ROLE: Senior Global News Intelligence Analyst.
        CONTEXT: You are given a list of extracted raw items/articles representing a homepage or portal catalog.
        TASK: Synthesize the global landscape, filter out noise, map trends, and identify deep dive targets.
        CONSTRAINTS:
          - Avoid hallucinations. All entities and links must come strictly from the input JSON.
          - Output strictly valid JSON.
        OUTPUT SCHEMA:
        {
          "global_trends": ["Major trend 1", "Major trend 2"],
          "hot_entities": ["Topic/Entity 1", "Topic/Entity 2"],
          "ignored_clusters": ["Details of ignored elements like ads or footer links"],
          "deep_dive_targets": [
             {
               "title": "Article title to research further",
               "token": "Matching [LINK_XX] token",
               "category": "Domain of interest (e.g. Politics, Tech)"
             }
          ]
        }
        """
        user_prompt = f"Article Items:\n{json.dumps(article_items, ensure_ascii=False, indent=2)}"
        raw_res = self._call_llm(system_prompt, user_prompt, temperature=0.2)
        return JSONRepair.repair(raw_res, self.client, self.model)

class DeepHarvester(BasePromptLayer):
    """TẦNG 4: THE DEEP HARVESTER - Bóc tách bài viết sâu sắc"""
    def harvest(self, title: str, full_markdown: str) -> dict:
        system_prompt = """
        ROLE: High-Fidelity Knowledge Extraction Specialist.
        CONTEXT: You are reading the full markdown content of a high-priority article/product page.
        TASK: Extract high-value structures, core arguments, sentiments, and key entities.
        CONSTRAINTS:
          - Extract with absolute accuracy. No hallucinating facts or details.
          - Output strictly valid JSON.
        OUTPUT SCHEMA:
        {
          "title": "Clean parsed title",
          "main_content": "Deep structured summary of the core text.",
          "core_arguments": ["Core point/argument 1", "Core point/argument 2"],
          "sentiment": "Positive / Negative / Neutral",
          "fact_checked_entities": ["Verified key names, statistics, or organizations"]
        }
        """
        user_prompt = f"Target Title: {title}\n\nFull Markdown:\n{full_markdown[:12000]}"
        raw_res = self._call_llm(system_prompt, user_prompt, temperature=0.15)
        return JSONRepair.repair(raw_res, self.client, self.model)


class AdvancedScrapingAgent:
    def __init__(self, use_local_ollama: bool = True):
        load_unified_env()
        self.use_local_ollama = use_local_ollama
        self.input_engineer = InputEngineer()
        self.cache_manager = LayoutCacheManager()

        # Connect model endpoints robustly
        ollama_running = False
        if use_local_ollama:
            try:
                res = requests.get("http://localhost:11434/api/tags", timeout=1.5)
                if res.status_code == 200:
                    ollama_running = True
            except Exception:
                pass

        gemini_key = os.environ.get("GEMINI_API_KEY")
        deepseek_key = os.environ.get("DEEPSEEK_API_KEY")
        deepseek_base = os.environ.get("DEEPSEEK_BASE_URL", "https://api.deepseek.com")
        deepseek_model = os.environ.get("DEEPSEEK_MODEL", "deepseek-chat")
        
        # Router & Struct Layer (Light & fast models)
        if use_local_ollama and ollama_running:
            self.light_client = OpenAI(base_url="http://localhost:11434/v1", api_key="ollama")
            self.light_model = "qwen2.5-coder"
        elif deepseek_key:
            self.light_client = OpenAI(base_url=deepseek_base, api_key=deepseek_key)
            self.light_model = deepseek_model
        elif gemini_key:
            self.light_client = OpenAI(base_url="https://generativelanguage.googleapis.com/v1beta/openai/", api_key=gemini_key)
            self.light_model = "gemini-2.5-flash"
        else:
            self.light_client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY", "YOUR_API_KEY_HERE"))
            self.light_model = "gpt-3.5-turbo"

        # Synthesizer & Harvester Layer (Large models)
        if deepseek_key:
            self.heavy_client = OpenAI(base_url=deepseek_base, api_key=deepseek_key)
            self.heavy_model = deepseek_model
        elif gemini_key:
            self.heavy_client = OpenAI(base_url="https://generativelanguage.googleapis.com/v1beta/openai/", api_key=gemini_key)
            self.heavy_model = "gemini-2.5-flash" # Can use gemini-1.5-pro if available, fallback flash
        else:
            self.heavy_client = self.light_client
            self.heavy_model = self.light_model

        self.router = PageRouter(self.light_client, self.light_model)
        self.architect = StructuralArchitect(self.light_client, self.light_model)
        self.synthesizer = MacroSynthesizer(self.heavy_client, self.heavy_model)
        self.harvester = DeepHarvester(self.heavy_client, self.heavy_model)

    def process_scraping(self, html_content: str, url: str, user_intent: str = None) -> dict:
        """Executes the advanced 4-layer scraping matrix over the input HTML."""
        domain = re.sub(r'https?://(www\.)?', '', url).split('/')[0]

        # Trích xuất giới hạn số lượng bài viết cào từ ý định của người dùng (ví dụ: "Lấy 10 dòng", "cào 5 bài", "limit 15", v.v.)
        limit = None
        if user_intent:
            num_match = re.search(r'\b(\d+)\b', user_intent)
            if num_match:
                limit = int(num_match.group(1))
                print(f"[Advanced Agent] User requested a row limit of: {limit}")

        # STEP 1: Input Engineering
        cleaned_html = self.input_engineer.clean_dom(html_content)
        masked_html = self.input_engineer.mask_urls(cleaned_html)
        structured_md = self.input_engineer.to_structured_markdown(masked_html)

        # TẦNG 1: The Router
        print("[Advanced Agent] Running Page Classification (Tầng 1)...")
        route_info = self.router.route(url, structured_md)
        page_type = route_info.get("page_type", "Unknown") if route_info else "Unknown"
        print(f"[Advanced Agent] Page categorized as: {page_type}")

        # TẦNG 2: The Structural Architect (Layout Caching)
        selectors = self.cache_manager.get_layout(domain)
        if not selectors and page_type in ["Homepage", "Category Hub", "Unknown"]:
            print(f"[Advanced Agent] Cache miss for domain: {domain}. Analyzing layout with AI (Tầng 2)...")
            selectors = self.architect.analyze_layout(domain, structured_md)
            if selectors:
                self.cache_manager.save_layout(domain, selectors)
        elif selectors:
            print(f"[Advanced Agent] Layout selectors retrieved from Database Cache: {selectors}")

        # TẦNG 3: The Macro Synthesizer (Homepage / Portal Hub mapping)
        if page_type in ["Homepage", "Category Hub", "Unknown"]:
            print("[Advanced Agent] Extracting article metadata arrays comprehensively (Tầng 3)...")
            
            # 1. Trích xuất toàn bộ bài viết thực tế bằng Python Parser để tránh nghẽn LLM
            soup = BeautifulSoup(masked_html, 'html.parser')
            all_articles = []
            seen_titles = set()
            
            # Lọc và loại bỏ các thẻ menu điều hướng loãng
            for a in soup.find_all('a'):
                text = a.get_text(strip=True)
                href = a.get('href', '')
                if not text or len(text) < 15 or not href:
                    continue
                    
                # Chuẩn hóa khoảng trắng
                clean_title = re.sub(r'\s+', ' ', text).strip()
                
                # Bỏ qua các mục menu điều hướng hoặc nút bấm chung
                if clean_title.lower() in [
                    "video", "ảnh", "ý kiến", "góc nhìn", "tâm sự", "rao vặt", 
                    "đăng nhập", "mới nhất", "về đầu trang", "xem thêm", "phản hồi"
                ]:
                    continue
                    
                if clean_title in seen_titles:
                    continue
                    
                seen_titles.add(clean_title)
                
                # Khôi phục URL thật từ token mask
                real_url = self.input_engineer.unmask_text(href) if href.startswith('[LINK_') else href
                if not real_url.startswith('http'):
                    if real_url.startswith('/'):
                        real_url = f"https://{domain}{real_url}"
                    else:
                        real_url = f"https://{domain}/{real_url}"
                        
                # Chỉ lấy các liên kết bài viết thực sự (có đường dẫn dài, tránh anchor đơn giản)
                if len(real_url.replace(f"https://{domain}", "")) > 8:
                    all_articles.append({
                        "title": clean_title,
                        "url": real_url,
                        "category": "General News" # Mặc định phân loại sơ bộ
                    })

            # 2. Gọi AI Tầng 3 phân tích vĩ mô dựa trên danh sách 30 bài viết đầu tiên để hiểu bối cảnh
            items_for_ai = [{"title": art["title"], "token": art["url"]} for art in all_articles[:30]]
            macro_results = self.synthesizer.synthesize(items_for_ai)
            
            # Gán phân loại thông minh cho các bài viết dựa trên phân tích vĩ mô của AI
            hot_entities = macro_results.get("hot_entities", ["General"]) if macro_results else ["General"]
            global_trends = macro_results.get("global_trends", []) if macro_results else []
            
            # Duyệt qua toàn bộ danh sách để gán danh mục thông minh bằng từ khóa
            for art in all_articles:
                title_lower = art["title"].lower()
                assigned = False
                if macro_results and "deep_dive_targets" in macro_results:
                    for target in macro_results["deep_dive_targets"]:
                        if target.get("title", "").lower() in title_lower or title_lower in target.get("title", "").lower():
                            art["category"] = target.get("category", "General News")
                            assigned = True
                            break
                if not assigned:
                    # 1. Phân loại động dựa trên Hot Entities do AI trích xuất thực tế (Tự thích ứng cho mọi website quốc tế)
                    for entity in hot_entities:
                        if entity.lower() in title_lower or any(word in title_lower for word in entity.lower().split() if len(word) > 3):
                            art["category"] = entity
                            assigned = True
                            break
                            
                if not assigned:
                    # 2. Phân loại nhanh bằng từ khóa phổ biến (Đa ngôn ngữ) nếu AI phân loại bị sót
                    if any(w in title_lower for w in ["ông", "bà", "chính phủ", "tổng thống", "chủ tịch", "diplomacy", "chính trị", "tô lâm", "trump", "president", "policy", "prime minister"]):
                        art["category"] = "Politics/Diplomacy"
                    elif any(w in title_lower for w in ["vàng", "giá", "doanh nghiệp", "kinh tế", "tài chính", "usd", "bất động sản", "price", "sale", "store", "business", "market"]):
                        art["category"] = "Economics/Business"
                    elif any(w in title_lower for w in ["đập", "môi trường", "bão", "lũ", "nhiệt độ", "thời tiết", "conservation", "environment", "climate"]):
                        art["category"] = "Environment/Weather"
                    elif any(w in title_lower for w in ["vũ trụ", "kỷ lục", "tên lửa", "công nghệ", "ai", "openai", "space", "tech", "software"]):
                        art["category"] = "Science/Technology"
                    elif any(w in title_lower for w in ["trận", "bàn thắng", "cup", "arsenal", "havertz", "psg", "mu", "euro", "sports", "football", "match"]):
                        art["category"] = "Sports"
                    else:
                        art["category"] = hot_entities[0] if hot_entities else "General Content"

            # Áp dụng giới hạn số lượng dòng nếu người dùng yêu cầu
            if limit and limit > 0:
                print(f"[Advanced Agent] Slicing comprehensive list from {len(all_articles)} to {limit} items.")
                all_articles = all_articles[:limit]

            # Create final index output containing ALL articles found on the page!
            result = {
                "title": f"Bản đồ thông tin toàn diện: {domain}",
                "is_list_page": True,
                "inferred_categories": hot_entities,
                "confidence_score": 0.98,
                "articles": all_articles, # Chứa TOÀN BỘ bài viết cào được!
                "global_trends": global_trends,
                "original_source_url": url
            }
            return result

        # TẦNG 4: The Deep Harvester (Article detailing)
        else:
            print("[Advanced Agent] Harvesting deep article content (Tầng 4)...")
            unmasked_md = self.input_engineer.unmask_text(structured_md)
            harvested = self.harvester.harvest(page_title := "Article Page", unmasked_md)
            
            result = {
                "title": harvested.get("title", page_title) if harvested else page_title,
                "is_list_page": False,
                "description": harvested.get("main_content", "") if harvested else "",
                "core_arguments": harvested.get("core_arguments", []) if harvested else [],
                "sentiment": harvested.get("sentiment", "Neutral") if harvested else "Neutral",
                "inferred_categories": harvested.get("fact_checked_entities", ["General"]) if harvested else ["General"],
                "confidence_score": 0.9,
                "original_source_url": url
            }
            return result
