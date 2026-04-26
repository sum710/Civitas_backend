const { supabaseAdmin } = require('../config/db');
const { logActivity } = require('../utils/activityLogger');

exports.makeContribution = async (req, res) => {
    try {
        const { committee_id, amount } = req.body;
        const user_id = req.user.id;

        if (!committee_id || !amount) {
            return res.status(400).json({ error: "committee_id and amount are required." });
        }

        // Call the Atomic Supabase Function (MUST CREATE IN SQL EDITOR FIRST)
        const { data, error: rpcError } = await supabaseAdmin
            .rpc('process_contribution', {
                p_committee_id: committee_id,
                p_user_id: user_id,
                p_amount: parseFloat(amount)
            });

        if (rpcError) {
            console.error("RPC Error:", rpcError);
            if (rpcError.message.includes('ALREADY_PAID_OR_NOT_DUE')) {
                return res.status(400).json({ error: "You have already made your contribution for this committee this month, or no payment is due." });
            }
            if (rpcError.message.includes('INSUFFICIENT_FUNDS')) {
                return res.status(400).json({ error: "Insufficient wallet balance." });
            }
            throw rpcError;
        }

        // Log the activity
        await logActivity(user_id, committee_id, 'PAYMENT', `made a contribution of PKR ${amount} (Atomic Processing)`);

        res.status(201).json({
            message: "Contribution successful",
            new_balance: data.new_balance
        });

    } catch (error) {
        console.error("Critical error in atomic contribution:", error);
        res.status(500).json({ error: "Atomic processing failed: " + error.message });
    }
};

exports.requestPayout = async (req, res) => {
    try {
        const { committee_id, payout_method, easypaisa_number } = req.body;
        const user_id = req.user.id;

        if (!committee_id) {
            return res.status(400).json({ error: "committee_id is required." });
        }
        
        if (!payout_method || !['easypaisa', 'daraz'].includes(payout_method)) {
            return res.status(400).json({ error: "Valid payout_method ('easypaisa' or 'daraz') is required." });
        }

        let account_details = '';
        if (payout_method === 'easypaisa') {
            if (!easypaisa_number) {
                return res.status(400).json({ error: "easypaisa_number is required for Easypaisa transfers." });
            }
            account_details = easypaisa_number;
        } else if (payout_method === 'daraz') {
            const crypto = require('crypto');
            account_details = 'DRZ-' + crypto.randomBytes(4).toString('hex').toUpperCase();
        }

        // 1. Fetch membership_id for this user in this committee
        const { data: membership, error: memError } = await supabaseAdmin
            .from('memberships')
            .select('id, has_received_payout')
            .eq('user_id', user_id)
            .eq('committee_id', committee_id)
            .single();

        if (memError || !membership) {
            return res.status(404).json({ error: "Membership not found. You must be a member to request a payout." });
        }

        const membership_id = membership.id;

        if (membership.has_received_payout) {
            return res.status(400).json({ error: "User has already received a payout for this committee." });
        }

        // 2. Check if user already claimed payout via membership_id (legacy fallback)
        const { data: existingPayout, error: payoutCheckError } = await supabaseAdmin
            .from('payouts')
            .select('id')
            .eq('membership_id', membership_id)
            .maybeSingle();

        if (payoutCheckError) throw payoutCheckError;
        if (existingPayout) {
            return res.status(400).json({ error: "Payout already claimed for this committee." });
        }

        // 3. Fetch the committee details
        const { data: committee, error: committeeError } = await supabaseAdmin
            .from('committees')
            .select('total_amount, status, created_by, start_date')
            .eq('id', committee_id)
            .single();
        
        if (committeeError || !committee) {
            return res.status(404).json({ error: "Committee not found." });
        }

        const now = new Date();
        const committeeStartDate = new Date(committee.start_date);
        
        // CHECK 1: First Month Admin-Only Restriction
        // Logic: If current month and year match committee start month and year, it's the first month.
        const isFirstMonth = now.getMonth() === committeeStartDate.getMonth() && 
                            now.getFullYear() === committeeStartDate.getFullYear();
        
        if (isFirstMonth && user_id !== committee.created_by) {
            return res.status(403).json({ error: "For the very first month, only the Admin can receive the payout." });
        }

        // CHECK 2: Monthly Payout Limit (Only one person per month)
        // Logic: Check if any payout was requested for this committee in the current month.
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        
        // Step 1: Get all membership IDs for this committee
        const { data: committeeMembers, error: membersError } = await supabaseAdmin
            .from('memberships')
            .select('id')
            .eq('committee_id', committee_id);

        if (membersError) {
            console.error("Error fetching committee members for payout check:", membersError);
            throw membersError;
        }

        const memberIds = committeeMembers.map(m => m.id);

        if (memberIds.length > 0) {
            // Step 2: Check payouts for those membership IDs in the current month
            const { data: monthlyPayouts, error: monthlyPayoutError } = await supabaseAdmin
                .from('payouts')
                .select('id')
                .in('membership_id', memberIds)
                .gte('requested_at', startOfMonth);

            if (monthlyPayoutError) {
                console.error("Error checking monthly payouts:", monthlyPayoutError);
                throw monthlyPayoutError;
            }

            if (monthlyPayouts && monthlyPayouts.length > 0) {
                return res.status(400).json({ error: "Only one person can receive a payout per month for this committee." });
            }
        }

        const totalAmount = parseFloat(committee.total_amount);

        // 4. Update User Wallet
        const { data: user, error: userError } = await supabaseAdmin
            .from('users')
            .select('wallet_balance')
            .eq('id', user_id)
            .single();
        
        if (userError) throw userError;
        
        const currentBalance = parseFloat(user.wallet_balance);
        const newBalance = currentBalance + totalAmount;

        const { error: updateError } = await supabaseAdmin
            .from('users')
            .update({ wallet_balance: newBalance })
            .eq('id', user_id);

        if (updateError) throw updateError;

        // 5. Insert Payout Record using membership_id
        const { data: payout, error: insertError } = await supabaseAdmin
            .from('payouts')
            .insert([{
                membership_id: membership_id,
                amount: totalAmount,
                payout_method: payout_method === 'daraz' ? 'DARAZ' : 'EASYPAISA',
                account_details: account_details,
                status: 'pending',
                requested_at: new Date().toISOString()
            }])
            .select()
            .single();

        if (insertError) {
             console.error("Payout record failed after balance update! Attempting to revert balance...");
             await supabaseAdmin.from('users').update({ wallet_balance: currentBalance }).eq('id', user_id);
             throw insertError;
        }

        // 6. Update has_received_payout in memberships table
        await supabaseAdmin
            .from('memberships')
            .update({ has_received_payout: true })
            .eq('id', membership_id);

        // Log the activity
        await logActivity(user_id, committee_id, 'PAYOUT', `requested a payout of PKR ${totalAmount}`);

        res.status(201).json({
            message: "Payout request successful",
            payout,
            new_balance: newBalance
        });

    } catch (error) {
        console.error("Error in requestPayout:", error);
        if (error.code === '23505') {
            return res.status(400).json({ error: "Payout already claimed for this committee." });
        }
        res.status(500).json({ error: "Internal server error: " + error.message });
    }
};
