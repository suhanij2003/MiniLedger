// ============================================================
// Routes: authRoutes.js
// Authentication routes for MiniLedger (Phone + OTP).
// ============================================================

const express = require('express');
const { body } = require('express-validator');
const rateLimit = require('express-rate-limit');

const { sendOtp, verifyOtp, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// ----------------------------------------
// Rate Limiter: Max 5 OTP requests per 10 minutes
// ----------------------------------------
const otpLimiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 10, // Limit each IP to 10 requests per window
    message: {
        message: 'Too many OTP requests. Please wait a few minutes before trying again.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// ----------------------------------------
// POST /api/auth/send-otp
// ----------------------------------------
router.post(
    '/send-otp',
    otpLimiter,
    [
        body('phone')
            .trim()
            .notEmpty()
            .withMessage('Phone number is required.')
            .matches(/^[0-9+()\-\s]{8,20}$/)
            .withMessage('Please enter a valid phone number (e.g. 9876543210 or +919876543210).')
    ],
    sendOtp
);

// ----------------------------------------
// POST /api/auth/verify-otp
// ----------------------------------------
router.post(
    '/verify-otp',
    [
        body('phone')
            .trim()
            .notEmpty()
            .withMessage('Phone number is required.'),
        body('otp')
            .trim()
            .notEmpty()
            .withMessage('OTP code is required.')
            .isLength({ min: 4, max: 10 })
            .withMessage('OTP must be valid.')
    ],
    verifyOtp
);

// ----------------------------------------
// GET /api/auth/me
// ----------------------------------------
router.get('/me', protect, getMe);

module.exports = router;
