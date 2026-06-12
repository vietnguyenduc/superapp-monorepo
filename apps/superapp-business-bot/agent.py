import os
import json
import logging
from pathlib import Path
from typing import List, Dict, Any
from google import genai
from google.genai import types
import tools

logger = logging.getLogger(__name__)

# Initialize GenAI Client
def get_genai_client():
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("GEMINI_API_KEY environment variable is not set.")
    return genai.Client(api_key=api_key)

class AntigravityAgent:
    def __init__(self, model_name: str = "gemini-2.5-flash"):
        self.model_name = model_name
        self.client = get_genai_client()
        self.projects_dir = Path(__file__).parent / "projects"
        self.projects_dir.mkdir(exist_ok=True)
        
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

    def run_agent_turn(self, user_message: str, chat_history: List[Dict[str, Any]] = None) -> str:
        """Runs a complete conversation turn with tools execution support."""
        if chat_history is None:
            chat_history = []

        # Resolve active project folders
        active_project_id = self.get_active_project() or "default"
        vault_dir, _ = self.get_project_paths(active_project_id)

        # Prepare context from active project's research vault (simulate NotebookLM context)
        vault_context = self._get_vault_context(vault_dir)
        full_user_prompt = (
            f"=== Active Project Focus: {active_project_id} ===\n"
            f"{vault_context}\n\n"
            f"User Message: {user_message}"
        )

        # Define tools available to Gemini
        available_tools = [
            tools.execute_command,
            tools.read_file,
            tools.write_file,
            tools.list_directory
        ]

        # Convert historical format to standard dictionary content types
        contents = []
        for turn in chat_history:
            role = turn.get("role", "user")
            # Map role names to standard genai roles
            mapped_role = "model" if role in ["model", "assistant"] else "user"
            contents.append({"role": mapped_role, "parts": [{"text": turn.get("content", "")}]})
        
        # Append current user prompt
        contents.append({"role": "user", "parts": [{"text": full_user_prompt}]})

        try:
            # Create a session-like chat loop to resolve function calling
            config = types.GenerateContentConfig(
                system_instruction=self.system_instruction,
                tools=available_tools,
                temperature=0.2
            )
            
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=contents,
                config=config
            )
            
            # Resolve function calls in a loop if the agent decided to call tools
            max_turns = 10
            turn_count = 0
            
            while response.function_calls and turn_count < max_turns:
                turn_count += 1
                tool_responses = []
                
                for call in response.function_calls:
                    tool_name = call.name
                    args = call.args
                    logger.info(f"Agent called tool: {tool_name} with args: {args}")
                    
                    # Execute tool
                    if hasattr(tools, tool_name):
                        tool_func = getattr(tools, tool_name)
                        result = tool_func(**args)
                    else:
                        result = f"Error: Tool '{tool_name}' not found."
                    
                    # Construct function response
                    tool_responses.append(
                        types.Part.from_function_response(
                            name=tool_name,
                            response={"result": result}
                        )
                    )
                
                # Append original call and our response to the list of turns
                contents.append(response.candidates[0].content)
                contents.append(types.Content(role="tool", parts=tool_responses))
                
                # Continue generating
                response = self.client.models.generate_content(
                    model=self.model_name,
                    contents=contents,
                    config=config
                )

            return response.text or "Completed successfully."
            
        except Exception as e:
            logger.error(f"Primary Gemini API call failed, attempting fallback to local model... Error: {e}", exc_info=True)
            return self._run_local_fallback(user_message, chat_history, primary_error=e)

    def _run_local_fallback(self, user_message: str, chat_history: List[Dict[str, Any]], primary_error: Exception) -> str:
        """Fallback generator that calls local Ollama or OpenClaw using standard urllib."""
        fallback_base = os.environ.get("FALLBACK_API_BASE", "http://127.0.0.1:11434/v1")
        fallback_model = os.environ.get("FALLBACK_MODEL_NAME", "qwen2.5:3b")
        fallback_key = os.environ.get("FALLBACK_API_KEY", "ollama")
        
        logger.info(f"Triggering local fallback to model '{fallback_model}' at '{fallback_base}'")
        
        # Prepare standard OpenAI/Ollama payloads
        messages = [{"role": "system", "content": self.system_instruction + "\n\nNOTE: You are currently running in LOCAL FALLBACK mode using local Llama/Qwen. Keep your response brief."}]
        
        # Add grounding context
        active_project_id = self.get_active_project() or "default"
        vault_dir, _ = self.get_project_paths(active_project_id)
        vault_context = self._get_vault_context(vault_dir)
        
        # Add history
        for turn in chat_history:
            role = turn.get("role", "user")
            # Map role names to standard OpenAI format
            mapped_role = "assistant" if role in ["model", "assistant"] else "user"
            messages.append({"role": mapped_role, "content": turn.get("content", "")})
            
        # Append current user prompt
        messages.append({"role": "user", "content": f"{vault_context}\n\nUser Message: {user_message}"})
        
        payload = {
            "model": fallback_model,
            "messages": messages,
            "temperature": 0.2
        }
        
        try:
            import urllib.request
            url = f"{fallback_base.rstrip('/')}/chat/completions"
            data = json.dumps(payload).encode("utf-8")
            
            req = urllib.request.Request(
                url,
                data=data,
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {fallback_key}"
                },
                method="POST"
            )
            
            with urllib.request.urlopen(req, timeout=30.0) as response:
                res_data = json.loads(response.read().decode("utf-8"))
                reply = res_data["choices"][0]["message"]["content"]
                return f"⚠️ *[Running in Local Fallback Mode: {fallback_model}]*\n\n{reply}"
        except Exception as fallback_error:
            logger.error(f"Local fallback connection failed: {fallback_error}")
            return (
                f"❌ **System Error**:\n"
                f"Primary Gemini API call failed: `{str(primary_error)}`\n"
                f"Local Fallback to Ollama/Llama ({fallback_model}) also failed: `{str(fallback_error)}`\n\n"
                f"Please verify your API keys and local server status."
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
                    content = f.read_text(encoding="utf-8", errors="ignore")[:4000] # Limit size per file context
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
