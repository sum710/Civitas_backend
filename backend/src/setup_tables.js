const { pool } = require('./config/db');

async function setupTables() {
    try {
        const client = await pool.connect();
        console.log("Setting up database tables...");

        // 1. Committees Table (Ensure it exists with correct columns)
        // We already have it, but let's ensure constraints or structure if re-creating
        // Since we have data, we won't drop it. We just ensure committee_members exists.

        // 2. Committee Members Table
        const createMembersTable = `
            CREATE TABLE IF NOT EXISTS committee_members (
                id SERIAL PRIMARY KEY,
                committee_id UUID REFERENCES committees(id) ON DELETE CASCADE,
                user_id INT REFERENCES users(id) ON DELETE CASCADE,
                slot_number INT NOT NULL,
                status VARCHAR(20) DEFAULT 'ACTIVE',
                joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(committee_id, slot_number)
            );
        `;
        await client.query(createMembersTable);
        console.log("SUCCESS: 'committee_members' table ready.");

        client.release();
    } catch (err) {
        console.error("Error setting up tables:", err);
    } finally {
        pool.end();
    }
}

setupTables();
