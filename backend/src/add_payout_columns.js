const db = require('./config/db');

async function fixPayouts() {
    console.log("Adding missing columns to payouts table...");
    const client = await db.pool.connect();

    try {
        await client.query('BEGIN');

        await client.query(`ALTER TABLE payouts ADD COLUMN IF NOT EXISTS payout_method VARCHAR(50);`);
        await client.query(`ALTER TABLE payouts ADD COLUMN IF NOT EXISTS account_details VARCHAR(255);`);

        await client.query('COMMIT');
        console.log("Added payout_method and account_details to payouts table.");
    } catch (error) {
        await client.query('ROLLBACK');
        console.error("Error altering payouts table:", error);
    } finally {
        client.release();
        process.exit();
    }
}

fixPayouts();
