const db = require('./config/db');

async function setupPayouts() {
    console.log("Starting Payouts Schema update...");
    const client = await db.pool.connect();

    try {
        await client.query('BEGIN');

        // Create the payouts table
        console.log("Creating payouts table...");
        await client.query(`
            CREATE TABLE IF NOT EXISTS payouts (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                committee_id UUID REFERENCES committees(id) ON DELETE CASCADE,
                amount NUMERIC(10, 2) NOT NULL,
                payout_method VARCHAR(50),
                account_details VARCHAR(255),
                payout_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT unique_committee_payout UNIQUE (user_id, committee_id)
            );
        `);
        console.log("Payouts table created or already exists.");

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

setupPayouts();
