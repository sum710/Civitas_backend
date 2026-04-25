const { supabaseAdmin } = require('../config/db');

/**
 * Execute Payout for a Committee Slot
 * Route: POST /api/payout/execute
 */
exports.executePayout = async (req, res) => {
    const { committee_id, user_id, payout_mode, voucher_code } = req.body;

    try {
        // 1. Get Committee Info
        const { data: committee, error: commError } = await supabaseAdmin
            .from('committees')
            .select('*')
            .eq('id', committee_id)
            .single();

        if (commError || !committee) throw new Error('Committee not found');

        let finalAmount = parseFloat(committee.total_amount);
        let description = 'Standard Payout';

        // 2. Logic for Dual-Payout
        if (payout_mode === 'PRODUCT') {
            description = `Product Voucher: ${voucher_code || 'V-DEFAULT'}`;
        }

        // 3. Find Membership
        const { data: membership, error: memError } = await supabaseAdmin
            .from('memberships')
            .select('id')
            .eq('user_id', user_id)
            .eq('committee_id', committee_id)
            .single();

        if (memError || !membership) throw new Error('Member not found');
        const memberId = membership.id;

        // 4. Record Payout Transaction
        const { error: transError } = await supabaseAdmin
            .from('transactions')
            .insert({
                membership_id: memberId,
                amount: finalAmount,
                type: 'PAYOUT',
                method: payout_mode,
                description: description
            });

        if (transError) throw transError;

        res.json({ message: 'Payout executed', amount: finalAmount, mode: payout_mode });

    } catch (error) {
        console.error('Payout Error:', error);
        res.status(500).json({ error: error.message });
    }
};
