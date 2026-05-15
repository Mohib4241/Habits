/**
 * ============================================================
 * HELPERS — Streak Logic Unit Tests
 * ============================================================
 */

import { calculateStreakStats } from '../../../src/helper/streak.helper';

describe('calculateStreakStats', () => {

    // ── Empty / null guards ───────────────────────────────────────────────────

    it('returns zero stats for empty array', () => {
        const result = calculateStreakStats([]);
        expect(result).toEqual({ currentStreak: 0, longestStreak: 0, totalCompletions: 0 });
    });

    it('returns zero stats for null-like input', () => {
        const result = calculateStreakStats(null as any);
        expect(result).toEqual({ currentStreak: 0, longestStreak: 0, totalCompletions: 0 });
    });

    // ── Single entry ──────────────────────────────────────────────────────────

    it('returns streak of 1 for a single entry that is today', () => {
        const today = getTodayYMD();
        const result = calculateStreakStats([today]);
        expect(result.currentStreak).toBe(1);
        expect(result.longestStreak).toBe(1);
        expect(result.totalCompletions).toBe(1);
    });

    it('returns streak of 1 for a single entry that is yesterday', () => {
        const yesterday = getOffsetDateYMD(-1);
        const result = calculateStreakStats([yesterday]);
        expect(result.currentStreak).toBe(1);
        expect(result.longestStreak).toBe(1);
    });

    it('returns current streak of 0 for an old single entry (2 days ago)', () => {
        const twoDaysAgo = getOffsetDateYMD(-2);
        const result = calculateStreakStats([twoDaysAgo]);
        expect(result.currentStreak).toBe(0);
        expect(result.longestStreak).toBe(1);
        expect(result.totalCompletions).toBe(1);
    });

    // ── Consecutive streaks ───────────────────────────────────────────────────

    it('correctly calculates a 5-day consecutive streak ending today', () => {
        const dates = [
            getTodayYMD(),
            getOffsetDateYMD(-1),
            getOffsetDateYMD(-2),
            getOffsetDateYMD(-3),
            getOffsetDateYMD(-4),
        ];
        const result = calculateStreakStats(dates);
        expect(result.currentStreak).toBe(5);
        expect(result.longestStreak).toBe(5);
        expect(result.totalCompletions).toBe(5);
    });

    it('calculates 3-day current streak when there is a gap earlier', () => {
        const dates = [
            getTodayYMD(),
            getOffsetDateYMD(-1),
            getOffsetDateYMD(-2),
            getOffsetDateYMD(-10), // gap
            getOffsetDateYMD(-11),
            getOffsetDateYMD(-12),
        ];
        const result = calculateStreakStats(dates);
        expect(result.currentStreak).toBe(3);
        expect(result.longestStreak).toBe(3);
        expect(result.totalCompletions).toBe(6);
    });

    it('breaks streak correctly when last entry is 2+ days ago', () => {
        const dates = [
            getOffsetDateYMD(-2),
            getOffsetDateYMD(-3),
            getOffsetDateYMD(-4),
        ];
        const result = calculateStreakStats(dates);
        expect(result.currentStreak).toBe(0);
        expect(result.longestStreak).toBe(3);
    });

    // ── Longest streak vs current streak ─────────────────────────────────────

    it('finds longest streak even when current streak is shorter', () => {
        const dates = [
            getTodayYMD(),
            // gap
            getOffsetDateYMD(-10),
            getOffsetDateYMD(-11),
            getOffsetDateYMD(-12),
            getOffsetDateYMD(-13),
            getOffsetDateYMD(-14),
        ];
        const result = calculateStreakStats(dates);
        expect(result.currentStreak).toBe(1);
        expect(result.longestStreak).toBe(5);
    });

    // ── Deduplication ─────────────────────────────────────────────────────────

    it('deduplicates repeated dates before calculating', () => {
        const today = getTodayYMD();
        const dates = [today, today, today];
        const result = calculateStreakStats(dates);
        expect(result.totalCompletions).toBe(1);
        expect(result.currentStreak).toBe(1);
    });

    // ── Unsorted input ────────────────────────────────────────────────────────

    it('handles unsorted input dates correctly', () => {
        const dates = [
            getOffsetDateYMD(-2),
            getTodayYMD(),
            getOffsetDateYMD(-1),
        ];
        const result = calculateStreakStats(dates);
        expect(result.currentStreak).toBe(3);
        expect(result.longestStreak).toBe(3);
    });
});

// ── Date helpers ──────────────────────────────────────────────────────────────

function getTodayYMD(): string {
    const now = new Date();
    return `${now.getUTCFullYear()}-${pad(now.getUTCMonth() + 1)}-${pad(now.getUTCDate())}`;
}

function getOffsetDateYMD(offsetDays: number): string {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() + offsetDays);
    return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

function pad(n: number): string {
    return String(n).padStart(2, '0');
}
