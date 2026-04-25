import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import useVoice from '../hooks/useVoice';

/**
 * VoiceNavigator
 * An invisible component that listens to route changes and language flips
 * to trigger the correct bilingual guidance.
 */
const VoiceNavigator = () => {
    const location = useLocation();
    const { t, i18n } = useTranslation();
    const { speak } = useVoice();

    useEffect(() => {
        const path = location.pathname;
        let guidanceKey = '';

        // Map URL paths to translation keys
        if (path === '/' || path === '/login') {
            guidanceKey = 'voice_guidance.auth';
        } else if (path === '/signup') {
            guidanceKey = 'voice_guidance.signup';
        } else if (path === '/dashboard') {
            guidanceKey = 'voice_guidance.dashboard';
        } else if (path === '/committees') {
            guidanceKey = 'voice_guidance.committees';
        } else if (path === '/advisor') {
            guidanceKey = 'voice_guidance.advisor';
        } else if (path.startsWith('/committees/')) {
            guidanceKey = 'voice_guidance.specific_committee';
        }

        if (guidanceKey) {
            // Trigger the voice message
            const message = t(guidanceKey);
            
            // Small delay to ensure page transition/language swap is ready
            const timer = setTimeout(() => {
                // Pass key for Roman Urdu fallback if needed
                speak(message, guidanceKey);
            }, 600);
            
            return () => clearTimeout(timer);
        }
    }, [location.pathname, i18n.language, t, speak]); // i18n.language ensures re-trigger on language swap

    return null;
};

export default VoiceNavigator;
