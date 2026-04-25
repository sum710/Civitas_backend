const { pool } = require('./config/db');

async function addColumns() {
    try {
        const client = await pool.connect();
        console.log("Adding 'type' and 'description' columns...");

        // Add type
        try {
            await client.query("ALTER TABLE committees ADD COLUMN type VARCHAR(50) DEFAULT 'Public';");
            console.log("Added 'type' column.");
        } catch (e) {
            console.log("'type' column likely exists or error:", e.message);
        }

        // Add description
        try {
            await client.query("ALTER TABLE committees ADD COLUMN description TEXT;");
            console.log("Added 'description' column.");
        } catch (e) {
            console.log("'description' column likely exists or error:", e.message);
        }

        client.release();
    } catch (err) {
        console.error(err);
    } finally {
        pool.end();
    }
}

addColumns();
