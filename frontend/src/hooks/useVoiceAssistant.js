import { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useVoiceContext } from '../context/VoiceContext';

const ROMAN_URDU_MAP = {
    "voice_guidance.auth": "Civitass may khush-aamadeed. Agar aap ka account nahi hai to pehlay sign up karain. Agar account hai to login karain.",
    "voice_guidance.signup": "Apna poora naam, e-mail, aur ek mazboot password darj karain taa-kay hum aap ka account bana sakain.",
    "voice_guidance.dashboard": "Aap kay dashboard par khush-aamadeed. Aap apna wallet check kar saktay hain, committee muntakhib kar saktay hain ya raqam jama kara saktay hain.",
    "voice_guidance.committees": "Yahan aap ki sab committees mojood hain. Aap kisi nayi committee mein shamil ho saktay hain ya puraani ka intezam kar saktay hain.",
    "voice_guidance.advisor": "Aap kay A-I maalyati musheer mein khush-aamadeed. Aap mujh say apnay balance ya committees kay baaray mein koi bhi sawal pooch saktay hain.",
    "voice_guidance.contribution": "Barah-e-karam aik committee muntakhib karain aur apni raqam darj karain.",
    "terms.content": "Civitass may khush-aamadeed. Kisi bhi committee may shamil ho kar, aap darj-zail asoolon say ittefaq kartay hain: Pehla, maalyati zimadari. Aap apni mahana qist waqt par ada karnay kay sakhti say paband hain. Doosra, platform ka kirdar. Civitass aik management platform hai jo shaffafiyat ko yaqeeni banata hai. Teesra, security aur raazdari. Aap ka zaati data aur maalyati record mukammal tor par mehfooz aur khufia rakha jata hai."
};

export const useVoiceAssistant = () => {
    const { i18n } = useTranslation();
    const { isVoiceEnabled } = useVoiceContext();
    const [isSpeaking, setIsSpeaking] = useState(false);

    const speak = useCallback((text, languageCode) => {
        if (!isVoiceEnabled || !text) return;

        // Cancel any currently speaking audio
        window.speechSynthesis.cancel();
        setIsSpeaking(false);

        // Phonetic Fix: Always use 'Civitass' pronunciation for English parts
        let processedText = text.replace(/Civitas/gi, 'Civitass');

        const isUrdu = languageCode === 'ur-PK' || languageCode?.startsWith('ur');

        const doSpeak = () => {
            const voices = window.speechSynthesis.getVoices();
            const utterance = new SpeechSynthesisUtterance(processedText);

            utterance.onstart = () => setIsSpeaking(true);
            utterance.onend = () => setIsSpeaking(false);
            utterance.onerror = () => setIsSpeaking(false);

            if (isUrdu) {
                utterance.lang = 'ur-PK';
                
                const urVoice = voices.find(v => 
                    v.lang.startsWith('ur') || 
                    v.name.toLowerCase().includes('urdu') || 
                    v.name.toLowerCase().includes('pakistan')
                );

                const hiVoice = voices.find(v => 
                    v.lang.startsWith('hi') || 
                    v.name.toLowerCase().includes('hindi') || 
                    v.name.toLowerCase().includes('india')
                );

                if (urVoice) {
                    utterance.voice = urVoice;
                    utterance.rate = 0.85;
                } else if (hiVoice) {
                    utterance.voice = hiVoice;
                    utterance.rate = 0.85;
                } else {
                    // If no Urdu/Hindi voice, use Roman Urdu fallback if a map exists
                    // For now, we just speak the text as provided
                    utterance.lang = 'en-US';
                    utterance.rate = 0.8;
                    const enVoice = voices.find(v => v.lang.startsWith('en'));
                    if (enVoice) utterance.voice = enVoice;
                }
            } else {
                utterance.lang = 'en-US';
                const enVoice = voices.find(v => 
                    (v.lang.startsWith('en') && v.name.includes('Google')) || 
                    (v.lang.startsWith('en') && v.name.includes('Microsoft')) || 
                    v.lang.startsWith('en')
                );
                if (enVoice) utterance.voice = enVoice;
                utterance.rate = 1;
            }

            utterance.pitch = 1;
            window.speechSynthesis.speak(utterance);
        };

        if (window.speechSynthesis.getVoices().length === 0) {
            window.speechSynthesis.onvoiceschanged = () => {
                doSpeak();
                window.speechSynthesis.onvoiceschanged = null;
            };
        } else {
            doSpeak();
        }
        
    }, [isVoiceEnabled, i18n.language]);

    useEffect(() => {
        return () => {
            window.speechSynthesis.cancel();
        };
    }, []);

    return { speak, isSpeaking };
};

export default useVoiceAssistant;
