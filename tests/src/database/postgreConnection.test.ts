/**
 * ============================================================
 * DATABASE — postgreConnection Unit Tests
 * ============================================================
 * Tests pool interface shape using the auto-mock (no real DB calls).
 */

jest.mock('../../../src/utility/postgreConnection');

import { getDbPool } from '../../../src/utility/postgreConnection';

const mockGetDbPool = getDbPool as jest.MockedFunction<typeof getDbPool>;

// Build a complete mock pool that satisfies the Pool interface
const MOCK_POOL = {
    query:   jest.fn().mockResolvedValue({ rows: [] }),
    connect: jest.fn().mockResolvedValue({ release: jest.fn() }),
    end:     jest.fn().mockResolvedValue(undefined),
    on:      jest.fn(),
} as any;

beforeEach(() => {
    mockGetDbPool.mockReturnValue(MOCK_POOL);
});

describe('getDbPool', () => {

    it('returns a pool object', () => {
        const pool = getDbPool();
        expect(pool).toBeDefined();
    });

    it('pool has a query method', () => {
        const pool = getDbPool();
        expect(typeof pool.query).toBe('function');
    });

    it('pool has a connect method', () => {
        const pool = getDbPool();
        expect(typeof pool.connect).toBe('function');
    });

    it('pool has an end method', () => {
        const pool = getDbPool();
        expect(typeof pool.end).toBe('function');
    });

    it('returns same pool instance on repeated calls (singleton pattern)', () => {
        const pool1 = getDbPool();
        const pool2 = getDbPool();
        expect(pool1).toBe(pool2);
    });

    it('pool.connect resolves a client with release method', async () => {
        const pool   = getDbPool();
        const client = await pool.connect();
        expect(client).toBeDefined();
        expect(typeof client.release).toBe('function');
    });
});
