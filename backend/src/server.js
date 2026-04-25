require('dotenv').config();
const app = require('./app');
const { supabaseAdmin } = require('./config/db');

const PORT = process.env.PORT || 3000;

// ✅ Database Connection Check
const initializeApp = async () => {
    try {
        // Check if Supabase is reachable
        const { data, error } = await supabaseAdmin.from('committees').select('id').limit(1);
        if (error) throw error;
        console.log("✅ Supabase Connection: Active");

        const server = app.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
            console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
        });

        server.on('error', (err) => {
            if (err.code === 'EADDRINUSE') {
                console.error(`❌ ERROR: Port ${PORT} is already in use.`);
            } else {
                console.error('❌ Server Error:', err);
            }
            process.exit(1);
        });

    } catch (err) {
        console.error("❌ Failed to initialize app:", err.message);
        process.exit(1);
    }
};

initializeApp();