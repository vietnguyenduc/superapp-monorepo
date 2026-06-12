import os
import json
import requests
import logging
from pathlib import Path
from google import genai
from google.genai import types

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
OLLAMA_URL = settings.get("ollama", {}).get("url", "http://localhost:11434")
OLLAMA_MODEL = settings.get("ollama", {}).get("primary_model", "qwen2.5-coder:7b")
OLLAMA_FALLBACK = settings.get("ollama", {}).get("fallback_model", "qwen2.5:3b")
GEMINI_MODEL = settings.get("gemini", {}).get("model", "gemini-2.5-flash")

def get_gemini_client():
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        return None
    return genai.Client(api_key=api_key)

def check_ollama_status() -> bool:
    """Checks if the local Ollama service is responsive."""
    try:
        res = requests.get(f"{OLLAMA_URL}/api/tags", timeout=3)
        return res.status_code == 200
    except Exception:
        return False

def query_ollama(prompt: str, system_prompt: str = None) -> str:
    """Queries local Ollama instance directly."""
    payload = {
        "model": OLLAMA_MODEL,
        "prompt": prompt,
        "stream": False,
        "options": {
            "temperature": 0.2
        }
    }
    if system_prompt:
        payload["system"] = system_prompt
        
    try:
        res = requests.post(f"{OLLAMA_URL}/api/generate", json=payload, timeout=60)
        if res.status_code == 200:
            return res.json().get("response", "")
    except Exception as e:
        logger.warning(f"Ollama main model failed: {e}. Trying fallback model {OLLAMA_FALLBACK}...")
        payload["model"] = OLLAMA_FALLBACK
        try:
            res = requests.post(f"{OLLAMA_URL}/api/generate", json=payload, timeout=60)
            if res.status_code == 200:
                return res.json().get("response", "")
        except Exception as ex:
            logger.error(f"Ollama fallback model also failed: {ex}")
    return ""

def query_gemini(prompt: str, system_prompt: str = None) -> str:
    """Queries Google Gemini API as fallback."""
    client = get_gemini_client()
    if not client:
        raise ValueError("GEMINI_API_KEY environment variable is not set and local Ollama is offline.")
        
    config = types.GenerateContentConfig(
        system_instruction=system_prompt,
        temperature=0.2
    )
    
    response = client.models.generate_content(
        model=GEMINI_MODEL,
        contents=prompt,
        config=config
    )
    return response.text

def route_prompt(prompt: str, context: str = "") -> dict:
    """
    Decides complexity, paths, and routes between local Ollama and Cloud Gemini.
    Returns:
    {
       "complexity": "low" | "medium" | "high",
       "target_paths": list,
       "requires_cloud": bool,
       "reasoning": str,
       "routing_engine": "Ollama" | "Gemini"
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
    
    # Try Ollama first if active
    engine = "Ollama"
    response_text = ""
    if check_ollama_status():
        try:
            response_text = query_ollama(full_prompt, system_prompt=router_sys)
        except Exception:
            pass
            
    if not response_text:
        # Fallback to Gemini
        engine = "Gemini"
        try:
            response_text = query_gemini(full_prompt, system_prompt=router_sys)
        except Exception as e:
            logger.error(f"Failed to route using Gemini: {e}")
            return {
                "complexity": "medium",
                "target_paths": [],
                "requires_cloud": True,
                "reasoning": f"Routing failed, defaulted to cloud execution: {str(e)}",
                "routing_engine": "Gemini (Defaulted)"
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
            "requires_cloud": engine == "Gemini",
            "reasoning": f"JSON parsing failed. Raw response: {response_text[:100]}",
            "routing_engine": engine
        }
