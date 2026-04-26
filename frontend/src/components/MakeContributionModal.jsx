import React, { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import useVoice from '../hooks/useVoice';
import apiRequest from '../services/api';

const MakeContributionModal = ({ isOpen, onClose, onContributionSuccess, committee }) => {
    const { t, i18n } = useTranslation();
    const { speak } = useVoice();
    const [myCommittees, setMyCommittees] = useState([]);
    const [selectedCommitteeId, setSelectedCommitteeId] = useState('');
    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState(false);
    const [isInitialLoading, setIsInitialLoading] = useState(true);
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
            // Fetch user's active committees from backend
            const response = await apiRequest('/committees/my');

            const data = await response.json();
            console.log("Modals - Fetched My Committees:", data);
            if (response.ok) {
                const committeeList = Array.isArray(data) ? data : [];
                setMyCommittees(committeeList);
                
                // Auto-select if only one committee exists
                if (committeeList.length === 1) {
                    setSelectedCommitteeId(committeeList[0].id);
                    const selAmount = committeeList[0].slot_amount || committeeList[0].monthly_amount || committeeList[0].monthly_contribution || committeeList[0].contribution_amount || committeeList[0].contribution || 0;
                    setAmount(selAmount);
                }
            } else {
                console.error("Failed to fetch committees", data);
                setError(t('common.error_fetching_committees', 'Failed to load your committees. Please try logging out and in again.'));
            }
        } catch (err) {
            console.error("Error connecting to server:", err);
        } finally {
            setIsInitialLoading(false);
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
            const response = await apiRequest('/payments/contribute', {
                method: 'POST',
                body: JSON.stringify({
                    committee_id: selectedCommitteeId,
                    amount: parseFloat(amount),
                    month: new Date().toLocaleString(i18n.language === 'ur' ? 'ur-PK' : 'en-US', { month: 'long' })
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
        <div 
            className="modal-overlay"
            style={{ zIndex: 100000 }}
        >
            <div className="modal-content" style={{ zIndex: 100001 }}>
                <button
                    onClick={onClose}
                    className={`absolute top-4 ${i18n.language === 'ur' ? 'left-4' : 'right-4'} p-2 rounded-full hover:bg-slate-100 transition-all z-50 bg-white/50 backdrop-blur-sm`}
                    aria-label="Close"
                >
                    <X size={20} className="text-slate-500" />
                </button>

                <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: 'var(--primary-blue)' }} className={`${i18n.language === 'ur' ? 'pl-12 text-right' : 'pr-12 text-left'}`} dir={i18n.language === 'ur' ? 'rtl' : 'ltr'}>{i18n.language === 'ur' ? 'شراکت ادا کریں' : 'Make a Contribution'}</h2>

                {error && (
                    <div style={{ padding: '12px', backgroundColor: '#fee2e2', color: '#991b1b', borderRadius: '8px', marginBottom: '15px', fontSize: '0.9rem', border: '1px solid #fecaca' }} dir={i18n.language === 'ur' ? 'rtl' : 'ltr'}>
                        {error}
                        <button onClick={fetchCommittees} style={{ display: 'block', marginTop: '8px', color: '#3b82f6', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                            {i18n.language === 'ur' ? 'دوبارہ کوشش کریں' : 'Try Again'}
                        </button>
                    </div>
                )}

                {(!committee && myCommittees.length === 0 && !isInitialLoading) && (
                    <div style={{ padding: '15px', backgroundColor: '#eff6ff', color: '#1e40af', borderRadius: '8px', marginBottom: '20px', textAlign: 'center', border: '1px solid #bfdbfe' }}>
                        <p style={{ fontWeight: 'bold', marginBottom: '8px' }}>
                            {i18n.language === 'ur' ? 'آپ نے ابھی تک کسی کمیٹی میں شمولیت اختیار نہیں کی ہے۔' : "You haven't joined any circles yet!"}
                        </p>
                        <p style={{ fontSize: '0.85rem', marginBottom: '12px' }}>
                            {i18n.language === 'ur' ? 'شراکت ادا کرنے کے لیے پہلے ایک کمیٹی جوائن کریں۔' : 'Join a committee from the Explore tab to start contributing.'}
                        </p>
                        <Link to="/committees" onClick={onClose} className="btn btn-primary" style={{ display: 'inline-block', padding: '8px 16px', fontSize: '0.9rem' }}>
                            {i18n.language === 'ur' ? 'کمیٹیاں تلاش کریں' : 'Explore Circles'}
                        </Link>
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
                                style={{ border: (!selectedCommitteeId && !committee) ? '2px solid #3b82f6' : '1px solid #e2e8f0' }}
                            >
                                <option value="" disabled>{i18n.language === 'ur' ? '-- کمیٹی منتخب کریں --' : '-- Select a committee --'}</option>
                                {myCommittees.length === 0 ? (
                                    <option value="" disabled>{i18n.language === 'ur' ? 'کوئی فعال کمیٹی نہیں ملی' : 'No active committees found'}</option>
                                ) : (
                                    myCommittees.map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {c.title || c.name} ({i18n.language === 'ur' ? 'کل رقم: PKR' : 'Pot: PKR'} {c.total_amount})
                                        </option>
                                    ))
                                )}
                            </select>
                        )}
                        {!committee && myCommittees.length === 0 && !isInitialLoading && (
                            <p style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '8px' }}>
                                {i18n.language === 'ur' ? 'آپ نے ابھی تک کسی کمیٹی میں شمولیت اختیار نہیں کی ہے۔' : "You haven't joined any committees yet."}
                                <Link to="/committees" onClick={onClose} style={{ marginLeft: '5px', textDecoration: 'underline' }}>{i18n.language === 'ur' ? 'کمیٹیاں تلاش کریں' : 'Explore committees'}</Link>
                            </p>
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
                            disabled={loading}
                            className={`btn w-full ${loading ? 'opacity-50 cursor-not-allowed' : 'btn-primary'}`}
                            style={{
                                backgroundColor: 'var(--primary-blue)',
                                color: 'white',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                            }}
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
