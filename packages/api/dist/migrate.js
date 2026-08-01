import { Pool } from "pg";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { config } from "./config.js";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = path.resolve(__dirname, "../migrations");
async function runMigrations() {
    const pool = new Pool({ connectionString: config.databaseUrl });
    const client = await pool.connect();
    try {
        await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id SERIAL PRIMARY KEY,
        filename TEXT UNIQUE NOT NULL,
        applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
        const files = (await fs.readdir(MIGRATIONS_DIR))
            .filter((f) => f.endsWith(".sql"))
            .sort();
        for (const file of files) {
            const existing = await client.query("SELECT 1 FROM schema_migrations WHERE filename = $1", [file]);
            if (existing.rowCount && existing.rowCount > 0) {
                console.log(`Skipping ${file} (already applied)`);
                continue;
            }
            const sql = await fs.readFile(path.join(MIGRATIONS_DIR, file), "utf-8");
            console.log(`Applying ${file}...`);
            await client.query(sql);
            await client.query("INSERT INTO schema_migrations (filename) VALUES ($1)", [file]);
            console.log(`Applied ${file}`);
        }
        console.log("Migrations complete.");
    }
    catch (err) {
        console.error("Migration failed:", err);
        process.exit(1);
    }
    finally {
        client.release();
        await pool.end();
    }
}
runMigrations();
