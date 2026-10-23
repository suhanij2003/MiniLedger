-- ============================================================
-- MiniLedger App — Database Schema
-- Run this file in psql or pgAdmin to set up all tables
-- Command: psql -U postgres -d miniledger_db -f schema.sql
-- ============================================================

-- ----------------------------------------
-- TABLE: users
-- Stores user accounts identified by phone number
-- ----------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id          SERIAL PRIMARY KEY,
    phone       VARCHAR(20) UNIQUE  NOT NULL,
    name        VARCHAR(100)        DEFAULT 'User',
    created_at  TIMESTAMP           DEFAULT NOW()
);

-- ----------------------------------------
-- TABLE: otps
-- Stores generated one-time passwords for authentication
-- ----------------------------------------
CREATE TABLE IF NOT EXISTS otps (
    id          SERIAL PRIMARY KEY,
    phone       VARCHAR(20) NOT NULL,
    otp_code    VARCHAR(10) NOT NULL,
    expires_at  TIMESTAMP   NOT NULL,
    is_used     BOOLEAN     DEFAULT FALSE,
    created_at  TIMESTAMP   DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_otps_phone ON otps(phone);

-- ----------------------------------------
-- TABLE: loans
-- Stores friend loans tracked by each user
-- ----------------------------------------
CREATE TABLE IF NOT EXISTS loans (
    id           SERIAL PRIMARY KEY,
    user_id      INTEGER             NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    friend_name  VARCHAR(120)        NOT NULL,
    amount       NUMERIC(12, 2)      NOT NULL CHECK (amount > 0),
    due_date     DATE                NOT NULL,
    is_repaid    BOOLEAN             NOT NULL DEFAULT FALSE,
    repaid_at    TIMESTAMP,
    notes        TEXT,
    created_at   TIMESTAMP           DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_loans_user_id ON loans(user_id);
CREATE INDEX IF NOT EXISTS idx_loans_due_date ON loans(due_date);
