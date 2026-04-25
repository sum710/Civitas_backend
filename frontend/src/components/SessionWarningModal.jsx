import React from 'react';
import { AlertTriangle, Clock } from 'lucide-react';

const SessionWarningModal = ({ onStayLoggedIn }) => {
    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(10, 37, 64, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            backdropFilter: 'blur(8px)'
        }}>
            <div className="card" style={{
                maxWidth: '400px',
                width: '90%',
                padding: '2.5rem',
                textAlign: 'center',
                borderTop: '6px solid #D4AF37'
            }}>
                <div style={{
                    width: '64px',
                    height: '64px',
                    backgroundColor: '#fef3c7',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 1.5rem',
                    color: '#D4AF37'
                }}>
                    <Clock size={32} />
                </div>
                
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0A2540', marginBottom: '1rem' }}>
                    Session Expiring Soon
                </h2>
                
                <p style={{ color: '#64748b', lineHeight: 1.6, marginBottom: '2rem' }}>
                    You have been inactive. For your security, you will be logged out in <span style={{ fontWeight: 800, color: '#D4AF37' }}>60 seconds</span>.
                </p>
                
                <button 
                    className="btn btn-accent" 
                    style={{ width: '100%' }}
                    onClick={onStayLoggedIn}
                >
                    Stay Logged In
                </button>
            </div>
        </div>
    );
};

export default SessionWarningModal;
