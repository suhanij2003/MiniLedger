// ============================================================
// Middleware: authMiddleware.js
// Verifies the JWT token sent in the Authorization header.
// Attach this to any route that requires the user to be logged in.
// Usage: router.get('/protected', protect, controller)
// ============================================================

const jwt = require('jsonwebtoken');

/**
 * protect — checks for a valid Bearer token in the Authorization header.
 * If valid, attaches the decoded user payload to req.user and calls next().
 * If invalid or missing, responds with 401 Unauthorized.
 */
const protect = (req, res, next) => {
    // Grab the Authorization header value (e.g. "Bearer eyJhbGci...")
    const authHeader = req.headers.authorization;

    // Check that the header exists and starts with "Bearer "
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    // Extract just the token part (everything after "Bearer ")
    const token = authHeader.split(' ')[1];

    try {
        // Verify the token using our secret key from .env
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Attach the decoded payload (id, email) to the request object
        req.user = decoded;

        // Pass control to the next middleware / route handler
        next();
    } catch (err) {
        return res.status(401).json({ message: 'Invalid or expired token.' });
    }
};

module.exports = { protect };
