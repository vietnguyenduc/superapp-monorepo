import os
import re
import time
import json
import logging
from pathlib import Path
import core.ai_router as ai_router

logger = logging.getLogger("ATA.memory_vault")
VAULT_DIR = Path(__file__).parent / "memory_vault"
VAULT_DIR.mkdir(parents=True, exist_ok=True)

def slugify(text: str) -> str:
    """Helper to convert prompt text into a clean filename slug."""
    text = text.lower()
    text = re.sub(r'[^a-z0-9\s-]', '', text)
    text = re.sub(r'[\s-]+', '_', text)
    return text[:30].strip('_')

def save_memory(prompt: str, result: str, success: bool, complexity: str):
    """
    Saves a successful or failing run into the local Memory Vault as a Markdown artifact.
    Designed to run asynchronously/synchronously.
    """
    logger.info("Generating memory artifact for recent vibe task...")
    timestamp = int(time.time())
    slug = slugify(prompt) or "vibe_task"
    filename = f"MEM_{timestamp}_{slug}.md"
    filepath = VAULT_DIR / filename
    
    # Prompt LLM to format the experience
    sys_instruction = (
        "You are the Vibe Gate Memory Archiver.\n"
        "Your task is to summarize the recent vibe-coding task into a clean Markdown experience file.\n"
        "Format your response EXACTLY with these headings:\n"
        "# Task Objective\n"
        "[summarize objective]\n"
        "# Strategy Used\n"
        "[summarize strategy]\n"
        "# Code Snippets (Skills)\n"
        "[include key files edited or terminal commands used]\n"
        "# Lessons Learned\n"
        "[list what succeeded, what failed, or how errors were healed]\n"
        "Do NOT include any extra chats, intros, or summaries."
    )
    
    task_context = (
        f"Prompt/Objective: {prompt}\n"
        f"Execution Success: {success}\n"
        f"Complexity: {complexity}\n"
        f"Result Details:\n{result}"
    )
    
    memory_content = ""
    if ai_router.check_ollama_status():
        try:
            memory_content = ai_router.query_ollama(task_context, system_prompt=sys_instruction)
        except Exception:
            pass
            
    if not memory_content:
        try:
            memory_content = ai_router.query_gemini(task_context, system_prompt=sys_instruction)
        except Exception as e:
            logger.error(f"Failed to generate memory content via Gemini: {e}")
            # Fallback local generate
            memory_content = (
                f"# Task Objective\n{prompt}\n\n"
                f"# Strategy Used\nDirect self-healing command execution.\n\n"
                f"# Code Snippets (Skills)\n{result[:500]}\n\n"
                f"# Lessons Learned\nExecution completed with success={success} and complexity={complexity}."
            )
            
    try:
        filepath.write_text(memory_content, encoding="utf-8")
        logger.info(f"Memory successfully archived to {filename}")
    except Exception as e:
        logger.error(f"Error saving memory file: {e}")

def get_relevant_memories(prompt: str) -> str:
    """
    Scans `core/memory_vault/` for files, ranks them by keyword overlap,
    and returns the top 3 experiences formatted as context.
    """
    logger.info("Searching memory vault for relevant experience...")
    files = list(VAULT_DIR.glob("MEM_*.md"))
    if not files:
        return "No past experiences recorded in memory vault."
        
    prompt_words = set(re.findall(r'\w+', prompt.lower()))
    ranked = []
    
    for f in files:
        try:
            content = f.read_text(encoding="utf-8")
            content_words = set(re.findall(r'\w+', content.lower()))
            overlap = len(prompt_words.intersection(content_words))
            ranked.append((overlap, f.name, content))
        except Exception:
            pass
            
    # Sort descending by overlap count
    ranked.sort(key=lambda x: x[0], reverse=True)
    
    # Grab top 3
    top_3 = ranked[:3]
    if not top_3 or top_3[0][0] == 0:
        # Default to the 3 most recent files if keyword search finds nothing
        ranked_by_mtime = sorted(files, key=lambda x: x.stat().st_mtime, reverse=True)
        top_3 = []
        for f in ranked_by_mtime[:3]:
            try:
                top_3.append((0, f.name, f.read_text(encoding="utf-8")))
            except Exception:
                pass
                
    formatted_context = "=== PAST EXPERIENCES (From Local Memory Vault) ===\n"
    for idx, (score, fname, content) in enumerate(top_3, 1):
        formatted_context += f"\n--- Experience {idx} ({fname}) ---\n{content}\n"
        
    return formatted_context

def export_notebooklm_knowledge_base():
    """
    Consolidates global_standards.md, all MEM_*.md memories, and all SESSION_*.md log files
    from both Dev Bot and Business Bot vaults into a single unified knowledge base file
    at `notebooklm_sync/knowledge_base.md` in the monorepo root.
    """
    try:
        root_dir = Path(__file__).parents[3]
        export_dir = root_dir / "notebooklm_sync"
        export_dir.mkdir(parents=True, exist_ok=True)
        
        dev_vault_dir = root_dir / "apps" / "antigravity-telegram-agent" / "core" / "memory_vault"
        biz_vault_dir = Path(__file__).parent / "memory_vault"
        
        compiled_file = export_dir / "knowledge_base.md"
        
        lines = []
        lines.append("# 📚 UNIFIED MONOREPO KNOWLEDGE BASE (For Google NotebookLM)")
        lines.append(f"- **Compiled At:** {time.strftime('%Y-%m-%d %H:%M:%S')}")
        lines.append("- **Sources:** Global Standards, Experience Memories, and Chat Session Logs\n")
        
        # 1. Global Coding Standards
        lines.append("## 📜 PART 1: GLOBAL CODING STANDARDS & ARCHITECTURAL MEMORIES")
        standards_file = dev_vault_dir / "global_standards.md"
        if standards_file.exists():
            lines.append(standards_file.read_text(encoding="utf-8"))
        else:
            lines.append("_No global standards found._")
        lines.append("\n---\n")
        
        # Helper to extract and format memories and sessions
        def process_vault(vault_path, bot_label):
            mem_contents = []
            session_contents = []
            if not vault_path.exists():
                return mem_contents, session_contents
                
            # Sort files by name (which contains timestamp) to keep chronological order
            for f in sorted(vault_path.glob("*.md")):
                if f.name == "global_standards.md":
                    continue
                try:
                    content = f.read_text(encoding="utf-8")
                    if f.name.startswith("MEM_"):
                        mem_contents.append((f.name, content))
                    elif f.name.startswith("SESSION_"):
                        session_contents.append((f.name, content))
                except Exception as fe:
                    logger.error(f"Error reading {f.name} in {bot_label} vault: {fe}")
            return mem_contents, session_contents
            
        dev_mems, dev_sessions = process_vault(dev_vault_dir, "Dev Bot")
        biz_mems, biz_sessions = process_vault(biz_vault_dir, "Business Bot")
        
        # 2. Experience Memories (MEM_*)
        lines.append("## 🧠 PART 2: EXPERIENCE MEMORIES & SAVED LESSONS")
        all_mems = []
        for name, content in dev_mems:
            all_mems.append(f"### 💻 [Dev Bot Memory] {name}\n{content}\n")
        for name, content in biz_mems:
            all_mems.append(f"### 💼 [Business Bot Memory] {name}\n{content}\n")
            
        if all_mems:
            lines.extend(all_mems)
        else:
            lines.append("_No experience memories found in vaults._")
        lines.append("\n---\n")
        
        # 3. Conversational Sessions (SESSION_*)
        lines.append("## 📓 PART 3: CONVERSATIONAL SESSIONS & SELF-HEALING LOGS")
        all_sessions = []
        for name, content in dev_sessions:
            all_sessions.append(f"### 💻 [Dev Bot Session] {name}\n{content}\n")
        for name, content in biz_sessions:
            all_sessions.append(f"### 💼 [Business Bot Session] {name}\n{content}\n")
            
        if all_sessions:
            lines.extend(all_sessions)
        else:
            lines.append("_No active conversation sessions found._")
            
        compiled_file.write_text("\n".join(lines), encoding="utf-8")
        logger.info(f"Consolidated knowledge base written to {compiled_file}")
        return compiled_file
    except Exception as e:
        logger.error(f"Error compiling knowledge base: {e}", exc_info=True)
        raise e

