import { Router } from 'express';
import { TrackingController } from '../controllers/tracking.controller';
import { verifyToken } from '../middleware/verifyToken';
import { validateRequest } from '../middleware/validation.middleware';
import { trackHabitSchema, habitIdParamSchema } from '../validations/tracking.validation';

const router = Router();

/**
 * Habit tracking and history retrieval feature endpoints.
 * All routes are protected by verifyToken middleware.
 */

router.use(verifyToken);

// POST /api/v1/habits/:id/track
router.post(
    '/:id/track',
    validateRequest(habitIdParamSchema, 'params'),
    validateRequest(trackHabitSchema, 'body'),
    TrackingController.trackHabitCompletion
);

// GET /api/v1/habits/:id/history
router.get(
    '/:id/history',
    validateRequest(habitIdParamSchema, 'params'),
    TrackingController.getHabitHistoryStats
);

export default router;
