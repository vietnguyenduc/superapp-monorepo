"""
Insforge Model Gateway - OpenRouter Proxy with Routing Logic

Routes requests to different LLM providers based on task type:
- code_generation -> deepseek-r1
- quick_answer -> gpt-4o-mini
- vision -> claude-3.5-sonnet
- cheap_batch -> qwen-2.5-coder
- default -> openrouter/auto
"""

import os
import json
import logging
from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import StreamingResponse
import httpx

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("insforge-gateway")

app = FastAPI(title="Insforge Model Gateway", version="1.0.0")

OPENROUTER_API_KEY = os.environ.get("OPENROUTER_API_KEY", "")
OPENROUTER_BASE = "https://openrouter.ai/api/v1"
DEEPSEEK_API_KEY = os.environ.get("DEEPSEEK_API_KEY", "")
DEEPSEEK_BASE = "https://api.deepseek.com"

ROUTING_TABLE = {
    "code_generation": "deepseek/deepseek-r1",
    "quick_answer": "openai/gpt-4o-mini",
    "vision": "anthropic/claude-3.5-sonnet",
    "cheap_batch": "qwen/qwen-2.5-coder-32b-instruct",
    "architect": "deepseek/deepseek-r1",
    "debug": "qwen/qwen-2.5-coder-32b-instruct",
    "default": "openrouter/auto",
}


def resolve_model(model: str) -> str:
    if not model or model == "auto":
        return ROUTING_TABLE["default"]
    if model in ROUTING_TABLE:
        return ROUTING_TABLE[model]
    return model


def get_provider_config(model: str) -> dict:
    if model.startswith("deepseek/") and DEEPSEEK_API_KEY:
        return {
            "base_url": DEEPSEEK_BASE,
            "api_key": DEEPSEEK_API_KEY,
            "model": model.replace("deepseek/", ""),
        }
    return {
        "base_url": OPENROUTER_BASE,
        "api_key": OPENROUTER_API_KEY,
        "model": model,
    }


@app.get("/")
async def root():
    return {"status": "ok", "service": "insforge-gateway", "version": "1.0.0"}


@app.get("/v1/models")
async def list_models():
    return {
        "object": "list",
        "data": [
            {"id": k, "object": "model", "owned_by": "insforge"}
            for k in ROUTING_TABLE.keys()
        ]
        + [{"id": "openrouter/auto", "object": "model", "owned_by": "openrouter"},
           {"id": "deepseek/deepseek-chat", "object": "model", "owned_by": "deepseek"},
           {"id": "deepseek/deepseek-r1", "object": "model", "owned_by": "deepseek"}],
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
    if provider["base_url"] == OPENROUTER_BASE:
        headers["HTTP-Referer"] = "https://insforge.local"
        headers["X-Title"] = "Insforge Gateway"

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
