"""
provider_registry.py
====================
Unified multi-provider AI client registry.
Priority chain: Ollama (local, free) → DeepSeek (cheap) → Gemini (cloud)

Each provider exposes:
  - health_check() → bool
  - generate(prompt, system, tools_schema) → str
  - COST_PER_1M_INPUT / COST_PER_1M_OUTPUT
"""

import os
import json
import logging
import requests
import time
from pathlib import Path
from typing import Optional, List, Dict, Any, Tuple

logger = logging.getLogger("ATA.provider_registry")

# ─────────────────────────────────────────────
# Provider: Ollama Local
# ─────────────────────────────────────────────
class OllamaProvider:
    NAME = "ollama"
    COST_PER_1M_INPUT = 0.0
    COST_PER_1M_OUTPUT = 0.0
    PRIORITY = 1  # Try first

    def __init__(self):
        self.base_url = os.environ.get("FALLBACK_API_BASE", "http://127.0.0.1:11434/v1").rstrip("/v1").rstrip("/")
        self.model = os.environ.get("FALLBACK_MODEL_NAME", "qwen3:8b")
        self._healthy: Optional[bool] = None
        self._last_check: float = 0

    def health_check(self) -> bool:
        """Cached 30s health check."""
        now = time.time()
        if now - self._last_check < 30 and self._healthy is not None:
            return self._healthy
        try:
            r = requests.get(f"{self.base_url}/api/tags", timeout=3)
            self._healthy = r.status_code == 200
        except Exception:
            self._healthy = False
        self._last_check = now
        return self._healthy

    def list_models(self) -> List[str]:
        try:
            r = requests.get(f"{self.base_url}/api/tags", timeout=3)
            if r.status_code == 200:
                return [m["name"] for m in r.json().get("models", [])]
        except Exception:
            pass
        return []

    def generate(self, prompt: str, system: str = None, tools_schema: list = None) -> str:
        """Call Ollama /api/chat endpoint (OpenAI-compatible)."""
        messages = []
        if system:
            messages.append({"role": "system", "content": system})
        messages.append({"role": "user", "content": prompt})

        payload: Dict[str, Any] = {
            "model": self.model,
            "messages": messages,
            "stream": False,
            "options": {"temperature": 0.2},
        }
        if tools_schema:
            payload["tools"] = tools_schema

        r = requests.post(f"{self.base_url}/api/chat", json=payload, timeout=25)
        r.raise_for_status()
        data = r.json()
        return data.get("message", {}).get("content", "")

    def generate_with_tools(self, messages: list, tools_schema: list) -> dict:
        """Full chat/tools turn, returns raw message object."""
        payload = {
            "model": self.model,
            "messages": messages,
            "stream": False,
            "options": {"temperature": 0.1},
        }
        if tools_schema:
            payload["tools"] = tools_schema
        r = requests.post(f"{self.base_url}/api/chat", json=payload, timeout=25)
        r.raise_for_status()
        return r.json().get("message", {})


# ─────────────────────────────────────────────
# Provider: DeepSeek (OpenAI-compatible)
# ─────────────────────────────────────────────
class DeepSeekProvider:
    NAME = "deepseek"
    COST_PER_1M_INPUT = 0.14   # deepseek-chat / v4-flash
    COST_PER_1M_OUTPUT = 0.28
    PRIORITY = 2
    # NOTE: DeepSeek API enables Context Caching by default (disk-based).
    # No explicit 'cache_control' parameters are needed.

    def __init__(self):
        self.api_key = os.environ.get("DEEPSEEK_API_KEY", "")
        self.base_url = os.environ.get("DEEPSEEK_BASE_URL", "https://api.deepseek.com")
        self.model = os.environ.get("DEEPSEEK_MODEL", "deepseek-chat")
        self._healthy: Optional[bool] = None
        self._last_check: float = 0

    def health_check(self) -> bool:
        if not self.api_key:
            return False
        now = time.time()
        cache_ttl = 60 if self._healthy else 5
        if now - self._last_check < cache_ttl and self._healthy is not None:
            return self._healthy
        try:
            headers = {"Authorization": f"Bearer {self.api_key}"}
            r = requests.get(f"{self.base_url}/models", headers=headers, timeout=5)
            self._healthy = r.status_code in (200, 401)  # 401 = key valid but unauth — API is up
            self._healthy = r.status_code == 200
        except Exception:
            self._healthy = False
        self._last_check = now
        return self._healthy

    def generate(self, prompt: str, system: str = None, tools_schema: list = None) -> str:
        messages = []
        if system:
            messages.append({"role": "system", "content": system})
        messages.append({"role": "user", "content": prompt})

        payload: Dict[str, Any] = {
            "model": self.model,
            "messages": messages,
            "temperature": 0.2,
        }
        if tools_schema:
            payload["tools"] = tools_schema

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        r = requests.post(
            f"{self.base_url}/chat/completions",
            json=payload,
            headers=headers,
            timeout=90,
        )
        r.raise_for_status()
        data = r.json()
        return data["choices"][0]["message"]["content"] or ""

    def generate_with_tools(self, messages: list, tools_schema: list) -> dict:
        """Full chat/tools turn, returns raw message object (OpenAI format)."""
        payload = {
            "model": self.model,
            "messages": messages,
            "temperature": 0.1,
        }
        if tools_schema:
            payload["tools"] = tools_schema
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        r = requests.post(
            f"{self.base_url}/chat/completions",
            json=payload,
            headers=headers,
            timeout=90,
        )
        r.raise_for_status()
        return r.json()["choices"][0]["message"]


# ─────────────────────────────────────────────
# Provider: Nvidia (OpenAI-compatible)
# ─────────────────────────────────────────────
class NvidiaProvider:
    NAME = "nvidia"
    COST_PER_1M_INPUT = 0.50
    COST_PER_1M_OUTPUT = 1.00
    PRIORITY = 2.5

    def __init__(self):
        self.api_key = os.environ.get("NVIDIA_API_KEY", "")
        self.base_url = os.environ.get("NVIDIA_BASE_URL", "https://integrate.api.nvidia.com/v1")
        self.model = os.environ.get("NVIDIA_MODEL", "meta/llama-3.1-405b-instruct")
        self._healthy: Optional[bool] = None
        self._last_check: float = 0

    def health_check(self) -> bool:
        if not self.api_key:
            return False
        now = time.time()
        # Only cache True for 60s. If False, only cache for 5s to allow quick recovery.
        cache_ttl = 60 if self._healthy else 5
        if now - self._last_check < cache_ttl and self._healthy is not None:
            return self._healthy
        try:
            headers = {"Authorization": f"Bearer {self.api_key}"}
            r = requests.get(f"{self.base_url}/models", headers=headers, timeout=5)
            self._healthy = r.status_code in (200, 401)
            self._healthy = r.status_code == 200
        except Exception:
            self._healthy = False
        self._last_check = now
        return self._healthy

    def generate(self, prompt: str, system: str = None, tools_schema: list = None) -> str:
        messages = []
        if system:
            messages.append({"role": "system", "content": system})
        messages.append({"role": "user", "content": prompt})

        payload: Dict[str, Any] = {
            "model": self.model,
            "messages": messages,
            "temperature": 0.2,
            "max_tokens": 1024,
        }
        if tools_schema:
            payload["tools"] = tools_schema

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        r = requests.post(
            f"{self.base_url}/chat/completions",
            json=payload,
            headers=headers,
            timeout=90,
        )
        r.raise_for_status()
        data = r.json()
        return data["choices"][0]["message"]["content"] or ""

    def generate_with_tools(self, messages: list, tools_schema: list) -> dict:
        payload = {
            "model": self.model,
            "messages": messages,
            "temperature": 0.1,
            "max_tokens": 1024,
        }
        if tools_schema:
            payload["tools"] = tools_schema
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        r = requests.post(
            f"{self.base_url}/chat/completions",
            json=payload,
            headers=headers,
            timeout=90,
        )
        r.raise_for_status()
        return r.json()["choices"][0]["message"]


# ─────────────────────────────────────────────
# Provider: Gemini (Google GenAI SDK)
# ─────────────────────────────────────────────
class GeminiProvider:
    NAME = "gemini"
    COST_PER_1M_INPUT = 0.0    # Pro tier included in subscription
    COST_PER_1M_OUTPUT = 0.0
    PRIORITY = 3

    def __init__(self):
        self.api_key = os.environ.get("GEMINI_API_KEY", "")
        self.model = "gemini-2.5-flash"
        self._healthy: Optional[bool] = None
        self._client = None

    def _get_client(self):
        if not self._client and self.api_key:
            from google import genai
            self._client = genai.Client(api_key=self.api_key)
        return self._client

    def health_check(self) -> bool:
        return bool(self.api_key)

    def generate(self, prompt: str, system: str = None, tools_schema: list = None) -> str:
        from google.genai import types
        client = self._get_client()
        if not client:
            raise ValueError("No Gemini API key configured.")

        config = types.GenerateContentConfig(
            system_instruction=system,
            temperature=0.2,
        )
        response = client.models.generate_content(
            model=self.model,
            contents=prompt,
            config=config,
        )
        return response.text or ""


# ─────────────────────────────────────────────
# Anthropic Claude Helper Translation Functions
# ─────────────────────────────────────────────
def _translate_tools_to_anthropic(tools_schema: list) -> list:
    """Translates OpenAI function tools schema to Anthropic tools schema."""
    anthropic_tools = []
    for tool in tools_schema:
        func = tool.get("function", {})
        anthropic_tools.append({
            "name": func.get("name"),
            "description": func.get("description"),
            "input_schema": func.get("parameters", {"type": "object", "properties": {}})
        })
    return anthropic_tools


def _translate_messages_to_anthropic(messages: list) -> Tuple[Optional[str], list]:
    """Translates OpenAI chat messages format to Anthropic messages format."""
    system_prompt = None
    anthropic_msgs = []
    
    for msg in messages:
        role = msg.get("role")
        content = msg.get("content") or ""
        
        if role == "system":
            system_prompt = content
            continue
            
        if role == "user":
            anthropic_msgs.append({
                "role": "user",
                "content": content
            })
        elif role == "assistant":
            tool_calls = msg.get("tool_calls") or []
            if tool_calls:
                content_blocks = []
                if content:
                    content_blocks.append({"type": "text", "text": content})
                for call in tool_calls:
                    func = call.get("function", {})
                    args = func.get("arguments", "{}")
                    if isinstance(args, str):
                        try:
                            args_dict = json.loads(args)
                        except Exception:
                            args_dict = {}
                    else:
                        args_dict = args
                    content_blocks.append({
                        "type": "tool_use",
                        "id": call.get("id"),
                        "name": func.get("name"),
                        "input": args_dict
                    })
                anthropic_msgs.append({
                    "role": "assistant",
                    "content": content_blocks
                })
            else:
                anthropic_msgs.append({
                    "role": "assistant",
                    "content": content
                })
        elif role == "tool":
            tool_call_id = msg.get("tool_call_id") or "call_0"
            anthropic_msgs.append({
                "role": "user",
                "content": [
                    {
                        "type": "tool_result",
                        "tool_use_id": tool_call_id,
                        "content": str(content)
                    }
                ]
            })
            
    return system_prompt, anthropic_msgs


def _merge_consecutive_roles(anthropic_msgs: list) -> list:
    """Merges consecutive messages of the same role to satisfy Anthropic API constraints."""
    merged = []
    for msg in anthropic_msgs:
        if not merged:
            merged.append(msg)
            continue
        
        last = merged[-1]
        if last["role"] == msg["role"]:
            last_content = last["content"]
            new_content = msg["content"]
            
            if isinstance(last_content, str) and isinstance(new_content, str):
                last["content"] = last_content + "\n\n" + new_content
            else:
                if isinstance(last_content, str):
                    last_blocks = [{"type": "text", "text": last_content}]
                else:
                    last_blocks = list(last_content)
                    
                if isinstance(new_content, str):
                    new_blocks = [{"type": "text", "text": new_content}]
                else:
                    new_blocks = new_content
                    
                last["content"] = last_blocks + new_blocks
        else:
            merged.append(msg)
    return merged


# ─────────────────────────────────────────────
# Provider: Claude (Anthropic API via requests)
# ─────────────────────────────────────────────
class ClaudeProvider:
    NAME = "claude"
    COST_PER_1M_INPUT = 3.00   # Claude 3.5 Sonnet
    COST_PER_1M_OUTPUT = 15.00
    PRIORITY = 4

    def __init__(self):
        self.api_key = os.environ.get("ANTHROPIC_API_KEY", "")
        self.model = os.environ.get("ANTHROPIC_MODEL", "claude-3-5-sonnet-20241022")
        self._healthy: Optional[bool] = None
        self._last_check: float = 0

    def health_check(self) -> bool:
        """Simple API key health check."""
        return bool(self.api_key)

    def generate(self, prompt: str, system: str = None, tools_schema: list = None) -> str:
        messages = [{"role": "user", "content": prompt}]
        msg_obj = self.generate_with_tools(messages, tools_schema, system=system)
        return msg_obj.get("content", "")

    def generate_with_tools(self, messages: list, tools_schema: list, system: str = None) -> dict:
        if not self.api_key:
            raise ValueError("No ANTHROPIC_API_KEY configured.")

        # 1. Translate system prompt and messages
        extracted_system, anthropic_msgs = _translate_messages_to_anthropic(messages)
        system_to_use = system or extracted_system
        
        # 2. Merge consecutive roles to satisfy Anthropic constraints
        anthropic_msgs = _merge_consecutive_roles(anthropic_msgs)

        # 3. Translate tools
        anthropic_tools = None
        if tools_schema:
            anthropic_tools = _translate_tools_to_anthropic(tools_schema)

        # 4. Build payload
        payload = {
            "model": self.model,
            "max_tokens": 4000,
            "messages": anthropic_msgs,
            "temperature": 0.1
        }
        if system_to_use:
            payload["system"] = [
                {
                    "type": "text",
                    "text": system_to_use,
                    "cache_control": {"type": "ephemeral"}
                }
            ]
        if anthropic_tools:
            # Also cache the last tool (or tools list) if there are many tools
            if len(anthropic_tools) > 0:
                anthropic_tools[-1]["cache_control"] = {"type": "ephemeral"}
            payload["tools"] = anthropic_tools

        headers = {
            "x-api-key": self.api_key,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
            "anthropic-beta": "prompt-caching-2024-07-31",
        }

        r = requests.post(
            "https://api.anthropic.com/v1/messages",
            json=payload,
            headers=headers,
            timeout=90,
        )
        r.raise_for_status()
        res_data = r.json()

        # 5. Translate response back to OpenAI format
        content_text = ""
        tool_calls = []
        
        for block in res_data.get("content", []):
            if block.get("type") == "text":
                content_text += block.get("text", "")
            elif block.get("type") == "tool_use":
                tool_calls.append({
                    "id": block.get("id"),
                    "type": "function",
                    "function": {
                        "name": block.get("name"),
                        "arguments": json.dumps(block.get("input", {}))
                    }
                })

        response_msg = {
            "role": "assistant",
            "content": content_text
        }
        if tool_calls:
            response_msg["tool_calls"] = tool_calls

        return response_msg


# ─────────────────────────────────────────────
# Provider: Gemini Pro (Google GenAI SDK)
# ─────────────────────────────────────────────
class GeminiProProvider:
    NAME = "geminipro"
    COST_PER_1M_INPUT = 0.0    # Included in user's Pro/Advanced subscription
    COST_PER_1M_OUTPUT = 0.0
    PRIORITY = 3.5

    def __init__(self):
        self.api_key = os.environ.get("GEMINI_API_KEY", "")
        self.model = "gemini-2.5-pro"
        self._client = None

    def _get_client(self):
        if not self._client and self.api_key:
            from google import genai
            self._client = genai.Client(api_key=self.api_key)
        return self._client

    def health_check(self) -> bool:
        return bool(self.api_key)

    def generate(self, prompt: str, system: str = None, tools_schema: list = None) -> str:
        from google.genai import types
        client = self._get_client()
        if not client:
            raise ValueError("No Gemini API key configured.")

        config = types.GenerateContentConfig(
            system_instruction=system,
            temperature=0.2,
        )
        response = client.models.generate_content(
            model=self.model,
            contents=prompt,
            config=config,
        )
        return response.text or ""


# ─────────────────────────────────────────────
# Provider: DeepSeek R1 (Reasoner)
# ─────────────────────────────────────────────
class DeepSeekR1Provider:
    NAME = "deepseek-r1"
    COST_PER_1M_INPUT = 0.55
    COST_PER_1M_OUTPUT = 2.19
    PRIORITY = 5

    def __init__(self):
        self.api_key = os.environ.get("DEEPSEEK_API_KEY", "")
        self.base_url = os.environ.get("DEEPSEEK_BASE_URL", "https://api.deepseek.com")
        self.model = "deepseek-reasoner"

    def health_check(self) -> bool:
        return bool(self.api_key)

    def generate(self, prompt: str, system: str = None, tools_schema: list = None) -> str:
        messages = []
        if system:
            messages.append({"role": "system", "content": system})
        messages.append({"role": "user", "content": prompt})

        payload: Dict[str, Any] = {
            "model": self.model,
            "messages": messages,
        }

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        r = requests.post(
            f"{self.base_url}/chat/completions",
            json=payload,
            headers=headers,
            timeout=120,
        )
        r.raise_for_status()
        data = r.json()
        return data["choices"][0]["message"]["content"] or ""

    def generate_with_tools(self, messages: list, tools_schema: list) -> dict:
        """
        DeepSeek R1 does not support tool calling API. 
        We intercept and fallback to a plain generate response.
        """
        # Convert messages to extract user prompt
        prompt = messages[-1].get("content", "")
        # Get system prompt
        system = next((m.get("content") for m in messages if m.get("role") == "system"), None)
        
        reply = self.generate(prompt, system=system)
        return {"role": "assistant", "content": reply}


# ─────────────────────────────────────────────
# Registry — single source of truth
# ─────────────────────────────────────────────
class ProviderRegistry:
    """
    Manages all AI providers with lazy health checks.
    Call get_provider(task_type) to get the best available provider.
    """

    def __init__(self):
        self.ollama = OllamaProvider()
        self.deepseek = DeepSeekProvider()
        self.nvidia = NvidiaProvider()
        self.deepseek_r1 = DeepSeekR1Provider()
        self.gemini = GeminiProvider()
        self.geminipro = GeminiProProvider()
        self.claude = ClaudeProvider()
        # Ordered by priority (cheapest/local first)
        self._chain = [self.ollama, self.deepseek, self.nvidia, self.deepseek_r1, self.gemini, self.geminipro, self.claude]

    def get_provider_by_name(self, name: str):
        name_map = {
            "ollama": self.ollama,
            "deepseek": self.deepseek,
            "nvidia": self.nvidia,
            "deepseek_r1": self.deepseek_r1,
            "gemini": self.gemini,
            "geminipro": self.geminipro,
            "claude": self.claude,
        }
        return name_map.get(name.lower().replace("-", "_"))

    def get_best_provider(self, task_type: str = "medium"):
        import core.settings as settings
        s = settings.load_settings()
        fallback_order = s.get("fallback_order", ["deepseek", "gemini", "claude", "nvidia"])
        
        ordered = []
        for p_name in fallback_order:
            provider = self.get_provider_by_name(p_name)
            if provider:
                ordered.append(provider)
                
        # If nothing in settings or all invalid, use default
        if not ordered:
            ordered = [self.deepseek, self.gemini, self.claude]

        for provider in ordered:
            if provider.health_check():
                logger.info(f"[ProviderRegistry] Selected: {provider.NAME} for task_type={task_type}")
                return provider

        raise RuntimeError("All AI providers are offline or misconfigured.")

    def health_status(self) -> Dict[str, bool]:
        return {
            "ollama": self.ollama.health_check(),
            "deepseek": self.deepseek.health_check(),
            "nvidia": self.nvidia.health_check(),
            "deepseek-r1": self.deepseek_r1.health_check(),
            "gemini": self.gemini.health_check(),
            "geminipro": self.geminipro.health_check(),
            "claude": self.claude.health_check(),
        }

    def ollama_models(self) -> List[str]:
        return self.ollama.list_models()


# Module-level singleton
_registry: Optional[ProviderRegistry] = None

def get_registry() -> ProviderRegistry:
    global _registry
    if _registry is None:
        _registry = ProviderRegistry()
    return _registry
