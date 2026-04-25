const { pool } = require('./config/db');

async function checkPK() {
    try {
        const client = await pool.connect();
        const res = await client.query(`
            SELECT constraint_name, table_name, constraint_type
            FROM information_schema.table_constraints
            WHERE table_name = 'committees' AND constraint_type = 'PRIMARY KEY';
        `);
        console.log("Constraints:", res.rows);
        client.release();
    } catch (err) {
        console.error(err);
    } finally {
        pool.end();
    }
}

checkPK();
