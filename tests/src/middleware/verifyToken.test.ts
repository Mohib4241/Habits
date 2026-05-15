/**
 * ============================================================
 * MIDDLEWARE — verifyToken Unit Tests
 * ============================================================
 */

import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../../../src/middleware/verifyToken';
import { signAccessToken } from '../../../src/utility/jwt';
import jwt from 'jsonwebtoken';

const buildMockRes = () => {
    const res: Partial<Response> = {
        status: jest.fn().mockReturnThis() as any,
        json:   jest.fn().mockReturnThis() as any,
    };
    return res as Response;
};

const buildReq = (authHeader?: string): Partial<Request> => ({
    headers: authHeader ? { authorization: authHeader } : {},
});

describe('verifyToken Middleware', () => {

    const validPayload = { id: 1, email: 'unit@test.com' };

    // ── Missing / malformed header ────────────────────────────────────────────

    it('returns 401 when Authorization header is completely missing', () => {
        const req  = buildReq() as any;
        const res  = buildMockRes();
        const next = jest.fn() as NextFunction;

        verifyToken(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ success: false })
        );
        expect(next).not.toHaveBeenCalled();
    });

    it('returns 401 when Authorization header does not start with Bearer', () => {
        const req  = buildReq('Basic sometoken') as any;
        const res  = buildMockRes();
        const next = jest.fn() as NextFunction;

        verifyToken(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(next).not.toHaveBeenCalled();
    });

    it('returns 401 for empty Authorization header', () => {
        const req  = buildReq('') as any;
        const res  = buildMockRes();
        const next = jest.fn() as NextFunction;

        verifyToken(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
    });

    // ── Invalid token ─────────────────────────────────────────────────────────

    it('returns 403 for a completely invalid token string', () => {
        const req  = buildReq('Bearer not.a.valid.jwt') as any;
        const res  = buildMockRes();
        const next = jest.fn() as NextFunction;

        verifyToken(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(next).not.toHaveBeenCalled();
    });

    it('returns 403 for a tampered token', () => {
        const token = signAccessToken(validPayload) + 'tampered';
        const req   = buildReq(`Bearer ${token}`) as any;
        const res   = buildMockRes();
        const next  = jest.fn() as NextFunction;

        verifyToken(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
    });

    it('returns 403 with expired token message for TokenExpiredError', () => {
        const expiredToken = jwt.sign(validPayload, process.env.JWT_SECRET!, { expiresIn: '1ms' });

        return new Promise<void>((resolve) => {
            setTimeout(() => {
                const req  = buildReq(`Bearer ${expiredToken}`) as any;
                const res  = buildMockRes();
                const next = jest.fn() as NextFunction;

                verifyToken(req, res, next);

                expect(res.status).toHaveBeenCalledWith(403);
                const body = (res.json as jest.Mock).mock.calls[0][0];
                expect(body.message).toMatch(/expired/i);
                resolve();
            }, 10);
        });
    });

    // ── Valid token ───────────────────────────────────────────────────────────

    it('calls next() and populates req.user for a valid token', () => {
        const token = signAccessToken(validPayload);
        const req   = buildReq(`Bearer ${token}`) as any;
        const res   = buildMockRes();
        const next  = jest.fn() as NextFunction;

        verifyToken(req, res, next);

        expect(next).toHaveBeenCalledTimes(1);
        expect(req.user).toBeDefined();
        expect(req.user.id).toBe(validPayload.id);
        expect(req.user.email).toBe(validPayload.email);
    });

    it('does not call res.json when token is valid', () => {
        const token = signAccessToken(validPayload);
        const req   = buildReq(`Bearer ${token}`) as any;
        const res   = buildMockRes();
        const next  = jest.fn() as NextFunction;

        verifyToken(req, res, next);

        expect(res.json).not.toHaveBeenCalled();
    });
});
