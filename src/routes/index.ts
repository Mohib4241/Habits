import { Router } from 'express';
import authRoutes from './auth.route';
import habitsRoutes from './habits.route';
import trackingRoutes from './tracking.route';

const router = Router();

/**
 * Main application routing index bundling feature controllers.
 */

// Mount Authentication routes under /auth prefix
router.use('/auth', authRoutes);

// Mount Habit CRUD routes under /habits prefix
router.use('/habits', habitsRoutes);

// Mount Tracking feature sub-routes sharing the /habits prefix pattern
router.use('/habits', trackingRoutes);

export default router;
