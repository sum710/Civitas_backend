require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

const runMigration = async () => {
    try {
        console.log("Connecting to Supabase Database...");
        const client = await pool.connect();

        console.log("Running Phase 1 Schema Migration...");

        const query = `
            -- Drop existing tables to ensure a clean slate if requested? 
            -- NO! Let's be safe and use 'IF NOT EXISTS' unless altering. 
            -- But since previous tables exist with different schemas, let's just make sure
            -- we create missing tables or update them.

            -- 1. Create the Users Table (already exists if auth works, but ensure columns exist)
            CREATE TABLE IF NOT EXISTS public.users (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                role VARCHAR(50) DEFAULT 'member', 
                wallet_balance DECIMAL(12, 2) DEFAULT 0.00,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
            );

            -- Ensure columns exist if the table already existed (idempotent alterations)
            DO $$ 
            BEGIN 
                -- users columns
                BEGIN
                    ALTER TABLE public.users ADD COLUMN IF NOT EXISTS wallet_balance DECIMAL(12, 2) DEFAULT 0.00;
                    ALTER TABLE public.users ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'member';
                    ALTER TABLE public.users ADD COLUMN IF NOT EXISTS full_name VARCHAR(255);
                    ALTER TABLE public.users ADD COLUMN IF NOT EXISTS cnic VARCHAR(50);
                EXCEPTION WHEN OTHERS THEN NULL;
                END;
            END $$;

            -- 2. Create the Committees Table
            CREATE TABLE IF NOT EXISTS public.committees (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                title VARCHAR(255) NOT NULL,
                type VARCHAR(50) DEFAULT 'public',
                description TEXT,
                created_by UUID REFERENCES public.users(id) ON DELETE CASCADE,
                max_members INTEGER NOT NULL DEFAULT 10,
                members INTEGER DEFAULT 1,
                slot_amount DECIMAL(12, 2) NOT NULL,
                total_amount DECIMAL(12, 2) NOT NULL,
                duration_months INTEGER DEFAULT 10,
                start_date TIMESTAMP WITH TIME ZONE,
                status VARCHAR(50) DEFAULT 'PENDING', 
                invite_code VARCHAR(20),
                created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
            );

            -- 3. Create the Committee Members Table
            CREATE TABLE IF NOT EXISTS public.committee_members (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                committee_id UUID REFERENCES public.committees(id) ON DELETE CASCADE,
                user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
                slot_number INTEGER, 
                status VARCHAR(50) DEFAULT 'ACTIVE', 
                joined_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
                UNIQUE(committee_id, user_id) 
            );

            -- 4. Create the Contributions Table (since your backend uses 'contributions')
            CREATE TABLE IF NOT EXISTS public.contributions (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
                committee_id UUID REFERENCES public.committees(id) ON DELETE SET NULL,
                amount DECIMAL(12, 2) NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
            );

            -- 5. Create the Payouts Table (since your backend uses 'payouts')
            CREATE TABLE IF NOT EXISTS public.payouts (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
                committee_id UUID REFERENCES public.committees(id) ON DELETE CASCADE,
                amount DECIMAL(12, 2) NOT NULL,
                payout_method VARCHAR(50), 
                account_details VARCHAR(255),
                status VARCHAR(50) DEFAULT 'pending', 
                created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
                UNIQUE(user_id, committee_id)
            );
        `;

        await client.query(query);
        console.log("Successfully ran Schema Migration.");
        client.release();
        process.exit(0);

    } catch (err) {
        console.error("Migration Error:", err);
        process.exit(1);
    }
};

runMigration();
