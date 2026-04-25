const { pool } = require('./src/config/db');

async function verifyUsers() {
    try {
        console.log("Verifying 'users' table...");
        const res = await pool.query("SELECT * FROM users LIMIT 1;");
        console.log("Select success! Rows:", res.rows.length);

        const cols = await pool.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'users';
        `);
        console.log("Columns:", cols.rows.map(r => r.column_name).join(', '));

    } catch (err) {
        console.error("VERIFICATION_ERROR:", err.message);
    } finally {
        pool.end();
    }
}

verifyUsers();
