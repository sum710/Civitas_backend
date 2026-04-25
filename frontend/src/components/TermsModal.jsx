import React from 'react';
import { useTranslation } from 'react-i18next';
import { X, Volume2 } from 'lucide-react';
import useVoice from '../hooks/useVoice';

const TermsModal = ({ isOpen, onClose, onAgree }) => {
    const { t, i18n } = useTranslation();
    const { speak } = useVoice();

    if (!isOpen) return null;

    const handleSpeak = () => {
        speak(t('terms.content'), 'terms.content');
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                {/* Sticky Header */}
                <div className="modal-header">
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: 0, flex: 1 }}>
                        {t('terms.title')}
                    </h2>
                    <button 
                        onClick={onClose}
                        className="close-btn"
                    >
                        <X size={24} color="#6b7280" />
                    </button>
                </div>

                {/* Scrollable Body */}
                <div style={{
                    padding: '20px 0',
                    overflowY: 'auto',
                    flex: 1,
                    textAlign: i18n.language === 'ur' ? 'right' : 'left'
                }} dir={i18n.language === 'ur' ? 'rtl' : 'ltr'}>
                    
                    {/* Voice Assistant Trigger */}
                    <button 
                        onClick={handleSpeak}
                        className="btn btn-secondary"
                        style={{
                            width: '100%',
                            marginBottom: '20px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '10px',
                            backgroundColor: '#ebf5ff',
                            color: '#2563eb',
                            border: '1px solid #bfdbfe'
                        }}
                    >
                        <Volume2 size={20} />
                        {t('terms.read_aloud')}
                    </button>

                    <p style={{ color: '#374151', lineHeight: '1.6', fontSize: '1rem', whiteSpace: 'pre-line' }}>
                        {t('terms.content')}
                    </p>
                </div>

                {/* Sticky Footer */}
                <div className="modal-footer">
                    <button 
                        className="btn btn-primary w-full"
                        onClick={() => {
                            onAgree();
                            onClose();
                        }}
                    >
                        {t('terms.agree_button')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TermsModal;
