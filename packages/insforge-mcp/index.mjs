#!/usr/bin/env node
/**
 * InsForge MCP Server — AI-native database tools for OpenHands.
 *
 * Tools:
 *   list_tables          — List all tables in insforge DB
 *   describe_table       — Show columns + types for a table
 *   query                — Run a read-only SQL query (SELECT)
 *   execute              — Run a write query (INSERT/UPDATE/DELETE) — requires confirm flag
 *   create_table         — Create a new table from column definitions
 *   alter_table          — Add/drop/modify columns
 *   drop_table           — Drop a table (requires confirm: true)
 *   insert_rows          — Insert rows into a table
 *   list_migrations      — List applied migrations
 *   apply_migration      — Run a SQL migration file (records in schema_migrations)
 *   rollback_migration   — Rollback last migration (if down_sql recorded)
 *   search_codebase      — Semantic search across indexed code (DeepWiki)
 *   ask_codebase         — Ask AI a question about the codebase (DeepWiki)
 *   read_memory          — Read AI memory by key
 *   write_memory         — Write AI memory (key, value, category)
 *   log_decision         — Log an architecture/tech decision
 *   log_error_pattern    — Log an error + fix for future reference
 *
 * Env:
 *   DB_URL                — PostgreSQL connection string (default: postgresql://postgres:postgres@host.docker.internal:5432/insforge)
 *   DEEPWIKI_URL          — DeepWiki HTTP endpoint (default: http://host.docker.internal:7131)
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import pg from 'pg';

const DB_URL = process.env.DB_URL || 'postgresql://postgres:postgres@host.docker.internal:5432/insforge';
const DEEPWIKI_URL = process.env.DEEPWIKI_URL || 'http://host.docker.internal:7131';

const pool = new pg.Pool({ connectionString: DB_URL, max: 5 });

// ──────────────────────────────────────────────────────────────────────────
// Tool definitions
// ──────────────────────────────────────────────────────────────────────────
const TOOLS = [
  {
    name: 'list_tables',
    description: 'List all tables in the insforge database with row counts.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'describe_table',
    description: 'Show columns, types, and constraints for a table.',
    inputSchema: {
      type: 'object',
      properties: { table: { type: 'string', description: 'Table name (e.g. "products" or "schema.table")' } },
      required: ['table'],
    },
  },
  {
    name: 'query',
    description: 'Run a read-only SQL query (SELECT). Returns rows as JSON.',
    inputSchema: {
      type: 'object',
      properties: { sql: { type: 'string', description: 'SELECT query' } },
      required: ['sql'],
    },
  },
  {
    name: 'execute',
    description: 'Run a write SQL statement (INSERT/UPDATE/DELETE). DANGEROUS — use carefully.',
    inputSchema: {
      type: 'object',
      properties: {
        sql: { type: 'string', description: 'SQL statement' },
        confirm: { type: 'boolean', description: 'Must be true to execute (safety flag)' },
      },
      required: ['sql', 'confirm'],
    },
  },
  {
    name: 'create_table',
    description: 'Create a new table. Pass table name + columns array. Auto-adds id/created_at/updated_at if not specified.',
    inputSchema: {
      type: 'object',
      properties: {
        table: { type: 'string', description: 'Table name' },
        columns: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string', description: 'Postgres type (e.g. VARCHAR(255), TEXT, INT, UUID, JSONB, TIMESTAMPTZ)' },
              nullable: { type: 'boolean', default: true },
              default: { type: 'string', description: 'Default expression' },
              primary_key: { type: 'boolean' },
              unique: { type: 'boolean' },
              references: { type: 'string', description: 'FK: "table(column)"' },
            },
            required: ['name', 'type'],
          },
        },
        if_not_exists: { type: 'boolean', default: true },
      },
      required: ['table', 'columns'],
    },
  },
  {
    name: 'alter_table',
    description: 'Alter a table: add, drop, or modify columns.',
    inputSchema: {
      type: 'object',
      properties: {
        table: { type: 'string' },
        actions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              action: { type: 'string', enum: ['add', 'drop', 'modify'] },
              column: { type: 'string' },
              type: { type: 'string', description: 'New type (for add/modify)' },
              nullable: { type: 'boolean', default: true },
            },
            required: ['action', 'column'],
          },
        },
      },
      required: ['table', 'actions'],
    },
  },
  {
    name: 'drop_table',
    description: 'Drop a table. DANGEROUS — requires confirm: true.',
    inputSchema: {
      type: 'object',
      properties: {
        table: { type: 'string' },
        confirm: { type: 'boolean', description: 'Must be true to drop' },
        cascade: { type: 'boolean', default: false },
      },
      required: ['table', 'confirm'],
    },
  },
  {
    name: 'insert_rows',
    description: 'Insert rows into a table. Returns inserted rows.',
    inputSchema: {
      type: 'object',
      properties: {
        table: { type: 'string' },
        rows: { type: 'array', items: { type: 'object' }, description: 'Array of row objects' },
        returning: { type: 'string', default: '*', description: 'Columns to return' },
      },
      required: ['table', 'rows'],
    },
  },
  {
    name: 'list_migrations',
    description: 'List applied schema migrations.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'apply_migration',
    description: 'Apply a SQL migration. Records in schema_migrations table.',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Migration name (e.g. "003_add_invoices")' },
        sql: { type: 'string', description: 'SQL to execute' },
        down_sql: { type: 'string', description: 'Rollback SQL (optional)' },
      },
      required: ['name', 'sql'],
    },
  },
  {
    name: 'rollback_migration',
    description: 'Rollback the last applied migration by running its down_sql.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'search_codebase',
    description: 'Semantic search across the indexed codebase (uses DeepWiki pgvector).',
    inputSchema: {
      type: 'object',
      properties: {
        q: { type: 'string', description: 'Search query' },
        limit: { type: 'number', default: 10 },
      },
      required: ['q'],
    },
  },
  {
    name: 'ask_codebase',
    description: 'Ask an AI question about the codebase (uses DeepWiki + DeepSeek).',
    inputSchema: {
      type: 'object',
      properties: {
        question: { type: 'string' },
        context_files: { type: 'number', default: 5 },
      },
      required: ['question'],
    },
  },
  {
    name: 'read_memory',
    description: 'Read AI memory by key, or list all if no key given.',
    inputSchema: {
      type: 'object',
      properties: {
        key: { type: 'string', description: 'Memory key (optional — lists all if omitted)' },
        category: { type: 'string', description: 'Filter by category (optional)' },
      },
    },
  },
  {
    name: 'write_memory',
    description: 'Write AI memory. Persists across sessions for context recall.',
    inputSchema: {
      type: 'object',
      properties: {
        key: { type: 'string', description: 'Unique key (e.g. "cashflow.schema")' },
        value: { type: 'string', description: 'Memory content' },
        category: { type: 'string', default: 'general' },
        tags: { type: 'array', items: { type: 'string' } },
      },
      required: ['key', 'value'],
    },
  },
  {
    name: 'log_decision',
    description: 'Log an architecture or tech decision for future reference.',
    inputSchema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        context: { type: 'string', description: 'Why this decision was needed' },
        decision: { type: 'string', description: 'What was decided' },
        alternatives: { type: 'string', description: 'What else was considered' },
        consequences: { type: 'string' },
        tags: { type: 'array', items: { type: 'string' } },
      },
      required: ['title', 'context', 'decision'],
    },
  },
  {
    name: 'log_error_pattern',
    description: 'Log an error and its fix so the AI avoids repeating the same mistake.',
    inputSchema: {
      type: 'object',
      properties: {
        error_type: { type: 'string', description: 'Error class (e.g. "TypeError", "CORS")' },
        error_message: { type: 'string' },
        file_path: { type: 'string' },
        fix_description: { type: 'string', description: 'How it was fixed' },
        fix_code: { type: 'string', description: 'Code snippet of the fix' },
      },
      required: ['error_message', 'fix_description'],
    },
  },
];

// ──────────────────────────────────────────────────────────────────────────
// Tool handlers
// ──────────────────────────────────────────────────────────────────────────
async function handleTool(name, args) {
  const client = await pool.connect();
  try {
    switch (name) {

      case 'list_tables': {
        const r = await client.query(`
          SELECT schemaname, relname AS table, n_live_tup AS rows
          FROM pg_stat_user_tables
          WHERE schemaname NOT IN ('pg_catalog','information_schema')
          ORDER BY relname
        `);
        return r.rows;
      }

      case 'describe_table': {
        const t = args.table;
        const r = await client.query(`
          SELECT column_name, data_type, is_nullable, column_default,
                 character_maximum_length
          FROM information_schema.columns
          WHERE table_name = $1
          ORDER BY ordinal_position
        `, [t.includes('.') ? t.split('.')[1] : t]);
        return r.rows;
      }

      case 'query': {
        const r = await client.query(args.sql);
        return { rows: r.rows, count: r.rowCount };
      }

      case 'execute': {
        if (!args.confirm) throw new Error('confirm must be true to execute write queries');
        const r = await client.query(args.sql);
        return { affected: r.rowCount, rows: r.rows };
      }

      case 'create_table': {
        const cols = args.columns;
        // Auto-add id + timestamps if not present
        const colNames = cols.map(c => c.name.toLowerCase());
        const defs = [];
        if (!colNames.includes('id')) {
          defs.push('"id" UUID PRIMARY KEY DEFAULT gen_random_uuid()');
        }
        for (const c of cols) {
          let d = `"${c.name}" ${c.type}`;
          if (c.primary_key) d += ' PRIMARY KEY';
          if (!c.nullable && !c.primary_key) d += ' NOT NULL';
          if (c.unique) d += ' UNIQUE';
          if (c.default) d += ` DEFAULT ${c.default}`;
          if (c.references) d += ` REFERENCES ${c.references}`;
          defs.push(d);
        }
        if (!colNames.includes('created_at')) defs.push('"created_at" TIMESTAMPTZ DEFAULT NOW()');
        if (!colNames.includes('updated_at')) defs.push('"updated_at" TIMESTAMPTZ DEFAULT NOW()');
        const ifNotExists = args.if_not_exists !== false ? 'IF NOT EXISTS' : '';
        const sql = `CREATE TABLE ${ifNotExists} ${args.table} (\n  ${defs.join(',\n  ')}\n)`;
        await client.query(sql);
        return { status: 'created', table: args.table, sql };
      }

      case 'alter_table': {
        const parts = [];
        for (const a of args.actions) {
          if (a.action === 'add') {
            parts.push(`ADD COLUMN "${a.column}" ${a.type}${a.nullable === false ? ' NOT NULL' : ''}`);
          } else if (a.action === 'drop') {
            parts.push(`DROP COLUMN "${a.column}"`);
          } else if (a.action === 'modify') {
            parts.push(`ALTER COLUMN "${a.column}" TYPE ${a.type}`);
          }
        }
        const sql = `ALTER TABLE ${args.table} ${parts.join(', ')}`;
        await client.query(sql);
        return { status: 'altered', table: args.table, sql };
      }

      case 'drop_table': {
        if (!args.confirm) throw new Error('confirm must be true to drop a table');
        const cascade = args.cascade ? ' CASCADE' : '';
        await client.query(`DROP TABLE IF EXISTS ${args.table}${cascade}`);
        return { status: 'dropped', table: args.table };
      }

      case 'insert_rows': {
        if (!args.rows || args.rows.length === 0) throw new Error('rows must be non-empty');
        const cols = Object.keys(args.rows[0]);
        const placeholders = [];
        const values = [];
        let idx = 1;
        for (const row of args.rows) {
          const ph = cols.map(() => `$${idx++}`);
          placeholders.push(`(${ph.join(',')})`);
          for (const c of cols) values.push(row[c] ?? null);
        }
        const returning = args.returning || '*';
        const sql = `INSERT INTO ${args.table} (${cols.map(c => `"${c}"`).join(',')}) VALUES ${placeholders.join(',')} RETURNING ${returning}`;
        const r = await client.query(sql, values);
        return { inserted: r.rowCount, rows: r.rows };
      }

      case 'list_migrations': {
        const r = await client.query('SELECT * FROM schema_migrations ORDER BY applied_at DESC LIMIT 50');
        return r.rows;
      }

      case 'apply_migration': {
        await client.query('BEGIN');
        try {
          await client.query(args.sql);
          await client.query(`
            INSERT INTO schema_migrations (name, up_sql, down_sql, applied_at)
            VALUES ($1, $2, $3, NOW())
          `, [args.name, args.sql, args.down_sql || null]);
          await client.query('COMMIT');
          return { status: 'applied', name: args.name };
        } catch (e) {
          await client.query('ROLLBACK');
          throw e;
        }
      }

      case 'rollback_migration': {
        const r = await client.query('SELECT id, name, down_sql FROM schema_migrations ORDER BY applied_at DESC LIMIT 1');
        if (r.rows.length === 0) return { status: 'nothing_to_rollback' };
        const m = r.rows[0];
        if (!m.down_sql) throw new Error(`Migration ${m.name} has no down_sql`);
        await client.query('BEGIN');
        try {
          await client.query(m.down_sql);
          await client.query('DELETE FROM schema_migrations WHERE id = $1', [m.id]);
          await client.query('COMMIT');
          return { status: 'rolled_back', name: m.name };
        } catch (e) {
          await client.query('ROLLBACK');
          throw e;
        }
      }

      case 'search_codebase': {
        const url = `${DEEPWIKI_URL}/semantic?q=${encodeURIComponent(args.q)}&limit=${args.limit || 10}`;
        const r = await fetch(url);
        return await r.json();
      }

      case 'ask_codebase': {
        const r = await fetch(`${DEEPWIKI_URL}/ask`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ question: args.question, context_files: args.context_files || 5 }),
        });
        return await r.json();
      }

      case 'read_memory': {
        if (args.key) {
          const r = await client.query('SELECT * FROM ai_memory WHERE key = $1', [args.key]);
          return r.rows[0] || { status: 'not_found', key: args.key };
        }
        const r = await client.query(
          'SELECT key, value, category, tags, access_count, updated_at FROM ai_memory WHERE ($1::text IS NULL OR category = $1) ORDER BY updated_at DESC LIMIT 100',
          [args.category || null]
        );
        return r.rows;
      }

      case 'write_memory': {
        await client.query(`
          INSERT INTO ai_memory (key, value, category, tags, updated_at)
          VALUES ($1, $2, $3, $4, NOW())
          ON CONFLICT (key) DO UPDATE SET
            value = EXCLUDED.value,
            category = EXCLUDED.category,
            tags = EXCLUDED.tags,
            updated_at = NOW()
        `, [args.key, args.value, args.category || 'general', args.tags || []]);
        return { status: 'saved', key: args.key };
      }

      case 'log_decision': {
        const r = await client.query(`
          INSERT INTO decision_log (title, context, decision, alternatives, consequences, tags)
          VALUES ($1, $2, $3, $4, $5, $6) RETURNING id
        `, [args.title, args.context, args.decision, args.alternatives || '', args.consequences || '', args.tags || []]);
        return { status: 'logged', id: r.rows[0].id, title: args.title };
      }

      case 'log_error_pattern': {
        // Check if same error exists — increment occurrence_count
        const existing = await client.query(
          'SELECT id, occurrence_count FROM error_patterns WHERE error_message = $1', [args.error_message]
        );
        if (existing.rows.length > 0) {
          await client.query(
            'UPDATE error_patterns SET occurrence_count = occurrence_count + 1, last_seen = NOW(), fix_description = $2, fix_code = $3 WHERE id = $1',
            [existing.rows[0].id, args.fix_description, args.fix_code || '']
          );
          return { status: 'updated', id: existing.rows[0].id, count: existing.rows[0].occurrence_count + 1 };
        }
        const r = await client.query(`
          INSERT INTO error_patterns (error_type, error_message, file_path, fix_description, fix_code)
          VALUES ($1, $2, $3, $4, $5) RETURNING id
        `, [args.error_type || '', args.error_message, args.file_path || '', args.fix_description, args.fix_code || '']);
        return { status: 'logged', id: r.rows[0].id };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } finally {
    client.release();
  }
}

// ──────────────────────────────────────────────────────────────────────────
// Server setup
// ──────────────────────────────────────────────────────────────────────────
const server = new Server(
  { name: 'insforge-mcp', version: '2.0.0' },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: TOOLS.map(t => ({
    name: t.name,
    description: t.description,
    inputSchema: t.inputSchema,
  })),
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  try {
    const result = await handleTool(name, args || {});
    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      isError: false,
    };
  } catch (err) {
    return {
      content: [{ type: 'text', text: `Error: ${err.message}` }],
      isError: true,
    };
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);
console.error('InsForge MCP server running (stdio)');
