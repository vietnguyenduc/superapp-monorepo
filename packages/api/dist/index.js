import Fastify from "fastify";
import cors from "@fastify/cors";
import { config } from "./config.js";
import { pool, withClient } from "./db.js";
import { checkRateLimit } from "./rate-limit.js";
import { registerRealtimeRoutes } from "./realtime.js";
import dataRoutes from "./routes/data.js";
import authSyncRoutes from "./routes/auth-sync.js";
import trialRoutes from "./routes/trial.js";
const app = Fastify({
    logger: config.nodeEnv === "development",
});
// ── CORS ──────────────────────────────────────────────────────────────
const VERCEL_PREVIEW_RE = /\.vercel\.app$/;
const APPFORYOU_RE = /\.appforyou\.xyz$/;
await app.register(cors, {
    origin: (origin, cb) => {
        if (!origin) {
            if (config.nodeEnv === "development") {
                cb(null, true);
                return;
            }
            cb(new Error("Origin header required"), false);
            return;
        }
        const allowed = config.corsOrigins;
        if (allowed.includes(origin) ||
            VERCEL_PREVIEW_RE.test(origin) ||
            APPFORYOU_RE.test(origin)) {
            cb(null, true);
        }
        else {
            cb(new Error(`Origin ${origin} not allowed`), false);
        }
    },
    credentials: true,
});
// ── Rate limiting (all non-health routes) ─────────────────────────────
app.addHook("onRequest", async (request, reply) => {
    if (request.url === "/health")
        return;
    const ip = request.ip;
    const { allowed, retryAfter } = checkRateLimit(ip);
    if (!allowed) {
        reply.header("Retry-After", String(retryAfter));
        reply.status(429).send({ error: "Too many requests", retryAfter });
    }
});
// ── Ensure audit_logs table exists ───────────────────────────────────
async function ensureAuditTable() {
    try {
        await withClient(async (client) => {
            await client.query(`
        CREATE TABLE IF NOT EXISTS audit_logs (
          id         SERIAL PRIMARY KEY,
          user_id    UUID NOT NULL,
          action     TEXT NOT NULL,
          table_name TEXT NOT NULL,
          payload    JSONB,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);
            await client.query(`
        CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id)
      `);
            await client.query(`
        CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at)
      `);
        });
        console.log("[audit] audit_logs table ready");
    }
    catch (err) {
        console.error("[audit] failed to ensure audit_logs table:", err);
    }
}
await ensureAuditTable();
// ── Graceful shutdown ─────────────────────────────────────────────────
process.on("SIGTERM", async () => {
    console.log("SIGTERM received, closing...");
    await app.close();
    await pool.end();
    process.exit(0);
});
process.on("SIGINT", async () => {
    console.log("SIGINT received, closing...");
    await app.close();
    await pool.end();
    process.exit(0);
});
// ── Routes ───────────────────────────────────────────────────────────
await app.register(dataRoutes);
await app.register(authSyncRoutes);
await app.register(registerRealtimeRoutes);
await app.register(trialRoutes);
try {
    await app.listen({ port: config.port, host: "0.0.0.0" });
    console.log(`API server listening on http://localhost:${config.port}`);
}
catch (err) {
    app.log.error(err);
    process.exit(1);
}
