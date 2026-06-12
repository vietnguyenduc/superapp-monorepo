import os
import json
import re
import time
from openai import OpenAI

import os
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

def _call_llm_with_fallback(client, model, messages, temperature=0.3, max_retries=2):
    """
    Gọi LLM với fallback đa tầng:
    1. Thử model chính
    2. Nếu lỗi 429 (quota) → DeepSeek (nếu có key)
    3. Nếu DeepSeek lỗi → Gemini fallback models (gemini-2.5-flash → gemini-1.5-flash → gemini-1.5-pro)
    4. Retry sau 30s nếu tất cả đều fail
    """
    gemini_key = os.environ.get("GEMINI_API_KEY")
    deepseek_key = os.environ.get("DEEPSEEK_API_KEY")
    deepseek_base = os.environ.get("DEEPSEEK_BASE_URL", "https://api.deepseek.com")
    deepseek_model = os.environ.get("DEEPSEEK_MODEL", "deepseek-chat")
    
    # Xác định model hiện tại
    current_model = model
    
    for attempt in range(max_retries + 1):
        # ── Thử model chính ──────────────────────────────────────────────
        try:
            response = client.chat.completions.create(
                model=current_model,
                messages=messages,
                temperature=temperature,
                timeout=15
            )
            return response
        except Exception as e:
            error_str = str(e)
            is_quota_error = "429" in error_str or "quota" in error_str.lower() or "RESOURCE_EXHAUSTED" in error_str
            
            if is_quota_error:
                print(f"[!] Model {current_model} hết quota (429). Đang tìm fallback...")
            else:
                print(f"[!] Lỗi model {current_model}: {error_str}")
                if attempt < max_retries:
                    print(f"[!] Retry lần {attempt+1} sau 2s...")
                    time.sleep(2)
                    continue
                else:
                    raise e
        
        if deepseek_key:
            try:
                print(f"[!] Falling back to DeepSeek ({deepseek_model})...")
                ds_client = OpenAI(base_url=deepseek_base, api_key=deepseek_key)
                response = ds_client.chat.completions.create(
                    model=deepseek_model,
                    messages=messages,
                    temperature=temperature,
                    timeout=15
                )
                return response
            except Exception as ds_e:
                print(f"[!] DeepSeek fallback cũng lỗi: {ds_e}")
        
        # ── Fallback 2: Gemini Cloud (nếu có key) ────────────────────────
        if gemini_key:
            fallback_models = ["gemini-2.5-flash", "gemini-1.5-flash", "gemini-1.5-pro"]
            for fb_model in fallback_models:
                if fb_model == current_model:
                    continue  # Bỏ qua model đã thử
                try:
                    print(f"[!] Falling back to Gemini model: {fb_model}...")
                    fb_client = OpenAI(
                        base_url="https://generativelanguage.googleapis.com/v1beta/",
                        api_key=gemini_key
                    )
                    response = fb_client.chat.completions.create(
                        model=fb_model,
                        messages=messages,
                        temperature=temperature,
                        timeout=15
                    )
                    return response
                except Exception as fb_e:
                    fb_err = str(fb_e)
                    if "429" in fb_err or "quota" in fb_err.lower() or "RESOURCE_EXHAUSTED" in fb_err:
                        print(f"[!] Gemini {fb_model} cũng hết quota. Thử model khác...")
                        continue
                    else:
                        print(f"[!] Gemini {fb_model} lỗi: {fb_e}")
                        continue
        
        # ── Nếu tất cả fallback đều fail → retry ─────────────────────────
        if attempt < max_retries:
            print(f"[!] Tất cả fallback đều fail. Retry lần {attempt+1} sau 2s...")
            time.sleep(2)
        else:
            raise Exception("Tất cả các model AI (Gemini, DeepSeek) đều hết quota hoặc gặp lỗi.")

class IntentAnalyzer:
    def __init__(self, use_local_ollama: bool = False):
        load_unified_env()
        self.use_local_ollama = False
        gemini_key = os.environ.get("GEMINI_API_KEY")
        deepseek_key = os.environ.get("DEEPSEEK_API_KEY")
        
        if deepseek_key:
            deepseek_base = os.environ.get("DEEPSEEK_BASE_URL", "https://api.deepseek.com")
            deepseek_model = os.environ.get("DEEPSEEK_MODEL", "deepseek-chat")
            self.client = OpenAI(base_url=deepseek_base, api_key=deepseek_key)
            self.model_name = deepseek_model
        elif gemini_key:
            self.client = OpenAI(
                base_url="https://generativelanguage.googleapis.com/v1beta/openai/",
                api_key=gemini_key
            )
            self.model_name = "gemini-2.5-flash"
        else:
            self.client = OpenAI(
                api_key=os.environ.get("OPENAI_API_KEY", "YOUR_API_KEY_HERE")
            )
            self.model_name = "gpt-3.5-turbo"
            
    def propose_schema(self, snippet: str) -> str:
        """
        Dựa vào một đoạn text nhỏ từ website, đề xuất cấu trúc JSON phù hợp.
        """
        prompt = f"""
        Analyze this structured snippet from a webpage:
        "{snippet[:2500]}"
        
        Determine if this page represents:
        A) A Portal/Listing/Homepage/Hub page containing multiple separate articles, products, or cards.
        B) A Single Detail Page containing only one article, product, or topic.
        
        Propose a highly detailed, professional JSON schema to extract all high-value information from this site.
        
        CRITICAL RULES:
        1. If it is a Portal/Listing/Homepage/Hub page (like a news homepage, category index, product search results), your proposed JSON MUST represent a list-based structure (e.g., a root object with keys like "page_title", "domain", and an array "articles" or "items" containing detailed elements). Each item in the array MUST contain distinct fields like title, link, summary, category, date, etc. Do NOT merge all titles/bodies into a single root item!
        2. If it is a Single Detail Page, your proposed JSON should represent a single-item structure.
        
        The proposed schema MUST be rich and include:
        - For Portal/Hub: title/description of the page, inferred_global_categories, and the array of objects ("articles" or "products").
        - Return ONLY a valid, prettified raw JSON string representing the proposed structure (empty string values or empty arrays).
        
        Do NOT include any explanations, markdown code blocks, or conversational text.
        """
        try:
            # Sử dụng fallback đa tầng thay vì gọi trực tiếp
            response = _call_llm_with_fallback(
                self.client,
                self.model_name,
                [{"role": "user", "content": prompt}],
                temperature=0.3
            )
            out = response.choices[0].message.content.strip()
            out = re.sub(r'^```json\s*', '', out)
            out = re.sub(r'^```\s*', '', out)
            out = re.sub(r'\s*```$', '', out)
            return out
        except Exception as e:
            print(f"[x] IntentAnalyzer.propose_schema failed: {e}")
            return '{\n  "page_title": "Bản đồ thông tin toàn diện",\n  "domain": "Domain trang web",\n  "articles": [\n    {\n      "title": "Tiêu đề bài viết",\n      "description": "Tóm tắt ngắn gọn",\n      "url": "Đường dẫn nguồn",\n      "category": "Chuyên mục",\n      "publish_date": "Ngày xuất bản"\n    }\n  ]\n}'
            
    def apply_user_intent(self, user_intent: str) -> str:
        """
        Biến ý định của người dùng thành một Schema chi tiết.
        """
        if not user_intent:
            return '{"extracted_data": []}'
            
        intent_lower = user_intent.lower()
        # Fast matching for list-based requests to bypass LLM latency and 429 quota limits
        is_list_intent = any(k in intent_lower for k in [
            "bài", "dòng", "tin", "tức", "chủ đề", "xăng", "bitcoin", "vàng", "giá", 
            "lấy", "cào", "list", "danh sách", "hàng", "mục", "nổi bật", "hot", "trend"
        ])
        if is_list_intent:
            return '{\n  "page_title": "Kết quả cào trích xuất dữ liệu",\n  "articles": [\n    {\n      "title": "Tiêu đề bài viết/sản phẩm",\n      "description": "Tóm tắt/Nội dung ngắn gọn",\n      "url": "Đường dẫn nguồn bài viết gốc",\n      "category": "Chuyên mục phân loại",\n      "publish_date": "Ngày xuất bản",\n      "image_url": "Đường dẫn hình ảnh minh họa chất lượng cao"\n    }\n  ]\n}'

        prompt = f"""
        The user wants to scrape a website. Here is their intent:
        "{user_intent}"
        
        Create a strict JSON schema structure to extract data that specifically satisfies this intent.
        Return ONLY a raw JSON dictionary (keys and empty string values or empty lists) representing the structure.
        No markdown, no explanation.
        """
        try:
            # Sử dụng fallback đa tầng
            response = _call_llm_with_fallback(
                self.client,
                self.model_name,
                [{"role": "user", "content": prompt}],
                temperature=0.1
            )
            out = response.choices[0].message.content.strip()
            out = re.sub(r'^```json\s*', '', out)
            out = re.sub(r'^```\s*', '', out)
            out = re.sub(r'\s*```$', '', out)
            return out
        except Exception:
            return '{"extracted_data": []}'
