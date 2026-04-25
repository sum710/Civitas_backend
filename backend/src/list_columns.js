const { pool } = require('./config/db');

async function listColumns() {
    try {
        const client = await pool.connect();
        const res = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'committee_members';
        `);
        const names = res.rows.map(r => r.column_name);
        console.log("Committee Members Columns:", names.join(', '));
        client.release();
    } catch (err) {
        console.error(err);
    } finally {
        pool.end();
    }
}

listColumns();
