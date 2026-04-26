import { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useVoiceContext } from '../context/VoiceContext';

const ROMAN_URDU_MAP = {
    "voice_guidance.auth": "Civitass, may khush-aamadeed. Agar aap ka account nahi hai, to pehlay sign up karain. Agar account hai, to login karain.",
    "voice_guidance.signup": "Apna poora naam, e-mail, aur ek mazboot password darj karain, taa-kay hum aap ka account bana sakain.",
    "voice_guidance.dashboard": "Aap kay dashboard par khush-aamadeed. Aap apna wallet check kar saktay hain, committee muntakhib kar saktay hain, ya raqam jama kara saktay hain.",
    "voice_guidance.main_dashboard": "Aap, apnay dashboard par hain. Yahan aap apna trust score, wallet balance, aur moojooda committees dekh saktay hain.",
    "voice_guidance.committees": "Yahan, aap ki sab committees mojood hain. Aap kisi nayi committee mein shamil ho saktay hain, ya puraani ka intezam kar saktay hain.",
    "voice_guidance.advisor": "Aap kay A-I maalyati musheer mein khush-aamadeed. Aap mujh say, apnay balance ya committees kay baaray mein, koi bhi sawal pooch saktay hain.",
    "voice_guidance.contribution": "Barah-e-karam, aik committee muntakhib karain, aur apni raqam darj karain.",
    "terms.content": "Civitass may khush-aamadeed. Kisi bhi committee may shamil ho kar, aap darj-zail asoolon say ittefaq kartay hain... Pehla, maalyati zimadari. Aap apni mahana qist waqt par ada karnay kay, sakhti say paband hain. Doosra, platform ka kirdar. Civitass aik management platform hai, jo shaffafiyat ko yaqeeni banata hai. Teesra, security aur raazdari. Aap ka zaati data aur maalyati record, mukammal tor par mehfooz aur khufia rakha jata hai. Aagay barh kar, aap apni community ka bharosa qayam rakhnay ka wada kartay hain... Shukriya."
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

        const isUrdu = languageCode === 'ur-PK' || languageCode?.startsWith('ur');

        // Key Mapping Check: If 'text' is a key in the map, use the phonetic Roman Urdu version
        let processedText = text;
        if (isUrdu && ROMAN_URDU_MAP[text]) {
            processedText = ROMAN_URDU_MAP[text];
        }

        // Phonetic Fix: Always use 'Civitass' pronunciation for English parts
        processedText = processedText.replace(/Civitas/gi, 'Civitass');

        // Split into chunks by punctuation for 'breathing' gaps
        const chunks = processedText.split(/[.।!,]/).filter(s => s.trim().length > 0);

        const voices = window.speechSynthesis.getVoices();

        const speakChunk = (index) => {
            if (index >= chunks.length) {
                setIsSpeaking(false);
                return;
            }

            const utterance = new SpeechSynthesisUtterance(chunks[index].trim() + '.');

            utterance.onstart = () => setIsSpeaking(true);
            utterance.onend = () => speakChunk(index + 1);
            utterance.onerror = () => {
                setIsSpeaking(false);
                speakChunk(index + 1);
            };

            if (isUrdu) {
                // Try to find native Pakistani Urdu voice or Hindi fallback
                const urVoice = voices.find(v =>
                    v.lang === 'ur-PK' ||
                    (v.lang.startsWith('ur') && v.name.toLowerCase().includes('pakistan'))
                );
                const hiVoice = voices.find(v =>
                    v.lang.startsWith('ur') || v.lang.startsWith('hi') || v.name.toLowerCase().includes('hindi')
                );

                if (urVoice) {
                    utterance.voice = urVoice;
                    utterance.lang = 'ur-PK';
                    utterance.rate = 0.85;
                } else if (hiVoice) {
                    utterance.voice = hiVoice;
                    utterance.lang = hiVoice.lang;
                    utterance.rate = 0.8;
                } else {
                    // English Priority: Stay silent if no quality Urdu/Hindi voice
                    console.log("No high-quality Urdu voice found. Staying silent to maintain quality.");
                    setIsSpeaking(false);
                    return;
                }
            } else {
                utterance.lang = 'en-US';
                utterance.rate = 1;
                const enVoice = voices.find(v =>
                    (v.lang.startsWith('en') && v.name.includes('Google')) || v.lang.startsWith('en')
                );
                if (enVoice) utterance.voice = enVoice;
            }

            utterance.pitch = 1;
            window.speechSynthesis.speak(utterance);
        };

        // Small delay to ensure synthesis state is ready after cancel
        setTimeout(() => speakChunk(0), 150);

    }, [isVoiceEnabled]);

    useEffect(() => {
        return () => {
            window.speechSynthesis.cancel();
        };
    }, []);

    return { speak, isSpeaking };
};

export default useVoiceAssistant;
