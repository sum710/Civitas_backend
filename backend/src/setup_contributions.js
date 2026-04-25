const db = require('./config/db');

async function setupContributions() {
    console.log("Starting Contributions Schema update...");
    const client = await db.pool.connect();

    try {
        await client.query('BEGIN');

        // 1. Create the contributions table
        console.log("Creating contributions table...");
        await client.query(`
            CREATE TABLE IF NOT EXISTS contributions (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                committee_id UUID REFERENCES committees(id) ON DELETE CASCADE,
                amount NUMERIC(10, 2) NOT NULL,
                payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log("Contributions table created or already exists.");

        // 2. Add wallet_balance to users
        console.log("Adding wallet_balance to users table...");
        await client.query(`
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS wallet_balance NUMERIC(15, 2) DEFAULT 50000;
        `);
        console.log("wallet_balance column verified/added.");

        await client.query('COMMIT');
        console.log("Schema update completed successfully.");
    } catch (error) {
        await client.query('ROLLBACK');
        console.error("Error updating schema:", error);
    } finally {
        client.release();
        process.exit();
    }
}

setupContributions();
