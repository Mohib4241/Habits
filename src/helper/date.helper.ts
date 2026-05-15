/**
 * Reusable helper utility to handle string dates formats and ranges.
 */

/**
 * Format a Date object to YYYY-MM-DD string.
 */
export const formatDateToYMD = (date: Date): string => {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

/**
 * Get current date string in YYYY-MM-DD format.
 */
export const getCurrentDateYMD = (): string => {
    return formatDateToYMD(new Date());
};

/**
 * Get date string for N days ago in YYYY-MM-DD format.
 */
export const getDateNDaysAgoYMD = (days: number): string => {
    const date = new Date();
    date.setUTCDate(date.getUTCDate() - days);
    return formatDateToYMD(date);
};
