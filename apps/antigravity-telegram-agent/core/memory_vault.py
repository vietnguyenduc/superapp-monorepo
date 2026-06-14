import os
import re
import time
import json
import logging
from pathlib import Path
import core.ai_router as ai_router
from core.provider_registry import get_registry

logger = logging.getLogger("ATA.memory_vault")
VAULT_DIR = Path(__file__).parent / "memory_vault"
VAULT_DIR.mkdir(parents=True, exist_ok=True)

def slugify(text: str) -> str:
    """Helper to convert prompt text into a clean filename slug."""
    text = text.lower()
    text = re.sub(r'[^a-z0-9\s-]', '', text)
    text = re.sub(r'[\s-]+', '_', text)
    return text[:30].strip('_')

def get_embedding(text: str) -> list:
    """Fetches embedding vector via Gemini API using the standard google-genai Client."""
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        return []
    try:
        from google import genai
        client = genai.Client(api_key=api_key)
        try:
            response = client.models.embed_content(
                model="gemini-embedding-2",
                contents=text
            )
        except Exception:
            # Fallback to older stable model if gemini-embedding-2 is not supported on this endpoint
            response = client.models.embed_content(
                model="gemini-embedding-001",
                contents=text
            )
        if response.embeddings:
            return response.embeddings[0].values
    except Exception as e:
        logger.error(f"Error fetching embedding from Gemini: {e}")
    return []

def cosine_similarity(v1: list, v2: list) -> float:
    """Computes cosine similarity between two float vectors in pure Python."""
    if not v1 or not v2 or len(v1) != len(v2):
        return 0.0
    dot_product = sum(a * b for a, b in zip(v1, v2))
    norm_a = sum(a * a for a in v1) ** 0.5
    norm_b = sum(b * b for b in v2) ** 0.5
    if norm_a == 0.0 or norm_b == 0.0:
        return 0.0
    return dot_product / (norm_a * norm_b)

def save_memory(prompt: str, result: str, success: bool, complexity: str):
    """
    Saves a successful or failing run into the local Memory Vault as a Markdown artifact,
    and generates its embedding vector for future semantic lookup.
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
    registry = get_registry()
    if registry.ollama.health_check():
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
        
        # Proactively generate and archive embedding
        embedding = get_embedding(memory_content)
        if embedding:
            json_path = filepath.with_suffix(".json")
            json_path.write_text(json.dumps({"vector": embedding}), encoding="utf-8")
            logger.info(f"Memory embedding successfully archived to {json_path.name}")
    except Exception as e:
        logger.error(f"Error saving memory file: {e}")

def get_relevant_memories(prompt: str) -> str:
    """
    Scans `core/memory_vault/` for experience files,
    performs dynamic Hybrid Search (Keyword overlap + Semantic Vector similarity via Gemini embeddings),
    and returns the top 3 matches formatted as LLM grounding context.
    """
    logger.info("Searching memory vault for relevant experience via Hybrid Search...")
    
    # We look for all .md files in the vault (including global_standards.md if stored there)
    files = list(VAULT_DIR.glob("*.md"))
    if not files:
        return "No past experiences recorded in memory vault."
        
    prompt_words = set(re.findall(r'\w+', prompt.lower()))
    
    # Pre-generate query embedding for semantic search
    query_vector = get_embedding(prompt)
    
    ranked = []
    missing_generated_count = 0
    
    for f in files:
        try:
            content = f.read_text(encoding="utf-8")
            
            # 1. Lexical Keyword Overlap Score
            content_words = set(re.findall(r'\w+', content.lower()))
            overlap = len(prompt_words.intersection(content_words))
            
            # 2. Semantic Similarity Score
            semantic_score = 0.0
            if query_vector:
                json_path = f.with_suffix(".json")
                vector = []
                if json_path.exists():
                    try:
                        vector = json.loads(json_path.read_text(encoding="utf-8")).get("vector", [])
                    except Exception:
                        pass
                else:
                    # Generate and cache embedding on the fly if it doesn't exist yet
                    # Limit backfill to 3 per search to prevent bot from hanging if there are too many missing
                    if missing_generated_count < 3:
                        logger.info(f"Generating missing embedding vector for {f.name}...")
                        vector = get_embedding(content)
                        if vector:
                            try:
                                json_path.write_text(json.dumps({"vector": vector}), encoding="utf-8")
                            except Exception:
                                pass
                        missing_generated_count += 1
                
                if vector:
                    semantic_score = cosine_similarity(query_vector, vector)
            
            # Combine scores (Hybrid score: 30% lexical keyword overlap, 70% semantic embedding similarity)
            # Normalize overlap by query length (lexical match percent)
            lexical_score = overlap / max(len(prompt_words), 1)
            hybrid_score = (0.3 * lexical_score) + (0.7 * semantic_score)
            
            ranked.append((hybrid_score, f.name, content))
        except Exception as e:
            logger.error(f"Error processing vault file {f.name}: {e}")
            
    # Sort descending by hybrid similarity score
    ranked.sort(key=lambda x: x[0], reverse=True)
    
    # Grab top 3
    top_3 = ranked[:3]
    
    # Fallback to recency ranking if all match scores are absolute zero
    if not top_3 or top_3[0][0] == 0:
        ranked_by_mtime = sorted(files, key=lambda x: x.stat().st_mtime, reverse=True)
        top_3 = []
        for f in ranked_by_mtime[:3]:
            try:
                top_3.append((0.0, f.name, f.read_text(encoding="utf-8")))
            except Exception:
                pass
                
    formatted_context = "=== PAST EXPERIENCES & STANDARDS (From Local Memory Vault) ===\n"
    for idx, (score, fname, content) in enumerate(top_3, 1):
        score_desc = f"(Hybrid Match Score: {score:.2f})" if score > 0 else "(Recency Fallback)"
        formatted_context += f"\n--- Experience {idx} ({fname}) {score_desc} ---\n{content}\n"
        
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
        
        dev_vault_dir = Path(__file__).parent / "memory_vault"
        biz_vault_dir = root_dir / "apps" / "superapp-business-bot" / "core" / "memory_vault"
        
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

