-- InsForge: Add vector embedding column to codebase_index for semantic search
-- Requires pgvector extension (CREATE EXTENSION vector;)

-- Add embedding column (384 dims = BAAI/bge-small-en-v1.5, local ONNX model via fastembed)
ALTER TABLE codebase_index ADD COLUMN IF NOT EXISTS embedding vector(384);

-- HNSW index for fast approximate nearest neighbor search
CREATE INDEX IF NOT EXISTS idx_cb_embedding ON codebase_index
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- Helper: find similar files by embedding
CREATE OR REPLACE FUNCTION find_similar_files(query_embedding vector(384), match_count int DEFAULT 10)
RETURNS TABLE (
  file_path TEXT,
  language VARCHAR,
  summary TEXT,
  similarity FLOAT
) AS $$
  SELECT
    file_path,
    language,
    summary,
    1 - (embedding <=> query_embedding) AS similarity
  FROM codebase_index
  WHERE embedding IS NOT NULL
  ORDER BY embedding <=> query_embedding
  LIMIT match_count;
$$ LANGUAGE SQL STABLE;
