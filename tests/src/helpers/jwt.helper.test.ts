/**
 * ============================================================
 * HELPERS — JWT Utility Unit Tests
 * ============================================================
 */

import { signAccessToken, signRefreshToken, verifyAccessToken } from '../../../src/utility/jwt';
import { generateTokenPair } from '../../../src/helper/generateToken.middleware';
import jwt from 'jsonwebtoken';

const MOCK_PAYLOAD = { id: 42, email: 'test@habittracker.com' };

describe('JWT Utility', () => {

    // ── signAccessToken ───────────────────────────────────────────────────────

    describe('signAccessToken', () => {
        it('generates a string token', () => {
            const token = signAccessToken(MOCK_PAYLOAD);
            expect(typeof token).toBe('string');
            expect(token.split('.')).toHaveLength(3); // valid JWT structure
        });

        it('token contains correct id and email in payload', () => {
            const token = signAccessToken(MOCK_PAYLOAD);
            const decoded = jwt.decode(token) as any;
            expect(decoded.id).toBe(MOCK_PAYLOAD.id);
            expect(decoded.email).toBe(MOCK_PAYLOAD.email);
        });

        it('two identical payloads produce different tokens (timestamp differs)', async () => {
            const t1 = signAccessToken(MOCK_PAYLOAD);
            await new Promise(r => setTimeout(r, 1100));
            const t2 = signAccessToken(MOCK_PAYLOAD);
            expect(t1).not.toBe(t2);
        });
    });

    // ── signRefreshToken ──────────────────────────────────────────────────────

    describe('signRefreshToken', () => {
        it('generates a distinct token from access token', () => {
            const access  = signAccessToken(MOCK_PAYLOAD);
            const refresh = signRefreshToken(MOCK_PAYLOAD);
            expect(access).not.toBe(refresh);
        });

        it('refresh token has 7d expiry encoded', () => {
            const token   = signRefreshToken(MOCK_PAYLOAD);
            const decoded = jwt.decode(token) as any;
            const diffDays = (decoded.exp - decoded.iat) / 86400;
            expect(diffDays).toBeCloseTo(7, 0);
        });
    });

    // ── verifyAccessToken ─────────────────────────────────────────────────────

    describe('verifyAccessToken', () => {
        it('correctly verifies a valid access token', () => {
            const token   = signAccessToken(MOCK_PAYLOAD);
            const decoded = verifyAccessToken(token);
            expect(decoded.id).toBe(MOCK_PAYLOAD.id);
            expect(decoded.email).toBe(MOCK_PAYLOAD.email);
        });

        it('throws JsonWebTokenError for tampered token', () => {
            const token = signAccessToken(MOCK_PAYLOAD) + 'tampered';
            expect(() => verifyAccessToken(token)).toThrow();
        });

        it('throws JsonWebTokenError for completely invalid string', () => {
            expect(() => verifyAccessToken('not.a.token')).toThrow();
        });

        it('throws TokenExpiredError for an expired token', () => {
            const expiredToken = jwt.sign(MOCK_PAYLOAD, process.env.JWT_SECRET!, { expiresIn: '1ms' });
            // Wait for token to expire
            return new Promise<void>((resolve) => {
                setTimeout(() => {
                    expect(() => verifyAccessToken(expiredToken)).toThrow(/expired/i);
                    resolve();
                }, 10);
            });
        });
    });

    // ── generateTokenPair ─────────────────────────────────────────────────────

    describe('generateTokenPair', () => {
        it('returns object with accessToken and refreshToken', () => {
            const pair = generateTokenPair(MOCK_PAYLOAD);
            expect(pair).toHaveProperty('accessToken');
            expect(pair).toHaveProperty('refreshToken');
        });

        it('both tokens are non-empty strings', () => {
            const pair = generateTokenPair(MOCK_PAYLOAD);
            expect(typeof pair.accessToken).toBe('string');
            expect(pair.accessToken.length).toBeGreaterThan(10);
            expect(typeof pair.refreshToken).toBe('string');
            expect(pair.refreshToken.length).toBeGreaterThan(10);
        });
    });
});
