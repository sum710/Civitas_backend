import React, { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import useVoice from '../hooks/useVoice';

const MakeContributionModal = ({ isOpen, onClose, onContributionSuccess, committee }) => {
    const { t, i18n } = useTranslation();
    const { speak } = useVoice();
    const [myCommittees, setMyCommittees] = useState([]);
    const [selectedCommitteeId, setSelectedCommitteeId] = useState('');
    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Fetch active committees when modal opens
    useEffect(() => {
        if (isOpen) {
            if (committee) {
                setSelectedCommitteeId(committee.id);
                const foundAmount = committee.slot_amount || committee.monthly_amount || committee.monthly_contribution || committee.contribution_amount || committee.contribution || 0;
                setAmount(foundAmount);
            } else {
                fetchCommittees();
                setSelectedCommitteeId('');
                setAmount('');
            }
            setError(null);
            speak(t('voice_guidance.contribution'), 'voice_guidance.contribution');
        }
    }, [isOpen, committee]);

    const fetchCommittees = async () => {
        try {
            const token = localStorage.getItem('token');
            // Fetch user's active committees from backend
            const response = await fetch('http://127.0.0.1:3000/api/committees/my', {
                headers: { Authorization: `Bearer ${token}` }
            });

            const data = await response.json();
            if (response.ok) {
                setMyCommittees(data);
            } else {
                console.error("Failed to fetch committees");
            }
        } catch (err) {
            console.error("Error connecting to server:", err);
        }
    };

    const handleCommitteeChange = (e) => {
        const selectedId = e.target.value;
        setSelectedCommitteeId(selectedId);

        // Automatically set amount based on the selected committee's needed contribution
        const selectedCommittee = myCommittees.find(c => String(c.id) === String(selectedId));
        console.log("Selected Committee Object:", selectedCommittee);
        
        if (selectedCommittee) {
            const foundAmount = selectedCommittee.slot_amount || selectedCommittee.monthly_amount || selectedCommittee.monthly_contribution || selectedCommittee.contribution_amount || selectedCommittee.contribution || 0;
            setAmount(foundAmount);
        } else {
            setAmount('');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (loading) return; // Immediate exit if already in flight
        setError(null);

        if (!selectedCommitteeId || !amount || parseFloat(amount) <= 0) {
            setError("Please select a valid committee. A valid contribution amount is required.");
            return;
        }

        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://127.0.0.1:3000/api/payments/contribute', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    committee_id: selectedCommitteeId,
                    amount: parseFloat(amount)
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Payment failed");
            }

            // Success: Close modal and refresh Dashboard data
            onContributionSuccess(data.new_balance); // Pass new balance up to dashboard
            onClose();

        } catch (err) {
            let translatedError = err.message;
            if (i18n.language === 'ur') {
                if (err.message.includes('already made your contribution')) {
                    translatedError = 'آپ نے اس ماہ اس کمیٹی کے لیے پہلے ہی ادائیگی کر دی ہے۔';
                } else if (err.message.includes('Insufficient wallet balance')) {
                    translatedError = 'آپ کے والیٹ میں ناکافی بیلنس ہے۔';
                } else if (err.message.includes('Payment failed')) {
                    translatedError = 'ادائیگی ناکام ہوگئی';
                }
            }
            setError(translatedError);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <button
                    onClick={onClose}
                    className="close-btn"
                >
                    <X size={20} />
                </button>

                <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: 'var(--primary-blue)' }} dir={i18n.language === 'ur' ? 'rtl' : 'ltr'}>{i18n.language === 'ur' ? 'شراکت ادا کریں' : 'Make a Contribution'}</h2>

                {error && (
                    <div style={{ padding: '10px', backgroundColor: '#fee2e2', color: '#991b1b', borderRadius: '6px', marginBottom: '15px', fontSize: '0.9rem' }} dir={i18n.language === 'ur' ? 'rtl' : 'ltr'}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }} dir={i18n.language === 'ur' ? 'rtl' : 'ltr'}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label>{i18n.language === 'ur' ? 'کمیٹی منتخب کریں' : 'Select Committee'}</label>
                        {committee ? (
                            <input 
                                type="text"
                                value={i18n.language === 'ur' ? `میں شراکت: ${committee.title || committee.name}` : `Contributing to: ${committee.title || committee.name}`}
                                readOnly
                                style={{ backgroundColor: '#f1f5f9', color: '#64748b', cursor: 'not-allowed', width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}
                            />
                        ) : (
                            <select
                                value={selectedCommitteeId}
                                onChange={handleCommitteeChange}
                                required
                            >
                                <option value="" disabled>{i18n.language === 'ur' ? '-- کمیٹی منتخب کریں --' : '-- Select a committee --'}</option>
                                {myCommittees.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.title || c.name} ({i18n.language === 'ur' ? 'کل رقم: PKR' : 'Pot: PKR'} {c.total_amount})
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>

                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label>{i18n.language === 'ur' ? 'مطلوبہ رقم (PKR)' : 'Required Amount (PKR)'}</label>
                        <input
                            type="number"
                            value={amount > 0 ? amount : ''}
                            readOnly
                            placeholder={i18n.language === 'ur' ? 'خودکار حساب شدہ' : 'Auto-calculated'}
                            style={{ backgroundColor: '#f1f5f9', color: '#64748b', cursor: 'not-allowed' }}
                        />
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-gray)', marginTop: '5px' }}>
                            {i18n.language === 'ur' ? 'یہ رقم آپ کے والیٹ بیلنس سے کاٹ لی جائے گی۔' : 'This amount will be deducted from your Wallet Balance.'}
                        </p>
                    </div>

                    <div className="modal-footer" style={{ borderTop: 'none', paddingTop: 0, marginTop: '1rem' }}>
                        <button
                            type="submit"
                            disabled={loading || !selectedCommitteeId}
                            className="btn btn-primary w-full"
                        >
                            {loading ? (
                                <>
                                    <Loader2 size={20} className="animate-spin" style={{ marginRight: '8px' }} />
                                    {i18n.language === 'ur' ? 'پروسیسنگ...' : 'Processing...'}
                                </>
                            ) : (i18n.language === 'ur' ? 'ادائیگی کی تصدیق کریں' : 'Confirm Payment')}
                        </button>
                        <button type="button" className="btn btn-text md:hidden" onClick={onClose}>
                            {t('common.cancel')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default MakeContributionModal;
