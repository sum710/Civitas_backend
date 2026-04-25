const { pool } = require('./src/config/db');

async function checkSchema() {
    try {
        const res = await pool.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'users';
        `);

        const columns = res.rows.map(row => row.column_name);
        console.log("COLUMNS_FOUND:", JSON.stringify(columns));
    } catch (err) {
        console.error("Error checking schema:", err);
    } finally {
        pool.end();
    }
}

checkSchema();
