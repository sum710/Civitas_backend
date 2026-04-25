-- Migration: Add missing columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS email VARCHAR(255) UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'member';
ALTER TABLE users ADD COLUMN IF NOT EXISTS wallet_balance DECIMAL(12, 2) DEFAULT 0.00;

-- Relax constraints on legacy columns if they are no longer strictly required for email-based signup
ALTER TABLE users ALTER COLUMN firebase_uid DROP NOT NULL;
ALTER TABLE users ALTER COLUMN phone_number DROP NOT NULL;
