const { pool } = require('./src/config/db');

async function fixSchema() {
    try {
        console.log("Dropping old 'users' table (CASCADE)...");
        await pool.query('DROP TABLE IF EXISTS users CASCADE');

        console.log("Creating new 'users' table...");
        await pool.query(`
            CREATE TABLE users (
                id SERIAL PRIMARY KEY,
                full_name VARCHAR(255) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                cnic VARCHAR(20) UNIQUE,
                role VARCHAR(50) DEFAULT 'member',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        console.log("Table 'users' recreated successfully!");
    } catch (err) {
        console.error("Error fixing schema:", err);
    } finally {
        pool.end();
    }
}

fixSchema();
