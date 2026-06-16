import os
import json
import glob
import re
from openai import OpenAI

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

class RAGEngine:
    def __init__(self, use_local_ollama: bool = True):
        # `use_local_ollama` is kept for backward compatibility with existing callers,
        # but Ollama/Gemini are no longer used. We always use DeepSeek -> Nvidia.
        self.data_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'storage', 'refined_data')
        load_unified_env()

        deepseek_key = os.environ.get("DEEPSEEK_API_KEY")
        nvidia_key = os.environ.get("NVIDIA_API_KEY")

        if deepseek_key:
            self.client = OpenAI(
                base_url=os.environ.get("DEEPSEEK_BASE_URL", "https://api.deepseek.com"),
                api_key=deepseek_key
            )
            self.model_name = os.environ.get("DEEPSEEK_MODEL", "deepseek-chat")
        elif nvidia_key:
            self.client = OpenAI(
                base_url=os.environ.get("NVIDIA_BASE_URL", "https://integrate.api.nvidia.com/v1"),
                api_key=nvidia_key
            )
            self.model_name = os.environ.get("NVIDIA_MODEL", "meta/llama-3.1-405b-instruct")
        else:
            # No keys configured yet; default to DeepSeek so a clear auth error surfaces.
            self.client = OpenAI(
                base_url=os.environ.get("DEEPSEEK_BASE_URL", "https://api.deepseek.com"),
                api_key="MISSING_DEEPSEEK_API_KEY"
            )
            self.model_name = os.environ.get("DEEPSEEK_MODEL", "deepseek-chat")

    def ask(self, question: str, provider: str = "default") -> str:
        # Tải tất cả file JSON để làm context (Giới hạn 10 file gần nhất để tránh quá tải token)
        files = glob.glob(os.path.join(self.data_dir, '**', '*.json'), recursive=True)
        files.sort(key=os.path.getmtime, reverse=True)
        
        context_data = []
        for f in files[:5]: # Chỉ lấy 5 file mới nhất cho local LLM
            try:
                with open(f, 'r', encoding='utf-8') as file:
                    data = json.load(file)
                    context_data.append(json.dumps(data, ensure_ascii=False))
            except Exception as e:
                pass
                
        context_str = "\n---\n".join(context_data)
        
        if not context_str.strip():
            return "Hiện tại tôi chưa có dữ liệu nào trong kho lưu trữ để trả lời câu hỏi này. Bạn hãy dùng lệnh /crawl để thu thập dữ liệu trước nhé."
            
        prompt = f"""
        Bạn là một chuyên gia phân tích dữ liệu và tư vấn thông minh.
        Dưới đây là cơ sở dữ liệu (JSON) mà hệ thống vừa cào được từ các trang web (mỗi file chứa thông tin bài viết, đường dẫn ảnh, liên kết nguồn...):
        
        <DATABASE>
        {context_str}
        </DATABASE>
        
        Dựa VÀO dữ liệu trong <DATABASE>, hãy trả lời câu hỏi sau của người dùng:
        Câu hỏi: "{question}"
        
        HƯỚNG DẪN ĐẶC BIỆT VỀ HÌNH ẢNH & ĐỀ XUẤT (GALLERY CARD FORMAT):
        Nếu người dùng hỏi về hình ảnh, chủ đề, hoặc cần gợi ý danh sách bài viết liên quan (ví dụ: "hình ảnh về chủ đề xăng", "gợi ý tin tức mới", "tóm tắt ảnh"):
        1. Tìm kiếm và chọn lọc ra các bài viết/sản phẩm phù hợp nhất với chủ đề yêu cầu từ <DATABASE>.
        2. Với mỗi bài viết/sản phẩm tìm được, nếu có đường dẫn ảnh (`image_url` hoặc `image` hoặc `images`), bạn PHẢI trình bày dưới định dạng Card/Gallery chuyên nghiệp như sau:
        
           [🖼️]({{image_url}}) **{{title}}**
           🔗 *Link nguồn:* [Xem chi tiết tại đây]({{url}})
           📝 *Tóm tắt nhanh:* {{summary or description}}
           
           *(Mẹo hiển thị: Ký tự [🖼️](image_url) phải ở đầu dòng để Telegram tự động sinh bản xem trước ảnh xem trước cực kỳ sang trọng)*
           
        3. Phân cách các đề xuất bằng một đường kẻ ngang `---` để tạo giao diện thoáng đãng, premium.
        4. Trình bày câu trả lời rõ ràng, dễ đọc bằng Markdown.
        5. Nếu trong database không có thông tin để trả lời, hãy từ chối lịch sự. KHÔNG bịa ra thông tin.
        """
        
        # Check if the user is asking for images
        is_asking_for_images = any(k in question.lower() for k in ["ảnh", "hình", "photo", "image", "media", "album", "gallery", "pic"])
        matching_images = []
        
        if is_asking_for_images:
            stop_words = {"cho", "tôi", "xem", "hình", "ảnh", "về", "chủ", "đề", "kiếm", "tìm", "những", "của", "và"}
            q_words = re.findall(r'\b\w+\b', question.lower()) if 're' in globals() else re.findall(r'\b\w+\b', question.lower())
            # Import re locally if not globally
            import re as _re
            q_words = _re.findall(r'\b\w+\b', question.lower())
            keywords = [w for w in q_words if w not in stop_words and len(w) > 2]
            
            for f in files:
                try:
                    with open(f, 'r', encoding='utf-8') as file:
                        data = json.load(file)
                        
                        if data.get("is_list_page") or "articles" in data:
                            articles = data.get("articles", [])
                            for art in articles:
                                art_title = art.get("title", "").lower()
                                art_desc = (art.get("description", "") or art.get("summary", "")).lower()
                                img_url = art.get("image_url") or art.get("image") or art.get("images")
                                if isinstance(img_url, list) and len(img_url) > 0:
                                    img_url = img_url[0]
                                    
                                if img_url and img_url.startswith("http"):
                                    if not keywords or any(k in art_title or k in art_desc for k in keywords):
                                        matching_images.append({
                                            "url": img_url,
                                            "title": art.get("title", "Ảnh minh họa"),
                                            "source": art.get("url") or data.get("original_source_url", "")
                                        })
                        else:
                            page_title = data.get("title", "").lower()
                            page_desc = data.get("description", "").lower()
                            img_url = data.get("image_url") or data.get("image") or data.get("images")
                            if isinstance(img_url, list) and len(img_url) > 0:
                                img_url = img_url[0]
                                
                            if img_url and img_url.startswith("http"):
                                if not keywords or any(k in page_title or k in page_desc for k in keywords):
                                    matching_images.append({
                                        "url": img_url,
                                        "title": data.get("title", "Ảnh minh họa"),
                                        "source": data.get("original_source_url", "")
                                    })
                except Exception:
                    pass
                    
        # Remove duplicates
        seen_urls = set()
        unique_images = []
        for img in matching_images:
            if img["url"] not in seen_urls:
                seen_urls.add(img["url"])
                unique_images.append(img)
        
        deepseek_key = os.environ.get("DEEPSEEK_API_KEY")
        nvidia_key = os.environ.get("NVIDIA_API_KEY")

        # Provider chain: DeepSeek (primary) -> Nvidia (fallback). The `provider`
        # argument can force a specific starting provider, otherwise default order.
        chain = []
        if provider == "nvidia":
            chain = ["nvidia", "deepseek"]
        else:
            chain = ["deepseek", "nvidia"]

        last_error = None
        for prov in chain:
            if prov == "deepseek" and deepseek_key:
                client = OpenAI(
                    base_url=os.environ.get("DEEPSEEK_BASE_URL", "https://api.deepseek.com"),
                    api_key=deepseek_key
                )
                model = os.environ.get("DEEPSEEK_MODEL", "deepseek-chat")
            elif prov == "nvidia" and nvidia_key:
                client = OpenAI(
                    base_url=os.environ.get("NVIDIA_BASE_URL", "https://integrate.api.nvidia.com/v1"),
                    api_key=nvidia_key
                )
                model = os.environ.get("NVIDIA_MODEL", "meta/llama-3.1-405b-instruct")
            else:
                continue

            try:
                response = client.chat.completions.create(
                    model=model,
                    messages=[{"role": "user", "content": prompt}],
                    temperature=0.3
                )
                return {
                    "answer": response.choices[0].message.content.strip(),
                    "images": unique_images[:10]
                }
            except Exception as e:
                last_error = e
                print(f"[!] {prov} RAG call failed ({e}). Trying next provider...")

        return {
            "answer": f"Xin lỗi, có lỗi khi gọi LLM để trả lời: {last_error or 'Chưa cấu hình DEEPSEEK_API_KEY/NVIDIA_API_KEY.'}",
            "images": []
        }
