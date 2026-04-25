const { pool } = require('./config/db');

async function checkUserType() {
    try {
        const client = await pool.connect();
        const res = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'users' AND column_name = 'id';
        `);
        console.log("Users ID Type:", res.rows[0]);
        client.release();
    } catch (err) {
        console.error(err);
    } finally {
        pool.end();
    }
}

checkUserType();
