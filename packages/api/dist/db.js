import { Pool } from "pg";
import { config } from "./config.js";
export const pool = new Pool({
    connectionString: config.databaseUrl,
    max: 20,
});
pool.on("error", (err) => {
    console.error("Unexpected DB error", err);
});
export async function withClient(fn) {
    const client = await pool.connect();
    try {
        return await fn(client);
    }
    finally {
        client.release();
    }
}
