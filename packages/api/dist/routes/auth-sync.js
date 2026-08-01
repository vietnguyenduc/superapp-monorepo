import { config } from "../config.js";
import { withClient } from "../db.js";
function isDbWebhook(payload) {
    return "type" in payload && "table" in payload;
}
function isAuthHook(payload) {
    return "event" in payload && "user" in payload;
}
function verifyWebhookSecret(request) {
    const secret = config.supabaseWebhookSecret;
    if (!secret) {
        console.warn("SUPABASE_WEBHOOK_SECRET not set; skipping verification");
        return true;
    }
    const header = request.headers["x-webhook-secret"];
    if (header === secret)
        return true;
    const auth = request.headers.authorization;
    if (auth?.startsWith("Bearer ") && auth.slice(7) === secret)
        return true;
    return false;
}
async function upsertUser(client, id, email, meta, createdAt) {
    // Prevent unique email constraint violation by deleting conflicting row with different id
    await client.query("DELETE FROM auth.users WHERE email = $1 AND id <> $2", [email, id]);
    await client.query(`INSERT INTO auth.users (id, email, raw_user_meta_data, created_at)
     VALUES ($1, $2, $3, COALESCE($4, NOW()))
     ON CONFLICT (id) DO UPDATE SET
       email = EXCLUDED.email,
       raw_user_meta_data = EXCLUDED.raw_user_meta_data,
       created_at = EXCLUDED.created_at`, [id, email, JSON.stringify(meta), createdAt]);
}
async function deleteUser(client, id) {
    await client.query("DELETE FROM auth.users WHERE id = $1", [id]);
}
export default async function authSyncRoutes(fastify) {
    // ── Webhook: Supabase Auth / Database Webhook ───────────────────────────
    fastify.post("/api/v1/auth/webhook", async (request, reply) => {
        if (!verifyWebhookSecret(request)) {
            return reply.status(401).send({ error: "Invalid webhook secret" });
        }
        const payload = request.body;
        try {
            if (isDbWebhook(payload)) {
                // Database webhook (auth.users table)
                const rec = payload.record;
                if (!rec?.id) {
                    return reply.status(400).send({ error: "Missing record id" });
                }
                if (payload.type === "INSERT" || payload.type === "UPDATE") {
                    await withClient((client) => upsertUser(client, rec.id, rec.email ?? "", rec.raw_user_meta_data ?? {}, rec.created_at));
                    console.log(`[webhook] upsert user ${rec.id} (${rec.email})`);
                }
                else if (payload.type === "DELETE") {
                    await withClient((client) => deleteUser(client, rec.id));
                    console.log(`[webhook] delete user ${rec.id}`);
                }
            }
            else if (isAuthHook(payload)) {
                // Supabase Auth Hook
                const user = payload.user;
                if (!user?.id) {
                    return reply.status(400).send({ error: "Missing user id" });
                }
                if (payload.event === "user.created" || payload.event === "user.updated") {
                    await withClient((client) => upsertUser(client, user.id, user.email ?? "", user.user_metadata ?? {}, user.created_at));
                    console.log(`[webhook] ${payload.event} user ${user.id} (${user.email})`);
                }
                else if (payload.event === "user.deleted") {
                    await withClient((client) => deleteUser(client, user.id));
                    console.log(`[webhook] delete user ${user.id}`);
                }
            }
            else {
                return reply.status(400).send({ error: "Unknown payload format" });
            }
            reply.send({ success: true });
        }
        catch (err) {
            console.error("Webhook processing failed:", err);
            reply.status(500).send({ error: "Webhook processing failed" });
        }
    });
    // ── Batch sync: pull all users from Supabase Auth ───────────────────────
    fastify.post("/api/v1/admin/sync-users", async (_request, reply) => {
        if (!config.supabaseServiceRoleKey) {
            return reply.status(503).send({ error: "SUPABASE_SERVICE_ROLE_KEY not configured" });
        }
        try {
            const allUsers = [];
            let page = 1;
            const perPage = 1000;
            // eslint-disable-next-line no-constant-condition
            while (true) {
                const res = await fetch(`${config.supabaseUrl}/auth/v1/admin/users?page=${page}&per_page=${perPage}`, {
                    headers: {
                        Authorization: `Bearer ${config.supabaseServiceRoleKey}`,
                        apikey: config.supabaseAnonKey,
                        "Content-Type": "application/json",
                    },
                });
                if (!res.ok) {
                    const text = await res.text().catch(() => "unknown");
                    console.error("Supabase admin users fetch failed:", res.status, text);
                    return reply.status(502).send({ error: `Supabase API error: ${res.status}`, details: text });
                }
                const data = await res.json();
                const users = data.users ?? [];
                if (users.length === 0)
                    break;
                allUsers.push(...users);
                if (users.length < perPage)
                    break;
                page++;
            }
            let inserted = 0;
            let updated = 0;
            await withClient(async (client) => {
                for (const u of allUsers) {
                    await client.query("DELETE FROM auth.users WHERE email = $1 AND id <> $2", [u.email ?? "", u.id]);
                    const result = await client.query(`INSERT INTO auth.users (id, email, raw_user_meta_data, created_at)
             VALUES ($1, $2, $3, COALESCE($4, NOW()))
             ON CONFLICT (id) DO UPDATE SET
               email = EXCLUDED.email,
               raw_user_meta_data = EXCLUDED.raw_user_meta_data,
               created_at = EXCLUDED.created_at
             RETURNING (xmax = 0) as inserted`, [u.id, u.email ?? "", JSON.stringify(u.raw_user_meta_data ?? {}), u.created_at]);
                    if (result.rows[0]?.inserted) {
                        inserted++;
                    }
                    else {
                        updated++;
                    }
                }
            });
            console.log(`[sync] processed ${allUsers.length} users: ${inserted} inserted, ${updated} updated`);
            reply.send({ success: true, total: allUsers.length, inserted, updated });
        }
        catch (err) {
            console.error("Batch sync failed:", err);
            reply.status(500).send({ error: "Batch sync failed", details: err instanceof Error ? err.message : "unknown" });
        }
    });
}
