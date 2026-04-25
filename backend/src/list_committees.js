const { supabaseAdmin } = require('./config/db');

async function listPublicCommittees() {
    console.log('Fetching public committees...');
    const { data, error } = await supabaseAdmin
        .from('committees')
        .select('*')
        .eq('visibility', 'public');
    
    if (error) {
        console.error('Error:', error.message);
    } else {
        console.log('Public Committees Count:', data.length);
        data.forEach(c => {
            console.log(`- ${c.title} (ID: ${c.id}, Status: ${c.status})`);
        });
    }
}

listPublicCommittees();
