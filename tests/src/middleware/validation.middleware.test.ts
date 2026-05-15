/**
 * ============================================================
 * MIDDLEWARE — validateRequest (Joi) Unit Tests
 * ============================================================
 */

import { Request, Response, NextFunction } from 'express';
import { validateRequest } from '../../../src/middleware/validation.middleware';
import { registerSchema, loginSchema } from '../../../src/validations/auth.validation';
import { createHabitSchema, updateHabitSchema, queryHabitSchema } from '../../../src/validations/habits.validation';
import { trackHabitSchema, habitIdParamSchema } from '../../../src/validations/tracking.validation';

const buildRes = () => {
    const res: Partial<Response> = {
        status: jest.fn().mockReturnThis() as any,
        json:   jest.fn().mockReturnThis() as any,
    };
    return res as Response;
};

const buildReq = (body: any = {}, query: any = {}, params: any = {}): Partial<Request> => ({
    body, query, params,
});

// ── Auth Validation ───────────────────────────────────────────────────────────

describe('validateRequest — registerSchema', () => {
    const mw = validateRequest(registerSchema, 'body');

    it('passes validation for valid registration payload', () => {
        const req  = buildReq({ email: 'user@test.com', password: 'secret123' }) as any;
        const res  = buildRes();
        const next = jest.fn() as NextFunction;
        mw(req, res, next);
        expect(next).toHaveBeenCalledTimes(1);
    });

    it('rejects missing email', () => {
        const req  = buildReq({ password: 'secret123' }) as any;
        const res  = buildRes();
        const next = jest.fn() as NextFunction;
        mw(req, res, next);
        expect(res.status).toHaveBeenCalledWith(422);
        expect(next).not.toHaveBeenCalled();
    });

    it('rejects invalid email format', () => {
        const req  = buildReq({ email: 'not-an-email', password: 'secret123' }) as any;
        const res  = buildRes();
        const next = jest.fn() as NextFunction;
        mw(req, res, next);
        expect(res.status).toHaveBeenCalledWith(422);
    });

    it('rejects password shorter than 6 characters', () => {
        const req  = buildReq({ email: 'user@test.com', password: '123' }) as any;
        const res  = buildRes();
        const next = jest.fn() as NextFunction;
        mw(req, res, next);
        expect(res.status).toHaveBeenCalledWith(422);
    });

    it('rejects missing password', () => {
        const req  = buildReq({ email: 'user@test.com' }) as any;
        const res  = buildRes();
        const next = jest.fn() as NextFunction;
        mw(req, res, next);
        expect(res.status).toHaveBeenCalledWith(422);
    });

    it('rejects empty body', () => {
        const req  = buildReq({}) as any;
        const res  = buildRes();
        const next = jest.fn() as NextFunction;
        mw(req, res, next);
        expect(res.status).toHaveBeenCalledWith(422);
    });

    it('strips unknown fields from body after validation', () => {
        const req  = buildReq({ email: 'user@test.com', password: 'secret123', hackerField: 'evil' }) as any;
        const res  = buildRes();
        const next = jest.fn() as NextFunction;
        mw(req, res, next);
        expect(next).toHaveBeenCalledTimes(1);
        expect(req.body.hackerField).toBeUndefined();
    });

    it('returns structured error array in response body', () => {
        const req  = buildReq({}) as any;
        const res  = buildRes();
        const next = jest.fn() as NextFunction;
        mw(req, res, next);
        const body = (res.json as jest.Mock).mock.calls[0][0];
        expect(body.success).toBe(false);
        expect(Array.isArray(body.error)).toBe(true);
    });
});

describe('validateRequest — loginSchema', () => {
    const mw = validateRequest(loginSchema, 'body');

    it('passes valid login payload', () => {
        const req  = buildReq({ email: 'user@test.com', password: 'anypass' }) as any;
        const res  = buildRes();
        const next = jest.fn() as NextFunction;
        mw(req, res, next);
        expect(next).toHaveBeenCalledTimes(1);
    });

    it('rejects missing email on login', () => {
        const req  = buildReq({ password: 'anypass' }) as any;
        const res  = buildRes();
        const next = jest.fn() as NextFunction;
        mw(req, res, next);
        expect(res.status).toHaveBeenCalledWith(422);
    });
});

// ── Habit Validation ──────────────────────────────────────────────────────────

describe('validateRequest — createHabitSchema', () => {
    const mw = validateRequest(createHabitSchema, 'body');

    it('passes valid habit creation payload', () => {
        const req  = buildReq({ title: 'Morning Run', frequency: 'daily' }) as any;
        const res  = buildRes();
        const next = jest.fn() as NextFunction;
        mw(req, res, next);
        expect(next).toHaveBeenCalledTimes(1);
    });

    it('rejects missing title', () => {
        const req  = buildReq({ frequency: 'daily' }) as any;
        const res  = buildRes();
        const next = jest.fn() as NextFunction;
        mw(req, res, next);
        expect(res.status).toHaveBeenCalledWith(422);
    });

    it('rejects title shorter than 3 chars', () => {
        const req  = buildReq({ title: 'AB' }) as any;
        const res  = buildRes();
        const next = jest.fn() as NextFunction;
        mw(req, res, next);
        expect(res.status).toHaveBeenCalledWith(422);
    });

    it('rejects invalid frequency value', () => {
        const req  = buildReq({ title: 'Morning Run', frequency: 'hourly' }) as any;
        const res  = buildRes();
        const next = jest.fn() as NextFunction;
        mw(req, res, next);
        expect(res.status).toHaveBeenCalledWith(422);
    });

    it('rejects invalid reminder_time format', () => {
        const req  = buildReq({ title: 'Morning Run', reminder_time: '25:99' }) as any;
        const res  = buildRes();
        const next = jest.fn() as NextFunction;
        mw(req, res, next);
        expect(res.status).toHaveBeenCalledWith(422);
    });

    it('accepts valid reminder_time HH:MM format', () => {
        const req  = buildReq({ title: 'Morning Run', reminder_time: '07:30' }) as any;
        const res  = buildRes();
        const next = jest.fn() as NextFunction;
        mw(req, res, next);
        expect(next).toHaveBeenCalledTimes(1);
    });

    it('defaults frequency to daily when omitted', () => {
        const req  = buildReq({ title: 'Morning Run' }) as any;
        const res  = buildRes();
        const next = jest.fn() as NextFunction;
        mw(req, res, next);
        expect(next).toHaveBeenCalledTimes(1);
        expect(req.body.frequency).toBe('daily');
    });

    it('defaults tags to empty array when omitted', () => {
        const req  = buildReq({ title: 'Morning Run' }) as any;
        const res  = buildRes();
        const next = jest.fn() as NextFunction;
        mw(req, res, next);
        expect(req.body.tags).toEqual([]);
    });
});

describe('validateRequest — updateHabitSchema', () => {
    const mw = validateRequest(updateHabitSchema, 'body');

    it('rejects empty update payload (min(1) rule)', () => {
        const req  = buildReq({}) as any;
        const res  = buildRes();
        const next = jest.fn() as NextFunction;
        mw(req, res, next);
        expect(res.status).toHaveBeenCalledWith(422);
    });

    it('passes with just a title update', () => {
        const req  = buildReq({ title: 'Updated Title' }) as any;
        const res  = buildRes();
        const next = jest.fn() as NextFunction;
        mw(req, res, next);
        expect(next).toHaveBeenCalledTimes(1);
    });
});

describe('validateRequest — queryHabitSchema', () => {
    const mw = validateRequest(queryHabitSchema, 'query');

    it('passes with no query params (all optional)', () => {
        const req  = buildReq({}, {}) as any;
        const res  = buildRes();
        const next = jest.fn() as NextFunction;
        mw(req, res, next);
        expect(next).toHaveBeenCalledTimes(1);
    });

    it('rejects page < 1', () => {
        const req  = buildReq({}, { page: '0' }) as any;
        const res  = buildRes();
        const next = jest.fn() as NextFunction;
        mw(req, res, next);
        expect(res.status).toHaveBeenCalledWith(422);
    });

    it('rejects limit > 100', () => {
        const req  = buildReq({}, { limit: '101' }) as any;
        const res  = buildRes();
        const next = jest.fn() as NextFunction;
        mw(req, res, next);
        expect(res.status).toHaveBeenCalledWith(422);
    });
});

// ── Tracking Validation ───────────────────────────────────────────────────────

describe('validateRequest — trackHabitSchema', () => {
    const mw = validateRequest(trackHabitSchema, 'body');

    it('passes with valid YYYY-MM-DD date', () => {
        const req  = buildReq({ completed_date: '2024-05-15' }) as any;
        const res  = buildRes();
        const next = jest.fn() as NextFunction;
        mw(req, res, next);
        expect(next).toHaveBeenCalledTimes(1);
    });

    it('passes with empty body (date is optional)', () => {
        const req  = buildReq({}) as any;
        const res  = buildRes();
        const next = jest.fn() as NextFunction;
        mw(req, res, next);
        expect(next).toHaveBeenCalledTimes(1);
    });

    it('rejects invalid date format', () => {
        const req  = buildReq({ completed_date: '15-05-2024' }) as any;
        const res  = buildRes();
        const next = jest.fn() as NextFunction;
        mw(req, res, next);
        expect(res.status).toHaveBeenCalledWith(422);
    });
});

describe('validateRequest — habitIdParamSchema', () => {
    const mw = validateRequest(habitIdParamSchema, 'params');

    it('passes for positive integer id', () => {
        const req  = buildReq({}, {}, { id: '5' }) as any;
        const res  = buildRes();
        const next = jest.fn() as NextFunction;
        mw(req, res, next);
        expect(next).toHaveBeenCalledTimes(1);
    });

    it('rejects negative id', () => {
        const req  = buildReq({}, {}, { id: '-1' }) as any;
        const res  = buildRes();
        const next = jest.fn() as NextFunction;
        mw(req, res, next);
        expect(res.status).toHaveBeenCalledWith(422);
    });

    it('rejects zero id', () => {
        const req  = buildReq({}, {}, { id: '0' }) as any;
        const res  = buildRes();
        const next = jest.fn() as NextFunction;
        mw(req, res, next);
        expect(res.status).toHaveBeenCalledWith(422);
    });
});
