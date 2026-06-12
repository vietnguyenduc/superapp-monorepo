"""
ai_router.py
============
Smart AI router: Ollama (local) → DeepSeek → Gemini
Uses rule-based task classification (no LLM call for routing itself).

Usage:
    from core.ai_router import smart_generate, classify_task

    text = smart_generate(prompt="list all files", system="You are helpful.")
"""

import os
import json
import logging
import re
import threading
import time
from typing import Optional, Tuple, Callable

from core.provider_registry import get_registry
from core.budget_tracker import get_tracker

logger = logging.getLogger("ATA.ai_router")

# ─────────────────────────────────────────────
# Rule-based task classifier (zero LLM cost)
# ─────────────────────────────────────────────
_SIMPLE_PATTERNS = [
    r"\blist\b", r"\bls\b", r"\bdir\b", r"\bstatus\b", r"\bversion\b",
    r"\bping\b", r"\bhello\b", r"\bhi\b", r"\bhelp\b", r"\bwhat.*(time|date)\b",
    r"\bshow\b.*\bfile", r"\bread\b.*\bfile", r"\bcheck\b.*\bport",
]

_HEAVY_PATTERNS = [
    r"\brefactor\b", r"\barchitect\b", r"\bmigrat\b", r"\bdeploy\b.*\bpipeline\b",
    r"\bsecurity\b.*\baudit\b", r"\bdesign\b.*\bsystem\b", r"\boptimiz\b.*\bperformance\b",
    r"\bwrite\b.*\btest", r"\bgenerat\b.*\btest", r"\brewrite\b.*\bmodule\b",
    r"\bmulti.file\b", r"\blarge.context\b",
]

def classify_task(message: str) -> str:
    """
    Returns 'simple', 'medium', or 'heavy' based on message content.
    No LLM call — pure regex rules.
    """
    msg_lower = message.lower().strip()

    # Short messages with simple patterns → simple
    if len(msg_lower) < 60:
        for pattern in _SIMPLE_PATTERNS:
            if re.search(pattern, msg_lower):
                return "simple"

    # Long or complex patterns → heavy
    if len(msg_lower) > 500:
        return "heavy"
    for pattern in _HEAVY_PATTERNS:
        if re.search(pattern, msg_lower):
            return "heavy"

    return "medium"


# ─────────────────────────────────────────────
# Core generation function with fallback chain
# ─────────────────────────────────────────────
def smart_generate(
    prompt: str,
    system: str = None,
    task_type: str = None,
    tools_schema: list = None,
    force_provider: str = None,
) -> Tuple[str, str]:
    """
    Generate a response using the best available provider.

    Args:
        prompt: User message / full prompt
        system: System instruction
        task_type: 'simple' | 'medium' | 'heavy' (auto-classified if None)
        tools_schema: OpenAI-compatible tools list (for DeepSeek/Ollama)
        force_provider: Override routing ('ollama' | 'deepseek' | 'gemini')

    Returns:
        (response_text, provider_name_used)
    """
    if task_type is None:
        task_type = classify_task(prompt)

    registry = get_registry()
    tracker = get_tracker()

    # Check daily budget
    if tracker.is_over_budget():
        logger.warning("[Router] Daily budget exceeded, routing to Gemini (free tier).")
        force_provider = "gemini"

    # Build ordered provider list
    if force_provider:
        attr_name = force_provider.replace("-", "_")
        try:
            provider = getattr(registry, attr_name)
            providers_to_try = [provider]
        except AttributeError:
            providers_to_try = _get_ordered_providers(registry, task_type)
    else:
        providers_to_try = _get_ordered_providers(registry, task_type)

    last_error = None
    for provider in providers_to_try:
        if not provider.health_check():
            logger.info(f"[Router] {provider.NAME} offline, skipping.")
            continue

        try:
            logger.info(f"[Router] Trying {provider.NAME} for task_type={task_type}")
            text = provider.generate(prompt=prompt, system=system, tools_schema=tools_schema)

            # Estimate tokens (rough: 1 token ≈ 4 chars)
            input_tokens = len(prompt) // 4
            output_tokens = len(text) // 4
            tracker.record(provider.NAME, input_tokens, output_tokens, task_type)

            logger.info(f"[Router] Success via {provider.NAME}")
            return text, provider.NAME

        except Exception as e:
            logger.warning(f"[Router] {provider.NAME} failed: {e}")
            last_error = e
            # Invalidate health cache on failure
            provider._healthy = False
            provider._last_check = 0
            continue

    raise RuntimeError(
        f"All providers failed. Last error: {last_error}\n"
        "Check Ollama is running (`ollama serve`), DeepSeek key is valid, and Gemini key is set."
    )


def _get_ordered_providers(registry, task_type: str) -> list:
    """Return providers in priority order for given task type.
    Ollama disabled — uses DeepSeek (primary) → Nvidia → Gemini (fallback).
    """
    return [registry.deepseek, registry.nvidia, registry.gemini]


def _get_recovery_hint(tool_name: str, args: dict, error: str) -> str:
    """
    Return an actionable recovery hint when a tool call fails.
    Injected into the tool result so the model can self-correct on next iteration.
    """
    err_lower = error.lower()
    filepath = args.get("filepath", args.get("dirpath", args.get("path", "")))

    # ── patch_file specific hints ──────────────────────────────────────
    if tool_name == "patch_file":
        if "not found" in err_lower or "old_str not found" in err_lower:
            return (
                f"The old_str text was not found verbatim in '{filepath}'. "
                f"Call get_file_outline('{filepath}') to see exact line numbers, "
                f"then read_file_lines to verify the exact text including indentation, "
                f"then retry patch_file with the corrected old_str."
            )
        if "found" in err_lower and "times" in err_lower:
            return (
                "old_str matches multiple locations. Make it more unique by including "
                "1-2 more surrounding lines of context in old_str, then retry."
            )

    # ── read_file / list_directory / list_all_files path errors ───────
    if tool_name in ("read_file", "list_directory", "list_all_files", "get_file_outline", "read_file_lines"):
        if "does not exist" in err_lower or "not found" in err_lower:
            return (
                f"Path '{filepath}' was not found. "
                f"Call list_all_files(include='*.ts,*.tsx') or grep_code('{filepath.split('/')[-1] if filepath else ''}') "
                f"to locate the correct path, then retry with the correct path."
            )

    # ── grep_code: no matches ──────────────────────────────────────────
    if tool_name == "grep_code" and "no matches" in err_lower:
        pattern = args.get("pattern", "")
        return (
            f"No matches for '{pattern}'. Try: (1) a simpler/shorter pattern, "
            f"(2) case-insensitive search, or (3) list_all_files to first confirm the files exist."
        )

    # ── execute_command: exit code errors ─────────────────────────────
    if tool_name == "execute_command":
        cmd = args.get("command", "")
        if "exit code:" in err_lower or "not recognized" in err_lower:
            return (
                f"Command failed: '{cmd[:60]}'. "
                f"Check if the required CLI tool is installed, or use a different command. "
                f"You can run `Get-Command <tool>` to check if it's available."
            )

    # ── Generic fallback ───────────────────────────────────────────────
    return ""

def verify_code_changes(filepath: str) -> str:
    """
    Statically verify a modified file to catch obvious syntax errors before the agent continues.
    Runs fast static checks (py_compile, json validation, etc) without requiring active ports.
    """
    import subprocess
    if not filepath:
        return ""
        
    ext = filepath.split('.')[-1].lower() if '.' in filepath else ""
    try:
        if ext == "py":
            # Fast python syntax check
            res = subprocess.run(["python", "-m", "py_compile", filepath], capture_output=True, text=True)
            if res.returncode != 0:
                return f"Syntax Error in {filepath}:\n{res.stderr}"
        elif ext == "json":
            res = subprocess.run(["python", "-m", "json.tool", filepath], capture_output=True, text=True)
            if res.returncode != 0:
                return f"JSON Syntax Error in {filepath}:\n{res.stderr}"
    except Exception as e:
        return f"Warning: Failed to verify {filepath}: {e}"
        
    return ""

# ─────────────────────────────────────────────
# Agentic tool-calling loop (multi-turn)
# ─────────────────────────────────────────────
def run_agentic_loop(
    messages: list,
    tools_schema: list,
    tool_executor,              # callable(name, args) -> str
    task_type: str = "medium",
    max_turns: int = 26,
    on_progress: Callable = None,   # callback(text: str) — updates progress message
    on_thinking: Callable = None,   # callback(text: str) — called while model is "thinking"
    force_provider: str = None,
    task_state=None,           # Optional TaskState instance for persistence
    cancellation_event=None,   # Optional threading.Event — set to cancel the loop
) -> Tuple[str, str]:
    """
    Run a full agentic loop (tool calling) across providers.
    Falls back to next provider if current fails.

    Args:
        messages: List of {role, content} dicts (OpenAI format)
        tools_schema: OpenAI-compatible tools definitions
        tool_executor: Function that takes (tool_name, args_dict) and returns result string.
                       The executor is expected to accept an optional `on_line` and `cancellation_event`
                       for execute_command streaming — but gracefully ignores them if not supported.
        task_type: Routing hint
        max_turns: Maximum tool call iterations
        on_progress: Optional callback(text: str) — updates the Telegram progress message
        on_thinking: Optional callback(text: str) — called while waiting for model response
        force_provider: Override routing to a specific provider
        task_state: Optional TaskState for cross-turn persistence
        cancellation_event: Optional threading.Event — if set, loop exits early

    Returns:
        (final_text_response, provider_name_used)
    """
    registry = get_registry()

    if force_provider:
        attr_name = force_provider.replace("-", "_")
        try:
            provider = getattr(registry, attr_name)
            providers_to_try = [provider]
        except AttributeError:
            providers_to_try = _get_ordered_providers(registry, task_type)
    else:
        providers_to_try = _get_ordered_providers(registry, task_type)

    tracker = get_tracker()

    last_error = None
    for provider in providers_to_try:
        if not provider.health_check():
            continue

        # Only Ollama and DeepSeek support the OpenAI-style tool calling in this loop
        if provider.NAME == "gemini":
            # Gemini uses its own SDK — handled separately in agent.py
            # Here we do a plain generate with context summary
            try:
                combined_prompt = "\n".join(
                    f"{m['role'].upper()}: {m.get('content', '')}" for m in messages
                )
                text = provider.generate(prompt=combined_prompt, system=None)
                return text, provider.NAME
            except Exception as e:
                last_error = e
                continue

        try:
            logger.info(f"[AgentLoop] Starting with provider: {provider.NAME}")
            local_msgs = list(messages)  # Copy to avoid mutation
            turn_count = 0
            last_reply = ""

            # Progress tracking — accumulated steps list
            executed_steps = []

            def update_progress(msg: str):
                executed_steps.append(msg)
                if on_progress:
                    progress_text = (
                        "⚡ *Hệ thống đang thực thi các bước sau:*\n\n"
                        + "\n".join(executed_steps[-20:])  # Keep last 20 steps
                    )
                    on_progress(progress_text)

            def notify_thinking(elapsed_s: int, dots: str):
                """Notify on_thinking callback — separate from progress to avoid polluting step log."""
                if on_thinking:
                    on_thinking(
                        f"⏳ *Model đang suy nghĩ{dots}* (~{elapsed_s}s)\n\n"
                        + "\n".join(executed_steps[-10:])
                    )

            update_progress(f"🧠 Bot đang bắt đầu phân tích với mô hình *{provider.NAME.upper()}*...")

            reached_limit = False
            start_time = time.time()
            TIMEOUT_SECONDS = 300  # 5 minutes timeout

            while turn_count < max_turns:
                # ── Cancellation check ──────────────────────────────────────
                if cancellation_event and cancellation_event.is_set():
                    logger.info("[AgentLoop] Cancelled by user.")
                    update_progress("🛑 *Đã hủy tác vụ theo yêu cầu người dùng.*")
                    last_reply = "🛑 *Tác vụ đã bị hủy.*"
                    break

                # ── Timeout check ───────────────────────────────────────────
                if time.time() - start_time > TIMEOUT_SECONDS:
                    logger.warning(f"[AgentLoop] Timeout reached ({TIMEOUT_SECONDS}s)")
                    update_progress("⏳ *Tác vụ chạy quá lâu (5 phút), tự động tạm dừng để tránh treo.*")
                    reached_limit = True
                    break

                turn_count += 1
                elapsed = int(time.time() - start_time)

                # ── Notify "thinking" before calling the model ──────────────
                if on_thinking:
                    notify_thinking(elapsed, "...")

                msg_obj = provider.generate_with_tools(local_msgs, tools_schema)
                local_msgs.append(msg_obj)

                tool_calls = msg_obj.get("tool_calls", [])
                if not tool_calls:
                    last_reply = msg_obj.get("content", "")
                    break

                logger.info(f"[AgentLoop] Turn {turn_count}: {len(tool_calls)} tool call(s)")

                for call in tool_calls:
                    # ── Cancellation check inside tool loop ─────────────────
                    if cancellation_event and cancellation_event.is_set():
                        break

                    func = call.get("function", {})
                    tool_name = func.get("name", "")
                    args_raw = func.get("arguments", {})

                    # ── Parse args: handle JSON string from model ────────────
                    parse_error = None
                    if isinstance(args_raw, str):
                        try:
                            args = json.loads(args_raw)
                        except Exception as je:
                            # JSON parse failed — common when write_file content is large
                            # (model embeds 300+ lines of code inside JSON string → escape errors)
                            parse_error = str(je)
                            args = {}
                    else:
                        args = args_raw

                    # ── Detect missing required params (from parse failure) ──
                    REQUIRED_PARAMS = {
                        "write_file": ["filepath", "content"],
                        "patch_file": ["filepath", "old_str", "new_str"],
                        "read_file": ["filepath"],
                        "execute_command": ["command"],
                    }
                    missing = [
                        p for p in REQUIRED_PARAMS.get(tool_name, [])
                        if not args.get(p)
                    ]
                    if missing:
                        hint_msg = (
                            f"Error: Tool '{tool_name}' called with missing/empty required "
                            f"parameters: {missing}. "
                        )
                        if parse_error:
                            hint_msg += (
                                f"Root cause: JSON argument parsing failed ({parse_error[:80]}). "
                                f"This usually happens when 'content' is too large for the model to "
                                f"serialize correctly in one tool call. "
                            )
                        if tool_name == "write_file":
                            hint_msg += (
                                "SOLUTION: Do NOT use write_file with large content. "
                                "Instead, use patch_file to make targeted edits: "
                                "(1) use get_file_outline to see line numbers, "
                                "(2) use read_file_lines to get the exact old text, "
                                "(3) call patch_file(filepath, old_str, new_str) for each change. "
                                "This avoids JSON serialization limits entirely."
                            )
                        # Feed error back into conversation without executing tool
                        step_label = f"`{tool_name}` (arg parse failed)"
                        update_progress(f"❌ *Lỗi:* {step_label}\n   ↳ _{hint_msg[:120]}_")
                        if provider.NAME == "ollama":
                            local_msgs.append({"role": "tool", "name": tool_name, "content": hint_msg})
                        else:
                            local_msgs.append({
                                "role": "tool",
                                "tool_call_id": call.get("id", "call_0"),
                                "name": tool_name,
                                "content": hint_msg,
                            })
                        continue  # Skip to next tool call without executing

                    # ── Proactive: intercept write_file with large content ───
                    if tool_name == "write_file":
                        content_val = args.get("content", "")
                        filepath_val = args.get("filepath", "")
                        
                        file_exists = False
                        try:
                            import tools
                            target, _ = tools._resolve_path(filepath_val, must_exist=False)
                            file_exists = target.exists()
                        except Exception:
                            pass
                            
                        limit = 4000 if file_exists else 30000
                        if len(content_val) > limit:
                            if file_exists:
                                intercept_msg = (
                                    f"INTERCEPTED: write_file for '{filepath_val}' has {len(content_val)} chars of content. "
                                    f"Large write_file calls risk JSON truncation and overwriting untouched code. "
                                    f"REQUIRED: Switch to patch_file for each specific change. "
                                    f"Steps: (1) get_file_outline('{filepath_val}'), "
                                    f"(2) read_file_lines for each section to change, "
                                    f"(3) patch_file once per logical change. Do not bundle all changes into one write_file."
                                )
                                update_progress(f"⚠️ *Chặn:* write_file quá lớn ({len(content_val)} chars) → dùng patch_file")
                            else:
                                intercept_msg = (
                                    f"INTERCEPTED: write_file for new file '{filepath_val}' has {len(content_val)} chars of content, "
                                    f"which exceeds the maximum limit of {limit} characters. "
                                    f"To write extremely large mock data or files, write a generator script (e.g. Node/Python) "
                                    f"that outputs the data programmatically, then run it using execute_command. "
                                    f"This avoids model output truncation and JSON serialization limits."
                                )
                                update_progress(f"⚠️ *Chặn:* Tạo file mới quá lớn ({len(content_val)} chars) → hãy dùng script sinh data")
                                
                            if provider.NAME == "ollama":
                                local_msgs.append({"role": "tool", "name": tool_name, "content": intercept_msg})
                            else:
                                local_msgs.append({
                                    "role": "tool",
                                    "tool_call_id": call.get("id", "call_0"),
                                    "name": tool_name,
                                    "content": intercept_msg,
                                })
                            continue  # Block the write, force model to use alternatives


                    # ── Consecutive-failure circuit breaker ─────────────────
                    # Track (tool_name, filepath/command) failure count to stop loops
                    failure_key = f"{tool_name}:{args.get('filepath', args.get('command', ''))[:60]}"
                    if not hasattr(run_agentic_loop, '_failure_counts'):
                        run_agentic_loop._failure_counts = {}

                    # Build a human-readable step label from actual arg values
                    def _step_label(tname, targs):
                        if tname == "execute_command":
                            cmd = str(targs.get("command", ""))[:80]
                            return f"`$ {cmd}`"
                        elif tname == "write_file":
                            fp = str(targs.get("filepath", ""))
                            parts = fp.replace("\\", "/").split("/")
                            short = "/".join(parts[-2:]) if len(parts) >= 2 else fp
                            return f"`✏️ write: {short}`"
                        elif tname == "read_file":
                            fp = str(targs.get("filepath", ""))
                            parts = fp.replace("\\", "/").split("/")
                            short = "/".join(parts[-2:]) if len(parts) >= 2 else fp
                            return f"`📖 read: {short}`"
                        elif tname == "patch_file":
                            fp = str(targs.get("filepath", ""))
                            parts = fp.replace("\\", "/").split("/")
                            short = "/".join(parts[-2:]) if len(parts) >= 2 else fp
                            old_preview = str(targs.get("old_str", ""))[:40].replace("\n", "↵")
                            return f"`🔧 patch: {short} → '{old_preview}...'`"
                        elif tname == "read_file_lines":
                            fp = str(targs.get("filepath", ""))
                            parts = fp.replace("\\", "/").split("/")
                            short = "/".join(parts[-2:]) if len(parts) >= 2 else fp
                            s, e = targs.get("start_line", "?"), targs.get("end_line", "?")
                            return f"`📄 lines {s}-{e}: {short}`"
                        elif tname == "get_file_outline":
                            fp = str(targs.get("filepath", ""))
                            parts = fp.replace("\\", "/").split("/")
                            short = "/".join(parts[-2:]) if len(parts) >= 2 else fp
                            return f"`🗂️ outline: {short}`"
                        elif tname == "grep_code":
                            pat = str(targs.get("pattern", ""))[:50]
                            path = str(targs.get("path", "."))[:30]
                            return f"`🔎 grep '{pat}' in {path}`"
                        elif tname == "list_directory":
                            dp = str(targs.get("dirpath", "."))[:60]
                            return f"`📁 ls: {dp}`"
                        elif tname == "list_all_files":
                            p = str(targs.get("path", "."))[:40]
                            inc = targs.get("include", "")
                            suffix = f" [{inc}]" if inc else ""
                            return f"`🌲 tree: {p}{suffix}`"
                        else:
                            return f"`{tname}({', '.join(str(v)[:30] for v in targs.values())})`"

                    step_label = _step_label(tool_name, args)
                    update_progress(f"🔍 *Đang chạy:* {step_label}")

                    # ── Execute tool — with streaming for execute_command ────
                    output_lines_buffer = []

                    def on_cmd_line(line: str):
                        """Called for each stdout line of execute_command."""
                        if not line.strip():
                            return
                        output_lines_buffer.append(line)
                        # Show real-time output (last 5 lines) in progress
                        recent = "\n".join(output_lines_buffer[-5:])
                        update_progress(
                            f"⚙️ *Đang chạy:* {step_label}\n"
                            f"```\n{recent[:500]}\n```"
                        )

                    # Try to pass streaming kwargs to tool executor
                    try:
                        result = tool_executor(
                            tool_name, args,
                            on_line=on_cmd_line if tool_name == "execute_command" else None,
                            cancellation_event=cancellation_event,
                        )
                    except TypeError:
                        # Fallback: executor doesn't accept extra kwargs
                        result = tool_executor(tool_name, args)

                    # Show first line of result as brief outcome
                    result_str = str(result)
                    
                    # SELF-CORRECTION: Auto-verify syntax for file modifications
                    if tool_name in ["patch_file", "write_file"] and not result_str.lower().startswith("error"):
                        fp = args.get("filepath", "")
                        if fp:
                            verify_err = verify_code_changes(fp)
                            if verify_err and "Syntax Error" in verify_err:
                                result_str = f"{result_str}\n\n[SELF-CORRECTION TRIGGERED]\n{verify_err}\nPlease fix this syntax error before continuing."
                                update_progress(f"⚠️ *Lỗi Cú Pháp:* Bot đang tự sửa đổi lại file {fp.split('/')[-1]}...")

                    is_error = result_str.lower().startswith("error") or result_str.lower().startswith("intercepted") or "[SELF-CORRECTION TRIGGERED]" in result_str
                    first_line = result_str.strip().split("\n")[0][:80]
                    status_icon = "❌" if is_error else "✅"
                    update_progress(f"{status_icon} *Xong:* {step_label}\n   ↳ _{first_line}_")

                    # ── Circuit breaker: stop infinite retry loops ───────────
                    _fc = run_agentic_loop._failure_counts if hasattr(run_agentic_loop, '_failure_counts') else {}
                    if is_error:
                        _fc[failure_key] = _fc.get(failure_key, 0) + 1
                        if _fc[failure_key] >= 2:
                            circuit_msg = (
                                f"CIRCUIT BREAKER TRIGGERED: '{tool_name}' has failed {_fc[failure_key]} times "
                                f"in a row for '{failure_key}'. Do NOT retry this exact call again. "
                                f"You MUST switch strategy completely: "
                                f"{'Use patch_file with smaller old_str snippets instead of write_file.' if tool_name in ('write_file', 'patch_file') else ''}"
                                f"{'Use list_all_files() to rediscover the correct path.' if tool_name in ('read_file', 'list_directory', 'get_file_outline') else ''}"
                                f"{'Simplify the command or check tool availability with Get-Command.' if tool_name == 'execute_command' else ''}"
                                f" Report to user what you accomplished and what remains if you cannot proceed."
                            )
                            result_str = circuit_msg
                            update_progress(f"🔴 *Circuit breaker:* {tool_name} blocked after {_fc[failure_key]} failures")
                    else:
                        _fc[failure_key] = 0  # reset on success
                    if hasattr(run_agentic_loop, '_failure_counts'):
                        run_agentic_loop._failure_counts = _fc

                    # ── Recovery hints: help model self-correct on errors ────
                    if is_error and "CIRCUIT BREAKER" not in result_str:
                        hint = _get_recovery_hint(tool_name, args, result_str)
                        if hint:
                            result_str = result_str + f"\n\n[RECOVERY HINT: {hint}]"

                    # Persist step to task journal for continuation awareness
                    if task_state:
                        try:
                            task_state.add_step(tool_name, args, result_str)
                        except Exception as ts_err:
                            logger.warning(f"[AgentLoop] task_state.add_step failed: {ts_err}")

                    # Format tool result per provider protocol
                    if provider.NAME == "ollama":
                        local_msgs.append({
                            "role": "tool",
                            "name": tool_name,
                            "content": result_str,
                        })
                    else:  # deepseek / openai-compatible
                        local_msgs.append({
                            "role": "tool",
                            "tool_call_id": call.get("id", "call_0"),
                            "name": tool_name,
                            "content": result_str,
                        })
            else:
                reached_limit = True

            # ── Handle empty reply (model stopped without saying anything) ──
            if not reached_limit and not last_reply.strip():
                logger.warning("[AgentLoop] Model finished with empty reply — requesting summary.")
                try:
                    local_msgs.append({
                        "role": "user",
                        "content": (
                            "Tóm tắt lại những gì bạn vừa thực hiện bằng tiếng Việt. "
                            "Nếu có lỗi, hãy giải thích rõ ràng."
                        )
                    })
                    summary_obj = provider.generate_with_tools(local_msgs, [])
                    last_reply = summary_obj.get("content", "✅ Đã hoàn thành. (Model không cung cấp tóm tắt)")
                except Exception as summary_err:
                    logger.warning(f"[AgentLoop] Empty-reply summary failed: {summary_err}")
                    last_reply = "✅ Đã hoàn thành các bước thực thi."

            if reached_limit and not (cancellation_event and cancellation_event.is_set()):
                # Reached max turns or timeout — force a final text response
                logger.info(f"[AgentLoop] Max turns ({max_turns}) or timeout reached. Requesting final summary...")
                update_progress("⚠️ *Đã chạm giới hạn số lượt chạy hoặc thời gian. Đang tổng hợp kết quả hiện tại...*")
                try:
                    local_msgs.append({
                        "role": "user",
                        "content": (
                            "Analyze all the tool outputs and results above. "
                            "Provide a clear Vietnamese summary of: (1) what steps you completed successfully, "
                            "(2) what is still PENDING and needs to be done next — list each pending step clearly under a '## ❌ Chưa hoàn thành' section. "
                            "Tell the user to reply 'ok' or 'tiếp tục' to continue from where you left off. "
                            "Do NOT call any more tools."
                        )
                    })
                    msg_obj = provider.generate_with_tools(local_msgs, [])
                    last_reply = msg_obj.get("content", "")

                    # Persist summary + extract pending steps into task journal
                    if task_state:
                        try:
                            from core.task_state import extract_pending_steps_from_reply
                            pending = extract_pending_steps_from_reply(last_reply)
                            task_state.update_progress(last_reply[:2000], pending)
                        except Exception as ts_err:
                            logger.warning(f"[AgentLoop] task_state update failed: {ts_err}")

                    # Prepend warning to answer
                    last_reply = (
                        f"⚠️ **[CẢNH BÁO: ĐẠT GIỚI HẠN {max_turns} LƯỢT CHẠY HOẶC 5 PHÚT]** "
                        "Các tác vụ phức tạp vẫn chưa hoàn thành xong hoàn toàn. "
                        "Dưới đây là kết quả của các bước đã chạy:\n\n"
                        + last_reply
                        + "\n\n💬 _Nhắn `ok` hoặc `tiếp tục` để tôi tiếp tục từ chỗ còn dở mà không lặp lại bước cũ._"
                    )
                except Exception as final_err:
                    logger.warning(f"[AgentLoop] Failed to get final response: {final_err}")
                    last_reply = (
                        f"⚠️ *(Chạm giới hạn {max_turns} lượt chạy hoặc thời gian. "
                        "AI đã thực hiện các hành động nhưng không thể biên dịch bản tóm tắt câu trả lời.)*"
                    )

            # ── Complete progress logs ──────────────────────────────────────
            if on_progress:
                if cancellation_event and cancellation_event.is_set():
                    update_progress("🛑 *Đã hủy tác vụ theo yêu cầu người dùng.*")
                elif reached_limit:
                    update_progress(f"🛑 *Đã tạm dừng do đạt giới hạn {max_turns} lượt chạy hoặc quá 5 phút!*")
                else:
                    update_progress("🎉 *Đã hoàn thành toàn bộ công việc thực thi!*")

            # Task completed normally — clear task state
            if not reached_limit and not (cancellation_event and cancellation_event.is_set()):
                if task_state:
                    try:
                        task_state.complete_task()
                    except Exception as ts_err:
                        logger.warning(f"[AgentLoop] task_state.complete_task failed: {ts_err}")

            # Track usage (rough estimate)
            total_chars = sum(len(str(m.get("content", ""))) for m in local_msgs)
            tracker.record(provider.NAME, total_chars // 4, len(last_reply) // 4, task_type)

            logger.info(f"[AgentLoop] Completed via {provider.NAME} in {turn_count} turn(s)")
            return last_reply, provider.NAME

        except Exception as e:
            logger.warning(f"[AgentLoop] {provider.NAME} failed: {e}")
            last_error = e
            provider._healthy = False
            provider._last_check = 0
            continue

    raise RuntimeError(f"All providers failed in agentic loop. Last error: {last_error}")


# ─────────────────────────────────────────────
# Backwards compatibility shims
# ─────────────────────────────────────────────
def query_ollama(prompt: str, system_prompt: str = None) -> str:
    registry = get_registry()
    return registry.ollama.generate(prompt, system=system_prompt)

def query_gemini(prompt: str, system_prompt: str = None) -> str:
    registry = get_registry()
    return registry.gemini.generate(prompt, system=system_prompt)

def route_prompt(prompt: str, context: str = "") -> dict:
    """Legacy shim — returns a routing decision dict."""
    task_type = classify_task(prompt)
    registry = get_registry()
    status = registry.health_status()

    if task_type == "simple" and status["ollama"]:
        engine = "Ollama"
    elif status["deepseek"]:
        engine = "DeepSeek"
    elif status["nvidia"]:
        engine = "Nvidia"
    else:
        engine = "Gemini"

    return {
        "complexity": task_type,
        "target_paths": [],
        "requires_cloud": engine != "Ollama",
        "reasoning": f"Rule-based classification: {task_type}",
        "routing_engine": engine,
    }
