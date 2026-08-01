import { withClient } from "./db.js";
/**
 * Ensure the authenticated user exists in local PostgreSQL.
 * Upserts into auth.users (required for FK constraints) and public.users (app-level user record).
 */
export async function ensureUserInLocalDb(auth) {
    if (!auth.userId)
        return;
    await withClient(async (client) => {
        // 1. Upsert auth.users (the local auth shim)
        await client.query(`
      INSERT INTO auth.users (id, email, user_metadata, created_at)
      VALUES ($1, $2, $3, NOW())
      ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        user_metadata = EXCLUDED.user_metadata
      `, [auth.userId, auth.email ?? null, JSON.stringify(auth.metadata ?? {})]);
        // 2. Upsert public.users (app-level profile)
        // Extract possible role from metadata; default to 'staff'
        const role = auth.metadata?.role ?? "staff";
        const validRoles = ["admin", "admin_master", "admin_company", "branch_manager", "staff"];
        const safeRole = validRoles.includes(role) ? role : "staff";
        await client.query(`
      INSERT INTO public.users (id, email, full_name, role, branch_id, company_id, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
      ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        role = EXCLUDED.role,
        branch_id = EXCLUDED.branch_id,
        company_id = EXCLUDED.company_id,
        updated_at = NOW()
      `, [
            auth.userId,
            auth.email ?? null,
            auth.metadata?.full_name ?? auth.email ?? null,
            safeRole,
            auth.branchId ?? auth.metadata?.branch_id ?? null,
            auth.companyId ?? auth.metadata?.company_id ?? null,
        ]);
    });
}
