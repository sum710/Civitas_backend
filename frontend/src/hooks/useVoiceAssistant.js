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
    "voice_guidance.specific_committee": "Is committee dashboard may khush-aamadeed. Aap roster check kar saktay hain ya apna hissa ada kar saktay hain.",
    "terms.content": "Civitass may khush-aamadeed. Kisi bhi committee may shamil ho kar, aap darj-zail asoolon say ittefaq kartay hain... Pehla, maalyati zimadari. Aap apni mahana qist waqt par ada karnay kay, sakhti say paband hain. Doosra, platform ka kirdar. Civitass aik management platform hai, jo shaffafiyat ko yaqeeni banata hai. Teesra, security aur raazdari. Aap ka zaati data pakkay tor par mehfooz aur khufia rakha jata hai. Aagay barh kar, aap apni community ka bharosa qayam rakhnay ka wada kartay hain... Shukriya."
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

        const voices = window.speechSynthesis.getVoices();
        const isUrdu = languageCode === 'ur-PK' || languageCode?.startsWith('ur');

        let urVoice = null;
        let hiVoice = null;
        let fallbackVoice = null;

        if (isUrdu) {
            // Priority 1: High-quality Native Urdu Voice
            urVoice = voices.find(v => v.lang.includes('ur') && v.name.includes('Google')) ||
                      voices.find(v => v.lang.includes('ur')) ||
                      voices.find(v => v.name.toLowerCase().includes('urdu')) ||
                      voices.find(v => v.lang.startsWith('ur') && v.name.toLowerCase().includes('pakistan'));

            // Priority 2: High-quality Native Hindi Voice (shares spoken vocabulary/grammar perfectly)
            if (!urVoice) {
                hiVoice = voices.find(v => v.lang.includes('hi') && v.name.includes('Google')) ||
                          voices.find(v => v.lang.startsWith('hi')) ||
                          voices.find(v => v.name.toLowerCase().includes('hindi'));
            }

            // Fallback online voice check for Chrome
            if (!urVoice && !hiVoice && /Chrome/.test(navigator.userAgent)) {
                const gVoice = voices.find(v => v.name.includes('Google') && (v.lang.includes('ur') || v.lang.includes('hi')));
                if (gVoice) {
                    if (gVoice.lang.includes('ur')) urVoice = gVoice;
                    else hiVoice = gVoice;
                }
            }

            fallbackVoice = voices.find(v => v.name.includes('Google')) || voices.find(v => v.default) || voices[0];
        }

        // If native voice is found, we KEEP original native text for perfect, original accent/consistency.
        // Only if native engine is missing, map to Roman Urdu so fallback voice can pronounce it without silence.
        let processedText = text;
        if (isUrdu && !urVoice && !hiVoice) {
            if (ROMAN_URDU_MAP[text]) {
                processedText = ROMAN_URDU_MAP[text];
            } else {
                // Check if text directly maps to any of the standard translations by keyword
                Object.keys(ROMAN_URDU_MAP).forEach(k => {
                    if (text.includes(k)) processedText = ROMAN_URDU_MAP[k];
                });

                // Check specific dynamic content strings read in Urdu script
                if (text.includes("موجودہ بیلنس") || text.includes("والٹ")) {
                    const match = text.match(/\d+/g);
                    const bal = match ? match.join("") : "";
                    processedText = `Aap kay wallet ka moojooda balance ${bal} rupay hai. Aap direct apnay Easypaisa account may payout ki darkhwast kar saktay hain, ya isay Daraz voucher kay tor par istamal kar saktay hain.`;
                } else if (text.includes("ادائیگی موصول ہو چکی ہے")) {
                    processedText = "Aap ki adaigi mosool ho chuki hai.";
                } else if (text.includes("فیصلہ نہیں ہوا")) {
                    processedText = "Aap kay payout slot ka abhi faisla nahi hua hai. Draw pending hai.";
                } else if (text.includes("شیڈول ہے")) {
                    const match = text.match(/\d+/);
                    const slotStr = match ? ` Slot number ${match[0]} hai.` : '';
                    processedText = `Hello, aap ki adaigi schedule ho chuki hai.${slotStr}`;
                } else if (text.includes("مبارک ہو")) {
                    processedText = "Mubarak ho! Agla slot assign ho chuka hai.";
                } else {
                    // Fallback keyword search against the mapped values
                    if (text.includes("اکاؤنٹ نہیں ہے")) processedText = ROMAN_URDU_MAP["voice_guidance.auth"];
                    else if (text.includes("پورا نام")) processedText = ROMAN_URDU_MAP["voice_guidance.signup"];
                    else if (text.includes("ڈیش بورڈ پر خوش آمدید")) processedText = ROMAN_URDU_MAP["voice_guidance.dashboard"];
                    else if (text.includes("سب کمیٹیاں موجود ہیں")) processedText = ROMAN_URDU_MAP["voice_guidance.committees"];
                    else if (text.includes("مالیاتی مشیر")) processedText = ROMAN_URDU_MAP["voice_guidance.advisor"];
                    else if (text.includes("کمیٹی منتخب کریں")) processedText = ROMAN_URDU_MAP["voice_guidance.contribution"];
                    else if (text.includes("کمیٹی ڈیش بورڈ میں خوش آمدید")) processedText = ROMAN_URDU_MAP["voice_guidance.specific_committee"];
                    else if (text.includes("کسی بھی کمیٹی میں شامل ہو کر")) processedText = ROMAN_URDU_MAP["terms.content"];
                }
            }
        }

        // Phonetic Fix: Always use 'Civitass' pronunciation for English parts
        if (typeof processedText === 'string') {
            processedText = processedText.replace(/Civitas/gi, 'Civitass');
        }

        // Split into chunks by punctuation (including standard Urdu full stop '۔') for 'breathing' gaps
        const chunks = processedText.split(/[.।!,۔]/).filter(s => s.trim().length > 0);

        const speakChunk = (index) => {
            if (index >= chunks.length) {
                setIsSpeaking(false);
                return;
            }

            const utterance = new SpeechSynthesisUtterance(chunks[index].trim());

            utterance.onstart = () => setIsSpeaking(true);
            utterance.onend = () => speakChunk(index + 1);
            utterance.onerror = () => {
                setIsSpeaking(false);
                speakChunk(index + 1);
            };

            if (isUrdu) {
                if (urVoice) {
                    utterance.voice = urVoice;
                    utterance.lang = urVoice.lang || 'ur-PK';
                    utterance.rate = 0.85;
                } else if (hiVoice) {
                    utterance.voice = hiVoice;
                    utterance.lang = hiVoice.lang || 'hi-IN';
                    utterance.rate = 0.8;
                } else if (fallbackVoice) {
                    utterance.voice = fallbackVoice;
                    utterance.lang = fallbackVoice.lang || 'en-US';
                    utterance.rate = 0.9;
                } else {
                    utterance.lang = 'en-US';
                    utterance.rate = 1.0;
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
