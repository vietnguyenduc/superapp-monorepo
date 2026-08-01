import { createClient } from "@supabase/supabase-js";
import { config } from "./config.js";
import { bulkSyncUsers } from "./admin-sync.js";
async function syncAllUsers() {
    if (!config.supabaseServiceRoleKey) {
        console.error("SUPABASE_SERVICE_ROLE_KEY is required to list all users.");
        console.error("Add it to your .env file and re-run.");
        console.error("You can find it in Supabase Dashboard > Project Settings > API > service_role key.");
        process.exit(1);
    }
    const supabase = createClient(config.supabaseUrl, config.supabaseServiceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false },
    });
    console.log("Fetching users from Supabase Auth...");
    const allUsers = [];
    let page = 1;
    const perPage = 1000;
    while (true) {
        const { data, error } = await supabase.auth.admin.listUsers({
            page,
            perPage,
        });
        if (error) {
            console.error("Failed to fetch users:", error.message);
            process.exit(1);
        }
        const users = data.users ?? [];
        if (users.length === 0)
            break;
        for (const u of users) {
            allUsers.push({
                id: u.id,
                email: u.email ?? undefined,
                user_metadata: u.user_metadata ?? {},
            });
        }
        if (users.length < perPage)
            break;
        page++;
    }
    console.log(`Found ${allUsers.length} users in Supabase Auth.`);
    console.log("Syncing to local PostgreSQL...");
    const result = await bulkSyncUsers(allUsers.map((u) => ({
        id: u.id,
        email: u.email,
        full_name: u.user_metadata?.full_name ?? u.email,
        role: u.user_metadata?.role ?? "staff",
        branch_id: u.user_metadata?.branch_id ?? undefined,
        raw_user_meta_data: u.user_metadata,
    })));
    console.log(`Done. Inserted: ${result.inserted}, Updated: ${result.updated}, Errors: ${result.errors.length}`);
    if (result.errors.length > 0) {
        console.error("Errors:");
        for (const e of result.errors)
            console.error("  -", e);
    }
    process.exit(0);
}
syncAllUsers();
