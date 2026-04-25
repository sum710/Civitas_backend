const { Client } = require('pg');
require('dotenv').config({ path: './backend/.env' });

const dbUrl = 'postgresql://postgres.lhnawxmwciutxzdliyan:IkYdnzuKM6w8fq3q@aws-0-ap-south-1.pooler.supabase.com:6543/postgres';

const client = new Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false }
});

async function checkPolicies() {
    try {
        await client.connect();
        console.log("Connected to Supabase!");
        
        const res = await client.query(`
            SELECT schemaname, tablename, policyname, roles, cmd, qual, with_check 
            FROM pg_policies 
            WHERE tablename = 'committees';
        `);
        
        console.log("Policies for 'committees' table:");
        console.table(res.rows);

        const rolesRes = await client.query(`
            SELECT DISTINCT role FROM public.users;
        `);
        console.log("Available roles in users table:");
        console.table(rolesRes.rows);

    } catch (err) {
        console.error("Error checking policies:", err);
    } finally {
        await client.end();
    }
}

checkPolicies();
