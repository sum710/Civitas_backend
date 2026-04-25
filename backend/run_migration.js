const { pool } = require('./src/config/db');

async function runMigration() {
    try {
        const query = `ALTER TABLE committees ADD COLUMN invite_code VARCHAR(6) UNIQUE NULL;`;
        await pool.query(query);
        console.log("Migration successful");
    } catch (err) {
        console.error("Error running migration:", err);
    } finally {
        pool.end();
    }
}

runMigration();
