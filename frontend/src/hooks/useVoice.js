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
    "terms.content": "Civitass may khush-aamadeed. Kisi bhi committee may shamil ho kar, aap darj-zail asoolon say ittefaq kartay hain... Pehla, maalyati zimadari. Aap apni mahana qist waqt par ada karnay kay, sakhti say paband hain. Doosra, platform ka kirdar. Civitass aik management platform hai, jo shaffafiyat ko yaqeeni banata hai. Teesra, security aur raazdari. Aap ka zaati data aur maalyati record, mukammal tor par mehfooz aur khufia rakha jata hai. Aagay barh kar, aap apni community ka bharosa qayam rakhnay ka wada kartay hain... Shukriya."
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

                const utterance = new SpeechSynthesisUtterance(text);

                // Phonetic fix for 'Civitas'
                utterance.text = text.replace(/Civitas/gi, 'Civitass');

                if (i18n.language === 'ur' || i18n.language?.startsWith('ur')) {
                    // Optimized search for Urdu/Hindi
                    let urduVoice = voices.find(v =>
                        v.lang.includes('ur') ||
                        v.name.toLowerCase().includes('urdu') ||
                        v.name.toLowerCase().includes('google ur-pk')
                    );

                    // Chrome fallback to Hindi
                    let hindiVoice = null;
                    if (!urduVoice) {
                        hindiVoice = voices.find(v => v.lang.startsWith('hi'));
                    }

                    if (urduVoice) {
                        utterance.voice = urduVoice;
                        utterance.lang = urduVoice.lang;
                        utterance.rate = 0.85;
                    } else if (hindiVoice) {
                        utterance.voice = hindiVoice;
                        utterance.lang = hindiVoice.lang;
                        utterance.rate = 0.6;
                    } else {
                        // English Priority: Stay silent if no quality Urdu/Hindi voice
                        console.log("No high-quality Urdu/Hindi voice found. Staying silent.");
                        return;
                    }
                } else {
                    utterance.lang = 'en-US';
                    utterance.rate = 1.0;
                }

                window.speechSynthesis.speak(utterance);
            };

            attemptSpeech();
        }, 150);
    }, [isVoiceEnabled, i18n.language]);

    return { speak };
};

export default useVoice;