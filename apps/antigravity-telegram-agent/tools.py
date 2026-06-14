import os
import subprocess
import threading
import shutil
import time
from pathlib import Path
import json
import logging
from tool_scripts.browser import read_browser_page, click_element, take_screenshot, run_visual_audit
from tool_scripts.semantic_search import semantic_search
logger = logging.getLogger("ATA.tools")

# Load config from environment or use defaults
MONOREPO_ROOT = Path(os.environ.get("MONOREPO_ROOT_PATH", str(Path(__file__).resolve().parents[2])))

def get_active_workspace() -> Path:
    """Dynamically resolves the active workspace path based on active_project.json state and settings.json."""
    state_file = Path(__file__).parent / "active_project.json"
    if state_file.exists():
        try:
            state = json.loads(state_file.read_text(encoding="utf-8"))
            project_id = state.get("active_project")
            if project_id:
                # Try reading settings.json to get the configured path
                settings_file = Path(__file__).parent / "config" / "settings.json"
                if settings_file.exists():
                    try:
                        config = json.loads(settings_file.read_text(encoding="utf-8"))
                        for app in config.get("apps", []):
                            if app.get("name") == project_id:
                                app_path = MONOREPO_ROOT / app.get("path")
                                if app_path.exists() and app_path.is_dir():
                                    return app_path
                    except Exception:
                        pass
                # Check if it's an app folder inside apps/
                app_path = MONOREPO_ROOT / "apps" / project_id
                if app_path.exists() and app_path.is_dir():
                    return app_path
                # Check if it's a packages folder
                pkg_path = MONOREPO_ROOT / "packages" / project_id
                if pkg_path.exists() and pkg_path.is_dir():
                    return pkg_path
        except Exception:
            pass
    return MONOREPO_ROOT


def _resolve_path(user_path: str, must_exist: bool = True):
    """
    Smart dual-resolution: tries the path two ways so the AI can use EITHER
    workspace-relative OR monorepo-root-relative paths without errors.

    Resolution order:
      1. workspace-relative  (cwd / user_path)       e.g.  'src/pages'
      2. monorepo-relative   (MONOREPO_ROOT / user_path) e.g. 'apps/inventory-operation/src'

    If neither exists (and must_exist=True), falls back to workspace-relative so
    callers get a clear error message referencing the active workspace.

    Returns: (resolved_absolute_Path, workspace_Path)
    """
    workspace = get_active_workspace()

    # --- Attempt 1: workspace-relative (standard) ---------------------------------
    candidate1 = (workspace / user_path).resolve()
    if str(candidate1).startswith(str(MONOREPO_ROOT)):
        if not must_exist or candidate1.exists():
            return candidate1, workspace

    # --- Attempt 2: monorepo-relative (AI used full path from repo root) ----------
    candidate2 = (MONOREPO_ROOT / user_path).resolve()
    if str(candidate2).startswith(str(MONOREPO_ROOT)):
        if not must_exist or candidate2.exists():
            if candidate2 != candidate1:  # only log if different
                logger.debug(
                    f"[tools._resolve_path] '{user_path}' not found relative to "
                    f"workspace '{workspace.name}'; resolved via monorepo root instead."
                )
            return candidate2, workspace

    # --- Both failed: return candidate1 so caller gets workspace-scoped error ----
    return candidate1, workspace


def execute_command(
    command: str,
    on_line=None,
    cancellation_event=None,
) -> str:
    """
    Executes a PowerShell command in the active workspace and returns output.

    Args:
        command: The PowerShell command to execute.
        on_line: Optional callback(line: str) called in real-time for each output line.
        cancellation_event: Optional threading.Event — if set, the process is killed early.

    Returns:
        Full combined stdout + stderr as a string.
    """
    cwd_path = get_active_workspace()
    output_lines = []
    header = f"CWD: {cwd_path.relative_to(MONOREPO_ROOT).as_posix() or '.'} (absolute: {cwd_path})\n"

    # Preprocess command to convert Unix-like chains and filters to PowerShell equivalents
    import re as _re
    command = command.replace("&&", ";")
    command = _re.sub(r'\|\s*head\s+-n\s+(\d+)', r'| Select-Object -First \1', command)
    command = _re.sub(r'\|\s*head\s+-(\d+)', r'| Select-Object -First \1', command)

    try:
        proc = subprocess.Popen(
            ["powershell", "-NoProfile", "-NonInteractive", "-Command", command],
            cwd=str(cwd_path),
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,   # Merge stderr into stdout for unified stream
            stdin=subprocess.DEVNULL,   # ← CRITICAL: prevent blocking on stdin
            text=True,
            encoding="utf-8",
            errors="replace",
        )

        # Use a background timer to force-kill the process if it runs too long and hangs readline
        timeout_sec = 120
        def _kill_proc():
            try:
                # CRITICAL FIX: Kill entire process tree on Windows so orphans don't hold the pipe open
                subprocess.run(["taskkill", "/F", "/T", "/PID", str(proc.pid)], capture_output=True)
                proc.kill()
                output_lines.append(f"\n[ERROR: Command killed after exceeding {timeout_sec}s timeout]")
            except Exception:
                pass
                
        timer = threading.Timer(timeout_sec, _kill_proc)
        timer.start()

        try:
            # Read stdout line-by-line in real-time
            for line in iter(proc.stdout.readline, ""):
                # Check cancellation
                if cancellation_event and cancellation_event.is_set():
                    try:
                        subprocess.run(["taskkill", "/F", "/T", "/PID", str(proc.pid)], capture_output=True)
                        proc.kill()
                    except Exception:
                        pass
                    output_lines.append("\n[CANCELLED by user]")
                    break

                output_lines.append(line)
                if on_line:
                    try:
                        on_line(line.rstrip())
                    except Exception:
                        pass  # Never let progress callback crash the tool
        finally:
            timer.cancel()

        proc.stdout.close()
        return_code = proc.wait(timeout=5)

        raw_output = "".join(output_lines)
        if len(raw_output) > 2000:
            raw_output = raw_output[:1000] + f"\n\n...[OUTPUT TRUNCATED: Original size {len(raw_output)} chars]...\n\n" + raw_output[-1000:]
            
        full_output = header + raw_output
        if return_code != 0:
            full_output += f"\n[Exit code: {return_code}]"
        if not output_lines:
            full_output += "Command completed successfully with no output."
        return full_output

    except subprocess.TimeoutExpired:
        try:
            proc.kill()
        except Exception:
            pass
        return f"Error: Command timed out waiting for process to exit in {cwd_path.name}."
    except Exception as e:
        return f"Error executing command: {str(e)}"


# Max lines returned by read_file before auto-truncation kicks in
MAX_READ_FILE_LINES = int(os.environ.get("MAX_READ_FILE_LINES", "300"))


def read_file(filepath: str) -> str:
    """
    Reads a file. Accepts workspace-relative or monorepo-root-relative paths.
    Auto-truncates at MAX_READ_FILE_LINES (default 300) to protect context window.
    Use read_file_lines for larger files or specific sections.
    """
    try:
        target, workspace = _resolve_path(filepath, must_exist=True)
        if not str(target).startswith(str(MONOREPO_ROOT)):
            return "Error: Access denied. Cannot read files outside the monorepo bounds."
        if not target.exists():
            return f"Error: File '{filepath}' does not exist (tried workspace '{workspace.name}' and monorepo root)."
        if target.is_dir():
            return f"Error: '{filepath}' is a directory, not a file."

        content = target.read_text(encoding="utf-8", errors="replace")
        lines = content.splitlines(keepends=True)
        total = len(lines)

        try:
            rel_path = target.relative_to(MONOREPO_ROOT).as_posix()
        except ValueError:
            rel_path = filepath

        if total <= MAX_READ_FILE_LINES:
            return f"# {rel_path} ({total} lines)\n" + content

        # Auto-truncate: try to cut at a clean boundary (blank line or closing brace)
        cut = MAX_READ_FILE_LINES
        for i in range(cut, max(cut - 20, 0), -1):
            stripped = lines[i - 1].strip()
            if not stripped or stripped in ("}", "};", "});", "]", "],"):
                cut = i
                break

        truncated = "".join(lines[:cut])
        return (
            f"# {rel_path} ({total} lines — showing first {cut}, TRUNCATED)\n"
            f"{truncated}\n"
            f"\n[... {total - cut} more lines not shown. "
            f"Use read_file_lines('{filepath}', {cut + 1}, {min(total, cut + 100)}) to continue "
            f"or get_file_outline('{filepath}') for structure.]"
        )
    except Exception as e:
        return f"Error reading file: {str(e)}"


def _validate_syntax(filepath: Path, workspace: Path) -> str:
    """Runs a quick syntax check on the file if supported. Returns error string or empty string."""
    ext = filepath.suffix.lower()
    try:
        if ext == ".py":
            result = subprocess.run(["python", "-m", "py_compile", str(filepath)], capture_output=True, text=True, timeout=10, cwd=workspace)
            if result.returncode != 0:
                return result.stderr.strip() or result.stdout.strip()
        elif ext in [".ts", ".tsx", ".js", ".jsx"]:
            # Try running tsc or eslint
            result = subprocess.run(["npx", "eslint", str(filepath)], capture_output=True, text=True, timeout=15, cwd=workspace)
            if result.returncode != 0:
                out = result.stdout.strip() or result.stderr.strip()
                # If eslint is missing or not configured, ignore
                if "could not be resolved" not in out and "ENOENT" not in out and "command not found" not in out:
                    return out
    except Exception:
        pass
    return ""

def write_file(filepath: str, content: str) -> str:
    """Writes content to a file. Accepts both workspace-relative and monorepo-root-relative paths."""
    try:
        # For writes: try to resolve existing parent; don't require file to exist yet
        target, workspace = _resolve_path(filepath, must_exist=False)
        if not str(target).startswith(str(MONOREPO_ROOT)):
            return "Error: Access denied. Cannot write files outside the monorepo bounds."
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(content, encoding="utf-8-sig")
        
        # Self-Healing: Validate syntax immediately
        validation_err = _validate_syntax(target, workspace)
        
        try:
            display = target.relative_to(MONOREPO_ROOT).as_posix()
        except ValueError:
            display = str(target)
            
        success_msg = f"Successfully wrote {len(content)} characters to '{display}'."
        if validation_err:
            return f"{success_msg}\n\n🚨 CRITICAL SYNTAX ERROR DETECTED:\n{validation_err}\n\nYou MUST fix this error before proceeding."
        return success_msg
    except Exception as e:
        return f"Error writing file: {str(e)}"


def list_directory(dirpath: str = ".") -> str:
    """Lists files and directories. Accepts both workspace-relative and monorepo-root-relative paths."""
    try:
        target, workspace = _resolve_path(dirpath, must_exist=True)
        if not str(target).startswith(str(MONOREPO_ROOT)):
            return "Error: Access denied. Cannot access directories outside the monorepo bounds."
        if not target.exists():
            return (
                f"Error: Path '{dirpath}' does not exist.\n"
                f"  Tried: {workspace / dirpath}\n"
                f"  Also tried: {MONOREPO_ROOT / dirpath}\n"
                f"  Hint: Use paths relative to workspace '{workspace.name}' (e.g. 'src/pages') "
                f"OR relative to monorepo root (e.g. 'apps/{workspace.name}/src/pages')."
            )

        items = []
        for entry in target.iterdir():
            # Show path relative to monorepo root for unambiguous context
            try:
                rel = entry.relative_to(MONOREPO_ROOT).as_posix()
            except ValueError:
                rel = entry.name
            type_str = "[DIR]" if entry.is_dir() else "[FILE]"
            items.append(f"{type_str} {rel}")

        if not items:
            return f"Directory '{dirpath}' is empty."

        # Header shows both the resolved absolute path and which workspace is active
        try:
            resolved_rel = target.relative_to(MONOREPO_ROOT).as_posix()
        except ValueError:
            resolved_rel = str(target)
        return (
            f"Directory listing of '{resolved_rel}' (active workspace: {workspace.name}):\n"
            + "\n".join(sorted(items))
        )
    except Exception as e:
        return f"Error listing directory: {str(e)}"


def patch_file(filepath: str, old_str: str, new_str: str, expected_count: int = 1) -> str:
    """
    Surgically edit a file by replacing an exact string occurrence.
    PREFER this over write_file when making targeted changes to existing files.

    Works like Claude's str_replace_editor:
      - Finds `old_str` exactly as written (whitespace-sensitive)
      - Replaces with `new_str`
      - Fails clearly if `old_str` is not found or occurs more/fewer times than expected

    Args:
        filepath:       Path to the file (workspace-relative or monorepo-root-relative)
        old_str:        The exact text to find and replace. Must be unique in the file.
                        Include enough surrounding context (2-3 lines) to be unique.
        new_str:        The replacement text.
        expected_count: How many times old_str should appear (default 1).
                        Set to 0 to allow zero matches (pure insert — append new_str after old_str position).

    Returns:
        Success message with line number of the change, or a detailed error.
    """
    try:
        target, workspace = _resolve_path(filepath, must_exist=True)
        if not str(target).startswith(str(MONOREPO_ROOT)):
            return "Error: Access denied."
        if not target.exists():
            return f"Error: File '{filepath}' does not exist."
        if target.is_dir():
            return f"Error: '{filepath}' is a directory."

        original = target.read_text(encoding="utf-8", errors="replace")
        count = original.count(old_str)

        # Validate occurrence count
        if count == 0:
            # Give context to help model fix old_str
            lines = original.splitlines()
            # Show first 5 lines of file as orientation
            preview = "\n".join(f"  {i+1}: {l}" for i, l in enumerate(lines[:5]))
            return (
                f"Error: old_str not found in '{filepath}'.\n"
                f"The text to find must match exactly (including whitespace and indentation).\n"
                f"First 5 lines of file for reference:\n{preview}\n"
                f"Hint: Use get_file_outline('{filepath}') then read_file_lines to verify the exact text."
            )

        if count != expected_count:
            return (
                f"Error: old_str found {count} times in '{filepath}', expected {expected_count}.\n"
                f"Make old_str more specific by including more surrounding context lines."
            )

        # Apply the replacement
        new_content = original.replace(old_str, new_str, 1 if expected_count == 1 else count)
        target.write_text(new_content, encoding="utf-8-sig")
        
        # Self-Healing: Validate syntax immediately
        validation_err = _validate_syntax(target, workspace)

        # Find the line number of the change for the success message
        try:
            change_line = original[:original.index(old_str)].count("\n") + 1
        except Exception:
            change_line = 0

        lines_added = new_str.count("\n") - old_str.count("\n")
        delta = f"+{lines_added}" if lines_added >= 0 else str(lines_added)
        try:
            rel = target.relative_to(MONOREPO_ROOT).as_posix()
        except ValueError:
            rel = filepath

        success_msg = (
            f"✅ Patched '{rel}' at line ~{change_line} "
            f"({delta} lines, {len(new_str) - len(old_str):+d} chars)."
        )
        if validation_err:
            return f"{success_msg}\n\n🚨 CRITICAL SYNTAX ERROR DETECTED:\n{validation_err}\n\nYou MUST fix this error before proceeding."
        return success_msg
    except Exception as e:
        return f"Error patching file: {str(e)}"


def list_all_files(
    path: str = ".",
    max_depth: int = 4,
    include: str = None,
    exclude_dirs: str = "node_modules,.git,dist,build,.next,.turbo,coverage,__pycache__",
) -> str:
    """
    Recursively list all files in the workspace in a single call.
    Much more efficient than calling list_directory multiple times.

    Args:
        path:         Root directory to start from (default: workspace root)
        max_depth:    How many directory levels deep to recurse (default 4)
        include:      Comma-separated glob patterns to filter files (e.g. '*.ts,*.tsx').
                      If omitted, all files are returned.
        exclude_dirs: Comma-separated directory names to skip (default: node_modules, .git, etc.)

    Returns:
        Full file tree as a sorted list of monorepo-relative paths.
    """
    try:
        search_root, workspace = _resolve_path(path, must_exist=True)
        if not search_root.exists():
            return f"Error: Path '{path}' does not exist."

        # Parse filters
        excl_set = {d.strip() for d in exclude_dirs.split(",") if d.strip()}

        import fnmatch
        include_patterns = None
        if include:
            include_patterns = [p.strip() for p in include.split(",") if p.strip()]

        # Walk the tree
        all_files = []
        dirs_count = [0]

        def _walk(current: Path, depth: int):
            if depth > max_depth:
                return
            try:
                entries = sorted(current.iterdir(), key=lambda e: (e.is_file(), e.name.lower()))
            except PermissionError:
                return

            for entry in entries:
                if entry.is_dir():
                    if entry.name in excl_set or entry.name.startswith("."):
                        continue
                    dirs_count[0] += 1
                    _walk(entry, depth + 1)
                elif entry.is_file():
                    if include_patterns:
                        if not any(fnmatch.fnmatch(entry.name, pat) for pat in include_patterns):
                            continue
                    try:
                        rel = entry.relative_to(MONOREPO_ROOT).as_posix()
                    except ValueError:
                        rel = str(entry)
                    all_files.append(rel)

        _walk(search_root, 0)

        if not all_files:
            filter_note = f" matching '{include}'" if include else ""
            return f"No files found{filter_note} in '{path}'."

        try:
            root_rel = search_root.relative_to(MONOREPO_ROOT).as_posix()
        except ValueError:
            root_rel = str(search_root)

        filter_note = f" (filter: {include})" if include else ""
        header = (
            f"File tree of '{root_rel}'{filter_note} "
            f"— {len(all_files)} files, {dirs_count[0]} dirs "
            f"(active workspace: {workspace.name}):"
        )
        # Cap output to avoid token flood
        MAX_FILES = 500
        body = all_files[:MAX_FILES]
        truncation = f"\n[... {len(all_files) - MAX_FILES} more files not shown]" if len(all_files) > MAX_FILES else ""
        return header + "\n" + "\n".join(body) + truncation

    except Exception as e:
        return f"Error listing files: {str(e)}"

def kill_port(port: int) -> str:
    """Terminates any process occupying the specified port on Windows."""
    try:
        cmd = (
            f"Get-NetTCPConnection -LocalPort {port} -ErrorAction SilentlyContinue "
            f"| Select-Object -ExpandProperty OwningProcess -Unique "
            f"| ForEach-Object {{ Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue }}"
        )
        subprocess.run(
            ["powershell", "-NoProfile", "-Command", cmd],
            capture_output=True, text=True, stdin=subprocess.DEVNULL,
        )
        return f"Port {port} has been cleared."
    except Exception as e:
        return f"Error clearing port {port}: {str(e)}"


def run_background_server(command: str) -> str:
    """Launches a development server in the background using a hidden process."""
    cwd_path = get_active_workspace()
    try:
        cmd = (
            f"Start-Process -FilePath 'cmd.exe' "
            f"-ArgumentList '/c', '{command}' "
            f"-WorkingDirectory '{str(cwd_path)}' "
            f"-WindowStyle Hidden"
        )
        subprocess.run(
            ["powershell", "-NoProfile", "-Command", cmd],
            capture_output=True, text=True, stdin=subprocess.DEVNULL,
        )
        return f"Background process '{command}' started in {cwd_path.name}."
    except Exception as e:
        return f"Error starting background server: {str(e)}"


# ═══════════════════════════════════════════════════════════════════
# SMART CONTEXT TOOLS  (token-efficient codebase comprehension)
# ═══════════════════════════════════════════════════════════════════

def grep_code(
    pattern: str,
    path: str = ".",
    include: str = None,
    max_results: int = 40,
    context_lines: int = 2,
) -> str:
    """
    Search for a regex/literal pattern across source files using ripgrep (rg).
    Falls back to PowerShell Select-String if rg is not installed.

    Use this INSTEAD of reading whole files to:
      - Find where a function/component/hook is defined or imported
      - Locate all usages of a variable, prop, or API endpoint
      - Check if a dependency is used anywhere
      - Understand a codebase at a glance without reading every file

    Args:
        pattern:      Regex or literal string to search for (e.g. 'useAuth', 'import.*router')
        path:         Subdirectory to search in (default: workspace root '.')
        include:      Glob filter for file types (e.g. '*.tsx', '*.ts,*.js').
                      Supports comma-separated globs.
        max_results:  Limit matches returned (default 40, max 200)
        context_lines: Lines of context before/after each match (default 2)

    Returns:
        Formatted match results with file:line:content, or a no-match message.
    """
    workspace = get_active_workspace()
    search_root, _ = _resolve_path(path, must_exist=True)
    max_results = min(max_results, 200)
    context_lines = min(context_lines, 5)

    # ── Try ripgrep first (much faster) ──────────────────────────────────────
    rg_path = shutil.which("rg")
    if rg_path:
        cmd_parts = [
            rg_path,
            "--line-number",
            "--color=never",
            "--smart-case",
            f"--context={context_lines}",
            f"--max-count={max_results}",
            "--glob=!node_modules",
            "--glob=!.git",
            "--glob=!dist",
            "--glob=!build",
            "--glob=!.next",
        ]
        if include:
            for glob in include.split(","):
                cmd_parts += [f"--glob={glob.strip()}"]
        cmd_parts += [pattern, str(search_root)]

        try:
            result = subprocess.run(
                cmd_parts,
                capture_output=True, text=True,
                timeout=15, stdin=subprocess.DEVNULL,
                encoding="utf-8", errors="replace",
            )
            output = result.stdout.strip()
            if not output:
                return f"No matches for '{pattern}' in '{path}'."
            lines = output.splitlines()
            # Make paths relative to monorepo root
            def shorten(line):
                try:
                    abs_p = Path(line.split(":")[0])
                    return line.replace(str(abs_p), abs_p.relative_to(MONOREPO_ROOT).as_posix(), 1)
                except Exception:
                    return line
            shortened = [shorten(l) for l in lines]
            count_note = f" (showing first {max_results} matches)" if len(lines) >= max_results * 3 else ""
            return f"grep '{pattern}' in '{path}'{count_note}:\n" + "\n".join(shortened)
        except subprocess.TimeoutExpired:
            return f"Error: grep timed out searching for '{pattern}'."
        except Exception as e:
            logger.warning(f"[grep_code] rg failed: {e}, falling back to Select-String")

    # ── Fallback: Pure Python Regex Search ───────────────────────────────────
    import re
    import fnmatch

    include_globs = []
    if include:
        include_globs = [g.strip() for g in include.split(",")]

    ignore_dirs = {".git", "node_modules", "dist", "build", ".next", "__pycache__"}
    matches = []

    try:
        # Smart-case: case-insensitive only if pattern contains no uppercase characters
        has_upper = any(c.isupper() for c in pattern)
        flags = 0 if has_upper else re.IGNORECASE
        regex = re.compile(pattern, flags)
    except Exception as re_err:
        return f"Error: Invalid regex pattern '{pattern}': {re_err}"

    start_time = time.time()
    timeout = 15.0

    for root, dirs, files in os.walk(search_root):
        if time.time() - start_time > timeout:
            return f"Error: grep timed out searching for '{pattern}' (Python fallback limit)."

        # Prune ignored directories in-place
        dirs[:] = [d for d in dirs if d not in ignore_dirs]

        for file in files:
            file_path = Path(root) / file

            # Apply glob filters if specified
            if include_globs:
                matched_glob = False
                for glob in include_globs:
                    if fnmatch.fnmatch(file, glob):
                        matched_glob = True
                        break
                if not matched_glob:
                    continue

            try:
                # Read file content safely
                content = file_path.read_text(encoding="utf-8", errors="replace")
                lines = content.splitlines()
                for idx, line in enumerate(lines, 1):
                    if regex.search(line):
                        # Construct context lines
                        start_idx = max(0, idx - 1 - context_lines)
                        end_idx = min(len(lines), idx + context_lines)
                        context = []
                        for c_idx in range(start_idx, end_idx):
                            prefix = ">" if c_idx == idx - 1 else " "
                            context.append(f"{prefix} {c_idx + 1}: {lines[c_idx]}")

                        try:
                            rel_p = file_path.relative_to(MONOREPO_ROOT).as_posix()
                        except Exception:
                            rel_p = file_path.as_posix()

                        matches.append((rel_p, idx, line, context))
                        if len(matches) >= max_results:
                            break
                if len(matches) >= max_results:
                    break
            except Exception:
                pass

        if len(matches) >= max_results:
            break

    if not matches:
        return f"No matches for '{pattern}' in '{path}'."

    output_lines = []
    for rel_p, line_no, matched_line, context in matches:
        output_lines.append(f"--- File: {rel_p}:{line_no} ---")
        output_lines.extend(context)
        output_lines.append("")

    count_note = f" (showing first {max_results} matches)" if len(matches) >= max_results else ""
    return f"grep '{pattern}' in '{path}'{count_note}:\n" + "\n".join(output_lines)



def get_file_outline(filepath: str) -> str:
    """
    Extract a structural outline of a source file WITHOUT returning its full content.
    Dramatically reduces token usage when you only need to understand a file's structure.

    Returns:
      - Import statements (what it depends on)
      - Export statements (what it exposes)
      - Top-level function / class / const / interface / type definitions with line numbers
      - Total line count

    Use this BEFORE read_file to decide if you actually need to read the whole file.
    After seeing the outline, use read_file_lines to read only the relevant sections.

    Supports: .ts, .tsx, .js, .jsx, .py, .css, .json (partial)
    """
    try:
        target, workspace = _resolve_path(filepath, must_exist=True)
        if not target.exists():
            return f"Error: File '{filepath}' does not exist."
        if target.is_dir():
            return f"Error: '{filepath}' is a directory."

        content = target.read_text(encoding="utf-8", errors="replace")
        lines = content.splitlines()
        total_lines = len(lines)

        outline_parts = []
        ext = target.suffix.lower()

        # ── JSON: just show top-level keys ────────────────────────────────────
        if ext == ".json":
            try:
                data = json.loads(content)
                if isinstance(data, dict):
                    keys = list(data.keys())[:30]
                    return (
                        f"JSON outline of '{filepath}' ({total_lines} lines):\n"
                        f"Top-level keys: {', '.join(keys)}"
                        + (" ..." if len(data) > 30 else "")
                    )
            except Exception:
                pass

        import re

        if ext in (".ts", ".tsx", ".js", ".jsx"):
            # Patterns for JS/TS outline
            PATTERNS = [
                ("IMPORT",  r'^import\s+.+'),
                ("EXPORT",  r'^export\s+(?:default\s+)?(?:const|function|class|interface|type|enum|async)\s+(\w+)'),
                ("EXPORT",  r'^export\s+\{[^}]+\}'),
                ("FUNC",    r'^(?:export\s+)?(?:async\s+)?function\s+(\w+)'),
                ("CONST",   r'^(?:export\s+)?const\s+(\w+)\s*[:=]'),
                ("CLASS",   r'^(?:export\s+)?(?:abstract\s+)?class\s+(\w+)'),
                ("IFACE",   r'^(?:export\s+)?interface\s+(\w+)'),
                ("TYPE",    r'^(?:export\s+)?type\s+(\w+)\s*='),
                ("HOOK",    r'^(?:export\s+)?(?:const\s+)?(use\w+)\s*[=:]'),
                ("ENUM",    r'^(?:export\s+)?enum\s+(\w+)'),
                ("COMP",    r'^(?:export\s+)?(?:const\s+)?(\w*(?:Page|Component|Widget|Panel|Modal|Layout|Card|Button|Form|Table|List|Item|Header|Footer|Nav|Bar|View|Screen)\w*)\s*[=:]'),
            ]

            import_lines = []
            symbol_lines = []

            for i, line in enumerate(lines, 1):
                stripped = line.strip()
                matched = False
                for tag, pat in PATTERNS:
                    if re.match(pat, stripped):
                        if tag == "IMPORT":
                            import_lines.append(f"  L{i:4d}: {stripped[:100]}")
                        else:
                            symbol_lines.append(f"  L{i:4d} [{tag}]: {stripped[:100]}")
                        matched = True
                        break

            parts = [f"Outline of '{filepath}' ({total_lines} lines):"]
            if import_lines:
                parts.append(f"\nIMPORTS ({len(import_lines)}):")
                parts.extend(import_lines)
            if symbol_lines:
                parts.append(f"\nSYMBOLS ({len(symbol_lines)}):")
                parts.extend(symbol_lines)
            if not import_lines and not symbol_lines:
                parts.append("(No recognizable top-level symbols found — may be a config or data file)")
            return "\n".join(parts)

        elif ext == ".py":
            import re
            PY_PATTERNS = [
                ("IMPORT", r'^(?:import|from)\s+.+'),
                ("CLASS",  r'^class\s+(\w+)'),
                ("FUNC",   r'^(?:async\s+)?def\s+(\w+)'),
                ("CONST",  r'^([A-Z_]{2,})\s*='),
            ]
            import_lines = []
            symbol_lines = []
            for i, line in enumerate(lines, 1):
                stripped = line.strip()
                for tag, pat in PY_PATTERNS:
                    if re.match(pat, stripped):
                        if tag == "IMPORT":
                            import_lines.append(f"  L{i:4d}: {stripped[:100]}")
                        else:
                            symbol_lines.append(f"  L{i:4d} [{tag}]: {stripped[:100]}")
                        break
            parts = [f"Outline of '{filepath}' ({total_lines} lines):"]
            if import_lines:
                parts.append(f"\nIMPORTS ({len(import_lines)}):")
                parts.extend(import_lines)
            if symbol_lines:
                parts.append(f"\nSYMBOLS ({len(symbol_lines)}):")
                parts.extend(symbol_lines)
            return "\n".join(parts)

        elif ext == ".css":
            import re
            selectors = []
            for i, line in enumerate(lines, 1):
                stripped = line.strip()
                if re.match(r'^[.#\[:\w@].*\{\s*$', stripped):
                    selectors.append(f"  L{i:4d}: {stripped[:80]}")
            return (
                f"CSS outline of '{filepath}' ({total_lines} lines, {len(selectors)} rules):\n"
                + "\n".join(selectors[:50])
                + ("\n  ..." if len(selectors) > 50 else "")
            )

        else:
            # Generic: first 30 non-empty lines as preview
            preview = [l for l in lines if l.strip()][:30]
            return (
                f"Outline of '{filepath}' ({total_lines} lines) — first 30 non-empty lines:\n"
                + "\n".join(f"  L{i+1:4d}: {l[:100]}" for i, l in enumerate(preview))
            )

    except Exception as e:
        return f"Error getting outline of '{filepath}': {str(e)}"


def read_file_lines(filepath: str, start_line: int, end_line: int) -> str:
    """
    Read a specific range of lines from a file (1-indexed, inclusive).
    Use this AFTER get_file_outline to read only the relevant function/section
    instead of loading the entire file into context.

    Example workflow (token-optimal):
      1. get_file_outline('src/hooks/useAuth.ts')  →  sees 'L23 [FUNC]: useAuth'
      2. read_file_lines('src/hooks/useAuth.ts', 23, 60)  →  reads only that function

    Args:
        filepath:   Path to file (workspace-relative or monorepo-root-relative)
        start_line: First line to read (1-indexed)
        end_line:   Last line to read (1-indexed, inclusive)

    Returns:
        The requested lines with line numbers prepended, plus a summary header.
    """
    try:
        target, workspace = _resolve_path(filepath, must_exist=True)
        if not target.exists():
            return f"Error: File '{filepath}' does not exist."
        if target.is_dir():
            return f"Error: '{filepath}' is a directory."

        lines = target.read_text(encoding="utf-8", errors="replace").splitlines()
        total = len(lines)

        # Clamp and validate
        start = max(1, start_line)
        end = min(total, end_line)
        if start > total:
            return f"Error: start_line ({start_line}) exceeds file length ({total} lines)."
        if start > end:
            return f"Error: start_line ({start_line}) is after end_line ({end_line})."

        # Enforce max 300 lines per call to prevent token floods
        if end - start > 300:
            end = start + 300
            truncated_note = f" [truncated to 300 lines — call again with start_line={end+1} for more]"
        else:
            truncated_note = ""

        selected = lines[start - 1:end]
        try:
            rel_path = target.relative_to(MONOREPO_ROOT).as_posix()
        except ValueError:
            rel_path = filepath

        header = f"'{rel_path}' lines {start}–{end} of {total}{truncated_note}:\n"
        body = "\n".join(f"{start + i:4d}: {line}" for i, line in enumerate(selected))
        return header + body

    except Exception as e:
        return f"Error reading lines from '{filepath}': {str(e)}"

# ─── Port Management ────────────────────────────────────────────────────────

import socket

def _is_port_in_use(port: int) -> bool:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex(('127.0.0.1', port)) == 0

def manage_port(action: str, port: int = None) -> str:
    """
    Tool entry point for managing ports.
    action: "check" | "find_free" | "kill"
    port: optional port number.
    """
    if action == "find_free":
        start_port = int(port) if port else 3000
        for p in range(start_port, start_port + 1000):
            if not _is_port_in_use(p):
                return f"Found free port: {p}"
        return f"Error: Could not find a free port starting from {start_port}"

    elif action == "check":
        if not port:
            return "Error: 'port' is required for action 'check'."
        port = int(port)
        in_use = _is_port_in_use(port)
        return f"Port {port} is {'IN USE' if in_use else 'FREE'}."

    elif action == "kill":
        if not port:
            return "Error: 'port' is required for action 'kill'."
        port = int(port)
        try:
            # Find PID using netstat
            netstat_output = subprocess.check_output(f"netstat -ano | findstr :{port}", shell=True, text=True)
            lines = netstat_output.strip().split('\n')
            pids = set()
            for line in lines:
                if f":{port}" in line and "LISTENING" in line.upper():
                    parts = line.strip().split()
                    pid = parts[-1]
                    if pid != "0":
                        pids.add(pid)
            
            if not pids:
                return f"No process found listening on port {port}."
            
            killed = []
            for pid in pids:
                subprocess.run(f"taskkill /PID {pid} /F", shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
                killed.append(pid)
                
            return f"Successfully killed processes {', '.join(killed)} on port {port}."
        except subprocess.CalledProcessError:
            return f"Port {port} is not in use or access denied."
        except Exception as e:
            return f"Error killing port {port}: {e}"

    else:
        return f"Error: Unknown action '{action}'. Valid actions are check, find_free, kill."

def record_lesson(lesson: str = None, **kwargs) -> str:
    """Records a lesson or bug fix into the project's agent_memory.md file."""
    if not lesson:
        return "Error: You must provide a 'lesson' parameter containing the text to record."
        
    try:
        workspace = get_active_workspace()
        docs_dir = workspace / "docs"
        docs_dir.mkdir(exist_ok=True)
        memory_file = docs_dir / "agent_memory.md"
        
        import datetime
        timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M")
        entry = f"\n### Lesson Recorded on {timestamp}\n{lesson}\n"
        
        if not memory_file.exists():
            memory_file.write_text("# Project Agent Memory\n\nThis file contains learned lessons, bug fixes, and architectural rules discovered during development. The AI should read this to avoid repeating mistakes.\n" + entry, encoding="utf-8")
        else:
            with open(memory_file, "a", encoding="utf-8") as f:
                f.write(entry)
                
        return f"Successfully recorded lesson to 'docs/agent_memory.md'."
    except Exception as e:
        return f"Error recording lesson: {e}"
