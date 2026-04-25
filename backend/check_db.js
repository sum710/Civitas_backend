require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
    console.log("Fetching a row to see existing columns...");
    const { data, error } = await supabase.from('committees').select('*').limit(1);
    
    if (error) {
        console.error("Error fetching rules:", error);
    } else {
        if (data.length > 0) {
            console.log("Columns present in table:");
            console.log(Object.keys(data[0]).join(', '));
        } else {
            console.log("No data found, trying to instrospect via empty insert error catch...");
            const { error: insertError} = await supabase.from('committees').insert([{id: '00000000-0000-0000-0000-000000000000'}]);
            console.log("Error details might have schema:", insertError);
        }
    }
}

checkSchema();
