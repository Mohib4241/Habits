/**
 * ============================================================
 * CONTROLLERS — AuthController Unit Tests
 * ============================================================
 */

jest.mock('../../../src/services/auth.services');
jest.mock('../../../src/utility/Redis');

import { Request, Response, NextFunction } from 'express';
import { AuthController } from '../../../src/controllers/auth.controller';
import { AuthService } from '../../../src/services/auth.services';

const mockRegisterUser = AuthService.registerUser as jest.Mock;
const mockLoginUser    = AuthService.loginUser    as jest.Mock;

const buildRes = () => {
    const res: Partial<Response> = {
        status: jest.fn().mockReturnThis() as any,
        json:   jest.fn().mockReturnThis() as any,
    };
    return res as Response;
};

const MOCK_AUTH_RESPONSE = {
    user: { id: 1, email: 'test@test.com' },
    accessToken: 'mock_access',
    refreshToken: 'mock_refresh',
};

// ── register ──────────────────────────────────────────────────────────────────

describe('AuthController.register', () => {

    it('responds 201 with auth data on successful registration', async () => {
        mockRegisterUser.mockResolvedValueOnce(MOCK_AUTH_RESPONSE);

        const req  = { body: { email: 'test@test.com', password: 'pass123' } } as Request;
        const res  = buildRes();
        const next = jest.fn() as NextFunction;

        await AuthController.register(req, res, next);

        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ success: true, data: MOCK_AUTH_RESPONSE })
        );
        expect(next).not.toHaveBeenCalled();
    });

    it('calls AuthService.registerUser with email and password from body', async () => {
        mockRegisterUser.mockResolvedValueOnce(MOCK_AUTH_RESPONSE);

        const req  = { body: { email: 'a@b.com', password: 'secret' } } as Request;
        const res  = buildRes();
        const next = jest.fn() as NextFunction;

        await AuthController.register(req, res, next);

        expect(mockRegisterUser).toHaveBeenCalledWith('a@b.com', 'secret');
    });

    it('calls next(err) when AuthService throws', async () => {
        const err = new Error('registration failed');
        mockRegisterUser.mockRejectedValueOnce(err);

        const req  = { body: { email: 'a@b.com', password: 'secret' } } as Request;
        const res  = buildRes();
        const next = jest.fn() as NextFunction;

        await AuthController.register(req, res, next);

        expect(next).toHaveBeenCalledWith(err);
        expect(res.json).not.toHaveBeenCalled();
    });
});

// ── login ─────────────────────────────────────────────────────────────────────

describe('AuthController.login', () => {

    it('responds 200 with auth data on successful login', async () => {
        mockLoginUser.mockResolvedValueOnce(MOCK_AUTH_RESPONSE);

        const req  = { body: { email: 'test@test.com', password: 'pass123' } } as Request;
        const res  = buildRes();
        const next = jest.fn() as NextFunction;

        await AuthController.login(req, res, next);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ success: true })
        );
    });

    it('calls next(err) on AuthService login failure', async () => {
        const err: any = new Error('Invalid credentials');
        err.statusCode = 401;
        mockLoginUser.mockRejectedValueOnce(err);

        const req  = { body: { email: 'x@x.com', password: 'wrong' } } as Request;
        const res  = buildRes();
        const next = jest.fn() as NextFunction;

        await AuthController.login(req, res, next);

        expect(next).toHaveBeenCalledWith(err);
    });

    it('passes email and password to AuthService.loginUser', async () => {
        mockLoginUser.mockResolvedValueOnce(MOCK_AUTH_RESPONSE);

        const req  = { body: { email: 'user@test.com', password: 'mypass' } } as Request;
        const res  = buildRes();
        const next = jest.fn() as NextFunction;

        await AuthController.login(req, res, next);

        expect(mockLoginUser).toHaveBeenCalledWith('user@test.com', 'mypass');
    });
});
