const { supabaseAdmin } = require('./config/db');

async function testRPC() {
    console.log('Testing RPC process_contribution...');
    try {
        const { error } = await supabaseAdmin.rpc('process_contribution', {
            p_committee_id: 1,
            p_user_id: 'd967e873-5183-431a-8e2b-f0270a483f91', // dummy uuid
            p_amount: 0
        });
        
        if (error) {
            console.log('RPC Error Response:', error.message);
            if (error.message.includes('function') && error.message.includes('does not exist')) {
                console.error('CRITICAL: RPC function "process_contribution" DOES NOT EXIST in Supabase!');
            }
        } else {
            console.log('RPC exists and responded.');
        }
    } catch (err) {
        console.error('Execution error:', err.message);
    }
}

testRPC();
