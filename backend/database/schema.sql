-- Civitas Database Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    firebase_uid VARCHAR(128) UNIQUE NOT NULL,
    phone_number VARCHAR(20) UNIQUE NOT NULL,
    cnic VARCHAR(20) UNIQUE,
    full_name VARCHAR(100),
    trust_score DECIMAL(5, 2) DEFAULT 50.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- COMMITTEES (ROSCA Groups)
CREATE TABLE IF NOT EXISTS committees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    total_amount DECIMAL(12, 2) NOT NULL,
    slot_amount DECIMAL(12, 2) NOT NULL,
    duration_months INTEGER NOT NULL,
    start_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACTIVE', 'COMPLETED', 'CANCELLED')),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- MEMBERSHIPS (Linking Users to Committees)
CREATE TABLE IF NOT EXISTS memberships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    committee_id UUID REFERENCES committees(id) ON DELETE CASCADE,
    slot_number INTEGER, -- If assigned a specific turn
    status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'COMPLETED', 'DEFAULTED')),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, committee_id)
);

-- ACCOUNTS / LEDGER (Tracking User Balances per Committee strictly)
-- Ideally each membership can be seen as an account.
-- But for strict ledger, let's track transactions.

-- TRANSACTIONS
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    membership_id UUID REFERENCES memberships(id),
    amount DECIMAL(12, 2) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('CONTRIBUTION', 'PAYOUT', 'PENALTY')),
    method VARCHAR(20) DEFAULT 'CASH' CHECK (method IN ('CASH', 'VOUCHER', 'BANK_TRANSFER')),
    status VARCHAR(20) DEFAULT 'COMPLETED',
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- INDEXES for Performance
CREATE INDEX idx_users_firebase_uid ON users(firebase_uid);
CREATE INDEX idx_memberships_user_id ON memberships(user_id);
CREATE INDEX idx_memberships_committee_id ON memberships(committee_id);
CREATE INDEX idx_transactions_membership_id ON transactions(membership_id);
