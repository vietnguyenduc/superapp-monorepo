/** Log mutations to the audit_logs table. Best-effort: never throws. */
export async function logAudit(client, query, auth) {
    if (query.operation === "select" || query.operation === "rpc")
        return;
    const safePayload = {
        table: query.table,
        operation: query.operation,
    };
    if (query.values)
        safePayload.values = sanitize(query.values);
    if (query.valuesList)
        safePayload.valuesList = query.valuesList.map(sanitize);
    if (query.filters)
        safePayload.filters = query.filters;
    try {
        await client.query(`INSERT INTO audit_logs (user_id, action, table_name, payload, created_at)
       VALUES ($1, $2, $3, $4, NOW())`, [auth.userId, query.operation, query.table, JSON.stringify(safePayload)]);
    }
    catch (err) {
        // Best-effort: don't fail the request if audit log fails
        console.error("[audit] failed to write audit log:", err);
    }
}
function sanitize(values) {
    const out = {};
    for (const [k, v] of Object.entries(values)) {
        if (k.toLowerCase().includes("password") || k.toLowerCase().includes("secret")) {
            out[k] = "***REDACTED***";
        }
        else {
            out[k] = v;
        }
    }
    return out;
}
