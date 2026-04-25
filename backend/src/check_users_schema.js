const { supabaseAdmin } = require('./config/db');

async function checkSchema() {
    try {
        // We can't easily query information_schema via RPC or PostgREST unless there's an RPC defined
        // But we can try to select one row from 'users' and see what we get (even if it's empty)
        const { data, error } = await supabaseAdmin
            .from('users')
            .select('*')
            .limit(1);
        
        if (error) {
            console.error("❌ Schema Check Error:", error);
        } else {
            console.log("✅ Successfully reached users table.");
            if (data.length > 0) {
                console.log("Columns found:", Object.keys(data[0]).join(', '));
            } else {
                console.log("Table 'users' is empty. Testing for column 'email' specifically...");
                const { error: emailError } = await supabaseAdmin.from('users').select('email').limit(1);
                if (emailError) {
                    console.log("❌ Column 'email' definitely NOT found.");
                    console.error("Error Detail:", emailError.message);
                } else {
                    console.log("✅ Column 'email' EXISTS.");
                }
            }
        }
    } catch (err) {
        console.error("System Error:", err);
    }
}

checkSchema();
