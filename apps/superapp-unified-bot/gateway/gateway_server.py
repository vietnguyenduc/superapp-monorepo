"""
Insforge Model Gateway - DeepSeek Proxy with Routing Logic

Routes requests to DeepSeek models based on task type:
- code_generation -> deepseek-reasoner (R1, strong reasoning)
- quick_answer -> deepseek-chat (fast, cheap)
- vision -> deepseek-chat (DeepSeek has no vision model; fallback)
- cheap_batch -> deepseek-chat
- architect -> deepseek-reasoner
- debug -> deepseek-chat
- default -> deepseek-chat

OpenRouter removed — DeepSeek-only as per user decision (2026-07).
"""

import os
import json
import logging
from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import StreamingResponse
import httpx

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("insforge-gateway")

app = FastAPI(title="Insforge Model Gateway", version="2.0.0")

DEEPSEEK_API_KEY = os.environ.get("DEEPSEEK_API_KEY", "")
DEEPSEEK_BASE = os.environ.get("DEEPSEEK_BASE", "https://api.deepseek.com")

# Routing table — DeepSeek only (OpenRouter removed)
ROUTING_TABLE = {
    "code_generation": "deepseek-reasoner",
    "quick_answer": "deepseek-chat",
    "vision": "deepseek-chat",
    "cheap_batch": "deepseek-chat",
    "architect": "deepseek-reasoner",
    "debug": "deepseek-chat",
    "default": "deepseek-chat",
}


def resolve_model(model: str) -> str:
    if not model or model == "auto":
        return ROUTING_TABLE["default"]
    if model in ROUTING_TABLE:
        return ROUTING_TABLE[model]
    return model


def get_provider_config(model: str) -> dict:
    # All models route to DeepSeek now
    return {
        "base_url": DEEPSEEK_BASE,
        "api_key": DEEPSEEK_API_KEY,
        "model": model,
    }


@app.get("/")
async def root():
    return {"status": "ok", "service": "insforge-gateway", "version": "2.0.0"}


@app.get("/health")
async def health():
    if not DEEPSEEK_API_KEY:
        return {"status": "unhealthy", "error": "DEEPSEEK_API_KEY not set"}
    return {"status": "healthy", "provider": "deepseek"}


@app.get("/v1/models")
async def list_models():
    return {
        "object": "list",
        "data": [
            {"id": k, "object": "model", "owned_by": "insforge"}
            for k in ROUTING_TABLE.keys()
        ]
        + [{"id": "deepseek-chat", "object": "model", "owned_by": "deepseek"},
           {"id": "deepseek-reasoner", "object": "model", "owned_by": "deepseek"}],
    }


@app.post("/v1/chat/completions")
async def chat_completions(request: Request):
    body = await request.json()
    model = resolve_model(body.get("model", "auto"))
    provider = get_provider_config(model)

    if not provider["api_key"]:
        raise HTTPException(status_code=500, detail=f"No API key for model: {model}")

    payload = {**body, "model": provider["model"]}
    headers = {
        "Authorization": f"Bearer {provider['api_key']}",
        "Content-Type": "application/json",
    }

    stream = body.get("stream", False)

    if stream:
        async def stream_generator():
            async with httpx.AsyncClient(timeout=120) as client:
                async with client.stream(
                    "POST",
                    f"{provider['base_url']}/chat/completions",
                    json=payload,
                    headers=headers,
                ) as response:
                    async for chunk in response.aiter_bytes():
                        yield chunk
        return StreamingResponse(stream_generator(), media_type="text/event-stream")
    else:
        async with httpx.AsyncClient(timeout=120) as client:
            response = await client.post(
                f"{provider['base_url']}/chat/completions",
                json=payload,
                headers=headers,
            )
            return response.json()


@app.post("/v1/route")
async def route_info(request: Request):
    body = await request.json()
    model = body.get("model", "auto")
    resolved = resolve_model(model)
    provider = get_provider_config(resolved)
    return {
        "requested": model,
        "resolved": resolved,
        "provider": provider["base_url"],
    }
