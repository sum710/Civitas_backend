const { supabaseAdmin } = require('../config/db');

/**
 * Log an activity to the database
 * 
 * @param {string} userId - ID of the user performing the action
 * @param {string} committeeId - (Optional) ID of the committee associated with the action
 * @param {string} actionType - E.g., 'PAYMENT', 'REMINDER', 'PAYOUT', 'SYSTEM', 'SPIN'
 * @param {string} description - Human-readable message (e.g., 'made a contribution')
 */
exports.logActivity = async (userId, committeeId, actionType, description) => {
    try {
        const { error } = await supabaseAdmin
            .from('activity_logs')
            .insert([{
                user_id: userId,
                committee_id: committeeId || null,
                action_type: actionType,
                description: description
            }]);

        if (error) {
            console.error("Failed to insert activity log:", error);
        }
    } catch (err) {
        console.error("Exception in logActivity util:", err);
    }
};
