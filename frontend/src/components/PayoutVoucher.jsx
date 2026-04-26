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
            className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-slate-900/60 backdrop-blur-sm"
            onClick={onClose}
            id="voucher-overlay"
        >
            <div 
                className="bg-white rounded-2xl w-full max-w-sm md:max-w-md mx-auto relative overflow-y-auto max-h-[95vh] shadow-2xl p-4 md:p-8"
                onClick={(e) => e.stopPropagation()}
                style={{ animation: 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)' }}
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
                    <div className="pt-2">
                        <div className="flex justify-between items-end mb-6 border-b border-slate-100 pb-4">
                            <div>
                                <h2 className={`text-xl font-bold text-blue-600 m-0 ${i18n.language === 'ur' ? 'pl-10' : 'pr-10'}`}>
                                    {i18n.language === 'ur' ? 'واؤچر کی تقسیم کا نظام' : 'Voucher Distribution'}
                                </h2>
                                <p className="text-xs text-slate-500 mt-1">
                                    {i18n.language === 'ur' ? 'واؤچر کامیابی سے بن گیا!' : 'Voucher generated successfully!'}
                                </p>
                            </div>
                            <div className="text-right text-[10px] text-slate-500 uppercase font-bold">
                                <div className="flex gap-4">
                                    <span className="w-12 text-center">{i18n.language === 'ur' ? 'فاتح' : 'Winner'}</span>
                                    <span className="w-16 text-right">{i18n.language === 'ur' ? 'کل روپے' : 'Total PKR'}</span>
                                </div>
                                <div className="flex gap-4 mt-1 text-slate-900 font-extrabold text-xs">
                                    <span className="w-12 text-center truncate">{user?.full_name?.split(' ')[0] || 'User'}</span>
                                    <span className="w-16 text-right">{successData.payout.amount.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                        
                        <div className="mb-6 w-full">
                            <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl p-4 md:p-6 text-white relative overflow-hidden shadow-xl"
                                style={{ background: 'linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)' }}>
                                <div className="absolute -top-8 -right-4 w-32 h-32 rounded-full bg-white/10 rotate-[-45deg]"></div>
                                <div className="absolute -bottom-4 -left-4 w-24 h-24 rounded-full bg-white/10"></div>
                                
                                <div className="flex items-center gap-2 mb-6 relative z-10">
                                    <Gift size={24} className="text-yellow-400" />
                                    <h3 className="m-0 text-lg font-bold tracking-wide">
                                        {i18n.language === 'ur' ? 'ڈیجیٹل انعام واؤچر' : 'Digital Reward Voucher'}
                                    </h3>
                                </div>
                                
                                <div className="relative z-10 mb-8">
                                    <p className="m-0 opacity-90 text-sm mb-1">
                                        {i18n.language === 'ur' ? 'مبارک ہو،' : 'Congratulations,'} {user?.full_name?.split(' ')[0] || 'Member'}
                                    </p>
                                    <h2 className="m-0 text-2xl md:text-3xl font-extrabold drop-shadow-md">
                                        PKR {successData.payout.amount.toLocaleString()}
                                    </h2>
                                </div>
                                
                                <div className="flex justify-between items-end relative z-10">
                                    <div>
                                        <p className="m-0 text-[10px] opacity-80 uppercase tracking-widest font-bold">
                                            {i18n.language === 'ur' ? 'تک قابل استعمال:' : 'VALID UNTIL:'}
                                        </p>
                                        <p className="m-0 text-sm font-semibold">
                                            {new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric'})}
                                        </p>
                                    </div>
                                    
                                    <div className="bg-slate-900/40 p-1.5 md:p-2 rounded-xl flex items-center gap-2 md:gap-3 border border-white/20 backdrop-blur-md">
                                        <span className="font-mono text-base md:text-lg font-bold text-yellow-400 tracking-wider">
                                            {successData.payout.account_details}
                                        </span>
                                        <button 
                                            onClick={() => {
                                                navigator.clipboard.writeText(successData.payout.account_details);
                                                alert("Voucher code copied!");
                                            }}
                                            className="bg-transparent border-none text-white cursor-pointer p-0 flex flex-col items-center hover:scale-110 transition-transform"
                                            title="Copy Code"
                                        >
                                            <Copy size={16} />
                                            <span className="text-[7px] md:text-[8px] mt-1 font-bold">{i18n.language === 'ur' ? 'کپی' : 'Copy'}</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="text-left mt-4 md:mt-6 text-sm" dir={i18n.language === 'ur' ? 'rtl' : 'ltr'}>
                                <h4 className="text-blue-600 mb-2 md:mb-4 text-sm md:text-base font-bold border-b border-slate-100 pb-2">
                                    {i18n.language === 'ur' ? 'اپنا انعام کیسے استعمال کریں:' : 'How to use your reward:'}
                                </h4>
                                <ul className="list-none p-0 m-0 text-xs md:text-sm text-slate-600 flex flex-col gap-2 md:gap-4">
                                    <li className="flex items-start gap-3">
                                        <CheckCircle size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                                        <span><strong>{i18n.language === 'ur' ? 'مرحلہ 1:' : 'Step 1:'}</strong> {i18n.language === 'ur' ? 'اوپر والے بٹن سے اپنا خفیہ کوڈ کاپی کریں۔' : 'COPY your code using the button above.'}</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <CheckCircle size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                                        <span><strong>{i18n.language === 'ur' ? 'مرحلہ 2:' : 'Step 2:'}</strong> {i18n.language === 'ur' ? 'دراز شاپنگ ایپ کھولیں اور چیزیں کارٹ میں شامل کریں۔' : 'OPEN the Daraz app and add items to cart.'}</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <CheckCircle size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                                        <span><strong>{i18n.language === 'ur' ? 'مرحلہ 3:' : 'Step 3:'}</strong> {i18n.language === 'ur' ? 'چیک آؤٹ پر یہ کوڈ پیسٹ کریں۔' : 'PASTE the code at checkout.'}</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                        <button onClick={onClose} className="btn btn-primary w-full py-3 mt-4 text-base font-bold shadow-lg">
                            {i18n.language === 'ur' ? 'ہو گیا' : 'Done'}
                        </button>
                    </div>
                ) : (
                    <div className="text-center py-4">
                        <div className="flex justify-center mb-6 text-green-500">
                            <CheckCircle size={64} />
                        </div>
                        <h2 className={`text-2xl font-bold text-slate-900 mb-2 ${i18n.language === 'ur' ? 'pl-10' : 'pr-10'}`}>
                            {i18n.language === 'ur' ? 'ادائیگی کامیاب' : 'Payout Successful'}
                        </h2>
                        <p className="text-slate-600 mb-6">
                            {i18n.language === 'ur' ? 'کی ادائیگی پروسیس ہو گئی۔' : 'Your payout of'} <strong className="text-blue-600">Rs. {successData.payout.amount}</strong> {i18n.language === 'ur' ? '' : 'was processed.'}
                        </p>
                        
                        {successData.payout.payout_method.toLowerCase() === 'easypaisa' && (
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-8">
                                <p className="text-sm text-slate-500 m-0">
                                    {i18n.language === 'ur' ? 'فنڈز مندرجہ ذیل ایزی پیسہ نمبر پر ٹرانسفر کے لیے قطار میں ہیں:' : 'The funds have been queued for transfer to Easypaisa number:'}
                                </p>
                                <p className="text-lg font-bold text-slate-900 mt-2 m-0">
                                    {successData.payout.account_details}
                                </p>
                            </div>
                        )}
                        
                        <button onClick={onClose} className="btn btn-primary w-full py-3 text-base font-bold shadow-lg">
                            {i18n.language === 'ur' ? 'ہو گیا' : 'Done'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PayoutVoucher;
