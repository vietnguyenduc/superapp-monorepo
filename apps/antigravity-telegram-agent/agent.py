"""
agent.py
========
AntigravityAgent — Refactored to use unified multi-provider AI router.
Routing chain: Ollama (local, free) → DeepSeek → Gemini (cloud)
"""

import os
import json
import logging
import threading
import time
from concurrent.futures import ThreadPoolExecutor, TimeoutError as FuturesTimeoutError
from pathlib import Path
from typing import List, Dict, Any, Optional, Tuple

import tools
from core.ai_router import classify_task, run_agentic_loop, smart_generate
from core.provider_registry import get_registry
from core.task_state import get_task_state
from core.session_manager import get_session_manager, invalidate_session_manager

logger = logging.getLogger(__name__)

# Tools available to the agent (OpenAI-compatible schema)
LOCAL_TOOLS_SCHEMA = [
    {
        "type": "function",
        "function": {
            "name": "execute_command",
            "description": "Executes a PowerShell command in the active workspace and returns stdout/stderr.",
            "parameters": {
                "type": "object",
                "properties": {
                    "command": {"type": "string", "description": "The PowerShell command to run."}
                },
                "required": ["command"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "read_file",
            "description": (
                "Reads a file and returns its content. Auto-truncates at 300 lines to protect context. "
                "For files > 300 lines, prefer get_file_outline first, then read_file_lines for targeted sections."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "filepath": {"type": "string", "description": "Relative or absolute path to the file."}
                },
                "required": ["filepath"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "write_file",
            "description": (
                "Writes or overwrites a file entirely. Use for NEW files or complete rewrites. "
                "For targeted edits to EXISTING files, use patch_file instead (more efficient, safer)."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "filepath": {"type": "string", "description": "Path to the file."},
                    "content": {"type": "string", "description": "Full content to write."},
                },
                "required": ["filepath", "content"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "patch_file",
            "description": (
                "Surgically edit an existing file by replacing an exact string. "
                "PREFER over write_file for targeted changes. Works like Claude's str_replace_editor. "
                "old_str must match exactly (including indentation). Include 2-3 lines of context to ensure uniqueness."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "filepath": {"type": "string", "description": "Path to the file."},
                    "old_str": {"type": "string", "description": "Exact string to find and replace. Must be unique in the file. Include surrounding context lines."},
                    "new_str": {"type": "string", "description": "Replacement text."},
                    "expected_count": {"type": "integer", "description": "How many times old_str should appear (default 1).", "default": 1},
                },
                "required": ["filepath", "old_str", "new_str"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "list_directory",
            "description": "Lists files and subdirectories at the given path.",
            "parameters": {
                "type": "object",
                "properties": {
                    "dirpath": {"type": "string", "description": "Directory path to list (defaults to '.').", "default": "."}
                },
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "grep_code",
            "description": (
                "Search for a regex/literal pattern across source files using ripgrep. "
                "PREFER this over read_file when you need to: find where a function/hook/component is defined, "
                "locate all usages of a symbol, check imports, or understand a codebase quickly. "
                "Much more token-efficient than reading whole files."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "pattern": {"type": "string", "description": "Regex or literal string to search (e.g. 'useAuth', 'import.*router')."},
                    "path": {"type": "string", "description": "Subdirectory to search in. Default: '.' (workspace root).", "default": "."},
                    "include": {"type": "string", "description": "Comma-separated glob patterns to filter files (e.g. '*.tsx,*.ts'). Optional."},
                    "max_results": {"type": "integer", "description": "Max matches to return (default 40, max 200).", "default": 40},
                    "context_lines": {"type": "integer", "description": "Lines of context around each match (default 2).", "default": 2},
                },
                "required": ["pattern"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "semantic_search",
            "description": (
                "Search for a class or function definition across the workspace. "
                "Unlike grep_code, this parses the code structure (AST/regex) to find exactly "
                "where a function or class is DEFINED, skipping usages and imports."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {"type": "string", "description": "Name of the class or function to find."},
                    "dirpath": {"type": "string", "description": "Subdirectory to search in. Default: '.'", "default": "."}
                },
                "required": ["query"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_file_outline",
            "description": (
                "Extract structural outline of a file (imports, exports, function/class/type definitions with line numbers) "
                "WITHOUT loading the full content. Use this BEFORE read_file to understand file structure, "
                "then use read_file_lines to read only the relevant section. Supports .ts, .tsx, .js, .jsx, .py, .css, .json."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "filepath": {"type": "string", "description": "Path to the file (workspace-relative or monorepo-root-relative)."},
                },
                "required": ["filepath"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "manage_port",
            "description": (
                "Manage local system ports to avoid EADDRINUSE conflicts. "
                "Use 'find_free' to get an available port (e.g. 3001) before running dev servers. "
                "Use 'kill' to forcefully terminate whatever is running on a port."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "action": {
                        "type": "string", 
                        "enum": ["check", "find_free", "kill"],
                        "description": "The action to perform."
                    },
                    "port": {
                        "type": "integer",
                        "description": "The port number (optional for find_free)."
                    }
                },
                "required": ["action"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "read_browser_page",
            "description": (
                "Opens a URL in a headless browser and returns the text content and console errors. "
                "Use this to test if your Next.js or Flask app is running correctly on localhost."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "url": {"type": "string", "description": "The URL to visit (e.g. http://localhost:3000)."},
                    "delay": {"type": "integer", "description": "Delay in ms to wait for the page to load (default: 1000)."}
                },
                "required": ["url"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "click_element",
            "description": "Clicks an element on a webpage and returns the new page text and console errors.",
            "parameters": {
                "type": "object",
                "properties": {
                    "url": {"type": "string", "description": "The URL to visit before clicking."},
                    "selector": {"type": "string", "description": "Playwright selector for the element to click."},
                    "delay": {"type": "integer", "description": "Delay in ms to wait after clicking (default: 1000)."}
                },
                "required": ["url", "selector"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "take_screenshot",
            "description": "Takes a screenshot of the webpage and saves it to a file.",
            "parameters": {
                "type": "object",
                "properties": {
                    "url": {"type": "string", "description": "The URL to screenshot."},
                    "save_path": {"type": "string", "description": "Path to save the PNG image to."},
                    "delay": {"type": "integer", "description": "Delay in ms to wait for load."}
                },
                "required": ["url", "save_path"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "run_visual_audit",
            "description": "Runs a strict QA visual audit using Gemini Vision across Mobile, iPad, and Desktop viewports. It takes BOTH viewport-only AND full-page screenshots to analyze overall layout, gaps, and footer positions. Pass an array of URLs to audit multiple pages in one go.",
            "parameters": {
                "type": "object",
                "properties": {
                    "urls": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "Array of URLs to audit (e.g., ['http://localhost:5179/', 'http://localhost:5179/settings'])."
                    },
                    "url": {
                        "type": "string",
                        "description": "Fallback single URL if urls array is not provided."
                    },
                    "auth_click_selector": {
                        "type": "string",
                        "description": "Optional CSS/Text selector (e.g., 'text=Dùng thử' or '.btn-login') to click on the FIRST page to bypass login screens. Context is preserved across subsequent URLs!"
                    },
                    "delay": {"type": "integer", "description": "Delay in ms to wait for load."}
                },
                "required": [],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "read_file_lines",
            "description": (
                "Read a specific range of lines from a file (1-indexed, inclusive). "
                "Use AFTER get_file_outline to read only the relevant function/section "
                "instead of the entire file. Max 300 lines per call."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "filepath": {"type": "string", "description": "Path to the file."},
                    "start_line": {"type": "integer", "description": "First line to read (1-indexed)."},
                    "end_line": {"type": "integer", "description": "Last line to read (1-indexed, inclusive)."},
                },
                "required": ["filepath", "start_line", "end_line"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "record_lesson",
            "description": "Records a lesson, bug fix, or architectural rule into docs/agent_memory.md to prevent future mistakes.",
            "parameters": {
                "type": "object",
                "properties": {
                    "lesson": {"type": "string", "description": "The detailed lesson or rule to remember."}
                },
                "required": ["lesson"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "list_all_files",
            "description": (
                "Recursively list all files in the workspace in ONE call. "
                "Use this FIRST to understand project structure before reading individual files. "
                "Much more efficient than calling list_directory multiple times."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "path": {"type": "string", "description": "Root directory (default: workspace root '.').", "default": "."},
                    "max_depth": {"type": "integer", "description": "Directory depth to recurse (default 4).", "default": 4},
                    "include": {"type": "string", "description": "Comma-separated glob filters (e.g. '*.ts,*.tsx'). Optional."},
                    "exclude_dirs": {"type": "string", "description": "Comma-separated dir names to skip. Default: node_modules,.git,dist,build,.next"},
                },
            },
        },
    },
]

# Valid tool names — used for validation before execution
VALID_TOOLS = {t["function"]["name"] for t in LOCAL_TOOLS_SCHEMA}


class AntigravityAgent:
    def __init__(self):
        self.projects_dir = Path(__file__).parent / "projects"
        self.projects_dir.mkdir(exist_ok=True)
        self.global_vault_dir = self.projects_dir / "global_vault"
        self.global_vault_dir.mkdir(exist_ok=True)
        self.scraper_storage = Path(__file__).parent.parent.parent / "super-scraper" / "storage" / "refined_data"

        self.system_instruction = (
            "You are Antigravity, an elite Tech Lead & AI Project Manager remote vibe-coding the user's monorepo.\n"
            "You run 24/7 and receive instructions directly via Telegram.\n\n"

            "═══════════════════════════════════════════════════════\n"
            "📜 HIẾN PHÁP DỰ ÁN — KIM CHỈ NAM BẤT DI BẤT DỊCH\n"
            "═══════════════════════════════════════════════════════\n\n"

            "NGUYÊN TẮC I — Xây Đúng Hơn Sửa Đúng:\n"
            "  • Build right > Fix right. Nền móng sai → mọi thứ trên đó lung lay, sửa cái này hỏng cái kia.\n"
            "  • Simplicity wins. Giải pháp đơn giản nhất giải quyết được bài toán là giải pháp tốt nhất.\n"
            "  • Sustainability over cleverness. Code phải dễ đọc, dễ sửa — 6 tháng sau vẫn hiểu ngay.\n"
            "  • Pragmatic, not perfectionist. Ship được, chạy được, đo được — rồi mới refine.\n"
            "  • NEVER patch over a wrong foundation. Nếu gốc sai → rebuild, không workaround.\n"
            "  • NEVER add complexity to solve problems created by existing complexity.\n"
            "  • Checklist trước khi code: (1) 6 tháng sau có dễ hiểu không? (2) Nếu hỏng có dễ isolate không? (3) Có đang workaround design sai không?\n\n"

            "NGUYÊN TẮC II — Testing Là Nghệ Thuật & Điểm Mạnh Nhất:\n"
            "  Testing phải phối hợp agentic, có plan rõ ràng, test 5 chiều:\n"
            "  • Spec: User cần gì? Journey của họ là gì?\n"
            "  • Flow: Họ thao tác từng bước như thế nào?\n"
            "  • UI/UX: Họ có làm được không? Dùng /browser snapshot + OCR analysis\n"
            "  • Function: Khi bấm vào, mọi thứ chạy đúng không? Console check, click test, debug\n"
            "  • Data: Dữ liệu chính xác, đủ, đúng schema? Migration + Supabase query + RLS\n"
            "  NEVER consider a feature 'done' nếu chưa test ít nhất UI + Function + Data.\n"
            "  NEVER test chỉ bằng đọc code — phải chạy thực tế với evidence (screenshot, log, query).\n\n"
            
            "NGUYÊN TẮC KIỂM TRA UI/UX BẰNG THỊ GIÁC (MẮT THẦN):\n"
            "  - BẠN BỊ CẤM tuyệt đối việc tự dùng terminal để chạy thủ công các script chụp ảnh (ví dụ: `node screenshot_all.mjs`), tự khởi động server, hoặc dùng vòng lặp ping/curl để test.\n"
            "  - Khi User yêu cầu kiểm tra UI/UX, đánh giá giao diện, hoặc \"chụp ảnh màn hình lại\", bạn PHẢI gọi TRỰC TIẾP native tool `run_visual_audit`.\n"
            "  - Tool `run_visual_audit` đã được tối ưu hóa để tự động start server, chụp ảnh trên 3 thiết bị (Desktop, Mobile, iPad), mô phỏng cuộn trang, gọi Gemini OCR/Vision, và tự động tắt server, tất cả chỉ trong 1 turn duy nhất.\n\n"

            "NGUYÊN TẮC III — Hot-Patching Là Phải Validate:\n"
            "  • Khi sửa một biến (variable) hoặc refactor hệ thống đang chạy ngầm (hot-patch), BẮT BUỘC phải chạy `python -m py_compile`.\n"
            "  • TẤT CẢ CÁC LỆNH Sửa-lỗi gây ra \"NameError\" cần phải grep search toàn bộ tập tin để thẩm định lại trước khi Khởi Động lại.\n"
            "  • Never say 'Xong rồi' tới User mà không tiến hành Pre-flight Syntax Check & Lint Check.\n\n"

            "NGUYÊN TẮC IV — SELF-HEALING & MEMORY:\n"
            "  - Mỗi hàm sửa file (write_file/patch_file) đều sẽ Tự động kiểm tra cú pháp (Syntax Validation). Nếu có lỗi, ĐỪNG trả lời 'Xong rồi', bạn PHẢI sửa lỗi cho đúng ngay lập tức.\n"
            "  - Khi bạn hoặc User tìm ra một Bug phức tạp, PHẢI dùng tool `record_lesson` để ghi lại vào agent_memory.md để các turn sau không mắc lỗi.\n\n"

            "═══════════════════════════════════════════════════════\n\n"

            "Guidelines:\n"
            "1. Act as an elite senior software architect—direct, precise, highly technical.\n"
            "2. NEVER apologize or claim that you cannot inspect the workspace, access files, check ports, run servers, or query databases (like Supabase DB). You are equipped with 100% full, unrestricted local terminal and file access through your local tools (execute_command, read_file, write_file, list_directory).\n"
            "3. CRITICAL ON SUPABASE / DATABASE OPERATIONS: You do NOT need any 'service_role_key', high-privilege keys, database passwords, or access tokens to run migrations, query the database, or list tables! The local Supabase CLI is already fully integrated with the Antigravity SDK and linked to the active project. You can run any database command or migration directly via `execute_command` (e.g., using `npx supabase db query --file filepath` or executing a custom Node/Python script). Execute immediately without asking the user for passwords, tokens, or keys!\n"
            "4. Execute tool calls immediately when needed—be proactive! If the user asks you to write code, inspect files, check if a process is running, run a database query, or run a test, immediately execute the appropriate tool instead of asking for permission, complaining about missing access/credentials, or explaining how the user can do it themselves.\n"
            "5. Reference only files grounded in the active project vault or workspace.\n"
            "6. Warn about code smells, suggest structural improvements, write production-grade code.\n"
            "7. Keep Telegram responses concise—use bullet points, code blocks, and clear formatting. Avoid unnecessary pleasantries.\n"
            "8. CRITICAL ON FORMATTING: When presenting tabular data (like test results, task lists), ALWAYS format it as a standard Markdown table (using `|---|` syntax). Telegram and the Web UI now fully support standard Markdown tables. DO NOT use ASCII-art tables inside triple backticks anymore.\n"
            "9. CRITICAL ON PORTS & SERVERS: Whenever you need to start a dev server (e.g., Vite, Next.js, Express), YOU MUST do 2 things: (a) Explicitly kill any existing zombie processes on that port FIRST. (b) NEVER start the server synchronously (which blocks your execution loop forever). You MUST run it as a background task. If using execute_command, you MUST use this exact format: `Start-Process cmd -ArgumentList \"/c npx vite --port 5180 --host\" -WindowStyle Hidden`. This is the ONLY way to start a server on Windows without blocking the agent. DO NOT pipe output to `| head` to 'preview' it because the server won't exit when the pipe closes on Windows and will hang your terminal.\n"
            "10. If unsure about a file path, use list_directory first before reading.\n"
            "11. NEVER invent file paths that don't exist. Use tools to verify first.\n"
            "12. CRITICAL ON MCP (Model Context Protocol): To interact with MCP Servers (like Supabase, AlphaFold, etc.), DO NOT try to run manual terminal commands like 'npx supabase' which might fail locally. Instead, ALWAYS use the provided MCP Bridge. Execute it via `execute_command` using this exact syntax:\n"
            "   `python ../antigravity-telegram-agent/tool_scripts/mcp_bridge.py --server \"npx -y @supabase/mcp-server-supabase\" --tool \"<tool_name>\" --args \"{\\\"param\\\": \\\"value\\\"}\"`\n"
            "   Lưu ý: Supabase MCP yêu cầu biến môi trường SUPABASE_ACCESS_TOKEN. Nếu gặp lỗi thiếu token, hãy thông báo cho user thiết lập biến môi trường này.\n"
            "   Wait for the JSON response. Do NOT invent a command called 'npx antigravity'.\n"
            "13. CRITICAL — PATH CONVENTION FOR list_directory / read_file / write_file:\n"
            "    The tools' working directory (CWD) is ALREADY set to the ACTIVE WORKSPACE folder (e.g. 'apps/inventory-operation').\n"
            "    Therefore, when calling list_directory or read_file, use paths RELATIVE TO THE ACTIVE WORKSPACE:\n"
            "      ✅ CORRECT: list_directory('src/pages')  — relative to active workspace\n"
            "      ✅ CORRECT: list_directory('.')           — lists active workspace root\n"
            "      ❌ WRONG:   list_directory('apps/inventory-operation/src/pages') — this double-prefixes the path!\n"
            "    BOTH styles are actually supported (the tool auto-corrects monorepo-root paths), but ALWAYS prefer\n"
            "    the short workspace-relative form. For execute_command, the CWD is also the active workspace,\n"
            "    so you can use relative paths in shell commands too (e.g. `cat src/index.tsx` not `cat apps/inventory-operation/src/index.tsx`).\n"
            "12. REASONING & TOOL PROTOCOL — Prioritize Specific Tools Over General Shell Commands:\n"
            "    - ALWAYS prioritize specific native tools (read_file, grep_search, list_directory, patch_file) over running terminal shell commands.\n"
            "    - ACTIVELY avoid using terminal commands like 'cat', 'grep', 'ls', and 'sed' inside execute_command unless no native tool is available.\n"
            "    - Reason critically about your tool choices before execution. Choose the most direct, targeted action to minimize token usage and latency.\n"
            "    - STEP 1 — ORIENT: Call list_all_files() or list_directory() once to understand project structure. Skip if already done.\n"
            "    - STEP 2 — SEARCH: Use grep_search() to find relevant symbols, usages, imports. Do NOT read files blindly.\n"
            "    - STEP 3 — OUTLINE: Use get_file_outline() on files you need to understand. Read their structure first.\n"
            "    - STEP 4 — READ: Use read_file_lines(start, end) for specific sections identified in the outline.\n"
            "    - STEP 5 — ACT: Use patch_file() for targeted edits to existing files. Use write_file() ONLY for new files.\n"
            "    TOOL PRIORITY: list_all_files > grep_search > get_file_outline > read_file_lines > read_file > list_directory.\n"
            "    read_file is auto-truncated at 300 lines. For large files always prefer the outline+lines workflow.\n"
            "13. INTERACTIVE PROMPTS & SHELL COMMANDS (CRITICAL):\n"
            "    - You DO NOT have an interactive terminal. You CANNOT type 'yes', 'y', or press Enter after a command starts.\n"
            "    - NEVER run commands that block and wait for user input (e.g. `npm init` without `-y`, or `rm` without `-Force`).\n"
            "    - ALWAYS use flags like `-y`, `--yes`, `--force`, or pipe `echo y |` to bypass interactive prompts.\n"
            "14. EDITING PROTOCOL:\n"
            "    ✅ patch_file: for ALL edits to existing files (change a function, fix a bug, update a value)\n"
            "    ✅ write_file: ONLY for creating new files from scratch\n"
            "    ❌ NEVER use write_file to edit an existing file (risk of overwriting/losing code)\n"
            "14. PLANNING & EXECUTION PROTOCOL (CRITICAL FOR COMPLEX TASKS):\n"
            "    When the user requests a complex task (e.g. refactoring, creating new features, database/middleware design, etc.):\n"
            "    - Phase 1: RESEARCH & PLAN (Planning Mode):\n"
            "      * ONLY use read-only tools (grep_search, list_all_files, get_file_outline, read_file_lines, read_file, list_directory).\n"
            "      * DO NOT write or edit source code files or run modifying terminal commands yet.\n"
            "      * Create a detailed 'implementation_plan.md' in the active workspace root detailing proposed changes, target files, and verification steps.\n"
            "      * Present the plan's structured summary in Vietnamese to the user via Telegram.\n"
            "      * Ask explicitly for the user's approval: 'Vui lòng phản hồi \"ok\" hoặc \"tiếp tục\" để duyệt và bắt đầu thực hiện.'\n"
            "      * Immediately stop calling tools and end the turn, waiting for user response.\n"
            "    - Phase 2: EXECUTION & VERIFICATION (Execution Mode):\n"
            "      * Once the user replies with a continuation trigger (ok, tiếp tục, đồng ý), read the 'implementation_plan.md' to orient yourself.\n"
            "      * Create 'task.md' in the workspace to track steps.\n"
            "      * Execute the code-modifying tools (patch_file, write_file, execute_command) to implement the changes step-by-step.\n"
            "      * Verify the work using testing/building commands.\n"
            "      * Update 'task.md' as you progress, and write 'walkthrough.md' when complete."
        )

    # ─── Project Management ───────────────────────────────────────────────────

    def get_active_project(self) -> str:
        """Retrieves the active project ID from state file."""
        state_file = Path(__file__).parent / "active_project.json"
        if state_file.exists():
            try:
                state = json.loads(state_file.read_text(encoding="utf-8"))
                return state.get("active_project") or "default"
            except Exception:
                pass
        return "default"

    def set_active_project(self, project_id: str):
        state_file = Path(__file__).parent / "active_project.json"
        state_file.write_text(json.dumps({"active_project": project_id}), encoding="utf-8")

    def get_project_paths(self, project_id: str = None):
        """Returns (vault_dir, history_file) for the given project."""
        if not project_id:
            project_id = self.get_active_project()
        project_dir = self.projects_dir / project_id
        project_dir.mkdir(parents=True, exist_ok=True)
        vault_dir = project_dir / "vault"
        vault_dir.mkdir(parents=True, exist_ok=True)
        history_file = project_dir / "history.json"
        return vault_dir, history_file

    def run_multi_agent_planning(
        self,
        user_message: str,
        vault_context: str,
        workspace_cwd_note: str,
        on_progress=None,
        force_provider: str = None,
    ) -> str:
        """
        Executes a Multi-Agent Collaborative Planning Pipeline:
        Product Spec -> Architecture -> Database -> UI/UX -> QA/QE -> Tech Lead (R1 Compiler).
        """
        logger.info(f"[MultiAgent] Starting planning pipeline for: {user_message[:50]}...")
        
        # We need a fallback chain or target model for the compiler.
        compiler_provider = force_provider if force_provider else "deepseek-r1"

        # Initialize progress checklist text
        status_lines = [
            "🧠 *Hội đồng AI đang họp bàn thiết kế giải pháp...*",
            "",
            "⏳ 📋 `[Product Spec]` -> Đang chuẩn bị...",
            "⏳ 🔄 `[Flow]` -> Đang chuẩn bị...",
            "⏳ 📐 `[Architecture]` -> Đang chuẩn bị...",
            "⏳ 🗄️ `[Database]` -> Đang chuẩn bị...",
            "⏳ 🎨 `[UI/UX]` -> Đang chuẩn bị...",
            "⏳ 🛠 `[QA/QE]` -> Đang chuẩn bị...",
            "⏳ 👑 `[Tech Lead]` -> Đang chuẩn bị...",
        ]
        
        def update_status(index: int, state: str):
            """Helper to update a specific agent status line and notify UI."""
            agent_names = ["Product Spec", "Flow", "Architecture", "Database", "UI/UX", "QA/QE", "Tech Lead"]
            icons = {"running": "⚙️", "done": "✅", "waiting": "⏳"}
            
            icon = icons.get(state, "⏳")
            action = "Đang xử lý..." if state == "running" else ("Hoàn tất" if state == "done" else "Đang chuẩn bị...")
            
            agent_prefixes = ["📋", "🔄", "📐", "🗄️", "🎨", "🛠", "👑"]
            prefix = agent_prefixes[index]
            name = agent_names[index]
            
            status_lines[index + 2] = f"{icon} {prefix} `[{name}]` -> {action}"
            if on_progress:
                on_progress("\n".join(status_lines))

        # Show initial state
        if on_progress:
            on_progress("\n".join(status_lines))

        # Context wrapper
        base_prompt = (
            f"=== Yêu cầu của người dùng ===\n{user_message}\n\n"
            f"=== Bối cảnh dự án (Vault & Workspace) ===\n{vault_context}\n\n{workspace_cwd_note}"
        )

        agent_responses = {}

        # 1. Product Spec Agent
        update_status(0, "running")
        try:
            prod_prompt = (
                f"{base_prompt}\n\n"
                f"Nhiệm vụ của bạn: Đóng vai trò là Senior Product Manager. Hãy phân tích yêu cầu nghiệp vụ của người dùng, "
                f"làm rõ luồng nghiệp vụ chính, các trường hợp nghiệp vụ biên, và mô tả tác động sản phẩm dưới dạng User Story. "
                f"Trả lời ngắn gọn, trực diện và bằng tiếng Việt."
            )
            resp, _ = smart_generate(prod_prompt, system="You are a Product Spec Agent.", task_type="medium")
            agent_responses["product"] = resp
            update_status(0, "done")
        except Exception as e:
            logger.error(f"[MultiAgent] Product Spec failed: {e}")
            agent_responses["product"] = f"Lỗi phân tích nghiệp vụ: {e}"
            status_lines[2] = f"❌ 📋 `[Product Spec]` -> Lỗi: {str(e)[:40]}"

        # 2. Flow Agent
        update_status(1, "running")
        try:
            flow_prompt = (
                f"{base_prompt}\n\n"
                f"Nhiệm vụ của bạn: Đóng vai trò là Lead System & Interaction Flow Architect. "
                f"Đặc biệt, hãy đóng vai trò là người dùng cuối để hình dung và thiết lập một luồng trải nghiệm sử dụng thực tế (User Experience Flow) "
                f"sao cho cực kỳ tiện lợi, mượt mà và trực quan. Hãy phản biện và challenge lại các Agent khác (như UI/UX hoặc Architect) "
                f"nếu họ thiết kế thiếu sót hoặc bất tiện (ví dụ: các nút bấm hoặc thao tác kích hoạt như cào data nằm ở đâu, người dùng phải "
                f"thao tác thế nào cho tối ưu, tránh click chuột/gõ phím rườm rà). Phác thảo rõ luồng xử lý dữ liệu, sequence flow dạng text, "
                f"user journey flow, các API endpoints và logic Backend/Frontend tương ứng. Trả lời bằng tiếng Việt."
            )
            resp, _ = smart_generate(flow_prompt, system="You are a System Flow Architect Agent.", task_type="medium")
            agent_responses["flow"] = resp
            update_status(1, "done")
        except Exception as e:
            logger.error(f"[MultiAgent] Flow Agent failed: {e}")
            agent_responses["flow"] = f"Lỗi thiết kế luồng xử lý: {e}"
            status_lines[3] = f"❌ 🔄 `[Flow]` -> Lỗi: {str(e)[:40]}"

        # 3. Architecture Agent
        update_status(2, "running")
        try:
            arch_prompt = (
                f"{base_prompt}\n\n"
                f"Nhiệm vụ của bạn: Đóng vai trò là Software Architect. Dựa trên bối cảnh dự án ở trên, hãy vạch ra cấu trúc "
                f"các thư mục/file sẽ bị ảnh hưởng, các import/export cần bổ sung, luồng dữ liệu giữa các thành phần và "
                f"các thư viện/package sẽ sử dụng. Trả lời bằng tiếng Việt."
            )
            resp, _ = smart_generate(arch_prompt, system="You are a Software Architect Agent.", task_type="medium")
            agent_responses["architecture"] = resp
            update_status(2, "done")
        except Exception as e:
            logger.error(f"[MultiAgent] Architecture failed: {e}")
            agent_responses["architecture"] = f"Lỗi thiết kế cấu trúc: {e}"
            status_lines[4] = f"❌ 📐 `[Architecture]` -> Lỗi: {str(e)[:40]}"

        # 4. Database Agent
        update_status(3, "running")
        try:
            db_prompt = (
                f"{base_prompt}\n\n"
                f"Nhiệm vụ của bạn: Đóng vai trò là Principal Database Engineer. Hãy rà soát cấu trúc database của dự án "
                f"và đề xuất các bảng mới cần tạo, các trường dữ liệu (columns), kiểu dữ liệu (types), khóa ngoại (foreign keys), "
                f"hoặc các index/migration cần viết để phục vụ yêu cầu. Trả lời bằng tiếng Việt."
            )
            resp, _ = smart_generate(db_prompt, system="You are a Database Engineer Agent.", task_type="medium")
            agent_responses["database"] = resp
            update_status(3, "done")
        except Exception as e:
            logger.error(f"[MultiAgent] Database failed: {e}")
            agent_responses["database"] = f"Lỗi thiết kế database: {e}"
            status_lines[5] = f"❌ 🗄️ `[Database]` -> Lỗi: {str(e)[:40]}"

        # 5. UI/UX Agent
        update_status(4, "running")
        try:
            ui_prompt = (
                f"{base_prompt}\n\n"
                f"Nhiệm vụ của bạn: Đóng vai trò là Lead UI/UX Designer. Hãy thiết kế giao diện (UI) và trải nghiệm người dùng (UX) "
                f"cho tính năng này. Định hình bố cục (layout), cách phân bổ màu sắc (như dark mode, glassmorphism), hành vi tương tác "
                f"(loading, hover, animations) và đảm bảo chuẩn UX responsive trên thiết bị di động. Trả lời bằng tiếng Việt."
            )
            resp, _ = smart_generate(ui_prompt, system="You are a UI/UX Designer Agent.", task_type="medium")
            agent_responses["ui"] = resp
            update_status(4, "done")
        except Exception as e:
            logger.error(f"[MultiAgent] UI/UX failed: {e}")
            agent_responses["ui"] = f"Lỗi thiết kế UI/UX: {e}"
            status_lines[6] = f"❌ 🎨 `[UI/UX]` -> Lỗi: {str(e)[:40]}"

        # 6. QA/QE Agent
        update_status(5, "running")
        try:
            qa_prompt = (
                f"{base_prompt}\n\n"
                f"Nhiệm vụ của bạn: Đóng vai trò là Lead QA Engineer. Hãy vạch ra kịch bản kiểm thử (test cases), các trường hợp biên "
                f"(edge cases), dữ liệu kiểm thử giả định và danh sách checklist kiểm thử tự động/thủ công để đảm bảo chất lượng code sau khi thực thi. Trả lời bằng tiếng Việt."
            )
            resp, _ = smart_generate(qa_prompt, system="You are a QA Engineer Agent.", task_type="medium")
            agent_responses["qa"] = resp
            update_status(5, "done")
        except Exception as e:
            logger.error(f"[MultiAgent] QA/QE failed: {e}")
            agent_responses["qa"] = f"Lỗi thiết kế kịch bản test: {e}"
            status_lines[7] = f"❌ 🛠 `[QA/QE]` -> Lỗi: {str(e)[:40]}"

        # 7. Tech Lead Compiler (R1/Gemini Pro)
        update_status(6, "running")
        try:
            compiler_prompt = (
                f"=== YAu c u c a ng?i dA1ng ===\n{user_message}\n\n"
                f"=== Ý KIẾN PHẢN BIỆN CỦA CÁC CHUYÊN GIA ===\n\n"
                f"--- 1. Nghiệp vụ sản phẩm (Product Spec) ---\n{agent_responses.get('product')}\n\n"
                f"--- 2. Luồng xử lý nghiệp vụ (System & Interaction Flow) ---\n{agent_responses.get('flow')}\n\n"
                f"--- 3. Kiến trúc & Cấu trúc (Architecture) ---\n{agent_responses.get('architecture')}\n\n"
                f"--- 4. Thiết kế Cơ sở dữ liệu (Database) ---\n{agent_responses.get('database')}\n\n"
                f"--- 5. Giao diện & Tương tác (UI/UX) ---\n{agent_responses.get('ui')}\n\n"
                f"--- 6. Đảm bảo chất lượng & Kiểm thử (QA/QE) ---\n{agent_responses.get('qa')}\n\n"
                f"Nhiệm vụ của bạn: Đóng vai trò là Tech Lead & AI Project Manager. "
                f"Hãy tổng hợp ý kiến phản biện của các chuyên gia ở trên và soạn thảo một bản kế hoạch thực thi "
                f"chi tiết cuối cùng bằng tiếng Việt. Bản kế hoạch phải có định dạng Markdown chuẩn, bắt đầu bằng tiêu đề lớn: "
                f"# Kế hoạch thực hiện: <Tên tính năng>\n\n"
                f"Bản kế hoạch phải phân bổ rõ ràng các file cần [NEW], [MODIFY], [DELETE], mô tả chi tiết giải pháp, "
                f"và các bước tự động kiểm thử / kiểm thử thủ công.\n"
                f"Cuối cùng, hãy đưa ra câu hỏi mở cần thảo luận thêm (nếu có) và kết luận bằng câu chính xác: "
                f"'Vui lòng phản hồi \"ok\" hoặc \"tiếp tục\" để duyệt và bắt đầu thực hiện.'"
            )
            
            # Request R1 compiler
            resp, _ = smart_generate(
                compiler_prompt, 
                system="You are the Tech Lead Compiler.", 
                force_provider=compiler_provider
            )
            update_status(6, "done")
            
            # Automatically save generated plan to implementation_plan.md in workspace root
            try:
                from tools import get_active_workspace
                workspace_path = get_active_workspace()
                plan_file = workspace_path / "implementation_plan.md"
                plan_file.write_text(resp, encoding="utf-8")
                logger.info(f"[MultiAgent] Plan automatically written to {plan_file}")
            except Exception as save_err:
                logger.error(f"[MultiAgent] Failed to write plan file: {save_err}")
                
            return resp
            
        except Exception as e:
            logger.error(f"[MultiAgent] Tech Lead compilation failed: {e}")
            status_lines[8] = f"❌ 👑 `[Tech Lead]` -> Lỗi: {str(e)[:40]}"
            if on_progress:
                on_progress("\n".join(status_lines))
            raise e

    # ─── Main Entry Point ─────────────────────────────────────────────────────

    def run_agent_turn(
        self,
        user_message: str,
        chat_history: List[Dict[str, Any]] = None,
        on_progress=None,
        on_thinking=None,
        force_provider: str = None,
        cancellation_event: Optional[threading.Event] = None,
    ) -> Tuple[str, str]:
        """
        Runs one conversation turn.
        Returns (response_text, provider_name_used).
        """
        if chat_history is None:
            chat_history = []
            
        import core.settings as settings
        s = settings.load_settings()
        goal_limit = s.get("goal_max_requests", 100)

        active_project_id = self.get_active_project()
        vault_dir, _ = self.get_project_paths(active_project_id)
        vault_context = self._get_vault_context(vault_dir)

        # Load task state for this project (persisted across 10-turn limit boundaries)
        project_dir = self.projects_dir / active_project_id
        project_dir.mkdir(parents=True, exist_ok=True)
        task_state = get_task_state(active_project_id, project_dir)

        # Check if special modes are explicitly triggered
        msg_lower = user_message.lower().strip()
        explicit_plan = msg_lower.startswith("/plan")
        is_goal = msg_lower.startswith("/goal")
        is_teamwork = msg_lower.startswith("/teamwork")
        is_schedule = msg_lower.startswith("/schedule")
        is_browser = msg_lower.startswith("/browser")
        is_grill = msg_lower.startswith("/grill")
        
        # Strip prefixes if present
        if explicit_plan: user_message = user_message[5:].strip()
        if is_goal: user_message = user_message[5:].strip()
        if is_teamwork: user_message = user_message[9:].strip()
        if is_schedule: user_message = user_message[9:].strip()
        if is_browser: user_message = user_message[8:].strip()
        if is_grill: user_message = user_message[6:].strip()
        
        msg_lower = user_message.lower().strip()

        # Classify task before building the full prompt
        task_type = classify_task(user_message)

        # Define planning keywords
        planning_keywords = [
            "hãy code lại", "code lại", "refactor", "viết tính năng", 
            "thêm tính năng", "sửa lỗi cấu trúc", "thiết kế lại",
            "implement feature", "tạo bảng", "thiết kế database"
        ]
        
        has_planning_keyword = any(kw in msg_lower for kw in planning_keywords)
        
        # Auto-trigger planning ONLY if:
        # 1. It contains planning keywords AND
        # 2. It is not classified as "simple" AND
        # 3. It is either "heavy" OR has a substantial length (e.g. >= 70 characters)
        # This prevents short/simple/conversational inputs (like "hello", "thêm tính năng" on its own) from running the entire agent pipeline.
        auto_plan = (
            has_planning_keyword and 
            task_type != "simple" and 
            (task_type == "heavy" or len(msg_lower) >= 70)
        )
        
        is_plan_requested = explicit_plan or auto_plan

        # Grounding with relevant memories / standards from Memory Vault (local NotebookLM)
        try:
            from core.memory_vault import get_relevant_memories
            memories_context = get_relevant_memories(user_message)
        except Exception as err:
            logger.error(f"Error loading memories context: {err}")
            memories_context = ""

        # Check if the user message is a continuation trigger to prevent repetition loops
        # ONLY explicit trigger words count — short messages like 'xin chao', 'hi' must NOT trigger this
        continuation_triggers = {
            "ok", "tiếp tục", "continue", "chạy tiếp đi", "ok xử lý",
            "xử lý", "go ahead", "tiếp", "run", "yes", "y", "done", "next",
            "ok tiếp", "tiếp đi", "làm tiếp", "xong rồi", "bước tiếp theo",
        }
        msg_lower = user_message.lower().strip()        # Detect if user pasted back a bot report (contains table markers or pending keywords)
        pasted_report_keywords = [
            "chưa hoàn thành", "pending", "bước tiếp theo", "## ❌",
            "| # | việc |", "| 1 |", "lý do |", "đã hoàn thành",
            "đạt giới hạn", "⚠️ cảnh báo",
        ]
        is_pasted_report = any(kw in msg_lower for kw in pasted_report_keywords)

        # FIXED: Only exact trigger words count — NOT short messages
        is_simple_continuation = msg_lower in continuation_triggers
        is_continuation = is_simple_continuation or (is_pasted_report and task_state.is_active())

        # Auto-expire stale task journals older than 2 hours
        if task_state.is_active() and not is_continuation:
            try:
                from datetime import datetime, timezone
                updated_at_str = task_state._state.get("updated_at", "")
                if updated_at_str:
                    updated_at = datetime.fromisoformat(updated_at_str)
                    # Make timezone-aware if naive
                    if updated_at.tzinfo is None:
                        updated_at = updated_at.replace(tzinfo=timezone.utc)
                    age_hours = (datetime.now(timezone.utc) - updated_at).total_seconds() / 3600
                    if age_hours > 2:
                        logger.info(f"[Agent] Task journal expired (age={age_hours:.1f}h). Auto-clearing.")
                        task_state.clear()
            except Exception as exp_err:
                logger.warning(f"[Agent] Journal expiry check failed: {exp_err}")

        # Hook: Trigger Multi-Agent collaborative planning pipeline if planning is requested and it's a new task
        if not is_continuation and is_plan_requested:
            try:
                # Inject CWD note
                try:
                    from tools import get_active_workspace
                    workspace_path = get_active_workspace()
                    workspace_cwd_note = (
                        f"\n=== Tool CWD (Active Workspace) ===\n"
                        f"Absolute path: {workspace_path}\n"
                        f"Relative to monorepo root: {workspace_path.relative_to(workspace_path.parents[2]).as_posix()}\n"
                    )
                except Exception:
                    workspace_cwd_note = ""

                # Start task state tracking
                if len(user_message.strip()) > 20:
                    task_state.start_task(f"[Plan] {user_message}")

                plan_reply = self.run_multi_agent_planning(
                    user_message=user_message,
                    vault_context=vault_context,
                    workspace_cwd_note=workspace_cwd_note,
                    on_progress=on_progress,
                    force_provider=force_provider,
                )
                
                # Update task state progress with the plan
                task_state.update_progress(plan_reply, ["Duyệt kế hoạch của Hội đồng AI"])
                
                # Return final response
                return plan_reply, force_provider if force_provider else "multi-agent-planning"
            except Exception as e:
                logger.error(f"Failed to run multi-agent planning: {e}", exc_info=True)
                return f"❌ *Gặp lỗi khi lập kế hoạch bằng Hội đồng AI*: {e}", "none"

        if is_continuation and task_state.is_active():
            continuation_context = task_state.get_context_for_continuation()
            guidance = (
                "\n\n⚠️ *CRITICAL SYSTEM INSTRUCTION (CONTINUATION MODE):* "
                "This is a task resumption. The task journal above shows everything already done. "
                "DO NOT repeat completed steps. DO NOT re-check files or paths already verified. "
                "Continue DIRECTLY from the first pending step in the journal. "
                "If all pending steps are done, tell the user the task is complete."
            )
        elif is_continuation:
            # No active task in journal — fall back to generic continuation guidance
            continuation_context = ""
            guidance = (
                "\n\n⚠️ *CRITICAL SYSTEM INSTRUCTION:* This is a conversation continuation. "
                "Do NOT repeat your previous answers, explanations, or identical text. "
                "Acknowledge the continuation, check if there are next steps to perform or files to analyze, and proceed dynamically."
            )
        else:
            # New task — start fresh task state tracking
            continuation_context = ""
            if is_goal:
                guidance = (
                    "\n\n⚠️ *SYSTEM DIRECTIVE (AUTONOMOUS GOAL MODE ACTIVE):*\n"
                    "You are in Autonomous Goal Mode. You must NOT stop until the user's ultimate goal is 100% complete. "
                    "If you encounter an error, you must SELF-CORRECT and retry. "
                    "DO NOT ask the user for permission to proceed to the next step. "
                    "Execute all necessary tools repeatedly until the task is definitively resolved."
                )
            elif is_teamwork:
                guidance = (
                    "\n\n⚠️ *SYSTEM DIRECTIVE (MULTI-AGENT TEAMWORK ACTIVE):*\n"
                    "You must act as the Master Architect. Break down the user's task into independent parallel components. "
                    "Define a plan assigning specific roles to sub-agents (e.g. Frontend Agent, Backend Agent, QA Agent). "
                    "Do NOT write the code yourself. Instead, output a clear delegation plan outlining what each sub-agent will do."
                )
            elif is_schedule:
                guidance = (
                    "\n\n⚠️ *SYSTEM DIRECTIVE (SCHEDULING ACTIVE):*\n"
                    "The user wants to schedule a task or run a cronjob. "
                    "Please parse the scheduling requirement and confirm you will run the task at the requested time. "
                    "Use your available scheduling mechanism or note the cron frequency."
                )
            elif is_browser:
                guidance = (
                    "\n\n⚠️ *SYSTEM DIRECTIVE (BROWSER AUTOMATION ACTIVE):*\n"
                    "The user requested to use the browser. "
                    "Use `read_browser_page`, `click_element`, and `take_screenshot` tools to accomplish the task. "
                    "Do NOT guess the page content. ALWAYS use the browser tools to read the live site."
                )
            elif is_grill:
                guidance = (
                    "\n\n⚠️ *SYSTEM DIRECTIVE (INTERACTIVE GRILL MODE ACTIVE):*\n"
                    "You are now the Technical Interviewer/Architect. "
                    "DO NOT write code yet. Instead, ask the user 3-5 hard, specific, and penetrating questions "
                    "about edge cases, architecture, scale, and exact requirements. "
                    "Wait for the user's answers before proposing any solution."
                )
            elif is_plan_requested:
                guidance = (
                    "\n\n⚠️ *SYSTEM DIRECTIVE (FORCE PLANNING MODE ACTIVE):*\n"
                    "This task requires planning. You MUST enter Phase 1 (RESEARCH & PLAN) of the PLANNING & EXECUTION PROTOCOL:\n"
                    "1. ONLY use read-only tools to investigate. Do NOT make code modifications.\n"
                    "2. Create the 'implementation_plan.md' file.\n"
                    "3. Ask the user for approval.\n"
                    "4. Immediately stop calling tools and end this turn."
                )
            else:
                guidance = ""
            if len(user_message.strip()) > 20:  # Only track substantive tasks
                task_state.start_task(user_message)


        # Inject workspace path so AI always knows its CWD
        try:
            from tools import get_active_workspace
            workspace_path = get_active_workspace()
            workspace_cwd_note = (
                f"\n=== Tool CWD (Active Workspace) ===\n"
                f"Absolute path: {workspace_path}\n"
                f"Relative to monorepo root: {workspace_path.relative_to(workspace_path.parents[2]).as_posix()}\n"
                f"Use SHORT relative paths in list_directory/read_file/write_file — e.g. 'src/pages' not 'apps/{active_project_id}/src/pages'"
            )
        except Exception:
            workspace_cwd_note = ""

        # ── Session-Aware Context Budget Management ─────────────────────────
        # Uses SessionManager (HCC) to proactively compress history when needed.
        # Thresholds: 60% WARN → 80% COMPRESS → 95% EMERGENCY
        _, history_file = self.get_project_paths(active_project_id)
        session_mgr = get_session_manager(history_file, active_project_id)

        effective_history, budget_advice, session_mode, pct_used = session_mgr.get_effective_history(
            raw_history=chat_history or [],
            system_instruction=self.system_instruction,
            vault_context=vault_context,
            memories_context=memories_context,
            workspace_cwd_note=workspace_cwd_note,
            user_message=user_message,
            continuation_context=continuation_context,
        )

        # Build handoff context block (non-empty in compress/emergency modes)
        handoff_context = session_mgr.build_handoff_context()

        # Recalculate token display with effective (possibly compressed) history
        from core.session_manager import estimate_budget, CONTEXT_LIMIT_TOKENS
        tokens_used_est, tokens_remaining, _ = estimate_budget(
            system_instruction=self.system_instruction,
            vault_context=vault_context,
            memories_context=memories_context,
            continuation_context=continuation_context,
            workspace_cwd_note=workspace_cwd_note,
            history=effective_history,
            user_message=user_message,
            handoff_summary=session_mgr.meta.handoff_summary,
        )

        mode_icon = {"normal": "✅", "warn": "⚠️", "compress": "🗜️", "emergency": "🚨"}.get(session_mode, "❓")
        token_budget_note = (
            f"\n=== Context Budget [{mode_icon} {session_mode.upper()}] ===\n"
            f"Tokens used (estimate): {tokens_used_est:,} / {CONTEXT_LIMIT_TOKENS:,} ({pct_used}%)\n"
            f"Remaining: ~{tokens_remaining:,} tokens\n"
            f"{budget_advice}"
        )

        # Use effective_history (compressed if needed) for the actual prompt build
        chat_history = effective_history

        full_prompt = (
            f"{continuation_context}\n\n" if continuation_context else ""
        ) + (
            f"{handoff_context}\n" if handoff_context else ""
        ) + (
            f"=== Active Project: {active_project_id} ===\n"
            f"{vault_context}\n\n"
            f"{memories_context}\n\n"
            f"{workspace_cwd_note}\n\n"
            f"{token_budget_note}\n\n"
            f"User: {user_message}{guidance}"
        )


        # ── Parallel health check — don't block agent start ─────────────────
        registry = get_registry()
        status = {"ollama": False, "deepseek": False, "nvidia": False, "gemini": False, "claude": False, "deepseek-r1": False}
        
        _pool = ThreadPoolExecutor(max_workers=1)
        _future = _pool.submit(registry.health_status)
        try:
            status = _future.result(timeout=5)
        except Exception as _hc_err:
            logger.warning(f"[Agent] Health check timed out or failed: {_hc_err}. Using cached values.")
            # Do NOT call registry.health_status() again synchronously here!
        finally:
            _pool.shutdown(wait=False, cancel_futures=True)

        # Force Gemini Pro native SDK if requested
        if force_provider == "geminipro":
            logger.info("[Agent] Forcing Gemini Pro native SDK")
            reply, provider = self._run_gemini_native(
                full_prompt, chat_history, task_type,
                model_name="gemini-2.5-pro",
                cancellation_event=cancellation_event,
                max_turns=goal_limit if is_goal else 26,
            )
            return f"✨ _[Gemini Pro]_\n\n{reply}", "geminipro"

        is_claude_forced = (force_provider == "claude" and status.get("claude"))
        is_nvidia_forced = (force_provider == "nvidia" and status.get("nvidia"))

        # ── Path 1: Gemini native tool-calling (if DeepSeek offline and Gemini available, and Claude/Nvidia not forced) ───────
        if not is_claude_forced and not is_nvidia_forced and not status.get("deepseek") and status.get("gemini") and force_provider not in ["claude", "nvidia", "deepseek"]:
            logger.info("[Agent] DeepSeek offline, using Gemini native SDK")
            return self._run_gemini_native(
                full_prompt, chat_history, task_type,
                task_state=task_state, on_progress=on_progress,
                cancellation_event=cancellation_event,
                max_turns=goal_limit if is_goal else 26,
            )

        # ── Path 2: DeepSeek → Gemini / Claude via OpenAI-compatible router ────────────
        messages = [{"role": "system", "content": self.system_instruction}]
        for turn in chat_history:
            role = "assistant" if turn.get("role") in ["model", "assistant"] else "user"
            messages.append({"role": role, "content": turn.get("content", "")})
        messages.append({"role": "user", "content": full_prompt})

        try:
            response_text, provider_used = run_agentic_loop(
                messages=messages,
                tools_schema=LOCAL_TOOLS_SCHEMA,
                tool_executor=self._execute_tool,
                task_type=task_type,
                on_progress=on_progress,
                on_thinking=on_thinking,
                force_provider=force_provider,
                task_state=task_state,
                cancellation_event=cancellation_event,
                max_turns=goal_limit if is_goal else 26,
            )

            # Label provider and active project so user knows which task/model answered
            task_label = ""
            if is_goal: task_label = " [GOAL]"
            elif explicit_plan: task_label = " [PLAN]"
            elif is_teamwork: task_label = " [TEAMWORK]"
            elif is_schedule: task_label = " [SCHEDULE]"
            elif is_browser: task_label = " [BROWSER]"
            elif is_grill: task_label = " [GRILL-ME]"
            
            project_label = f"[{active_project_id.upper()}]{task_label}" if active_project_id != "default" else f"[DEFAULT APP]{task_label}"
            
            if provider_used == "deepseek":
                response_text = f"🌐 *{project_label}* _[DeepSeek]_\n\n{response_text}"
            elif provider_used == "nvidia":
                response_text = f"🟩 *{project_label}* _[Nvidia]_\n\n{response_text}"
            elif provider_used == "claude":
                response_text = f"🌺 *{project_label}* _[Claude]_\n\n{response_text}"

            return response_text, provider_used

        except RuntimeError as e:
            # If the user explicitly forced a model, do not silently fallback to Gemini
            if force_provider in ["nvidia", "claude", "deepseek", "deepseek_r1", "geminipro"]:
                return f"❌ *Lỗi kết nối API ({force_provider.upper()})*\n{e}", "none"

            # Full fallback: try Gemini as last resort if no forced provider
            if status.get("gemini"):
                logger.warning(f"[Agent] All local/DeepSeek failed, trying Gemini. Error: {e}")
                return self._run_gemini_native(
                    full_prompt, chat_history, task_type,
                    cancellation_event=cancellation_event,
                    max_turns=goal_limit if is_goal else 26,
                )
            return (
                f"❌ *Tất cả AI providers đều offline.*\n"
                f"• Ollama: {'✅' if status.get('ollama') else '❌ offline'}\n"
                f"• DeepSeek: {'✅' if status.get('deepseek') else '❌ offline/no key'}\n"
                f"• Nvidia: {'✅' if status.get('nvidia') else '❌ offline'}\n"
                f"• Gemini: {'✅' if status.get('gemini') else '❌ no key'}\n"
                f"• Claude: {'✅' if status.get('claude') else '❌ no key'}\n\n"
                f"Chi tiết lỗi: {e}",
                "none",
            )

    # ─── Gemini Native Path ───────────────────────────────────────────────────

    def _run_gemini_native(
        self,
        full_prompt: str,
        chat_history: list,
        task_type: str,
        model_name: str = "gemini-1.5-flash",
        task_state=None,
        on_progress=None,
        cancellation_event: Optional[threading.Event] = None,
        max_turns: int = 26,
    ) -> Tuple[str, str]:
        """Use Gemini SDK with native function calling."""
        active_project_id = self.get_active_project()
        import time
        try:
            from google import genai
            from google.genai import types

            api_key = os.environ.get("GEMINI_API_KEY")
            if not api_key:
                raise ValueError("GEMINI_API_KEY not set.")

            client = genai.Client(api_key=api_key)

            # Wrappers with simplified signatures for clean Gemini Tool schema generation
            def execute_command(command: str) -> str:
                """
                Executes a PowerShell command in the active workspace and returns output.
                """
                pass

            def read_file(filepath: str) -> str:
                """
                Reads a file and returns its content.
                """
                pass

            def write_file(filepath: str, content: str) -> str:
                """
                Writes or overwrites a file entirely.
                """
                pass

            def list_directory(dirpath: str = ".") -> str:
                """
                Lists files and subdirectories at the given path.
                """
                pass

            available_tools = [
                execute_command,
                read_file,
                write_file,
                list_directory,
            ]

            contents = []
            for turn in chat_history:
                role = "model" if turn.get("role") in ["model", "assistant"] else "user"
                contents.append({"role": role, "parts": [{"text": turn.get("content", "")}]})
            contents.append({"role": "user", "parts": [{"text": full_prompt}]})

            config = types.GenerateContentConfig(
                system_instruction=self.system_instruction,
                tools=available_tools,
                temperature=0.2,
            )

            response = client.models.generate_content(
                model=model_name,
                contents=contents,
                config=config,
            )

            turn_count = 0
            start_time = time.time()
            TIMEOUT_SECONDS = 1800 if max_turns >= 100 else 300
            reached_limit = False

            # Progress tracking for Gemini path
            executed_steps = []

            def update_progress(msg: str):
                executed_steps.append(msg)
                if on_progress:
                    progress_text = (
                        "⚡ *Hệ thống đang thực thi các bước sau:*\n\n"
                        + "\n".join(executed_steps[-20:])
                    )
                    on_progress(progress_text)

            update_progress("🧠 Bot đang bắt đầu phân tích với mô hình *GEMINI*...")

            while response.function_calls and turn_count < max_turns:
                # ── Cancellation check ───────────────────────────────────
                if cancellation_event and cancellation_event.is_set():
                    update_progress("🛑 *Đã hủy tác vụ theo yêu cầu người dùng.*")
                    reached_limit = True
                    break

                # ── Timeout check ────────────────────────────────────────
                if time.time() - start_time > TIMEOUT_SECONDS:
                    logger.warning(f"[Agent] Gemini native path timeout ({TIMEOUT_SECONDS}s).")
                    update_progress("⏳ *Tác vụ chạy quá lâu (5 phút), tự động tạm dừng.*")
                    reached_limit = True
                    break

                turn_count += 1
                tool_responses = []

                for call in response.function_calls:
                    # Inner cancellation check
                    if cancellation_event and cancellation_event.is_set():
                        break

                    tool_name = call.name
                    args = dict(call.args) if call.args else {}

                    # Build step label for progress display
                    if tool_name == "execute_command":
                        label = f"`$ {str(args.get('command', ''))[:80]}`"
                    elif tool_name in ("read_file", "write_file"):
                        fp = str(args.get('filepath', ''))
                        parts = fp.replace('\\', '/').split('/')
                        short = '/'.join(parts[-2:]) if len(parts) >= 2 else fp
                        action = "✏️ write" if tool_name == "write_file" else "📖 read"
                        label = f"`{action}: {short}`"
                    elif tool_name == "list_directory":
                        label = f"`ls: {str(args.get('dirpath', '.'))[:60]}`"
                    else:
                        label = f"`{tool_name}(...)`"

                    update_progress(f"🔍 *Đang chạy:* {label}")

                    if tool_name in VALID_TOOLS and hasattr(tools, tool_name):
                        # ── Real-time streaming for execute_command ──────
                        if tool_name == "execute_command":
                            output_lines_buf = []

                            def _on_cmd_line(line: str, _label=label):
                                if not line.strip():
                                    return
                                output_lines_buf.append(line)
                                recent = "\n".join(output_lines_buf[-5:])
                                update_progress(
                                    f"⚙️ *Chạy:* {_label}\n"
                                    f"```\n{recent[:500]}\n```"
                                )

                            result = tools.execute_command(
                                **args,
                                on_line=_on_cmd_line,
                                cancellation_event=cancellation_event,
                            )
                        else:
                            result = getattr(tools, tool_name)(**args)
                    else:
                        result = f"Error: Tool '{tool_name}' is not available."

                    result_str = str(result)
                    first_line = result_str.strip().split('\n')[0][:80]
                    status_icon = "❌" if result_str.lower().startswith("error") else "✅"
                    update_progress(f"{status_icon} *Xong:* {label}\n   ↳ _{first_line}_")

                    # Persist step to task journal
                    if task_state:
                        try:
                            task_state.add_step(tool_name, args, result_str)
                        except Exception as ts_err:
                            logger.warning(f"[Agent] task_state.add_step failed: {ts_err}")

                    tool_responses.append(
                        types.Part.from_function_response(name=tool_name, response={"result": result})
                    )

                if not tool_responses:
                    # All calls were cancelled
                    break

                contents.append(response.candidates[0].content)
                contents.append(types.Content(role="tool", parts=tool_responses))
                response = client.models.generate_content(
                    model=model_name,
                    contents=contents,
                    config=config,
                )

            # Check if we hit max_turns without completing (loop exited via else)
            if not reached_limit and response.function_calls:
                reached_limit = True
                update_progress(f"⚠️ *Đã chạm giới hạn {max_turns} lượt chạy. Đang tổng hợp kết quả...*")

            # ── Handle response.text = None (SAFETY/MAX_TOKENS/RECITATION block) ──
            final_text = ""
            try:
                final_text = response.text or ""
            except Exception:
                pass

            if not final_text:
                # Check finish_reason for diagnostics
                try:
                    finish_reason = response.candidates[0].finish_reason
                    reason_name = finish_reason.name if hasattr(finish_reason, 'name') else str(finish_reason)
                    if reason_name in ("MAX_TOKENS", "SAFETY", "RECITATION", "BLOCKLIST"):
                        final_text = (
                            f"⚠️ *Model dừng lại do: `{reason_name}`.*\n"
                            "Vui lòng thử lại với yêu cầu đơn giản hơn hoặc chia nhỏ tác vụ."
                        )
                    elif reason_name == "STOP" and not response.function_calls:
                        final_text = "✅ Đã hoàn thành. (Model không cung cấp thêm nội dung)"
                    else:
                        final_text = f"⚠️ Model trả về rỗng (finish_reason: {reason_name})"
                except Exception:
                    final_text = "⚠️ *Model không trả về phản hồi. Vui lòng thử lại.*"

            if reached_limit:
                # ✅ KEY FIX: Request a summary from Gemini when limit is hit
                try:
                    summary_request = types.Content(
                        role="user",
                        parts=[types.Part(text=(
                            "Analyze all the tool outputs above. "
                            "Provide a clear Vietnamese summary of: (1) what steps you completed successfully, "
                            "(2) what is STILL PENDING — list each under '## ❌ Chưa hoàn thành'. "
                            "Tell the user to reply 'tiếp tục' to continue. Do NOT call any more tools."
                        ))]
                    )
                    summary_config = types.GenerateContentConfig(
                        system_instruction=self.system_instruction,
                        temperature=0.2,
                    )
                    summary_response = client.models.generate_content(
                        model=model_name,
                        contents=contents + [summary_request],
                        config=summary_config,
                    )
                    final_text = summary_response.text or final_text

                    # Persist summary + pending steps to journal
                    if task_state and final_text:
                        try:
                            from core.task_state import extract_pending_steps_from_reply
                            pending = extract_pending_steps_from_reply(final_text)
                            task_state.update_progress(final_text[:2000], pending)
                        except Exception as ts_err:
                            logger.warning(f"[Agent] task_state update failed: {ts_err}")

                except Exception as summary_err:
                    logger.warning(f"[Agent] Failed to get Gemini summary: {summary_err}")

                update_progress(f"🛑 *Đã tạm dừng do đạt giới hạn {max_turns} lượt chạy!*")
                final_text = (
                    f"⚠️ **[CẢNH BÁO: ĐẠT GIỚI HẠN {max_turns} LƯỢT CHẠY HOẶC 5 PHÚT]** "
                    "Các tác vụ phức tạp vẫn chưa hoàn thành. Dưới đây là kết quả:\n\n"
                    + final_text
                    + "\n\n💬 _Nhắn `tiếp tục` để tôi tiếp tục từ chỗ còn dở mà không lặp lại bước cũ._"
                )
            else:
                # Task completed normally
                if task_state:
                    try:
                        task_state.complete_task()
                    except Exception as ts_err:
                        logger.warning(f"[Agent] task_state.complete_task failed: {ts_err}")
                update_progress("🎉 *Đã hoàn thành toàn bộ công việc!*")

            project_label = f"[{active_project_id.upper()}]" if active_project_id != "default" else "[DEFAULT APP]"
            return f"🌟 *{project_label}* _[Gemini]_\n\n{final_text or '✅ Completed.'}", "gemini"

        except Exception as e:
            logger.error(f"[Agent] Gemini native path failed: {e}", exc_info=True)
            return f"❌ Gemini error: `{str(e)[:200]}`", "gemini"

    # ─── Tool Executor ────────────────────────────────────────────────────────

    def _execute_tool(
        self,
        tool_name: str,
        args: dict,
        on_line=None,
        cancellation_event: Optional[threading.Event] = None,
    ) -> str:
        """
        Validates and executes a tool by name.
        Rejects unknown tool names to prevent hallucinated tool calls.
        Passes on_line / cancellation_event to execute_command for streaming.
        """
        if tool_name not in VALID_TOOLS:
            logger.warning(f"[Agent] Rejected invalid tool call: '{tool_name}'")
            return (
                f"Error: Tool '{tool_name}' does not exist. "
                f"Available tools: {', '.join(sorted(VALID_TOOLS))}."
            )

        if not hasattr(tools, tool_name):
            return f"Error: Tool '{tool_name}' is defined but not implemented."

        try:
            tool_func = getattr(tools, tool_name)
            # Pass streaming kwargs only to execute_command
            if tool_name == "execute_command":
                result = tool_func(
                    **args,
                    on_line=on_line,
                    cancellation_event=cancellation_event,
                )
            else:
                result = tool_func(**args)
            logger.info(f"[Tool] {tool_name}({list(args.keys())}) → OK")
            return str(result)
        except TypeError as e:
            return f"Error: Wrong arguments for '{tool_name}': {e}"
        except Exception as e:
            logger.error(f"[Tool] {tool_name} raised exception: {e}")
            return f"Error executing '{tool_name}': {str(e)[:300]}"

    # ─── Vault & Storage ──────────────────────────────────────────────────────

    def _get_vault_context(self, vault_dir: Path = None) -> str:
        """
        Reads all files from active project vault + recent scraper data.
        Merged context is grounding for the LLM.
        """
        if vault_dir is None:
            vault_dir, _ = self.get_project_paths()

        context_parts = []

        # 1. Active Workspace Plans (Direct SDK / IDE Integration)
        try:
            from tools import get_active_workspace
            workspace_path = get_active_workspace()
            workspace_plans = []
            
            # Check workspace root first
            for plan_name in ["task.md", "implementation_plan.md", "walkthrough.md"]:
                plan_file = workspace_path / plan_name
                if plan_file.exists() and plan_file.is_file():
                    try:
                        content = plan_file.read_text(encoding="utf-8", errors="ignore")[:4000]
                        workspace_plans.append(f"--- Workspace {plan_name} ---\n{content}")
                    except Exception as e:
                        logger.warning(f"Error reading workspace plan {plan_name}: {e}")
            
            # Check .agent/ folder in active workspace
            agent_dir = workspace_path / ".agent"
            if agent_dir.exists() and agent_dir.is_dir():
                for plan_file in agent_dir.glob("*.md"):
                    if plan_file.name in ["task.md", "implementation_plan.md", "walkthrough.md"]:
                        try:
                            content = plan_file.read_text(encoding="utf-8", errors="ignore")[:4000]
                            workspace_plans.append(f"--- .agent/{plan_file.name} ---\n{content}")
                        except Exception:
                            pass
                            
            # Check docs/agent_memory.md in active workspace (Self-Healing memory)
            agent_memory_file = workspace_path / "docs" / "agent_memory.md"
            if agent_memory_file.exists() and agent_memory_file.is_file():
                try:
                    content = agent_memory_file.read_text(encoding="utf-8", errors="ignore")[:5000]
                    workspace_plans.append(f"--- docs/agent_memory.md (CRITICAL LESSONS) ---\n{content}")
                except Exception:
                    pass
                            
            if workspace_plans:
                context_parts.append("=== Active Workspace Plans (IDE Sync) ===")
                context_parts.extend(workspace_plans)
        except Exception as plan_err:
            logger.error(f"Error getting active workspace plans: {plan_err}")

        # 2. Agent vault files
        vault_files = list(vault_dir.glob("*"))
        if vault_files:
            context_parts.append("=== Project Vault ===")
            for f in vault_files:
                if f.suffix.lower() in [".txt", ".md", ".json", ".py", ".js", ".ts", ".tsx", ".yaml", ".yml"]:
                    try:
                        content = f.read_text(encoding="utf-8", errors="ignore")[:3000]
                        context_parts.append(f"--- {f.name} ---\n{content}")
                    except Exception as e:
                        context_parts.append(f"--- {f.name} (read error: {e}) ---")
                else:
                    context_parts.append(f"--- {f.name} ({f.stat().st_size} bytes, binary) ---")
        else:
            context_parts.append("[Project vault is empty. Upload reference files to index them.]")

        # 2. Recent scraper data (latest 3 files)
        if self.scraper_storage.exists():
            scraper_files = sorted(
                self.scraper_storage.glob("*.json"),
                key=lambda p: p.stat().st_mtime,
                reverse=True,
            )[:3]
            if scraper_files:
                context_parts.append("\n=== Recent Scraper Data ===")
                for f in scraper_files:
                    try:
                        raw = f.read_text(encoding="utf-8", errors="ignore")[:2000]
                        context_parts.append(f"--- {f.name} ---\n{raw}")
                    except Exception:
                        pass

        return "\n\n".join(context_parts)

    def add_to_vault(self, filename: str, content_bytes: bytes, project_id: str = None) -> str:
        """Saves a document to the active project's vault."""
        if not project_id:
            project_id = self.get_active_project()
        vault_dir, _ = self.get_project_paths(project_id)
        target = vault_dir / filename
        target.write_bytes(content_bytes)
        logger.info(f"[Vault] Added '{filename}' to project '{project_id}'")
        return str(target)

    def get_vault_summary(self) -> str:
        """Returns a text summary of all vault + scraper files."""
        active = self.get_active_project()
        vault_dir, _ = self.get_project_paths(active)

        lines = [f"📁 *Vault — Project: {active}*"]
        vault_files = list(vault_dir.glob("*"))
        if vault_files:
            for f in vault_files:
                size_kb = f.stat().st_size / 1024
                lines.append(f"  • {f.name} ({size_kb:.1f} KB)")
        else:
            lines.append("  _(empty)_")

        if self.scraper_storage.exists():
            scraper_files = sorted(
                self.scraper_storage.glob("*.json"),
                key=lambda p: p.stat().st_mtime,
                reverse=True,
            )[:5]
            if scraper_files:
                lines.append(f"\n🕷️ *Recent Scraper Data* ({len(list(self.scraper_storage.glob('*.json')))} total)")
                for f in scraper_files:
                    size_kb = f.stat().st_size / 1024
                    lines.append(f"  • {f.name} ({size_kb:.1f} KB)")

        return "\n".join(lines)
