import { useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useVoiceContext } from '../context/VoiceContext';

const nx = {
    "voice_guidance.auth": "Civitass, may khush-aamadeed. Agar aap ka account nahi hai, to pehlay sign up karain. Agar account hai, to login karain.",
    "voice_guidance.signup": "Apna poora naam, e-mail, aur ek mazboot password darj karain, taa-kay hum aap ka account bana sakain.",
    "voice_guidance.dashboard": "Aap kay dashboard par khush-aamadeed. Aap apna wallet check kar saktay hain, committee muntakhib kar saktay hain, ya raqam jama kara saktay hain.",
    "voice_guidance.main_dashboard": "Aap, apnay dashboard par hain. Yahan aap apna trust score, wallet balance, aur moojooda committees dekh saktay hain.",
    "voice_guidance.committees": "Yahan, aap ki sab committees mojood hain. Aap kisi nayi committee mein shamil ho saktay hain, ya puraani ka intezam kar saktay hain.",
    "voice_guidance.advisor": "Aap kay A-I maalyati musheer mein khush-aamadeed. Aap mujh say, apnay balance ya committees kay baaray mein, koi bhi sawal pooch saktay hain.",
    "voice_guidance.contribution": "Barah-e-karam, aik committee muntakhib karain, aur apni raqam darj karain.",
    "voice_guidance.specific_committee": "Is committee dashboard may khush-aamadeed. Aap roster check kar saktay hain ya apna hissa ada kar saktay hain.",
    "terms.content": "Civitass may khush-aamadeed. Kisi bhi committee may shamil ho kar, aap darj-zail asoolon say ittefaq kartay hain... Pehla, maalyati zimadari. Aap apni mahana qist waqt par ada karnay kay, sakhti say paband hain. Doosra, platform ka kirdar. Civitass aik management platform hai, jo shaffafiyat ko yaqeeni banata hai. Teesra, security aur raazdari. Aap ka zaati data aur maalyati record, mukammal tor par mehfooz aur khufia rakha jata hai. Aagay barh kar, aap apni community ka bharosa qayam rakhnay ka wada text kay mutabiq hai... Shukriya."
};

const useVoice = () => {
    const { i18n } = useTranslation();
    const { isVoiceEnabled } = useVoiceContext();

    useEffect(() => {
        const loadVoices = () => window.speechSynthesis.getVoices();
        loadVoices();
        window.speechSynthesis.onvoiceschanged = loadVoices;
    }, []);

    const speak = useCallback((text, key) => {
        if (!isVoiceEnabled || !text) return;

        // 1. Important: Stop previous speech
        window.speechSynthesis.cancel();

        // 2. Added a 150ms timeout. Chrome often fails if speak() is called 
        // immediately after cancel(). This delay fixes the Chrome restriction.
        setTimeout(() => {
            const attemptSpeech = (retryCount = 0) => {
                const voices = window.speechSynthesis.getVoices();

                if (voices.length === 0 && retryCount < 10) {
                    setTimeout(() => attemptSpeech(retryCount + 1), 200);
                    return;
                }

                const isUrdu = i18n.language === 'ur' || i18n.language?.startsWith('ur');
                let textToSpeak = text;
                let selectedVoice = null;
                let langCode = 'en-US';
                let speechRate = 1.0;

                if (isUrdu) {
                    // 1. Try finding a native Urdu voice
                    let urduVoice = voices.find(v => v.lang.includes('ur') && v.name.includes('Google')) ||
                                    voices.find(v => v.lang.includes('ur')) ||
                                    voices.find(v => v.name.toLowerCase().includes('urdu'));

                    // 2. Try finding a native Hindi voice
                    let hindiVoice = null;
                    if (!urduVoice) {
                        hindiVoice = voices.find(v => v.lang.includes('hi') && v.name.includes('Google')) ||
                                     voices.find(v => v.lang.includes('hi')) ||
                                     voices.find(v => v.name.toLowerCase().includes('hindi'));
                    }

                    // 3. Fallback check for Chrome online cloud voices
                    if (!urduVoice && !hindiVoice && /Chrome/.test(navigator.userAgent)) {
                        const gVoice = voices.find(v => v.name.includes('Google') && (v.lang.includes('ur') || v.lang.includes('hi')));
                        if (gVoice) {
                            if (gVoice.lang.includes('ur')) urduVoice = gVoice;
                            else hindiVoice = gVoice;
                        }
                    }

                    if (urduVoice) {
                        selectedVoice = urduVoice;
                        langCode = urduVoice.lang || 'ur-PK';
                        speechRate = 0.85;
                        // Keep textToSpeak as original native script for perfect, consistent authentic pronunciation
                    } else if (hindiVoice) {
                        selectedVoice = hindiVoice;
                        langCode = hindiVoice.lang || 'hi-IN';
                        speechRate = 0.8;
                        // Keep textToSpeak as original native script
                    } else {
                        // Fallback voice needed when no dedicated Urdu/Hindi engine exists
                        selectedVoice = voices.find(v => v.name.includes('Google')) || voices.find(v => v.default) || voices[0];
                        langCode = selectedVoice?.lang || 'en-US';
                        speechRate = 0.9;

                        // Map to Roman Urdu only so standard OS voice can read it without staying silent
                        if (key && nx[key]) {
                            textToSpeak = nx[key];
                        } else if (nx[text]) {
                            textToSpeak = nx[text];
                        } else {
                            Object.keys(nx).forEach(k => {
                                if (text.includes(k)) textToSpeak = nx[k];
                            });
                        }
                    }
                } else {
                    selectedVoice = voices.find(v => (v.lang.startsWith('en') && v.name.includes('Google')) || v.lang.startsWith('en')) || voices[0];
                    langCode = 'en-US';
                    speechRate = 1.0;
                }

                // Phonetic fix for 'Civitas' if present in text
                if (typeof textToSpeak === 'string') {
                    textToSpeak = textToSpeak.replace(/Civitas/gi, 'Civitass');
                }

                const utterance = new SpeechSynthesisUtterance(textToSpeak);
                if (selectedVoice) utterance.voice = selectedVoice;
                utterance.lang = langCode;
                utterance.rate = speechRate;

                window.speechSynthesis.speak(utterance);
            };

            attemptSpeech();
        }, 150);
    }, [isVoiceEnabled, i18n.language]);

    return { speak };
};

export default useVoice;