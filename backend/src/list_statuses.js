const { pool } = require('./config/db');

async function listStatuses() {
    try {
        const client = await pool.connect();

        console.log("Connected. Verifying table existence...");
        const res = await client.query("SELECT count(*) FROM committees");
        console.log("Table exists. Row count:", res.rows[0].count);

        // Try inserting dummy row with 'open' status
        console.log("Testing INSERT with status='open'...");
        try {
            await client.query(`
                INSERT INTO committees (title, monthly_amount, total_amount, status)
                VALUES ('Test', 100, 1000, 'open');
            `);
            console.log("SUCCESS: 'open' is valid.");
            await client.query("DELETE FROM committees WHERE title='Test'");
        } catch (err) {
            console.log("FAILED with 'open':", err.message);
        }

        // Try 'Open'
        console.log("Testing INSERT with status='Open'...");
        try {
            await client.query(`
                INSERT INTO committees (title, monthly_amount, total_amount, status)
                VALUES ('Test', 100, 1000, 'Open');
            `);
            console.log("SUCCESS: 'Open' is valid.");
            await client.query("DELETE FROM committees WHERE title='Test'");
        } catch (err) {
            console.log("FAILED with 'Open':", err.message);
        }

        client.release();
    } catch (err) {
        console.error("Global Error:", err.message);
    } finally {
        pool.end();
    }
}

listStatuses();
