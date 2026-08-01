import { verifySupabaseToken } from "../auth.js";
import { withClient } from "../db.js";
import { runQuery } from "../query-runner.js";
import { ensureUserInLocalDb } from "../user-sync.js";
import { bulkSyncUsers } from "../admin-sync.js";
import { logAudit } from "../audit-log.js";
import { publishEvent } from "../realtime.js";
function broadcastMutation(query, data) {
    if (query.operation === "select" || query.operation === "rpc")
        return;
    const record = Array.isArray(data) && data.length > 0 ? data[0] : undefined;
    const event = {
        table: query.table,
        operation: query.operation,
        record,
        timestamp: new Date().toISOString(),
    };
    publishEvent(event);
}
async function extractAuth(request, reply) {
    const authHeader = request.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
        reply.status(401).send({ error: "Missing or invalid Authorization header" });
        return null;
    }
    const token = authHeader.slice(7);
    const auth = await verifySupabaseToken(token);
    if (!auth) {
        reply.status(401).send({ error: "Invalid token" });
        return null;
    }
    // Sync user into local DB so FK constraints never fail
    try {
        await ensureUserInLocalDb(auth);
    }
    catch (err) {
        console.error("User sync warning (non-fatal):", err);
    }
    return auth;
}
export default async function dataRoutes(fastify) {
    fastify.get("/health", async (_request, reply) => {
        try {
            await withClient(async (client) => {
                await client.query("SELECT 1");
            });
            reply.send({ status: "ok", db: "connected" });
        }
        catch (err) {
            reply.status(503).send({ status: "error", db: "disconnected", message: String(err) });
        }
    });
    fastify.post("/api/v1/query", async (request, reply) => {
        const auth = await extractAuth(request, reply);
        if (!auth)
            return;
        const query = request.body;
        if (!query.table || !query.operation) {
            return reply.status(400).send({ error: "Missing table or operation" });
        }
        try {
            const result = await withClient(async (client) => {
                const r = await runQuery(client, query, auth);
                if (!r.error) {
                    await logAudit(client, query, auth);
                    broadcastMutation(query, r.data);
                }
                return r;
            });
            reply.status(result.status).send({
                data: result.data,
                error: result.error,
                count: result.count ?? null,
                status: result.status,
            });
        }
        catch (err) {
            reply.status(500).send({
                error: { message: err instanceof Error ? err.message : "Server error" },
                data: null,
                status: 500,
            });
        }
    });
    // Batch query support
    fastify.post("/api/v1/batch", async (request, reply) => {
        const auth = await extractAuth(request, reply);
        if (!auth)
            return;
        const { queries } = request.body;
        if (!Array.isArray(queries)) {
            return reply.status(400).send({ error: "queries must be an array" });
        }
        try {
            const results = await withClient(async (client) => {
                const out = [];
                for (const query of queries) {
                    const r = await runQuery(client, query, auth);
                    if (!r.error) {
                        await logAudit(client, query, auth);
                        broadcastMutation(query, r.data);
                    }
                    out.push(r);
                }
                return out;
            });
            reply.send({ data: results, error: null, status: 200 });
        }
        catch (err) {
            reply.status(500).send({
                error: { message: err instanceof Error ? err.message : "Server error" },
                data: null,
                status: 500,
            });
        }
    });
    // RPC endpoint for Postgres functions
    fastify.post("/api/v1/rpc", async (request, reply) => {
        const auth = await extractAuth(request, reply);
        if (!auth)
            return;
        const { fn, params } = request.body;
        if (!fn) {
            return reply.status(400).send({ error: "Missing fn" });
        }
        // Validate function name (allow schema-qualified: public.fn_name or fn_name)
        const fnNameRe = /^[a-zA-Z_][a-zA-Z0-9_]*(?:\.[a-zA-Z_][a-zA-Z0-9_]*)?$/;
        if (!fnNameRe.test(fn)) {
            return reply.status(400).send({ error: "Invalid function name" });
        }
        try {
            const result = await withClient(async (client) => {
                const paramEntries = params ? Object.entries(params) : [];
                const placeholders = paramEntries.map((_, i) => `$${i + 1}`).join(", ");
                const sql = `SELECT * FROM ${fn}(${placeholders})`;
                const res = await client.query(sql, paramEntries.map(([, v]) => v));
                return { data: res.rows, error: null, status: 200 };
            });
            reply.status(result.status).send(result);
        }
        catch (err) {
            reply.status(500).send({
                error: { message: err instanceof Error ? err.message : "Server error" },
                data: null,
                status: 500,
            });
        }
    });
    // Admin: bulk sync users from Supabase Auth into local DB
    fastify.post("/api/admin/sync-users", async (request, reply) => {
        const auth = await extractAuth(request, reply);
        if (!auth)
            return;
        if (auth.role !== "admin") {
            return reply.status(403).send({ error: "Admin access required" });
        }
        const { users } = request.body;
        if (!Array.isArray(users)) {
            return reply.status(400).send({ error: "users must be an array" });
        }
        try {
            const result = await bulkSyncUsers(users);
            reply.send({ data: result, error: null, status: 200 });
        }
        catch (err) {
            reply.status(500).send({
                error: { message: err instanceof Error ? err.message : "Server error" },
                data: null,
                status: 500,
            });
        }
    });
}
