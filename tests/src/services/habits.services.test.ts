/**
 * ============================================================
 * SERVICES — HabitsService Unit Tests
 * ============================================================
 */

jest.mock('../../../src/utility/queryExecutor');
jest.mock('../../../src/utility/Redis');

import { HabitsService } from '../../../src/services/habits.services';
import { executeQuery, executeSingleQuery } from '../../../src/utility/queryExecutor';
import { getCache, setCache, deleteCache } from '../../../src/utility/Redis';

const mockExecuteQuery       = executeQuery       as jest.Mock;
const mockExecuteSingleQuery = executeSingleQuery as jest.Mock;
const mockGetCache           = getCache           as jest.Mock;
const mockSetCache           = setCache           as jest.Mock;
const mockDeleteCache        = deleteCache        as jest.Mock;

const MOCK_HABIT = {
    id: 1, user_id: 10, title: 'Morning Run',
    description: 'Run 5km', frequency: 'daily',
    reminder_time: '07:00', tags: ['health'],
    created_at: new Date(), updated_at: new Date(),
};

beforeEach(() => {
    jest.clearAllMocks();
});

// ── createHabit ───────────────────────────────────────────────────────────────

describe('HabitsService.createHabit', () => {

    it('inserts a habit and returns created object', async () => {
        mockExecuteSingleQuery.mockResolvedValueOnce(MOCK_HABIT);
        mockDeleteCache.mockResolvedValue(undefined);

        const result = await HabitsService.createHabit(10, {
            title: 'Morning Run', frequency: 'daily',
        });

        expect(result).toMatchObject({ title: 'Morning Run' });
        expect(mockExecuteSingleQuery).toHaveBeenCalledTimes(1);
    });

    it('throws error when INSERT returns null', async () => {
        mockExecuteSingleQuery.mockResolvedValueOnce(null);
        mockDeleteCache.mockResolvedValue(undefined);

        await expect(HabitsService.createHabit(10, { title: 'Test' }))
            .rejects.toThrow('Failed to create new habit instance');
    });

    it('invalidates cache after creation', async () => {
        mockExecuteSingleQuery.mockResolvedValueOnce(MOCK_HABIT);
        mockDeleteCache.mockResolvedValue(undefined);

        await HabitsService.createHabit(10, { title: 'Morning Run' });

        expect(mockDeleteCache).toHaveBeenCalled();
    });

    it('uses null for optional fields when not provided', async () => {
        mockExecuteSingleQuery.mockResolvedValueOnce(MOCK_HABIT);
        mockDeleteCache.mockResolvedValue(undefined);

        await HabitsService.createHabit(10, { title: 'Minimal Habit' });

        const callArgs = mockExecuteSingleQuery.mock.calls[0][1];
        expect(callArgs[2]).toBeNull(); // description
        expect(callArgs[4]).toBeNull(); // reminder_time
    });
});

// ── getHabits ─────────────────────────────────────────────────────────────────

describe('HabitsService.getHabits', () => {

    it('returns cached data when Redis hit occurs', async () => {
        const cachedPayload = { meta: { totalItems: 1 }, habits: [MOCK_HABIT] };
        mockGetCache.mockResolvedValueOnce(JSON.stringify(cachedPayload));

        const result = await HabitsService.getHabits(10, { page: 1, limit: 10 });

        // Parse back from JSON since Redis stores JSON strings
        expect(result.meta.totalItems).toBe(cachedPayload.meta.totalItems);
        expect(result.habits).toHaveLength(1);
        expect(mockExecuteQuery).not.toHaveBeenCalled();
    });

    it('queries DB on cache miss and caches result', async () => {
        mockGetCache.mockResolvedValueOnce(null); // cache miss
        mockExecuteSingleQuery.mockResolvedValueOnce({ total: '3' }); // count
        mockExecuteQuery.mockResolvedValueOnce([MOCK_HABIT]);          // rows
        mockSetCache.mockResolvedValue(undefined);

        const result = await HabitsService.getHabits(10, { page: 1, limit: 10 });

        expect(result.habits).toHaveLength(1);
        expect(mockSetCache).toHaveBeenCalled();
    });

    it('returns empty habits when no records exist', async () => {
        mockGetCache.mockResolvedValueOnce(null);
        mockExecuteSingleQuery.mockResolvedValueOnce({ total: '0' });
        mockExecuteQuery.mockResolvedValueOnce([]);
        mockSetCache.mockResolvedValue(undefined);

        const result = await HabitsService.getHabits(10, { page: 1, limit: 10 });

        expect(result.habits).toHaveLength(0);
        expect(result.meta.totalItems).toBe(0);
    });

    it('adds tag filter to query when tag param provided', async () => {
        mockGetCache.mockResolvedValueOnce(null);
        mockExecuteSingleQuery.mockResolvedValueOnce({ total: '1' });
        mockExecuteQuery.mockResolvedValueOnce([MOCK_HABIT]);
        mockSetCache.mockResolvedValue(undefined);

        await HabitsService.getHabits(10, { page: 1, limit: 10, tag: 'health' });

        // The first call to executeSingleQuery is the COUNT query
        const countQuery = mockExecuteSingleQuery.mock.calls[0][0] as string;
        expect(countQuery).toContain('ANY(tags)');
    });

    it('returns correct pagination meta', async () => {
        mockGetCache.mockResolvedValueOnce(null);
        mockExecuteSingleQuery.mockResolvedValueOnce({ total: '25' });
        mockExecuteQuery.mockResolvedValueOnce(Array(10).fill(MOCK_HABIT));
        mockSetCache.mockResolvedValue(undefined);

        const result = await HabitsService.getHabits(10, { page: 1, limit: 10 });

        expect(result.meta.totalItems).toBe(25);
        expect(result.meta.totalPages).toBe(3);
        expect(result.meta.hasNextPage).toBe(true);
        expect(result.meta.hasPrevPage).toBe(false);
    });
});

// ── getHabitById ──────────────────────────────────────────────────────────────

describe('HabitsService.getHabitById', () => {

    it('returns habit when found', async () => {
        mockExecuteSingleQuery.mockResolvedValueOnce(MOCK_HABIT);
        const result = await HabitsService.getHabitById(10, 1);
        expect(result).toEqual(MOCK_HABIT);
    });

    it('throws 404 when habit not found', async () => {
        mockExecuteSingleQuery.mockResolvedValueOnce(null);
        await expect(HabitsService.getHabitById(10, 999))
            .rejects.toMatchObject({ statusCode: 404 });
    });

    it('uses both userId and habitId in query (ownership check)', async () => {
        mockExecuteSingleQuery.mockResolvedValueOnce(MOCK_HABIT);
        await HabitsService.getHabitById(10, 1);
        const params = mockExecuteSingleQuery.mock.calls[0][1];
        expect(params).toContain(10);
        expect(params).toContain(1);
    });
});

// ── updateHabit ───────────────────────────────────────────────────────────────

describe('HabitsService.updateHabit', () => {

    it('throws 400 when no fields are provided', async () => {
        mockExecuteSingleQuery.mockResolvedValueOnce(MOCK_HABIT); // getHabitById
        await expect(HabitsService.updateHabit(10, 1, {}))
            .rejects.toMatchObject({ statusCode: 400 });
    });

    it('updates habit and returns updated record', async () => {
        const updatedHabit = { ...MOCK_HABIT, title: 'Evening Run' };
        mockExecuteSingleQuery
            .mockResolvedValueOnce(MOCK_HABIT)      // getHabitById
            .mockResolvedValueOnce(updatedHabit);   // UPDATE
        mockDeleteCache.mockResolvedValue(undefined);

        const result = await HabitsService.updateHabit(10, 1, { title: 'Evening Run' });

        expect(result.title).toBe('Evening Run');
    });

    it('throws error when UPDATE returns null', async () => {
        mockExecuteSingleQuery
            .mockResolvedValueOnce(MOCK_HABIT) // getHabitById
            .mockResolvedValueOnce(null);      // UPDATE returns null
        mockDeleteCache.mockResolvedValue(undefined);

        await expect(HabitsService.updateHabit(10, 1, { title: 'New Title' }))
            .rejects.toThrow('Failed to apply updates to habit entity');
    });

    it('invalidates cache after update', async () => {
        mockExecuteSingleQuery
            .mockResolvedValueOnce(MOCK_HABIT)
            .mockResolvedValueOnce({ ...MOCK_HABIT, title: 'Updated' });
        mockDeleteCache.mockResolvedValue(undefined);

        await HabitsService.updateHabit(10, 1, { title: 'Updated' });

        expect(mockDeleteCache).toHaveBeenCalled();
    });
});

// ── deleteHabit ───────────────────────────────────────────────────────────────

describe('HabitsService.deleteHabit', () => {

    it('deletes habit successfully', async () => {
        mockExecuteSingleQuery.mockResolvedValueOnce(MOCK_HABIT); // getHabitById
        mockExecuteQuery.mockResolvedValueOnce([]);                // DELETE
        mockDeleteCache.mockResolvedValue(undefined);

        await expect(HabitsService.deleteHabit(10, 1)).resolves.toBeUndefined();
    });

    it('throws 404 when habit not found (via getHabitById)', async () => {
        mockExecuteSingleQuery.mockResolvedValueOnce(null); // not found

        await expect(HabitsService.deleteHabit(10, 999))
            .rejects.toMatchObject({ statusCode: 404 });
    });

    it('invalidates cache after deletion', async () => {
        mockExecuteSingleQuery.mockResolvedValueOnce(MOCK_HABIT);
        mockExecuteQuery.mockResolvedValueOnce([]);
        mockDeleteCache.mockResolvedValue(undefined);

        await HabitsService.deleteHabit(10, 1);

        expect(mockDeleteCache).toHaveBeenCalled();
    });
});
