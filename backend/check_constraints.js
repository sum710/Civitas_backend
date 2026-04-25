require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function getConstraints() {
    const { data, error } = await supabase.rpc('get_constraint_definition', { t_name: 'transactions' });
    // If RPC doesn't exist, we'll try a raw query
    if (error) {
        const { data: rawData, error: rawError } = await supabase.from('pg_constraint').select('*');
        console.log(JSON.stringify(rawData, null, 2));
    } else {
        console.log(JSON.stringify(data, null, 2));
    }
}

getConstraints();
