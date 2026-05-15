import rateLimit from 'express-rate-limit';

/**
 * Global or Route-specific API Rate Limiter to protect endpoints from brute-force and DDoS attacks.
 */
export const apiRateLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    limit: 100, // Limit each IP to 100 requests per hour
    standardHeaders: 'draft-7', // draft-6: `RateLimit-*` headers; draft-7: combined `RateLimit` header
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    message: {
        success: false,
        message: 'Too many requests from this IP, please try again after an hour',
    },
});

/**
 * Stricter Rate Limiter for Authentication endpoints.
 */
export const authRateLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    limit: 20, // Limit each IP to 20 login/register requests per hour
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Too many authentication attempts, please try again later',
    },
});
