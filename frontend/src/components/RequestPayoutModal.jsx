import React, { useState, useEffect } from 'react';
import { X, Loader2, CheckCircle, Gift, Copy } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';

const RequestPayoutModal = ({ isOpen, onClose, onPayoutSuccess, committee }) => {
    const { user } = useAuth();
    const { i18n } = useTranslation();
    const [myCommittees, setMyCommittees] = useState([]);
    const [selectedCommitteeId, setSelectedCommitteeId] = useState('');
    const [loading, setLoading] = useState(false);
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

    const fetchCommittees = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('https://civitas-api-d6ox.onrender.com/api/committees/my', {
                headers: { Authorization: `Bearer ${token}` }
            });

            const data = await response.json();
            if (response.ok) {
                setMyCommittees(data);
            } else {
                console.error("Failed to fetch committees");
            }
        } catch (err) {
            console.error("Error connecting to server:", err);
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
            const token = localStorage.getItem('token');
            const response = await fetch('https://civitas-api-d6ox.onrender.com/api/payments/payout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
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

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.6)', zIndex: 1000,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backdropFilter: 'blur(8px)',
            animation: 'fadeIn 0.3s ease-out'
        }}>
            <div className="card" style={{
                width: '100%', maxWidth: '450px', position: 'relative', margin: '20px', backgroundColor: 'var(--bg-white)', padding: '2rem',
                animation: 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
            }}>
                <button
                    onClick={onClose}
                    style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-gray)' }}
                >
                    <X size={20} />
                </button>

                {successData ? (
                    <div style={{ textAlign: 'center', paddingTop: '10px' }}>
                        {successData.payout.payout_method.toLowerCase() === 'daraz' ? (
                            <div style={{ textAlign: 'left' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '20px', borderBottom: '1px solid #e5e7eb', paddingBottom: '10px' }}>
                                    <div>
                                        <h2 style={{ fontSize: '1.2rem', margin: 0, color: 'var(--primary-blue)' }}>{i18n.language === 'ur' ? 'واؤچر کی تقسیم کا نظام' : 'Voucher Distribution System'}</h2>
                                        <p style={{ margin: '5px 0 0 0', fontSize: '0.8rem', color: 'var(--text-gray)' }}>{i18n.language === 'ur' ? 'واؤچر کامیابی سے بن گیا!' : 'Voucher generated successfully!'}</p>
                                    </div>
                                    <div style={{ textAlign: 'right', fontSize: '0.75rem', color: 'var(--text-gray)' }}>
                                        <div style={{ display: 'flex', gap: '15px', textTransform: 'uppercase', fontWeight: 'bold' }}>
                                            <span style={{ width: '45px', textAlign: 'center' }}>{i18n.language === 'ur' ? 'فاتح' : 'Winner'}</span>
                                            <span style={{ width: '40px', textAlign: 'center' }}>{i18n.language === 'ur' ? 'حیثیت' : 'Status'}</span>
                                            <span style={{ width: '60px', textAlign: 'right' }}>{i18n.language === 'ur' ? 'کل روپے' : 'Total PKR'}</span>
                                        </div>
                                        <div style={{ display: 'flex', gap: '15px', marginTop: '4px', fontWeight: '800', color: '#111827' }}>
                                            <span style={{ width: '45px', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.full_name?.split(' ')[0] || 'User'}</span>
                                            <span style={{ width: '40px', textAlign: 'center', color: '#10B981' }}>{i18n.language === 'ur' ? 'جاری' : 'Issued'}</span>
                                            <span style={{ width: '60px', textAlign: 'right' }}>{successData.payout.amount.toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div style={{ marginBottom: '25px', width: '100%' }}>
                                    <div style={{
                                        background: 'linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)',
                                        borderRadius: '16px',
                                        padding: '24px',
                                        color: 'white',
                                        position: 'relative',
                                        overflow: 'hidden',
                                        boxShadow: '0 10px 25px rgba(124, 58, 237, 0.25)',
                                        textAlign: 'left'
                                    }}>
                                        <div style={{ position: 'absolute', top: '-30px', right: '-10px', width: '150px', height: '150px', borderRadius: '50%', background: 'linear-gradient(180deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 100%)', transform: 'rotate(-45deg)' }}></div>
                                        <div style={{ position: 'absolute', bottom: '-20px', left: '-20px', width: '100px', height: '100px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 70%)' }}></div>
                                        
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '25px', position: 'relative', zIndex: 1 }}>
                                            <Gift size={24} color="#FCD34D" />
                                            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '600', letterSpacing: '0.5px' }}>{i18n.language === 'ur' ? 'ڈیجیٹل انعام واؤچر' : 'Digital Reward Voucher'}</h3>
                                        </div>
                                        
                                        <div style={{ position: 'relative', zIndex: 1 }}>
                                            <p style={{ margin: 0, opacity: 0.9, fontSize: '0.9rem', marginBottom: '2px' }}>{i18n.language === 'ur' ? 'مبارک ہو،' : 'Congratulations,'} {user?.full_name?.split(' ')[0] || 'Member'}</p>
                                            <h2 style={{ margin: 0, fontSize: '2.2rem', fontWeight: '800', textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>PKR {successData.payout.amount.toLocaleString()}</h2>
                                        </div>
                                        
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '35px', position: 'relative', zIndex: 1 }}>
                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                <p style={{ margin: 0, fontSize: '0.7rem', opacity: 0.8, textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '600' }}>
                                                    {i18n.language === 'ur' ? 'تک قابل استعمال:' : 'VALID UNTIL:'}
                                                </p>
                                                <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: '500' }}>
                                                    {new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric'})}
                                                </p>
                                            </div>
                                            
                                            <div style={{ 
                                                background: 'rgba(15, 23, 42, 0.4)', 
                                                padding: '8px 12px', 
                                                borderRadius: '8px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '12px',
                                                border: '1px solid rgba(255,255,255,0.15)',
                                                backdropFilter: 'blur(4px)'
                                            }}>
                                                <span style={{ fontFamily: 'monospace', fontSize: '1.1rem', fontWeight: 'bold', color: '#FCD34D', letterSpacing: '1.5px' }}>
                                                    {successData.payout.account_details}
                                                </span>
                                                <button 
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(successData.payout.account_details);
                                                        alert("Voucher code copied to clipboard!");
                                                    }}
                                                    style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', transition: 'transform 0.2s' }}
                                                    title="Copy Code"
                                                >
                                                    <Copy size={16} />
                                                    <span style={{ fontSize: '0.5rem', marginTop: '3px', fontWeight: 'bold' }}>{i18n.language === 'ur' ? 'کپی کریں' : 'Copy Code'}</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div style={{ textAlign: 'left', marginTop: '20px' }} dir={i18n.language === 'ur' ? 'rtl' : 'ltr'}>
                                        <h4 style={{ color: '#2563EB', marginBottom: '16px', fontSize: '1.05rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '8px' }}>{i18n.language === 'ur' ? 'اپنا انعام کیسے استعمال کریں:' : 'How to use your reward:'}</h4>
                                        <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.9rem', color: '#4B5563', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                            <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                                                <CheckCircle size={18} color="#10B981" style={{ marginTop: '1px', flexShrink: 0 }} />
                                                <span><strong>{i18n.language === 'ur' ? 'مرحلہ 1:' : 'Step 1:'}</strong> {i18n.language === 'ur' ? 'اوپر والے بٹن سے اپنا خفیہ کوڈ کاپی کریں۔' : 'COPY your secret code using the button above.'}</span>
                                            </li>
                                            <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                                                <CheckCircle size={18} color="#10B981" style={{ marginTop: '1px', flexShrink: 0 }} />
                                                <span><strong>{i18n.language === 'ur' ? 'مرحلہ 2:' : 'Step 2:'}</strong> {i18n.language === 'ur' ? 'دراز شاپنگ ایپ کھولیں اور چیزیں کارٹ میں شامل کریں۔' : 'OPEN the Daraz shopping app and add items to your cart.'}</span>
                                            </li>
                                            <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                                                <CheckCircle size={18} color="#10B981" style={{ marginTop: '1px', flexShrink: 0 }} />
                                                <span><strong>{i18n.language === 'ur' ? 'مرحلہ 3:' : 'Step 3:'}</strong> {i18n.language === 'ur' ? 'چیک آؤٹ پر "Enter Voucher Code" کی جگہ یہ کوڈ پیسٹ کریں۔' : 'PASTE the code in the "Enter Voucher Code" field at checkout.'}</span>
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                                <button onClick={onClose} className="btn btn-primary" style={{ width: '100%' }}>
                                    {i18n.language === 'ur' ? 'ہو گیا' : 'Done'}
                                </button>
                            </div>
                        ) : (
                            <>
                                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '15px', color: '#10b981' }}>
                                    <CheckCircle size={48} />
                                </div>
                                <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--primary-blue)' }}>{i18n.language === 'ur' ? 'ادائیگی کامیاب' : 'Payout Successful'}</h2>
                                <p style={{ marginBottom: '1rem', color: 'var(--text-gray)' }}>
                                    {i18n.language === 'ur' ? 'کی ادائیگی پروسیس ہو گئی۔' : 'Your payout of'} <strong>Rs. {successData.payout.amount}</strong> {i18n.language === 'ur' ? '' : 'was processed.'}
                                </p>
                                
                                {successData.payout.payout_method.toLowerCase() === 'easypaisa' && (
                                    <p style={{ marginBottom: '20px', color: 'var(--text-gray)' }}>
                                        {i18n.language === 'ur' ? 'فنڈز مندرجہ ذیل ایزی پیسہ نمبر پر ٹرانسفر کے لیے قطار میں ہیں:' : 'The funds have been queued for transfer to Easypaisa number:'} <strong>{successData.payout.account_details}</strong>
                                    </p>
                                )}
                                
                                <button onClick={onClose} className="btn btn-primary" style={{ width: '100%' }}>
                                    {i18n.language === 'ur' ? 'ہو گیا' : 'Done'}
                                </button>
                            </>
                        )}
                    </div>
                ) : (
                    <>
                        <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: 'var(--primary-blue)' }} dir={i18n.language==='ur'?'rtl':'ltr'}>{i18n.language === 'ur' ? 'ادائیگی کی درخواست کریں' : 'Request Payout'}</h2>

                        {error && (
                            <div style={{ padding: '10px', backgroundColor: '#fee2e2', color: '#991b1b', borderRadius: '6px', marginBottom: '15px', fontSize: '0.9rem' }} dir={i18n.language==='ur'?'rtl':'ltr'}>
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }} dir={i18n.language==='ur'?'rtl':'ltr'}>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label>{i18n.language === 'ur' ? 'کمیٹی منتخب کریں' : 'Select Committee'}</label>
                                {committee ? (
                                    <input 
                                        type="text"
                                        value={i18n.language === 'ur' ? `سے درخواست کی جا رہی ہے: ${committee.title || committee.name}` : `Requesting from: ${committee.title || committee.name}`}
                                        readOnly
                                        style={{ backgroundColor: '#e5e7eb', color: '#6b7280', cursor: 'not-allowed', width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ced4da' }}
                                    />
                                ) : (
                                    <select
                                        value={selectedCommitteeId}
                                        onChange={handleCommitteeChange}
                                        required
                                    >
                                        <option value="" disabled>{i18n.language === 'ur' ? '-- کمیٹی منتخب کریں --' : '-- Select a committee --'}</option>
                                        {myCommittees.map((c) => (
                                            <option key={c.id} value={c.id}>
                                                {c.title || c.name} ({i18n.language === 'ur' ? 'کل رقم: PKR' : 'Pot: PKR'} {c.total_amount})
                                            </option>
                                        ))}
                                    </select>
                                )}
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-gray)', marginTop: '5px' }}>
                                    {i18n.language === 'ur' ? 'آپ ہر کمیٹی سے صرف ایک بار رقم مانگ سکتے ہیں۔ فنڈز سیدھے آپ کے والیٹ میں شامل کر دیے جائیں گے۔' : 'You can only request one payout per committee. The funds will be added directly to your wallet.'}
                                </p>
                            </div>

                            <div style={{ marginBottom: '5px' }}>
                                <label style={{ display: 'block', marginBottom: '10px', fontWeight: '500' }}>{i18n.language === 'ur' ? 'طریقہ ادائیگی' : 'Payout Method'}</label>
                                <div style={{ display: 'flex', gap: '15px' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                        <input 
                                            type="radio" 
                                            value="easypaisa" 
                                            checked={payoutMethod === 'easypaisa'} 
                                            onChange={(e) => setPayoutMethod(e.target.value)} 
                                        />
                                        {i18n.language === 'ur' ? 'ایزی پیسہ ٹرانسفر' : 'Easypaisa Transfer'}
                                    </label>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                        <input 
                                            type="radio" 
                                            value="daraz" 
                                            checked={payoutMethod === 'daraz'} 
                                            onChange={(e) => setPayoutMethod(e.target.value)} 
                                        />
                                        {i18n.language === 'ur' ? 'دراز واؤچر' : 'Daraz E-Voucher'}
                                    </label>
                                </div>
                            </div>
                            
                            {payoutMethod === 'easypaisa' && (
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label>{i18n.language === 'ur' ? 'ایزی پیسہ موبائل نمبر' : 'Easypaisa Mobile Number'}</label>
                                    <input
                                        type="tel"
                                        value={easypaisaNumber}
                                        onChange={(e) => setEasypaisaNumber(e.target.value)}
                                        placeholder="03xxxxxxxxx"
                                        required={payoutMethod === 'easypaisa'}
                                    />
                                </div>
                            )}

                            {payoutMethod === 'daraz' && (
                                <div style={{ padding: '12px', backgroundColor: '#f3f4f6', borderRadius: '6px', fontSize: '0.9rem', color: 'var(--text-gray)' }}>
                                    {i18n.language === 'ur' ? 'آپ کی کل رقم کے برابر ایک منفرد دراز واؤچر فوراً بن جائے گا۔' : 'A unique Daraz voucher equivalent to your pot amount will be generated instantly.'}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading || !selectedCommitteeId}
                                className="btn btn-primary"
                                style={{
                                    width: '100%',
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    opacity: (loading || !selectedCommitteeId) ? 0.6 : 1,
                                    cursor: (loading || !selectedCommitteeId) ? 'not-allowed' : 'pointer',
                                    marginTop: '10px'
                                }}
                            >
                                {loading ? <Loader2 size={20} className="animate-spin" /> : (i18n.language === 'ur' ? 'درخواست جمع کرائیں' : 'Request Payout')}
                            </button>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
};

export default RequestPayoutModal;
