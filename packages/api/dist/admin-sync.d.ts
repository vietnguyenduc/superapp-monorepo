export interface UserToSync {
    id: string;
    email?: string;
    full_name?: string;
    role?: string;
    branch_id?: string;
    company_id?: string;
    raw_user_meta_data?: Record<string, unknown>;
}
/**
 * Bulk sync users into local PostgreSQL.
 * Uses a single transaction for atomicity.
 */
export declare function bulkSyncUsers(users: UserToSync[]): Promise<{
    inserted: number;
    updated: number;
    errors: string[];
}>;
//# sourceMappingURL=admin-sync.d.ts.map