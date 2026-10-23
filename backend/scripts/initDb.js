// ============================================================
// initDb.js — Database Migration & Table Setup Script
// Reads schema.sql and creates tables in the connected PostgreSQL DB
// ============================================================

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const pool = require('../config/db');

async function initDb() {
    try {
        console.log('Initializing MiniLedger database tables...');
        const schemaPath = path.join(__dirname, '..', 'config', 'schema.sql');
        const sql = fs.readFileSync(schemaPath, 'utf8');
        await pool.query(sql);
        console.log('✓ Successfully created tables: users, otps, loans, and their indexes.');
        await pool.end();
        process.exit(0);
    } catch (err) {
        console.error('✗ Failed to initialize database:', err.message);
        await pool.end();
        process.exit(1);
    }
}

initDb();
