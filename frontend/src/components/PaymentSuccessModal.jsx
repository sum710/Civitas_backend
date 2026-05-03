import React from 'react';
import { CheckCircle2, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const PaymentSuccessModal = ({ isOpen, onClose, amount, message }) => {
    const { t, i18n } = useTranslation();

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100000] p-4 animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden relative transform transition-all scale-100 p-8 text-center border-t-8 border-t-green-500">
                <button 
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors"
                >
                    <X size={20} />
                </button>
                
                <div className="flex justify-center mb-6">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-green-500 ring-8 ring-green-50 animate-bounce-short">
                        <CheckCircle2 size={40} />
                    </div>
                </div>
                
                <h2 className="text-2xl md:text-3xl font-extrabold text-slate-800 mb-2 leading-tight">
                    {i18n.language === 'ur' ? 'کامیابی!' : 'Success!'}
                </h2>
                
                <p className="text-slate-500 text-sm md:text-base font-medium mb-6 px-2">
                    {message || (i18n.language === 'ur' ? 'آپ کی ادائیگی کامیابی کے ساتھ مکمل ہو گئی ہے۔' : 'Your transaction has been completed successfully.')}
                </p>

                {amount && (
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-6">
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">
                            {i18n.language === 'ur' ? 'رقم' : 'Amount'}
                        </p>
                        <p className="text-2xl font-black text-slate-800">
                            PKR {amount.toLocaleString()}
                        </p>
                    </div>
                )}
                
                <button
                    onClick={onClose}
                    className="w-full py-3.5 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl shadow-lg shadow-green-500/30 transition-all hover:-translate-y-0.5"
                >
                    {i18n.language === 'ur' ? 'جاری رکھیں' : 'Continue'}
                </button>
            </div>
        </div>
    );
};

export default PaymentSuccessModal;
