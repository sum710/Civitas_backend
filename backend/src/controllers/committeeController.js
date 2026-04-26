const { supabaseAdmin } = require('../config/db');
const { logActivity } = require('../utils/activityLogger');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize AI for translation
const apiKey = process.env.GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(apiKey);

// Helper to translate text using Gemini
const translateText = async (text, targetLang = 'Urdu') => {
    if (!apiKey || apiKey === 'your_actual_api_key_here') return text;
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const prompt = `Translate this phrase into ${targetLang}. Return ONLY the translated string, nothing else. Text: "${text}"`;
        const result = await model.generateContent(prompt);
        return result.response.text().trim();
    } catch (err) {
        console.error("Translation failed:", err);
        return text;
    }
};

// Helper to generate monthly ledger rows for a member
const generateLedgerRows = async (committeeId, userId, monthlyAmount, durationMonths, startDateStr) => {
    try {
        const startDate = new Date(startDateStr);
        const payments = [];

        for (let i = 0; i < durationMonths; i++) {
            const dueDate = new Date(startDate);
            dueDate.setMonth(startDate.getMonth() + i);

            payments.push({
                committee_id: committeeId,
                user_id: userId,
                amount_due: monthlyAmount,
                due_date: dueDate.toISOString(),
                status: 'Pending'
            });
        }

        const { error } = await supabaseAdmin
            .from('payments')
            .insert(payments);

        if (error) throw error;
        console.log(`Generated ${durationMonths} ledger rows for User ${userId}`);
    } catch (err) {
        console.error("Ledger generation failed:", err);
    }
};

// Get all committees
exports.getAllCommittees = async (req, res) => {
    try {
        const userId = req.user ? req.user.id : null;
        let myCommitteeIds = [];

        if (userId) {
            const { data: memberData } = await supabaseAdmin
                .from('memberships')
                .select('committee_id')
                .eq('user_id', userId);
            if (memberData) {
                myCommitteeIds = memberData.map(m => m.committee_id);
            }
        }

        // Fetch user role to handle Admin-specific logic
        let isAdmin = false;
        if (userId) {
            const { data: userRecord } = await supabaseAdmin
                .from('users')
                .select('role')
                .eq('id', userId)
                .single();
            if (userRecord && userRecord.role === 'committee leader') {
                isAdmin = true;
            }
        }

        let query = supabaseAdmin
            .from('committees')
            .select('*');

        // ADMINS: Should see ALL public committees for management, plus anything they are a member of.
        // MEMBERS: Should see all public committees plus anything they joined.
        if (myCommitteeIds.length > 0) {
            // Fix: Quoting UUIDs for Postgres .or() syntax
            const idList = myCommitteeIds.map(id => `"${id}"`).join(',');
            query = query.or(`visibility.eq.public,id.in.(${idList})`);
        } else {
            query = query.eq('visibility', 'public');
        }

        const { data, error } = await query.order('id', { ascending: true });

        if (error) throw error;
        
        const mappedData = data.map(item => ({
             ...item,
             title: item.title || item.name,
             max_members: item.max_members || item.total_slots || item.duration_months || 10,
             slot_amount: item.slot_amount || item.contribution_amount,
             total_amount: item.total_amount || item.payout_amount,
             created_by: item.created_by || item.leader_id
        }));

        res.status(200).json(mappedData);
    } catch (err) {
        console.error('Error fetching committees:', err);
        res.status(500).json({ message: 'Server error fetching committees' });
    }
};

// Create a new committee with AI-powered name translation
exports.createCommittee = async (req, res) => {
    const { name, visibility, monthly_amount, total_pot, members, max_members, description, start_date } = req.body;

    if (!name || !monthly_amount || !total_pot) {
        return res.status(400).json({ message: 'Please provide name, monthly amount, and total pot.' });
    }

    const fixedVisibility = visibility ? visibility.toLowerCase() : 'public';

    if (fixedVisibility === 'public') {
        const allowedAmounts = [5000, 10000, 25000, 50000, 100000];
        if (!allowedAmounts.includes(Number(monthly_amount))) {
            return res.status(400).json({ message: 'Public committees must use a preset denomination (5000, 10000, 25000, 50000, 100000).' });
        }
    }

    try {
        const { data: userRecord, error: userError } = await supabaseAdmin
            .from('users')
            .select('role')
            .eq('id', req.user.id)
            .single();

        if (userError || !userRecord || userRecord.role !== 'committee leader') {
            return res.status(403).json({ 
                message: 'Forbidden: Only committee leaders can create committees.'
            });
        }
        
        // AI TRANSLATION LOGIC
        // We store bilingual data in the format: "English | Urdu"
        const TranslatedUrduName = await translateText(name, 'Urdu');
        const bilingualTitle = `${name} | ${TranslatedUrduName}`;
        
        const TranslatedUrduDesc = description ? await translateText(description, 'Urdu') : '';
        const bilingualDesc = description ? `${description} | ${TranslatedUrduDesc}` : '';

        const safeStatus = 'PENDING';

        let inviteCode = null;
        if (fixedVisibility === 'private') {
            const crypto = require('crypto');
            inviteCode = crypto.randomBytes(3).toString('hex').toUpperCase();
        }

        const exactSchemaPayload = {
            title: bilingualTitle,
            slot_amount: monthly_amount,
            total_amount: total_pot,
            duration_months: max_members || 10,
            start_date: start_date || new Date().toISOString(),
            status: safeStatus,
            created_by: req.user.id,
            description: bilingualDesc,
            visibility: fixedVisibility,
            invite_code: inviteCode
        };

        const { data: newCommittee, error: committeeError } = await supabaseAdmin
            .from('committees')
            .insert([exactSchemaPayload])
            .select()
            .single();

        if (committeeError) throw committeeError;

        await supabaseAdmin
            .from('memberships')
            .insert([{
                committee_id: newCommittee.id,
                user_id: req.user.id,
                slot_number: 1,
                status: 'ACTIVE'
            }]);

        await generateLedgerRows(
            newCommittee.id, 
            req.user.id, 
            newCommittee.slot_amount, 
            newCommittee.duration_months, 
            newCommittee.start_date
        );

        await logActivity(req.user.id, newCommittee.id, 'SYSTEM', 'created the committee');

        // Mapped response to ensure frontend consistency
        const mappedCommittee = {
            ...newCommittee,
            title: newCommittee.title || newCommittee.name,
            max_members: newCommittee.max_members || newCommittee.total_slots || newCommittee.duration_months || 10,
            slot_amount: newCommittee.slot_amount || newCommittee.contribution_amount,
            total_amount: newCommittee.total_amount || newCommittee.payout_amount,
            created_by: newCommittee.created_by || newCommittee.leader_id
        };

        res.status(201).json(mappedCommittee);

    } catch (err) {
        console.error('Error creating committee:', err);
        res.status(500).json({
            message: 'Server error creating committee',
            error: err.message
        });
    }
};

exports.joinCommittee = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    try {
        const { data: existingMember, error: memberCheckError } = await supabaseAdmin
            .from('memberships')
            .select('*')
            .eq('committee_id', id)
            .eq('user_id', userId)
            .maybeSingle();

        if (memberCheckError) throw memberCheckError;
        if (existingMember) {
            return res.status(400).json({ message: 'You are already a member.' });
        }

        const { data: committee, error: committeeError } = await supabaseAdmin
            .from('committees')
            .select('*')
            .eq('id', id)
            .single();

        if (committeeError || !committee) {
            return res.status(404).json({ message: 'Committee not found' });
        }

        const { count, error: countError } = await supabaseAdmin
            .from('memberships')
            .select('*', { count: 'exact', head: true })
            .eq('committee_id', id);

        if (countError) throw countError;

        const maxMembers = committee.max_members || committee.duration_months || 10;
        if (count >= maxMembers) {
            return res.status(400).json({ message: 'This committee has reached its maximum capacity.' });
        }

        const { error: joinError } = await supabaseAdmin
            .from('memberships')
            .insert([{
                committee_id: id,
                user_id: userId,
                slot_number: null,
                status: 'ACTIVE'
            }]);

        if (joinError) throw joinError;

        await generateLedgerRows(
            id, 
            userId, 
            committee.slot_amount, 
            committee.duration_months, 
            committee.start_date
        );

        const newMemberCount = count + 1;
        let newStatus = committee.status;
        if (newMemberCount === committee.max_members && committee.status === 'PENDING') {
            newStatus = 'ACTIVE';
        }

        const { error: updateError } = await supabaseAdmin
            .from('committees')
            .update({ status: newStatus })
            .eq('id', id);

        if (updateError) throw updateError;

        await logActivity(userId, id, 'JOIN', 'joined the committee');

        res.status(200).json({ message: 'Successfully joined committee', newStatus, newMemberCount });
    } catch (err) {
        console.error('Error joining committee:', err);
        res.status(500).json({ message: 'Server error joining committee' });
    }
};

exports.getUserCommittees = async (req, res) => {
    try {
        const userId = req.user.id;
        const { data: relationships, error: relError } = await supabaseAdmin
            .from('memberships')
            .select('committee_id')
            .eq('user_id', userId);

        if (relError) throw relError;
        const committeeIds = [...new Set(relationships.map(r => r.committee_id))];
        
        if (committeeIds.length === 0) {
            return res.status(200).json([]);
        }

        let query = supabaseAdmin
            .from('committees')
            .select('*');

        if (committeeIds.length > 0) {
            const idList = committeeIds.map(id => `"${id}"`).join(',');
            query = query.or(`created_by.eq."${userId}",id.in.(${idList})`);
        } else {
            query = query.eq('created_by', userId);
        }

        const { data: committees, error: commError } = await query.order('id', { ascending: true });

        if (commError) throw commError;
        
        const mappedData = committees.map(item => ({
             ...item,
             title: item.title || item.name,
             max_members: item.max_members || item.total_slots || item.duration_months || 10,
             slot_amount: item.slot_amount || item.contribution_amount,
             total_amount: item.total_amount || item.payout_amount,
             created_by: item.created_by || item.leader_id
        }));

        res.status(200).json(mappedData);
    } catch (err) {
        console.error('Error fetching user committees:', err);
        res.status(500).json({ message: 'Server error fetching user committees' });
    }
};

exports.getCommitteeDetails = async (req, res) => {
    try {
        const { id } = req.params;

        const { data: committee, error: committeeError } = await supabaseAdmin
            .from('committees')
            .select('*')
            .eq('id', id)
            .single();

        if (committeeError || !committee) {
            return res.status(404).json({ message: 'Committee not found' });
        }

        const { data: members, error: membersError } = await supabaseAdmin
            .from('memberships')
            .select(`
                id,
                slot_number, 
                status, 
                has_received_payout,
                user:users (id, full_name, email, role),
                payouts (payout_method, account_details)
            `)
            .eq('committee_id', id)
            .order('slot_number', { ascending: true, nullsFirst: false });

        if (membersError) throw membersError;

        // FETCH CURRENT MONTH PAYMENT STATUS
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

        const { data: monthPayments, error: payError } = await supabaseAdmin
            .from('payments')
            .select('user_id, status')
            .eq('committee_id', id)
            .gte('due_date', startOfMonth)
            .lte('due_date', endOfMonth);

        const paymentMap = {};
        if (monthPayments) {
            monthPayments.forEach(p => {
                paymentMap[p.user_id] = p.status;
            });
        }

        const formattedMembers = members.map(m => ({
            id: m.id,
            slot_number: m.slot_number,
            status: m.status,
            has_received_payout: m.has_received_payout,
            user_id: m.user ? m.user.id : null,
            name: m.user ? m.user.full_name : 'Unknown User',
            email: m.user ? m.user.email : 'No Email',
            role: m.user ? m.user.role : 'member',
            is_paid_this_month: paymentMap[m.user ? m.user.id : null] === 'Paid',
            payout: m.payouts && m.payouts.length > 0 ? m.payouts[0] : null
        }));

        const mappedCommittee = {
             ...committee,
             title: committee.title || committee.name,
             max_members: committee.max_members || committee.total_slots || committee.duration_months || 10,
             slot_amount: committee.slot_amount || committee.contribution_amount,
             total_amount: committee.total_amount || committee.payout_amount,
             created_by: committee.created_by || committee.leader_id
        };

        res.status(200).json({ committee: mappedCommittee, members: formattedMembers });
    } catch (err) {
        console.error('Error fetching committee details:', err);
        res.status(500).json({ message: 'Server error fetching committee details' });
    }
};

exports.drawNextWinner = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    try {
        const { data: committee, error: commError } = await supabaseAdmin
            .from('committees')
            .select('*')
            .eq('id', id)
            .single();

        if (commError || !committee) {
            return res.status(404).json({ message: 'Committee not found' });
        }

        const { data: userRecord, error: userError } = await supabaseAdmin
            .from('users')
            .select('role')
            .eq('id', userId)
            .single();

        if (userError || !userRecord || userRecord.role !== 'committee leader') {
            return res.status(403).json({ 
                message: 'Forbidden: Only users with the committee leader role can draw winners.'
            });
        }

        if (committee.created_by !== userId) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        const { data: eligibleMembers, error: eligibleError } = await supabaseAdmin
            .from('memberships')
            .select('id, user_id, user:users(full_name, email)')
            .eq('committee_id', id)
            .is('slot_number', null)
            .eq('status', 'ACTIVE')
            .neq('user_id', committee.created_by);

        if (eligibleError) throw eligibleError;

        if (!eligibleMembers || eligibleMembers.length === 0) {
            return res.status(400).json({ message: 'No eligible members found.' });
        }

        const randomIndex = Math.floor(Math.random() * eligibleMembers.length);
        const winner = eligibleMembers[randomIndex];

        const { data: slotData, error: slotError } = await supabaseAdmin
            .from('memberships')
            .select('slot_number')
            .eq('committee_id', id);

        if (slotError) throw slotError;
        
        let maxAssignedSlot = 1;
        if (slotData && slotData.length > 0) {
            const assignedSlots = slotData.map(s => s.slot_number).filter(n => typeof n === 'number');
            if (assignedSlots.length > 0) {
                maxAssignedSlot = Math.max(...assignedSlots);
            }
        }
        const nextAvailableSlot = maxAssignedSlot + 1;

        const { error: updateError } = await supabaseAdmin
            .from('memberships')
            .update({ slot_number: nextAvailableSlot })
            .eq('committee_id', id)
            .eq('user_id', winner.user_id);

        if (updateError) throw updateError;

        await logActivity(userId, id, 'SPIN', `drew the next winner: ${winner.user.full_name}`);

        res.status(200).json({
            message: 'Winner drawn successfully',
            winner: {
                user_id: winner.user_id,
                name: winner.user.full_name,
                email: winner.user.email,
                slot_number: nextAvailableSlot
            }
        });
    } catch (err) {
        console.error('Error drawing next winner:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.joinWithCode = async (req, res) => {
    const { invite_code } = req.body;
    const userId = req.user.id;

    try {
        const { data: committee, error: commError } = await supabaseAdmin
            .from('committees')
            .select('*')
            .eq('invite_code', invite_code)
            .single();

        if (commError || !committee) {
            return res.status(404).json({ message: 'Invalid code.' });
        }

        const id = committee.id;
        const { data: existingMember, error: memberCheckError } = await supabaseAdmin
            .from('memberships')
            .select('*')
            .eq('committee_id', id)
            .eq('user_id', userId)
            .maybeSingle();

        if (memberCheckError) throw memberCheckError;
        if (existingMember) return res.status(400).json({ message: 'Already a member.' });

        const { count, error: countError } = await supabaseAdmin
            .from('memberships')
            .select('*', { count: 'exact', head: true })
            .eq('committee_id', id);

        if (countError) throw countError;
        const maxMembers = committee.max_members || committee.duration_months || 10;
        if (count >= maxMembers) return res.status(400).json({ message: 'This committee has reached its maximum capacity.' });

        await supabaseAdmin
            .from('memberships')
            .insert([{
                committee_id: id,
                user_id: userId,
                slot_number: null,
                status: 'ACTIVE'
            }]);

        const newMemberCount = count + 1;
        let newStatus = committee.status;
        if (newMemberCount === committee.max_members && committee.status === 'PENDING') {
            newStatus = 'ACTIVE';
        }

        await supabaseAdmin
            .from('committees')
            .update({ status: newStatus })
            .eq('id', id);

        await logActivity(userId, id, 'JOIN', 'joined the private committee');
        res.status(200).json({ message: 'Success', newStatus, newMemberCount });
    } catch (err) {
        console.error('Error joining private committee:', err);
        res.status(500).json({ message: 'Server error' });
    }
};
