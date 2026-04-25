require('dotenv').config();
const app = require('./app');
const { supabaseAdmin } = require('./config/db'); // Initialize Supabase Client

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log('📡 Routes are active');
});

server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`ERROR: Port ${PORT} is already in use.`);
    }
    process.exit(1);
});