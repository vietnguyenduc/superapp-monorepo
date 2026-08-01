#!/usr/bin/env node
/**
 * Batch sync all users from Supabase Auth into local auth.users table.
 * Run: tsx src/sync-users.ts
 */
import { Pool } from "pg";
import { config } from "./config.js";
const pool = new Pool({ connectionString: config.databaseUrl });
async function fetchAllSupabaseUsers() {
    if (!config.supabaseServiceRoleKey) {
        throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set in .env");
    }
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
            throw new Error(`Supabase API error ${res.status}: ${text}`);
        }
        const data = (await res.json());
        const users = data.users ?? [];
        if (users.length === 0)
            break;
        allUsers.push(...users);
        if (users.length < perPage)
            break;
        page++;
    }
    return allUsers;
}
async function syncUsers() {
    console.log("Fetching users from Supabase Auth...");
    const users = await fetchAllSupabaseUsers();
    console.log(`Found ${users.length} users.`);
    if (users.length === 0) {
        console.log("Nothing to sync.");
        await pool.end();
        return;
    }
    const client = await pool.connect();
    try {
        let inserted = 0;
        let updated = 0;
        for (const u of users) {
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
        console.log(`Sync complete: ${inserted} inserted, ${updated} updated (total ${users.length})`);
    }
    finally {
        client.release();
        await pool.end();
    }
}
syncUsers().catch((err) => {
    console.error("Sync failed:", err);
    process.exit(1);
});
