const { pool } = require('./config/db');

async function checkConstraints() {
    try {
        const client = await pool.connect();
        console.log("Checking constraints on 'committees' table...");

        const res = await client.query(`
            SELECT pg_get_constraintdef(oid)
            FROM pg_constraint
            WHERE conname = 'committees_type_check';
        `);
        console.log("TYPE CONSTRAINT DEF:", res.rows[0]?.pg_get_constraintdef);
        console.log("-----------------------------");
        client.release();
    } catch (err) {
        console.error(err);
    } finally {
        pool.end();
    }
}

checkConstraints();
