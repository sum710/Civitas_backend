import { useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useVoiceContext } from '../context/VoiceContext';

// Phonetic fallback for Roman Urdu if native Urdu voice isn't available
const nx = {
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

    // Initialize voices on mount
    useEffect(() => {
        const loadVoices = () => {
            window.speechSynthesis.getVoices();
        };
        loadVoices();
        if (window.speechSynthesis.onvoiceschanged !== undefined) {
            window.speechSynthesis.onvoiceschanged = loadVoices;
        }
    }, []);

    const speak = useCallback((text, key) => {
        if (!isVoiceEnabled || !text) return;

        // Stop any current speech
        window.speechSynthesis.cancel();

        // Internal function to handle speech with a retry mechanism for Live sites
        const attemptSpeech = (retryCount = 0) => {
            const voices = window.speechSynthesis.getVoices();

            // If voices are not yet loaded, retry up to 10 times (2.5 seconds total)
            if (voices.length === 0 && retryCount < 10) {
                setTimeout(() => attemptSpeech(retryCount + 1), 250);
                return;
            }

            const utterance = new SpeechSynthesisUtterance(text);

            if (i18n.language === 'ur') {
                // Priority 1: Direct Urdu voice
                let urduVoice = voices.find(v =>
                    v.lang === 'ur-PK' ||
                    v.name.toLowerCase().includes('urdu') ||
                    v.name.toLowerCase().includes('google ur-pk')
                );

                // Priority 2: Hindi voice fallback (sounds much better for Urdu than English)
                if (!urduVoice) {
                    urduVoice = voices.find(v => v.lang.startsWith('hi'));
                }

                if (urduVoice) {
                    utterance.voice = urduVoice;
                    utterance.lang = urduVoice.lang;
                    utterance.rate = 0.8; // Slightly slower for clarity on live servers
                    utterance.pitch = 1.0;
                } else {
                    // Final Fallback: Roman Urdu with English voice
                    utterance.text = nx[key] || text;
                    utterance.lang = 'en-US';
                    utterance.rate = 0.65; // Very slow English voice to mimic Urdu phonetics
                }
            } else {
                utterance.lang = 'en-US';
                utterance.rate = 1.0;
            }

            window.speechSynthesis.speak(utterance);
        };

        // Start the attempt
        attemptSpeech();
    }, [isVoiceEnabled, i18n.language]);

    return { speak };
};

export default useVoice;