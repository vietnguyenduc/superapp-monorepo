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
        const appMetadata = payload.app_metadata ?? {};
        const userMetadata = payload.user_metadata ?? {};
        const metadata = { ...userMetadata, ...appMetadata };
        return {
            userId: payload.sub ?? "",
            email: payload.email,
            role: metadata.role ?? appMetadata.role ?? userMetadata.role ?? "staff",
            branchId: metadata.branch_id ?? userMetadata.branch_id,
            companyId: metadata.company_id ?? userMetadata.company_id ?? appMetadata.company_id,
            metadata,
            payload,
        };
    }
    catch (err) {
        console.error("JWT verification failed:", err);
        return null;
    }
}
