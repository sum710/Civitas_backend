require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function fixSpinwheel() {
    const { data, error } = await supabase
        .from('committees')
        .update({ title: 'Spinwheel | اسپن وہیل' })
        .ilike('title', 'Spinwheel | Spinwheel');
        
    if (error) console.error(error);
    else console.log('Fixed Spinwheel name');
}

fixSpinwheel();
