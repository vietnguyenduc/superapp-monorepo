import os
import subprocess
import logging
from pathlib import Path
from typing import Callable, Tuple
import tools
import core.ai_router as ai_router

logger = logging.getLogger("ATA.executor")

class SelfHealingExecutor:
    def __init__(self, max_retries: int = 3):
        self.max_retries = max_retries

    def run_with_healing(self, command: str, file_path_to_watch: str = None, chat_context: str = "", log_callback: Callable[[str], None] = None) -> Tuple[bool, str]:
        """
        Runs a command in a self-healing loop.
        If it fails, it reads stderr, queries the AI router to patch/correct, applies the fix, and retries.
        """
        cwd_path = tools.get_active_workspace()
        current_command = command
        
        if log_callback:
            log_callback(f"🚀 Running execution: `{current_command}`")
            
        for attempt in range(1, self.max_retries + 1):
            if log_callback:
                log_callback(f"🔄 Attempt {attempt}/{self.max_retries}...")
                
            try:
                # Run command in active workspace using powershell
                result = subprocess.run(
                    ["powershell", "-Command", current_command],
                    cwd=str(cwd_path),
                    text=True,
                    capture_output=True,
                    timeout=120
                )
                
                # Check for success
                if result.returncode == 0:
                    success_msg = f"✅ Execution successful on attempt {attempt}!\n"
                    if result.stdout:
                        success_msg += f"--- STDOUT ---\n{result.stdout}\n"
                    return True, success_msg
                
                # Failed execution!
                stderr = result.stderr or result.stdout or "Command returned non-zero exit status without stderr output."
                logger.warning(f"Execution failed on attempt {attempt}. Return code: {result.returncode}. Error: {stderr}")
                
                if log_callback:
                    log_callback(f"⚠️ Error detected! Querying AI Router for healing strategy...")
                
                # Retrieve files context for healing
                file_contents = ""
                if file_path_to_watch:
                    target_file = (cwd_path / file_path_to_watch).resolve()
                    if target_file.exists() and target_file.is_file():
                        try:
                            file_contents = f"\n=== Target File Content ({file_path_to_watch}) ===\n{target_file.read_text(encoding='utf-8')}\n"
                        except Exception:
                            pass
                
                # Build context and prompt for the router to fix the failure
                heal_sys = (
                    "You are a Self-Healing Code Assistant. Your target has run a command that failed.\n"
                    "Analyze the command, the target file, and the stderr error trace.\n"
                    "Provide code fixes or command adjustments to solve the error.\n"
                    "You MUST reply in a strict JSON format:\n"
                    "{\n"
                    "  \"explanation\": \"brief description of why it failed and how to fix it\",\n"
                    "  \"fixed_command\": \"the corrected command to run (if applicable)\",\n"
                    "  \"file_patch\": \"complete code content to write to the file (if the file was the cause of error)\",\n"
                    "  \"target_file\": \"relative file path to apply the file_patch to (if applicable)\"\n"
                    "}\n"
                    "Do NOT output anything but valid JSON."
                )
                
                heal_prompt = (
                    f"CWD: {cwd_path.as_posix()}\n"
                    f"Command that failed: {current_command}\n"
                    f"Exit code: {result.returncode}\n"
                    f"Stderr error:\n{stderr}\n"
                    f"{file_contents}\n"
                    f"Chat background context: {chat_context}"
                )
                
                # Use AI router to generate corrective actions (DeepSeek -> Nvidia fallback)
                heal_strategy_raw = ai_router.query_ai(heal_prompt, system_prompt=heal_sys)
                
                # Parse strategy
                cleaned = heal_strategy_raw.strip()
                if cleaned.startswith("```json"):
                    cleaned = cleaned[7:]
                if cleaned.endswith("```"):
                    cleaned = cleaned[:-3]
                cleaned = cleaned.strip()
                
                try:
                    strategy = json.loads(cleaned)
                    explanation = strategy.get("explanation", "No explanation provided.")
                    fixed_cmd = strategy.get("fixed_command")
                    file_patch = strategy.get("file_patch")
                    target_file_name = strategy.get("target_file") or file_path_to_watch
                    
                    if log_callback:
                        log_callback(f"🛠️ Healing strategy: {explanation}")
                    
                    # Apply file patch if provided
                    if file_patch and target_file_name:
                        target_path = (cwd_path / target_file_name).resolve()
                        if str(target_path).startswith(str(tools.MONOREPO_ROOT)):
                            target_path.parent.mkdir(parents=True, exist_ok=True)
                            target_path.write_text(file_patch, encoding="utf-8")
                            if log_callback:
                                log_callback(f"📝 Applied code patch to `{target_file_name}`")
                    
                    # Update command if fixed
                    if fixed_cmd:
                        current_command = fixed_cmd
                        if log_callback:
                            log_callback(f"🔄 Switched target command to: `{current_command}`")
                            
                except Exception as parse_err:
                    logger.error(f"Failed to parse healing strategy JSON: {heal_strategy_raw}. Error: {parse_err}")
                    if log_callback:
                        log_callback(f"❌ Failed to parse healing strategy: {str(parse_err)}")
                        
            except subprocess.TimeoutExpired:
                err_msg = f"Error: Command timed out after 120 seconds in {cwd_path.name}."
                logger.error(err_msg)
                return False, err_msg
            except Exception as e:
                err_msg = f"Error executing self-healing process: {str(e)}"
                logger.error(err_msg)
                return False, err_msg
                
        # If we got here, all attempts failed
        final_fail = f"❌ Execution failed after {self.max_retries} attempts."
        return False, final_fail
