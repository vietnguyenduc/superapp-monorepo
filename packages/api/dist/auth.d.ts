export interface AuthContext {
    userId: string;
    email?: string;
    role?: string;
    branchId?: string;
    companyId?: string;
    metadata?: Record<string, unknown>;
}
export declare function verifySupabaseToken(token: string): Promise<AuthContext | null>;
//# sourceMappingURL=auth.d.ts.map