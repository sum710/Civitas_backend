const { pool } = require('./config/db');

async function addRoleColumn() {
    try {
        const client = await pool.connect();
        console.log("Connected to DB, adding role column...");

        // Check if column exists first to avoid error
        const checkQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='users' AND column_name='role';
    `;
        const checkRes = await client.query(checkQuery);

        if (checkRes.rows.length === 0) {
            await client.query("ALTER TABLE users ADD COLUMN role VARCHAR(50) DEFAULT 'member';");
            console.log("SUCCESS: 'role' column added to 'users' table.");
        } else {
            console.log("INFO: 'role' column already exists.");
        }

        client.release();
        process.exit(0);
    } catch (err) {
        console.error("ERROR adding column:", err);
        process.exit(1);
    }
}

addRoleColumn();
