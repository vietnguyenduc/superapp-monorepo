import { Pool } from "pg";
import { config } from "./config.js";
import { runQuery } from "./query-runner.js";
const pool = new Pool({ connectionString: config.databaseUrl });
const testAuth = {
    userId: "00000000-0000-0000-0000-000000000001",
    email: "test@example.com",
    role: "admin",
    branchId: undefined,
    companyId: undefined,
    metadata: {},
};
async function runTests() {
    const client = await pool.connect();
    try {
        console.log("=== E2E Query Tests ===\n");
        // 1. Insert test user into auth.users and public.users
        await client.query(`INSERT INTO auth.users (id, email, raw_user_meta_data) VALUES ($1, $2, '{}') ON CONFLICT DO NOTHING`, [testAuth.userId, testAuth.email]);
        await client.query(`INSERT INTO public.users (id, email, role) VALUES ($1, $2, 'admin') ON CONFLICT DO NOTHING`, [testAuth.userId, testAuth.email]);
        console.log("[OK] Test user synced to local DB");
        // 2. Test SELECT on branches
        const selectResult = await runQuery(client, { operation: "select", table: "branches" }, testAuth);
        console.log("[SELECT branches] status:", selectResult.status, "rows:", Array.isArray(selectResult.data) ? selectResult.data.length : 0);
        if (selectResult.error)
            console.error("  error:", selectResult.error);
        // 3. Test INSERT into branches
        const insertResult = await runQuery(client, {
            operation: "insert",
            table: "branches",
            valuesList: [{ name: "Test Branch", code: "TST-001", address: "123 Test St" }],
        }, testAuth);
        console.log("[INSERT branch] status:", insertResult.status);
        if (insertResult.error)
            console.error("  error:", insertResult.error);
        const insertedBranch = insertResult.data;
        const branchId = insertedBranch?.[0]?.id;
        // 4. Test SELECT with filter
        if (branchId) {
            const filteredResult = await runQuery(client, {
                operation: "select",
                table: "branches",
                filters: [{ column: "id", op: "eq", value: branchId }],
            }, testAuth);
            console.log("[SELECT filtered] status:", filteredResult.status, "found:", Array.isArray(filteredResult.data) ? filteredResult.data.length : 0);
        }
        // 5. Test UPDATE
        if (branchId) {
            const updateResult = await runQuery(client, {
                operation: "update",
                table: "branches",
                values: { name: "Updated Test Branch" },
                filters: [{ column: "id", op: "eq", value: branchId }],
            }, testAuth);
            console.log("[UPDATE branch] status:", updateResult.status);
            if (updateResult.error)
                console.error("  error:", updateResult.error);
        }
        // 6. Test DELETE
        if (branchId) {
            const deleteResult = await runQuery(client, {
                operation: "delete",
                table: "branches",
                filters: [{ column: "id", op: "eq", value: branchId }],
            }, testAuth);
            console.log("[DELETE branch] status:", deleteResult.status);
            if (deleteResult.error)
                console.error("  error:", deleteResult.error);
        }
        // 7. Test UPSERT
        const upsertResult = await runQuery(client, {
            operation: "upsert",
            table: "branches",
            values: { name: "Upsert Branch", code: "UPS-001" },
            filters: [{ column: "code", op: "eq", value: "UPS-001" }],
        }, testAuth);
        console.log("[UPSERT branch] status:", upsertResult.status);
        if (upsertResult.error)
            console.error("  error:", upsertResult.error);
        // 8. Test batch queries
        const batchResult = await runQuery(client, {
            operation: "select",
            table: "branches",
            filters: [{ column: "code", op: "eq", value: "UPS-001" }],
        }, testAuth);
        console.log("[SELECT upserted] status:", batchResult.status);
        console.log("\n=== E2E Tests Complete ===");
    }
    catch (err) {
        console.error("Test failed:", err);
        process.exit(1);
    }
    finally {
        client.release();
        await pool.end();
    }
}
runTests();
