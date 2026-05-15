/**
 * ============================================================
 * CONTROLLERS — HabitsController Unit Tests
 * ============================================================
 */

jest.mock('../../../src/services/habits.services');
jest.mock('../../../src/utility/Redis');

import { Response, NextFunction } from 'express';
import { HabitsController } from '../../../src/controllers/habits.controller';
import { HabitsService } from '../../../src/services/habits.services';
import { AuthenticatedRequest } from '../../../src/types/auth.types';

const mockCreateHabit   = HabitsService.createHabit   as jest.Mock;
const mockGetHabits     = HabitsService.getHabits     as jest.Mock;
const mockGetHabitById  = HabitsService.getHabitById  as jest.Mock;
const mockUpdateHabit   = HabitsService.updateHabit   as jest.Mock;
const mockDeleteHabit   = HabitsService.deleteHabit   as jest.Mock;

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

const MOCK_HABIT = { id: 1, user_id: 10, title: 'Morning Run', frequency: 'daily', tags: [] };
const MOCK_LIST  = { meta: { totalItems: 1, currentPage: 1 }, habits: [MOCK_HABIT] };

// ── createHabit ───────────────────────────────────────────────────────────────

describe('HabitsController.createHabit', () => {

    it('returns 201 with created habit data', async () => {
        mockCreateHabit.mockResolvedValueOnce(MOCK_HABIT);

        const req  = mockAuthReq({ body: { title: 'Morning Run' } });
        const res  = buildRes();
        const next = jest.fn() as NextFunction;

        await HabitsController.createHabit(req, res, next);

        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ success: true, data: MOCK_HABIT })
        );
    });

    it('passes userId from req.user to service', async () => {
        mockCreateHabit.mockResolvedValueOnce(MOCK_HABIT);

        const req  = mockAuthReq({ user: { id: 99, email: 'x@test.com' }, body: { title: 'T' } });
        const res  = buildRes();
        const next = jest.fn() as NextFunction;

        await HabitsController.createHabit(req, res, next);

        expect(mockCreateHabit).toHaveBeenCalledWith(99, { title: 'T' });
    });

    it('calls next(err) on service error', async () => {
        const err = new Error('DB error');
        mockCreateHabit.mockRejectedValueOnce(err);

        const req  = mockAuthReq({ body: { title: 'T' } });
        const res  = buildRes();
        const next = jest.fn() as NextFunction;

        await HabitsController.createHabit(req, res, next);

        expect(next).toHaveBeenCalledWith(err);
    });
});

// ── getAllHabits ───────────────────────────────────────────────────────────────

describe('HabitsController.getAllHabits', () => {

    it('returns 200 with habit list and meta', async () => {
        mockGetHabits.mockResolvedValueOnce(MOCK_LIST);

        const req  = mockAuthReq({ query: { page: '1', limit: '10' } });
        const res  = buildRes();
        const next = jest.fn() as NextFunction;

        await HabitsController.getAllHabits(req, res, next);

        expect(res.status).toHaveBeenCalledWith(200);
    });

    it('parses page and limit from query params', async () => {
        mockGetHabits.mockResolvedValueOnce(MOCK_LIST);

        const req  = mockAuthReq({ query: { page: '2', limit: '5' } });
        const res  = buildRes();
        const next = jest.fn() as NextFunction;

        await HabitsController.getAllHabits(req, res, next);

        expect(mockGetHabits).toHaveBeenCalledWith(10, expect.objectContaining({ page: 2, limit: 5 }));
    });

    it('passes undefined when page/limit not present in query', async () => {
        mockGetHabits.mockResolvedValueOnce(MOCK_LIST);

        const req  = mockAuthReq({ query: {} });
        const res  = buildRes();
        const next = jest.fn() as NextFunction;

        await HabitsController.getAllHabits(req, res, next);

        expect(mockGetHabits).toHaveBeenCalledWith(10, expect.objectContaining({
            page: undefined, limit: undefined,
        }));
    });

    it('passes tag filter from query', async () => {
        mockGetHabits.mockResolvedValueOnce(MOCK_LIST);

        const req  = mockAuthReq({ query: { tag: 'health' } });
        const res  = buildRes();
        const next = jest.fn() as NextFunction;

        await HabitsController.getAllHabits(req, res, next);

        expect(mockGetHabits).toHaveBeenCalledWith(10, expect.objectContaining({ tag: 'health' }));
    });
});

// ── getHabitDetails ───────────────────────────────────────────────────────────

describe('HabitsController.getHabitDetails', () => {

    it('returns 200 with single habit', async () => {
        mockGetHabitById.mockResolvedValueOnce(MOCK_HABIT);

        const req  = mockAuthReq({ params: { id: '1' } });
        const res  = buildRes();
        const next = jest.fn() as NextFunction;

        await HabitsController.getHabitDetails(req, res, next);

        expect(res.status).toHaveBeenCalledWith(200);
    });

    it('parses habitId as integer from params', async () => {
        mockGetHabitById.mockResolvedValueOnce(MOCK_HABIT);

        const req  = mockAuthReq({ params: { id: '7' } });
        const res  = buildRes();
        const next = jest.fn() as NextFunction;

        await HabitsController.getHabitDetails(req, res, next);

        expect(mockGetHabitById).toHaveBeenCalledWith(10, 7);
    });

    it('calls next(err) on 404 error', async () => {
        const err: any = new Error('Not found');
        err.statusCode = 404;
        mockGetHabitById.mockRejectedValueOnce(err);

        const req  = mockAuthReq({ params: { id: '999' } });
        const res  = buildRes();
        const next = jest.fn() as NextFunction;

        await HabitsController.getHabitDetails(req, res, next);

        expect(next).toHaveBeenCalledWith(err);
    });
});

// ── updateHabit ───────────────────────────────────────────────────────────────

describe('HabitsController.updateHabit', () => {

    it('returns 200 with updated habit', async () => {
        const updated = { ...MOCK_HABIT, title: 'New Title' };
        mockUpdateHabit.mockResolvedValueOnce(updated);

        const req  = mockAuthReq({ params: { id: '1' }, body: { title: 'New Title' } });
        const res  = buildRes();
        const next = jest.fn() as NextFunction;

        await HabitsController.updateHabit(req, res, next);

        expect(res.status).toHaveBeenCalledWith(200);
    });

    it('forwards error to next when service throws', async () => {
        mockUpdateHabit.mockRejectedValueOnce(new Error('Update failed'));

        const req  = mockAuthReq({ params: { id: '1' }, body: { title: 'T' } });
        const res  = buildRes();
        const next = jest.fn() as NextFunction;

        await HabitsController.updateHabit(req, res, next);

        expect(next).toHaveBeenCalled();
    });
});

// ── deleteHabit ───────────────────────────────────────────────────────────────

describe('HabitsController.deleteHabit', () => {

    it('returns 200 on successful deletion', async () => {
        mockDeleteHabit.mockResolvedValueOnce(undefined);

        const req  = mockAuthReq({ params: { id: '1' } });
        const res  = buildRes();
        const next = jest.fn() as NextFunction;

        await HabitsController.deleteHabit(req, res, next);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ success: true })
        );
    });

    it('calls next on deletion error', async () => {
        mockDeleteHabit.mockRejectedValueOnce(new Error('Delete failed'));

        const req  = mockAuthReq({ params: { id: '1' } });
        const res  = buildRes();
        const next = jest.fn() as NextFunction;

        await HabitsController.deleteHabit(req, res, next);

        expect(next).toHaveBeenCalled();
    });
});
