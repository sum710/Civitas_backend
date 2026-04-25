const { supabaseAdmin } = require('../config/db');

// Function to fetch the logged-in user's wallet balance
const getWalletBalance = async (req, res) => {
    try {
        const userId = req.user.id;

        const { data, error } = await supabaseAdmin
            .from('users')
            .select('wallet_balance')
            .eq('id', userId)
            .single();

        if (error || !data) {
            console.error("Error fetching balance from Supabase:", error);
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const balance = parseFloat(data.wallet_balance) || 0;

        res.json({
            success: true,
            balance: balance
        });

    } catch (error) {
        console.error("Error fetching wallet balance:", error);
        res.status(500).json({ success: false, message: "Server error while fetching wallet balance" });
    }
};

// Function to add test funds to the logged-in user's wallet
const depositFunds = async (req, res) => {
    try {
        const userId = req.user.id;
        const { amount } = req.body;

        if (!amount || amount <= 0) {
            return res.status(400).json({ success: false, message: "Invalid amount" });
        }

        // 1. Fetch current balance
        const { data, error } = await supabaseAdmin
            .from('users')
            .select('wallet_balance')
            .eq('id', userId)
            .single();

        if (error || !data) throw error;

        const currentBalance = parseFloat(data.wallet_balance) || 0;
        const newBalance = currentBalance + parseFloat(amount);

        // 2. Update balance
        const { error: updateError } = await supabaseAdmin
            .from('users')
            .update({ wallet_balance: newBalance })
            .eq('id', userId);

        if (updateError) throw updateError;

        res.json({
            success: true,
            balance: newBalance,
            message: `Successfully deposited PKR ${amount}`
        });

    } catch (error) {
        console.error("Error depositing funds:", error);
        res.status(500).json({ success: false, message: "Server error during deposit" });
    }
};

module.exports = {
    getWalletBalance,
    depositFunds
};
