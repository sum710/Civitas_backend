import React, { useState } from 'react';
import { X, CreditCard, Banknote, Smartphone, Loader2, Wallet, ArrowLeft, Building, Phone } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import apiRequest from '../services/api';
import TwoFactorModal from './TwoFactorModal';

const WalletTopupModal = ({ isOpen, onClose, onTopupSuccess }) => {
    const { t, i18n } = useTranslation();
    const [step, setStep] = useState(1); // 1: Select Method, 2: Details
    const [amount, setAmount] = useState('');
    const [method, setMethod] = useState(''); // 'easypaisa', 'jazzcash', 'bank'
    const [accountDetails, setAccountDetails] = useState('');
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [is2faModalOpen, setIs2faModalOpen] = useState(false);

    if (!isOpen) return null;

    const presetAmounts = [1000, 5000, 10000, 50000];

    const paymentMethods = [
        { id: 'easypaisa', title: i18n.language === 'ur' ? 'ایزی پیسہ' : 'EasyPaisa', icon: <Smartphone size={32} className="text-green-500" />, desc: i18n.language === 'ur' ? 'فوری موبائل ٹرانسفر' : 'Instant mobile transfer', color: 'bg-green-50 border-green-200 hover:border-green-500' },
        { id: 'jazzcash', title: i18n.language === 'ur' ? 'جاز کیش' : 'JazzCash', icon: <Smartphone size={32} className="text-red-500" />, desc: i18n.language === 'ur' ? 'فوری موبائل ٹرانسفر' : 'Instant mobile transfer', color: 'bg-red-50 border-red-200 hover:border-red-500' },
        { id: 'bank', title: i18n.language === 'ur' ? 'بینک ٹرانسفر' : 'Bank Transfer', icon: <Building size={32} className="text-blue-500" />, desc: i18n.language === 'ur' ? 'براہ راست IBAN ٹرانسفر' : 'Direct IBAN transfer', color: 'bg-blue-50 border-blue-200 hover:border-blue-500' },
    ];

    const handleMethodSelect = (selectedMethod) => {
        setMethod(selectedMethod);
        setAccountDetails('');
        setStep(2);
    };

    const handleContinue = async (e) => {
        e.preventDefault();
        setError(null);
        
        if (!amount || parseFloat(amount) < 100) {
            setError(i18n.language === 'ur' ? 'کم از کم رقم 100 PKR ہونی چاہیے۔' : 'Minimum amount is 100 PKR.');
            return;
        }

        if (!accountDetails) {
            setError(i18n.language === 'ur' ? 'براہ کرم اکاؤنٹ کی تفصیلات درج کریں۔' : 'Please enter account details.');
            return;
        }

        setLoading(true);
        try {
            // Check 2FA Status
            const res = await apiRequest('/auth/2fa/status');
            const data = await res.json();
            if (data.is_2fa_enabled) {
                setIs2faModalOpen(true);
                setLoading(false);
            } else {
                executePayment();
            }
        } catch (err) {
            setError('Failed to check security settings.');
            setLoading(false);
        }
    };

    const executePayment = async () => {
        setLoading(true);
        try {
            // Mocking payment gateway delay
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            const response = await apiRequest('/users/deposit', {
                method: 'POST',
                body: JSON.stringify({ 
                    amount: parseFloat(amount),
                    method: method,
                    account_details: accountDetails
                })
            });
            const data = await response.json();
            
            if (response.ok && data.success) {
                // Reset State
                setStep(1);
                setAmount('');
                setAccountDetails('');
                onTopupSuccess(data.balance, parseFloat(amount));
            } else {
                setError(data.message || 'Deposit failed');
            }
        } catch (err) {
            setError('Network error during transaction.');
        } finally {
            setLoading(false);
        }
    };

    const handle2FASuccess = () => {
        setIs2faModalOpen(false);
        executePayment();
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100000] p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in relative flex flex-col max-h-[90vh]">
                
                {/* Header Banner */}
                <div className="bg-gradient-to-br from-blue-600 to-indigo-800 p-5 text-white flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md">
                            <Wallet size={20} className="text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold m-0 leading-tight">
                                {i18n.language === 'ur' ? 'والیٹ ٹاپ اپ' : 'Wallet Top-up'}
                            </h2>
                            <p className="text-blue-100 opacity-90 text-xs m-0 leading-tight mt-0.5">
                                {i18n.language === 'ur' ? 'محفوظ اور انکرپٹڈ ادائیگی' : 'Secure and encrypted payment'}
                            </p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Form / Method Selection */}
                <div className="p-5 overflow-y-auto">
                    {step === 1 && (
                        <div className="animate-fade-in flex flex-col gap-4">
                            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider m-0">
                                {i18n.language === 'ur' ? 'ادائیگی کا طریقہ منتخب کریں' : 'Select Payment Method'}
                            </h3>
                            
                            <div className="flex flex-col gap-3">
                                {paymentMethods.map(pm => (
                                    <button 
                                        key={pm.id}
                                        onClick={() => handleMethodSelect(pm.id)}
                                        className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all cursor-pointer text-left group ${pm.color}`}
                                    >
                                        <div className="bg-white p-2.5 rounded-xl shadow-sm group-hover:scale-105 transition-transform shrink-0">
                                            {pm.icon}
                                        </div>
                                        <div className="flex-grow">
                                            <h4 className="font-bold text-slate-800 m-0 text-base leading-tight">{pm.title}</h4>
                                            <p className="text-xs text-slate-500 font-medium m-0 leading-tight mt-1">{pm.desc}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <form onSubmit={handleContinue} className="flex flex-col gap-5 animate-fade-in">
                            <div className="flex items-center gap-3">
                                <button type="button" onClick={() => setStep(1)} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors shrink-0">
                                    <ArrowLeft size={18} />
                                </button>
                                <h3 className="text-base font-bold text-slate-800 m-0 leading-tight">
                                    {method === 'easypaisa' ? 'EasyPaisa Checkout' : method === 'jazzcash' ? 'JazzCash Checkout' : 'Bank Transfer'}
                                </h3>
                            </div>

                            {error && (
                                <div className="bg-red-50 text-red-600 p-3 rounded-xl text-xs border border-red-100 font-medium leading-normal">
                                    {error}
                                </div>
                            )}

                            {/* Input Field */}
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                                    {method === 'bank' ? 'Account IBAN / Number' : 'Mobile Number'}
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                                        {method === 'bank' ? <Building size={18} /> : <Phone size={18} />}
                                    </span>
                                    <input
                                        type="text"
                                        value={accountDetails}
                                        onChange={(e) => setAccountDetails(e.target.value)}
                                        placeholder={method === 'bank' ? 'PK00 BANK 0000 0000 0000' : '03XX XXXXXXX'}
                                        className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all font-semibold text-slate-800 text-sm"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Amount Selection */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                                    {i18n.language === 'ur' ? 'رقم منتخب کریں (PKR)' : 'Select Amount (PKR)'}
                                </label>
                                
                                <div className="grid grid-cols-4 gap-2 mb-3">
                                    {presetAmounts.map(preset => (
                                        <button
                                            key={preset}
                                            type="button"
                                            onClick={() => setAmount(preset.toString())}
                                            className={`py-2 px-1 rounded-lg text-xs font-bold border transition-all ${amount === preset.toString() ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'}`}
                                        >
                                            {preset.toLocaleString()}
                                        </button>
                                    ))}
                                </div>
                                
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-sm">PKR</span>
                                    <input
                                        type="number"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        placeholder={i18n.language === 'ur' ? 'کوئی اور رقم درج کریں' : 'Enter custom amount'}
                                        className="w-full pl-12 pr-4 py-2.5 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all font-bold text-base text-slate-800"
                                        required
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading || !amount || !accountDetails}
                                className={`w-full py-3.5 mt-2 font-bold text-white rounded-xl shadow-lg transition-all text-sm ${loading || !amount || !accountDetails ? 'bg-blue-400 shadow-none cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 hover:shadow-blue-600/30 hover:-translate-y-0.5'}`}
                            >
                                {loading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <Loader2 size={16} className="animate-spin" /> 
                                        {i18n.language === 'ur' ? 'پروسیسنگ...' : 'Processing...'}
                                    </span>
                                ) : (
                                    i18n.language === 'ur' ? 'محفوظ طریقے سے ادا کریں' : 'Pay Securely'
                                )}
                            </button>
                        </form>
                    )}
                </div>
            </div>

            <TwoFactorModal 
                isOpen={is2faModalOpen} 
                onClose={() => setIs2faModalOpen(false)} 
                onSuccess={handle2FASuccess} 
                actionType="payment" 
            />
        </div>
    );
};

export default WalletTopupModal;
