const { pool } = require('./src/config/db');

async function listTables() {
    try {
        console.log("Connected to:", process.env.DATABASE_URL || 'default config');

        const res = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            AND table_type = 'BASE TABLE';
        `);

        console.log("Tables found in DB:");
        if (res.rows.length === 0) {
            console.log("No tables found in public schema.");
        } else {
            res.rows.forEach(r => console.log(` - ${r.table_name}`));
        }

    } catch (err) {
        console.error("Error listing tables:", err);
    } finally {
        pool.end();
    }
}

listTables();
