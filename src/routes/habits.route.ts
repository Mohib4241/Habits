import { Router } from 'express';
import { HabitsController } from '../controllers/habits.controller';
import { verifyToken } from '../middleware/verifyToken';
import { validateRequest } from '../middleware/validation.middleware';
import { createHabitSchema, updateHabitSchema, queryHabitSchema } from '../validations/habits.validation';
import { habitIdParamSchema } from '../validations/tracking.validation';

const router = Router();

/**
 * Habit management feature endpoints.
 * All routes are protected by verifyToken middleware.
 */

// Global middleware for this route set
router.use(verifyToken);

// POST /api/v1/habits
router.post(
    '/',
    validateRequest(createHabitSchema, 'body'),
    HabitsController.createHabit
);

// GET /api/v1/habits
router.get(
    '/',
    validateRequest(queryHabitSchema, 'query'),
    HabitsController.getAllHabits
);

// GET /api/v1/habits/:id
router.get(
    '/:id',
    validateRequest(habitIdParamSchema, 'params'),
    HabitsController.getHabitDetails
);

// PUT /api/v1/habits/:id
router.put(
    '/:id',
    validateRequest(habitIdParamSchema, 'params'),
    validateRequest(updateHabitSchema, 'body'),
    HabitsController.updateHabit
);

// DELETE /api/v1/habits/:id
router.delete(
    '/:id',
    validateRequest(habitIdParamSchema, 'params'),
    HabitsController.deleteHabit
);

export default router;
