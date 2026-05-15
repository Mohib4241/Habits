import { IStreakStats } from '../types/tracking.types';

/**
 * Helper to compute streak statistics from an array of date strings (YYYY-MM-DD).
 */
export const calculateStreakStats = (dateStrings: string[]): IStreakStats => {
    if (!dateStrings || dateStrings.length === 0) {
        return {
            currentStreak: 0,
            longestStreak: 0,
            totalCompletions: 0,
        };
    }

    // Deduplicate and sort dates descending
    const uniqueDates = Array.from(new Set(dateStrings)).sort((a, b) => b.localeCompare(a));
    const totalCompletions = uniqueDates.length;

    // Convert string dates to epoch days
    const getDayNumber = (ds: string): number => {
        // Parse YYYY-MM-DD as UTC to avoid timezone shift inconsistencies
        const [year, month, day] = ds.split('-').map(Number);
        const date = new Date(Date.UTC(year, month - 1, day));
        return Math.floor(date.getTime() / (1000 * 60 * 60 * 24));
    };

    const days = uniqueDates.map(getDayNumber);

    // Calculate today's day number in UTC
    const now = new Date();
    const todayDay = Math.floor(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) / (1000 * 60 * 60 * 24));

    let currentStreak = 0;
    // Check if the latest completed date is either today or yesterday
    if (days[0] === todayDay || days[0] === todayDay - 1) {
        currentStreak = 1;
        let expectedNextDay = days[0] - 1;
        for (let i = 1; i < days.length; i++) {
            if (days[i] === expectedNextDay) {
                currentStreak++;
                expectedNextDay--;
            } else {
                break;
            }
        }
    }

    // Calculate longest streak
    let longestStreak = 0;
    let tempStreak = 0;
    let prevDay: number | null = null;

    // Iterate ascending from oldest to newest to find max contiguous range
    const daysAsc = [...days].reverse();
    for (const d of daysAsc) {
        if (prevDay === null) {
            tempStreak = 1;
        } else if (d === prevDay + 1) {
            tempStreak++;
        } else {
            tempStreak = 1;
        }
        if (tempStreak > longestStreak) {
            longestStreak = tempStreak;
        }
        prevDay = d;
    }

    return {
        currentStreak,
        longestStreak,
        totalCompletions,
    };
};
