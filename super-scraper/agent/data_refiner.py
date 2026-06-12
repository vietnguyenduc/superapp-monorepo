import os
import json
import re
from datetime import datetime
from openai import OpenAI

import os
import requests
from dotenv import load_dotenv
from agent.rag_engine import RAGEngine

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

class DataRefiner:
    def __init__(self, use_local_ollama: bool = False):
        """
        Khởi tạo DataRefiner. (Ollama removed)
        """
        load_unified_env()
        self.use_local_ollama = False
        deepseek_key = os.environ.get("DEEPSEEK_API_KEY")
        deepseek_base = os.environ.get("DEEPSEEK_BASE_URL", "https://api.deepseek.com")
        deepseek_model = os.environ.get("DEEPSEEK_MODEL", "deepseek-chat")
        gemini_key = os.environ.get("GEMINI_API_KEY")
        
        if deepseek_key:
            print(f"[+] Khởi tạo AI kết nối với DeepSeek Cloud API ({deepseek_model})")
            self.client = OpenAI(
                base_url=deepseek_base,
                api_key=deepseek_key
            )
            self.model_name = deepseek_model
        elif gemini_key:
            print("[+] Khởi tạo AI kết nối với Cloud API (Gemini-2.5-Flash)...")
            self.client = OpenAI(
                base_url="https://generativelanguage.googleapis.com/v1beta/openai/",
                api_key=gemini_key
            )
            self.model_name = "gemini-2.5-flash"
        else:
            print("[+] Khởi tạo AI kết nối với Cloud API (OpenAI)")
            self.client = OpenAI(
                api_key=os.environ.get("OPENAI_API_KEY", "YOUR_API_KEY_HERE")
            )
            self.model_name = "gpt-3.5-turbo"
            
        self.base_dir = os.path.join(os.path.dirname(__file__), '..', 'storage', 'refined_data')
        self.index_file = os.path.join(os.path.dirname(__file__), '..', 'storage', 'summary_index.json')
        os.makedirs(self.base_dir, exist_ok=True)
        
    def _update_index(self, category: str, filepath: str, title: str):
        """Cập nhật đường dẫn file vào file mục lục tổng summary_index.json"""
        index_data = {}
        if os.path.exists(self.index_file):
            with open(self.index_file, 'r', encoding='utf-8') as f:
                try:
                    index_data = json.load(f)
                except:
                    pass
                    
        if category not in index_data:
            index_data[category] = []
            
        index_data[category].append({
            "title": title,
            "path": filepath,
            "date": datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        })
        
        with open(self.index_file, 'w', encoding='utf-8') as f:
            json.dump(index_data, f, indent=4, ensure_ascii=False)

    def refine_text(self, raw_text: str, source_url: str, custom_schema: str = None):
        """Đưa text thô qua LLM để biến thành JSON cấu trúc"""
        print("[*] Đang gửi dữ liệu thô cho AI phân tích...")
        
        if custom_schema:
            schema_instruction = f"""
            The JSON MUST strictly follow this exact structure (fill in the data based on the text):
            {custom_schema}
            
            Also, you MUST include these 3 standard keys at the root level of your JSON response:
            - "title": A short, clear title summarizing the content.
            - "inferred_categories": A list of 1-3 tags or categories (e.g., ["Food", "Travel"]).
            - "confidence_score": A float between 0.0 and 1.0 indicating data quality.
            """
        else:
            schema_instruction = """
            Determine if the raw text represents a single article/product/topic page OR a homepage/listing/portal page (which contains multiple distinct articles, products, or headlines).
            
            1. If it is a homepage/listing/portal/catalog page, you MUST output a JSON with exactly these keys:
            - "title": A short, clear title summarizing this website or list page.
            - "is_list_page": true
            - "inferred_categories": A list of 1-3 tags or categories (e.g., ["News", "General"]).
            - "confidence_score": A float between 0.0 and 1.0.
            - "articles": An extensive, comprehensive list of ALL articles/items found in the text (extract as many items as possible, up to 100+ items if present! Do NOT restrict or truncate). Each article must have:
                * "title": The specific title of this article.
                * "summary": A brief 1-2 sentence summary of this article.
                * "body": The FULL content text of this article (at least 200-500 characters, do NOT truncate).
                * "category": The specific category of this article (e.g., "Politics", "Business", "Sports", "Social").
                * "url": The source URL of this article if available.
                
            2. If it is a single article/product/topic page, you MUST output a JSON with exactly these keys:
            - "title": The title of this article.
            - "is_list_page": false
            - "description": A concise summary (3-4 sentences).
            - "body": The FULL content text (at least 500 characters, include all paragraphs).
            - "inferred_categories": A list of 1-3 tags or categories.
            - "confidence_score": A float between 0.0 and 1.0.
            """
            
        system_prompt = f"""
        You are an expert Data Extractor and Categorizer. 
        Analyze the following raw scraped text and extract the key information into a STRICT JSON object.
        DO NOT include any markdown code blocks (like ```json). Return ONLY the raw JSON string.
        
        {schema_instruction}
        """
        
        user_prompt = f"Raw Text:\n{raw_text}\n\nSource URL: {source_url}"
        
        try:
            try:
                response = self.client.chat.completions.create(
                    model=self.model_name,
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt}
                    ],
                    temperature=0.1 # Nhiệt độ thấp để kết quả ổn định và bám sát JSON
                )
            except Exception as outer_e:
                gemini_key = os.environ.get("GEMINI_API_KEY")
                deepseek_key = os.environ.get("DEEPSEEK_API_KEY")
                
                # If primary fails, let's try DeepSeek if key is present
                if deepseek_key and self.model_name != os.environ.get("DEEPSEEK_MODEL", "deepseek-chat"):
                    try:
                        print("[!] Fallback to DeepSeek in DataRefiner...")
                        ds_client = OpenAI(
                            base_url=os.environ.get("DEEPSEEK_BASE_URL", "https://api.deepseek.com"),
                            api_key=deepseek_key
                        )
                        response = ds_client.chat.completions.create(
                            model=os.environ.get("DEEPSEEK_MODEL", "deepseek-chat"),
                            messages=[
                                {"role": "system", "content": system_prompt},
                                {"role": "user", "content": user_prompt}
                            ],
                            temperature=0.1
                        )
                    except Exception as ds_e:
                        print(f"[!] DeepSeek fallback also failed in DataRefiner: {ds_e}")
                        outer_e = ds_e
                
                # If DeepSeek also fails or is not available, try Gemini Cloud API
                if 'response' not in locals() and gemini_key:
                    try:
                        print("[!] Fallback to Gemini Cloud API in DataRefiner...")
                        fallback_client = OpenAI(
                            base_url="https://generativelanguage.googleapis.com/v1beta/",
                            api_key=gemini_key
                        )
                        response = fallback_client.chat.completions.create(
                            model="gemini-2.5-flash",
                            messages=[
                                {"role": "system", "content": system_prompt},
                                {"role": "user", "content": user_prompt}
                            ],
                            temperature=0.1
                        )
                    except Exception as gem_e:
                        print(f"[!] Gemini fallback also failed in DataRefiner: {gem_e}")
                        raise gem_e
                elif 'response' not in locals():
                    raise outer_e
            
            output_text = response.choices[0].message.content.strip()
            
            # Xóa các markdown code blocks nếu LLM vô tình sinh ra
            output_text = re.sub(r'^```json\s*', '', output_text)
            output_text = re.sub(r'^```\s*', '', output_text)
            output_text = re.sub(r'\s*```$', '', output_text)
            
            parsed_data = json.loads(output_text)
            parsed_data['original_source_url'] = source_url
            
            # Định tuyến lưu file
            main_category = "Uncategorized"
            if parsed_data.get('inferred_categories') and len(parsed_data['inferred_categories']) > 0:
                raw_cat = parsed_data['inferred_categories'][0]
                # Clean category name to prevent [Errno 22] invalid directory character error on Windows
                main_category = re.sub(r'[^a-zA-Z0-9_\-\s]', '_', raw_cat).strip()
                if not main_category:
                    main_category = "Uncategorized"
                
            # Làm sạch tên file (chỉ giữ alphanumeric)
            safe_title = re.sub(r'[^a-zA-Z0-9]', '_', parsed_data.get('title', 'untitled'))[:50]
            today = datetime.now().strftime('%Y-%m-%d')
            
            save_dir = os.path.join(self.base_dir, main_category, today)
            os.makedirs(save_dir, exist_ok=True)
            
            filename = f"{safe_title}.json"
            filepath = os.path.join(save_dir, filename)
            
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(parsed_data, f, indent=4, ensure_ascii=False)
                
            self._update_index(main_category, filepath, parsed_data.get('title'))
            
            # Đẩy vào ChromaDB
            try:
                rag = RAGEngine(use_local_ollama=self.use_local_ollama)
                rag.upsert_document(parsed_data)
            except Exception as db_err:
                print(f"[x] Lỗi khi đẩy vào ChromaDB: {db_err}")
            
            print(f"[+] AI đã xử lý xong! Đã lưu vào danh mục: {main_category}")
            print(f"    File: {filepath}")
            return parsed_data
            
        except json.JSONDecodeError:
            print("[x] Lỗi: LLM không trả về chuẩn JSON. Hãy thử lại hoặc đổi Model.")
            print(f"Nguyên văn LLM:\n{output_text}")
            return None
        except Exception as e:
            print(f"[x] Lỗi khi gọi AI: {e}")
            return None
