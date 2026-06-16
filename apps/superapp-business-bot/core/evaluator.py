import os
import json
import logging
from pathlib import Path
import tools
import core.ai_router as ai_router

logger = logging.getLogger("ATA.evaluator")

def evaluate_codebase() -> str:
    """
    Evaluates codebase structure, metrics, and quality locally (0-token cloud consumption).
    First aggregates codebase stats, then queries Ollama for code quality review.
    """
    cwd = tools.get_active_workspace()
    logger.info(f"Initiating codebase evaluation for workspace: {cwd.name}")
    
    # 1. Gather static metrics
    files_to_scan = []
    file_type_counts = {}
    total_size = 0
    total_lines = 0
    
    extensions_to_track = {'.js', '.ts', '.jsx', '.tsx', '.css', '.html', '.json', '.py'}
    
    # Scan files up to max depth to avoid resource hogs
    max_files = 300
    file_count = 0
    for root, dirs, files in os.walk(cwd):
        # Ignore node_modules, .git, .next, dist
        if any(ignored in root for ignored in ['node_modules', '.git', '.next', 'dist', 'build', '.vercel']):
            continue
            
        for file in files:
            file_count += 1
            if file_count > max_files:
                break
                
            filepath = Path(root) / file
            ext = filepath.suffix.lower()
            
            if ext in extensions_to_track:
                size = filepath.stat().st_size
                total_size += size
                file_type_counts[ext] = file_type_counts.get(ext, 0) + 1
                
                # Sample lines of code for stats
                if size < 100000: # skip huge files
                    try:
                        lines = len(filepath.read_text(encoding="utf-8", errors="ignore").splitlines())
                        total_lines += lines
                        if len(files_to_scan) < 5 and ext in {'.ts', '.tsx', '.js', '.jsx'}:
                            # Grab top files for structural sampling
                            files_to_scan.append((filepath.name, filepath.read_text(encoding="utf-8", errors="ignore")[:2000]))
                    except Exception:
                        pass
        if file_count > max_files:
            break
            
    # Read package.json dependencies
    package_json = cwd / "package.json"
    deps = {}
    if package_json.exists():
        try:
            pkg_data = json.loads(package_json.read_text(encoding="utf-8"))
            deps = pkg_data.get("dependencies", {})
        except Exception:
            pass
            
    # 2. Build Ollama prompt
    eval_sys = (
        "You are an Elite Senior Code Auditor.\n"
        "Your task is to analyze the codebase statistics and file samples, and output a highly technical and professional Code Quality Audit report.\n"
        "Be extremely critical. Point out architectural concerns, code smells, or security vulnerabilities.\n"
        "Format your output beautifully using Markdown with these sections:\n"
        "### 📊 Codebase Overview\n"
        "### 🔍 Structural Architecture Review\n"
        "### ⚠️ Identified Code Smells & Risks\n"
        "### 🛠️ Optimization & Refactoring Strategy\n"
        "Keep the output extremely professional, concise, and direct. Output ONLY Markdown."
    )
    
    stats_prompt = (
        f"Workspace Application: {cwd.name}\n"
        f"Path: {cwd.as_posix()}\n"
        f"Total File Count of interest: {len(file_type_counts)}\n"
        f"File Type Stats: {json.dumps(file_type_counts)}\n"
        f"Total Lines of Code counted: {total_lines}\n"
        f"Total Size of source code files: {total_size / 1024:.1f} KB\n"
        f"Dependencies (package.json): {list(deps.keys())[:10]}\n\n"
    )
    
    # Add files snippet contexts
    for filename, content in files_to_scan:
        stats_prompt += f"=== Source Snippet: {filename} ===\n{content}\n\n"
        
    stats_prompt += "Please evaluate this codebase and provide your expert review."
    
    # Generate the audit using DeepSeek (primary) -> Nvidia (fallback)
    report_text = ""
    try:
        report_text = ai_router.query_ai(stats_prompt, system_prompt=eval_sys)
    except Exception as e:
        logger.error(f"Codebase audit via DeepSeek/Nvidia failed: {e}")
        report_text = (
                f"### 📊 Codebase Overview ({cwd.name})\n"
                f"- **Total lines sampled**: `{total_lines}` lines\n"
                f"- **Dependencies**: `{list(deps.keys())[:5]}`\n"
                f"- **Audit Status**: Local evaluation failed, fallback cloud analysis timed out.\n"
            )
            
    return report_text
