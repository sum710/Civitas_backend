const { supabaseAdmin } = require('../config/db');

/**
 * Calculate Trust Score for a User
 * Logic: Base 75 + (On-Time Payments * 2) + (Completed Committees * 10)
 * Max: 100, Min: 0
 */
exports.calculateTrustScore = async (userId) => {
    try {
        // 1. Fetch count of successful payments ('Paid' status in payments table)
        const { count: paidCount, error: paidError } = await supabaseAdmin
            .from('payments')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('status', 'Paid');

        if (paidError) throw paidError;

        // 2. Fetch count of completed memberships
        const { count: completedCount, error: completedError } = await supabaseAdmin
            .from('memberships')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('status', 'COMPLETED');

        if (completedError) throw completedError;

        // 3. Calculation Logic
        const baseScore = 75;
        const paymentBonus = (paidCount || 0) * 2;
        const completionBonus = (completedCount || 0) * 10;
        
        let score = baseScore + paymentBonus + completionBonus;

        // Ensure score stays within 0-100 range
        score = Math.max(0, Math.min(100, score));

        return score;
    } catch (error) {
        console.error("Critical Engine Error (Trust Score):", error);
        return 75; // Safe default
    }
};

/**
 * API Handler for fetching and updating trust score
 */
exports.getTrustScore = async (req, res) => {
    try {
        const { uid } = req.user; // Firebase UID from Auth middleware

        // 1. Resolve Supabase ID
        const { data: userData, error: userError } = await supabaseAdmin
            .from('users')
            .select('id')
            .eq('firebase_uid', uid)
            .single();

        if (userError || !userData) {
            return res.status(404).json({ error: 'User mapping not found' });
        }

        const userId = userData.id;

        // 2. Run Dynamic Calculation
        const dynamicScore = await exports.calculateTrustScore(userId);

        // 3. Update DB for persistence
        const { error: updateError } = await supabaseAdmin
            .from('users')
            .update({ trust_score: dynamicScore })
            .eq('id', userId);

        if (updateError) {
            console.error("DB Persistence Error (Trust Score):", updateError);
        }

        return res.json({ 
            success: true,
            trust_score: dynamicScore 
        });
    } catch (error) {
        console.error("Trust Score API Error:", error);
        res.status(500).json({ error: 'Server failure calculating trust score' });
    }
};
