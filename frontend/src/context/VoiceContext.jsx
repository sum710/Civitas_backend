import React, { createContext, useContext, useState, useEffect } from 'react';

const VoiceContext = createContext();

export const VoiceProvider = ({ children }) => {
    const [isVoiceEnabled, setIsVoiceEnabled] = useState(() => {
        const saved = localStorage.getItem('voiceGuidance');
        return saved !== null ? JSON.parse(saved) : false;
    });

    useEffect(() => {
        localStorage.setItem('voiceGuidance', JSON.stringify(isVoiceEnabled));
        
        // BUG FIX: If voice is disabled, instantly cut off any current speech
        if (!isVoiceEnabled) {
            window.speechSynthesis.cancel();
        }
    }, [isVoiceEnabled]);

    const toggleVoice = () => setIsVoiceEnabled(prev => !prev);

    return (
        <VoiceContext.Provider value={{ isVoiceEnabled, toggleVoice }}>
            {children}
        </VoiceContext.Provider>
    );
};

export const useVoiceContext = () => useContext(VoiceContext);
