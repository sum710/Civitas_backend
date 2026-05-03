const { supabaseAdmin } = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const registerUser = async (req, res) => {
    console.log("Registering User:", req.body);

    const { full_name, email, password, cnic } = req.body;

    if (!full_name || !email || !password || !cnic) {
        return res.status(400).json({ message: "All fields are required" });
    }

    // Password Complexity Validation
    const passwordErrors = [];
    if (password.length < 8) passwordErrors.push("Minimum 8 characters");
    if (!/[A-Z]/.test(password)) passwordErrors.push("At least 1 uppercase letter");
    if (!/[a-z]/.test(password)) passwordErrors.push("At least 1 lowercase letter");
    if (!/\d/.test(password)) passwordErrors.push("At least 1 number");
    if (!/[!@#$%^&*]/.test(password)) passwordErrors.push("At least 1 special character (e.g., !@#$%^&*)");

    if (passwordErrors.length > 0) {
        return res.status(400).json({ 
            message: "Password does not meet complexity requirements", 
            errors: passwordErrors 
        });
    }

    try {
        // Check if user exists
        const { data: userCheck, error: checkError } = await supabaseAdmin
            .from('users')
            .select('*')
            .or(`email.eq.${email},cnic.eq.${cnic}`);

        if (checkError) {
            console.error("Check user error:", checkError);
            throw checkError;
        }

        if (userCheck && userCheck.length > 0) {
            return res.status(400).json({ message: "User with this email or CNIC already exists" });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // Insert new user
        const { data: newUser, error: insertError } = await supabaseAdmin
            .from('users')
            .insert([{
                full_name,
                email,
                password_hash: passwordHash,
                cnic,
                role: req.body.role || 'member'
            }])
            .select('id, full_name, email, role')
            .single();

        if (insertError) {
            console.error("Insert user error:", insertError);
            if (insertError.code === '23505') {
                return res.status(400).json({ message: "User with this email or CNIC already exists" });
            }
            throw insertError;
        }

        res.status(201).json({
            message: "User registered successfully",
            user: newUser
        });

    } catch (error) {
        console.error("Registration Error Details:", error);
        
        // Handle specific Supabase or DB errors
        let errorMessage = "Server error during registration";
        if (error.message) errorMessage = error.message;
        if (error.details) errorMessage += `: ${error.details}`;
        
        res.status(500).json({ 
            message: "Registration failed", 
            error: errorMessage,
            code: error.code || 'UNKNOWN_ERROR'
        });
    }
};

const loginUser = async (req, res) => {
    console.log("Logging in User:", req.body);
    const { email, password } = req.body;

    try {
        // Find user
        const { data: user, error: findError } = await supabaseAdmin
            .from('users')
            .select('*')
            .eq('email', email)
            .single();

        if (findError || !user) {
            return res.status(400).json({ message: "Invalid Credentials" });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid Credentials" });
        }

        // Create Token
        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET || 'secret', { expiresIn: '1h' });

        res.json({
            message: "Login Successful",
            token,
            user: {
                id: user.id,
                full_name: user.full_name,
                email: user.email,
                role: user.role,
                profile_picture: user.profile_picture || null,
                trust_score: user.trust_score || 0,
                wallet_balance: user.wallet_balance || 0,
                is_2fa_enabled: user.is_2fa_enabled || false
            }
        });

    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ message: "Server error during login" });
    }
};

const getGoogleAuthUrl = async (req, res) => {
    try {
        const dynamicRedirect = req.query.redirect_to;
        const redirectTo = dynamicRedirect || (process.env.FRONTEND_URL ? `${process.env.FRONTEND_URL}/auth/callback` : null);

        if (!redirectTo) {
            throw new Error("Missing redirect URL. Please configure FRONTEND_URL or pass redirect_to parameter.");
        }

        const { data, error } = await supabaseAdmin.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: redirectTo,
                queryParams: {
                    access_type: 'offline',
                    prompt: 'consent',
                }
            }
        });

        if (error) throw error;

        res.json({ url: data.url });
    } catch (error) {
        console.error("Google Auth URL Error:", error);
        res.status(500).json({ message: "Could not initiate Google login" });
    }
};

const googleCallback = async (req, res) => {
    const { access_token } = req.body;

    if (!access_token) {
        return res.status(400).json({ message: "Access token is required" });
    }

    try {
        // Verify token with Supabase Auth
        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(access_token);

        if (authError || !user) {
            return res.status(401).json({ message: "Invalid or expired Google token" });
        }

        const email = user.email;
        const full_name = user.user_metadata?.full_name || email.split('@')[0];

        // Check if user exists in custom users table
        let { data: customUser, error: findError } = await supabaseAdmin
            .from('users')
            .select('*')
            .eq('email', email)
            .single();

        if (findError && findError.code !== 'PGRST116') {
            throw findError;
        }

        if (!customUser) {
            // Register new user automatically
            const { data: newUser, error: insertError } = await supabaseAdmin
                .from('users')
                .insert([{
                    email,
                    full_name,
                    cnic: `GOOGLE-${user.id.substring(0, 8)}`, // Fallback for required field
                    password_hash: 'OAUTH_PROVIDER_NO_PASSWORD',
                    role: 'member'
                }])
                .select('*')
                .single();

            if (insertError) throw insertError;
            customUser = newUser;
        }

        // Generate Custom JWT Token
        const token = jwt.sign({ id: customUser.id }, process.env.JWT_SECRET || 'secret', { expiresIn: '1h' });

        res.json({
            message: "Google Login Successful",
            token,
            user: {
                id: customUser.id,
                full_name: customUser.full_name,
                email: customUser.email,
                role: customUser.role,
                trust_score: customUser.trust_score || 0,
                wallet_balance: customUser.wallet_balance || 0,
                is_2fa_enabled: customUser.is_2fa_enabled || false
            }
        });

    } catch (error) {
        console.error("Google Callback Error:", error);
        res.status(500).json({ message: error.message || "Server error during Google login" });
    }
};

const speakeasy = require('speakeasy');
const QRCode = require('qrcode');

const generate2FA = async (req, res) => {
    try {
        const userId = req.user.id;
        const { data: user, error } = await supabaseAdmin.from('users').select('email').eq('id', userId).single();
        if (error || !user) return res.status(404).json({ message: "User not found" });

        const secret = speakeasy.generateSecret({
            name: `Civitas (${user.email})`
        });

        // Save secret temporarily (or overwrite existing if not enabled yet)
        await supabaseAdmin.from('users').update({ two_factor_secret: secret.base32 }).eq('id', userId);

        QRCode.toDataURL(secret.otpauth_url, (err, data_url) => {
            if (err) return res.status(500).json({ message: "Error generating QR code" });
            res.json({
                secret: secret.base32,
                qrCode: data_url
            });
        });
    } catch (error) {
        console.error("Generate 2FA Error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

const verify2FA = async (req, res) => {
    try {
        const userId = req.user.id;
        const { token } = req.body;

        const { data: user, error } = await supabaseAdmin.from('users').select('two_factor_secret').eq('id', userId).single();
        if (error || !user) return res.status(404).json({ message: "User not found" });

        const verified = speakeasy.totp.verify({
            secret: user.two_factor_secret,
            encoding: 'base32',
            token: token
        });

        if (verified) {
            await supabaseAdmin.from('users').update({ is_2fa_enabled: true }).eq('id', userId);
            res.json({ message: "2FA verified and enabled successfully" });
        } else {
            res.status(400).json({ message: "Invalid 2FA code" });
        }
    } catch (error) {
        console.error("Verify 2FA Error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

const verifyPayment2FA = async (req, res) => {
    try {
        const userId = req.user.id;
        const { token } = req.body;

        const { data: user, error } = await supabaseAdmin.from('users').select('two_factor_secret, is_2fa_enabled').eq('id', userId).single();
        if (error || !user) return res.status(404).json({ message: "User not found" });

        if (!user.is_2fa_enabled) {
            return res.json({ verified: true, message: "2FA not enabled" }); // Skip verification if not enabled
        }

        const verified = speakeasy.totp.verify({
            secret: user.two_factor_secret,
            encoding: 'base32',
            token: token
        });

        if (verified) {
            res.json({ verified: true, message: "2FA verified successfully" });
        } else {
            res.status(400).json({ verified: false, message: "Invalid 2FA code" });
        }
    } catch (error) {
        console.error("Verify Payment 2FA Error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

const get2FAStatus = async (req, res) => {
    try {
        const userId = req.user.id;
        const { data: user, error } = await supabaseAdmin.from('users').select('is_2fa_enabled').eq('id', userId).single();
        if (error || !user) return res.status(404).json({ message: "User not found" });
        res.json({ is_2fa_enabled: user.is_2fa_enabled });
    } catch (error) {
        console.error("Get 2FA Status Error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

module.exports = {
    registerUser,
    loginUser,
    getGoogleAuthUrl,
    googleCallback,
    generate2FA,
    verify2FA,
    verifyPayment2FA,
    get2FAStatus
};
