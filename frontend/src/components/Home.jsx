import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import apiRequest from '../services/apiRequest';
import { Link } from 'react-router-dom';
import { ChevronRight, Users, TrendingUp, Award, Shield, BarChart3, FileText } from 'lucide-react';

const Home = () => {
    const { t } = useTranslation();
    const [apiStatus, setApiStatus] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleStart = async () => {
        setIsLoading(true);
        try {
            const response = await apiRequest('/'); // Test endpoint
            if (response.ok) {
                setApiStatus('success');
            } else {
                setApiStatus('error');
            }
        } catch (err) {
            console.error('API Error:', err);
            setApiStatus('error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div>
            {/* Hero Section */}
            <header className="hero">
                <div className="container">
                    <h1>
                        {t('home.hero_title')}
                    </h1>
                    <p>
                        {t('home.hero_subtitle')}
                    </p>
                    <div className="hero-buttons flex flex-col md:flex-row gap-4 justify-center items-center mt-6 px-4">
                        <button
                            className="btn btn-accent w-full md:w-auto"
                            onClick={handleStart}
                            disabled={isLoading}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', justifyContent: 'center' }}
                        >
                            {isLoading ? (
                                <>
                                    <span className="loading"></span>
                                    {t('common.loading')}
                                </>
                            ) : (
                                <>
                                    {t('common.get_started')}
                                    <ChevronRight size={18} />
                                </>
                            )}
                        </button>
                        <Link to="/login" className="btn btn-primary w-full md:w-auto flex items-center justify-center">
                            {t('common.login')}
                        </Link>
                    </div>
                    {apiStatus && (
                        <div style={{
                            marginTop: '2rem',
                            padding: '1rem 1.5rem',
                            backgroundColor: 'rgba(255, 255, 255, 0.15)',
                            borderRadius: '8px',
                            backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(255, 255, 255, 0.2)'
                        }}>
                            <p style={{
                                color: '#D4AF37',
                                fontWeight: '600',
                                margin: 0
                            }}>
                                {apiStatus === 'success' ? `✓ ${t('home.api_success')}` : `⚠️ ${t('common.error')}`}
                            </p>
                        </div>
                    )}
                </div>
            </header>

            <section className="dashboard-section">
                <div className="container">
                    <div className="section-header">
                        <h2>{t('home.why_choose')}</h2>
                        <p>
                            {t('home.why_desc')}
                        </p>
                    </div>

                    <div className="features-grid">
                        <div className="feature-card">
                            <div className="feature-icon">
                                <Shield size={32} />
                            </div>
                            <h3>{t('home.feature_trust_title')}</h3>
                            <p>
                                {t('home.feature_trust_desc')}
                            </p>
                        </div>

                        <div className="feature-card">
                            <div className="feature-icon">
                                <Users size={32} />
                            </div>
                            <h3>{t('home.feature_mgmt_title')}</h3>
                            <p>
                                {t('home.feature_mgmt_desc')}
                            </p>
                        </div>

                        <div className="feature-card">
                            <div className="feature-icon">
                                <TrendingUp size={32} />
                            </div>
                            <h3>{t('home.feature_analytics_title')}</h3>
                            <p>
                                {t('home.feature_analytics_desc')}
                            </p>
                        </div>

                        <div className="feature-card">
                            <div className="feature-icon">
                                <Award size={32} />
                            </div>
                            <h3>{t('home.feature_payout_title')}</h3>
                            <p>
                                {t('home.feature_payout_desc')}
                            </p>
                        </div>

                        <div className="feature-card">
                            <div className="feature-icon">
                                <BarChart3 size={32} />
                            </div>
                            <h3>{t('home.feature_trans_title')}</h3>
                            <p>
                                {t('home.feature_trans_desc')}
                            </p>
                        </div>

                        <div className="feature-card">
                            <div className="feature-icon">
                                <FileText size={32} />
                            </div>
                            <h3>{t('home.feature_docs_title')}</h3>
                            <p>
                                {t('home.feature_docs_desc')}
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Dashboard Preview Section */}
            <section className="dashboard-section" style={{ backgroundColor: '#ffffff' }}>
                <div className="container">
                    <div className="section-header">
                        <h2>{t('home.dashboard_preview')}</h2>
                        <p>
                            {t('home.dashboard_preview_desc')}
                        </p>
                    </div>

                    <div className="dashboard-grid">
                        <div className="card">
                            <h2>
                                <Shield size={24} />
                                {t('common.trust_score')}
                            </h2>
                            <div className="trust-score-display">
                                <div className="score-circle">
                                    <div className="score-value">85</div>
                                    <div className="score-label">{t('common.excellent')}</div>
                                </div>
                                <p style={{ color: '#6c757d', marginTop: '1rem' }}>
                                    {t('home.feature_trust_desc')}
                                </p>
                            </div>
                        </div>

                        <div className="card">
                            <h2>
                                <TrendingUp size={24} />
                                {t('common.recent_activity')}
                            </h2>
                            <ul className="activities-list">
                                <li className="activity-item">
                                    <div className="activity-info">
                                        <h4>{t('dashboard.monthly_contribution')}</h4>
                                        <p>2 {t('dashboard.days_ago')}</p>
                                    </div>
                                    <div className="activity-amount">PKR 5,000</div>
                                </li>
                                <li className="activity-item">
                                    <div className="activity-info">
                                        <h4>{t('common.active_committees')}</h4>
                                        <p>1 {t('dashboard.week_ago')}</p>
                                    </div>
                                    <div className="activity-amount">+5 pts</div>
                                </li>
                                <li className="activity-item">
                                    <div className="activity-info">
                                        <h4>{t('dashboard.payout_received')}</h4>
                                        <p>2 {t('dashboard.weeks_ago')}</p>
                                    </div>
                                    <div className="activity-amount">PKR 50,000</div>
                                </li>
                            </ul>
                        </div>

                        <div className="card">
                            <h2>
                                <Users size={24} />
                                {t('common.active_committees')}
                            </h2>
                            <ul className="activities-list">
                                <li className="activity-item">
                                    <div className="activity-info">
                                        <h4>Savings Circle - Group A</h4>
                                        <p>12 Members</p>
                                    </div>
                                    <span className="badge">{t('common.active')}</span>
                                </li>
                                <li className="activity-item">
                                    <div className="activity-info">
                                        <h4>Family Committee</h4>
                                        <p>8 Members</p>
                                    </div>
                                    <span className="badge">{t('common.active')}</span>
                                </li>
                                <li className="activity-item">
                                    <div className="activity-info">
                                        <h4>Business Partners Fund</h4>
                                        <p>15 Members</p>
                                    </div>
                                    <span className="badge">{t('common.pending')}</span>
                                </li>
                            </ul>
                        </div>
                    </div>

                    <div className="text-center mt-4">
                        <Link to="/signup" className="btn btn-primary" style={{ marginRight: '1rem' }}>
                            {t('home.join_today')}
                        </Link>
                        <Link to="/login" className="btn btn-text" style={{ color: '#0F4C81' }}>
                            {t('home.already_member')}
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Home;