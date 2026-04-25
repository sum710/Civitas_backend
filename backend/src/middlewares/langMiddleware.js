/**
 * Language Middleware
 * Extracts 'Accept-Language' header and attaches it to the request object.
 */
const langMiddleware = (req, res, next) => {
    // Get language from header, default to 'en'
    const lang = req.headers['accept-language'] || 'en';
    
    // Normalize (e.g., 'en-US,en;q=0.9' -> 'en')
    req.locale = lang.split(',')[0].split('-')[0].toLowerCase();
    
    // Basic translations for backend messages
    const translations = {
        en: {
            insufficient_funds: "Insufficient funds in wallet.",
            unauthorized: "Unauthorized access.",
            server_error: "Server error during operation."
        },
        ur: {
            insufficient_funds: "والٹ میں رقم ناکافی ہے۔",
            unauthorized: "غیر مجاز رسائی۔",
            server_error: "آپریشن کے دوران سرور کی خرابی۔"
        }
    };

    // Helper to get translated message
    req.t = (key) => {
        const locale = translations[req.locale] ? req.locale : 'en';
        return translations[locale][key] || key;
    };

    next();
};

module.exports = langMiddleware;
