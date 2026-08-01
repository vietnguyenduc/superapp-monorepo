import type { AuthContext } from "./auth.js";
/**
 * Ensure the authenticated user exists in local PostgreSQL.
 * Upserts into auth.users (required for FK constraints) and public.users (app-level user record).
 */
export declare function ensureUserInLocalDb(auth: AuthContext): Promise<void>;
//# sourceMappingURL=user-sync.d.ts.map