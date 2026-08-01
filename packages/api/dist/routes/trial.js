/**
 * Trial Seed Routes
 *
 * GET  /api/trial/:table  → Public: lấy seed data cho một table
 * PUT  /api/trial/:table  → Admin: ghi đè seed data cho một table
 */

import { verifySupabaseToken } from "../auth.js";
import { withClient } from "../db.js";

export default async function trialRoutes(fastify) {
  // ── GET /api/trial/:table ──────────────────────────────────────
  // Trả về tất cả records cho table_name = :table
  fastify.get("/api/trial/:table", async (request, reply) => {
    const { table } = request.params;

    if (!table || typeof table !== "string") {
      return reply.status(400).send({ error: "Missing table name", data: [] });
    }

    try {
      const result = await withClient(async (client) => {
        const res = await client.query(
          `SELECT record FROM trial_seed.data WHERE table_name = $1 ORDER BY sort_order ASC`,
          [table]
        );
        return res.rows.map((r) => r.record);
      });

      return reply.send({ data: result });
    } catch (err) {
      console.error(`[trial] GET /api/trial/${table} error:`, err.message);
      // Return empty array on error so trial mode doesn't break
      return reply.status(200).send({ data: [] });
    }
  });

  // ── PUT /api/trial/:table ──────────────────────────────────────
  // Admin: xoá toàn bộ seed cũ của table, insert records mới
  // Body: array of objects (records)
  fastify.put("/api/trial/:table", async (request, reply) => {
    const { table } = request.params;
    const body = request.body;

    // Auth check
    const authHeader = request.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return reply.status(401).send({ error: "Missing or invalid Authorization header" });
    }
    const token = authHeader.slice(7);
    const auth = await verifySupabaseToken(token);
    if (!auth) {
      return reply.status(401).send({ error: "Invalid token" });
    }

    // Admin role check
    if (auth.role !== "admin" && auth.role !== "superadmin" && auth.email !== "trial@example.com") {
      return reply.status(403).send({ error: "Admin access required" });
    }

    // Validate body
    if (!Array.isArray(body)) {
      return reply.status(400).send({ error: "Body must be an array of records" });
    }

    const errors = [];
    body.forEach((record, i) => {
      if (!record || typeof record !== "object") {
        errors.push(`Record at index ${i}: must be an object`);
      } else if (!record.id) {
        errors.push(`Record at index ${i}: missing "id" field`);
      }
    });

    if (errors.length > 0) {
      return reply.status(422).send({ error: "Validation failed", details: errors });
    }

    try {
      await withClient(async (client) => {
        // Delete existing seed for this table
        await client.query(
          `DELETE FROM trial_seed.data WHERE table_name = $1`,
          [table]
        );

        // Insert new records
        const now = new Date().toISOString();
        for (let i = 0; i < body.length; i++) {
          const record = {
            ...body[i],
            created_at: body[i].created_at || now,
            updated_at: now,
          };
          await client.query(
            `INSERT INTO trial_seed.data (table_name, record, sort_order) VALUES ($1, $2, $3)`,
            [table, JSON.stringify(record), i]
          );
        }
      });

      // Fetch back what was saved
      const { data: saved } = await withClient(async (client) => {
        const res = await client.query(
          `SELECT record FROM trial_seed.data WHERE table_name = $1 ORDER BY sort_order ASC`,
          [table]
        );
        return res.rows.map((r) => r.record);
      });

      return reply.send({
        message: `Saved ${body.length} records for "${table}"`,
        count: body.length,
        data: saved,
      });
    } catch (err) {
      console.error(`[trial] PUT /api/trial/${table} error:`, err.message);
      return reply.status(500).send({ error: err.message });
    }
  });
}
