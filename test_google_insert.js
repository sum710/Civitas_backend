const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'backend/.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function testUserInsert() {
    const { data, error } = await supabase.from('users').insert([{
        email: 'test' + Date.now() + '@google.com',
        full_name: 'Test Google User',
        cnic: '1234567890123',
        password_hash: 'OAUTH_PROVIDER_NO_PASSWORD',
        role: 'member'
    }]).select('*').single();

    if (error) {
        console.error('Insert error with 13 digit CNIC:', error);
    } else {
        console.log('Inserted with 13-digit CNIC successfully!');
    }

    const { data: data2, error: error2 } = await supabase.from('users').insert([{
        email: 'test' + (Date.now() + 1) + '@google.com',
        full_name: 'Test Google User 2',
        cnic: 'GOOGLE-12345678',
        password_hash: 'OAUTH_PROVIDER_NO_PASSWORD',
        role: 'member'
    }]).select('*').single();

    if (error2) {
        console.error('Insert error with GOOGLE- prefix CNIC:', error2);
    } else {
        console.log('Inserted with GOOGLE- prefix successfully!');
    }
}

testUserInsert();
