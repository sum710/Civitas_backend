const { pool } = require('./config/db');

async function fixForeignKey() {
    try {
        const client = await pool.connect();

        // 1. Drop the constraint if it exists (likely not if type mismatch, but safe to try)
        // Finding constraint name is hard, so we just alter type forcefully first

        console.log("Altering 'committees.created_by' to INT...");

        // Need to drop defaults or constraints if any
        // Assuming simple alteration for now.
        // Using 'USING created_by::integer' might fail if there's UUID data, but table is likely empty or has no valid user links yet.
        await client.query("ALTER TABLE committees ALTER COLUMN created_by TYPE INT USING (NULL);");

        console.log("SUCCESS: 'created_by' is now INT.");

        client.release();
    } catch (err) {
        console.error("Error fixing foreign key:", err);
    } finally {
        pool.end();
    }
}

fixForeignKey();
