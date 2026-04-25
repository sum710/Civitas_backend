const { Client } = require('pg');

const dbUrl = 'postgresql://postgres.lhnawxmwciutxzdliyan:IkYdnzuKM6w8fq3q@aws-0-ap-south-1.pooler.supabase.com:6543/postgres';

const client = new Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false }
});

async function fixDb() {
    try {
        await client.connect();
        console.log("Connected to Supabase via pooled IPv4!");
        
        await client.query(`
        DO $$
        BEGIN
            BEGIN ALTER TABLE public.committees RENAME COLUMN name TO title; EXCEPTION WHEN OTHERS THEN END;
            BEGIN ALTER TABLE public.committees RENAME COLUMN leader_id TO created_by; EXCEPTION WHEN OTHERS THEN END;
            BEGIN ALTER TABLE public.committees RENAME COLUMN contribution_amount TO slot_amount; EXCEPTION WHEN OTHERS THEN END;
            BEGIN ALTER TABLE public.committees RENAME COLUMN payout_amount TO total_amount; EXCEPTION WHEN OTHERS THEN END;
            BEGIN ALTER TABLE public.committees RENAME COLUMN total_slots TO max_members; EXCEPTION WHEN OTHERS THEN END;
        END $$;
        `);
        console.log("Renamed old columns successfully.");

        await client.query(`
        ALTER TABLE public.committees 
            ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'public',
            ADD COLUMN IF NOT EXISTS members INTEGER DEFAULT 1,
            ADD COLUMN IF NOT EXISTS duration_months INTEGER DEFAULT 10,
            ADD COLUMN IF NOT EXISTS start_date TIMESTAMP WITH TIME ZONE;
        `);
        console.log("Added missing columns successfully.");

        console.log("DB alignment complete!");
    } catch (err) {
        console.error("Error fixing DB:", err);
    } finally {
        await client.end();
    }
}

fixDb();
