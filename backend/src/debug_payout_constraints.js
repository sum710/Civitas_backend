const { Client } = require('pg');
require('dotenv').config();

// Use the DIRECT connection string from update_roles.js
const directConnectionString = "postgresql://postgres.lhnawxmwciutxzdliyan:IkYdnzuKM6w8fq3q@db.lhnawxmwciutxzdliyan.supabase.co:5432/postgres";

const client = new Client({
    connectionString: directConnectionString,
    ssl: { rejectUnauthorized: false }
});

async function checkPayoutsConstraint() {
    try {
        await client.connect();
        
        console.log("Checking constraints on 'payouts' table via DIRECT connection...");
        
        const res = await client.query(`
            SELECT 
                conname as constraint_name,
                pg_get_constraintdef(oid) as constraint_definition
            FROM pg_constraint 
            WHERE conrelid = 'public.payouts'::regclass;
        `);
        
        console.log("Found Constraints:");
        process.stdout.write(JSON.stringify(res.rows, null, 2));
        
    } catch (err) {
        console.error("Error during check:", err.message);
    } finally {
        await client.end();
    }
}

checkPayoutsConstraint();
