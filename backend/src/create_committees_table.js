const { pool } = require('./config/db');

async function fixSchema() {
    try {
        const client = await pool.connect();
        console.log("Connected to DB. Checking 'committees' table...");

        // Check if table exists
        const checkTable = "SELECT to_regclass('public.committees');";
        const res = await client.query(checkTable);

        if (!res.rows[0].to_regclass) {
            console.log("'committees' table missing. Creating it...");
            const createTable = `
            CREATE TABLE committees (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                type VARCHAR(50) DEFAULT 'Public',
                monthly_amount NUMERIC(12, 2) NOT NULL,
                total_pot NUMERIC(12, 2) NOT NULL,
                members INT DEFAULT 0,
                max_members INT DEFAULT 10,
                description TEXT,
                start_date TIMESTAMP,
                status VARCHAR(50) DEFAULT 'Open',
                created_by INT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `;
            await client.query(createTable);
            console.log("SUCCESS: 'committees' table created.");
        } else {
            console.log("'committees' table already exists.");
        }

        client.release();
        process.exit(0);
    } catch (err) {
        console.error("ERROR fixing schema:", err);
        process.exit(1);
    }
}

fixSchema();
