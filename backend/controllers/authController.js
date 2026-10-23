// ============================================================
// Controller: authController.js
// Handles phone-based authentication via OTP and JWT token issuance.
// ============================================================

const pool = require('../config/db');
const jwt  = require('jsonwebtoken');
const { validationResult } = require('express-validator');

// ----------------------------------------
// Helper: generate signed JWT for user
// ----------------------------------------
const generateToken = (user) => {
    return jwt.sign(
        { id: user.id, phone: user.phone },
        process.env.JWT_SECRET || 'miniledger_default_jwt_secret_key',
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
};

// ============================================================
// @route   POST /api/auth/send-otp
// @desc    Generate 6-digit OTP, print to terminal, and persist
// @access  Public
// ============================================================
const sendOtp = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { phone } = req.body;
    const cleanPhone = phone.trim();

    try {
        // Generate a 6-digit numeric OTP
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

        // Expire in 5 minutes
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

        // Store OTP in database
        await pool.query(
            `INSERT INTO otps (phone, otp_code, expires_at, is_used)
             VALUES ($1, $2, $3, false)`,
            [cleanPhone, otpCode, expiresAt]
        );

        // Required by spec: print OTP to terminal
        console.log('\n=========================================');
        console.log(`🔑 [MiniLedger OTP] Phone: ${cleanPhone} | OTP: ${otpCode}`);
        console.log(`⏰ Valid for 5 minutes (Expires at: ${expiresAt.toLocaleTimeString()})`);
        console.log('=========================================\n');

        return res.status(200).json({
            success: true,
            message: 'OTP sent successfully. Check the server console.',
            phone: cleanPhone,
            // Expose in non-production environments to ease testing if needed
            ...(process.env.NODE_ENV === 'test' ? { testOtp: otpCode } : {})
        });
    } catch (err) {
        console.error('sendOtp error:', err.message);
        return res.status(500).json({ message: 'Failed to send OTP. Please try again.' });
    }
};

// ============================================================
// @route   POST /api/auth/verify-otp
// @desc    Verify OTP, reject expired/reused, issue JWT
// @access  Public
// ============================================================
const verifyOtp = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { phone, otp } = req.body;
    const cleanPhone = phone.trim();
    const cleanOtp = otp.toString().trim();

    try {
        // Query the latest OTP entry for this phone
        const otpResult = await pool.query(
            `SELECT * FROM otps
             WHERE phone = $1
             ORDER BY created_at DESC
             LIMIT 1`,
            [cleanPhone]
        );

        if (otpResult.rows.length === 0) {
            return res.status(400).json({ message: 'No OTP requested for this phone number.' });
        }

        const otpRecord = otpResult.rows[0];

        // Reject if already used
        if (otpRecord.is_used) {
            return res.status(400).json({ message: 'This OTP has already been used. Please request a new one.' });
        }

        // Reject if expired
        const now = new Date();
        if (now > new Date(otpRecord.expires_at)) {
            return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
        }

        // Verify match
        if (otpRecord.otp_code !== cleanOtp) {
            return res.status(400).json({ message: 'Incorrect OTP. Please enter the correct code.' });
        }

        // Mark OTP as used to prevent reuse
        await pool.query(
            'UPDATE otps SET is_used = true WHERE id = $1',
            [otpRecord.id]
        );

        // Find or create user
        let userResult = await pool.query(
            'SELECT id, phone, name, created_at FROM users WHERE phone = $1',
            [cleanPhone]
        );

        let user;
        if (userResult.rows.length === 0) {
            const insertResult = await pool.query(
                `INSERT INTO users (phone, name)
                 VALUES ($1, $2)
                 RETURNING id, phone, name, created_at`,
                [cleanPhone, 'User ' + cleanPhone.slice(-4)]
            );
            user = insertResult.rows[0];
        } else {
            user = userResult.rows[0];
        }

        const token = generateToken(user);

        return res.status(200).json({
            success: true,
            message: 'Authentication successful!',
            token,
            user: {
                id: user.id,
                phone: user.phone,
                name: user.name,
                created_at: user.created_at,
            },
        });
    } catch (err) {
        console.error('verifyOtp error:', err.message);
        return res.status(500).json({ message: 'Verification failed. Please try again.' });
    }
};

// ============================================================
// @route   GET /api/auth/me
// @desc    Get currently logged in user profile
// @access  Private
// ============================================================
const getMe = async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, phone, name, created_at FROM users WHERE id = $1',
            [req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'User not found.' });
        }

        return res.status(200).json({ user: result.rows[0] });
    } catch (err) {
        console.error('getMe error:', err.message);
        return res.status(500).json({ message: 'Server error. Please try again.' });
    }
};

module.exports = {
    sendOtp,
    verifyOtp,
    getMe,
};
