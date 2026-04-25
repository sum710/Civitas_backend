const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'backend/.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function checkCommittees() {
    const { data, error } = await supabase.from('committees').select('*');
    if (error) {
        console.error('Error:', error);
    } else {
        console.log('Committees found:', data.length);
        console.log(JSON.stringify(data, null, 2));
    }
}

checkCommittees();
