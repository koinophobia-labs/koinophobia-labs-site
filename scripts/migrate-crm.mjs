import fs from "node:fs"; import pg from "pg";
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
try { await pool.query(fs.readFileSync(new URL("../db/001_crm_leads.sql", import.meta.url), "utf8")); console.log("CRM migration 001 applied successfully."); } finally { await pool.end(); }
