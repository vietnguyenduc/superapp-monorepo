import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Resolve project root regardless of src/ vs dist/
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });
export const config = {
    port: Number(process.env.API_PORT ?? "3001"),
    databaseUrl: process.env.DATABASE_URL ??
        "postgres://superapp:superapp_local@localhost:5432/superapp",
    supabaseUrl: process.env.SUPABASE_URL ??
        "https://peslmsctejmvkwzyohke.supabase.co",
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY ?? "",
    supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
    supabaseJwtSecret: process.env.SUPABASE_JWT_SECRET ?? "",
    supabaseWebhookSecret: process.env.SUPABASE_WEBHOOK_SECRET ?? "",
    nodeEnv: process.env.NODE_ENV ?? "development",
    corsOrigins: (process.env.CORS_ORIGINS ?? "http://localhost:5173").split(","),
};
