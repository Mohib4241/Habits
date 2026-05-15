/**
 * ============================================================
 * INTEGRATION — Habits API End-to-End Tests
 * ============================================================
 * Tests full HTTP stack with a real JWT + mocked DB layer
 */

jest.mock('../../../src/utility/queryExecutor');
jest.mock('../../../src/utility/Redis');

import request from 'supertest';
import { app } from '../../../src/bin/index';
import { signAccessToken } from '../../../src/utility/jwt';
import { executeQuery, executeSingleQuery } from '../../../src/utility/queryExecutor';
import { getCache, setCache } from '../../../src/utility/Redis';

const mockExecuteQuery       = executeQuery       as jest.Mock;
const mockExecuteSingleQuery = executeSingleQuery as jest.Mock;
const mockGetCache           = getCache           as jest.Mock;
const mockSetCache           = setCache           as jest.Mock;

const makeToken = (userId: number = 10) =>
    signAccessToken({ id: userId, email: 'integration@test.com' });

beforeEach(() => {
    jest.clearAllMocks();
});

const MOCK_HABIT = {
    id: 1, user_id: 10, title: 'Morning Run',
    description: null, frequency: 'daily',
    reminder_time: null, tags: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
};

// ── POST /api/v1/habits ───────────────────────────────────────────────────────

describe('POST /api/v1/habits', () => {

    it('201 — creates habit with valid token and payload', async () => {
        mockGetCache.mockResolvedValue(null);
        mockExecuteSingleQuery.mockResolvedValueOnce(MOCK_HABIT);

        const res = await request(app)
            .post('/api/v1/habits')
            .set('Authorization', `Bearer ${makeToken()}`)
            .send({ title: 'Morning Run' });

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data.title).toBe('Morning Run');
    });

    it('401 — blocked without Authorization header', async () => {
        const res = await request(app)
            .post('/api/v1/habits')
            .send({ title: 'Morning Run' });

        expect(res.status).toBe(401);
    });

    it('422 — rejects missing title', async () => {
        const res = await request(app)
            .post('/api/v1/habits')
            .set('Authorization', `Bearer ${makeToken()}`)
            .send({ frequency: 'daily' });

        expect(res.status).toBe(422);
    });

    it('422 — rejects title shorter than 3 chars', async () => {
        const res = await request(app)
            .post('/api/v1/habits')
            .set('Authorization', `Bearer ${makeToken()}`)
            .send({ title: 'AB' });

        expect(res.status).toBe(422);
    });

    it('422 — rejects invalid frequency value', async () => {
        const res = await request(app)
            .post('/api/v1/habits')
            .set('Authorization', `Bearer ${makeToken()}`)
            .send({ title: 'Morning Run', frequency: 'monthly' });

        expect(res.status).toBe(422);
    });

    it('422 — rejects invalid reminder_time format', async () => {
        const res = await request(app)
            .post('/api/v1/habits')
            .set('Authorization', `Bearer ${makeToken()}`)
            .send({ title: 'Morning Run', reminder_time: '99:99' });

        expect(res.status).toBe(422);
    });
});

// ── GET /api/v1/habits ────────────────────────────────────────────────────────

describe('GET /api/v1/habits', () => {

    it('200 — returns list from DB when cache is empty', async () => {
        mockGetCache.mockResolvedValue(null);
        mockExecuteSingleQuery.mockResolvedValueOnce({ total: '1' });
        mockExecuteQuery.mockResolvedValueOnce([MOCK_HABIT]);
        mockSetCache.mockResolvedValue(undefined);

        const res = await request(app)
            .get('/api/v1/habits')
            .set('Authorization', `Bearer ${makeToken()}`);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body.data.habits)).toBe(true);
    });

    it('200 — returns list from Redis cache when cached', async () => {
        const cached = { meta: { totalItems: 1 }, habits: [MOCK_HABIT] };
        mockGetCache.mockResolvedValue(JSON.stringify(cached));

        const res = await request(app)
            .get('/api/v1/habits')
            .set('Authorization', `Bearer ${makeToken()}`);

        expect(res.status).toBe(200);
        expect(mockExecuteSingleQuery).not.toHaveBeenCalled();
    });

    it('401 — blocked without token', async () => {
        const res = await request(app).get('/api/v1/habits');
        expect(res.status).toBe(401);
    });

    it('422 — rejects page=0 query param', async () => {
        const res = await request(app)
            .get('/api/v1/habits?page=0')
            .set('Authorization', `Bearer ${makeToken()}`);

        expect(res.status).toBe(422);
    });

    it('422 — rejects limit > 100', async () => {
        const res = await request(app)
            .get('/api/v1/habits?limit=200')
            .set('Authorization', `Bearer ${makeToken()}`);

        expect(res.status).toBe(422);
    });

    it('200 — accepts valid pagination params', async () => {
        mockGetCache.mockResolvedValue(null);
        mockExecuteSingleQuery.mockResolvedValueOnce({ total: '5' });
        mockExecuteQuery.mockResolvedValueOnce([MOCK_HABIT]);
        mockSetCache.mockResolvedValue(undefined);

        const res = await request(app)
            .get('/api/v1/habits?page=1&limit=10')
            .set('Authorization', `Bearer ${makeToken()}`);

        expect(res.status).toBe(200);
        expect(res.body.data.meta).toBeDefined();
    });
});

// ── GET /api/v1/habits/:id ────────────────────────────────────────────────────

describe('GET /api/v1/habits/:id', () => {

    it('200 — returns single habit', async () => {
        mockExecuteSingleQuery.mockResolvedValueOnce(MOCK_HABIT);

        const res = await request(app)
            .get('/api/v1/habits/1')
            .set('Authorization', `Bearer ${makeToken()}`);

        expect(res.status).toBe(200);
        expect(res.body.data.id).toBe(1);
    });

    it('404 — returns 404 when habit not found', async () => {
        mockExecuteSingleQuery.mockResolvedValueOnce(null);

        const res = await request(app)
            .get('/api/v1/habits/999')
            .set('Authorization', `Bearer ${makeToken()}`);

        expect(res.status).toBe(404);
    });

    it('422 — rejects non-numeric habit id', async () => {
        const res = await request(app)
            .get('/api/v1/habits/abc')
            .set('Authorization', `Bearer ${makeToken()}`);

        expect(res.status).toBe(422);
    });
});

// ── PUT /api/v1/habits/:id ────────────────────────────────────────────────────

describe('PUT /api/v1/habits/:id', () => {

    it('200 — updates habit successfully', async () => {
        const updated = { ...MOCK_HABIT, title: 'Evening Run' };
        mockExecuteSingleQuery
            .mockResolvedValueOnce(MOCK_HABIT)  // getHabitById
            .mockResolvedValueOnce(updated);    // UPDATE

        const res = await request(app)
            .put('/api/v1/habits/1')
            .set('Authorization', `Bearer ${makeToken()}`)
            .send({ title: 'Evening Run' });

        expect(res.status).toBe(200);
        expect(res.body.data.title).toBe('Evening Run');
    });

    it('422 — rejects empty update payload', async () => {
        const res = await request(app)
            .put('/api/v1/habits/1')
            .set('Authorization', `Bearer ${makeToken()}`)
            .send({});

        expect(res.status).toBe(422);
    });

    it('404 — returns 404 when habit not found', async () => {
        mockExecuteSingleQuery.mockResolvedValueOnce(null);

        const res = await request(app)
            .put('/api/v1/habits/999')
            .set('Authorization', `Bearer ${makeToken()}`)
            .send({ title: 'Any Title' });

        expect(res.status).toBe(404);
    });
});

// ── DELETE /api/v1/habits/:id ─────────────────────────────────────────────────

describe('DELETE /api/v1/habits/:id', () => {

    it('200 — deletes habit successfully', async () => {
        mockExecuteSingleQuery.mockResolvedValueOnce(MOCK_HABIT); // getHabitById
        mockExecuteQuery.mockResolvedValueOnce([]);                // DELETE

        const res = await request(app)
            .delete('/api/v1/habits/1')
            .set('Authorization', `Bearer ${makeToken()}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });

    it('404 — returns 404 when habit not found', async () => {
        mockExecuteSingleQuery.mockResolvedValueOnce(null);

        const res = await request(app)
            .delete('/api/v1/habits/999')
            .set('Authorization', `Bearer ${makeToken()}`);

        expect(res.status).toBe(404);
    });

    it('401 — blocked without token', async () => {
        const res = await request(app).delete('/api/v1/habits/1');
        expect(res.status).toBe(401);
    });
});
