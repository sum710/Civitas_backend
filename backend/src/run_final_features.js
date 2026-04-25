const { Client } = require('pg');
require('dotenv').config();

async function runMigration() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log("✅ Connected DIRECTLY to Supabase PostgreSQL.");

        const sql = `
            -- Phase 1 (Fintech)
            ALTER TABLE users ADD COLUMN IF NOT EXISTS trust_score INTEGER DEFAULT 700;
            
            DO $$ BEGIN
                CREATE TYPE payment_status AS ENUM ('Pending', 'Paid', 'Late');
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;
            
            CREATE TABLE IF NOT EXISTS payments (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                committee_id UUID REFERENCES committees(id) ON DELETE CASCADE,
                user_id UUID REFERENCES users(id) ON DELETE CASCADE,
                amount_due NUMERIC NOT NULL,
                due_date DATE NOT NULL,
                status payment_status DEFAULT 'Pending',
                paid_date DATE
            );

            -- Phase 1 (Activity Feed)
            CREATE TABLE IF NOT EXISTS activity_logs (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID REFERENCES users(id) ON DELETE SET NULL,
                committee_id UUID REFERENCES committees(id) ON DELETE CASCADE,
                action_type VARCHAR(50) NOT NULL,
                description TEXT NOT NULL,
                created_at TIMESTAMPTZ DEFAULT NOW()
            );
            
            CREATE INDEX IF NOT EXISTS idx_activity_logs_committee ON activity_logs(committee_id, created_at DESC);
        `;

        await client.query(sql);
        console.log("✅ Successfully executed migration");

    } catch (err) {
        console.error("❌ Direct Migration failed:", err.stack);
    } finally {
        await client.end();
    }
}

runMigration();
