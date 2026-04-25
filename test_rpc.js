const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'backend/.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function testRPC() {
    console.log('Testing RPC process_contribution...');
    // Try to call it with dummy data to see if it exists
    const { error } = await supabase.rpc('process_contribution', {
        p_committee_id: 1,
        p_user_id: 'dummy',
        p_amount: 0
    });
    
    if (error) {
        console.log('RPC Error (Expected if dummy):', error.message);
        if (error.message.includes('function') && error.message.includes('does not exist')) {
            console.error('CRITICAL: RPC function "process_contribution" DOES NOT EXIST in Supabase!');
        }
    } else {
        console.log('RPC exists and responded.');
    }
}

testRPC();
