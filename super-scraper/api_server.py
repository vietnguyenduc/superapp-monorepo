from fastapi import FastAPI, BackgroundTasks, HTTPException, Request
from fastapi.templating import Jinja2Templates
from fastapi.responses import HTMLResponse
import json
from pydantic import BaseModel
import asyncio
import os
import sys

sys.path.append(os.path.dirname(__file__))

from ecosystem_bridge import _run_asyncio_loop
from agent.rag_engine import RAGEngine

app = FastAPI(title="Super Scraper API", description="Core Scraping & Knowledge Backend")
templates = Jinja2Templates(directory="templates")

class CrawlRequest(BaseModel):
    url: str
    user_id: str = "api_user"
    user_intent: str = None
    is_admin: bool = True

class AskRequest(BaseModel):
    question: str

class DummyBot:
    """Mock telegram bot to receive messages without actual telegram"""
    def __init__(self, callback_url=None):
        self.callback_url = callback_url
        
    def send_message(self, chat_id, text, **kwargs):
        print(f"[Bot -> {chat_id}] {text}")
        
    def send_photo(self, chat_id, photo, **kwargs):
        print(f"[Bot -> {chat_id}] [Photo] {photo}")
        
    def send_document(self, chat_id, document, **kwargs):
        print(f"[Bot -> {chat_id}] [Document attached]")

@app.post("/api/crawl")
async def crawl_endpoint(req: CrawlRequest, background_tasks: BackgroundTasks):
    bot_instance = DummyBot()
    chat_id = req.user_id
    background_tasks.add_task(_run_asyncio_loop, req.url, req.user_id, bot_instance, chat_id, req.is_admin, req.user_intent)
    return {"status": "success", "message": "Crawl task queued in background."}

@app.post("/api/ask")
async def ask_endpoint(req: AskRequest):
    try:
        engine = RAGEngine()
        result = engine.ask(req.question)
        return {"status": "success", "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/", response_class=HTMLResponse)
async def serve_webapp(request: Request):
    data = {}
    index_file = os.path.join(os.path.dirname(__file__), 'storage', 'summary_index.json')
    if os.path.exists(index_file):
        try:
            with open(index_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
        except:
            pass
            
    # Flatten data for simple display
    feed = []
    for category, items in data.items():
        for item in items:
            item['category'] = category
            feed.append(item)
            
    feed.sort(key=lambda x: x.get('date', ''), reverse=True)
    return templates.TemplateResponse(request=request, name="index.html", context={"feed": feed})

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api_server:app", host="0.0.0.0", port=8000, reload=True)
