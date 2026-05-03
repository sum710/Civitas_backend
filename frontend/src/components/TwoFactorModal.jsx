import React, { useState, useEffect, useRef } from 'react';
import { ShieldAlert, Loader2, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import apiRequest from '../services/api';

const TwoFactorModal = ({ isOpen, onClose, onSuccess, actionType = 'payment' }) => {
    const { t } = useTranslation();
    const [token, setToken] = useState(['', '', '', '', '', '']);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const inputRefs = useRef([]);

    useEffect(() => {
        if (isOpen) {
            setToken(['', '', '', '', '', '']);
            setError('');
            // Auto focus first input
            setTimeout(() => {
                if (inputRefs.current[0]) inputRefs.current[0].focus();
            }, 100);
        }
    }, [isOpen]);

    const handleChange = (index, value) => {
        if (!/^\d*$/.test(value)) return;
        
        const newToken = [...token];
        newToken[index] = value;
        setToken(newToken);

        if (value !== '' && index < 5) {
            inputRefs.current[index + 1].focus();
        }
        
        // Auto submit if all filled
        if (value !== '' && index === 5 && newToken.every(v => v !== '')) {
            submitToken(newToken.join(''));
        }
    };

    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace' && token[index] === '' && index > 0) {
            inputRefs.current[index - 1].focus();
        }
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        if (pastedData) {
            const newToken = [...token];
            for (let i = 0; i < pastedData.length; i++) {
                newToken[i] = pastedData[i];
            }
            setToken(newToken);
            const focusIndex = Math.min(pastedData.length, 5);
            inputRefs.current[focusIndex].focus();
            
            if (pastedData.length === 6) {
                submitToken(pastedData);
            }
        }
    };

    const submitToken = async (fullToken) => {
        setLoading(true);
        setError('');
        try {
            const endpoint = actionType === 'payment' ? '/auth/2fa/verify-payment' : '/auth/2fa/verify';
            const res = await apiRequest(endpoint, {
                method: 'POST',
                body: JSON.stringify({ token: fullToken })
            });
            const data = await res.json();
            
            if (res.ok && data.verified !== false) {
                onSuccess();
            } else {
                setError(data.message || 'Verification failed. Please try again.');
                setToken(['', '', '', '', '', '']);
                inputRefs.current[0].focus();
            }
        } catch (err) {
            setError('Network error. Check your connection.');
        } finally {
            setLoading(false);
        }
    };

    const handleFormSubmit = (e) => {
        e.preventDefault();
        const fullToken = token.join('');
        if (fullToken.length === 6) {
            submitToken(fullToken);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center z-[100000] p-4 animate-fade-in">
            <div className="bg-blue-900 text-white rounded-2xl shadow-2xl shadow-blue-900/50 w-full mx-auto overflow-hidden relative border border-blue-800" style={{ maxWidth: '400px' }}>
                <button 
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 text-blue-300 hover:bg-blue-800 hover:text-white rounded-full transition-colors z-10"
                >
                    <X size={20} />
                </button>
                
                <div className="p-8 text-center border-b border-blue-800 bg-gradient-to-b from-blue-800 to-blue-900" dir={i18n.language === 'ur' ? 'rtl' : 'ltr'}>
                    <div className="w-16 h-16 bg-blue-500/20 text-blue-300 rounded-full flex items-center justify-center mx-auto mb-4 ring-8 ring-blue-800 shadow-inner">
                        <ShieldAlert size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-1">
                        {i18n.language === 'ur' ? 'سیکیورٹی چیک' : 'Security Check'}
                    </h3>
                    <p className="text-sm text-blue-200 px-4">
                        {i18n.language === 'ur' ? 'اس کارروائی کی اجازت دینے کے لیے براہ کرم اپنی آتھنٹیکیٹر ایپ سے 6 ہندسوں کا کوڈ درج کریں۔' : 'Please enter the 6-digit code from your authenticator app to authorize this action.'}
                    </p>
                </div>

                <div className="p-6 md:p-8">
                    {error && (
                        <div className="mb-4 p-3 bg-red-500/10 text-red-300 text-sm rounded-lg border border-red-500/20 font-medium">
                            {error}
                        </div>
                    )}
                    
                    <form onSubmit={handleFormSubmit} className="flex flex-col w-full">
                        <div className="flex justify-center gap-2 mb-8" onPaste={handlePaste}>
                            {token.map((digit, index) => (
                                <input
                                    key={index}
                                    ref={el => inputRefs.current[index] = el}
                                    type="text"
                                    inputMode="numeric"
                                    maxLength="1"
                                    value={digit}
                                    onChange={(e) => handleChange(index, e.target.value)}
                                    onKeyDown={(e) => handleKeyDown(index, e)}
                                    className="text-center text-2xl font-bold rounded-xl border-2 border-blue-400 focus:border-blue-300 focus:ring-4 focus:ring-blue-300/50 outline-none transition-all text-slate-900 bg-white shadow-inner"
                                    style={{ width: '45px', height: '55px', minWidth: '45px', padding: '0' }}
                                    dir="ltr"
                                />
                            ))}
                        </div>
                        
                        <button
                            type="submit"
                            disabled={loading || token.join('').length !== 6}
                            className={`w-full py-3.5 font-bold rounded-xl transition-all flex justify-center items-center gap-2 ${loading || token.join('').length !== 6 ? 'bg-blue-800 text-blue-400 border border-blue-700 shadow-none cursor-not-allowed' : 'bg-blue-500 text-white hover:bg-blue-400 shadow-lg hover:shadow-blue-500/30'}`}
                        >
                            {loading ? <><Loader2 size={20} className="animate-spin" /> {i18n.language === 'ur' ? 'تصدیق ہو رہی ہے...' : 'Verifying...'}</> : (i18n.language === 'ur' ? 'کوڈ کی تصدیق کریں' : 'Verify Code')}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default TwoFactorModal;
