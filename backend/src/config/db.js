const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey || supabaseServiceRoleKey === 'PASTE_YOUR_SERVICE_ROLE_KEY_HERE') {
  console.error('❌ Supabase configuration missing! Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env');
}

// Create a Supabase client with the Service Role Key to bypass RLS
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

console.log('✅ Supabase Admin Client initialized for:', supabaseUrl);

module.exports = {
  supabaseAdmin
};