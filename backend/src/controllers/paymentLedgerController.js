const { supabaseAdmin } = require('../config/db');
const { logActivity } = require('../utils/activityLogger');

// 1. Get Ledger: Fetch all payments for a specific committee
exports.getLedger = async (req, res) => {
    try {
        const { committee_id } = req.params;

        const { data: payments, error } = await supabaseAdmin
            .from('payments')
            .select(`
                *,
                user:users ( name:full_name, email ) 
            `)
            .eq('committee_id', committee_id)
            .order('due_date', { ascending: false });

        if (error) throw error;

        res.status(200).json({ success: true, payments });
    } catch (error) {
        console.error("Error fetching ledger:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// 2. Process Payment & Update Trust Score
exports.processPayment = async (req, res) => {
    try {
        const { payment_id } = req.body;

        const { data: payment, error: fetchError } = await supabaseAdmin
            .from('payments')
            .select('*')
            .eq('id', payment_id)
            .single();

        if (fetchError || !payment) {
            return res.status(404).json({ success: false, error: "Payment not found." });
        }

        const currentDate = new Date();
        const dueDate = new Date(payment.due_date);
        currentDate.setHours(0,0,0,0);
        dueDate.setHours(0,0,0,0);

        let status = 'Paid';
        let scoreChange = 5;

        // If paid after due date, penalize score
        if (currentDate > dueDate) {
            status = 'Late';
            scoreChange = -15;
        }

        // Update Payment
        const { error: updateError } = await supabaseAdmin
            .from('payments')
            .update({ status, paid_date: new Date().toISOString() })
            .eq('id', payment_id);

        if (updateError) throw updateError;

        // Update User Trust Score
        const { data: user, error: userError } = await supabaseAdmin
            .from('users')
            .select('trust_score')
            .eq('id', payment.user_id)
            .single();

        if (userError) throw userError;

        const newScore = (user.trust_score || 700) + scoreChange;
        await supabaseAdmin.from('users').update({ trust_score: newScore }).eq('id', payment.user_id);

        // Include user_id from token if possible, but since admin processes it or user pays:
        const requestUser = req.user?.id || payment.user_id;

        await logActivity(requestUser, payment.committee_id, 'PAYMENT', `marked payment as ${status}`);

        res.status(200).json({
            success: true,
            message: `Payment marked as ${status}. Trust score updated by ${scoreChange} points.`,
            new_trust_score: newScore
        });

    } catch (error) {
        console.error("Error processing payment:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// 3. Send Reminders (Simulated via Console)
exports.sendReminders = async (req, res) => {
    try {
        const { committee_id } = req.body;

        const { data: pendingPayments, error } = await supabaseAdmin
            .from('payments')
            .select(`*, user:users ( email )`)
            .eq('committee_id', committee_id)
            .eq('status', 'Pending');

        if (error) throw error;

        // Simulate sending emails
        pendingPayments.forEach(payment => {
            console.log(`[SIMULATED EMAIL SENT] To: ${payment.user.email} | Subject: Reminder - Payment Due | Amount: PKR ${payment.amount_due} | Due Date: ${payment.due_date}`);
        });

        // Log the activity
        await logActivity(req.user.id, committee_id, 'REMINDER', `sent ${pendingPayments.length} payment reminders`);

        res.status(200).json({
            success: true,
            message: `Successfully sent ${pendingPayments.length} reminders.`
        });

    } catch (error) {
        console.error("Error sending reminders:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};
