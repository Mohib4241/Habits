/**
 * ============================================================
 * CONTROLLERS — TrackingController Unit Tests
 * ============================================================
 */

jest.mock('../../../src/services/tracking.services');
jest.mock('../../../src/utility/Redis');

import { Response, NextFunction } from 'express';
import { TrackingController } from '../../../src/controllers/tracking.controller';
import { TrackingService } from '../../../src/services/tracking.services';
import { AuthenticatedRequest } from '../../../src/types/auth.types';

const mockTrackHabit        = TrackingService.trackHabit        as jest.Mock;
const mockGetTrackingHistory = TrackingService.getTrackingHistory as jest.Mock;

const buildRes = () => {
    const res: Partial<Response> = {
        status: jest.fn().mockReturnThis() as any,
        json:   jest.fn().mockReturnThis() as any,
    };
    return res as Response;
};

const mockAuthReq = (overrides: Partial<AuthenticatedRequest> = {}): AuthenticatedRequest => ({
    user:   { id: 10, email: 'user@test.com' },
    body:   {},
    params: {},
    query:  {},
    headers: {},
    ...overrides,
} as AuthenticatedRequest);

const MOCK_LOG     = { id: 1, habit_id: 1, user_id: 10, completed_date: '2024-05-15', completed_at: new Date() };
const MOCK_HISTORY = {
    habitId: 1,
    history: [MOCK_LOG],
    stats: { currentStreak: 3, longestStreak: 5, totalCompletions: 10 },
};

// ── trackHabitCompletion ──────────────────────────────────────────────────────

describe('TrackingController.trackHabitCompletion', () => {

    it('returns 201 with tracking log on success', async () => {
        mockTrackHabit.mockResolvedValueOnce(MOCK_LOG);

        const req  = mockAuthReq({ params: { id: '1' }, body: { completed_date: '2024-05-15' } });
        const res  = buildRes();
        const next = jest.fn() as NextFunction;

        await TrackingController.trackHabitCompletion(req, res, next);

        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ success: true, data: MOCK_LOG })
        );
    });

    it('passes userId, habitId, and completed_date to service', async () => {
        mockTrackHabit.mockResolvedValueOnce(MOCK_LOG);

        const req  = mockAuthReq({
            user:   { id: 5, email: 'u@t.com' },
            params: { id: '3' },
            body:   { completed_date: '2024-05-10' },
        });
        const res  = buildRes();
        const next = jest.fn() as NextFunction;

        await TrackingController.trackHabitCompletion(req, res, next);

        expect(mockTrackHabit).toHaveBeenCalledWith(5, 3, '2024-05-10');
    });

    it('passes undefined completed_date when not in body', async () => {
        mockTrackHabit.mockResolvedValueOnce(MOCK_LOG);

        const req  = mockAuthReq({ params: { id: '1' }, body: {} });
        const res  = buildRes();
        const next = jest.fn() as NextFunction;

        await TrackingController.trackHabitCompletion(req, res, next);

        expect(mockTrackHabit).toHaveBeenCalledWith(10, 1, undefined);
    });

    it('calls next(err) on 409 duplicate error', async () => {
        const err: any = new Error('Already tracked');
        err.statusCode = 409;
        mockTrackHabit.mockRejectedValueOnce(err);

        const req  = mockAuthReq({ params: { id: '1' }, body: { completed_date: '2024-05-15' } });
        const res  = buildRes();
        const next = jest.fn() as NextFunction;

        await TrackingController.trackHabitCompletion(req, res, next);

        expect(next).toHaveBeenCalledWith(err);
        expect(res.json).not.toHaveBeenCalled();
    });

    it('calls next(err) on habit not found (404)', async () => {
        const err: any = new Error('Not found');
        err.statusCode = 404;
        mockTrackHabit.mockRejectedValueOnce(err);

        const req  = mockAuthReq({ params: { id: '999' }, body: {} });
        const res  = buildRes();
        const next = jest.fn() as NextFunction;

        await TrackingController.trackHabitCompletion(req, res, next);

        expect(next).toHaveBeenCalledWith(err);
    });

    it('parses habitId as integer from params.id', async () => {
        mockTrackHabit.mockResolvedValueOnce(MOCK_LOG);

        const req  = mockAuthReq({ params: { id: '42' }, body: {} });
        const res  = buildRes();
        const next = jest.fn() as NextFunction;

        await TrackingController.trackHabitCompletion(req, res, next);

        expect(mockTrackHabit).toHaveBeenCalledWith(10, 42, undefined);
    });
});

// ── getHabitHistoryStats ──────────────────────────────────────────────────────

describe('TrackingController.getHabitHistoryStats', () => {

    it('returns 200 with history and streak stats', async () => {
        mockGetTrackingHistory.mockResolvedValueOnce(MOCK_HISTORY);

        const req  = mockAuthReq({ params: { id: '1' } });
        const res  = buildRes();
        const next = jest.fn() as NextFunction;

        await TrackingController.getHabitHistoryStats(req, res, next);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ success: true, data: MOCK_HISTORY })
        );
    });

    it('passes userId and habitId to TrackingService', async () => {
        mockGetTrackingHistory.mockResolvedValueOnce(MOCK_HISTORY);

        const req  = mockAuthReq({
            user:   { id: 7, email: 'u@t.com' },
            params: { id: '2' },
        });
        const res  = buildRes();
        const next = jest.fn() as NextFunction;

        await TrackingController.getHabitHistoryStats(req, res, next);

        expect(mockGetTrackingHistory).toHaveBeenCalledWith(7, 2);
    });

    it('calls next(err) on service error', async () => {
        mockGetTrackingHistory.mockRejectedValueOnce(new Error('DB error'));

        const req  = mockAuthReq({ params: { id: '1' } });
        const res  = buildRes();
        const next = jest.fn() as NextFunction;

        await TrackingController.getHabitHistoryStats(req, res, next);

        expect(next).toHaveBeenCalled();
    });
});
