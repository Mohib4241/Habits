/**
 * ============================================================
 * DATABASE — queryExecutor Unit Tests
 * ============================================================
 */

// Must mock postgreConnection BEFORE importing queryExecutor
jest.mock('../../../src/utility/postgreConnection');

import { getDbPool } from '../../../src/utility/postgreConnection';
import { executeQuery, executeSingleQuery } from '../../../src/utility/queryExecutor';

// After jest.mock(), getDbPool is already auto-mocked — set up the default
const mockGetDbPool = getDbPool as jest.MockedFunction<typeof getDbPool>;

const makeMockPool = (rows: any[] = [], rejectWith?: Error) => {
    const queryFn = rejectWith
        ? jest.fn().mockRejectedValue(rejectWith)
        : jest.fn().mockResolvedValue({ rows });

    return {
        query:   queryFn,
        connect: jest.fn().mockResolvedValue({ release: jest.fn() }),
        end:     jest.fn(),
        on:      jest.fn(),
    } as any;
};

describe('executeQuery', () => {

    it('calls pool.query with correct SQL and params', async () => {
        const pool = makeMockPool([{ id: 1 }]);
        mockGetDbPool.mockReturnValue(pool);

        await executeQuery('SELECT * FROM users WHERE id = $1', [1]);

        expect(pool.query).toHaveBeenCalledWith('SELECT * FROM users WHERE id = $1', [1]);
    });

    it('returns array of row objects', async () => {
        const rows = [{ id: 1, email: 'a@b.com' }, { id: 2, email: 'c@d.com' }];
        mockGetDbPool.mockReturnValue(makeMockPool(rows));

        const result = await executeQuery<{ id: number; email: string }>('SELECT * FROM users', []);
        expect(result).toHaveLength(2);
        expect(result[0].email).toBe('a@b.com');
    });

    it('returns empty array when no rows found', async () => {
        mockGetDbPool.mockReturnValue(makeMockPool([]));

        const result = await executeQuery('SELECT * FROM users WHERE 1=0', []);
        expect(result).toEqual([]);
    });

    it('propagates database errors to caller', async () => {
        const dbError = new Error('connection timeout');
        mockGetDbPool.mockReturnValue(makeMockPool([], dbError));

        await expect(executeQuery('SELECT 1', [])).rejects.toThrow('connection timeout');
    });

    it('calls pool.query without params when none provided', async () => {
        const pool = makeMockPool([]);
        mockGetDbPool.mockReturnValue(pool);

        await executeQuery('SELECT 1');

        expect(pool.query).toHaveBeenCalledWith('SELECT 1', undefined);
    });
});

describe('executeSingleQuery', () => {

    it('returns first row when rows exist', async () => {
        const rows = [{ id: 42, email: 'single@test.com' }, { id: 99 }];
        mockGetDbPool.mockReturnValue(makeMockPool(rows));

        const result = await executeSingleQuery<{ id: number; email: string }>('SELECT * FROM users', []);
        expect(result).toBeDefined();
        expect(result!.id).toBe(42);
    });

    it('returns null when no rows found', async () => {
        mockGetDbPool.mockReturnValue(makeMockPool([]));

        const result = await executeSingleQuery('SELECT * FROM users WHERE id = $1', [9999]);
        expect(result).toBeNull();
    });

    it('does not return second row even if multiple exist', async () => {
        const rows = [{ id: 1 }, { id: 2 }, { id: 3 }];
        mockGetDbPool.mockReturnValue(makeMockPool(rows));

        const result = await executeSingleQuery<{ id: number }>('SELECT * FROM users', []);
        expect(result!.id).toBe(1);
    });

    it('propagates errors from executeQuery', async () => {
        mockGetDbPool.mockReturnValue(makeMockPool([], new Error('DB error')));

        await expect(executeSingleQuery('SELECT 1', [])).rejects.toThrow('DB error');
    });
});
