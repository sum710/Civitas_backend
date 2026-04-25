import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Users, 
  Calendar, 
  ChevronLeft, 
  CheckCircle,
  Clock,
  ArrowRight,
  Activity,
  CreditCard,
  TrendingUp,
  Crown,
  Volume2,
  Square
} from 'lucide-react';
import SpinningWheel from '../components/SpinningWheel';
import MakeContributionModal from '../components/MakeContributionModal';
import RequestPayoutModal from '../components/RequestPayoutModal';
import { useAuth } from '../context/AuthContext';
import useVoiceAssistant from '../hooks/useVoiceAssistant';
import './CommitteeDashboard.css';

const CommitteeDashboard = () => {
    const { id } = useParams();
    const { t, i18n } = useTranslation();
    const { user } = useAuth();
    const [committee, setCommittee] = useState(null);
    const [members, setMembers] = useState([]);
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [spinning, setSpinning] = useState(false);
    const [winner, setWinner] = useState(null);
    const [showPayModal, setShowPayModal] = useState(false);
    const [showPayoutModal, setShowPayoutModal] = useState(false);
    const [isPaying, setIsPaying] = useState(false);
    const { speak, isSpeaking } = useVoiceAssistant();

    const handleReadPayout = () => {
        const languageCode = i18n.language === 'ur' ? 'ur-PK' : 'en-US';
        const userName = user?.full_name || 'Member';
        const slotNumber = userMember?.slot_number;
        
        if (userMember?.has_received_payout) {
            speak(t('common.payout_claimed'), languageCode);
            return;
        }

        if (!slotNumber) {
            speak(t('common.payout_slot_pending'), languageCode);
            return;
        }

        const estimatedMonth = new Date(new Date(committee.start_date).setMonth(new Date(committee.start_date).getMonth() + slotNumber - 1))
            .toLocaleDateString(i18n.language === 'ur' ? 'ur-PK' : 'en-US', { month: 'long', year: 'numeric' });

        const text = t('common.payout_scheduled', { name: userName, month: estimatedMonth, slot: slotNumber });
        
        speak(text, languageCode);
    };

    const currentMonthName = new Date().toLocaleString(i18n.language === 'ur' ? 'ur-PK' : 'en-US', { month: 'long' });

    const handlePayment = async () => {
        setIsPaying(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://127.0.0.1:3000/api/payments/contribute', {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    committee_id: committee.id,
                    amount: committee.slot_amount,
                    month: currentMonthName
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || data.message || t('common.error'));
            }

            alert(t('common.contribution_success'));
            fetchData();
        } catch (err) {
            console.error("Payment error:", err);
            
            // Translate common backend errors
            let translatedMsg = err.message;
            if (i18n.language === 'ur') {
                if (err.message.includes('already made your contribution')) {
                    translatedMsg = 'آپ نے اس ماہ اس کمیٹی کے لیے پہلے ہی ادائیگی کر دی ہے۔';
                } else if (err.message.includes('Insufficient wallet balance')) {
                    translatedMsg = 'آپ کے والیٹ میں ناکافی بیلنس ہے۔';
                }
            }
            alert(translatedMsg);
        } finally {
            setIsPaying(false);
        }
    };

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await fetch(`http://127.0.0.1:3000/api/committees/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error(t('common.error'));
            const data = await response.json();
            setCommittee(data.committee);
            setMembers(data.members);

            // Fetch logs for all members
            const logsRes = await fetch(`http://127.0.0.1:3000/api/logs/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const logsData = await logsRes.json();
            if (logsData.success) {
                setLogs(logsData.logs);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [id, t, user?.id]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleDrawWinner = async () => {
        if (spinning) return;
        setSpinning(true);
        setWinner(null);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://127.0.0.1:3000/api/committees/${id}/draw`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (response.ok) setWinner(data.winner);
            else { alert(data.message || t('common.error')); setSpinning(false); }
        } catch (err) { 
            alert(t('common.error'));
            setSpinning(false); 
        }
    };

    const onWheelFinished = () => {
        setSpinning(false);
        fetchData(); 
    };

    const getBilingualText = (text) => {
        if (!text) return '';
        if (!text.includes('|')) return text;
        const parts = text.split('|');
        return i18n.language === 'ur' ? (parts[1] || parts[0]).trim() : parts[0].trim();
    };

    if (loading) return <div className="container" style={{paddingTop:'4rem'}}>{t('common.loading')}</div>;
    if (error) return <div className="container" style={{paddingTop:'4rem', color:'red'}}>{error}</div>;

    const isLeader = committee?.created_by === user?.id;
    const userMember = members.find(m => m.user_id === user?.id);
    const eligibleCount = members.filter(m => !m.slot_number && m.user_id !== committee.created_by).length;

    const isPaidThisMonth = userMember?.is_paid_this_month;

    const translateLogDescription = (desc) => {
        if (!desc || i18n.language !== 'ur') return desc;
        
        if (desc.includes('made a contribution of PKR')) {
            const amountMatch = desc.match(/PKR\s(\d+)/);
            const amount = amountMatch ? amountMatch[1] : '';
            return `نے ${amount} روپے کی شراکت ادا کی`;
        }
        if (desc.includes('requested a payout of PKR')) {
            const amountMatch = desc.match(/PKR\s(\d+)/);
            const amount = amountMatch ? amountMatch[1] : '';
            return `نے ${amount} روپے کی ادائیگی کی درخواست کی`;
        }
        if (desc.includes('was assigned payout slot')) {
            const slotMatch = desc.match(/#(\d+)/);
            const slot = slotMatch ? slotMatch[1] : '';
            return `کو ادائیگی کا سلاٹ #${slot} تفویض کیا گیا`;
        }
        if (desc.includes('created the committee')) {
            return `نے کمیٹی بنائی`;
        }
        if (desc.includes('spun the wheel')) {
            return `نے قسمت کا پہیہ گھمایا`;
        }
        if (desc.includes('sent') && desc.includes('payment reminders')) {
            return `نے ادائیگی کی یاددہانی بھیجی`;
        }
        if (desc.includes('marked payment as Paid')) {
            return `نے ادائیگی کو ادا شدہ کے طور پر نشان زد کیا`;
        }
        return desc;
    };

    const formatLogTime = (dateStr) => {
        return new Date(dateStr).toLocaleTimeString(i18n.language === 'ur' ? 'ur-PK' : 'en-US', { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="container mx-auto committee-dashboard-page pb-10">
            <div className="dashboard-nav">
                <Link to="/committees" className="back-link">
                    <ChevronLeft size={20} />
                    {t('committee_dashboard.back_to')}
                </Link>
            </div>

            <div className="committee-hero gradient-glass h-auto py-6 md:py-10 overflow-hidden">
                <div className="hero-main">
                    <h1 className="text-white">{getBilingualText(committee.title)}</h1>
                    <div className="hero-meta">
                        <span className={`status-badge ${committee.status.toLowerCase()}`}>
                            {committee.status.toLowerCase() === 'pending' ? t('common.pending') : t('common.active')}
                        </span>
                        <span className="meta-item">
                            <Users size={16} /> {members.length} / {committee.max_members} {t('committee_dashboard.capacity')}
                        </span>
                        <span className="meta-item">
                            <Calendar size={16} /> {t('committee_dashboard.start_date')}: {new Date(committee.start_date).toLocaleDateString()}
                        </span>
                    </div>
                    {committee.visibility === 'private' && (
                        <div className="invite-box-inline mt-4">
                            <p>{t('committee_dashboard.invite_notice')} <span className="code-display-small">{committee.invite_code}</span></p>
                        </div>
                    )}
                </div>
            </div>

            {/* Phase 1: The Main Grid Wrapper (Responsive: 1 -> 2 -> 3 columns) */}
            <div className="dashboard-main-grid-wrapper grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start mt-8">
                
                {/* Phase 2: Left Column (Spans 1 on tablet, 2 on desktop) */}
                <div className="dashboard-left-col md:col-span-1 lg:col-span-2 flex flex-col gap-6 w-full pb-6">
                    
                    {/* Monthly Contribution */}
                    <div className="card w-full shadow-sm">
                        <div className="card-header-flex">
                            <h3>{t('dashboard.monthly_contribution')}</h3>
                            <Clock size={20} className="text-primary-blue" />
                        </div>
                        <div className="monthly-status-unit">
                            <div className="pending-payment-box">
                                <div className="payment-info">
                                    <p className="month-label font-bold text-primary-blue">{currentMonthName} {i18n.language === 'ur' ? 'کی قسط' : 'Installment'}</p>
                                    <p className="amount-label text-lg md:text-xl font-black">Rs. {committee.slot_amount.toLocaleString()}</p>
                                </div>
                                <button 
                                    className={`btn w-full ${isPaidThisMonth 
                                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200 transition-none' 
                                        : 'btn-primary'}`}
                                    style={{marginTop: '10px'}} 
                                    onClick={handlePayment}
                                    disabled={isPaying || isPaidThisMonth}
                                >
                                    {isPaying 
                                        ? (i18n.language === 'ur' ? 'پروسیسنگ...' : 'Processing...') 
                                        : isPaidThisMonth 
                                            ? `✓ ${t('common.paid')} - ${currentMonthName}` 
                                            : t('committee_dashboard.pay_now')}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Committee Roster */}
                    <div className="card w-full max-w-full roster-card shadow-sm mt-8 z-10 overflow-hidden">
                        <h3>{t('committee_dashboard.roster')}</h3>
                        <div className="table-container overflow-x-auto w-full">
                            <table className="roster-table">
                                <thead>
                                    <tr>
                                        <th>{t('committee_dashboard.slot')}</th>
                                        <th>{t('committee_dashboard.member_name')}</th>
                                        <th>{t('common.status')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {members.map((m, idx) => (
                                        <tr key={idx} className={m.user_id === user?.id ? 'highlight-row' : ''}>
                                            <td>{`#${idx + 1}`}</td>
                                            <td>
                                                <div className="member-cell">
                                                    <div className="member-identity-flex">
                                                        <span className="member-name">{m.name} {m.user_id === user?.id ? t('common.you') : ''}</span>
                                                        <div className="badge-group-flex">
                                                            {m.user_id === committee.created_by && (
                                                                <span className="admin-tag-premium w-fit">
                                                                    <Crown size={10} /> {t('common.admin')}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                {m.has_received_payout ? (
                                                    <span className="badge paid whitespace-nowrap">{t('committee_dashboard.payout_won')}</span>
                                                ) : m.slot_number ? (
                                                    <span className="badge upcoming whitespace-nowrap">{t('common.active', 'Active')}</span>
                                                ) : (
                                                    <span className="badge waiting whitespace-nowrap">{t('committee_dashboard.draw_pending')}</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Draw Next Winner (Moved to Left Column) */}
                    <div className="w-full max-w-md mx-auto mt-6">
                        <div className="card wheel-card p-4">
                            <div className="card-header-flex">
                                <div>
                                    <h3 className="mb-1">{t('committee_dashboard.draw_winner')}</h3>
                                    {isLeader && eligibleCount > 0 && !spinning && (
                                        <p className="text-xs text-blue-500 font-bold">{eligibleCount} {i18n.language === 'ur' ? 'ممبران اہل ہیں' : 'members eligible'}</p>
                                    )}
                                </div>
                                {isLeader && eligibleCount > 0 && !spinning && (
                                    <button className="btn btn-gold btn-xs" onClick={handleDrawWinner}>
                                        <TrendingUp size={14} /> {i18n.language === 'ur' ? 'گھمائیں' : 'SPIN'}
                                    </button>
                                )}
                            </div>
                            <div className="wheel-sidebar-content flex items-center justify-center w-full">
                                <div className="wheel-aspect-wrapper-sidebar w-full flex items-center justify-center">
                                    <SpinningWheel 
                                        members={members.filter(m => !m.slot_number && m.user_id !== committee.created_by)} 
                                        winner={winner}
                                        isSpinning={spinning}
                                        onFinished={onWheelFinished}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="dashboard-right-sidebar md:col-span-1 space-y-6 w-full">
                    
                    {/* My Status */}
                    <div className="card w-full shadow-sm">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="m-0">{t('committee_dashboard.my_status')}</h3>
                            <button 
                                onClick={handleReadPayout}
                                className={`p-2 rounded-full transition-all duration-300 ${isSpeaking ? 'animate-pulse text-blue-600 bg-blue-50' : 'text-slate-400 hover:text-blue-500 hover:bg-slate-50'}`}
                                title={i18n.language === 'ur' ? "اسٹیٹس پڑھیں" : "Read Status"}
                            >
                                {isSpeaking ? <Square size={20} fill="currentColor" /> : <Volume2 size={20} />}
                            </button>
                        </div>
                        <div className="status-content">
                            <div className="stat-row">
                                <span className="stat-label">{t('committee_dashboard.your_payout_slot')}</span>
                                <span className="stat-value">{userMember?.slot_number ? `#${userMember.slot_number}` : t('committee_dashboard.draw_pending')}</span>
                            </div>
                            <div className="stat-row">
                                <span className="stat-label">{t('committee_dashboard.est_payout')}</span>
                                <span className="stat-value">
                                    {userMember?.slot_number 
                                        ? new Date(new Date(committee.start_date).setMonth(new Date(committee.start_date).getMonth() + userMember.slot_number - 1)).toLocaleDateString(i18n.language === 'ur' ? 'ur-PK' : 'en-US', {month:'long', year:'numeric'})
                                        : '---'}
                                </span>
                            </div>
                            {userMember?.slot_number && !userMember?.has_received_payout && (
                                <div className="mt-4 pt-4" style={{borderTop: '1px solid #f1f5f9'}}>
                                    <button 
                                        className="btn btn-primary" 
                                        style={{width: '100%', display: 'flex', justifyContent: 'center', gap: '8px'}}
                                        onClick={() => setShowPayoutModal(true)}
                                    >
                                        {i18n.language === 'ur' ? 'ادائیگی کی درخواست کریں' : 'Request Payout'}
                                    </button>
                                </div>
                            )}
                            {userMember?.has_received_payout && (
                                <div className="mt-4 pt-4" style={{borderTop: '1px solid #f1f5f9'}}>
                                    <div className="paid-success-box" style={{padding: '10px'}}>
                                        <CheckCircle size={20} className="text-green-500" />
                                        <span className="text-sm font-bold text-green-600">{i18n.language === 'ur' ? 'رقم وصول کر لی گئی' : 'Payout Claimed'}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Recent Activity */}
                    {logs.length > 0 && (
                        <div className="card w-full shadow-sm activity-logs-card">
                            <div className="card-header-flex">
                                <h3>{t('common.recent_activity')}</h3>
                                <Activity size={20} className="text-primary-blue" />
                            </div>
                            <div className="logs-container">
                                {logs.map((log, i) => (
                                    <div key={i} className="log-entry border-b border-slate-100 pb-3 mb-3 last:border-0">
                                        <div className="text-xs text-slate-500 mb-1">
                                            {formatLogTime(log.created_at)}
                                        </div>
                                        <p className="text-sm text-slate-700" dir={i18n.language === 'ur' ? 'rtl' : 'ltr'}>
                                            <span className="font-semibold text-slate-900">{log.user?.full_name}</span> 
                                            {" "}{translateLogDescription(log.description)}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {showPayModal && (
                <MakeContributionModal 
                    committee={committee}
                    onClose={() => setShowPayModal(false)}
                    onSuccess={() => {
                        setShowPayModal(false);
                        fetchData();
                    }}
                />
            )}

            {showPayoutModal && (
                <RequestPayoutModal 
                    isOpen={showPayoutModal}
                    committee={committee}
                    onClose={() => setShowPayoutModal(false)}
                    onPayoutSuccess={(newBal, amount) => {
                        // User can close the success state themselves
                        fetchData();
                    }}
                />
            )}
        </div>
    );
};

export default CommitteeDashboard;
