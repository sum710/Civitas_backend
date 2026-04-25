const { pool } = require('./config/db');
const fs = require('fs');

async function dumpConstraints() {
    try {
        const client = await pool.connect();
        const res = await client.query(`
            SELECT conname, pg_get_constraintdef(oid) as def
            FROM pg_constraint
            WHERE conrelid = 'committees'::regclass;
        `);

        let output = '';
        res.rows.forEach(r => {
            output += `CONSTRAINT: ${r.conname}\nDEFINITION: ${r.def}\n\n`;
        });

        fs.writeFileSync('constraint_dump.txt', output);
        console.log("Constraints dumped to constraint_dump.txt");

        client.release();
    } catch (err) {
        console.error(err);
    } finally {
        pool.end();
    }
}

dumpConstraints();
