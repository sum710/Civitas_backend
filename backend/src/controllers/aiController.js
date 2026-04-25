const { GoogleGenerativeAI } = require('@google/generative-ai');
const db = require('../config/db');

// Initialize the AI SDK. Make sure GEMINI_API_KEY is in your .env file
const apiKey = process.env.GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(apiKey);

const getAiAdvice = async (req, res) => {
    try {
        const userId = req.user.id;
        const { userMessage } = req.body;

        if (!userMessage) {
             return res.status(400).json({ success: false, message: "userMessage is required." });
        }

        // 1. Fetch user's wallet balance
        const { data: user, error: userError } = await db.supabaseAdmin
            .from('users')
            .select('wallet_balance')
            .eq('id', userId)
            .single();

        if (userError || !user) {
            return res.status(404).json({ success: false, message: "User not found." });
        }

        const balance = user.wallet_balance;

        // Fallback Mock Mode if API key is not configured yet
        if (!apiKey || apiKey === 'your_actual_api_key_here' || apiKey === 'your_api_key_here') {
             return res.status(200).json({
                 success: true,
                 reply: `*(Mock AI Response)*\n\nI see your current wallet balance is **$${balance}**.\n\n*Note: To connect me to the real Google AI, please add a valid GEMINI_API_KEY to your backend's .env file and restart the server!*`
             });
        }

        // 2. AI Integration
        // We use gemini-2.5-flash as the fast optimal model
        const model = genAI.getGenerativeModel({
             model: "gemini-2.5-flash",
             systemInstruction: `You are a FinTech advisor for the Civitas digital committee app. The user's current wallet balance is $${balance}. Answer their financial questions briefly and professionally. Consider affordable committee contributions if they ask.`
        });

        const chatResult = await model.generateContent(userMessage);
        const aiResponseText = chatResult.response.text();

        return res.status(200).json({
            success: true,
            reply: aiResponseText
        });

    } catch (error) {
        console.error("Error in getAiAdvice:", error);
        res.status(500).json({ success: false, message: "AI generation failed." });
    }
};

module.exports = {
   getAiAdvice
};
