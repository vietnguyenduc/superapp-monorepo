import os
import json
import chromadb
import uuid
import re
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

class RAGEngine:
    def __init__(self, use_local_ollama: bool = True):
        self.storage_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'storage')
        self.chroma_path = os.path.join(self.storage_dir, 'chromadb')
        os.makedirs(self.chroma_path, exist_ok=True)
        
        # Initialize ChromaDB
        self.chroma_client = chromadb.PersistentClient(path=self.chroma_path)
        self.collection = self.chroma_client.get_or_create_collection(name="super_scraper_knowledge")
        
        load_unified_env()
        self.use_local_ollama = False
        
        gemini_key = os.environ.get("GEMINI_API_KEY")
        if gemini_key:
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

    def upsert_document(self, parsed_data: dict):
        """Lưu trữ dữ liệu cào được vào Vector Database"""
        doc_id = str(uuid.uuid4())
        text_content = json.dumps(parsed_data, ensure_ascii=False)
        metadata = {
            "title": parsed_data.get("title", "Untitled"),
            "url": parsed_data.get("original_source_url", ""),
            "is_list": str(parsed_data.get("is_list_page", False))
        }
        
        self.collection.upsert(
            documents=[text_content],
            metadatas=[metadata],
            ids=[doc_id]
        )
        print(f"[RAGEngine] Đã đẩy dữ liệu vào ChromaDB thành công. ID: {doc_id}")

    def ask(self, question: str) -> dict:
        # Truy vấn Semantic Search từ ChromaDB lấy 10 kết quả gần nhất
        results = self.collection.query(
            query_texts=[question],
            n_results=10
        )
        
        retrieved_docs = results['documents'][0] if results['documents'] else []
        distances = results['distances'][0] if 'distances' in results and results['distances'] else []
        
        # Scavenger Check Logic
        requires_scavenger = False
        avg_dist = sum(distances) / len(distances) if distances else 2.0
        # If very few docs or high distance (low similarity)
        if len(retrieved_docs) < 3 or avg_dist > 1.2:
            requires_scavenger = True
        
        if not retrieved_docs:
            return {
                "answer": "Hiện tại tôi chưa có dữ liệu nào trong kho lưu trữ để trả lời câu hỏi này.",
                "images": [],
                "requires_scavenger": True,
                "scavenger_topic": question
            }
            
        context_str = "\n---\n".join(retrieved_docs)
            
        prompt = f"""
        Bạn là một chuyên gia phân tích dữ liệu và tư vấn thông minh.
        Dưới đây là cơ sở dữ liệu (JSON) mà hệ thống vừa cào được từ các trang web:
        
        <DATABASE>
        {context_str}
        </DATABASE>
        
        Dựa VÀO dữ liệu trong <DATABASE>, hãy trả lời câu hỏi sau của người dùng:
        Câu hỏi: "{question}"
        
        HƯỚNG DẪN ĐẶC BIỆT VỀ HÌNH ẢNH & ĐỀ XUẤT (GALLERY CARD FORMAT):
        Nếu người dùng hỏi về hình ảnh, chủ đề, hoặc cần gợi ý danh sách bài viết liên quan:
        1. Tìm kiếm và chọn lọc ra các bài viết/sản phẩm phù hợp nhất với chủ đề yêu cầu từ <DATABASE>.
        2. Với mỗi bài viết/sản phẩm tìm được, nếu có đường dẫn ảnh (`image_url` hoặc `image` hoặc `images`), bạn PHẢI trình bày dưới định dạng Card/Gallery chuyên nghiệp như sau:
        
           [🖼️]({{image_url}}) **{{title}}**
           🔗 *Link nguồn:* [Xem chi tiết tại đây]({{url}})
           📝 *Tóm tắt nhanh:* {{summary or description}}
           
        3. Phân cách các đề xuất bằng một đường kẻ ngang `---` để tạo giao diện thoáng đãng.
        4. Trình bày câu trả lời rõ ràng bằng Markdown.
        5. KHÔNG bịa ra thông tin.
        """
        
        # Lọc ra danh sách ảnh từ các document truy xuất được
        is_asking_for_images = any(k in question.lower() for k in ["ảnh", "hình", "photo", "image", "media", "album", "gallery", "pic"])
        matching_images = []
        
        if is_asking_for_images:
            stop_words = {"cho", "tôi", "xem", "hình", "ảnh", "về", "chủ", "đề", "kiếm", "tìm", "những", "của", "và"}
            q_words = re.findall(r'\b\w+\b', question.lower())
            keywords = [w for w in q_words if w not in stop_words and len(w) > 2]
            
            for doc_str in retrieved_docs:
                try:
                    data = json.loads(doc_str)
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
        
        try:
            try:
                response = self.client.chat.completions.create(
                    model=self.model_name,
                    messages=[{"role": "user", "content": prompt}],
                    temperature=0.3
                )
            except Exception as outer_e:
                raise outer_e
            
            return {
                "answer": response.choices[0].message.content.strip(),
                "images": unique_images[:10],
                "requires_scavenger": requires_scavenger,
                "scavenger_topic": question
            }
        except Exception as e:
            return {
                "answer": f"Xin lỗi, có lỗi khi gọi LLM để trả lời: {e}",
                "images": [],
                "requires_scavenger": False
            }
