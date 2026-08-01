const IDENTIFIER_RE = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
const TABLE_NAME_RE = /^[a-zA-Z_][a-zA-Z0-9_]*(?:\.[a-zA-Z_][a-zA-Z0-9_]*)?$/;
const ADMIN_ONLY_TABLES = ["schema_migrations", "schema_migrations_version"];
// Full admin = can bypass tenant scoping entirely. admin_company is scoped to
// its own company_id (never branch-scoped); staff is scoped to company+branch.
const isFullAdmin = (auth) => auth.role === "admin" || auth.role === "admin_master";
function validateTable(name) {
    if (!TABLE_NAME_RE.test(name)) {
        throw new Error(`Invalid table name: ${name}`);
    }
}
function validateColumn(name) {
    if (!IDENTIFIER_RE.test(name) && name !== "*") {
        throw new Error(`Invalid column name: ${name}`);
    }
}
function buildWhere(filters, params, startIndex) {
    if (!filters || filters.length === 0)
        return { clause: "", nextIndex: startIndex };
    const clauses = [];
    let idx = startIndex;
    for (const f of filters) {
        validateColumn(f.column);
        switch (f.op) {
            case "eq":
                if (f.value === null) {
                    clauses.push(`"${f.column}" IS NULL`);
                }
                else {
                    clauses.push(`"${f.column}" = $${idx}`);
                    params.push(f.value);
                    idx++;
                }
                break;
            case "neq":
                if (f.value === null) {
                    clauses.push(`"${f.column}" IS NOT NULL`);
                }
                else {
                    clauses.push(`"${f.column}" <> $${idx}`);
                    params.push(f.value);
                    idx++;
                }
                break;
            case "gt":
                clauses.push(`"${f.column}" > $${idx}`);
                params.push(f.value);
                idx++;
                break;
            case "gte":
                clauses.push(`"${f.column}" >= $${idx}`);
                params.push(f.value);
                idx++;
                break;
            case "lt":
                clauses.push(`"${f.column}" < $${idx}`);
                params.push(f.value);
                idx++;
                break;
            case "lte":
                clauses.push(`"${f.column}" <= $${idx}`);
                params.push(f.value);
                idx++;
                break;
            case "like":
                clauses.push(`"${f.column}" LIKE $${idx}`);
                params.push(f.value);
                idx++;
                break;
            case "ilike":
                clauses.push(`"${f.column}" ILIKE $${idx}`);
                params.push(f.value);
                idx++;
                break;
            case "in": {
                const arr = Array.isArray(f.value) ? f.value : [f.value];
                if (arr.length === 0) {
                    clauses.push("FALSE");
                }
                else {
                    const placeholders = arr.map((_, i) => `$${idx + i}`).join(", ");
                    clauses.push(`"${f.column}" IN (${placeholders})`);
                    params.push(...arr);
                    idx += arr.length;
                }
                break;
            }
            case "is":
                if (f.value === null || f.value === "null") {
                    clauses.push(`"${f.column}" IS NULL`);
                }
                else {
                    clauses.push(`"${f.column}" IS ${f.value}`);
                }
                break;
            case "cs": // contains (for arrays/jsonb)
                clauses.push(`"${f.column}" @> $${idx}::jsonb`);
                params.push(JSON.stringify(f.value));
                idx++;
                break;
            case "cd": // contained by
                clauses.push(`"${f.column}" <@ $${idx}::jsonb`);
                params.push(JSON.stringify(f.value));
                idx++;
                break;
            default:
                throw new Error(`Unsupported filter op: ${f.op}`);
        }
    }
    return { clause: `WHERE ${clauses.join(" AND ")}`, nextIndex: idx };
}
// Build OR groups: each group is a set of filters joined by OR, wrapped in parentheses.
// Groups are joined with the main WHERE by AND.
function buildOrGroups(orGroups, params, startIndex) {
    if (!orGroups || orGroups.length === 0)
        return { clause: "", nextIndex: startIndex };
    let idx = startIndex;
    const groupClauses = [];
    for (const group of orGroups) {
        const innerClauses = [];
        for (const f of group.filters) {
            validateColumn(f.column);
            switch (f.op) {
                case "eq":
                    if (f.value === null) {
                        innerClauses.push(`"${f.column}" IS NULL`);
                    }
                    else {
                        innerClauses.push(`"${f.column}" = $${idx}`);
                        params.push(f.value);
                        idx++;
                    }
                    break;
                case "neq":
                    if (f.value === null) {
                        innerClauses.push(`"${f.column}" IS NOT NULL`);
                    }
                    else {
                        innerClauses.push(`"${f.column}" <> $${idx}`);
                        params.push(f.value);
                        idx++;
                    }
                    break;
                case "gt":
                    innerClauses.push(`"${f.column}" > $${idx}`);
                    params.push(f.value);
                    idx++;
                    break;
                case "gte":
                    innerClauses.push(`"${f.column}" >= $${idx}`);
                    params.push(f.value);
                    idx++;
                    break;
                case "lt":
                    innerClauses.push(`"${f.column}" < $${idx}`);
                    params.push(f.value);
                    idx++;
                    break;
                case "lte":
                    innerClauses.push(`"${f.column}" <= $${idx}`);
                    params.push(f.value);
                    idx++;
                    break;
                case "like":
                    innerClauses.push(`"${f.column}" LIKE $${idx}`);
                    params.push(f.value);
                    idx++;
                    break;
                case "ilike":
                    innerClauses.push(`"${f.column}" ILIKE $${idx}`);
                    params.push(f.value);
                    idx++;
                    break;
                case "in": {
                    const arr = Array.isArray(f.value) ? f.value : [f.value];
                    if (arr.length === 0) {
                        innerClauses.push("FALSE");
                    }
                    else {
                        const placeholders = arr.map(() => `$${idx}`).join(", ");
                        innerClauses.push(`"${f.column}" IN (${placeholders})`);
                        params.push(...arr);
                        idx += arr.length;
                    }
                    break;
                }
                case "is":
                    if (f.value === null || f.value === "null") {
                        innerClauses.push(`"${f.column}" IS NULL`);
                    }
                    else {
                        innerClauses.push(`"${f.column}" IS ${f.value}`);
                    }
                    break;
                default:
                    throw new Error(`Unsupported OR filter op: ${f.op}`);
            }
        }
        if (innerClauses.length > 0) {
            groupClauses.push(`(${innerClauses.join(" OR ")})`);
        }
    }
    if (groupClauses.length === 0)
        return { clause: "", nextIndex: idx };
    return { clause: groupClauses.join(" AND "), nextIndex: idx };
}
// Combine main WHERE filters + OR groups into a single WHERE clause.
function buildFullWhere(query, params, startIndex) {
    const { clause: mainClause, nextIndex: idx1 } = buildWhere(query.filters, params, startIndex);
    const { clause: orClause, nextIndex: idx2 } = buildOrGroups(query.orGroups, params, idx1);
    if (!mainClause && !orClause)
        return { clause: "", nextIndex: idx2 };
    if (!orClause)
        return { clause: mainClause, nextIndex: idx2 };
    if (!mainClause)
        return { clause: `WHERE ${orClause}`, nextIndex: idx2 };
    // mainClause starts with "WHERE ", so we append " AND orClause"
    return { clause: `${mainClause} AND ${orClause}`, nextIndex: idx2 };
}
function buildOrderBy(orderBy) {
    if (!orderBy || orderBy.length === 0)
        return "";
    const parts = orderBy.map((o) => {
        validateColumn(o.column);
        return `"${o.column}" ${o.direction === "desc" ? "DESC" : "ASC"}`;
    });
    return `ORDER BY ${parts.join(", ")}`;
}
function buildLimit(limit, offset) {
    let sql = "";
    if (typeof limit === "number" && !isNaN(limit)) {
        sql += ` LIMIT ${Math.floor(limit)}`;
    }
    if (typeof offset === "number" && !isNaN(offset)) {
        sql += ` OFFSET ${Math.floor(offset)}`;
    }
    return sql;
}
function buildReturning(returning) {
    if (returning === false)
        return "";
    if (returning === true)
        return "RETURNING *";
    if (typeof returning === "string")
        returning = [returning];
    if (!returning || returning.length === 0)
        return "RETURNING *";
    returning.forEach(validateColumn);
    return `RETURNING ${returning.map((c) => `"${c}"`).join(", ")}`;
}
// ── Embedded-resource selects (PostgREST-style) ────────────────────────────
// e.g. .select("*, customers(full_name), users!transactions_created_by_fkey(full_name)")
// expands to a correlated JSON subquery:  (SELECT jsonb_build_object(...) FROM "customers" "e" WHERE "e"."id" = "t"."customer_id" LIMIT 1) AS "customers"
// The local schema has NO foreign-key constraints, so relationships are resolved
// by column-name convention (rel_id → rel.id) or PostgREST _fkey naming.
function singularize(word) {
    if (word.endsWith("ies") && word.length > 3)
        return word.slice(0, -3) + "y";
    if (word.endsWith("es") && word.length > 2 && /(ss|x|ch|sh)$/.test(word.slice(0, -2)))
        return word.slice(0, -2);
    if (word.endsWith("s") && !word.endsWith("ss") && word.length > 1)
        return word.slice(0, -1);
    return word;
}
const embedFkCache = new Map();
async function resolveEmbedFk(client, baseTable, relTable, constraintName) {
    const key = `${baseTable}|${relTable}|${constraintName || ""}`;
    if (embedFkCache.has(key))
        return embedFkCache.get(key);
    let localCol = null;
    let remoteCol = null;
    if (constraintName) {
        const res = await client.query(`SELECT a.attname AS local_col, b.attname AS remote_col
             FROM pg_constraint c
             JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
             JOIN pg_attribute b ON b.attrelid = c.confrelid AND b.attnum = ANY(c.confkey)
             WHERE c.conname = $1 AND c.contype = 'f'
               AND c.conrelid = $2::regclass AND c.confrelid = $3::regclass`, [constraintName, baseTable, relTable]);
        if (res.rows.length > 0) {
            localCol = res.rows[0].local_col;
            remoteCol = res.rows[0].remote_col;
        }
        else if (constraintName.endsWith("_fkey")) {
            // PostgREST naming: transactions_created_by_fkey → local created_by → users.id
            let middle = constraintName.slice(0, -5);
            const prefix = `${baseTable}_`;
            if (middle.startsWith(prefix)) {
                const cand = middle.slice(prefix.length);
                const bCols = await getTableColumns(client, baseTable);
                const rCols = await getTableColumns(client, relTable);
                if (bCols.has(cand) && rCols.has("id")) {
                    localCol = cand;
                    remoteCol = "id";
                }
            }
        }
    }
    else {
        const bCols = await getTableColumns(client, baseTable);
        const rCols = await getTableColumns(client, relTable);
        if (rCols.has("id")) {
            const singular = singularize(relTable);
            const cands = [];
            if (bCols.has(`${relTable}_id`))
                cands.push(`${relTable}_id`);
            if (singular !== relTable && bCols.has(`${singular}_id`))
                cands.push(`${singular}_id`);
            if (cands.length === 1) {
                localCol = cands[0];
                remoteCol = "id";
            }
        }
    }
    const fk = localCol && remoteCol ? { localCol, remoteCol } : null;
    embedFkCache.set(key, fk);
    return fk;
}
async function injectAuthFilters(query, auth, client) {
    const q = { ...query, filters: [...(query.filters ?? [])] };
    if (isFullAdmin(auth))
        return q;
    const baseTable = query.table.includes(".")
        ? query.table.split(".")[1]
        : query.table;
    if (ADMIN_ONLY_TABLES.includes(baseTable) && query.operation !== "select") {
        throw new Error(`Admin access required for ${query.operation} on ${baseTable}`);
    }
    // Deny instead of silently allowing: a non-admin without a company scope
    // would otherwise read ALL tenants and write orphan rows (company_id NULL).
    if (!auth.companyId) {
        throw new Error("Company scope missing in your account metadata — please log out and log in again");
    }
    // Only add tenant filters for tables that actually have the columns.
    // Tables without company_id/branch_id (e.g. color_settings, audit_logs,
    // companies) would otherwise fail with "column does not exist" on every query.
    const cols = await getTableColumns(client, q.table);
    // Simple row-level auth: if table has branch_id and user has branch_id.
    // admin_company is never branch-scoped (sees all branches of its company).
    if (cols.has("branch_id") && auth.branchId && auth.role !== "admin_company") {
        const hasBranchFilter = q.filters.some((f) => f.column === "branch_id" && f.op === "eq");
        if (!hasBranchFilter) {
            q.filters.push({ column: "branch_id", op: "eq", value: auth.branchId });
        }
    }
    if (cols.has("company_id") && auth.companyId) {
        const hasCompanyFilter = q.filters.some((f) => f.column === "company_id" && f.op === "eq");
        if (!hasCompanyFilter) {
            q.filters.push({ column: "company_id", op: "eq", value: auth.companyId });
        }
    }
    return q;
}
// ── Tenant-scoping column cache ────────────────────────────────────────────
// Used to enforce company_id / branch_id on WRITE operations (insert/update/
// upsert) the same way injectAuthFilters enforces it on READ operations.
// Without this, a non-admin user could insert/update rows under a DIFFERENT
// company_id/branch_id than their own, polluting or leaking cross-tenant data.
const tableColumnsCache = new Map();
async function getTableColumns(client, table) {
    const baseTable = table.includes(".") ? table.split(".")[1] : table;
    if (tableColumnsCache.has(baseTable))
        return tableColumnsCache.get(baseTable);
    const res = await client.query(`SELECT column_name FROM information_schema.columns WHERE table_name = $1`, [baseTable]);
    const cols = new Set(res.rows.map((r) => r.column_name));
    tableColumnsCache.set(baseTable, cols);
    return cols;
}
// Forces tenant-scoping columns (company_id/branch_id) to the authenticated
// user's own values on a single row object, for non-admin users only.
function enforceTenantScope(row, cols, auth) {
    if (cols.has("company_id") && auth.companyId) {
        row.company_id = auth.companyId;
    }
    if (cols.has("branch_id") && auth.branchId && auth.role !== "admin_company") {
        row.branch_id = auth.branchId;
    }
}
export async function runQuery(client, query, auth) {
    try {
        validateTable(query.table);
        const q = await injectAuthFilters(query, auth, client);
        const params = [];
        switch (q.operation) {
            case "select": {
                const { clause: where, nextIndex } = buildFullWhere(q, params, 1);
                const order = buildOrderBy(q.orderBy);
                const limit = buildLimit(q.limit, q.offset);
                if (q.head) {
                    const countSql = q.count === "exact"
                        ? `SELECT COUNT(*)::int FROM ${q.table} ${where}`
                        : null;
                    let count = null;
                    if (countSql) {
                        const countResult = await client.query(countSql, params.slice(0, nextIndex - 1));
                        count = countResult.rows[0]?.count ?? null;
                    }
                    return { data: null, error: null, count, status: 200 };
                }
                const baseTable = q.table.includes(".")
                    ? q.table.split(".")[1]
                    : q.table;
                const plainCols = [];
                const embedCols = [];
                for (const c of (q.columns || [])) {
                    // Structured embed: { rel, fields, constraint? } (used by some clients)
                    if (c && typeof c === "object" && c.rel && Array.isArray(c.fields)) {
                        embedCols.push({
                            rel: c.rel,
                            constraint: c.constraint ?? null,
                            fields: c.fields,
                        });
                        continue;
                    }
                    // PostgREST-style string: "rel(field1,field2)" or "rel!constraint(field)"
                    if (typeof c === "string") {
                        const m = c.match(/^([a-zA-Z_][a-zA-Z0-9_]*)(!([a-zA-Z_][a-zA-Z0-9_]*))?\(([^)]*)\)$/);
                        if (m) {
                            embedCols.push({
                                rel: m[1],
                                constraint: m[3],
                                fields: m[4].split(",").map((s) => s.trim()).filter(Boolean),
                            });
                            continue;
                        }
                    }
                    plainCols.push(c);
                }
                const cols = plainCols.length === 0
                    ? `"t".*`
                    : plainCols.map((c) => {
                        if (c === "*")
                            return `"t".*`;
                        // Allow qualified columns like "table.column"
                        const parts = c.split(".").map((p) => p.trim());
                        if (parts.length === 2) {
                            validateTable(parts[0]);
                            validateColumn(parts[1]);
                            return `"${parts[0]}"."${parts[1]}"`;
                        }
                        validateColumn(c);
                        return `"t"."${c}"`;
                    }).join(", ");
                const embedSql = [];
                for (const e of embedCols) {
                    validateTable(e.rel);
                    e.fields.forEach(validateColumn);
                    const fk = await resolveEmbedFk(client, baseTable, e.rel, e.constraint);
                    if (!fk)
                        continue;
                    // `rel(*)` returns the full row as JSON:  jsonb_build_object
                    // cannot express "*", so use to_jsonb("e") for the whole row.
                    const fieldsSql = e.fields.includes("*")
                        ? `to_jsonb("e")`
                        : `jsonb_build_object(${e.fields.map((f) => `'${f}', "e"."${f}"`).join(", ")})`;
                    embedSql.push(`(SELECT ${fieldsSql} FROM "${e.rel}" AS "e" WHERE "e"."${fk.remoteCol}" = "t"."${fk.localCol}" LIMIT 1) AS "${e.rel}"`);
                }
                const allCols = [cols, ...embedSql].filter(Boolean).join(", ");
                const sql = `SELECT ${allCols} FROM ${q.table} AS "t" ${where} ${order} ${limit}`.trim();
                const countSql = q.count === "exact"
                    ? `SELECT COUNT(*)::int FROM ${q.table} ${where}`
                    : null;
                const result = await client.query(sql, params);
                let count = null;
                if (countSql) {
                    const countResult = await client.query(countSql, params.slice(0, nextIndex - 1));
                    count = countResult.rows[0]?.count ?? null;
                }
                const rows = result.rows;
                return { data: rows, error: null, count, status: 200 };
            }
            case "insert": {
                if (!q.values && !q.valuesList) {
                    return { data: null, error: { message: "Missing values for insert" }, status: 400 };
                }
                const list = q.valuesList ?? [q.values];
                if (list.length === 0) {
                    return { data: null, error: { message: "Empty values for insert" }, status: 400 };
                }
                // Prevent created_by / updated_by / company_id / branch_id spoofing for non-admin users.
                // Without this, a non-admin could insert rows tagged with a DIFFERENT tenant's
                // company_id/branch_id, polluting or leaking data across tenants.
                if (!isFullAdmin(auth)) {
                    const cols = await getTableColumns(client, q.table);
                    for (const row of list) {
                        if (cols.has("created_by"))
                            row.created_by = auth.userId;
                        if (cols.has("updated_by"))
                            row.updated_by = auth.userId;
                        enforceTenantScope(row, cols, auth);
                    }
                }
                const firstRow = list[0];
                const keys = Object.keys(firstRow);
                keys.forEach(validateColumn);
                const columns = keys.map((k) => `"${k}"`).join(", ");
                const placeholders = [];
                let idx = 1;
                for (const row of list) {
                    const rowPlaceholders = keys.map(() => `$${idx++}`);
                    placeholders.push(`(${rowPlaceholders.join(", ")})`);
                    for (const k of keys) {
                        params.push(row[k] ?? null);
                    }
                }
                const returning = buildReturning(q.returning);
                const sql = `INSERT INTO ${q.table} (${columns}) VALUES ${placeholders.join(", ")} ${returning}`;
                const result = await client.query(sql, params);
                const rows = result.rows;
                return { data: rows, error: null, status: 201 };
            }
            case "upsert": {
                if (!q.values) {
                    return { data: null, error: { message: "Missing values for upsert" }, status: 400 };
                }
                // Prevent created_by / updated_by / company_id / branch_id spoofing for non-admin users
                if (!isFullAdmin(auth)) {
                    const cols = await getTableColumns(client, q.table);
                    if (cols.has("created_by"))
                        q.values.created_by = auth.userId;
                    if (cols.has("updated_by"))
                        q.values.updated_by = auth.userId;
                    enforceTenantScope(q.values, cols, auth);
                }
                const keys = Object.keys(q.values);
                keys.forEach(validateColumn);
                const columns = keys.map((k) => `"${k}"`).join(", ");
                const placeholders = keys.map((_, i) => `$${i + 1}`).join(", ");
                const updates = keys.map((k) => `"${k}" = EXCLUDED."${k}"`).join(", ");
                const returning = buildReturning(q.returning);
                // Default conflict resolution on primary key "id".
                // Future: allow explicit conflictColumns in QueryDef for composite unique constraints.
                const conflictCols = q.values && "id" in q.values && q.values.id
                    ? ['"id"']
                    : ["id"];
                const sql = `INSERT INTO ${q.table} (${columns}) VALUES (${placeholders}) ON CONFLICT (${conflictCols.join(", ")}) DO UPDATE SET ${updates} ${returning}`;
                for (const k of keys)
                    params.push(q.values[k]);
                const result = await client.query(sql, params);
                const rows = result.rows;
                return { data: rows, error: null, status: 200 };
            }
            case "update": {
                if (!q.values) {
                    return { data: null, error: { message: "Missing values for update" }, status: 400 };
                }
                // Prevent updated_by / company_id / branch_id spoofing for non-admin users.
                // Without enforceTenantScope here, a non-admin could re-assign an existing
                // row to a different tenant by updating company_id/branch_id directly.
                if (!isFullAdmin(auth)) {
                    const cols = await getTableColumns(client, q.table);
                    if (cols.has("updated_by")) {
                        q.values.updated_by = auth.userId;
                    }
                    enforceTenantScope(q.values, cols, auth);
                }
                const setKeys = Object.keys(q.values);
                if (setKeys.length === 0) {
                    return { data: null, error: { message: "Empty values for update" }, status: 400 };
                }
                setKeys.forEach(validateColumn);
                const setClauses = setKeys.map((k, i) => {
                    params.push(q.values[k]);
                    return `"${k}" = $${i + 1}`;
                });
                let idx = setKeys.length + 1;
                const { clause: where, nextIndex } = buildFullWhere(q, params, idx);
                if (!where) {
                    return { data: null, error: { message: "Update requires filters" }, status: 400 };
                }
                const returning = buildReturning(q.returning);
                const sql = `UPDATE ${q.table} SET ${setClauses.join(", ")} ${where} ${returning}`;
                const result = await client.query(sql, params);
                const rows = result.rows;
                return { data: rows, error: null, status: 200 };
            }
            case "delete": {
                const { clause: where } = buildFullWhere(q, params, 1);
                if (!where) {
                    return { data: null, error: { message: "Delete requires filters" }, status: 400 };
                }
                const returning = buildReturning(q.returning);
                const sql = `DELETE FROM ${q.table} ${where} ${returning}`;
                const result = await client.query(sql, params);
                const rows = result.rows;
                return { data: rows, error: null, status: 200 };
            }
            case "rpc": {
                const fn = q.table;
                validateTable(fn);
                const paramKeys = Object.keys(q.values ?? {});
                const placeholders = paramKeys.map((_, i) => `$${i + 1}`).join(", ");
                const sql = paramKeys.length > 0
                    ? `SELECT * FROM ${fn}(${placeholders})`
                    : `SELECT * FROM ${fn}()`;
                for (const k of paramKeys)
                    params.push(q.values[k]);
                const result = await client.query(sql, params);
                const rows = result.rows;
                return { data: rows, error: null, status: 200 };
            }
            default:
                return { data: null, error: { message: `Unknown operation: ${q.operation}` }, status: 400 };
        }
    }
    catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        const status = message.includes("Admin access required") ? 403 : 500;
        return { data: null, error: { message }, status };
    }
}
