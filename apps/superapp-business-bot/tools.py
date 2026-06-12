import os
import subprocess
import shutil
from pathlib import Path

import json

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

def execute_command(command: str) -> str:
    """Executes a powershell command in the active workspace and returns output."""
    cwd_path = get_active_workspace()
    # Preprocess command to convert Unix-like chains and filters to PowerShell equivalents
    import re as _re
    command = command.replace("&&", ";")
    command = _re.sub(r'\|\s*head\s+-n\s+(\d+)', r'| Select-Object -First \1', command)
    command = _re.sub(r'\|\s*head\s+-(\d+)', r'| Select-Object -First \1', command)

    try:
        # Run command inside active workspace using powershell
        result = subprocess.run(
            ["powershell", "-Command", command],
            cwd=str(cwd_path),
            text=True,
            capture_output=True,
            timeout=120
        )
        output = f"CWD: {cwd_path.relative_to(MONOREPO_ROOT).as_posix() or '.'}\n"
        if result.stdout:
            output += f"--- STDOUT ---\n{result.stdout}\n"
        if result.stderr:
            output += f"--- STDERR ---\n{result.stderr}\n"
        
        if not result.stdout and not result.stderr:
            output += "Command completed successfully with no output."
        return output
    except subprocess.TimeoutExpired:
        return f"Error: Command execution timed out after 120 seconds in {cwd_path.name}."
    except Exception as e:
        return f"Error executing command: {str(e)}"

def _resolve_path(user_path: str, must_exist: bool = True):
    """
    Smart dual-resolution: tries the path workspace-relative first, then monorepo-relative.
    """
    workspace = get_active_workspace()

    # --- Attempt 1: workspace-relative ---------------------------------
    candidate1 = (workspace / user_path).resolve()
    if str(candidate1).startswith(str(MONOREPO_ROOT)):
        if not must_exist or candidate1.exists():
            return candidate1, workspace

    # --- Attempt 2: monorepo-relative ----------------------------------
    candidate2 = (MONOREPO_ROOT / user_path).resolve()
    if str(candidate2).startswith(str(MONOREPO_ROOT)):
        if not must_exist or candidate2.exists():
            return candidate2, workspace

    return candidate1, workspace

def read_file(filepath: str) -> str:
    """Reads a file. Supports workspace-relative or monorepo-root-relative paths."""
    try:
        target, workspace = _resolve_path(filepath, must_exist=True)
        # Verify it stays inside monorepo bounds
        if not str(target).startswith(str(MONOREPO_ROOT)):
            return "Error: Access denied. Cannot read files outside the monorepo bounds."
        if not target.exists():
            return f"Error: File '{filepath}' does not exist in {workspace.name}."
        if target.is_dir():
            return f"Error: '{filepath}' is a directory."
        
        return target.read_text(encoding="utf-8", errors="replace")
    except Exception as e:
        return f"Error reading file: {str(e)}"

def write_file(filepath: str, content: str) -> str:
    """Writes content to a file. Supports workspace-relative or monorepo-root-relative paths."""
    try:
        target, workspace = _resolve_path(filepath, must_exist=False)
        # Verify it stays inside monorepo bounds
        if not str(target).startswith(str(MONOREPO_ROOT)):
            return "Error: Access denied. Cannot write files outside the monorepo bounds."
        
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(content, encoding="utf-8")
        return f"Successfully wrote {len(content)} characters to '{filepath}' relative to {workspace.name}."
    except Exception as e:
        return f"Error writing file: {str(e)}"

def list_directory(dirpath: str = ".") -> str:
    """Lists files and directories. Supports workspace-relative or monorepo-root-relative paths."""
    try:
        target, workspace = _resolve_path(dirpath, must_exist=True)
        if not str(target).startswith(str(MONOREPO_ROOT)):
            return "Error: Access denied. Cannot access directories outside the monorepo bounds."
        if not target.exists():
            return f"Error: Path '{dirpath}' does not exist in {workspace.name}."
        
        items = []
        for entry in target.iterdir():
            try:
                rel = entry.relative_to(workspace)
            except ValueError:
                try:
                    rel = entry.relative_to(MONOREPO_ROOT)
                except ValueError:
                    rel = entry.name
            type_str = "[DIR]" if entry.is_dir() else "[FILE]"
            rel_str = rel.as_posix() if hasattr(rel, "as_posix") else str(rel)
            items.append(f"{type_str} {rel_str}")
        
        if not items:
            return f"Directory '{dirpath}' is empty."
        return f"Directory listing of '{dirpath}' in {workspace.name}:\n" + "\n".join(sorted(items))
    except Exception as e:
        return f"Error listing directory: {str(e)}"

def kill_port(port: int) -> str:
    """Terminates any process occupying the specified port on Windows."""
    try:
        # PowerShell command to find process ID on port and kill it
        cmd = f"Get-NetTCPConnection -LocalPort {port} -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique | ForEach-Object {{ Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue }}"
        subprocess.run(["powershell", "-Command", cmd], capture_output=True, text=True)
        return f"Port {port} has been cleared."
    except Exception as e:
        return f"Error clearing port {port}: {str(e)}"

def run_background_server(command: str) -> str:
    """Launches a development server in the background using a hidden process."""
    cwd_path = get_active_workspace()
    try:
        # Launch cmd.exe running the target command in the workspace directory hidden
        cmd = f"Start-Process -FilePath 'cmd.exe' -ArgumentList '/c', '{command}' -WorkingDirectory '{str(cwd_path)}' -WindowStyle Hidden"
        subprocess.run(["powershell", "-Command", cmd], capture_output=True, text=True)
        return f"Background process '{command}' started in {cwd_path.name}."
    except Exception as e:
        return f"Error starting background server: {str(e)}"
