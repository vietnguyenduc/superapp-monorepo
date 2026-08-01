import type { PoolClient } from "pg";
import type { AuthContext } from "./auth.js";
import type { QueryDef } from "./query-runner.js";
/** Log mutations to the audit_logs table. Best-effort: never throws. */
export declare function logAudit(client: PoolClient, query: QueryDef, auth: AuthContext): Promise<void>;
//# sourceMappingURL=audit-log.d.ts.map