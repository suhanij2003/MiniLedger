// ============================================================
// Automated Test Suite for MiniLedger Backend API
// Tests health check, phone OTP auth, loan creation, repayment, and calculations.
// ============================================================

const request = require('supertest');
const jwt = require('jsonwebtoken');

// Mock PostgreSQL pool
jest.mock('../config/db', () => ({
    query: jest.fn(),
}));

const pool = require('../config/db');
process.env.JWT_SECRET = 'test_jwt_secret_12345';
process.env.NODE_ENV = 'test';

const app = require('../server');

describe('MiniLedger API Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    // ────────────────────────────────────────────────────────────
    // 1. Health Check
    // ────────────────────────────────────────────────────────────
    describe('GET /api/health', () => {
        it('should return 200 OK with service status', async () => {
            const res = await request(app).get('/api/health');
            expect(res.status).toBe(200);
            expect(res.body.status).toBe('OK');
            expect(res.body.service).toBe('MiniLedger Backend API');
            expect(res.body.timestamp).toBeDefined();
        });
    });

    // ────────────────────────────────────────────────────────────
    // 2. Authentication: Send OTP
    // ────────────────────────────────────────────────────────────
    describe('POST /api/auth/send-otp', () => {
        it('should reject requests with missing or invalid phone number', async () => {
            const res = await request(app)
                .post('/api/auth/send-otp')
                .send({ phone: '123' });

            expect(res.status).toBe(400);
            expect(res.body.errors).toBeDefined();
        });

        it('should generate OTP and save to database on valid phone', async () => {
            pool.query.mockResolvedValueOnce({ rows: [] });

            const res = await request(app)
                .post('/api/auth/send-otp')
                .send({ phone: '9876543210' });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.phone).toBe('9876543210');
            expect(pool.query).toHaveBeenCalledWith(
                expect.stringContaining('INSERT INTO otps'),
                expect.arrayContaining(['9876543210'])
            );
        });
    });

    // ────────────────────────────────────────────────────────────
    // 3. Authentication: Verify OTP
    // ────────────────────────────────────────────────────────────
    describe('POST /api/auth/verify-otp', () => {
        it('should reject non-existing or wrong OTP', async () => {
            pool.query.mockResolvedValueOnce({
                rows: [{
                    id: 1,
                    phone: '9876543210',
                    otp_code: '123456',
                    expires_at: new Date(Date.now() + 60000),
                    is_used: false,
                }],
            });

            const res = await request(app)
                .post('/api/auth/verify-otp')
                .send({ phone: '9876543210', otp: '999999' });

            expect(res.status).toBe(400);
            expect(res.body.message).toMatch(/incorrect/i);
        });

        it('should reject expired OTP', async () => {
            pool.query.mockResolvedValueOnce({
                rows: [{
                    id: 1,
                    phone: '9876543210',
                    otp_code: '123456',
                    expires_at: new Date(Date.now() - 10000), // Expired
                    is_used: false,
                }],
            });

            const res = await request(app)
                .post('/api/auth/verify-otp')
                .send({ phone: '9876543210', otp: '123456' });

            expect(res.status).toBe(400);
            expect(res.body.message).toMatch(/expired/i);
        });

        it('should reject already used OTP', async () => {
            pool.query.mockResolvedValueOnce({
                rows: [{
                    id: 1,
                    phone: '9876543210',
                    otp_code: '123456',
                    expires_at: new Date(Date.now() + 60000),
                    is_used: true, // Already used
                }],
            });

            const res = await request(app)
                .post('/api/auth/verify-otp')
                .send({ phone: '9876543210', otp: '123456' });

            expect(res.status).toBe(400);
            expect(res.body.message).toMatch(/already been used/i);
        });

        it('should authenticate user and return valid JWT on correct OTP', async () => {
            // 1. Find OTP
            pool.query.mockResolvedValueOnce({
                rows: [{
                    id: 1,
                    phone: '9876543210',
                    otp_code: '123456',
                    expires_at: new Date(Date.now() + 60000),
                    is_used: false,
                }],
            });
            // 2. Update is_used
            pool.query.mockResolvedValueOnce({ rows: [] });
            // 3. Find user
            pool.query.mockResolvedValueOnce({
                rows: [{
                    id: 42,
                    phone: '9876543210',
                    name: 'Test Friend',
                    created_at: new Date(),
                }],
            });

            const res = await request(app)
                .post('/api/auth/verify-otp')
                .send({ phone: '9876543210', otp: '123456' });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.token).toBeDefined();
            expect(res.body.user.id).toBe(42);

            // Verify JWT
            const decoded = jwt.verify(res.body.token, process.env.JWT_SECRET);
            expect(decoded.id).toBe(42);
            expect(decoded.phone).toBe('9876543210');
        });
    });

    // ────────────────────────────────────────────────────────────
    // 4. Loan Management
    // ────────────────────────────────────────────────────────────
    describe('Loans Endpoints', () => {
        const testUser = { id: 10, phone: '9876543210' };
        const authToken = jwt.sign(testUser, process.env.JWT_SECRET);

        it('POST /api/loans should reject unauthenticated requests', async () => {
            const res = await request(app)
                .post('/api/loans')
                .send({ friend_name: 'Rahul', amount: 500, due_date: '2026-12-31' });

            expect(res.status).toBe(401);
        });

        it('POST /api/loans should validate input fields', async () => {
            const res = await request(app)
                .post('/api/loans')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ friend_name: '', amount: -50, due_date: 'invalid-date' });

            expect(res.status).toBe(400);
            expect(res.body.errors).toBeDefined();
        });

        it('POST /api/loans should successfully create a loan', async () => {
            const mockLoan = {
                id: 1,
                user_id: 10,
                friend_name: 'Rahul',
                amount: '5000.00',
                due_date: '2026-12-31',
                is_repaid: false,
                notes: 'Emergency laptop repair',
            };
            pool.query.mockResolvedValueOnce({ rows: [mockLoan] });

            const res = await request(app)
                .post('/api/loans')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    friend_name: 'Rahul',
                    amount: 5000,
                    due_date: '2026-12-31',
                    notes: 'Emergency laptop repair',
                });

            expect(res.status).toBe(201);
            expect(res.body.message).toMatch(/added successfully/i);
            expect(res.body.loan.friend_name).toBe('Rahul');
        });

        it('PATCH /api/loans/:id/repay should mark an unpaid loan as repaid', async () => {
            // Existing loan check
            pool.query.mockResolvedValueOnce({
                rows: [{
                    id: 1,
                    user_id: 10,
                    friend_name: 'Rahul',
                    amount: '5000.00',
                    is_repaid: false,
                }],
            });
            // Update
            pool.query.mockResolvedValueOnce({
                rows: [{
                    id: 1,
                    user_id: 10,
                    friend_name: 'Rahul',
                    amount: '5000.00',
                    is_repaid: true,
                    repaid_at: new Date(),
                }],
            });

            const res = await request(app)
                .patch('/api/loans/1/repay')
                .set('Authorization', `Bearer ${authToken}`);

            expect(res.status).toBe(200);
            expect(res.body.loan.is_repaid).toBe(true);
        });

        it('PATCH /api/loans/:id/repay should reject already repaid loan', async () => {
            pool.query.mockResolvedValueOnce({
                rows: [{
                    id: 1,
                    user_id: 10,
                    friend_name: 'Rahul',
                    amount: '5000.00',
                    is_repaid: true,
                    repaid_at: new Date(),
                }],
            });

            const res = await request(app)
                .patch('/api/loans/1/repay')
                .set('Authorization', `Bearer ${authToken}`);

            expect(res.status).toBe(400);
            expect(res.body.message).toMatch(/already been marked as repaid/i);
        });

        it('GET /api/loans/summary calculates lent, repaid, outstanding, overdue', async () => {
            pool.query.mockResolvedValueOnce({
                rows: [{
                    total_lent: '12000.00',
                    total_repaid: '5000.00',
                    outstanding: '7000.00',
                    overdue: '3000.00',
                    total_count: '4',
                    repaid_count: '1',
                    unpaid_count: '3',
                    overdue_count: '1',
                }],
            });

            const res = await request(app)
                .get('/api/loans/summary')
                .set('Authorization', `Bearer ${authToken}`);

            expect(res.status).toBe(200);
            expect(res.body.summary).toEqual({
                total_lent: 12000,
                total_repaid: 5000,
                outstanding: 7000,
                overdue: 3000,
                total_count: 4,
                repaid_count: 1,
                unpaid_count: 3,
                overdue_count: 1,
            });
        });
    });
});
