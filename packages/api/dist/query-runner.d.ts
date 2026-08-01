import type { PoolClient } from "pg";
import type { AuthContext } from "./auth.js";
type FilterOp = "eq" | "neq" | "gt" | "gte" | "lt" | "lte" | "like" | "ilike" | "in" | "is" | "cs" | "cd";
export interface Filter {
    column: string;
    op: FilterOp;
    value?: unknown;
}
export interface OrderBy {
    column: string;
    direction?: "asc" | "desc";
}
export interface QueryDef {
    operation: "select" | "insert" | "update" | "delete" | "upsert" | "rpc";
    table: string;
    columns?: string[];
    filters?: Filter[];
    values?: Record<string, unknown>;
    valuesList?: Record<string, unknown>[];
    orderBy?: OrderBy[];
    limit?: number;
    offset?: number;
    single?: boolean;
    maybeSingle?: boolean;
    head?: boolean;
    count?: "exact" | "planned" | "estimated";
    returning?: string[];
}
export interface QueryResult<T = unknown> {
    data: T | null;
    error: {
        message: string;
        details?: string;
    } | null;
    count?: number | null;
    status: number;
}
export declare function runQuery<T = unknown>(client: PoolClient, query: QueryDef, auth: AuthContext): Promise<QueryResult<T>>;
export {};
//# sourceMappingURL=query-runner.d.ts.map