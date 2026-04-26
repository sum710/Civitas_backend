import React, { useEffect } from 'react';
import { X, CheckCircle, Gift, Copy } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const PayoutVoucher = ({ isOpen, onClose, successData, user }) => {
    const { i18n } = useTranslation();

    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) {
            window.addEventListener('keydown', handleEscape);
        }
        return () => window.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose]);

    if (!isOpen || !successData) return null;

    const isDaraz = successData.payout.payout_method.toLowerCase() === 'daraz';

    return (
        <div 
            className="fixed inset-0 z-[9999] bg-black/40 backdrop-blur-md flex items-center justify-center p-4"
            onClick={onClose}
            id="voucher-overlay"
        >
            <div 
                className="bg-white rounded-[32px] w-full shadow-2xl relative overflow-hidden flex flex-col"
                onClick={(e) => e.stopPropagation()}
                style={{ 
                    maxWidth: '380px', 
                    width: '100%',
                    maxHeight: 'min(600px, 90vh)',
                    margin: 'auto',
                    animation: 'slideUp 0.3s ease-out',
                    border: '1px solid rgba(0,0,0,0.05)'
                }}
            >
                <button
                    onClick={onClose}
                    className={`absolute top-4 ${i18n.language === 'ur' ? 'left-4' : 'right-4'} p-2 rounded-full hover:bg-slate-100 transition-all z-50 bg-white/50 backdrop-blur-sm`}
                    aria-label="Close"
                    id="close-voucher-btn"
                >
                    <X size={20} className="text-slate-500" />
                </button>

                {isDaraz ? (
                    <div className="flex flex-col">
                        <div className="p-6 text-center border-b border-slate-50 bg-slate-50/30">
                            <h2 className="text-lg font-bold text-slate-800 m-0">
                                {i18n.language === 'ur' ? 'انعام واؤچر' : 'Reward Voucher'}
                            </h2>
                            <p className="text-[11px] text-slate-500 mt-1">
                                {i18n.language === 'ur' ? 'کامیابی سے تیار کر لیا گیا' : 'Generated successfully'}
                            </p>
                        </div>
                        
                        <div className="p-6 flex flex-col items-center overflow-y-auto">
                            {/* The Prominent White Card with Blue Accents */}
                            <div className="bg-white rounded-3xl p-6 text-slate-800 relative overflow-hidden shadow-[0_20px_50px_rgba(37,99,235,0.15)] w-full border-l-[8px] border-blue-600 border-y border-r border-slate-100 flex flex-col justify-between mb-8"
                                style={{ aspectRatio: '1.58 / 1', minHeight: '190px' }}>
                                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/40 rounded-full -mr-16 -mt-16 blur-3xl"></div>
                                <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-100/20 rounded-full -ml-12 -mb-12 blur-2xl"></div>
                                
                                <div className="flex items-center gap-2 mb-3 relative z-10">
                                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                                    <h3 className="m-0 text-[10px] font-black tracking-[0.2em] uppercase text-blue-500/70">
                                        {i18n.language === 'ur' ? 'دراز واؤچر' : 'DARAZ VOUCHER'}
                                    </h3>
                                </div>
                                
                                <div className="relative z-10 mb-2 text-left">
                                    <p className="m-0 text-[10px] text-blue-600 font-black mb-1 uppercase tracking-[0.15em]">
                                        {i18n.language === 'ur' ? 'مبارک ہو،' : 'Congratulations,'} {user?.full_name?.split(' ')[0] || 'Member'}
                                    </p>
                                    <h2 className="m-0 text-3xl font-black text-blue-700 tracking-tighter">
                                        PKR {successData.payout.amount.toLocaleString()}
                                    </h2>
                                </div>
                                
                                <div className="flex justify-between items-end relative z-10 pt-3 border-t border-slate-50">
                                    <div>
                                        <p className="m-0 text-[8px] text-slate-300 uppercase tracking-widest font-black mb-1">
                                            {i18n.language === 'ur' ? 'میعاد:' : 'EXPIRES:'}
                                        </p>
                                        <p className="m-0 text-[10px] font-bold text-slate-500">
                                            {new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric'})}
                                        </p>
                                    </div>
                                    
                                    <div className="bg-blue-50 px-3 py-2 rounded-xl flex items-center gap-3 border-2 border-blue-400 shadow-sm">
                                        <span className="font-mono text-sm font-bold text-blue-800 tracking-widest">
                                            {successData.payout.account_details}
                                        </span>
                                        <button 
                                            onClick={() => {
                                                navigator.clipboard.writeText(successData.payout.account_details);
                                                alert("Code copied!");
                                            }}
                                            className="bg-transparent border-none text-blue-500 cursor-pointer p-0 hover:scale-110 transition-transform"
                                        >
                                            <Copy size={14} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="w-full text-left space-y-3" dir={i18n.language === 'ur' ? 'rtl' : 'ltr'}>
                                <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                                    {i18n.language === 'ur' ? 'ہدایات:' : 'Instructions:'}
                                </h4>
                                <div className="space-y-2">
                                    {[
                                        i18n.language === 'ur' ? 'کوڈ کاپی کریں' : 'Copy the secret code',
                                        i18n.language === 'ur' ? 'دراز ایپ کھولیں' : 'Open Daraz app',
                                        i18n.language === 'ur' ? 'چیک آؤٹ پر پیسٹ کریں' : 'Paste at checkout'
                                    ].map((step, i) => (
                                        <div key={i} className="flex items-center gap-3 text-xs text-slate-600 font-medium">
                                            <div className="w-5 h-5 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-[10px] font-bold">
                                                {i + 1}
                                            </div>
                                            {step}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <button onClick={onClose} className="btn btn-primary w-full py-4 mt-8 text-sm font-black shadow-[0_10px_25px_rgba(37,99,235,0.3)] rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98]">
                                {i18n.language === 'ur' ? 'ہو گیا' : 'Done'}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="p-8 text-center">
                        <div className="flex justify-center mb-6 text-green-500">
                            <CheckCircle size={56} />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 mb-2">
                            {i18n.language === 'ur' ? 'ادائیگی کامیاب' : 'Payout Successful'}
                        </h2>
                        <p className="text-sm text-slate-600 mb-8">
                            {i18n.language === 'ur' ? 'کی رقم منتقل کر دی گئی' : 'Your payout of'} <strong className="text-blue-600">Rs. {successData.payout.amount}</strong> {i18n.language === 'ur' ? '' : 'was processed.'}
                        </p>
                        
                        {successData.payout.payout_method.toLowerCase() === 'easypaisa' && (
                            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 mb-8">
                                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest m-0">
                                    {i18n.language === 'ur' ? 'ایزی پیسہ نمبر:' : 'EASYPAISA NUMBER:'}
                                </p>
                                <p className="text-lg font-black text-slate-900 mt-1 m-0">
                                    {successData.payout.account_details}
                                </p>
                            </div>
                        )}
                        
                        <button onClick={onClose} className="btn btn-primary w-full py-4 text-sm font-bold shadow-xl rounded-2xl">
                            {i18n.language === 'ur' ? 'ہو گیا' : 'Done'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PayoutVoucher;
