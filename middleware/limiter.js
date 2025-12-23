const rateLimit = require('express-rate-limit');

// 1. General Limiter
// Allow 100 requests per 15 minutes per IP
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 100,
    standardHeaders: true, // Return rate limit information in the `RateLimit-* headers
    legacyHeaders: false, // Disable the X-RateLimit-* headers
    message: {
        status: 429,
        error: 'Too many requests, please try again later.'
    }
});

const authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: 5,
    message: {
        status: 429,
        error: 'Too many login attempts, please try again in an hour'
    }
});

module.exports = {
    globalLimiter,
    authLimiter
}