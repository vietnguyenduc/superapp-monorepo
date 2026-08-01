import { createRemoteJWKSet, jwtVerify } from "jose";
import { config } from "./config.js";
const JWKS = createRemoteJWKSet(new URL(`${config.supabaseUrl}/auth/v1/.well-known/jwks.json`));
export async function verifySupabaseToken(token) {
    try {
        const { payload } = await jwtVerify(token, JWKS, {
            issuer: `${config.supabaseUrl}/auth/v1`,
            audience: "authenticated",
            clockTolerance: 60,
        });
        const metadata = payload.user_metadata ?? {};
        return {
            userId: payload.sub ?? "",
            email: payload.email,
            role: metadata.role ?? "staff",
            branchId: metadata.branch_id,
            companyId: metadata.company_id,
            metadata,
        };
    }
    catch (err) {
        console.error("JWT verification failed:", err);
        return null;
    }
}
