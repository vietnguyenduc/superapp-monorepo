"""
Insforge DeepWiki - Local NotebookLM for Codebase

Features:
- Index codebase files into PostgreSQL
- Full-text search across code
- AI-powered Q&A about codebase
- Knowledge graph (entities + relations)
- Vibe coding session tracker
- Decision log
- Error pattern learning

API:
- POST /index        - Index/re-index codebase
- GET  /search       - Search codebase
- POST /ask          - Ask question about codebase (AI)
- GET  /stats        - Codebase statistics
- GET  /graph        - Knowledge graph
- GET  /decisions    - List decisions
- POST /decisions    - Log a decision
- GET  /sessions     - Vibe coding sessions
- POST /sessions     - Start/end a session
- GET  /memory       - Read AI memory
- POST /memory       - Write AI memory
- GET  /errors       - Error patterns
- POST /errors       - Log error pattern
"""

import os
import json
import logging
import asyncio
from datetime import datetime
from pathlib import Path
from fastapi import FastAPI, Request, HTTPException, Query
from pydantic import BaseModel
import asyncpg
import httpx

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("insforge-deepwiki")

app = FastAPI(title="Insforge DeepWiki", version="1.0.0")

DB_URL = os.environ.get("DB_URL", "postgresql://postgres:postgres@localhost:5432/insforge")
MONOREPO_PATH = os.environ.get("MONOREPO_PATH", "/workspace")
OPENROUTER_API_KEY = os.environ.get("DEEPSEEK_API_KEY", "")  # Reuse DeepSeek key (OpenRouter removed)

# File extensions to index
INDEXABLE_EXTENSIONS = {
    ".ts", ".tsx", ".js", ".jsx", ".py", ".json", ".yaml", ".yml",
    ".md", ".sql", ".sh", ".ps1", ".css", ".html", ".vue", ".svelte",
}

# Directories to skip
SKIP_DIRS = {
    "node_modules", ".git", "dist", "build", "__pycache__",
    ".next", ".cache", "coverage", ".turbo", ".vite",
}

SKIP_PATTERNS = {".min.js", ".min.css", ".map", ".lock", "-lock."}

# Language mapping
LANG_MAP = {
    ".ts": "typescript", ".tsx": "typescript", ".js": "javascript",
    ".jsx": "javascript", ".py": "python", ".json": "json",
    ".yaml": "yaml", ".yml": "yaml", ".md": "markdown",
    ".sql": "sql", ".sh": "shell", ".ps1": "powershell",
    ".css": "css", ".html": "html", ".vue": "vue", ".svelte": "svelte",
}

MAX_FILE_SIZE = 100_000  # 100KB limit per file


async def get_db():
    return await asyncpg.connect(DB_URL)


def should_index(file_path: Path) -> bool:
    if file_path.suffix.lower() not in INDEXABLE_EXTENSIONS:
        return False
    if any(skip in file_path.parts for skip in SKIP_DIRS):
        return False
    if any(p in file_path.name for p in SKIP_PATTERNS):
        return False
    try:
        if file_path.stat().st_size > MAX_FILE_SIZE:
            return False
    except OSError:
        return False
    return True


def extract_info(content: str, lang: str) -> dict:
    lines = content.split("\n")
    functions = []
    classes = []
    imports = []

    for line in lines:
        stripped = line.strip()

        if lang in ("typescript", "javascript"):
            if any(kw in stripped for kw in ["function ", "const ", "async ", "=>"]):
                if "function" in stripped or "=>" in stripped:
                    name_match = stripped.split("(")[0]
                    if len(name_match) < 100:
                        functions.append(name_match[-60:])
            if "class " in stripped and "className" not in stripped:
                classes.append(stripped[:80])
            if stripped.startswith("import ") or stripped.startswith("from "):
                imports.append(stripped[:120])

        elif lang == "python":
            if stripped.startswith("def ") or stripped.startswith("async def "):
                functions.append(stripped[:80])
            if stripped.startswith("class "):
                classes.append(stripped[:80])
            if stripped.startswith("import ") or stripped.startswith("from "):
                imports.append(stripped[:120])

    return {
        "functions": functions[:20],
        "classes": classes[:10],
        "imports": imports[:30],
    }


def generate_summary(file_path: str, content: str, lang: str, info: dict) -> str:
    lines = content.split("\n")
    first_lines = " ".join(lines[:5]).strip()[:200]
    func_count = len(info["functions"])
    class_count = len(info["classes"])
    import_count = len(info["imports"])

    parts = [f"File: {file_path}"]
    parts.append(f"Language: {lang}")
    parts.append(f"Lines: {len(lines)}")
    if func_count:
        parts.append(f"Functions: {', '.join(info['functions'][:5])}")
    if class_count:
        parts.append(f"Classes: {', '.join(info['classes'][:5])}")
    if import_count:
        parts.append(f"Imports: {import_count} dependencies")
    if first_lines:
        parts.append(f"Preview: {first_lines}")
    return " | ".join(parts)


# ============================================================
# MODELS
# ============================================================

class IndexRequest(BaseModel):
    force: bool = False

class AskRequest(BaseModel):
    question: str
    context_files: int = 5

class DecisionRequest(BaseModel):
    title: str
    context: str
    decision: str
    alternatives: str = ""
    consequences: str = ""
    tags: list[str] = []

class SessionRequest(BaseModel):
    session_name: str = ""
    agent_type: str = "openhands"
    task_description: str = ""
    status: str = "active"

class MemoryRequest(BaseModel):
    key: str
    value: str
    category: str = "general"
    tags: list[str] = []

class ErrorPatternRequest(BaseModel):
    error_type: str = ""
    error_message: str
    file_path: str = ""
    fix_description: str = ""
    fix_code: str = ""


# ============================================================
# ENDPOINTS
# ============================================================

@app.get("/")
async def root():
    return {"status": "ok", "service": "insforge-deepwiki", "version": "1.0.0"}


@app.get("/health")
async def health():
    try:
        conn = await get_db()
        await conn.close()
        return {"status": "healthy", "db": "connected"}
    except Exception as e:
        return {"status": "unhealthy", "error": str(e)}


@app.post("/index")
async def index_codebase(req: IndexRequest):
    """Index all indexable files in the monorepo."""
    workspace = Path(MONOREPO_PATH)
    if not workspace.exists():
        raise HTTPException(status_code=404, detail=f"Workspace not found: {MONOREPO_PATH}")

    conn = await get_db()
    indexed = 0
    skipped = 0
    errors = 0

    try:
        for file_path in workspace.rglob("*"):
            if not file_path.is_file():
                continue
            if not should_index(file_path):
                continue

            try:
                rel_path = str(file_path.relative_to(workspace)).replace("\\", "/")
                content = file_path.read_text(encoding="utf-8", errors="ignore")
                lang = LANG_MAP.get(file_path.suffix.lower(), "unknown")
                info = extract_info(content, lang)
                summary = generate_summary(rel_path, content, lang, info)
                stat = file_path.stat()

                await conn.execute("""
                    INSERT INTO codebase_index 
                        (file_path, file_type, language, lines_count, summary, 
                         key_functions, key_classes, imports, complexity_score, last_modified, indexed_at)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
                    ON CONFLICT (file_path) DO UPDATE SET
                        summary = EXCLUDED.summary,
                        key_functions = EXCLUDED.key_functions,
                        key_classes = EXCLUDED.key_classes,
                        imports = EXCLUDED.imports,
                        lines_count = EXCLUDED.lines_count,
                        last_modified = EXCLUDED.last_modified,
                        indexed_at = NOW()
                """,
                    rel_path,
                    file_path.suffix.lstrip("."),
                    lang,
                    len(content.split("\n")),
                    summary,
                    info["functions"],
                    info["classes"],
                    info["imports"],
                    min(len(info["functions"]) + len(info["classes"]) * 2, 100),
                    datetime.fromtimestamp(stat.st_mtime),
                )
                indexed += 1
            except Exception as e:
                logger.error(f"Error indexing {file_path}: {e}")
                errors += 1

        return {
            "status": "ok",
            "indexed": indexed,
            "skipped": skipped,
            "errors": errors,
        }
    finally:
        await conn.close()


@app.get("/search")
async def search_codebase(
    q: str = Query(..., description="Search query"),
    lang: str = Query("", description="Filter by language"),
    limit: int = Query(20, le=100),
):
    """Full-text search across indexed codebase."""
    conn = await get_db()
    try:
        if lang:
            rows = await conn.fetch("""
                SELECT file_path, language, lines_count, summary,
                       key_functions, key_classes
                FROM codebase_index
                WHERE language = $1 AND summary ILIKE '%' || $2 || '%'
                ORDER BY similarity(summary, $2) DESC
                LIMIT $3
            """, lang, q, limit)
        else:
            rows = await conn.fetch("""
                SELECT file_path, language, lines_count, summary,
                       key_functions, key_classes
                FROM codebase_index
                WHERE summary ILIKE '%' || $1 || '%'
                   OR file_path ILIKE '%' || $1 || '%'
                   OR $1 = ANY(key_functions)
                   OR $1 = ANY(key_classes)
                ORDER BY similarity(summary, $1) DESC
                LIMIT $2
            """, q, limit)

        return {
            "query": q,
            "results": [dict(r) for r in rows],
            "count": len(rows),
        }
    finally:
        await conn.close()


@app.post("/ask")
async def ask_codebase(req: AskRequest):
    """Ask a question about the codebase using AI + indexed data."""
    conn = await get_db()
    try:
        rows = await conn.fetch("""
            SELECT file_path, language, summary, key_functions, key_classes
            FROM codebase_index
            ORDER BY indexed_at DESC
            LIMIT 100
        """)

        file_summaries = "\n".join([
            f"- {r['file_path']} ({r['language']}): {r['summary'][:150]}"
            for r in rows[:50]
        ])

        context = f"""You are a codebase expert. Here is the indexed codebase:

{file_summaries}

Question: {req.question}

Answer based on the codebase structure above. Be specific about file paths and functions."""

        if not OPENROUTER_API_KEY:
            return {
                "question": req.question,
                "answer": "No DEEPSEEK_API_KEY set. Here are relevant files:\n" + file_summaries[:2000],
                "context_files": len(rows),
            }

        async with httpx.AsyncClient(timeout=60) as client:
            response = await client.post(
                "https://api.deepseek.com/chat/completions",
                headers={
                    "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": "deepseek-chat",
                    "messages": [
                        {"role": "system", "content": "You are a codebase analysis assistant. Answer concisely."},
                        {"role": "user", "content": context},
                    ],
                    "max_tokens": 1000,
                },
            )
            data = response.json()
            answer = data.get("choices", [{}])[0].get("message", {}).get("content", "No answer")

        return {
            "question": req.question,
            "answer": answer,
            "context_files": len(rows),
        }
    finally:
        await conn.close()


@app.get("/stats")
async def codebase_stats():
    """Get codebase statistics."""
    conn = await get_db()
    try:
        total = await conn.fetchval("SELECT COUNT(*) FROM codebase_index")
        by_lang = await conn.fetch("""
            SELECT language, COUNT(*) as count, SUM(lines_count) as total_lines
            FROM codebase_index
            GROUP BY language
            ORDER BY count DESC
        """)
        total_lines = await conn.fetchval("SELECT SUM(lines_count) FROM codebase_index")
        decisions = await conn.fetchval("SELECT COUNT(*) FROM decision_log")
        sessions = await conn.fetchval("SELECT COUNT(*) FROM vibe_sessions WHERE status = 'active'")
        errors = await conn.fetchval("SELECT COUNT(*) FROM error_patterns")

        return {
            "total_files": total,
            "total_lines": total_lines or 0,
            "by_language": [dict(r) for r in by_lang],
            "decisions_logged": decisions,
            "active_sessions": sessions,
            "error_patterns": errors,
        }
    finally:
        await conn.close()


@app.get("/graph")
async def knowledge_graph():
    """Get knowledge graph entities and relations."""
    conn = await get_db()
    try:
        entities = await conn.fetch("SELECT id, name, entity_type, file_path, description FROM knowledge_entities LIMIT 200")
        relations = await conn.fetch("""
            SELECT source_entity_id, target_entity_id, relation_type
            FROM knowledge_relations LIMIT 200
        """)
        return {
            "entities": [dict(r) for r in entities],
            "relations": [dict(r) for r in relations],
        }
    finally:
        await conn.close()


# Decision Log
@app.get("/decisions")
async def list_decisions(limit: int = Query(50, le=200)):
    conn = await get_db()
    try:
        rows = await conn.fetch("SELECT * FROM decision_log ORDER BY created_at DESC LIMIT $1", limit)
        return {"decisions": [dict(r) for r in rows]}
    finally:
        await conn.close()


@app.post("/decisions")
async def log_decision(req: DecisionRequest):
    conn = await get_db()
    try:
        await conn.execute("""
            INSERT INTO decision_log (title, context, decision, alternatives, consequences, tags)
            VALUES ($1, $2, $3, $4, $5, $6)
        """, req.title, req.context, req.decision, req.alternatives, req.consequences, req.tags)
        return {"status": "ok", "message": "Decision logged"}
    finally:
        await conn.close()


# Vibe Sessions
@app.get("/sessions")
async def list_sessions(limit: int = Query(20, le=100)):
    conn = await get_db()
    try:
        rows = await conn.fetch("SELECT * FROM vibe_sessions ORDER BY started_at DESC LIMIT $1", limit)
        return {"sessions": [dict(r) for r in rows]}
    finally:
        await conn.close()


@app.post("/sessions")
async def manage_session(req: SessionRequest):
    conn = await get_db()
    try:
        if req.status == "active":
            row = await conn.fetchrow("""
                INSERT INTO vibe_sessions (session_name, agent_type, task_description, status)
                VALUES ($1, $2, $3, 'active')
                RETURNING id
            """, req.session_name, req.agent_type, req.task_description)
            return {"status": "ok", "session_id": row["id"]}
        else:
            await conn.execute("""
                UPDATE vibe_sessions SET status = $1, ended_at = NOW()
                WHERE status = 'active'
            """, req.status)
            return {"status": "ok", "message": "Sessions ended"}
    finally:
        await conn.close()


# AI Memory
@app.get("/memory")
async def read_memory(category: str = Query("")):
    conn = await get_db()
    try:
        if category:
            rows = await conn.fetch("SELECT key, value, category, tags FROM ai_memory WHERE category = $1 ORDER BY updated_at DESC", category)
        else:
            rows = await conn.fetch("SELECT key, value, category, tags FROM ai_memory ORDER BY updated_at DESC LIMIT 100")
        return {"memories": [dict(r) for r in rows]}
    finally:
        await conn.close()


@app.post("/memory")
async def write_memory(req: MemoryRequest):
    conn = await get_db()
    try:
        await conn.execute("""
            INSERT INTO ai_memory (key, value, category, tags, updated_at)
            VALUES ($1, $2, $3, $4, NOW())
            ON CONFLICT (key) DO UPDATE SET
                value = EXCLUDED.value,
                category = EXCLUDED.category,
                tags = EXCLUDED.tags,
                updated_at = NOW()
        """, req.key, req.value, req.category, req.tags)
        return {"status": "ok", "message": "Memory saved"}
    finally:
        await conn.close()


# Error Patterns
@app.get("/errors")
async def list_errors(limit: int = Query(20, le=100)):
    conn = await get_db()
    try:
        rows = await conn.fetch("SELECT * FROM error_patterns ORDER BY last_seen DESC LIMIT $1", limit)
        return {"errors": [dict(r) for r in rows]}
    finally:
        await conn.close()


@app.post("/errors")
async def log_error(req: ErrorPatternRequest):
    conn = await get_db()
    try:
        existing = await conn.fetchrow("""
            SELECT id, occurrence_count FROM error_patterns
            WHERE error_message = $1 AND COALESCE(file_path, '') = COALESCE($2, '')
        """, req.error_message, req.file_path)

        if existing:
            await conn.execute("""
                UPDATE error_patterns SET
                    occurrence_count = occurrence_count + 1,
                    last_seen = NOW(),
                    fix_description = $1,
                    fix_code = $2
                WHERE id = $3
            """, req.fix_description, req.fix_code, existing["id"])
            return {"status": "ok", "message": "Error updated", "occurrences": existing["occurrence_count"] + 1}
        else:
            await conn.execute("""
                INSERT INTO error_patterns (error_type, error_message, file_path, fix_description, fix_code)
                VALUES ($1, $2, $3, $4, $5)
            """, req.error_type, req.error_message, req.file_path, req.fix_description, req.fix_code)
            return {"status": "ok", "message": "Error logged"}
    finally:
        await conn.close()


# Deployments
@app.get("/deployments")
async def list_deployments(limit: int = Query(20, le=100)):
    conn = await get_db()
    try:
        rows = await conn.fetch("SELECT * FROM deployment_log ORDER BY deployed_at DESC LIMIT $1", limit)
        return {"deployments": [dict(r) for r in rows]}
    finally:
        await conn.close()


@app.post("/deployments")
async def log_deployment(
    app_name: str = Query(...),
    environment: str = Query("production"),
    platform: str = Query("vercel"),
    deploy_url: str = Query(""),
    commit_hash: str = Query(""),
    status: str = Query("success"),
):
    conn = await get_db()
    try:
        row = await conn.fetchrow("""
            INSERT INTO deployment_log (app_name, environment, platform, deploy_url, commit_hash, status)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id
        """, app_name, environment, platform, deploy_url, commit_hash, status)
        return {"status": "ok", "deployment_id": row["id"]}
    finally:
        await conn.close()
