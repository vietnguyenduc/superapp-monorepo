#!/usr/bin/env python3
"""RAG MVP for the Superapp monorepo.

Uses local Postgres (pgvector) + local FastEmbed embeddings by default.
Set EMBEDDING_MODEL to an OpenAI-compatible API model (e.g. text-embedding-3-small)
if you want cloud embeddings instead.

Run:
  python scripts/rag_mvp.py index [path]      # defaults to /workspace/project
  python scripts/rag_mvp.py search "query"
"""

import os, sys, json, textwrap, subprocess, sys
from pathlib import Path

DB = {
    "host": os.getenv("PGHOST", "localhost"),
    "port": os.getenv("PGPORT", "5432"),
    "user": os.getenv("PGUSER", "postgres"),
    "password": os.getenv("PGPASSWORD", "postgres"),
    "dbname": os.getenv("PGDATABASE", "postgres"),
}

EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "BAAI/bge-small-en-v1.5")
EMBEDDING_DIM = int(os.getenv("EMBEDDING_DIM", "384"))
API_KEY = os.getenv("OPENAI_API_KEY", os.getenv("DEEPSEEK_API_KEY", ""))
API_BASE = os.getenv("EMBEDDING_BASE_URL", "https://api.openai.com/v1")

def install(*pkgs):
    print(f"Installing {', '.join(pkgs)}...")
    subprocess.check_call([sys.executable, "-m", "pip", "install", "-q", "--upgrade", "--break-system-packages", *pkgs])

def get_embedder():
    if EMBEDDING_MODEL.startswith("http") or "/" not in EMBEDDING_MODEL.split(":")[0]:
        # Cloud API model: use OpenAI-compatible endpoint
        import requests
        def embed(texts):
            headers = {"Authorization": f"Bearer {API_KEY}", "Content-Type": "application/json"}
            body = {"model": EMBEDDING_MODEL, "input": texts, "encoding_format": "float"}
            resp = requests.post(f"{API_BASE}/embeddings", headers=headers, json=body, timeout=120)
            resp.raise_for_status()
            data = resp.json()
            return [d["embedding"] for d in data["data"]]
        return embed
    # Local model via fastembed
    try:
        from fastembed import TextEmbedding
    except ImportError:
        install("fastembed")
        from fastembed import TextEmbedding
    model = TextEmbedding(model_name=EMBEDDING_MODEL)
    def embed(texts):
        return list(model.embed(texts))
    return embed

def ensure_psycopg2():
    try:
        import psycopg2
    except ImportError:
        install("psycopg2-binary")
        import psycopg2
    return psycopg2

def get_conn():
    psycopg2 = ensure_psycopg2()
    return psycopg2.connect(
        host=DB["host"], port=DB["port"], user=DB["user"],
        password=DB["password"], dbname=DB["dbname"]
    )

def init_db():
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("CREATE EXTENSION IF NOT EXISTS vector;")
    cur.execute(f"""
        CREATE TABLE IF NOT EXISTS code_embeddings (
            id SERIAL PRIMARY KEY,
            file_path TEXT NOT NULL,
            chunk_index INT NOT NULL,
            chunk_text TEXT NOT NULL,
            embedding vector({EMBEDDING_DIM}),
            metadata JSONB,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            UNIQUE(file_path, chunk_index)
        );
    """)
    cur.execute("CREATE INDEX IF NOT EXISTS idx_code_embeddings_vec ON code_embeddings USING ivfflat (embedding vector_cosine_ops);")
    conn.commit()
    cur.close(); conn.close()
    print("DB initialized.")

def chunk_text(text, max_chars=1200, overlap=200):
    lines = text.splitlines()
    chunks = []
    buf = []
    cur_len = 0
    for line in lines:
        if cur_len + len(line) > max_chars and buf:
            chunks.append("\n".join(buf))
            buf = buf[-int(overlap/80):]
            cur_len = sum(len(l) for l in buf)
        buf.append(line)
        cur_len += len(line) + 1
    if buf:
        chunks.append("\n".join(buf))
    return chunks

def should_index(path):
    p = Path(path)
    if any(part.startswith('.') for part in p.parts):
        return False
    if any(x in str(p) for x in ['node_modules','dist','.next','build','coverage','__pycache__','.venv','.turbo','.angular','.svelte-kit','.solid']):
        return False
    return p.suffix in ['.ts','.tsx','.js','.jsx','.py','.sql','.md','.prisma','.json','.yaml','.yml']

def index_repo(repo_path, embedder):
    repo = Path(repo_path).resolve()
    files = [p for p in repo.rglob('*') if p.is_file() and should_index(p)]
    print(f"Found {len(files)} files to index.")
    conn = get_conn()
    cur = conn.cursor()
    try:
        for i, fpath in enumerate(files):
            try:
                text = fpath.read_text(encoding='utf-8', errors='ignore').replace('\x00', '')
            except Exception as e:
                print(f"Skip {fpath}: {e}")
                continue
            if not text.strip():
                continue
            relpath = str(fpath.relative_to(repo))
            chunks = chunk_text(text)
            if not chunks:
                continue
            try:
                embs = embedder(chunks)
            except Exception as e:
                print(f"Embed error for {relpath}: {e}")
                continue
            for idx, (chunk, emb) in enumerate(zip(chunks, embs)):
                emb_list = [float(v) for v in emb]
                cur.execute(
                    "INSERT INTO code_embeddings (file_path, chunk_index, chunk_text, embedding, metadata) VALUES (%s, %s, %s, %s, %s) ON CONFLICT (file_path, chunk_index) DO UPDATE SET chunk_text=EXCLUDED.chunk_text, embedding=EXCLUDED.embedding, metadata=EXCLUDED.metadata, created_at=NOW()",
                    (relpath, idx, chunk, json.dumps(emb_list), json.dumps({"size": len(chunk)}))
                )
            if (i+1) % 10 == 0:
                print(f"Indexed {i+1}/{len(files)}...")
                conn.commit()
        conn.commit()
    finally:
        cur.close(); conn.close()
    print("Indexing done.")

def search(query, embedder, top_k=5):
    embs = embedder([query])
    emb = [float(v) for v in embs[0]]
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(
        "SELECT file_path, chunk_index, chunk_text, metadata, 1 - (embedding <=> %s::vector) as sim FROM code_embeddings ORDER BY embedding <=> %s::vector LIMIT %s",
        (json.dumps(emb), json.dumps(emb), top_k)
    )
    rows = cur.fetchall()
    cur.close(); conn.close()
    print(f"Top {len(rows)} results for: {query}\n")
    for file_path, idx, text, meta, sim in rows:
        print(f"--- {file_path} (chunk {idx}, sim {sim:.3f}) ---")
        print(textwrap.shorten(text, width=600))
        print()

def main():
    init_db()
    cmd = sys.argv[1] if len(sys.argv) > 1 else 'search'
    embedder = get_embedder()
    if cmd == 'index':
        repo = sys.argv[2] if len(sys.argv) > 2 else '/workspace/project'
        index_repo(repo, embedder)
    elif cmd == 'search':
        query = ' '.join(sys.argv[2:]) if len(sys.argv) > 2 else 'How do I add a new Vite app?'
        search(query, embedder)
    else:
        print(__doc__)

if __name__ == '__main__':
    main()
