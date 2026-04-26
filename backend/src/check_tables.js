const { supabaseAdmin } = require('./config/db');
require('dotenv').config();

async function checkColumns() {
    try {
        console.log("Checking columns in 'committees'...");
        
        const { data, error } = await supabaseAdmin
            .from('committees')
            .select('*')
            .limit(1);
        
        if (error) {
            console.error("❌ Error accessing 'committees':", error.message);
            return;
        }

        if (data.length === 0) {
            console.log("⚠️ 'committees' table is empty. Cannot check columns from data.");
            // Try to get one row even if it's dummy or use a system query if possible
            // But let's see if we can get schema info.
        } else {
            console.log("✅ Sample row columns:", Object.keys(data[0]));
        }

        console.log("\nChecking columns in 'memberships'...");
        const { data: memData, error: memError } = await supabaseAdmin
            .from('memberships')
            .select('*')
            .limit(1);
        
        if (memError) {
            console.error("❌ Error accessing 'memberships':", memError.message);
        } else if (memData.length > 0) {
            console.log("✅ Sample row columns:", Object.keys(memData[0]));
        } else {
            console.log("⚠️ 'memberships' table is empty.");
        }

    } catch (err) {
        console.error("Unexpected error:", err);
    }
}

checkColumns();
