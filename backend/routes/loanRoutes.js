// ============================================================
// Routes: loanRoutes.js
// Handles /api/loans endpoints with authentication & validation.
// ============================================================

const express = require('express');
const { body } = require('express-validator');

const {
    createLoan,
    getLoans,
    getLoanById,
    markAsRepaid,
    getSummary,
    deleteLoan,
} = require('../controllers/loanController');

const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// All loan routes require authentication
router.use(protect);

// ----------------------------------------
// Validation rules for adding a loan
// ----------------------------------------
const loanValidation = [
    body('friend_name')
        .trim()
        .notEmpty()
        .withMessage('Friend name is required.')
        .isLength({ max: 120 })
        .withMessage('Friend name must be 120 characters or fewer.'),
    body('amount')
        .notEmpty()
        .withMessage('Amount is required.')
        .isFloat({ gt: 0 })
        .withMessage('Amount must be a positive number greater than 0.'),
    body('due_date')
        .notEmpty()
        .withMessage('Due date is required.')
        .isISO8601()
        .withMessage('Due date must be a valid date in YYYY-MM-DD format.'),
    body('notes')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Notes must be 500 characters or fewer.'),
];

// ----------------------------------------
// Routes
// ----------------------------------------

// GET /api/loans/summary — Dashboard calculations (Must be before /:id)
router.get('/summary', getSummary);

// GET /api/loans — List loans with filtering
router.get('/', getLoans);

// GET /api/loans/:id — Single loan details
router.get('/:id', getLoanById);

// POST /api/loans — Create new loan
router.post('/', loanValidation, createLoan);

// PATCH /api/loans/:id/repay — Mark loan as repaid
router.patch('/:id/repay', markAsRepaid);

// DELETE /api/loans/:id — Delete loan
router.delete('/:id', deleteLoan);

module.exports = router;
