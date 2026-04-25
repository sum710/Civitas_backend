const { Client } = require('pg');
require('dotenv').config();
const fs = require('fs');
const path = require('path');

async function runMigration() {
    // Attempting direct connection to bypass pooler "Tenant not found" issues
    const directConnectionString = "postgresql://postgres.lhnawxmwciutxzdliyan:IkYdnzuKM6w8fq3q@db.lhnawxmwciutxzdliyan.supabase.co:5432/postgres";
    
    const client = new Client({
        connectionString: directConnectionString,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log("✅ Connected DIRECTLY to Supabase PostgreSQL.");

        const sqlPath = path.join(__dirname, '../database/add_missing_user_columns.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        await client.query(sql);
        console.log("✅ Successfully executed migration");

    } catch (err) {
        console.error("❌ Direct Migration failed:", err.message);
        console.log("\n⚠️ NOTICE: If this continues to fail, please manually run the SQL in your Supabase Dashboard SQL Editor:");
        console.log("-------------------------------------------");
        console.log(fs.readFileSync(path.join(__dirname, '../database/add_missing_user_columns.sql'), 'utf8'));
        console.log("-------------------------------------------");
    } finally {
        await client.end();
    }
}

runMigration();
