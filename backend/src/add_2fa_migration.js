require('dotenv').config();
const { Client } = require('pg');

async function runMigration() {
    let url = process.env.DATABASE_URL;
    url = url.replace('aws-0-ap-south-1.pooler.supabase.com', 'db.lhnawxmwciutxzdliyan.supabase.co')
             .replace('postgres.lhnawxmwciutxzdliyan', 'postgres');

    console.log("Using Database URL (direct postgres):", url);
    const client = new Client({
        connectionString: url,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log("Connected to DB.");

        await client.query(`
            ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_secret TEXT;
            ALTER TABLE users ADD COLUMN IF NOT EXISTS is_2fa_enabled BOOLEAN DEFAULT FALSE;
        `);
        console.log("Added 2FA columns to users table.");

    } catch (err) {
        console.error("Migration failed:", err.message);
    } finally {
        await client.end();
    }
}

runMigration();
