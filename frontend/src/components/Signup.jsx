import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, Eye, EyeOff, HelpCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import TermsModal from './TermsModal';
import apiRequest from '../services/api';

const Signup = () => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [activeTab, setActiveTab] = useState('register');
    const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        fullName: '',
        phoneNumber: '',
        username: '',
        accountType: 'member',
        email: '',
        cnic: '',
        password: '',
        confirmPassword: '',
        agreeToTerms: false
    });
    const [isLoading, setIsLoading] = useState(false);
    const [passwordCriteria, setPasswordCriteria] = useState({
        length: false,
        uppercase: false,
        lowercase: false,
        number: false,
        specialChar: false
    });

    const handleGoogleLogin = async () => {
        try {
            const redirectUrl = encodeURIComponent(`${window.location.origin}/auth/callback`);
            const res = await apiRequest(`/auth/google?redirect_to=${redirectUrl}`);
            const data = await res.json();
            if (data.url) {
                window.location.href = data.url;
            }
        } catch (err) {
            console.error("Google Auth error:", err);
        }
    };

    const validatePassword = (pass) => {
        setPasswordCriteria({
            length: pass.length >= 8,
            uppercase: /[A-Z]/.test(pass),
            lowercase: /[a-z]/.test(pass),
            number: /\d/.test(pass),
            specialChar: /[!@#$%^&*]/.test(pass)
        });
    };

    const getStrengthScore = () => {
        return Object.values(passwordCriteria).filter(Boolean).length;
    };

    const isPasswordValid = Object.values(passwordCriteria).every(Boolean);

    const getStrengthLabel = (score) => {
        if (score === 0) return { label: t('auth.very_weak'), color: '#ef4444', width: '20%' };
        if (score <= 2) return { label: t('auth.weak'), color: '#f59e0b', width: '40%' };
        if (score === 3) return { label: t('auth.medium'), color: '#fbbf24', width: '60%' };
        if (score === 4) return { label: t('auth.strong'), color: '#34d399', width: '80%' };
        return { label: t('auth.very_strong'), color: '#10b981', width: '100%' };
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));

        if (name === 'password') {
            validatePassword(value);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!isPasswordValid) {
            alert(t('auth.password_weak_error') || "Password does not meet complexity requirements.");
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            alert(t('auth.password_mismatch'));
            return;
        }

        if (!formData.agreeToTerms) {
            alert(t('auth.agree_to_terms_error'));
            return;
        }

        setIsLoading(true);

        try {
            const response = await apiRequest('/auth/signup', {
                method: 'POST',
                body: JSON.stringify({
                    email: formData.email,
                    password: formData.password,
                    full_name: formData.fullName,
                    cnic: formData.cnic,
                    role: formData.accountType
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || t('common.error'));
            }

            setIsLoading(false);
            alert(t('common.success'));
            navigate('/login');

        } catch (error) {
            console.error('Signup Error:', error);
            setIsLoading(false);
            alert(`${t('common.error')}: ${error.message}`);
        }
    };

    return (
        <div className="signup-page">
            <div className="signup-container">
                <div className="signup-header">
                    <div className="signup-title">
                        <ShieldCheck size={40} color="#D4AF37" />
                        <h1>{t('dashboard.welcome')}</h1>
                    </div>
                    <p className="signup-subtitle">{t('dashboard.subtitle')}</p>
                </div>

                <div className="signup-tabs">
                    <button
                        className={`tab-button ${activeTab === 'login' ? 'active' : ''}`}
                        onClick={() => {
                            setActiveTab('login');
                            navigate('/login');
                        }}
                    >
                        {t('common.login')}
                    </button>
                    <button
                        className={`tab-button ${activeTab === 'register' ? 'active' : ''}`}
                        onClick={() => setActiveTab('register')}
                    >
                        {t('common.register')}
                    </button>
                </div>

                <div className="signup-form-card">
                    <h2 className="form-title">{t('auth.create_account')}</h2>

                    <form onSubmit={handleSubmit} className="signup-form">
                        <div className="form-grid">
                            <div className="form-column">
                                <div className="form-group-inline">
                                    <label htmlFor="fullName">
                                        {t('auth.full_name')} <span className="required">*</span>
                                    </label>
                                    <HelpCircle size={16} className="help-icon" />
                                </div>
                                <input
                                    type="text"
                                    id="fullName"
                                    name="fullName"
                                    value={formData.fullName}
                                    onChange={handleChange}
                                    placeholder="e.g., Muhammad Tahir"
                                    required
                                />

                                <div className="form-group-inline">
                                    <label htmlFor="username">
                                        {t('auth.username')} <span className="required">*</span>
                                    </label>
                                    <HelpCircle size={16} className="help-icon" />
                                </div>
                                <input
                                    type="text"
                                    id="username"
                                    name="username"
                                    value={formData.username}
                                    onChange={handleChange}
                                    placeholder="e.g., muhammad_tahir"
                                    required
                                />

                                <div className="form-group-inline">
                                    <label htmlFor="email">
                                        {t('auth.email')} <span className="required">*</span>
                                    </label>
                                    <HelpCircle size={16} className="help-icon" />
                                </div>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="e.g., user@example.com"
                                    required
                                />
                            </div>

                            <div className="form-column">
                                <div className="form-group-inline">
                                    <label htmlFor="phoneNumber">
                                        {t('auth.phone')} <span className="required">*</span>
                                    </label>
                                    <HelpCircle size={16} className="help-icon" />
                                </div>
                                <input
                                    type="tel"
                                    id="phoneNumber"
                                    name="phoneNumber"
                                    value={formData.phoneNumber}
                                    onChange={handleChange}
                                    placeholder="e.g., 03331234567"
                                    pattern="[0-9]{11}"
                                    required
                                />

                                <div className="form-group-inline">
                                    <label htmlFor="accountType">{t('auth.account_type')}</label>
                                </div>
                                <select
                                    id="accountType"
                                    name="accountType"
                                    value={formData.accountType}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="member">{t('common.member')}</option>
                                    <option value="committee leader">{t('common.admin')}</option>
                                </select>

                                <div className="form-group-inline">
                                    <label htmlFor="cnic">{t('auth.cnic')}</label>
                                    <HelpCircle size={16} className="help-icon" />
                                </div>
                                <input
                                    type="text"
                                    id="cnic"
                                    name="cnic"
                                    value={formData.cnic}
                                    onChange={handleChange}
                                    placeholder="e.g., 1234567890123"
                                    pattern="[0-9]{13}"
                                    maxLength="13"
                                />
                            </div>
                        </div>

                        <div className="form-group-inline">
                            <label htmlFor="password">
                                {t('auth.password')} <span className="required">*</span>
                            </label>
                        </div>
                        <div className="password-input">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                id="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder={t('auth.create_pass_placeholder')}
                                required
                            />
                            <button
                                type="button"
                                className="password-toggle"
                                onClick={() => setShowPassword(!showPassword)}
                                aria-label="Toggle password visibility"
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>

                        {formData.password && (
                            <div className="password-strength-container animate-fade-in" style={{
                                marginTop: '1rem',
                                marginBottom: '1.5rem',
                                padding: '1.25rem',
                                backgroundColor: '#f8fafc',
                                borderRadius: '8px',
                                border: '1px solid #e2e8f0'
                            }}>
                                <div className="strength-meter-wrapper" style={{ marginBottom: '1rem' }}>
                                    <div className="strength-meter-label" style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        marginBottom: '0.5rem',
                                        fontSize: '0.85rem',
                                        fontWeight: '600'
                                    }}>
                                        <span>{t('auth.strength')}</span>
                                        <span 
                                            className="strength-text" 
                                            style={{ 
                                                color: getStrengthLabel(getStrengthScore()).color,
                                                fontWeight: '700',
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.5px'
                                            }}
                                        >
                                            {getStrengthLabel(getStrengthScore()).label}
                                        </span>
                                    </div>
                                    <div className="strength-meter-bar" style={{
                                        height: '6px',
                                        width: '100%',
                                        backgroundColor: '#e2e8f0',
                                        borderRadius: '3px',
                                        overflow: 'hidden'
                                    }}>
                                        <div 
                                            className="strength-meter-fill"
                                            style={{ 
                                                height: '100%',
                                                width: getStrengthLabel(getStrengthScore()).width,
                                                backgroundColor: getStrengthLabel(getStrengthScore()).color,
                                                transition: 'width 0.3s ease, background-color 0.3s ease'
                                            }}
                                        ></div>
                                    </div>
                                </div>

                                <div className="password-checklist" style={{
                                    listStyle: 'none',
                                    padding: 0,
                                    margin: 0,
                                    display: 'grid',
                                    gridTemplateColumns: '1fr 1fr',
                                    gap: '0.5rem'
                                }}>
                                    <div className={`checklist-item ${passwordCriteria.length ? 'met' : 'unmet'}`} style={{
                                        fontSize: '0.8rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        color: passwordCriteria.length ? '#10b981' : '#ef4444'
                                    }}>
                                        <span className="checklist-icon">{passwordCriteria.length ? '✔️' : '❌'}</span>
                                        <span>{t('auth.criteria_8')}</span>
                                    </div>
                                    <div className={`checklist-item ${passwordCriteria.uppercase ? 'met' : 'unmet'}`} style={{
                                        fontSize: '0.8rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        color: passwordCriteria.uppercase ? '#10b981' : '#ef4444'
                                    }}>
                                        <span className="checklist-icon">{passwordCriteria.uppercase ? '✔️' : '❌'}</span>
                                        <span>{t('auth.criteria_upper')}</span>
                                    </div>
                                    <div className={`checklist-item ${passwordCriteria.lowercase ? 'met' : 'unmet'}`} style={{
                                        fontSize: '0.8rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        color: passwordCriteria.lowercase ? '#10b981' : '#ef4444'
                                    }}>
                                        <span className="checklist-icon">{passwordCriteria.lowercase ? '✔️' : '❌'}</span>
                                        <span>{t('auth.criteria_lower')}</span>
                                    </div>
                                    <div className={`checklist-item ${passwordCriteria.number ? 'met' : 'unmet'}`} style={{
                                        fontSize: '0.8rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        color: passwordCriteria.number ? '#10b981' : '#ef4444'
                                    }}>
                                        <span className="checklist-icon">{passwordCriteria.number ? '✔️' : '❌'}</span>
                                        <span>{t('auth.criteria_num')}</span>
                                    </div>
                                    <div className={`checklist-item ${passwordCriteria.specialChar ? 'met' : 'unmet'}`} style={{
                                        fontSize: '0.8rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        color: passwordCriteria.specialChar ? '#10b981' : '#ef4444'
                                    }}>
                                        <span className="checklist-icon">{passwordCriteria.specialChar ? '✔️' : '❌'}</span>
                                        <span>{t('auth.criteria_special')}</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="form-group-inline">
                            <label htmlFor="confirmPassword">
                                {t('auth.confirm_pass')} <span className="required">*</span>
                            </label>
                        </div>
                        <div className="password-input">
                            <input
                                type={showConfirmPassword ? 'text' : 'password'}
                                id="confirmPassword"
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                placeholder={t('auth.confirm_pass_placeholder')}
                                required
                            />
                            <button
                                type="button"
                                className="password-toggle"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                aria-label="Toggle confirm password visibility"
                            >
                                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>

                        <div className="terms-checkbox">
                            <label className="checkbox-container">
                                <input
                                    type="checkbox"
                                    name="agreeToTerms"
                                    checked={formData.agreeToTerms}
                                    onChange={handleChange}
                                    required
                                />
                                <span className="checkmark"></span>
                                <span className="checkbox-text">
                                    {t('auth.agree_to')}{' '}
                                    <span 
                                        className="terms-link" 
                                        style={{ color: '#2563eb', cursor: 'pointer', textDecoration: 'underline' }}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            setIsTermsModalOpen(true);
                                        }}
                                    >
                                        {t('nav.terms')}
                                    </span>
                                </span>
                            </label>
                        </div>

                        {/* Terms and Conditions Modal */}
                        <TermsModal 
                            isOpen={isTermsModalOpen} 
                            onClose={() => setIsTermsModalOpen(false)}
                            onAgree={() => setFormData(prev => ({ ...prev, agreeToTerms: true }))}
                        />


                        <button
                            type="submit"
                            className="btn-create-account"
                            disabled={isLoading}
                            style={{ 
                                opacity: isLoading ? 0.6 : 1,
                                cursor: isLoading ? 'not-allowed' : 'pointer'
                            }}
                        >
                            {isLoading ? (
                                <>
                                    <span className="loading"></span>
                                    {t('common.loading')}
                                </>
                            ) : (
                                <>
                                    {isPasswordValid && formData.agreeToTerms ? '🔒' : '⚠️'} {t('auth.register_btn')}
                                </>
                            )}
                        </button>
                    </form>

                    <div style={{ display: 'flex', alignItems: 'center', margin: '24px 0' }}>
                        <div style={{ flexGrow: 1, borderTop: '1px solid #e5e7eb' }}></div>
                        <span style={{ padding: '0 16px', fontSize: '14px', color: '#9ca3af', fontWeight: '500' }}>OR</span>
                        <div style={{ flexGrow: 1, borderTop: '1px solid #e5e7eb' }}></div>
                    </div>

                    <button 
                        type="button"
                        onClick={handleGoogleLogin}
                        style={{
                            width: '100%',
                            height: '48px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '12px',
                            border: '1px solid #d1d5db',
                            borderRadius: '8px',
                            backgroundColor: '#ffffff',
                            color: '#374151',
                            fontSize: '16px',
                            fontWeight: '500',
                            cursor: 'pointer',
                            transition: 'background-color 0.2s'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#ffffff'}
                    >
                        <svg style={{ width: '20px', height: '20px', minWidth: '20px' }} viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        {i18n.language === 'ur' ? 'Google کے ساتھ لاگ ان کریں' : 'Sign in with Google'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Signup;