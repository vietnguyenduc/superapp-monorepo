import { withClient } from "./db.js";
/**
 * Bulk sync users into local PostgreSQL.
 * Uses a single transaction for atomicity.
 */
export async function bulkSyncUsers(users) {
    const result = { inserted: 0, updated: 0, errors: [] };
    await withClient(async (client) => {
        for (const user of users) {
            try {
                const role = user.role ?? "staff";
                const validRoles = ["admin", "branch_manager", "staff"];
                const safeRole = validRoles.includes(role) ? role : "staff";
                // Upsert auth.users
                const authRes = await client.query(`
          INSERT INTO auth.users (id, email, raw_user_meta_data, created_at)
          VALUES ($1, $2, $3, NOW())
          ON CONFLICT (id) DO UPDATE SET
            email = EXCLUDED.email,
            raw_user_meta_data = EXCLUDED.raw_user_meta_data
          RETURNING (xmax = 0) AS inserted
          `, [user.id, user.email ?? null, JSON.stringify(user.raw_user_meta_data ?? {})]);
                if (authRes.rows[0]?.inserted)
                    result.inserted++;
                else
                    result.updated++;
                // Upsert public.users
                await client.query(`
          INSERT INTO public.users (id, email, full_name, role, branch_id, created_at, updated_at)
          VALUES ($1, $2, $3, $4::user_role, $5, NOW(), NOW())
          ON CONFLICT (id) DO UPDATE SET
            email = EXCLUDED.email,
            full_name = EXCLUDED.full_name,
            role = EXCLUDED.role,
            branch_id = EXCLUDED.branch_id,
            updated_at = NOW()
          `, [
                    user.id,
                    user.email ?? null,
                    user.full_name ?? user.email ?? null,
                    safeRole,
                    user.branch_id ?? null,
                ]);
            }
            catch (err) {
                const msg = err instanceof Error ? err.message : String(err);
                result.errors.push(`User ${user.id}: ${msg}`);
            }
        }
    });
    return result;
}
