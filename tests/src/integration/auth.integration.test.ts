/**
 * ============================================================
 * INTEGRATION — Auth API End-to-End Tests
 * ============================================================
 * Tests the full HTTP stack: route → middleware → controller → service (mocked DB layer)
 */

jest.mock('../../../src/utility/queryExecutor');
jest.mock('../../../src/utility/bcrypt');
jest.mock('../../../src/utility/Redis');

import request from 'supertest';
import { app } from '../../../src/bin/index';
import { executeSingleQuery } from '../../../src/utility/queryExecutor';
import { hashPassword, comparePassword } from '../../../src/utility/bcrypt';

const mockExecuteSingleQuery = executeSingleQuery as jest.Mock;
const mockHashPassword        = hashPassword        as jest.Mock;
const mockComparePassword     = comparePassword     as jest.Mock;

beforeEach(() => {
    jest.clearAllMocks();
});

// ── POST /api/v1/auth/register ────────────────────────────────────────────────

describe('POST /api/v1/auth/register', () => {

    it('201 — successfully registers a new user', async () => {
        mockExecuteSingleQuery
            .mockResolvedValueOnce(null)   // user check: not exists
            .mockResolvedValueOnce({ id: 1, email: 'new@test.com' }); // INSERT

        mockHashPassword.mockResolvedValue('$2b$hashed');

        const res = await request(app)
            .post('/api/v1/auth/register')
            .send({ email: 'new@test.com', password: 'pass1234' });

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toHaveProperty('accessToken');
        expect(res.body.data).toHaveProperty('refreshToken');
        expect(res.body.data.user.email).toBe('new@test.com');
    });

    it('422 — rejects missing email', async () => {
        const res = await request(app)
            .post('/api/v1/auth/register')
            .send({ password: 'pass1234' });

        expect(res.status).toBe(422);
        expect(res.body.success).toBe(false);
        expect(Array.isArray(res.body.error)).toBe(true);
    });

    it('422 — rejects invalid email format', async () => {
        const res = await request(app)
            .post('/api/v1/auth/register')
            .send({ email: 'not-email', password: 'pass1234' });

        expect(res.status).toBe(422);
    });

    it('422 — rejects password shorter than 6 characters', async () => {
        const res = await request(app)
            .post('/api/v1/auth/register')
            .send({ email: 'user@test.com', password: '123' });

        expect(res.status).toBe(422);
    });

    it('422 — rejects completely empty body', async () => {
        const res = await request(app)
            .post('/api/v1/auth/register')
            .send({});

        expect(res.status).toBe(422);
    });

    it('409 — returns conflict when user already exists', async () => {
        mockExecuteSingleQuery.mockResolvedValueOnce({ id: 1 }); // user exists

        const res = await request(app)
            .post('/api/v1/auth/register')
            .send({ email: 'exists@test.com', password: 'pass1234' });

        expect(res.status).toBe(409);
        expect(res.body.success).toBe(false);
    });

    it('has security headers (helmet)', async () => {
        const res = await request(app)
            .post('/api/v1/auth/register')
            .send({ email: 'h@test.com', password: 'pass1234' });

        expect(res.headers['x-content-type-options']).toBe('nosniff');
    });

    it('responds with application/json content type', async () => {
        const res = await request(app)
            .post('/api/v1/auth/register')
            .send({});

        expect(res.get('Content-Type')).toMatch(/application\/json/);
    });
});

// ── POST /api/v1/auth/login ───────────────────────────────────────────────────

describe('POST /api/v1/auth/login', () => {

    it('200 — successfully authenticates valid user', async () => {
        mockExecuteSingleQuery.mockResolvedValueOnce({
            id: 1, email: 'user@test.com', password_hash: '$2b$hashed',
        });
        mockComparePassword.mockResolvedValue(true);

        const res = await request(app)
            .post('/api/v1/auth/login')
            .send({ email: 'user@test.com', password: 'correctpass' });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toHaveProperty('accessToken');
    });

    it('422 — rejects missing password on login', async () => {
        const res = await request(app)
            .post('/api/v1/auth/login')
            .send({ email: 'user@test.com' });

        expect(res.status).toBe(422);
    });

    it('422 — rejects missing email on login', async () => {
        const res = await request(app)
            .post('/api/v1/auth/login')
            .send({ password: 'somepass' });

        expect(res.status).toBe(422);
    });

    it('401 — returns 401 for non-existent user', async () => {
        mockExecuteSingleQuery.mockResolvedValueOnce(null);

        const res = await request(app)
            .post('/api/v1/auth/login')
            .send({ email: 'ghost@test.com', password: 'pass1234' });

        expect(res.status).toBe(401);
        expect(res.body.success).toBe(false);
    });

    it('401 — returns 401 for wrong password', async () => {
        mockExecuteSingleQuery.mockResolvedValueOnce({
            id: 1, email: 'user@test.com', password_hash: '$2b$hashed',
        });
        mockComparePassword.mockResolvedValue(false);

        const res = await request(app)
            .post('/api/v1/auth/login')
            .send({ email: 'user@test.com', password: 'wrongpass' });

        expect(res.status).toBe(401);
    });
});

// ── Protected routes (auth integration) ──────────────────────────────────────

describe('Protected Route Guard Integration', () => {

    it('401 — GET /api/v1/habits without token', async () => {
        const res = await request(app).get('/api/v1/habits');
        expect(res.status).toBe(401);
    });

    it('403 — GET /api/v1/habits with invalid Bearer token', async () => {
        const res = await request(app)
            .get('/api/v1/habits')
            .set('Authorization', 'Bearer invalid.token.here');
        expect(res.status).toBe(403);
    });

    it('404 — unknown route returns 404 with JSON body', async () => {
        const res = await request(app).get('/api/v1/nonexistent');
        expect(res.status).toBe(404);
        expect(res.body.success).toBe(false);
    });
});
