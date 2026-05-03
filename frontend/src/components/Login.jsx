import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import apiRequest from '../services/api';
import TwoFactorModal from './TwoFactorModal';

const Login = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { login } = useAuth();
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [isLoading, setIsLoading] = useState(false);
    const [show2FA, setShow2FA] = useState(false);
    const [pendingLoginData, setPendingLoginData] = useState(null);

    const handleGoogleLogin = async () => {
        try {
            const res = await apiRequest('/auth/google');
            const data = await res.json();
            if (data.url) {
                window.location.href = data.url;
            }
        } catch (err) {
            console.error("Google Auth error:", err);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const response = await apiRequest('/auth/login', {
                method: 'POST',
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || t('common.error'));
            }

            const userData = data.user || { email: formData.email };
            if (data.token) {
                userData.token = data.token;
            }

            setIsLoading(false);

            if (userData.is_2fa_enabled) {
                setPendingLoginData(userData);
                // Temporarily set token so TwoFactorModal can use apiRequest
                localStorage.setItem('token', userData.token);
                setShow2FA(true);
            } else {
                login(userData);
                navigate('/dashboard');
            }

        } catch (error) {
            console.error('Login Error:', error);
            setIsLoading(false);
            alert(`${t('common.error')}: ${error.message}`);
        }
    };

    const handle2FASuccess = () => {
        setShow2FA(false);
        if (pendingLoginData) {
            // Context will sync with localStorage
            login(pendingLoginData);
            navigate('/dashboard');
        }
    };

    const handle2FAClose = () => {
        setShow2FA(false);
        setPendingLoginData(null);
        localStorage.removeItem('token'); // remove temp token
    };

    return (
        <div className="auth-page">
            <div className="auth-container">
                <div className="auth-card">
                    <div className="auth-logo">
                        <ShieldCheck size={48} color="#D4AF37" />
                    </div>

                    <div className="auth-header">
                        <h2>{t('auth.welcome_back')}</h2>
                        <p>{t('auth.login_subtitle')}</p>
                    </div>

                    <form onSubmit={handleSubmit} className="auth-form">
                        <div className="form-group">
                            <label htmlFor="email">{t('auth.email')}</label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder={t('auth.email_placeholder')}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="password">{t('auth.password')}</label>
                            <div className="password-input">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    id="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder={t('auth.password_placeholder')}
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
                        </div>

                        <div className="form-options">
                            <label className="checkbox-label">
                                <input type="checkbox" />
                                <span>{t('auth.remember_me')}</span>
                            </label>
                            <Link to="/forgot-password" university className="forgot-link">
                                {t('auth.forgot_password')}
                            </Link>
                        </div>

                        <button
                            type="submit"
                            className="btn btn-accent btn-full"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <span className="loading"></span>
                                    {t('common.loading')}
                                </>
                            ) : (
                                t('common.login')
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
                        Sign in with Google
                    </button>

                    <div className="auth-footer mt-6">
                        <p>
                            {t('auth.no_account')}{' '}
                            <Link to="/signup" className="auth-link">{t('common.signup')}</Link>
                        </p>
                    </div>
                </div>
            </div>
            
            {show2FA && (
                <TwoFactorModal
                    isOpen={show2FA}
                    onClose={handle2FAClose}
                    onSuccess={handle2FASuccess}
                    actionType="login"
                />
            )}
        </div>
    );
};

export default Login;
