// Load environment variables from .env file
require('dotenv').config();

// Import Express framework
const express = require('express');

// Import CORS so our mobile app can talk to this server
const cors = require('cors');

// Import PostgreSQL connection pool
const pool = require('./config/db');

// ── Route imports ────────────────────────────────────────────
const authRoutes = require('./routes/authRoutes');
const loanRoutes = require('./routes/loanRoutes');

// Create the Express app
const app = express();

// Tell Express to accept JSON in request bodies
app.use(express.json());

// Enable CORS for all routes
app.use(cors());

// The port our server runs on
const PORT = process.env.PORT || 3000;

// ── Health check routes ──────────────────────────────────────
app.get('/', (req, res) => {
    res.json({ message: 'MiniLedger API is running! 🚀' });
});

app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        service: 'MiniLedger Backend API',
        timestamp: new Date().toISOString()
    });
});

// ── API Routes ───────────────────────────────────────────────
app.use('/api/auth',  authRoutes);  // Phone & OTP Authentication
app.use('/api/loans', loanRoutes);  // Friend Loans CRUD & Dashboard

// ── Start Server ─────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
    app.listen(PORT, async () => {
        console.log(`✅ MiniLedger Server is running on http://localhost:${PORT}`);

        try {
            await pool.query('SELECT NOW()');
            console.log('✅ PostgreSQL database connected successfully!');
        } catch (err) {
            console.error('❌ Database connection warning:', err.message);
        }
    });
}

module.exports = app;
