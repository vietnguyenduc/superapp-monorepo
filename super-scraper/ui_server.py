import os
import sys
import json
import uuid
import time
import threading
import asyncio
import sqlite3
from datetime import datetime
from flask import Flask, render_template, request, jsonify, Response, stream_with_context
from flask_socketio import SocketIO, emit

# Force UTF-8 on Windows
if sys.platform.startswith('win'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret!'
socketio = SocketIO(app, async_mode='eventlet', cors_allowed_origins="*")

BASE_DIR = os.path.dirname(__file__)
STORAGE_DIR = os.path.join(BASE_DIR, 'storage')
INDEX_FILE = os.path.join(STORAGE_DIR, 'summary_index.json')

# ── In-memory task store for real-time crawl progress ──
_crawl_tasks = {}

# ─────────────────────────────────────────────────────────
#  HELPERS
# ─────────────────────────────────────────────────────────

def load_index():
    """Load summary_index.json"""
    if not os.path.exists(INDEX_FILE):
        return {}
    with open(INDEX_FILE, 'r', encoding='utf-8') as f:
        try:
            return json.load(f)
        except:
            return {}

def save_index(data):
    """Save summary_index.json atomically."""
    os.makedirs(os.path.dirname(INDEX_FILE), exist_ok=True)
    tmp = INDEX_FILE + '.tmp'
    with open(tmp, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=4, ensure_ascii=False)
    os.replace(tmp, INDEX_FILE)

def flatten_feed(data):
    """Flatten category-indexed data into a sorted list."""
    feed = []
    for category, items in data.items():
        for item in items:
            item['category'] = category
            feed.append(item)
    feed.sort(key=lambda x: x.get('date', ''), reverse=True)
    return feed

def get_task_status(task_id):
    """Get current status of a crawl task."""
    task = _crawl_tasks.get(task_id)
    if not task:
        return {'done': True, 'error': 'Task not found', 'progress': 100}
    return task

def normalize_path(p):
    """Normalize a path to its absolute, real form for reliable comparison.
    
    Handles:
    - Mixed slash directions (/, \\)
    - Relative segments (..)
    - Drive letter case mismatch (c: vs C:)
    - Trailing separators
    """
    if not p:
        return None
    # Normalize separators to OS default
    p = os.path.normpath(p)
    # Make absolute (resolves '..')
    p = os.path.abspath(p)
    # Lowercase drive letter on Windows for case-insensitive comparison
    if sys.platform.startswith('win') and len(p) >= 2 and p[1] == ':':
        p = p[0].lower() + p[1:]
    return p

def deduplicate_index(index):
    """Remove duplicate entries in the index (same normalized path)."""
    changed = False
    for category in list(index.keys()):
        items = index[category]
        seen = set()
        new_items = []
        for item in items:
            norm = normalize_path(item.get('path', ''))
            if norm and norm not in seen:
                seen.add(norm)
                new_items.append(item)
            elif norm:
                changed = True  # duplicate found, removed
        if len(new_items) < len(items):
            changed = True
        if new_items:
            index[category] = new_items
        else:
            del index[category]
    if changed:
        save_index(index)
    return index

# ─────────────────────────────────────────────────────────
#  ASYNC CRAWL PIPELINE (runs in background thread)
# ─────────────────────────────────────────────────────────

def _run_crawl_pipeline(url: str, user_intent: str, task_id: str):
    """
    Background thread that runs the full crawl pipeline
    and updates _crawl_tasks[task_id] with progress.
    """
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        loop.run_until_complete(_async_crawl(url, user_intent, task_id))
    finally:
        loop.close()

async def _async_crawl(url: str, user_intent: str, task_id: str):
    """Async crawl pipeline with progress updates."""
    task = _crawl_tasks[task_id]
    
    try:
        # ── Step 1: Connect & Preview ──
        task['step'] = 'connect'
        task['status'] = 'active'
        task['progress'] = 10
        task['message'] = f'Đang kết nối tới {url}...'
        
        # Import ecosystem bridge functions
        from ecosystem_bridge import fetch_proposed_schema
        
        preview_result = fetch_proposed_schema(url, task_id)
        task['preview'] = preview_result
        task['progress'] = 20
        task['step'] = 'fetch'
        task['status'] = 'done'
        task['message'] = 'Đã kết nối thành công! Đang phân tích cấu trúc trang web...'
        
        # ── Step 2: Fetch & Parse ──
        import requests
        from bs4 import BeautifulSoup
        import urllib.parse
        import re
        
        if not url.startswith(('http://', 'https://')):
            url = 'https://' + url
        
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
        
        task['progress'] = 30
        task['step'] = 'fetch'
        task['status'] = 'active'
        task['message'] = 'Đang tải toàn bộ nội dung trang web...'
        
        res = requests.get(url, timeout=15, headers=headers)
        soup = BeautifulSoup(res.text, 'html.parser')
        page_title = soup.title.string.strip() if soup.title else url
        
        # Decide if we do BULK CRAWL (Homepage/List) or SINGLE CRAWL
        parsed_url = urllib.parse.urlparse(url)
        is_homepage = len(parsed_url.path) <= 1 or parsed_url.path == '/index.html' or 'timkiem' in url or 'search' in url
        
        from agent.data_refiner import DataRefiner
        refiner = DataRefiner(use_local_ollama=True)
        
        custom_schema = None
        if user_intent:
            from agent.intent_analyzer import IntentAnalyzer
            analyzer = IntentAnalyzer(use_local_ollama=True)
            custom_schema = analyzer.apply_user_intent(user_intent)
            
        results = []
        if is_homepage and user_intent:
            # --- BULK CRAWL ---
            task['message'] = 'Phát hiện trang chủ/danh sách. Đang thu thập link bài viết con...'
            article_links = []
            seen_titles = set()
            for a in soup.find_all('a'):
                text = a.get_text(strip=True)
                href = a.get('href', '')
                if not text or len(text) < 15 or not href: continue
                if text.lower() in ["video", "ảnh", "ý kiến", "đăng nhập", "mới nhất", "xem thêm"]: continue
                if text in seen_titles: continue
                
                real_url = urllib.parse.urljoin(url, href)
                # Check if it's a deep link (rough heuristic: path length > 15 or contains numbers)
                if len(urllib.parse.urlparse(real_url).path) > 15 or re.search(r'\d{4,}', real_url):
                    seen_titles.add(text)
                    article_links.append({"title": text, "url": real_url})
                    if len(article_links) >= 10: # Limit to 10 articles
                        break
            
            task['message'] = f'Đã tìm thấy {len(article_links)} bài viết. Bắt đầu cào song song...'
            task['progress'] = 40
            
            import concurrent.futures

            def scrape_single_article(idx, art):
                try:
                    # Update progress message periodically
                    task['message'] = f'Đang cào bài {idx+1}/{len(article_links)}: {art["title"][:30]}...'
                    child_res = requests.get(art['url'], timeout=10, headers=headers)
                    child_soup = BeautifulSoup(child_res.text, 'html.parser')
                    
                    for tag in child_soup(['script', 'style', 'nav', 'footer', 'iframe', 'noscript', 'header', 'aside']):
                        tag.decompose()
                    
                    # ── Lấy nội dung THẬT: paragraphs đầy đủ ──
                    full_text_parts = []
                    for el in child_soup.find_all(['h1', 'h2', 'h3', 'h4', 'p', 'li', 'blockquote', 'img']):
                        if el.name == 'img':
                            src = el.get('data-src') or el.get('src')
                            if src and src.startswith('http'):
                                full_text_parts.append(f"\n[Image: {src}]\n")
                        else:
                            text = el.get_text(strip=True)
                            if text and len(text) > 5:
                                if el.name in ['h1', 'h2', 'h3', 'h4']:
                                    full_text_parts.append(f"\n## {text}\n")
                                elif el.name == 'li':
                                    full_text_parts.append(f"- {text}")
                                elif el.name == 'blockquote':
                                    full_text_parts.append(f"> {text}")
                                else:
                                    full_text_parts.append(text)
                    
                    child_text = "\n".join(full_text_parts)[:15000]
                    
                    # ── Dùng LLM để tóm tắt NHANH, không extract chi tiết ──
                    # Ưu tiên lấy raw content + summary ngắn
                    res_data = {
                        "title": art["title"],
                        "url": art["url"],
                        "body": child_text[:8000],  # Full content thật
                        "summary": "",
                        "category": "",
                        "date": ""
                    }
                    
                    # Gọi LLM để lấy summary + category (nếu có)
                    try:
                        summary_result = refiner.refine_text(child_text[:5000], art['url'], custom_schema=custom_schema)
                        if summary_result and isinstance(summary_result, dict):
                            res_data["summary"] = summary_result.get("description") or summary_result.get("summary") or ""
                            res_data["category"] = ", ".join(summary_result.get("inferred_categories", [])) if summary_result.get("inferred_categories") else ""
                            res_data["date"] = summary_result.get("publish_date") or summary_result.get("date") or ""
                    except Exception:
                        pass  # Giữ nguyên raw content nếu LLM fail
                    
                    return res_data
                except Exception as e:
                    print(f"Lỗi cào bài {art['url']}: {e}")
                    return None
            
            with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
                future_to_art = {executor.submit(scrape_single_article, i, art): art for i, art in enumerate(article_links)}
                completed = 0
                for future in concurrent.futures.as_completed(future_to_art):
                    completed += 1
                    task['progress'] = 40 + int(40 * (completed / len(article_links)))
                    res_data = future.result()
                    if res_data:
                        results.append(res_data)
            
            # Combine results for final output
            result = {
                "title": page_title,
                "is_list_page": True,
                "description": f"Đã cào hàng loạt {len(results)} bài viết từ {url}",
                "inferred_categories": ["Bulk Crawl"],
                "confidence_score": 0.9,
                "original_source_url": url,
                "articles": results
            }
        else:
            # --- SINGLE CRAWL ---
            task['message'] = 'Đang tải nội dung chi tiết trang...'
            # Clean DOM
            for element in soup(["script", "style", "noscript", "header", "footer", "nav", "iframe", "aside"]):
                element.decompose()
            
            # Extract structured text
            lines = []
            for tag in soup.find_all(['h1', 'h2', 'h3', 'h4', 'p', 'li', 'img']):
                if tag.name == 'img':
                    src = tag.get('src') or tag.get('data-src') or tag.get('data-original')
                    if src and src.startswith('http'):
                        alt = tag.get('alt', '').strip() or "Hình ảnh"
                        lines.append(f"\n![{alt}]({src})\n")
                else:
                    text = tag.get_text(strip=True)
                    if text and len(text) > 8:
                        if tag.name == 'h1':
                            lines.append(f"\n# {text}\n")
                        elif tag.name == 'h2':
                            lines.append(f"\n## {text}\n")
                        elif tag.name in ['h3', 'h4']:
                            lines.append(f"\n### {text}\n")
                        elif tag.name == 'li':
                            lines.append(f"- {text}")
                        else:
                            lines.append(text)
            
            raw_text = "\n".join(lines)[:15000]
            task['progress'] = 55
            task['message'] = 'Đang gửi dữ liệu cho AI phân tích và trích xuất thông tin...'
            
            result = refiner.refine_text(raw_text, url, custom_schema=custom_schema)
            if not result:
                result = {
                    "title": page_title,
                    "description": raw_text[:300] + "...",
                    "inferred_categories": ["General"],
                    "confidence_score": 0.5,
                    "original_source_url": url
                }

        task['progress'] = 80
        task['step'] = 'save'
        task['status'] = 'active'
        task['message'] = 'Đang lưu dữ liệu vào kho và cập nhật chỉ mục...'
        
        # ── Step 4: Generate recommendations ──
        from ecosystem_bridge import generate_proactive_recommendations
        exec_analysis, next_searches, next_images = generate_proactive_recommendations(result, user_intent)
        
        task['result'] = result
        task['analysis'] = exec_analysis
        task['next_searches'] = next_searches
        task['next_images'] = next_images
        task['progress'] = 100
        task['step'] = 'save'
        task['status'] = 'done'
        task['message'] = 'Cào dữ liệu hoàn tất thành công!'
        task['done'] = True
        
    except Exception as e:
        task['progress'] = 100
        task['step'] = 'error'
        task['status'] = 'error'
        task['message'] = str(e)
        task['error'] = str(e)
        task['done'] = True

@socketio.on('connect')
def handle_connect():
    emit('status', {'connected': True})

@socketio.on('disconnect')
def handle_disconnect():
    print('Client disconnected')

# ─────────────────────────────────────────────────────────
#  ROUTES
# ─────────────────────────────────────────────────────────

@app.route('/')
def index():
    """Dashboard chính."""
    data = load_index()
    # Deduplicate on every load to auto-clean
    data = deduplicate_index(data)
    feed = flatten_feed(data)
    return render_template('index.html', feed=feed)

@app.route('/crawl', methods=['POST'])
def crawl():
    """Khởi tạo crawl pipeline mới."""
    # Support both JSON and form-data
    if request.is_json:
        url = request.json.get('url', '').strip()
        intent = request.json.get('intent', '').strip()
    else:
        url = request.form.get('url', '').strip()
        intent = request.form.get('intent', '').strip()
    
    if not url:
        return jsonify({'error': 'Vui lòng nhập URL'}), 400
        
    # Smart URL Pre-processor
    if not url.startswith(('http://', 'https://')):
        url = 'https://' + url
    
    task_id = str(uuid.uuid4())[:8]
    _crawl_tasks[task_id] = {
        'done': False,
        'error': None,
        'progress': 0,
        'step': 'connect',
        'status': 'active',
        'message': 'Đang chuẩn bị pipeline cào dữ liệu...',
        'result': None,
        'analysis': None,
        'next_searches': [],
        'next_images': [],
        'preview': None
    }
    
    # Start background thread
    thread = threading.Thread(
        target=_run_crawl_pipeline,
        args=(url, intent, task_id)
    )
    thread.daemon = True
    thread.start()
    
    return jsonify({'id': task_id, 'task_id': task_id, 'status': 'started'})

@app.route('/crawl/status/<task_id>')
def crawl_status(task_id):
    """Polling endpoint for crawl progress."""
    task = get_task_status(task_id)
    # Normalize for frontend: add 'status' field
    resp = dict(task)
    if resp.get('done'):
        if resp.get('error'):
            resp['status'] = 'error'
        else:
            resp['status'] = 'completed'
    else:
        resp['status'] = 'running'
    return jsonify(resp)

@app.route('/crawl/stream/<task_id>')
def crawl_stream(task_id):
    """Server-Sent Events stream for real-time progress."""
    def generate():
        while True:
            task = get_task_status(task_id)
            # Normalize for frontend
            resp = dict(task)
            if resp.get('done'):
                if resp.get('error'):
                    resp['status'] = 'error'
                else:
                    resp['status'] = 'completed'
            else:
                resp['status'] = 'running'
            yield f"data: {json.dumps(resp, ensure_ascii=False)}\n\n"
            if task.get('done'):
                break
            time.sleep(0.5)
    return Response(generate(), mimetype='text/event-stream')

@app.route('/ask', methods=['POST'])
def ask():
    """Query RAG engine."""
    question = request.form.get('question', '').strip()
    if not question:
        return jsonify({'error': 'Vui lòng nhập câu hỏi'}), 400
    
    try:
        from ecosystem_bridge import ask_rag_engine
        result = ask_rag_engine(question)
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/scavenger_trigger', methods=['POST'])
def scavenger_trigger():
    topic = request.json.get('topic', '').strip()
    if not topic:
        return jsonify({'error': 'No topic provided'}), 400
        
    # Generate a search URL based on the topic
    from urllib.parse import quote
    search_url = f"https://duckduckgo.com/?q={quote(topic)}"
    
    task_id = str(uuid.uuid4())[:8]
    _crawl_tasks[task_id] = {
        'done': False,
        'error': None,
        'progress': 0,
        'step': 'connect',
        'status': 'active',
        'message': f'Đang tìm kiếm dữ liệu mới cho: {topic}',
        'result': None,
        'analysis': None,
        'next_searches': [],
        'next_images': [],
        'preview': None
    }
    
    thread = threading.Thread(
        target=_run_crawl_pipeline,
        args=(search_url, topic, task_id)
    )
    thread.daemon = True
    thread.start()
    
    return jsonify({'task_id': task_id, 'status': 'started'})

@app.route('/purge', methods=['POST'])
def purge():
    try:
        from ecosystem_bridge import clean_vault
        from storage.db_manager import DBManager
        db = DBManager()
        purged = db.purge_data()
        
        # Unlink files
        for p in purged.get("images", []) + purged.get("docs", []):
            if os.path.exists(p):
                os.remove(p)
                
        # Call legacy clean just in case
        clean_vault("all")
        
        return jsonify({'status': 'success', 'message': 'Đã xóa toàn bộ DB và dọn dẹp cache'})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/item/delete', methods=['POST'])
def api_delete_item():
    """
    Xoá một item cụ thể khỏi summary_index.json và file JSON vật lý.
    Body: { "path": "đường_dẫn_tuyệt_đối_đến_file_json" }
    """
    data = request.get_json(silent=True)
    if not data or 'path' not in data:
        return jsonify({'error': 'Missing path'}), 400
    
    target_path = data['path'].strip()
    target_normalized = normalize_path(target_path)
    
    # 1. Xoá file vật lý nếu tồn tại (thử cả path gốc và path đã normalize)
    file_deleted = False
    for p in [target_path, target_normalized]:
        if p and os.path.exists(p):
            try:
                os.remove(p)
                file_deleted = True
                break
            except Exception as e:
                return jsonify({'error': f'Cannot delete file: {e}'}), 500
    
    # 2. Xoá khỏi summary_index.json — match bằng normalized path
    index = load_index()
    found = False
    for category in list(index.keys()):
        items = index[category]
        new_items = []
        for item in items:
            item_norm = normalize_path(item.get('path', ''))
            if item_norm == target_normalized:
                found = True
                # Also try to delete the physical file if not already deleted
                if not file_deleted:
                    raw_path = item.get('path', '')
                    if raw_path and os.path.exists(raw_path):
                        try:
                            os.remove(raw_path)
                            file_deleted = True
                        except:
                            pass
            else:
                new_items.append(item)
        if new_items:
            index[category] = new_items
        else:
            del index[category]
    
    if found:
        save_index(index)
    
    # 3. Xoá khỏi SQLite vault.db nếu có
    try:
        from storage.db_manager import DBManager
        db = DBManager()
        conn = sqlite3.connect(db.db_path)
        cursor = conn.cursor()
        # Try matching both the original path and normalized
        cursor.execute("DELETE FROM documents WHERE json_path = ?", (target_path,))
        if target_normalized and target_normalized != target_path:
            cursor.execute("DELETE FROM documents WHERE json_path = ?", (target_normalized,))
        conn.commit()
        conn.close()
    except Exception:
        pass  # Non-critical
    
    if file_deleted or found:
        return jsonify({'status': 'success', 'message': 'Đã xoá item thành công'})
    else:
        return jsonify({'status': 'not_found', 'message': 'Item không tồn tại trong index hoặc file'}), 404

@app.route('/api/items/delete', methods=['POST'])
def api_delete_items():
    """
    Xoá nhiều items cùng lúc.
    Body: { "paths": ["path1", "path2", ...] }
    Hoặc: { "all": true } — xoá tất cả
    """
    data = request.get_json(silent=True)
    if not data:
        return jsonify({'error': 'Missing body'}), 400
    
    # ── Mode 1: Xoá tất cả ──
    if data.get('all'):
        index = load_index()
        total = sum(len(items) for items in index.values())
        deleted_files = 0
        
        # Xoá file vật lý
        for category, items in index.items():
            for item in items:
                p = item.get('path', '')
                if p and os.path.exists(p):
                    try:
                        os.remove(p)
                        deleted_files += 1
                    except:
                        pass
        
        # Xoá index
        save_index({})
        
        # Xoá SQLite
        try:
            from storage.db_manager import DBManager
            db = DBManager()
            conn = sqlite3.connect(db.db_path)
            conn.execute("DELETE FROM documents")
            conn.commit()
            conn.close()
        except:
            pass
        
        return jsonify({
            'status': 'success',
            'message': f'Đã xoá {total} items khỏi index, {deleted_files} files vật lý'
        })
    
    # ── Mode 2: Xoá danh sách paths ──
    paths = data.get('paths', [])
    if not paths:
        return jsonify({'error': 'Missing paths or all flag'}), 400
    
    results = []
    for p in paths:
        norm = normalize_path(p)
        file_ok = False
        index_ok = False
        
        # Xoá file
        for fp in [p, norm]:
            if fp and os.path.exists(fp):
                try:
                    os.remove(fp)
                    file_ok = True
                    break
                except:
                    pass
        
        # Xoá index
        idx = load_index()
        for cat in list(idx.keys()):
            items = idx[cat]
            new_items = [it for it in items if normalize_path(it.get('path', '')) != norm]
            if len(new_items) < len(items):
                index_ok = True
            if new_items:
                idx[cat] = new_items
            else:
                del idx[cat]
        if index_ok:
            save_index(idx)
        
        results.append({
            'path': p,
            'file_deleted': file_ok,
            'index_removed': index_ok
        })
    
    return jsonify({'status': 'success', 'results': results})

@app.route('/api/preview', methods=['POST'])
def api_preview():
    """Preview URL structure before crawling."""
    url = request.json.get('url', '').strip()
    if not url:
        return jsonify({'error': 'Missing URL'}), 400
    
    try:
        from ecosystem_bridge import fetch_proposed_schema
        result = fetch_proposed_schema(url, 'ui_preview')
        
        # Ensure frontend-expected fields exist
        if not isinstance(result, dict):
            result = {}
        result.setdefault('title', url)
        result.setdefault('links_count', len(result.get('headlines', [])) if isinstance(result.get('headlines'), list) else 0)
        result.setdefault('images_count', 0)
        result.setdefault('headlines', [])
        result.setdefault('proposed_schema', result)
        
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/stats')
def api_stats():
    """Get storage statistics."""
    data = load_index()
    total = sum(len(items) for items in data.values())
    categories = list(data.keys())
    
    # Get recent items
    feed = flatten_feed(data)
    recent = feed[:5] if feed else []
    
    return jsonify({
        'total_items': total,
        'categories': categories,
        'category_count': len(categories),
        'recent_items': recent
    })

@app.route('/api/item/<path:item_path>')
def api_item(item_path):
    """Get full JSON content of a stored item."""
    # item_path is URL-encoded, decode it
    from urllib.parse import unquote
    full_path = unquote(item_path)
    
    if not os.path.exists(full_path):
        return jsonify({'error': 'Item not found'}), 404
    
    with open(full_path, 'r', encoding='utf-8') as f:
        try:
            data = json.load(f)
            return jsonify(data)
        except:
            return jsonify({'error': 'Invalid JSON'}), 500

if __name__ == '__main__':
    print("""
╔══════════════════════════════════════════════╗
║        Super Scraper Web App v2              ║
║        Listening on http://0.0.0.0:3008      ║
╚══════════════════════════════════════════════╝
    """)
    # Run with SocketIO
    socketio.run(app, host='0.0.0.0', port=3008, debug=True, use_reloader=False)
