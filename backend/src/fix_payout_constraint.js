const { Client } = require('pg');
require('dotenv').config();

// Use the DATABASE_URL connection string
const directConnectionString = "postgresql://postgres:IkYdnzuKM6w8fq3q@db.lhnawxmwciutxzdliyan.supabase.co:5432/postgres";

const client = new Client({
    connectionString: directConnectionString,
    ssl: { rejectUnauthorized: false }
});

async function fixPayoutConstraint() {
    try {
        await client.connect();
        
        console.log("Fixing 'payouts_payout_method_check' in payouts table via DIRECT connection...");
        
        // Drop the constraint and re-add one that is much more flexible (case-insensitive and has common aliases)
        const sql = `
            ALTER TABLE payouts DROP CONSTRAINT IF EXISTS payouts_payout_method_check;
            ALTER TABLE payouts ADD CONSTRAINT payouts_payout_method_check 
            CHECK (payout_method IN ('EASYPAISA', 'DARAZ', 'easypaisa', 'daraz', 'CASH', 'cash', 'VOUCHER', 'voucher', 'BANK', 'bank', 'JAZZCASH', 'jazzcash'));
        `;
        
        await client.query(sql);
        console.log("✅ SUCCESS: Payout method check constraint updated.");
        
    } catch (err) {
        console.error("❌ ERROR fixing constraint:", err.message);
    } finally {
        await client.end();
        process.exit(0);
    }
}

fixPayoutConstraint();
