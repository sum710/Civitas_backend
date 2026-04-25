import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useVoiceContext } from '../context/VoiceContext';

// Phonetic fallback for Roman Urdu if native Urdu voice isn't available
const ROMAN_URDU_MAP = {
    "voice_guidance.auth": "Civitass may khush-aamadeed. Agar aap ka account nahi hai to pehlay sign up karain. Agar account hai to login karain.",
    "voice_guidance.signup": "Apna poora naam, e-mail, aur ek mazboot password darj karain taa-kay hum aap ka account bana sakain.",
    "voice_guidance.dashboard": "Aap kay dashboard par khush-aamadeed. Aap apna wallet check kar saktay hain, committee muntakhib kar saktay hain ya raqam jama kara saktay hain.",
    "voice_guidance.committees": "Yahan aap ki sab committees mojood hain. Aap kisi nayi committee mein shamil ho saktay hain ya puraani ka intezam kar saktay hain.",
    "voice_guidance.advisor": "Aap kay A-I maalyati musheer mein khush-aamadeed. Aap mujh say apnay balance ya committees kay baaray mein koi bhi sawal pooch saktay hain.",
    "voice_guidance.contribution": "Barah-e-karam aik committee muntakhib karain aur apni raqam darj karain.",
    "terms.content": "Civitass may khush-aamadeed. Kisi bhi committee may shamil ho kar, aap darj-zail asoolon say ittefaq kartay hain: Pehla, maalyati zimadari. Aap apni mahana qist waqt par ada karnay kay sakhti say paband hain. Doosra, platform ka kirdar. Civitass aik management platform hai jo shaffafiyat ko yaqeeni banata hai. Teesra, security aur raazdari. Aap ka zaati data aur maalyati record mukammal tor par mehfooz aur khufia rakha jata hai."
};

const useVoice = () => {
    const { i18n } = useTranslation();
    const { isVoiceEnabled } = useVoiceContext();

    const speak = useCallback((text, translationKey) => {
        if (!isVoiceEnabled || !text) return;

        // Phonetic Fix: Always use 'Civitass' pronunciation for English parts
        let processedText = text.replace(/Civitas/gi, 'Civitass');

        // Cancel any currently speaking audio
        window.speechSynthesis.cancel();

        const currentLang = i18n.language || 'en';
        const isUrdu = currentLang.startsWith('ur');

        const doSpeak = () => {
            const voices = window.speechSynthesis.getVoices();
            const utterance = new SpeechSynthesisUtterance(processedText);

            if (isUrdu) {
                console.log("Speaking in Urdu mode...");
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
                    console.log("Using native Urdu voice:", urVoice.name);
                    utterance.voice = urVoice;
                    utterance.rate = 0.85;
                } else if (hiVoice) {
                    console.log("Using Hindi voice fallback:", hiVoice.name);
                    utterance.voice = hiVoice;
                    utterance.rate = 0.85;
                } else {
                    console.log("No Urdu/Hindi voice found. Using Roman Urdu fallback with English voice.");
                    const romanText = ROMAN_URDU_MAP[translationKey] || processedText;
                    utterance.text = romanText;
                    utterance.lang = 'en-US';
                    utterance.rate = 0.8;
                    const enVoice = voices.find(v => v.lang.startsWith('en'));
                    if (enVoice) utterance.voice = enVoice;
                }
            } else {
                console.log("Speaking in English mode...");
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

    return { speak };
};

export default useVoice;
