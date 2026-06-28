-- Insforge Core Schema: AI Infrastructure Tables
-- Auto-executed on container init

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "vector";

-- ============================================================
-- 1. CONVERSATION HISTORY (OpenHands / Agent sessions)
-- ============================================================
CREATE TABLE IF NOT EXISTS conversation_history (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(100) NOT NULL,
    agent_type VARCHAR(50) DEFAULT 'openhands',
    role VARCHAR(20) NOT NULL,
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_conv_session ON conversation_history(session_id);
CREATE INDEX IF NOT EXISTS idx_conv_created ON conversation_history(created_at DESC);

-- ============================================================
-- 2. DEPLOYMENT LOG
-- ============================================================
CREATE TABLE IF NOT EXISTS deployment_log (
    id SERIAL PRIMARY KEY,
    app_name VARCHAR(100) NOT NULL,
    environment VARCHAR(20) DEFAULT 'production',
    platform VARCHAR(20) DEFAULT 'vercel',
    deploy_url TEXT,
    commit_hash VARCHAR(40),
    status VARCHAR(20) DEFAULT 'pending',
    error_message TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    deployed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_deploy_app ON deployment_log(app_name);
CREATE INDEX IF NOT EXISTS idx_deploy_status ON deployment_log(status);

-- ============================================================
-- 3. DECISION LOG (Architecture / Tech choices)
-- ============================================================
CREATE TABLE IF NOT EXISTS decision_log (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    context TEXT NOT NULL,
    decision TEXT NOT NULL,
    alternatives TEXT,
    consequences TEXT,
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 4. CODEBASE INDEX (DeepWiki / NotebookLM)
-- ============================================================
CREATE TABLE IF NOT EXISTS codebase_index (
    id SERIAL PRIMARY KEY,
    file_path TEXT NOT NULL UNIQUE,
    file_type VARCHAR(20),
    language VARCHAR(30),
    lines_count INT DEFAULT 0,
    summary TEXT,
    key_functions TEXT[],
    key_classes TEXT[],
    imports TEXT[],
    dependencies TEXT[],
    complexity_score INT DEFAULT 0,
    last_modified TIMESTAMP,
    indexed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_cb_path ON codebase_index(file_path);
CREATE INDEX IF NOT EXISTS idx_cb_lang ON codebase_index(language);
CREATE INDEX IF NOT EXISTS idx_cb_search ON codebase_index USING gin(summary gin_trgm_ops);

-- ============================================================
-- 5. CODEBASE RELATIONSHIPS (Dependency graph)
-- ============================================================
CREATE TABLE IF NOT EXISTS codebase_relations (
    id SERIAL PRIMARY KEY,
    source_file TEXT NOT NULL,
    target_file TEXT NOT NULL,
    relation_type VARCHAR(30) DEFAULT 'imports',
    metadata JSONB DEFAULT '{}'::jsonb
);
CREATE INDEX IF NOT EXISTS idx_rel_source ON codebase_relations(source_file);
CREATE INDEX IF NOT EXISTS idx_rel_target ON codebase_relations(target_file);

-- ============================================================
-- 6. VIBE CODING TRACKER (Session progress)
-- ============================================================
CREATE TABLE IF NOT EXISTS vibe_sessions (
    id SERIAL PRIMARY KEY,
    session_name VARCHAR(255),
    agent_type VARCHAR(50) DEFAULT 'openhands',
    task_description TEXT,
    files_changed TEXT[] DEFAULT '{}',
    lines_added INT DEFAULT 0,
    lines_removed INT DEFAULT 0,
    commits_made INT DEFAULT 0,
    deploys_made INT DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active',
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_vibe_status ON vibe_sessions(status);
CREATE INDEX IF NOT EXISTS idx_vibe_started ON vibe_sessions(started_at DESC);

-- ============================================================
-- 7. KNOWLEDGE GRAPH (DeepWiki entities)
-- ============================================================
CREATE TABLE IF NOT EXISTS knowledge_entities (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    file_path TEXT,
    description TEXT,
    properties JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_ke_name ON knowledge_entities USING gin(name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_ke_type ON knowledge_entities(entity_type);

CREATE TABLE IF NOT EXISTS knowledge_relations (
    id SERIAL PRIMARY KEY,
    source_entity_id INT REFERENCES knowledge_entities(id) ON DELETE CASCADE,
    target_entity_id INT REFERENCES knowledge_entities(id) ON DELETE CASCADE,
    relation_type VARCHAR(50) NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb
);
CREATE INDEX IF NOT EXISTS idx_kr_source ON knowledge_relations(source_entity_id);
CREATE INDEX IF NOT EXISTS idx_kr_target ON knowledge_relations(target_entity_id);

-- ============================================================
-- 8. AI MEMORY (Enhanced long_term_memory)
-- ============================================================
CREATE TABLE IF NOT EXISTS ai_memory (
    id SERIAL PRIMARY KEY,
    key VARCHAR(200) NOT NULL UNIQUE,
    value TEXT NOT NULL,
    category VARCHAR(50) DEFAULT 'general',
    tags TEXT[] DEFAULT '{}',
    access_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_aim_category ON ai_memory(category);
CREATE INDEX IF NOT EXISTS idx_aim_tags ON ai_memory USING gin(tags);

-- ============================================================
-- 9. ERROR PATTERNS (Learn from mistakes)
-- ============================================================
CREATE TABLE IF NOT EXISTS error_patterns (
    id SERIAL PRIMARY KEY,
    error_type VARCHAR(100),
    error_message TEXT NOT NULL,
    file_path TEXT,
    fix_description TEXT,
    fix_code TEXT,
    occurrence_count INT DEFAULT 1,
    first_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_ep_type ON error_patterns(error_type);
CREATE INDEX IF NOT EXISTS idx_ep_search ON error_patterns USING gin(error_message gin_trgm_ops);
