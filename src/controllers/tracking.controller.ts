import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/auth.types';
import { TrackingService } from '../services/tracking.services';
import { sendSuccessResponse } from '../helper/responseHandler';

/**
 * Enterprise Controller managing habit tracking logs and streak retrieval interfaces.
 */
export class TrackingController {
    /**
     * Handle requests to log habit completion for target date.
     */
    public static async trackHabitCompletion(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = req.user!.id;
            const habitId = parseInt(req.params.id, 10);
            const { completed_date } = req.body;

            const trackingData = await TrackingService.trackHabit(userId, habitId, completed_date);
            sendSuccessResponse(res, 201, 'Habit completion successfully tracked', trackingData);
        } catch (err) {
            next(err);
        }
    }

    /**
     * Retrieve tracking logs history and calculated streak statistics.
     */
    public static async getHabitHistoryStats(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = req.user!.id;
            const habitId = parseInt(req.params.id, 10);

            const historyData = await TrackingService.getTrackingHistory(userId, habitId);
            sendSuccessResponse(res, 200, 'Tracking history and streak stats retrieved successfully', historyData);
        } catch (err) {
            next(err);
        }
    }
}
