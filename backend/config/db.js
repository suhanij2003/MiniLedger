// Import the Pool class from the 'pg' (node-postgres) library
const { Pool } = require('pg');

// Create a connection pool using credentials from our .env file
// A pool keeps multiple connections ready so the app is fast
const pool = new Pool({
    host:     process.env.DB_HOST,
    port:     process.env.DB_PORT,
    database: process.env.DB_NAME,
    user:     process.env.DB_USER,
    password: process.env.DB_PASSWORD,
});

// Export the pool so any route/controller can use it to query the DB
module.exports = pool;
