import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Users, Wallet, Volume2, Square } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import MakeContributionModal from './MakeContributionModal';
import RequestPayoutModal from './RequestPayoutModal';
import useVoiceAssistant from '../hooks/useVoiceAssistant';
import TrustScoreCard from './TrustScoreCard';

const Dashboard = () => {
    const { t, i18n } = useTranslation();
    const { user } = useAuth();
    const [isContributionModalOpen, setIsContributionModalOpen] = useState(false);
    const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);
    const { speak, isSpeaking } = useVoiceAssistant();
    const [walletBalance, setWalletBalance] = useState(0);
    const [isLoadingBalance, setIsLoadingBalance] = useState(true);
    const [balanceError, setBalanceError] = useState(null);

    const [committees, setCommittees] = useState([]);
    const [isLoadingCommittees, setIsLoadingCommittees] = useState(true);
    const [committeesError, setCommitteesError] = useState(null);

    // Fetch Wallet Balance
    useEffect(() => {
        const fetchWalletBalance = async () => {
            try {
                setIsLoadingBalance(true);
                setBalanceError(null);
                const token = localStorage.getItem('token');
                const response = await fetch('https://civitas-api-d6ox.onrender.com/api/users/wallet-balance', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const data = await response.json();
                if (response.ok && data.success) {
                    setWalletBalance(data.balance || 0);
                } else {
                    setBalanceError(data.message || t('common.error'));
                }
            } catch (err) {
                console.error("Wallet Fetch Error:", err);
                setBalanceError(t('common.error'));
            } finally {
                setIsLoadingBalance(false);
            }
        };

        fetchWalletBalance();
    }, [t]);

    // Fetch User's Active Committees
    useEffect(() => {
        const fetchCommittees = async () => {
            try {
                setIsLoadingCommittees(true);
                setCommitteesError(null);
                const token = localStorage.getItem('token');
                const response = await fetch('https://civitas-api-d6ox.onrender.com/api/committees/my', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const data = await response.json();
                
                if (response.ok) {
                    setCommittees(data || []);
                } else {
                    setCommitteesError(data.message || t('common.error'));
                }
            } catch (err) {
                console.error("Committees Fetch Error:", err);
                setCommitteesError(t('common.error'));
            } finally {
                setIsLoadingCommittees(false);
            }
        };

        fetchCommittees();
    }, [t]);

    const handleContributionSuccess = (newBalance) => {
        setWalletBalance(newBalance);
        alert(t('common.success'));
    };

    const handlePayoutSuccess = (newBalance, payoutAmount) => {
        setWalletBalance(newBalance);
        alert(t('common.payout_request_success', { amount: payoutAmount }));
    };

    const handleDeposit = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('https://civitas-api-d6ox.onrender.com/api/users/deposit', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}` 
                },
                body: JSON.stringify({ amount: 50000 })
            });
            const data = await response.json();
            if (response.ok && data.success) {
                setWalletBalance(data.balance);
                alert(t('common.deposit_success', { amount: '50,000' }));
            } else {
                alert(`${t('common.error')}: ${data.message}`);
            }
        } catch (err) {
            console.error("Deposit Error:", err);
            alert(t('common.error'));
        }
    };

    const getBilingualTitle = (title) => {
        if (!title) return '';
        if (!title.includes('|')) return title;
        const parts = title.split('|');
        return i18n.language === 'ur' ? (parts[1] || parts[0]).trim() : parts[0].trim();
    };

    const handleOpenContributionModal = () => {
        try {
            setIsContributionModalOpen(true);
        } catch (error) {
            console.error(error);
            alert(t('common.payment_module_unavailable'));
        }
    };

    const handleReadWallet = () => {
        const languageCode = i18n.language === 'ur' ? 'ur-PK' : 'en-US';
        const text = t('common.wallet_announcement', { balance: walletBalance });
        speak(text, languageCode);
    };

    return (
        <section className="dashboard-section bg-slate-50 min-h-screen py-4 md:py-8" id="dashboard">
            <div className="flex flex-col gap-6 p-4 max-w-7xl mx-auto overflow-hidden">
                {/* Top Section: Trust Score and Wallet */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Trust Score Card */}
                    <div className="bg-white rounded-xl shadow-sm overflow-hidden h-full border border-slate-100 hover:shadow-md transition-shadow">
                        <TrustScoreCard />
                    </div>

                    {/* Wallet / Quick Actions Card */}
                    <div className="bg-white rounded-xl shadow-sm overflow-hidden h-full p-6 md:p-8 border border-slate-100 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="m-0 text-xl font-bold flex items-center gap-2">
                                <Wallet size={24} className="text-blue-600" /> {t('common.wallet_balance')}
                            </h2>
                            <button 
                                onClick={handleReadWallet}
                                className={`p-2 rounded-full transition-all duration-300 ${isSpeaking ? 'animate-pulse text-blue-600 bg-blue-50' : 'text-slate-400 hover:text-blue-500 hover:bg-slate-50'}`}
                                title={i18n.language === 'ur' ? "بیلنس سنیں" : "Read Balance"}
                            >
                                {isSpeaking ? <Square size={20} fill="currentColor" /> : <Volume2 size={20} />}
                            </button>
                        </div>
                        
                        <div className="flex flex-col gap-4">
                            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 mb-2">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <small className="text-slate-500 block mb-1 uppercase tracking-wider font-semibold text-[10px]">{t('common.wallet_balance')}</small>
                                        {isLoadingBalance ? (
                                            <h3 className="text-slate-400 text-lg animate-pulse">{t('common.loading')}</h3>
                                        ) : balanceError ? (
                                            <h3 className="text-red-500 text-base">{balanceError}</h3>
                                        ) : (
                                            <h3 className="m-0 text-2xl font-extrabold text-slate-900">{new Intl.NumberFormat(i18n.language === 'ur' ? 'ur-PK' : 'en-PK', { style: 'currency', currency: 'PKR' }).format(walletBalance)}</h3>
                                        )}
                                    </div>
                                    <button 
                                        className="btn btn-accent px-4 py-2 text-sm shadow-sm" 
                                        onClick={handleDeposit}
                                    >
                                        + {t('common.top_up')}
                                    </button>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3">
                                <button className="btn btn-primary py-3 text-sm font-bold" onClick={handleOpenContributionModal}>
                                    {t('common.make_contribution')}
                                </button>
                                <button className="btn py-3 text-sm font-bold bg-white border-2 border-slate-200 text-slate-700 hover:border-blue-600 hover:text-blue-600 transition-all" onClick={() => setIsPayoutModalOpen(true)}>
                                    {t('common.payout')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Active Committees Section */}
                <div className="bg-white rounded-xl shadow-sm overflow-hidden p-6 md:p-8">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                        <h2 className="text-2xl font-bold flex items-center gap-3 m-0 text-slate-900">
                            <span className="p-2 bg-blue-100 rounded-lg text-blue-600 flex items-center justify-center">
                                <Users size={24} />
                            </span>
                            {t('common.active_committees')}
                        </h2>
                        <Link to="/committees" className="btn btn-text text-blue-600 hover:text-blue-800 font-bold p-0 flex items-center gap-2 group transition-all">
                            {t('common.view_all')}
                            <span className="group-hover:translate-x-1 transition-transform">→</span>
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {isLoadingCommittees ? (
                            Array(3).fill(0).map((_, i) => (
                                <div key={i} className="card h-48 skeleton-pulse opacity-50"></div>
                            ))
                        ) : committeesError ? (
                            <div className="col-span-full py-12 text-center text-red-500 card bg-red-50 border-red-100">{committeesError}</div>
                        ) : committees.length === 0 ? (
                            <div className="col-span-full py-16 text-center text-slate-500 card bg-slate-50 border-dashed border-2 border-slate-200">
                                <Users size={48} className="mx-auto mb-4 opacity-20" />
                                <p className="text-lg">{t('home.dashboard_preview_desc')}</p>
                                <Link to="/committees" className="btn btn-primary mt-6">{t('committees.join_committee')}</Link>
                            </div>
                        ) : (
                            committees.map(circle => (
                                <div key={circle.id} className="bg-white rounded-xl shadow-sm overflow-hidden h-full p-6 transition-all duration-300 flex flex-col justify-between border-l-4 border-l-blue-600 group hover:shadow-xl hover:-translate-y-2">
                                    <div>
                                        <div className="flex justify-between items-start mb-6">
                                            <h4 className="text-xl font-bold text-slate-800 group-hover:text-blue-700 transition-colors">{getBilingualTitle(circle.title)}</h4>
                                            <span className={`badge ${circle.status.toLowerCase()} text-[10px] uppercase tracking-tighter`}>
                                                {circle.status.toLowerCase() === 'pending' ? t('common.pending') : t('common.active')}
                                            </span>
                                        </div>
                                        <div className="space-y-4 mb-8">
                                            <div className="flex items-center gap-3 text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                                                <Users size={18} className="text-blue-500" />
                                                <span className="font-medium">{circle.members || 1} {t('committees.members_count')}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <Link to={`/committees/${circle.id}`} className="btn btn-primary w-full py-3 text-sm font-bold shadow-sm">
                                        {t('committees.open_dashboard')}
                                    </Link>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
            
            <MakeContributionModal
                isOpen={isContributionModalOpen}
                onClose={() => setIsContributionModalOpen(false)}
                onContributionSuccess={handleContributionSuccess}
            />

            <RequestPayoutModal
                isOpen={isPayoutModalOpen}
                onClose={() => setIsPayoutModalOpen(false)}
                onPayoutSuccess={handlePayoutSuccess}
            />
        </section>
    );
};

export default Dashboard;
