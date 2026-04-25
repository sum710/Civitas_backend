const { pool } = require('./config/db');

async function fixTable() {
    try {
        console.log("Checking 'committees' table schema...");
        const client = await pool.connect();

        // Check if table exists first
        const tableCheck = await client.query("SELECT to_regclass('public.committees');");
        if (!tableCheck.rows[0].to_regclass) {
            console.log("Table 'committees' does not exist. Please run create_committees_table.js first.");
            client.release();
            return;
        }

        // Check columns to ensure they exist
        const requiredColumns = ['created_by', 'members', 'max_members', 'status'];

        for (const col of requiredColumns) {
            const check = await client.query(`
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name='committees' AND column_name=$1;
            `, [col]);

            if (check.rows.length === 0) {
                console.log(`Column '${col}' missing via check. Adding it...`);
                let type = 'INT';
                if (col === 'status') type = "VARCHAR(50) DEFAULT 'Open'";

                await client.query(`ALTER TABLE committees ADD COLUMN ${col} ${type};`);
                console.log(`SUCCESS: Added '${col}' column.`);
            } else {
                console.log(`Column '${col}' exists.`);
            }
        }

        client.release();
    } catch (err) {
        console.error("Error fixing schema:", err);
    } finally {
        await pool.end(); // Wait for pool to close
    }
}

fixTable();
