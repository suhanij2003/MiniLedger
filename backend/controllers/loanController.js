// ============================================================
// Controller: loanController.js
// Handles friend-loan CRUD, repayments, and summary calculations.
// All operations are strictly scoped to the authenticated user.
// ============================================================

const pool = require('../config/db');
const { validationResult } = require('express-validator');

// ============================================================
// @route   POST /api/loans
// @desc    Add a new loan to a friend
// @access  Private
// ============================================================
const createLoan = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.user.id;
    const { friend_name, amount, due_date, notes } = req.body;

    try {
        const result = await pool.query(
            `INSERT INTO loans (user_id, friend_name, amount, due_date, notes)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING id, user_id, friend_name, amount, due_date, is_repaid, repaid_at, notes, created_at`,
            [userId, friend_name.trim(), parseFloat(amount), due_date, notes ? notes.trim() : null]
        );

        return res.status(201).json({
            message: 'Loan added successfully!',
            loan: result.rows[0],
        });
    } catch (err) {
        console.error('createLoan error:', err.message);
        return res.status(500).json({ message: 'Server error. Could not create loan.' });
    }
};

// ============================================================
// @route   GET /api/loans
// @desc    Get all loans for the logged-in user with filtering & search
//          Query params:
//            ?status=all|unpaid|repaid|overdue
//            ?search=alice
//            ?limit=20&page=1
// @access  Private
// ============================================================
const getLoans = async (req, res) => {
    const userId = req.user.id;
    const { status = 'all', search, limit = 50, page = 1 } = req.query;

    try {
        const conditions = ['l.user_id = $1'];
        const params = [userId];
        let paramIndex = 2;

        if (status === 'unpaid') {
            conditions.push('l.is_repaid = false');
        } else if (status === 'repaid') {
            conditions.push('l.is_repaid = true');
        } else if (status === 'overdue') {
            conditions.push('l.is_repaid = false AND l.due_date < CURRENT_DATE');
        }

        if (search && search.trim()) {
            conditions.push(`l.friend_name ILIKE $${paramIndex++}`);
            params.push(`%${search.trim()}%`);
        }

        const whereClause = conditions.join(' AND ');
        const offset = (parseInt(page) - 1) * parseInt(limit);

        const query = `
            SELECT
                l.id,
                l.user_id,
                l.friend_name,
                l.amount,
                l.due_date,
                l.is_repaid,
                l.repaid_at,
                l.notes,
                l.created_at,
                CASE
                    WHEN l.is_repaid = false AND l.due_date < CURRENT_DATE THEN true
                    ELSE false
                END AS is_overdue
            FROM loans l
            WHERE ${whereClause}
            ORDER BY
                CASE WHEN l.is_repaid = false AND l.due_date < CURRENT_DATE THEN 0 ELSE 1 END,
                l.due_date ASC,
                l.created_at DESC
            LIMIT $${paramIndex++} OFFSET $${paramIndex++}
        `;

        params.push(parseInt(limit), offset);

        const result = await pool.query(query, params);

        const countResult = await pool.query(
            `SELECT COUNT(*) FROM loans l WHERE ${whereClause}`,
            params.slice(0, paramIndex - 3)
        );

        return res.status(200).json({
            loans: result.rows,
            pagination: {
                total: parseInt(countResult.rows[0].count),
                page: parseInt(page),
                limit: parseInt(limit),
                total_pages: Math.ceil(parseInt(countResult.rows[0].count) / parseInt(limit)),
            },
        });
    } catch (err) {
        console.error('getLoans error:', err.message);
        return res.status(500).json({ message: 'Server error. Could not fetch loans.' });
    }
};

// ============================================================
// @route   GET /api/loans/:id
// @desc    Get single loan by ID
// @access  Private
// ============================================================
const getLoanById = async (req, res) => {
    const userId = req.user.id;
    const { id } = req.params;

    try {
        const result = await pool.query(
            `SELECT
                l.id,
                l.user_id,
                l.friend_name,
                l.amount,
                l.due_date,
                l.is_repaid,
                l.repaid_at,
                l.notes,
                l.created_at,
                CASE
                    WHEN l.is_repaid = false AND l.due_date < CURRENT_DATE THEN true
                    ELSE false
                END AS is_overdue
             FROM loans l
             WHERE l.id = $1 AND l.user_id = $2`,
            [id, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Loan not found.' });
        }

        return res.status(200).json({ loan: result.rows[0] });
    } catch (err) {
        console.error('getLoanById error:', err.message);
        return res.status(500).json({ message: 'Server error. Could not fetch loan.' });
    }
};

// ============================================================
// @route   PATCH /api/loans/:id/repay
// @desc    Mark an unpaid loan as repaid with timestamp
// @access  Private
// ============================================================
const markAsRepaid = async (req, res) => {
    const userId = req.user.id;
    const { id } = req.params;

    try {
        // Check if loan exists and belongs to user
        const existing = await pool.query(
            'SELECT * FROM loans WHERE id = $1 AND user_id = $2',
            [id, userId]
        );

        if (existing.rows.length === 0) {
            return res.status(404).json({ message: 'Loan not found.' });
        }

        const loan = existing.rows[0];

        // Reject if already repaid
        if (loan.is_repaid) {
            return res.status(400).json({
                message: 'This loan has already been marked as repaid.',
                repaid_at: loan.repaid_at,
            });
        }

        // Update status and timestamp
        const updated = await pool.query(
            `UPDATE loans
             SET is_repaid = true, repaid_at = NOW()
             WHERE id = $1 AND user_id = $2
             RETURNING id, user_id, friend_name, amount, due_date, is_repaid, repaid_at, notes, created_at`,
            [id, userId]
        );

        return res.status(200).json({
            message: 'Loan successfully marked as repaid!',
            loan: updated.rows[0],
        });
    } catch (err) {
        console.error('markAsRepaid error:', err.message);
        return res.status(500).json({ message: 'Server error. Could not update loan repayment.' });
    }
};

// ============================================================
// @route   GET /api/loans/summary
// @desc    Calculate dashboard stats:
//          - Total Lent (all loans)
//          - Total Repaid (repaid loans)
//          - Outstanding (unpaid loans)
//          - Overdue (unpaid loans with due_date strictly < CURRENT_DATE)
// @access  Private
// ============================================================
const getSummary = async (req, res) => {
    const userId = req.user.id;

    try {
        const query = `
            SELECT
                COALESCE(SUM(amount), 0)                                                       AS total_lent,
                COALESCE(SUM(CASE WHEN is_repaid = true THEN amount ELSE 0 END), 0)            AS total_repaid,
                COALESCE(SUM(CASE WHEN is_repaid = false THEN amount ELSE 0 END), 0)           AS outstanding,
                COALESCE(SUM(CASE WHEN is_repaid = false AND due_date < CURRENT_DATE THEN amount ELSE 0 END), 0) AS overdue,
                COUNT(*)                                                                       AS total_count,
                COUNT(CASE WHEN is_repaid = true THEN 1 END)                                   AS repaid_count,
                COUNT(CASE WHEN is_repaid = false THEN 1 END)                                  AS unpaid_count,
                COUNT(CASE WHEN is_repaid = false AND due_date < CURRENT_DATE THEN 1 END)      AS overdue_count
            FROM loans
            WHERE user_id = $1
        `;

        const result = await pool.query(query, [userId]);
        const summary = result.rows[0];

        return res.status(200).json({
            summary: {
                total_lent: parseFloat(summary.total_lent),
                total_repaid: parseFloat(summary.total_repaid),
                outstanding: parseFloat(summary.outstanding),
                overdue: parseFloat(summary.overdue),
                total_count: parseInt(summary.total_count),
                repaid_count: parseInt(summary.repaid_count),
                unpaid_count: parseInt(summary.unpaid_count),
                overdue_count: parseInt(summary.overdue_count),
            },
        });
    } catch (err) {
        console.error('getSummary error:', err.message);
        return res.status(500).json({ message: 'Server error. Could not compute loan summary.' });
    }
};

// ============================================================
// @route   DELETE /api/loans/:id
// @desc    Delete a loan
// @access  Private
// ============================================================
const deleteLoan = async (req, res) => {
    const userId = req.user.id;
    const { id } = req.params;

    try {
        const result = await pool.query(
            'DELETE FROM loans WHERE id = $1 AND user_id = $2 RETURNING id',
            [id, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Loan not found.' });
        }

        return res.status(200).json({ message: 'Loan deleted successfully.' });
    } catch (err) {
        console.error('deleteLoan error:', err.message);
        return res.status(500).json({ message: 'Server error. Could not delete loan.' });
    }
};

module.exports = {
    createLoan,
    getLoans,
    getLoanById,
    markAsRepaid,
    getSummary,
    deleteLoan,
};
