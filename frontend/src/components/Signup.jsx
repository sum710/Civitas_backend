import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, Eye, EyeOff, HelpCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import TermsModal from './TermsModal';

const Signup = () => {
    const { t } = useTranslation();
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

        const signupUrl = 'https://civitas-api-d6ox.onrender.com/api/auth/signup';

        try {
            const response = await fetch(signupUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
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
                </div>
            </div>
        </div>
    );
};

export default Signup;