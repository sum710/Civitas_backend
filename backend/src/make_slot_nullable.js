const { pool } = require('./config/db');

async function makeSlotNullable() {
    try {
        const client = await pool.connect();
        console.log("Altering committee_members to make slot_number NULLABLE...");
        await client.query('ALTER TABLE committee_members ALTER COLUMN slot_number DROP NOT NULL;');
        console.log("SUCCESS: slot_number is now NULLABLE.");
        client.release();
    } catch (err) {
        console.error("Error altering table:", err);
    } finally {
        pool.end();
    }
}

makeSlotNullable();
