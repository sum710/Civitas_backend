import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiRequest from '../services/api';
import { ShieldCheck, Loader2 } from 'lucide-react';
import TwoFactorModal from '../components/TwoFactorModal';

const AuthCallback = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState(null);
    const [show2FA, setShow2FA] = React.useState(false);
    const [pendingData, setPendingData] = React.useState(null);

    useEffect(() => {
        const processOAuthCallback = async () => {
            const hash = window.location.hash;
            const search = window.location.search;

            let accessToken = null;
            let authError = null;

            if (hash) {
                const params = new URLSearchParams(hash.substring(1));
                accessToken = params.get('access_token');
                authError = params.get('error_description') || params.get('error');
            }

            if (!accessToken && search) {
                const params = new URLSearchParams(search);
                accessToken = params.get('access_token') || params.get('code');
                authError = params.get('error_description') || params.get('error');
            }

            if (!accessToken) {
                setError("No authentication token found. Please try logging in again.");
                setLoading(false);
                return;
            }

            if (authError) {
                setError(`Authentication failed: ${authError}`);
                setLoading(false);
                return;
            }

            try {
                const response = await apiRequest('/auth/google-callback', {
                    method: 'POST',
                    body: JSON.stringify({ access_token: accessToken })
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message || 'Failed to authenticate with Google');
                }

                const userData = data.user;
                if (data.token) {
                    userData.token = data.token;
                }

                if (userData.is_2fa_enabled) {
                    setPendingData(userData);
                    // Temporarily store token for 2FA api calls
                    localStorage.setItem('token', userData.token);
                    setShow2FA(true);
                    setLoading(false);
                } else {
                    login(userData);
                    navigate('/dashboard');
                }

            } catch (err) {
                console.error("OAuth Callback Error:", err);
                setError(err.message || "An error occurred during authentication.");
                setLoading(false);
            }
        };

        processOAuthCallback();
    }, [login, navigate]);

    const handle2FASuccess = () => {
        setShow2FA(false);
        if (pendingData) {
            login(pendingData);
            navigate('/dashboard');
        }
    };

    const handle2FAClose = () => {
        setShow2FA(false);
        setPendingData(null);
        localStorage.removeItem('token');
        navigate('/login');
    };

    if (show2FA) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <TwoFactorModal
                    isOpen={show2FA}
                    onClose={handle2FAClose}
                    onSuccess={handle2FASuccess}
                    actionType="login"
                />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
            <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
                <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <ShieldCheck size={40} className="text-blue-600" />
                </div>
                
                {error ? (
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800 mb-2">Authentication Failed</h2>
                        <p className="text-slate-600 mb-6">{error}</p>
                        <button 
                            onClick={() => navigate('/login')}
                            className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors w-full"
                        >
                            Return to Login
                        </button>
                    </div>
                ) : (
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800 mb-2">Authenticating</h2>
                        <p className="text-slate-600 mb-6">Please wait while we securely log you in...</p>
                        <Loader2 size={32} className="animate-spin text-blue-600 mx-auto" />
                    </div>
                )}
            </div>
        </div>
    );
};

export default AuthCallback;
