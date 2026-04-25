const { supabaseAdmin } = require('../config/db');

exports.getCommitteeLogs = async (req, res) => {
    try {
        const { committeeId } = req.params;
        const userId = req.user.id;

        // Verify user is a member of this committee
        const { data: membership, error: memError } = await supabaseAdmin
            .from('memberships')
            .select('id')
            .eq('committee_id', committeeId)
            .eq('user_id', userId)
            .maybeSingle();

        if (memError || !membership) {
            return res.status(403).json({ success: false, error: 'Access denied: You must be a member to view the activity trail' });
        }

        // Fetch top 20 newest logs
        const { data: logs, error } = await supabaseAdmin
            .from('activity_logs')
            .select(`
                *,
                user:users ( full_name )
            `)
            .eq('committee_id', committeeId)
            .order('created_at', { ascending: false })
            .limit(20);

        if (error) throw error;

        res.status(200).json({ success: true, logs });
    } catch (error) {
        console.error("Error fetching logs:", error);
        res.status(500).json({ success: false, error: 'Failed to fetch activity logs' });
    }
};
