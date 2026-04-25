const { Client } = require('pg');
require('dotenv').config();

async function updateRoles() {
    const directConnectionString = "postgresql://postgres.lhnawxmwciutxzdliyan:IkYdnzuKM6w8fq3q@db.lhnawxmwciutxzdliyan.supabase.co:5432/postgres";
    
    const client = new Client({
        connectionString: directConnectionString,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        
        console.log("✅ Connected for role update.");
        
        // 1. Update any existing 'admin' to 'committee leader'
        // 2. Change the default for the column if needed
        const sql = `
            UPDATE users SET role = 'committee leader' WHERE role = 'admin';
            ALTER TABLE users ALTER COLUMN role SET DEFAULT 'member';
        `;
        
        await client.query(sql);
        console.log("✅ Successfully updated existing roles to 'committee leader'.");

    } catch (err) {
        console.error("❌ Role update failed:", err.message);
        console.log("Please run this manually in Supabase SQL Editor if needed:");
        console.log("UPDATE users SET role = 'committee leader' WHERE role = 'admin';");
    } finally {
        await client.end();
    }
}

updateRoles();
