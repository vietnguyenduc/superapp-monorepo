import os
import json
import time
import logging
from pathlib import Path
from typing import List, Dict, Any, Optional, Tuple
from openai import OpenAI
import tools

logger = logging.getLogger(__name__)

# Provider configuration: DeepSeek (primary) -> Nvidia (fallback)
DEEPSEEK_BASE_URL = os.environ.get("DEEPSEEK_BASE_URL", "https://api.deepseek.com")
DEEPSEEK_MODEL = os.environ.get("DEEPSEEK_MODEL", "deepseek-chat")
NVIDIA_BASE_URL = os.environ.get("NVIDIA_BASE_URL", "https://integrate.api.nvidia.com/v1")
NVIDIA_MODEL = os.environ.get("NVIDIA_MODEL", "meta/llama-3.1-405b-instruct")

# Retry / backoff settings: 3 attempts with delays 2s, 4s, 8s before switching provider.
MAX_RETRIES = 3
RETRY_DELAYS = [2, 4, 8]

# OpenAI-compatible tool calling schema (supported by both DeepSeek and Nvidia).
TOOL_SCHEMAS = [
    {
        "type": "function",
        "function": {
            "name": "execute_command",
            "description": "Execute a PowerShell command in the active workspace and return its output.",
            "parameters": {
                "type": "object",
                "properties": {
                    "command": {"type": "string", "description": "The command to execute."}
                },
                "required": ["command"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "read_file",
            "description": "Read a file. Supports workspace-relative or monorepo-root-relative paths.",
            "parameters": {
                "type": "object",
                "properties": {
                    "filepath": {"type": "string", "description": "Path to the file to read."}
                },
                "required": ["filepath"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "write_file",
            "description": "Write content to a file. Supports workspace-relative or monorepo-root-relative paths.",
            "parameters": {
                "type": "object",
                "properties": {
                    "filepath": {"type": "string", "description": "Path to the file to write."},
                    "content": {"type": "string", "description": "Content to write to the file."},
                },
                "required": ["filepath", "content"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "list_directory",
            "description": "List files and directories. Supports workspace-relative or monorepo-root-relative paths.",
            "parameters": {
                "type": "object",
                "properties": {
                    "dirpath": {"type": "string", "description": "Path to the directory to list."}
                },
                "required": [],
            },
        },
    },
]

TOOL_FUNCTIONS = {
    "execute_command": tools.execute_command,
    "read_file": tools.read_file,
    "write_file": tools.write_file,
    "list_directory": tools.list_directory,
}


class AntigravityAgent:
    def __init__(self, model_name: str = None):
        self.model_name = model_name or DEEPSEEK_MODEL
        self.projects_dir = Path(__file__).parent / "projects"
        self.projects_dir.mkdir(exist_ok=True)
        self.max_tool_turns = 10

        # System instructions outlining role, rules, and tool utilization
        self.system_instruction = (
            "You are Antigravity, an elite Tech Lead & AI Project Manager remote vibe-coding the user's monorepo project.\n"
            "You run 24/7 and receive instructions directly via Telegram.\n\n"
            "Your Guidelines:\n"
            "1. You act as an elite senior software architect and tech lead—direct, precise, highly technical.\n"
            "2. NEVER apologize or claim that you cannot inspect the workspace, access files, check ports, run servers, or query databases (like Supabase DB). You are equipped with 100% full, unrestricted local terminal and file access through your local tools (execute_command, read_file, write_file, list_directory).\n"
            "3. If a task requires database operations (like Supabase migration, listing tables, running SQL queries), you can run them using Node/Python scripts or the Supabase CLI directly through `execute_command`. You are fully capable of utilizing Model Context Protocol (MCP) servers locally by running standard CLI utilities or scripts!\n"
            "4. When the user asks you to write features, check process status, or run terminal commands, execute them instantly and proactively using your tools, and report precisely what changed. Do not write guides or explain how the user can do it themselves.\n"
            "5. You only reference documentation and files grounded inside the active project's vault, which acts as your isolated context.\n"
            "6. Suggest structural improvements, warn about code smells, and write production-grade code & tests.\n"
            "7. Always keep responses brief, clean, and developer-focused on Telegram.\n"
            "8. CRITICAL: There is NO terminal shell command named 'antigravity' or 'npx antigravity' on the system. The term 'Antigravity CLI' or 'Antigravity tools' in documentation and memory logs refers strictly to your built-in API tools (read_file, write_file, execute_command, list_directory). When running terminal tasks via execute_command, only run standard system tools (e.g. 'supabase', 'npm', 'git', 'python') and NEVER attempt to run 'npx antigravity' or 'antigravity' shell commands."
        )

    def get_active_project(self) -> str:
        """Retrieves the active project ID from state file."""
        state_file = Path(__file__).parent / "active_project.json"
        if state_file.exists():
            try:
                state = json.loads(state_file.read_text(encoding="utf-8"))
                return state.get("active_project")
            except Exception:
                pass
        return None

    def get_project_paths(self, project_id: str = None):
        """Resolves project directories (vault and history) based on project_id."""
        if not project_id:
            project_id = self.get_active_project() or "default"

        project_dir = self.projects_dir / project_id
        project_dir.mkdir(parents=True, exist_ok=True)

        vault_dir = project_dir / "vault"
        vault_dir.mkdir(parents=True, exist_ok=True)

        history_file = project_dir / "history.json"
        return vault_dir, history_file

    def _build_client(self, provider: str) -> Optional[Tuple[OpenAI, str]]:
        """Builds an OpenAI-compatible client for the given provider, or None if no API key."""
        if provider == "deepseek":
            api_key = os.environ.get("DEEPSEEK_API_KEY")
            if not api_key:
                return None
            return OpenAI(base_url=DEEPSEEK_BASE_URL, api_key=api_key), DEEPSEEK_MODEL
        if provider == "nvidia":
            api_key = os.environ.get("NVIDIA_API_KEY")
            if not api_key:
                return None
            return OpenAI(base_url=NVIDIA_BASE_URL, api_key=api_key), NVIDIA_MODEL
        return None

    def _build_messages(self, user_message: str, chat_history: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Builds the OpenAI-style message list grounded in the active project vault."""
        active_project_id = self.get_active_project() or "default"
        vault_dir, _ = self.get_project_paths(active_project_id)
        vault_context = self._get_vault_context(vault_dir)

        full_user_prompt = (
            f"=== Active Project Focus: {active_project_id} ===\n"
            f"{vault_context}\n\n"
            f"User Message: {user_message}"
        )

        messages: List[Dict[str, Any]] = [{"role": "system", "content": self.system_instruction}]
        for turn in chat_history:
            role = turn.get("role", "user")
            mapped_role = "assistant" if role in ["model", "assistant"] else "user"
            messages.append({"role": mapped_role, "content": turn.get("content", "")})

        messages.append({"role": "user", "content": full_user_prompt})
        return messages

    def _run_tool_loop(self, client: OpenAI, model: str, base_messages: List[Dict[str, Any]]) -> str:
        """Runs a single provider conversation loop, resolving tool calls until completion."""
        messages = list(base_messages)

        for _ in range(self.max_tool_turns):
            response = client.chat.completions.create(
                model=model,
                messages=messages,
                tools=TOOL_SCHEMAS,
                temperature=0.2,
            )
            message = response.choices[0].message

            if not message.tool_calls:
                return message.content or "Completed successfully."

            # Echo the assistant turn (with tool calls) back into the conversation.
            messages.append({
                "role": "assistant",
                "content": message.content or "",
                "tool_calls": [
                    {
                        "id": call.id,
                        "type": "function",
                        "function": {
                            "name": call.function.name,
                            "arguments": call.function.arguments or "{}",
                        },
                    }
                    for call in message.tool_calls
                ],
            })

            for call in message.tool_calls:
                tool_name = call.function.name
                try:
                    args = json.loads(call.function.arguments or "{}")
                except json.JSONDecodeError:
                    args = {}

                logger.info(f"Agent called tool: {tool_name} with args: {args}")
                tool_func = TOOL_FUNCTIONS.get(tool_name)
                if tool_func:
                    try:
                        result = tool_func(**args)
                    except Exception as tool_error:
                        result = f"Error executing tool '{tool_name}': {tool_error}"
                else:
                    result = f"Error: Tool '{tool_name}' not found."

                messages.append({
                    "role": "tool",
                    "tool_call_id": call.id,
                    "content": str(result),
                })

        # Max tool turns reached: request a final summary without tools.
        final_response = client.chat.completions.create(
            model=model,
            messages=messages,
            temperature=0.2,
        )
        return final_response.choices[0].message.content or "Completed successfully."

    def run_agent_turn(self, user_message: str, chat_history: List[Dict[str, Any]] = None) -> str:
        """Runs a complete conversation turn with tool execution support.

        Uses DeepSeek as the primary provider and automatically falls back to Nvidia.
        Each provider is retried up to MAX_RETRIES times with exponential backoff before
        switching. Errors are never surfaced to the user as raw exceptions.
        """
        if chat_history is None:
            chat_history = []

        base_messages = self._build_messages(user_message, chat_history)

        last_error: Optional[Exception] = None
        for provider in ["deepseek", "nvidia"]:
            client_info = self._build_client(provider)
            if client_info is None:
                logger.warning(f"Skipping provider '{provider}': API key not configured.")
                continue

            client, model = client_info
            for attempt in range(MAX_RETRIES):
                try:
                    return self._run_tool_loop(client, model, base_messages)
                except Exception as e:
                    last_error = e
                    logger.warning(
                        f"Provider '{provider}' attempt {attempt + 1}/{MAX_RETRIES} failed: {e}"
                    )
                    if attempt < MAX_RETRIES - 1:
                        time.sleep(RETRY_DELAYS[attempt])

            logger.error(f"Provider '{provider}' exhausted after {MAX_RETRIES} attempts; switching fallback.")

        logger.error(f"All AI providers failed. Last error: {last_error}", exc_info=last_error)
        return (
            "⚠️ Hệ thống AI tạm thời không phản hồi (DeepSeek và Nvidia đều không khả dụng). "
            "Vui lòng kiểm tra DEEPSEEK_API_KEY / NVIDIA_API_KEY và thử lại sau giây lát."
        )

    def _get_vault_context(self, vault_dir: Path = None) -> str:
        """Reads metadata and summaries of all files in the active research vault to ground the agent."""
        if vault_dir is None:
            vault_dir, _ = self.get_project_paths()

        files = list(vault_dir.glob("*"))
        if not files:
            return f"[Research Vault for active project is currently empty. Send reference documents/PDFs to index them.]"

        context = "=== Grounding Context (Active Project Vault) ===\n"
        for f in files:
            if f.suffix.lower() in [".txt", ".md", ".json", ".py", ".js", ".ts", ".tsx", ".yaml", ".yml"]:
                try:
                    content = f.read_text(encoding="utf-8", errors="ignore")[:4000]  # Limit size per file context
                    context += f"\n--- File: {f.name} ---\n{content}\n"
                except Exception as e:
                    context += f"\n--- File: {f.name} (Error reading: {e}) ---\n"
            else:
                context += f"\n--- File: {f.name} ({f.stat().st_size} bytes, multi-modal reference file) ---\n"
        return context

    def add_to_vault(self, filename: str, content_bytes: bytes, project_id: str = None):
        """Saves an uploaded document to the active project's research vault."""
        vault_dir, _ = self.get_project_paths(project_id)
        target = vault_dir / filename
        target.write_bytes(content_bytes)
        logger.info(f"Added '{filename}' to vault of project '{project_id or 'active'}'.")
        return str(target)
