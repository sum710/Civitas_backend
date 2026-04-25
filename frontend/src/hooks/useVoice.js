import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useVoiceContext } from '../context/VoiceContext';

// Phonetic fallback for Roman Urdu if native Urdu voice isn't available
// Roman Urdu strings (nx) for fallback
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

    // Pre-load voices on component mount for better performance in production (Netlify/Render)
    useEffect(() => {
        const loadVoices = () => {
            window.speechSynthesis.getVoices();
        };
        
        loadVoices();
        if (window.speechSynthesis.onvoiceschanged !== undefined) {
            window.speechSynthesis.onvoiceschanged = loadVoices;
        }
    }, []);

    const speak = useCallback((text, translationKey) => {
        if (!isVoiceEnabled || !text) return;

        // Phonetic Fix: Always use 'Civitass' pronunciation for English parts
        let processedText = text.replace(/Civitas/gi, 'Civitass');

        // 1. Cancel any ongoing speech to prevent overlapping
        window.speechSynthesis.cancel();

        const currentLang = i18n.language || 'en';
        const isUrdu = currentLang.startsWith('ur');

        const executeSpeech = () => {
            const voices = window.speechSynthesis.getVoices();
            
            // Critical Fix: If voices are empty, wait and retry. 
            // Browsers often load voices asynchronously on live URLs.
            if (voices.length === 0) {
                console.log("Speech Engine: Waiting for voices to load...");
                setTimeout(executeSpeech, 250);
                return;
            }

            const utterance = new SpeechSynthesisUtterance(processedText);
            utterance.pitch = 1.0;

            if (isUrdu) {
                console.log("Speech Engine: Searching for Urdu/Hindi voices...");
                
                // 1. Priority: Exact 'ur-PK' voice
                let selectedVoice = voices.find(v => v.lang === 'ur-PK');

                // 2. Fallback: Any voice with 'Urdu' or 'Hindi' in its name/lang
                if (!selectedVoice) {
                    selectedVoice = voices.find(v => 
                        v.name.toLowerCase().includes('urdu') || 
                        v.name.toLowerCase().includes('hindi') ||
                        v.lang.startsWith('hi') ||
                        v.lang.startsWith('ur')
                    );
                }

                if (selectedVoice) {
                    console.log("Using matched voice:", selectedVoice.name);
                    utterance.voice = selectedVoice;
                    utterance.lang = 'ur-PK'; // Explicitly set as requested
                    utterance.rate = 0.8;
                } else {
                    // 3. Robust Fallback: English voice + Roman Urdu strings
                    console.log("No native voice found. Using Roman Urdu fallback (nx).");
                    utterance.text = nx[translationKey] || processedText;
                    utterance.lang = 'en-US';
                    utterance.rate = 0.7; // Slower rate for phonetic clarity
                    const enVoice = voices.find(v => v.lang.startsWith('en'));
                    if (enVoice) utterance.voice = enVoice;
                }
            } else {
                // English Mode
                utterance.lang = 'en-US';
                utterance.rate = 1.0;
                const enVoice = voices.find(v => 
                    (v.lang.startsWith('en') && v.name.includes('Google')) || 
                    v.lang.startsWith('en')
                );
                if (enVoice) utterance.voice = enVoice;
            }

            window.speechSynthesis.speak(utterance);
        };

        // Check if voices are already available, otherwise attach listener
        if (window.speechSynthesis.getVoices().length === 0) {
            window.speechSynthesis.onvoiceschanged = () => {
                executeSpeech();
                window.speechSynthesis.onvoiceschanged = null;
            };
        } else {
            // Small delay to allow the 'cancel()' action to settle before new utterance
            setTimeout(executeSpeech, 50);
        }
        
    }, [isVoiceEnabled, i18n.language]);

    return { speak };
};

export default useVoice;
