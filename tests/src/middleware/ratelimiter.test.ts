/**
 * ============================================================
 * MIDDLEWARE — Rate Limiter Unit Tests
 * ============================================================
 */

import request from 'supertest';
import express, { Application } from 'express';
import { apiRateLimiter, authRateLimiter } from '../../../src/middleware/ratelimiter';

// ── Helpers ───────────────────────────────────────────────────────────────────

const buildApp = (limiter: any): Application => {
    const app = express();
    app.use(limiter);
    app.get('/test', (_req, res) => res.status(200).json({ ok: true }));
    return app;
};

// ── apiRateLimiter ────────────────────────────────────────────────────────────

describe('apiRateLimiter', () => {
    it('allows first request through', async () => {
        const app = buildApp(apiRateLimiter);
        const res = await request(app).get('/test');
        expect(res.status).toBe(200);
        expect(res.body.ok).toBe(true);
    });

    it('sets RateLimit headers on response', async () => {
        const app = buildApp(apiRateLimiter);
        const res = await request(app).get('/test');
        // draft-7 uses combined RateLimit header
        const hasRateLimit =
            res.headers['ratelimit'] !== undefined ||
            res.headers['x-ratelimit-limit'] !== undefined;
        expect(hasRateLimit).toBe(true);
    });

    it('does not set legacy X-RateLimit-* headers', async () => {
        const app = buildApp(apiRateLimiter);
        const res = await request(app).get('/test');
        expect(res.headers['x-ratelimit-limit']).toBeUndefined();
    });
});

// ── authRateLimiter ───────────────────────────────────────────────────────────

describe('authRateLimiter', () => {
    it('allows first auth request through', async () => {
        const app = buildApp(authRateLimiter);
        const res = await request(app).get('/test');
        expect(res.status).toBe(200);
    });

    it('sets rate-limit headers on auth route', async () => {
        const app = buildApp(authRateLimiter);
        const res = await request(app).get('/test');
        const hasRateLimit =
            res.headers['ratelimit'] !== undefined ||
            res.headers['x-ratelimit-limit'] !== undefined;
        expect(hasRateLimit).toBe(true);
    });
});
