import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';

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

        const loginUrl = 'http://127.0.0.1:3000/api/auth/login';
        
        try {
            const response = await fetch(loginUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
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

            login(userData);
            setIsLoading(false);
            navigate('/dashboard');

        } catch (error) {
            console.error('Login Error:', error);
            setIsLoading(false);
            alert(`${t('common.error')}: ${error.message}`);
        }
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

                    <div className="auth-footer">
                        <p>
                            {t('auth.no_account')}{' '}
                            <Link to="/signup" className="auth-link">{t('common.signup')}</Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
