import React from 'react';
import { CheckCircle2, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const PaymentSuccessModal = ({ isOpen, onClose, amount, message }) => {
    const { t, i18n } = useTranslation();

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100000] p-4 animate-fade-in">
            <div 
                className="bg-white rounded-2xl shadow-2xl overflow-hidden relative transform transition-all scale-100 text-center border-t-8 border-t-green-500 flex flex-col items-center"
                style={{ width: '100%', maxWidth: '360px', padding: '24px' }}
            >
                <button 
                    onClick={onClose}
                    className="absolute top-3 right-3 p-1.5 text-slate-400 hover:bg-slate-100 rounded-full transition-colors border border-slate-200 bg-white"
                >
                    <X size={18} />
                </button>
                
                <div className="flex justify-center mt-2 mb-4">
                    <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center text-green-600 ring-4 ring-green-50 animate-bounce-short">
                        <CheckCircle2 size={32} />
                    </div>
                </div>
                
                <h2 className="text-xl md:text-2xl font-black text-slate-800 mb-2 leading-tight">
                    {i18n.language === 'ur' ? 'کامیابی!' : 'Success!'}
                </h2>
                
                <p className="text-slate-500 text-xs md:text-sm font-medium mb-4 px-2 leading-normal">
                    {message || (i18n.language === 'ur' ? 'آپ کی ادائیگی کامیابی کے ساتھ مکمل ہو گئی ہے۔' : 'Your transaction has been completed successfully.')}
                </p>

                {amount && (
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 mb-4 w-full">
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">
                            {i18n.language === 'ur' ? 'رقم' : 'Amount'}
                        </p>
                        <p className="text-xl font-black text-slate-800">
                            PKR {amount.toLocaleString()}
                        </p>
                    </div>
                )}
                
                <button
                    onClick={onClose}
                    className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-lg shadow-green-600/30 transition-all hover:-translate-y-0.5 text-sm"
                >
                    {i18n.language === 'ur' ? 'جاری رکھیں' : 'Continue'}
                </button>
            </div>
        </div>
    );
};

export default PaymentSuccessModal;
