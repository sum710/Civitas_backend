import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Shield, Smartphone, Key, CheckCircle, Copy, AlertTriangle } from 'lucide-react';
import apiRequest from '../services/api';
import useVoiceAssistant from '../hooks/useVoiceAssistant';

const SecuritySettings = () => {
    const { t, i18n } = useTranslation();
    const [is2faEnabled, setIs2faEnabled] = useState(false);
    const [qrCode, setQrCode] = useState('');
    const [secret, setSecret] = useState('');
    const [token, setToken] = useState('');
    const [loading, setLoading] = useState(false);
    const [statusLoading, setStatusLoading] = useState(true);
    const [error, setError] = useState('');
    const [step, setStep] = useState(1); // 1: Status, 2: Setup

    useEffect(() => {
        fetchStatus();
    }, []);

    const fetchStatus = async () => {
        try {
            const res = await apiRequest('/auth/2fa/status');
            const data = await res.json();
            if (res.ok) {
                setIs2faEnabled(data.is_2fa_enabled);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setStatusLoading(false);
        }
    };

    const handleEnableClick = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await apiRequest('/auth/2fa/generate', { method: 'POST' });
            const data = await res.json();
            if (res.ok) {
                setQrCode(data.qrCode);
                setSecret(data.secret);
                setStep(2);
            } else {
                setError(data.message || (i18n.language === 'ur' ? '2FA بنانے میں ناکام' : 'Failed to generate 2FA'));
            }
        } catch (err) {
            setError(i18n.language === 'ur' ? 'نیٹ ورک کی خرابی' : 'Network error');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyToken = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const res = await apiRequest('/auth/2fa/verify', {
                method: 'POST',
                body: JSON.stringify({ token })
            });
            const data = await res.json();
            if (res.ok) {
                setIs2faEnabled(true);
                setStep(1);
            } else {
                setError(data.message || (i18n.language === 'ur' ? 'غلط کوڈ' : 'Invalid code'));
            }
        } catch (err) {
            setError(i18n.language === 'ur' ? 'نیٹ ورک کی خرابی' : 'Network error');
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(secret);
        alert(i18n.language === 'ur' ? 'خفیہ کلید کاپی ہو گئی' : 'Secret copied to clipboard');
    };

    if (statusLoading) {
        return <div className="flex justify-center p-10"><div className="animate-spin text-blue-600"><Key size={32} /></div></div>;
    }

    return (
        <div className="max-w-3xl mx-auto p-4 md:p-8" dir={i18n.language === 'ur' ? 'rtl' : 'ltr'}>
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 md:p-8 border-b border-slate-100 bg-slate-50">
                    <div className="flex items-center gap-4">
                        <div className="bg-blue-100 p-3 rounded-xl text-blue-600">
                            <Shield size={32} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-slate-800 m-0">
                                {i18n.language === 'ur' ? 'سیکیورٹی سیٹنگز' : 'Security Settings'}
                            </h2>
                            <p className="text-slate-500 mt-1">
                                {i18n.language === 'ur' ? 'اپنے اکاؤنٹ کی سیکیورٹی اور ٹو فیکٹر آتھنٹیکیشن کا نظم کریں۔' : 'Manage your account security and two-factor authentication.'}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="p-6 md:p-8">
                    {step === 1 && (
                        <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-6 rounded-2xl border-2 border-slate-100 bg-white shadow-sm">
                            <div className="flex items-start gap-4 w-full">
                                <div className={`p-3 rounded-full shrink-0 ${is2faEnabled ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400'}`}>
                                    <Smartphone size={28} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                        {i18n.language === 'ur' ? 'آتھنٹیکیٹر ایپ' : 'Authenticator App'}
                                        {is2faEnabled && <CheckCircle size={18} className="text-green-500" />}
                                    </h3>
                                    <p className="text-slate-500 text-sm mt-1 max-w-md">
                                        {i18n.language === 'ur' ? 'سیکیورٹی کوڈز بنانے کے لیے Google Authenticator یا Authy جیسی ایپ استعمال کریں۔' : 'Use an authenticator app like Google Authenticator or Authy to generate one-time security codes.'}
                                    </p>
                                </div>
                            </div>
                            <div className="shrink-0 w-full md:w-auto flex justify-end">
                                {is2faEnabled ? (
                                    <span className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-lg font-medium border border-green-200">
                                        <CheckCircle size={18} /> {i18n.language === 'ur' ? 'فعال ہے' : 'Enabled'}
                                    </span>
                                ) : (
                                    <button 
                                        onClick={handleEnableClick} 
                                        disabled={loading}
                                        className="btn btn-primary px-6 py-2 shadow-sm whitespace-nowrap w-full md:w-auto"
                                    >
                                        {loading ? (i18n.language === 'ur' ? 'عمل ہو رہا ہے...' : 'Processing...') : (i18n.language === 'ur' ? '2FA فعال کریں' : 'Enable 2FA')}
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="animate-fade-in max-w-md mx-auto bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                            <div className="text-center mb-6">
                                <h3 className="text-xl font-bold text-slate-800 mb-2">
                                    {i18n.language === 'ur' ? 'آتھنٹیکیٹر ترتیب دیں' : 'Configure Authenticator'}
                                </h3>
                                <p className="text-slate-500 text-sm">
                                    {i18n.language === 'ur' ? 'اپنی آتھنٹیکیٹر ایپ سے نیچے دیا گیا QR کوڈ اسکین کریں۔' : 'Scan the QR code below with your authenticator app.'}
                                </p>
                            </div>

                            {error && (
                                <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-6 flex items-center gap-2 text-sm border border-red-100">
                                    <AlertTriangle size={18} /> {error}
                                </div>
                            )}

                            <div className="flex justify-center mb-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
                                {qrCode ? (
                                    <img src={qrCode} alt="2FA QR Code" className="w-48 h-48 sm:w-56 sm:h-56 object-contain" />
                                ) : (
                                    <div className="w-48 h-48 flex items-center justify-center text-slate-400">
                                        {i18n.language === 'ur' ? 'لوڈ ہو رہا ہے...' : 'Loading...'}
                                    </div>
                                )}
                            </div>

                            <div className="mb-6">
                                <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-2 text-center">
                                    {i18n.language === 'ur' ? 'یا یہ سیٹ اپ کلید دستی طور پر درج کریں' : 'Or enter this setup key manually'}
                                </p>
                                <div className="flex items-center justify-between gap-2 bg-slate-100 p-3 rounded-lg border border-slate-200 w-full overflow-x-auto">
                                    <code className="text-xs font-mono text-slate-700 select-all break-all" dir="ltr">{secret}</code>
                                    <button onClick={copyToClipboard} type="button" className="text-slate-400 hover:text-blue-600 transition-colors p-1 flex-shrink-0" title="Copy to clipboard">
                                        <Copy size={16} />
                                    </button>
                                </div>
                            </div>

                            <form onSubmit={handleVerifyToken} className="w-full">
                                <div className="mb-6">
                                    <label className="block text-sm font-semibold text-slate-700 mb-2 text-center">
                                        {i18n.language === 'ur' ? '6 ہندسوں کا کوڈ درج کریں' : 'Enter 6-digit code'}
                                    </label>
                                    <input 
                                        type="text" 
                                        maxLength="6"
                                        placeholder="000000"
                                        value={token}
                                        onChange={(e) => setToken(e.target.value.replace(/\D/g, ''))}
                                        className="w-full text-center text-2xl tracking-[0.5em] font-mono p-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                                        required
                                        dir="ltr"
                                    />
                                </div>
                                <div className="flex justify-between items-center w-full mt-6">
                                    <button 
                                        type="button" 
                                        onClick={() => setStep(1)} 
                                        className="text-gray-500 hover:bg-gray-100 px-4 py-2 rounded-lg font-medium transition-colors"
                                    >
                                        {i18n.language === 'ur' ? 'منسوخ کریں' : 'Cancel'}
                                    </button>
                                    <button 
                                        type="submit" 
                                        disabled={loading || token.length !== 6}
                                        className={`px-6 py-2 rounded-lg font-medium transition-all ${loading || token.length !== 6 ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                                    >
                                        {loading ? (i18n.language === 'ur' ? 'تصدیق ہو رہی ہے...' : 'Verifying...') : (i18n.language === 'ur' ? 'تصدیق کریں اور فعال کریں' : 'Verify & Enable')}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SecuritySettings;
