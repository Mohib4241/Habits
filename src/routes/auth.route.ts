import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { validateRequest } from '../middleware/validation.middleware';
import { registerSchema, loginSchema } from '../validations/auth.validation';
import { authRateLimiter } from '../middleware/ratelimiter';

const router = Router();

/**
 * Authentication feature endpoints.
 */

// POST /api/v1/auth/register
router.post(
    '/register',
    authRateLimiter,
    validateRequest(registerSchema, 'body'),
    AuthController.register
);

// POST /api/v1/auth/login
router.post(
    '/login',
    authRateLimiter,
    validateRequest(loginSchema, 'body'),
    AuthController.login
);

export default router;
