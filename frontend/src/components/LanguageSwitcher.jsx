import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

const LanguageSwitcher = () => {
    const { i18n } = useTranslation();
    const currentLanguage = i18n.language;

    const changeLanguage = (lng) => {
        i18n.changeLanguage(lng);
        // Explicitly set direction for Urdu
        document.documentElement.dir = lng === 'ur' ? 'rtl' : 'ltr';
        document.documentElement.lang = lng;
    };

    const buttonStyle = (lng) => ({
        padding: '0.4rem 0.9rem',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        fontSize: '0.85rem',
        fontWeight: '700',
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        backgroundColor: currentLanguage === lng ? 'var(--accent-gold)' : 'transparent',
        color: currentLanguage === lng ? 'var(--primary-blue)' : 'rgba(255, 255, 255, 0.8)',
        boxShadow: currentLanguage === lng ? '0 2px 8px rgba(212, 175, 55, 0.3)' : 'none',
        transform: currentLanguage === lng ? 'scale(1.02)' : 'scale(1)',
    });

    return (
        <div className="language-switcher-toggle" style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: 'rgba(0, 17, 36, 0.4)',
            padding: '4px',
            borderRadius: '10px',
            gap: '2px',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            backdropFilter: 'blur(8px)',
            boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.2)'
        }}>
            <button 
                onClick={() => changeLanguage('en')} 
                style={buttonStyle('en')}
            >
                English
            </button>
            <button 
                onClick={() => changeLanguage('ur')} 
                style={buttonStyle('ur')}
            >
                اردو
            </button>
        </div>
    );
};

export default LanguageSwitcher;
