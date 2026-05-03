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
        { id: 'easypaisa', title: 'EasyPaisa', icon: <Smartphone size={32} className="text-green-500" />, desc: 'Instant mobile transfer', color: 'bg-green-50 border-green-200 hover:border-green-500' },
        { id: 'jazzcash', title: 'JazzCash', icon: <Smartphone size={32} className="text-red-500" />, desc: 'Instant mobile transfer', color: 'bg-red-50 border-red-200 hover:border-red-500' },
        { id: 'bank', title: 'Bank Transfer', icon: <Building size={32} className="text-blue-500" />, desc: 'Direct IBAN transfer', color: 'bg-blue-50 border-blue-200 hover:border-blue-500' },
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
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden animate-fade-in relative flex flex-col md:flex-row h-auto max-h-[90vh]">
                
                {/* Header (Mobile) or Left Panel (Desktop) */}
                <div className="bg-gradient-to-br from-blue-600 to-indigo-800 p-6 md:p-8 text-white md:w-2/5 flex flex-col justify-between shrink-0">
                    <div>
                        <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-6 backdrop-blur-md">
                            <Wallet size={24} className="text-white" />
                        </div>
                        <h2 className="text-2xl md:text-3xl font-bold mb-2">
                            {i18n.language === 'ur' ? 'والیٹ ٹاپ اپ' : 'Wallet Top-up'}
                        </h2>
                        <p className="text-blue-100 opacity-90 text-sm md:text-base leading-relaxed">
                            {i18n.language === 'ur' 
                                ? 'اپنے اکاؤنٹ میں فوری فنڈز شامل کریں۔ تمام ادائیگیاں محفوظ اور انکرپٹڈ ہیں۔' 
                                : 'Instantly add funds to your account. All payments are secure and encrypted.'}
                        </p>
                    </div>
                    
                    <div className="hidden sm:flex flex-col gap-3 mt-8 opacity-80">
                        <div className="flex items-center gap-2 text-xs font-medium">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-400"></div> 256-bit SSL Encryption
                        </div>
                        <div className="flex items-center gap-2 text-xs font-medium">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-400"></div> Instant Verification
                        </div>
                    </div>
                </div>

                {/* Right Panel - Form */}
                <div className="p-6 md:p-8 md:w-3/5 overflow-y-auto relative">
                    <button 
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500 transition-colors"
                    >
                        <X size={20} />
                    </button>

                    {step === 1 && (
                        <div className="animate-fade-in pt-2">
                            <h3 className="text-xl font-bold text-slate-800 mb-6">
                                {i18n.language === 'ur' ? 'ادائیگی کا طریقہ منتخب کریں' : 'Select Payment Method'}
                            </h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {paymentMethods.map(pm => (
                                    <button 
                                        key={pm.id}
                                        onClick={() => handleMethodSelect(pm.id)}
                                        className={`flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all cursor-pointer text-center group ${pm.color}`}
                                    >
                                        <div className="mb-4 bg-white p-3 rounded-full shadow-sm group-hover:scale-110 transition-transform">
                                            {pm.icon}
                                        </div>
                                        <h4 className="font-bold text-slate-800 mb-1">{pm.title}</h4>
                                        <p className="text-xs text-slate-500 font-medium">{pm.desc}</p>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <form onSubmit={handleContinue} className="flex flex-col gap-6 pt-2 animate-fade-in">
                            <div className="flex items-center gap-3 mb-2">
                                <button type="button" onClick={() => setStep(1)} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors">
                                    <ArrowLeft size={20} />
                                </button>
                                <h3 className="text-xl font-bold text-slate-800 m-0">
                                    {method === 'easypaisa' ? 'EasyPaisa Checkout' : method === 'jazzcash' ? 'JazzCash Checkout' : 'Bank Transfer'}
                                </h3>
                            </div>

                            {error && (
                                <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm border border-red-100 font-medium">
                                    {error}
                                </div>
                            )}

                            {/* Dynamic Input based on Method */}
                            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                                <label className="block text-sm font-bold text-slate-700 mb-2">
                                    {method === 'bank' ? 'Account IBAN / Number' : 'Mobile Number'}
                                </label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                        {method === 'bank' ? <Building size={20} /> : <Phone size={20} />}
                                    </span>
                                    <input
                                        type="text"
                                        value={accountDetails}
                                        onChange={(e) => setAccountDetails(e.target.value)}
                                        placeholder={method === 'bank' ? 'PK00 BANK 0000 0000 0000' : '03XX XXXXXXX'}
                                        className="w-full pl-12 pr-4 py-3.5 rounded-xl border-2 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all font-semibold text-slate-800"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Amount Selection */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-3">
                                    {i18n.language === 'ur' ? 'رقم منتخب کریں (PKR)' : 'Select Amount (PKR)'}
                                </label>
                                
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                                    {presetAmounts.map(preset => (
                                        <button
                                            key={preset}
                                            type="button"
                                            onClick={() => setAmount(preset.toString())}
                                            className={`py-2 px-1 rounded-xl text-sm font-bold border-2 transition-all ${amount === preset.toString() ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'}`}
                                        >
                                            {preset.toLocaleString()}
                                        </button>
                                    ))}
                                </div>
                                
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">PKR</span>
                                    <input
                                        type="number"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        placeholder={i18n.language === 'ur' ? 'کوئی اور رقم درج کریں' : 'Enter custom amount'}
                                        className="w-full pl-14 pr-4 py-3.5 rounded-xl border-2 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all font-bold text-lg text-slate-800"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col sm:flex-row gap-3">
                                <button
                                    type="submit"
                                    disabled={loading || !amount || !accountDetails}
                                    className={`w-full py-4 font-bold text-white rounded-xl shadow-lg transition-all ${loading || !amount || !accountDetails ? 'bg-blue-400 shadow-none cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 hover:shadow-blue-600/30 hover:-translate-y-0.5'}`}
                                >
                                    {loading ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <Loader2 size={20} className="animate-spin" /> 
                                            {i18n.language === 'ur' ? 'پروسیسنگ...' : 'Processing...'}
                                        </span>
                                    ) : (
                                        i18n.language === 'ur' ? 'محفوظ طریقے سے ادا کریں' : 'Pay Securely'
                                    )}
                                </button>
                            </div>
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
