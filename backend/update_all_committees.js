require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const updates = {
    'For testing': 'For testing | ٹیسٹنگ کے لیے',
    'Private committee test': 'Private committee test | نجی کمیٹی ٹیسٹ',
    'wheel test': 'wheel test | وہیل ٹیسٹ',
    'w_test': 'w_test | ڈبلیو ٹیسٹ',
    'wheel_t1': 'wheel_t1 | وہیل ٹی ون',
    'wheel_test2': 'wheel_test2 | وہیل ٹیسٹ ٹو',
    'checking': 'checking | چیکنگ',
    'member_ledger': 'member_ledger | ممبر لیجر',
    'test_test': 'test_test | ٹیسٹ ٹیسٹ',
    'withdraw_feature': 'withdraw_feature | رقم نکالنے کی خصوصیت',
    'c1': 'c1 | سی ون'
};

async function updateAll() {
    console.log("Updating committees...");
    let successCount = 0;
    
    for (const [engName, bilingualName] of Object.entries(updates)) {
        const { data, error } = await supabase
            .from('committees')
            .update({ title: bilingualName })
            .ilike('title', engName)
            .select();
            
        if (error) {
            console.error(`Error updating ${engName}:`, error);
        } else if (data && data.length > 0) {
            console.log(`Updated ${engName} -> ${bilingualName} (${data.length} records)`);
            successCount += data.length;
        }
    }
    
    console.log(`Finished! Updated ${successCount} records.`);
}

updateAll();
