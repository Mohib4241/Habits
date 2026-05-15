/**
 * Global Jest Setup — Runs once per test file after env is loaded.
 * Mocks all external I/O (Redis, PostgreSQL) so tests are hermetic.
 */

// ── PostgreSQL pool mock ──────────────────────────────────────────────────────
jest.mock('../../src/utility/postgreConnection', () => ({
    getDbPool: jest.fn(() => ({
        query:   jest.fn(),
        connect: jest.fn(() => ({ release: jest.fn() })),
        end:     jest.fn(),
        on:      jest.fn(),
    })),
}));

// ── Redis client mock ─────────────────────────────────────────────────────────
jest.mock('redis', () => ({
    createClient: jest.fn(() => ({
        connect:  jest.fn().mockResolvedValue(undefined),
        get:      jest.fn().mockResolvedValue(null),
        set:      jest.fn().mockResolvedValue('OK'),
        setEx:    jest.fn().mockResolvedValue('OK'),
        del:      jest.fn().mockResolvedValue(1),
        isOpen:   true,
        on:       jest.fn(),
    })),
}));

// ── Redis utility mock ────────────────────────────────────────────────────────
jest.mock('../../src/utility/Redis', () => ({
    connectRedis:  jest.fn().mockResolvedValue(undefined),
    getCache:      jest.fn().mockResolvedValue(null),
    setCache:      jest.fn().mockResolvedValue(undefined),
    deleteCache:   jest.fn().mockResolvedValue(undefined),
    redisClient:   { isOpen: true },
}));

// ── Silence morgan logging during tests ───────────────────────────────────────
jest.mock('morgan', () => () => (_req: any, _res: any, next: any) => next());

afterEach(() => {
    jest.clearAllMocks();
});
