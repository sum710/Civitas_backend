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
                trust_score: user.trust_score || 0,
                wallet_balance: user.wallet_balance || 0
            }
        });

    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ message: "Server error during login" });
    }
};

module.exports = {
    registerUser,
    loginUser
};
