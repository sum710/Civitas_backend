import React, { useState, useEffect } from 'react';
import { X, Loader2, CheckCircle, Gift, Copy } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import apiRequest from '../services/api';
import PayoutVoucher from './PayoutVoucher';

const RequestPayoutModal = ({ isOpen, onClose, onPayoutSuccess, committee }) => {
    const { user } = useAuth();
    const { i18n } = useTranslation();
    const [myCommittees, setMyCommittees] = useState([]);
    const [selectedCommitteeId, setSelectedCommitteeId] = useState('');
    const [loading, setLoading] = useState(false);
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [error, setError] = useState(null);

    const [payoutMethod, setPayoutMethod] = useState('easypaisa');
    const [easypaisaNumber, setEasypaisaNumber] = useState('');
    const [successData, setSuccessData] = useState(null);

    // Fetch active committees when modal opens
    useEffect(() => {
        if (isOpen) {
            if (committee) {
                setSelectedCommitteeId(committee.id);
            } else {
                fetchCommittees();
                setSelectedCommitteeId('');
            }
            setPayoutMethod('easypaisa');
            setEasypaisaNumber('');
            setSuccessData(null);
            setError(null);
        }
    }, [isOpen, committee]);

    // Handle Escape key
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape' && isOpen) onClose();
        };
        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose]);

    const fetchCommittees = async () => {
        try {
            const response = await apiRequest('/committees/my');

            const data = await response.json();
            console.log("Payout Modal - Fetched My Committees:", data);
            if (response.ok) {
                const committeeList = Array.isArray(data) ? data : [];
                setMyCommittees(committeeList);
                
                // Auto-select if only one committee exists
                if (committeeList.length === 1) {
                    setSelectedCommitteeId(committeeList[0].id);
                }
            } else {
                console.error("Failed to fetch committees", data);
                setError("Failed to load your committees. Please try refreshing.");
            }
        } catch (err) {
            console.error("Error connecting to server:", err);
        } finally {
            setIsInitialLoading(false);
        }
    };

    const handleCommitteeChange = (e) => {
        setSelectedCommitteeId(e.target.value);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        if (!selectedCommitteeId) {
            setError("Please select a committee to request a payout from.");
            return;
        }

        if (payoutMethod === 'easypaisa' && !easypaisaNumber.trim()) {
            setError("Please enter your Easypaisa number.");
            return;
        }

        setLoading(true);
        try {
            const response = await apiRequest('/payments/payout', {
                method: 'POST',
                body: JSON.stringify({
                    committee_id: selectedCommitteeId,
                    payout_method: payoutMethod,
                    easypaisa_number: payoutMethod === 'easypaisa' ? easypaisaNumber : undefined
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Payout request failed");
            }

            // Success: Display success view instead of closing directly
            setSuccessData(data);
            
            // Pass new balance up to dashboard
            onPayoutSuccess(data.new_balance, data.payout.amount);
            // We do NOT call onClose() here; we let the user close it from the success screen.

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    if (successData) {
        return (
            <PayoutVoucher 
                isOpen={true} 
                onClose={onClose} 
                successData={successData} 
                user={user} 
            />
        );
    }

    return (
        <div 
            className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-slate-900/60 backdrop-blur-sm"
            onClick={onClose}
        >
            <div 
                className="bg-white rounded-2xl w-full max-w-md mx-auto relative overflow-y-auto max-h-90vh shadow-2xl p-6 md:p-8"
                onClick={(e) => e.stopPropagation()}
                style={{ animation: 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)' }}
            >
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-3 rounded-full hover:bg-slate-100 transition-colors z-10"
                    aria-label="Close"
                >
                    <X size={20} className="text-slate-500" />
                </button>

                <h2 className="text-2xl font-bold text-slate-900 mb-6" dir={i18n.language === 'ur' ? 'rtl' : 'ltr'}>
                    {i18n.language === 'ur' ? 'ادائیگی کی درخواست کریں' : 'Request Payout'}
                </h2>

                {error && (
                    <div className="p-4 bg-red-50 text-red-800 rounded-xl mb-6 text-sm border border-red-100" dir={i18n.language === 'ur' ? 'rtl' : 'ltr'}>
                        {error}
                        <button onClick={fetchCommittees} className="block mt-2 text-blue-600 hover:underline font-bold bg-transparent border-none cursor-pointer p-0">
                            {i18n.language === 'ur' ? 'دوبارہ کوشش کریں' : 'Try Again'}
                        </button>
                    </div>
                )}

                {(!committee && myCommittees.length === 0 && !isInitialLoading) && (
                    <div className="p-6 bg-blue-50 text-blue-900 rounded-2xl mb-6 text-center border border-blue-100">
                        <p className="font-bold mb-2">
                            {i18n.language === 'ur' ? 'آپ نے ابھی تک کسی کمیٹی میں شمولیت اختیار نہیں کی ہے۔' : "You haven't joined any circles yet!"}
                        </p>
                        <p className="text-sm opacity-80 mb-4">
                            {i18n.language === 'ur' ? 'رقم وصول کرنے کے لیے پہلے ایک کمیٹی جوائن کریں۔' : 'You need to be part of a circle to request a payout.'}
                        </p>
                        <Link to="/committees" onClick={onClose} className="btn btn-primary px-6 py-2 text-sm font-bold">
                            {i18n.language === 'ur' ? 'کمیٹیاں تلاش کریں' : 'Explore Circles'}
                        </Link>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="flex flex-col gap-6" dir={i18n.language === 'ur' ? 'rtl' : 'ltr'}>
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-bold text-slate-700">{i18n.language === 'ur' ? 'کمیٹی منتخب کریں' : 'Select Committee'}</label>
                        {committee ? (
                            <input 
                                type="text"
                                value={i18n.language === 'ur' ? `سے درخواست کی جا رہی ہے: ${committee.title || committee.name}` : `Requesting from: ${committee.title || committee.name}`}
                                readOnly
                                className="bg-slate-100 text-slate-500 cursor-not-allowed w-full p-3 rounded-xl border border-slate-200 text-sm font-medium"
                            />
                        ) : (
                            <select
                                value={selectedCommitteeId}
                                onChange={handleCommitteeChange}
                                required
                                className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                            >
                                <option value="" disabled>{i18n.language === 'ur' ? '-- کمیٹی منتخب کریں --' : '-- Select a committee --'}</option>
                                {myCommittees.length === 0 ? (
                                    <option value="" disabled>{i18n.language === 'ur' ? 'کوئی فعال کمیٹی نہیں ملی' : 'No active committees found'}</option>
                                ) : (
                                    myCommittees.map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {c.title || c.name} ({i18n.language === 'ur' ? 'PKR' : 'PKR'} {c.total_amount})
                                        </option>
                                    ))
                                )}
                            </select>
                        )}
                    </div>

                    <div className="flex flex-col gap-3">
                        <label className="text-sm font-bold text-slate-700">{i18n.language === 'ur' ? 'طریقہ ادائیگی' : 'Payout Method'}</label>
                        <div className="grid grid-cols-2 gap-4">
                            <label className={`flex items-center gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all ${payoutMethod === 'easypaisa' ? 'border-blue-600 bg-blue-50' : 'border-slate-100 hover:border-slate-200'}`}>
                                <input 
                                    type="radio" 
                                    name="payoutMethod"
                                    value="easypaisa" 
                                    checked={payoutMethod === 'easypaisa'} 
                                    onChange={(e) => setPayoutMethod(e.target.value)} 
                                    className="accent-blue-600"
                                />
                                <span className="text-xs font-bold text-slate-800">{i18n.language === 'ur' ? 'ایزی پیسہ' : 'Easypaisa'}</span>
                            </label>
                            <label className={`flex items-center gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all ${payoutMethod === 'daraz' ? 'border-blue-600 bg-blue-50' : 'border-slate-100 hover:border-slate-200'}`}>
                                <input 
                                    type="radio" 
                                    name="payoutMethod"
                                    value="daraz" 
                                    checked={payoutMethod === 'daraz'} 
                                    onChange={(e) => setPayoutMethod(e.target.value)} 
                                    className="accent-blue-600"
                                />
                                <span className="text-xs font-bold text-slate-800">{i18n.language === 'ur' ? 'دراز واؤچر' : 'Daraz Voucher'}</span>
                            </label>
                        </div>
                    </div>
                    
                    {payoutMethod === 'easypaisa' && (
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-bold text-slate-700">{i18n.language === 'ur' ? 'ایزی پیسہ موبائل نمبر' : 'Easypaisa Mobile Number'}</label>
                            <input
                                type="tel"
                                value={easypaisaNumber}
                                onChange={(e) => setEasypaisaNumber(e.target.value)}
                                placeholder="03xxxxxxxxx"
                                required={payoutMethod === 'easypaisa'}
                                className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                    )}

                    {payoutMethod === 'daraz' && (
                        <div className="p-4 bg-slate-50 rounded-xl text-xs text-slate-500 border border-slate-100 italic">
                            {i18n.language === 'ur' ? 'آپ کی کل رقم کے برابر ایک منفرد دراز واؤچر فوراً بن جائے گا۔' : 'A unique Daraz voucher equivalent to your pot amount will be generated instantly.'}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className={`btn w-full py-4 rounded-2xl text-base font-extrabold shadow-lg transition-all active:scale-[0.98] ${loading ? 'opacity-50 cursor-not-allowed bg-slate-400' : 'btn-primary'}`}
                    >
                        {loading ? <Loader2 size={24} className="animate-spin" /> : (i18n.language === 'ur' ? 'درخواست جمع کرائیں' : 'Request Payout')}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default RequestPayoutModal;
