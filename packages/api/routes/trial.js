/**
 * Trial Seed Routes
 *
 * GET  /api/trial/:table  → Public: lấy seed data
 * PUT  /api/trial/:table  → Admin (auth): ghi đè seed data
 *
 * Được copy vào dist/routes/ trong Docker build.
 * Dev local: copy thủ công hoặc symlink.
 */

export default async function trialRoutes(fastify, _opts) {
  const { pool } = await import("../dist/db.js");
  const { verifySupabaseToken } = await import("../dist/auth.js");

  // ── GET /api/trial/:table ──────────────────────────────────────
  fastify.get("/api/trial/:table", async (request, reply) => {
    const { table } = request.params;

    if (!table || typeof table !== "string") {
      return reply.status(400).send({ error: "Missing table name", data: [] });
    }

    try {
      const { rows } = await pool.query(
        `SELECT record FROM trial_seed.data WHERE table_name = $1 ORDER BY sort_order ASC`,
        [table]
      );
      return reply.send({ data: rows.map((r) => r.record) });
    } catch (err) {
      console.error(`[trial] GET /api/trial/${table} error:`, err.message);
      return reply.status(200).send({ data: [] });
    }
  });

  // ── PUT /api/trial/:table ──────────────────────────────────────
  fastify.put("/api/trial/:table", async (request, reply) => {
    const { table } = request.params;
    const body = request.body;

    // Auth
    const authHeader = request.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return reply.status(401).send({ error: "Missing or invalid Authorization header" });
    }
    const token = authHeader.slice(7);
    const auth = await verifySupabaseToken(token);
    if (!auth) return reply.status(401).send({ error: "Invalid token" });
    if (auth.role !== "admin" && auth.role !== "superadmin" && auth.email !== "trial@example.com") {
      return reply.status(403).send({ error: "Admin access required" });
    }

    // Validate
    if (!Array.isArray(body)) {
      return reply.status(400).send({ error: "Body must be an array of records" });
    }
    const errs = [];
    body.forEach((rec, i) => {
      if (!rec || typeof rec !== "object") errs.push(`Record ${i}: must be an object`);
      else if (!rec.id) errs.push(`Record ${i}: missing "id"`);
    });
    if (errs.length) return reply.status(422).send({ error: "Validation failed", details: errs });

    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(`DELETE FROM trial_seed.data WHERE table_name = $1`, [table]);
      const now = new Date().toISOString();
      for (let i = 0; i < body.length; i++) {
        await client.query(
          `INSERT INTO trial_seed.data (table_name, record, sort_order) VALUES ($1, $2, $3)`,
          [table, JSON.stringify({ ...body[i], updated_at: now }), i]
        );
      }
      await client.query("COMMIT");

      const { rows } = await pool.query(
        `SELECT record FROM trial_seed.data WHERE table_name = $1 ORDER BY sort_order ASC`,
        [table]
      );
      return reply.send({ message: `Saved ${body.length} records`, count: body.length, data: rows.map((r) => r.record) });
    } catch (err) {
      await client.query("ROLLBACK").catch(() => {});
      console.error(`[trial] PUT /api/trial/${table} error:`, err.message);
      return reply.status(500).send({ error: err.message });
    } finally {
      client.release();
    }
  });
}
