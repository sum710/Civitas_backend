require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function list() {
    const { data, error } = await supabase.from('committees').select('*');
    if (error) console.error(error);
    else console.log(JSON.stringify(data, null, 2));
}

list();
