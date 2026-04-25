const { supabaseAdmin } = require('../config/db');
const { logActivity } = require('../utils/activityLogger');

/**
 * Record a Contribution (Payment)
 * Route: POST /api/ledger/contribute
 * Constraint: Migrated to Supabase SDK (Sequential operations)
 */
exports.contribute = async (req, res) => {
    const { committee_id, amount, method } = req.body;
    const { uid } = req.user; // Assuming uid is firebase_uid from decoded token

    try {
        // 1. Get Membership ID (Join syntax in Supabase)
        const { data: membership, error: memberError } = await supabaseAdmin
            .from('memberships')
            .select(`
                id, 
                status, 
                committee:committees (slot_amount)
            `)
            .eq('user:users(firebase_uid)', uid) // This join syntax might need specific schema setup
            .eq('committee_id', committee_id)
            .single();

        // If the above nested filter doesn't work out of the box, we fallback to two queries
        let finalMembership = membership;
        if (memberError || !membership) {
             // Fallback: Get user first
             const { data: user } = await supabaseAdmin.from('users').select('id').eq('firebase_uid', uid).single();
             if (user) {
                 const { data: m, error: me } = await supabaseAdmin
                    .from('memberships')
                    .select('id, status, committee_id')
                    .eq('user_id', user.id)
                    .eq('committee_id', committee_id)
                    .single();
                 
                 if (m) {
                     const { data: c } = await supabaseAdmin.from('committees').select('slot_amount').eq('id', committee_id).single();
                     finalMembership = { ...m, committee: c };
                 }
             }
        }

        if (!finalMembership) {
            return res.status(404).json({ error: 'Membership not found' });
        }

        // 2. Insert Transaction
        const { data: transaction, error: insertError } = await supabaseAdmin
            .from('transactions')
            .insert([{
                membership_id: finalMembership.id,
                amount: amount,
                type: 'CONTRIBUTION',
                method: method || 'CASH',
                status: 'COMPLETED'
            }])
            .select()
            .single();

        if (insertError) throw insertError;

        await logActivity(req.user.id, committee_id, 'PAYMENT', `made a ledger contribution of PKR ${amount}`);

        res.status(201).json({
            message: 'Contribution recorded',
            transaction: transaction
        });

    } catch (error) {
        console.error('Contribution Error:', error);
        res.status(500).json({ error: 'Transaction failed', detail: error.message });
    }
};
