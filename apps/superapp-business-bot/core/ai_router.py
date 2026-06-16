import os
import json
import time
import logging
from pathlib import Path
from openai import OpenAI

logger = logging.getLogger("ATA.ai_router")

# Load settings
SETTINGS_PATH = Path(__file__).parent.parent / "config" / "settings.json"
def load_settings():
    if SETTINGS_PATH.exists():
        try:
            return json.loads(SETTINGS_PATH.read_text(encoding="utf-8"))
        except Exception as e:
            logger.error(f"Error reading settings: {e}")
    return {}

settings = load_settings()

# Provider configuration: DeepSeek (primary) -> Nvidia (fallback)
DEEPSEEK_BASE_URL = os.environ.get("DEEPSEEK_BASE_URL", "https://api.deepseek.com")
DEEPSEEK_MODEL = os.environ.get("DEEPSEEK_MODEL", "deepseek-chat")
NVIDIA_BASE_URL = os.environ.get("NVIDIA_BASE_URL", "https://integrate.api.nvidia.com/v1")
NVIDIA_MODEL = os.environ.get("NVIDIA_MODEL", "meta/llama-3.1-70b-instruct")

# Retry / backoff settings: 3 attempts with delays 2s, 4s, 8s before switching provider.
MAX_RETRIES = 3
RETRY_DELAYS = [2, 4, 8]


def _build_messages(prompt: str, system_prompt: str = None):
    messages = []
    if system_prompt:
        messages.append({"role": "system", "content": system_prompt})
    messages.append({"role": "user", "content": prompt})
    return messages


def _query(client: OpenAI, model: str, prompt: str, system_prompt: str = None) -> str:
    """Single OpenAI-compatible chat completion with retry + exponential backoff."""
    last_error = None
    for attempt in range(MAX_RETRIES):
        try:
            response = client.chat.completions.create(
                model=model,
                messages=_build_messages(prompt, system_prompt),
                temperature=0.2,
            )
            return response.choices[0].message.content or ""
        except Exception as e:
            last_error = e
            logger.warning(f"{model} attempt {attempt + 1}/{MAX_RETRIES} failed: {e}")
            if attempt < MAX_RETRIES - 1:
                time.sleep(RETRY_DELAYS[attempt])
    raise last_error


def query_deepseek(prompt: str, system_prompt: str = None) -> str:
    """Queries the DeepSeek API (primary provider)."""
    api_key = os.environ.get("DEEPSEEK_API_KEY")
    if not api_key:
        raise ValueError("DEEPSEEK_API_KEY environment variable is not set.")
    client = OpenAI(base_url=DEEPSEEK_BASE_URL, api_key=api_key)
    return _query(client, DEEPSEEK_MODEL, prompt, system_prompt)


def query_nvidia(prompt: str, system_prompt: str = None) -> str:
    """Queries the Nvidia API (fallback provider)."""
    api_key = os.environ.get("NVIDIA_API_KEY")
    if not api_key:
        raise ValueError("NVIDIA_API_KEY environment variable is not set.")
    client = OpenAI(base_url=NVIDIA_BASE_URL, api_key=api_key)
    return _query(client, NVIDIA_MODEL, prompt, system_prompt)


def query_ai(prompt: str, system_prompt: str = None) -> str:
    """Queries DeepSeek first, automatically falling back to Nvidia on failure."""
    try:
        return query_deepseek(prompt, system_prompt)
    except Exception as e:
        logger.warning(f"DeepSeek failed, switching to Nvidia fallback: {e}")
        return query_nvidia(prompt, system_prompt)


def route_prompt(prompt: str, context: str = "") -> dict:
    """
    Decides complexity, target paths, and routing using DeepSeek (with Nvidia fallback).
    Returns:
    {
       "complexity": "low" | "medium" | "high",
       "target_paths": list,
       "requires_cloud": bool,
       "reasoning": str,
       "routing_engine": "DeepSeek" | "Nvidia"
    }
    """
    router_sys = (
        "You are the Vibe Gate Router. Analyze the user request and codebase context.\n"
        "Assess task complexity and output a JSON object containing:\n"
        "{\n"
        "  \"complexity\": \"low\" | \"medium\" | \"high\",\n"
        "  \"target_paths\": [list of files that might need edits or reads],\n"
        "  \"requires_cloud\": boolean (set to true if task requires deep structural reasoning, large context window, or complex external APIs),\n"
        "  \"reasoning\": \"brief reasoning string\"\n"
        "}\n"
        "DO NOT output anything other than raw JSON."
    )

    full_prompt = f"Context:\n{context}\n\nTask: {prompt}"

    engine = "DeepSeek"
    response_text = ""
    try:
        response_text = query_deepseek(full_prompt, system_prompt=router_sys)
    except Exception as e:
        logger.warning(f"DeepSeek routing failed, switching to Nvidia fallback: {e}")
        engine = "Nvidia"
        try:
            response_text = query_nvidia(full_prompt, system_prompt=router_sys)
        except Exception as ex:
            logger.error(f"Failed to route using Nvidia fallback: {ex}")
            return {
                "complexity": "medium",
                "target_paths": [],
                "requires_cloud": True,
                "reasoning": f"Routing failed, defaulted to cloud execution: {str(ex)}",
                "routing_engine": "Nvidia (Defaulted)",
            }

    # Clean JSON markers if present
    cleaned = response_text.strip()
    if cleaned.startswith("```json"):
        cleaned = cleaned[7:]
    if cleaned.endswith("```"):
        cleaned = cleaned[:-3]
    cleaned = cleaned.strip()

    try:
        parsed = json.loads(cleaned)
        parsed["routing_engine"] = engine
        return parsed
    except Exception as e:
        logger.error(f"Failed to parse router output JSON: {cleaned}. Error: {e}")
        return {
            "complexity": "low",
            "target_paths": [],
            "requires_cloud": engine == "Nvidia",
            "reasoning": f"JSON parsing failed. Raw response: {response_text[:100]}",
            "routing_engine": engine,
        }
