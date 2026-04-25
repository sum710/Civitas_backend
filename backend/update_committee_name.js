require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function update() {
    console.log("Updating committee...");
    const { data, error } = await supabase
        .from('committees')
        .update({ title: 'wheel test committee | وہیل ٹیسٹ کمیٹی' })
        .ilike('title', 'wheel test committee')
        .select();
        
    if (error) {
        console.error("Error:", error);
    } else {
        console.log("Success! Updated records:", data);
    }
}

update();
